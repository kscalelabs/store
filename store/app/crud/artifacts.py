"""Defines CRUD interface for handling user-uploaded artifacts."""

import asyncio
import io
import logging
from typing import Any, BinaryIO, Literal
from xml.etree import ElementTree as ET

from PIL import Image
from stl import Mode as STLMode, mesh as stlmesh

from store.app.crud.base import BaseCrud, ItemNotFoundError
from store.app.errors import BadArtifactError, NotAuthorizedError
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


class ArtifactsCrud(BaseCrud):
    @classmethod
    def get_gsis(cls) -> set[str]:
        return super().get_gsis().union({"user_id", "listing_id"})

    async def _crop_image(self, image: Image.Image, size: tuple[int, int]) -> io.BytesIO:
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

    async def _upload_cropped_image(self, image: Image.Image, name: str, image_id: str, size: ArtifactSize) -> None:
        image_bytes = await self._crop_image(image, SizeMapping[size])
        filename = get_artifact_name(image_id, "image", size)
        await self._upload_to_s3(image_bytes, name, filename, "image/png")

    async def _upload_image(
        self,
        name: str,
        file: io.BytesIO | BinaryIO,
        listing: Listing,
        user_id: str,
        description: str | None = None,
    ) -> Artifact:
        if listing.user_id != user_id:
            raise NotAuthorizedError("User does not have permission to upload artifacts to this listing")
        artifact = Artifact.create(
            user_id=user_id,
            listing_id=listing.id,
            name=name,
            artifact_type="image",
            sizes=list(SizeMapping.keys()),
            description=description,
        )

        image = Image.open(file)

        await asyncio.gather(
            *(
                self._upload_cropped_image(
                    image=image,
                    name=name,
                    image_id=artifact.id,
                    size=size,
                )
                for size in SizeMapping.keys()
            ),
            self._add_item(artifact),
        )
        return artifact

    async def get_raw_artifact(self, artifact_id: str) -> Artifact | None:
        return await self._get_item(artifact_id, Artifact)

    async def _upload_stl(
        self,
        name: str,
        file: io.BytesIO | BinaryIO,
        listing: Listing,
        user_id: str,
        description: str | None = None,
    ) -> Artifact:
        if listing.user_id != user_id:
            raise NotAuthorizedError("User does not have permission to upload artifacts to this listing")

        # Converts the mesh to a binary STL file.
        mesh = stlmesh.Mesh.from_file(None, calculate_normals=True, fh=file)
        out_file = io.BytesIO()
        mesh.save(name, fh=out_file, mode=STLMode.BINARY)
        out_file.seek(0)

        # Saves the artifact to S3.
        content_type = get_content_type("stl")
        artifact = Artifact.create(
            user_id=user_id,
            listing_id=listing.id,
            name=name,
            artifact_type="stl",
            description=description,
        )
        await asyncio.gather(
            self._upload_to_s3(out_file, name, get_artifact_name(artifact.id, "stl"), content_type),
            self._add_item(artifact),
        )
        return artifact

    async def _upload_xml(
        self,
        name: str,
        file: io.BytesIO | BinaryIO,
        listing: Listing,
        user_id: str,
        artifact_type: Literal["urdf", "mjcf"],
        description: str | None = None,
    ) -> Artifact:
        if listing.user_id != user_id:
            raise NotAuthorizedError("User does not have permission to upload artifacts to this listing")

        # Standardizes the XML file.
        try:
            tree = ET.parse(file)
        except Exception:
            raise BadArtifactError("Invalid XML file")

        # TODO: Remap the STL or OBJ file paths.

        # Converts to byte stream.
        out_file = io.BytesIO()
        save_xml(out_file, tree)
        out_file.seek(0)

        # Saves the artifact to S3.
        content_type = get_content_type(artifact_type)
        artifact = Artifact.create(
            user_id=user_id,
            listing_id=listing.id,
            name=name,
            artifact_type=artifact_type,
            description=description,
        )
        await asyncio.gather(
            self._upload_to_s3(file, name, get_artifact_name(artifact.id, artifact_type), content_type),
            self._add_item(artifact),
        )
        return artifact

    async def upload_artifact(
        self,
        name: str,
        file: io.BytesIO | BinaryIO,
        listing: Listing,
        user_id: str,
        artifact_type: ArtifactType,
        description: str | None = None,
    ) -> Artifact:
        match artifact_type:
            case "image":
                return await self._upload_image(name, file, listing, user_id, description)
            case "stl":
                return await self._upload_stl(name, file, listing, user_id, description)
            case "urdf" | "mjcf":
                return await self._upload_xml(name, file, listing, user_id, artifact_type, description)
            case _:
                raise BadArtifactError(f"Invalid artifact type: {artifact_type}")

    async def _remove_image(self, artifact: Artifact, user_id: str) -> None:
        if artifact.user_id != user_id:
            raise NotAuthorizedError("User does not have permission to delete this image")
        await asyncio.gather(
            *(self._delete_from_s3(get_artifact_name(artifact.id, "image", size)) for size in SizeMapping.keys()),
            self._delete_item(artifact),
        )

    async def _remove_raw_artifact(
        self,
        artifact: Artifact,
        artifact_type: Literal["urdf", "mjcf", "stl"],
        user_id: str,
    ) -> None:
        if artifact.user_id != user_id:
            raise NotAuthorizedError("User does not have permission to delete this artifact")
        await asyncio.gather(
            self._delete_from_s3(get_artifact_name(artifact.id, artifact_type)),
            self._delete_item(artifact),
        )

    async def remove_artifact(self, artifact: Artifact, user_id: str) -> None:
        match artifact.artifact_type:
            case "image":
                await self._remove_image(artifact, user_id)
            case _:
                await self._remove_raw_artifact(artifact, artifact.artifact_type, user_id)

    async def get_listing_artifacts(self, listing_id: str) -> list[Artifact]:
        return await self._get_items_from_secondary_index("listing_id", listing_id, Artifact)

    async def get_listings_artifacts(self, listing_ids: list[str]) -> list[list[Artifact]]:
        return await self._get_items_from_secondary_index_batch("listing_id", listing_ids, Artifact)

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
