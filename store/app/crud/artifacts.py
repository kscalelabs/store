"""Defines CRUD interface for handling user-uploaded artifacts."""

import asyncio
import io
import logging
from typing import BinaryIO

from PIL import Image

from store.app.crud.base import BaseCrud
from store.app.model import Artifact, ArtifactSize
from store.settings import settings

logger = logging.getLogger(__name__)

SizeMapping: dict[ArtifactSize, tuple[int, int]] = {
    "large": settings.image.large_size,
    "small": settings.image.small_size,
}


def get_image_name(image_id: str, size: ArtifactSize) -> str:
    height, width = SizeMapping[size]
    return f"{image_id}_{size}_{height}x{width}.png"


class ArtifactsCrud(BaseCrud):
    @classmethod
    def get_gsis(cls) -> set[str]:
        return super().get_gsis().union({"user_id"})

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
        name = get_image_name(image_id, size)
        await self._upload_to_s3(image_bytes, name, "image/png")

    async def upload_image(
        self,
        image: Image.Image,
        user_id: str,
        description: str | None = None,
    ) -> Artifact:
        artifact = Artifact.create(
            user_id=user_id,
            artifact_type="image",
            sizes=list(SizeMapping.keys()),
            description=description,
        )
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

    async def upload_urdf(
        self,
        file: io.BytesIO | BinaryIO,
        user_id: str,
        description: str | None = None,
    ) -> Artifact:
        artifact = Artifact.create(
            user_id=user_id,
            artifact_type="urdf",
            description=description,
        )
        await asyncio.gather(
            self._upload_to_s3(file, artifact.id, "text/xml"),
            self._add_item(artifact),
        )
        return artifact

    async def upload_mjcf(
        self,
        file: io.BytesIO | BinaryIO,
        user_id: str,
        description: str | None = None,
    ) -> Artifact:
        artifact = Artifact.create(
            user_id=user_id,
            artifact_type="urdf",
            description=description,
        )
        await asyncio.gather(
            self._upload_to_s3(file, artifact.id, "text/xml"),
            self._add_item(artifact),
        )
        return artifact
