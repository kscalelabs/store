"""Defines CRUD interface for handling kernel images."""

import io
import logging
from typing import Any

import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile

from store.app.crud.base import TABLE_NAME, BaseCrud
from store.app.model import KernelImage, User
from store.settings import settings

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
        if not user.permissions or not ({"is_mod", "is_admin"} & user.permissions):
            raise ValueError("Only moderators or admins can upload kernel images")

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
        user: User,
        name: str | None = None,
        description: str | None = None,
        is_public: bool | None = None,
        is_official: bool | None = None,
    ) -> None:
        if not user.permissions or not ({"is_mod", "is_admin"} & user.permissions):
            raise ValueError("Only moderators or admins can update kernel images")

        updates: dict[str, Any] = {}
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

    async def delete_kernel_image(self, kernel_image: KernelImage, user: User) -> None:
        if not user.permissions or not ({"is_mod", "is_admin"} & user.permissions):
            raise ValueError("Only moderators or admins can delete kernel images")

        await self._delete_from_s3(f"{kernel_image.id}/{kernel_image.name}")
        await self._delete_item(kernel_image)

    async def get_public_kernel_images(self) -> list[KernelImage]:
        table = await self.db.Table(TABLE_NAME)
        response = await table.scan(
            FilterExpression="is_public = :is_public", ExpressionAttributeValues={":is_public": True}
        )
        return [KernelImage.model_validate(item) for item in response.get("Items", [])]

    async def increment_downloads(self, kernel_image_id: str) -> None:
        kernel_image = await self.get_kernel_image(kernel_image_id)
        if kernel_image:
            await self._update_item(kernel_image_id, KernelImage, {"downloads": kernel_image.downloads + 1})

    async def get_kernel_image_download_url(self, kernel_image: KernelImage) -> str:
        s3_filename = f"{kernel_image.id}/{kernel_image.name}"
        return await self._get_presigned_url(s3_filename)

    async def _get_presigned_url(self, s3_filename: str) -> str:
        s3_client = boto3.client("s3")
        try:
            presigned_url = s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.s3.bucket, "Key": f"{settings.s3.prefix}{s3_filename}"},
                ExpiresIn=3600,
            )  # URL expires in 1 hour
        except ClientError as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise
        return presigned_url
