"""Defines CRUD interface for handling user-uploaded artifacts."""

import asyncio
import io
import logging
from typing import IO, Any, Literal
from xml.etree import ElementTree as ET

import trimesh
from boto3.dynamodb.conditions import ComparisonCondition
from fastapi import UploadFile
from PIL import Image

from store.app.crud.base import BaseCrud, ItemNotFoundError
from store.app.errors import BadArtifactError
from store.app.model import (
    Artifact,
    ArtifactSize,
    ArtifactType,
    Listing,
    SizeMapping,
    get_artifact_name,
    get_content_type,
)
from store.settings import settings
from store.utils import save_xml

logger = logging.getLogger(__name__)

MESH_SAVE_TYPE = "stl"


class ArtifactsCrud(BaseCrud):
    @classmethod
    def get_gsis(cls) -> set[str]:
        return super().get_gsis().union({"user_id", "listing_id", "name"})

    async def _crop_image(self, image: Image.Image, size: tuple[int, int]) -> IO[bytes]:
        # Simply squashes the image to the desired size.
        # image_resized = image.resize(size, resample=Image.Resampling.BICUBIC)
        # Finds a bounding box of the image and crops it to the desired size.
        image_ratio, size_ratio = image.width / image.height, size[0] / size[1]
        if image_ratio > size_ratio:
            new_width = int(image.height * size_ratio)
            new_height = image.height
            left = (image.width - new_width) // 2
            upper = 0
        else:
            new_width = image.width
            new_height = int(image.width / size_ratio)
            left = 0
            upper = (image.height - new_height) // 2
        right = left + new_width
        lower = upper + new_height
        image = image.crop((left, upper, right, lower))

        # Resize the image to the desired size.
        image = image.resize(size, resample=Image.Resampling.BICUBIC)

        # Save the image to a byte stream.
        image_bytes = io.BytesIO()
        image.save(image_bytes, format="PNG", optimize=True, quality=settings.artifact.quality)
        image_bytes.seek(0)
        return image_bytes

    async def _upload_cropped_image(self, image: Image.Image, artifact: Artifact, size: ArtifactSize) -> None:
        image_bytes = await self._crop_image(image, SizeMapping[size])
        filename = get_artifact_name(artifact=artifact, size=size)
        await self._upload_to_s3(image_bytes, artifact.name, filename, "image/png")

    async def _upload_image(
        self,
        name: str,
        file: UploadFile,
        listing: Listing,
        description: str | None = None,
    ) -> Artifact:
        artifact = Artifact.create(
            user_id=listing.user_id,
            listing_id=listing.id,
            name=name,
            artifact_type="image",
            sizes=list(SizeMapping.keys()),
            description=description,
        )

        image = Image.open(io.BytesIO(await file.read()))

        await asyncio.gather(
            *(self._upload_cropped_image(image=image, artifact=artifact, size=size) for size in SizeMapping.keys()),
            self._add_item(artifact),
        )
        return artifact

    async def get_raw_artifact(self, artifact_id: str) -> Artifact | None:
        return await self._get_item(artifact_id, Artifact)

    async def _upload_mesh(
        self,
        name: str,
        file: UploadFile,
        listing: Listing,
        artifact_type: Literal["stl", "obj", "ply", "dae"],
        description: str | None = None,
    ) -> Artifact:
        # Converts the mesh to a binary STL file.
        file_data = await file.read()

        tmesh = trimesh.load(io.BytesIO(file_data), file_type=artifact_type)
        if not isinstance(tmesh, trimesh.Trimesh):
            raise BadArtifactError(f"Invalid mesh file: {name}")
        out_file = io.BytesIO()
        tmesh.export(out_file, file_type=MESH_SAVE_TYPE)
        out_file.seek(0)

        # Replaces name suffix.
        name = f"{name.rsplit('.', 1)[0]}.{MESH_SAVE_TYPE}"

        # Saves the artifact to S3.
        artifact = await self._upload_and_store(name, out_file, listing, "stl", description)

        # Closes the file handlers when done.
        out_file.close()

        return artifact

    async def _upload_xml(
        self,
        name: str,
        file: UploadFile,
        listing: Listing,
        artifact_type: Literal["urdf", "mjcf"],
        description: str | None = None,
    ) -> Artifact:
        # Standardizes the XML file.
        try:
            tree = ET.parse(io.BytesIO(await file.read()))
        except Exception:
            raise BadArtifactError("Invalid XML file")

        # TODO: Remap the STL or OBJ file paths.

        # Converts to byte stream.
        out_file = io.BytesIO()
        save_xml(out_file, tree)
        out_file.seek(0)

        # Saves the artifact to S3.
        return await self._upload_and_store(name, out_file, listing, artifact_type, description)

    async def _upload_and_store(
        self,
        name: str,
        file: IO[bytes],
        listing: Listing,
        artifact_type: ArtifactType,
        description: str | None = None,
    ) -> Artifact:
        content_type = get_content_type(artifact_type)
        artifact = Artifact.create(
            user_id=listing.user_id,
            listing_id=listing.id,
            name=name,
            artifact_type=artifact_type,
            description=description,
        )
        await asyncio.gather(
            self._upload_to_s3(file, name, get_artifact_name(artifact=artifact), content_type),
            self._add_item(artifact),
        )
        return artifact

    async def upload_artifact(
        self,
        name: str,
        file: UploadFile,
        listing: Listing,
        artifact_type: ArtifactType,
        description: str | None = None,
    ) -> tuple[Artifact, bool]:
        listing_artifacts = await self.get_listing_artifacts(listing.id)
        matching_artifact = next((a for a in listing_artifacts if a.name == name), None)
        if matching_artifact is not None:
            # raise BadArtifactError(f"An artifact with the name '{name}' already exists for this listing")
            return matching_artifact, False

        match artifact_type:
            case "image":
                return await self._upload_image(name, file, listing, description), True
            case "stl" | "obj" | "ply" | "dae":
                return await self._upload_mesh(name, file, listing, artifact_type, description), True
            case "urdf" | "mjcf":
                return await self._upload_xml(name, file, listing, artifact_type, description), True
            case _:
                raise BadArtifactError(f"Invalid artifact type: {artifact_type}")

    async def _remove_image(self, artifact: Artifact) -> None:
        await asyncio.gather(
            *(self._delete_from_s3(get_artifact_name(artifact=artifact, size=size)) for size in SizeMapping.keys()),
            self._delete_item(artifact),
        )

    async def _remove_raw_artifact(self, artifact: Artifact) -> None:
        await asyncio.gather(
            self._delete_from_s3(get_artifact_name(artifact=artifact)),
            self._delete_item(artifact),
        )

    async def remove_artifact(self, artifact: Artifact) -> None:
        match artifact.artifact_type:
            case "image":
                await self._remove_image(artifact)
            case _:
                await self._remove_raw_artifact(artifact)

    async def get_listing_artifacts(
        self,
        listing_id: str,
        additional_filter_expression: ComparisonCondition | None = None,
    ) -> list[Artifact]:
        artifacts = await self._get_items_from_secondary_index(
            "listing_id",
            listing_id,
            Artifact,
            additional_filter_expression=additional_filter_expression,
        )
        return sorted(artifacts, key=lambda a: a.timestamp)

    async def get_listings_artifacts(self, listing_ids: list[str]) -> list[list[Artifact]]:
        artifact_chunks = await self._get_items_from_secondary_index_batch("listing_id", listing_ids, Artifact)
        return [sorted(artifacts, key=lambda a: a.timestamp) for artifacts in artifact_chunks]

    async def edit_artifact(
        self,
        artifact_id: str,
        name: str | None = None,
        description: str | None = None,
    ) -> None:
        artifact = await self.get_raw_artifact(artifact_id)
        if artifact is None:
            raise ItemNotFoundError("Artifact not found")
        artifact_updates: dict[str, Any] = {}  # noqa: ANN401
        if name is not None:
            artifact_updates["name"] = name
        if description is not None:
            artifact_updates["description"] = description
        if artifact_updates:
            await self._update_item(artifact_id, Artifact, artifact_updates)
