"""Defines CRUD interface for handling kernel images."""

import io
import logging

from fastapi import UploadFile

from store.app.crud.base import TABLE_NAME, BaseCrud
from store.app.model import KernelImage, User

logger = logging.getLogger(__name__)


class KernelImagesCrud(BaseCrud):
    async def upload_kernel_image(
        self,
        name: str,
        file: UploadFile,
        user: User,
        description: str | None = None,
        is_public: bool = False,
        is_official: bool = False,
    ) -> KernelImage:
        file_data = await file.read()
        size = len(file_data)

        kernel_image = KernelImage.create(
            user_id=user.id,
            name=name,
            size=size,
            description=description,
            is_public=is_public,
            is_official=is_official,
        )

        s3_filename = f"{kernel_image.id}/{name}"

        await self._upload_to_s3(
            data=io.BytesIO(file_data),
            name=name,
            filename=s3_filename,
            content_type="application/octet-stream",
        )
        await self._add_item(kernel_image)
        return kernel_image

    async def get_kernel_image(self, kernel_image_id: str) -> KernelImage | None:
        return await self._get_item(kernel_image_id, KernelImage)

    async def update_kernel_image(
        self,
        kernel_image_id: str,
        name: str | None = None,
        description: str | None = None,
        is_public: bool | None = None,
        is_official: bool | None = None,
    ) -> None:
        updates = {}
        if name is not None:
            updates["name"] = name
        if description is not None:
            updates["description"] = description
        if is_public is not None:
            updates["is_public"] = is_public
        if is_official is not None:
            updates["is_official"] = is_official
        if updates:
            await self._update_item(kernel_image_id, KernelImage, updates)

    async def delete_kernel_image(self, kernel_image: KernelImage) -> None:
        await self._delete_from_s3(f"{kernel_image.id}/{kernel_image.name}")
        await self._delete_item(kernel_image)

    async def get_public_kernel_images(self) -> list[KernelImage]:
        table = await self.db.Table(TABLE_NAME)
        response = await table.scan(
            FilterExpression="is_public = :is_public", ExpressionAttributeValues={":is_public": True}
        )
        return [KernelImage(**item) for item in response.get("Items", [])]

    async def increment_downloads(self, kernel_image_id: str) -> None:
        await self._update_item(kernel_image_id, KernelImage, {"downloads": KernelImage.downloads + 1})

    async def get_kernel_image_download_url(self, kernel_image: KernelImage) -> str:
        s3_filename = f"{kernel_image.id}/{kernel_image.name}"
        return await self._get_presigned_url(s3_filename)
