"""Defines CRUD interface for handling user-uploaded artifacts."""

import asyncio
import io
import logging
from typing import BinaryIO, Literal

from PIL import Image

from store.app.crud.base import BaseCrud
from store.app.errors import NotAuthorizedError
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

logger = logging.getLogger(__name__)


class ArtifactsCrud(BaseCrud):
    @classmethod
    def get_gsis(cls) -> set[str]:
        return super().get_gsis().union({"user_id", "listing_id"})

    def _crop_image(self, image: Image.Image, size: tuple[int, int]) -> io.BytesIO:
        image_bytes = io.BytesIO()

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
        image_resized = image.crop((left, upper, right, lower))

        image_resized.save(image_bytes, format="PNG", optimize=True, quality=settings.image.quality)
        image_bytes.seek(0)
        return image_bytes

    async def _upload_cropped_image(self, image: Image.Image, image_id: str, size: ArtifactSize) -> None:
        image_bytes = self._crop_image(image, SizeMapping[size])
        name = get_artifact_name(image_id, "image", size)
        await self._upload_to_s3(image_bytes, name, "image/png")

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

    async def _upload_raw_artifact(
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
        content_type = get_content_type(artifact_type)
        artifact = Artifact.create(
            user_id=user_id,
            listing_id=listing.id,
            name=name,
            artifact_type=artifact_type,
            description=description,
        )
        await asyncio.gather(
            self._upload_to_s3(file, get_artifact_name(artifact.id, artifact_type), content_type),
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
            case _:
                return await self._upload_raw_artifact(name, file, listing, user_id, artifact_type, description)

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
        artifact_type: Literal["urdf", "mjcf"],
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
