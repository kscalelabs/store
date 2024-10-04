"""Defines CRUD interface for handling kernel images."""

import io
import logging
from typing import TypedDict

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from fastapi import UploadFile

from store.app.crud.base import TABLE_NAME, BaseCrud
from store.app.model import KernelImage, User
from store.settings import settings

logger = logging.getLogger(__name__)


class KernelImageUpdates(TypedDict, total=False):
    name: str
    description: str | None
    is_public: bool
    is_official: bool


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

    async def update_kernel_image(self, kernel_image_id: str, user: User, **updates: KernelImageUpdates) -> None:
        if not user.permissions or not ({"is_mod", "is_admin"} & user.permissions):
            raise ValueError("Only moderators or admins can update kernel images")

        valid_fields = {"name", "description", "is_public", "is_official"}
        valid_updates = {k: v for k, v in updates.items() if k in valid_fields}

        if valid_updates:
            kernel_image = await self.get_kernel_image(kernel_image_id)
            if kernel_image is None:
                raise ValueError("Kernel image not found")

            # If the name is being updated, we need to rename the S3 object
            if "name" in valid_updates and valid_updates["name"] != kernel_image.name:
                old_s3_filename = f"{kernel_image.id}/{kernel_image.name}"
                new_s3_filename = f"{kernel_image.id}/{valid_updates['name']}"
                await self._rename_s3_object(old_s3_filename, new_s3_filename)

            await self._update_item(kernel_image_id, KernelImage, valid_updates)

    async def _rename_s3_object(self, old_filename: str, new_filename: str) -> None:
        s3_client = boto3.client("s3")
        try:
            # Copy the object to a new key
            s3_client.copy_object(
                Bucket=settings.s3.bucket,
                CopySource=f"{settings.s3.bucket}/{settings.s3.prefix}{old_filename}",
                Key=f"{settings.s3.prefix}{new_filename}",
            )
            # Delete the old object
            s3_client.delete_object(Bucket=settings.s3.bucket, Key=f"{settings.s3.prefix}{old_filename}")
        except ClientError as e:
            logger.error(f"Error renaming object in S3: {e}")
            raise

    async def delete_kernel_image(self, kernel_image: KernelImage, user: User) -> None:
        if not user.permissions or not ({"is_mod", "is_admin"} & user.permissions):
            raise ValueError("Only moderators or admins can delete kernel images")

        # Delete the file from S3
        s3_filename = f"{kernel_image.id}/{kernel_image.name}"
        await self._delete_from_s3(s3_filename)

        # Delete the item from the database
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
        s3_client = boto3.client(
            "s3",
            config=Config(signature_version="s3v4"),
            region_name=settings.s3.region,
        )
        try:
            presigned_url = s3_client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": settings.s3.bucket,
                    "Key": f"{settings.s3.prefix}{s3_filename}",
                },
                ExpiresIn=3600,  # URL expires in 1 hour
            )
        except ClientError as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise
        return presigned_url

    async def _delete_from_s3(self, s3_filename: str) -> None:
        s3_client = boto3.client("s3")
        try:
            s3_client.delete_object(Bucket=settings.s3.bucket, Key=f"{settings.s3.prefix}{s3_filename}")
        except ClientError as e:
            logger.error(f"Error deleting object from S3: {e}")
            raise
