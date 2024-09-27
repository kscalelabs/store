"""Defines CRUD interface for handling kernel images."""

import asyncio
import io
import logging
from typing import AsyncIterator, Literal

from boto3.dynamodb.conditions import ComparisonCondition, Key
from fastapi import UploadFile

from store.app.crud.base import BaseCrud, ItemNotFoundError
from store.app.errors import BadKernelImageError
from store.app.model import KernelImage, User
from store.settings import settings
from store.utils import calculate_sha256

logger = logging.getLogger(__name__)


class KernelImagesCrud(BaseCrud):
    @classmethod
    def get_gsis(cls) -> set[str]:
        return super().get_gsis().union({"user_id", "name"})

    async def _upload_kernel_image(
        self,
        name: str,
        file: UploadFile,
        user: User,
        image_type: Literal["dockerfile", "singularity"],
        description: str | None = None,
        is_public: bool = False,
    ) -> KernelImage:
        file_data = await file.read()
        size = len(file_data)
        sha256 = calculate_sha256(file_data)

        kernel_image = KernelImage.create(
            user_id=user.id,
            name=name,
            image_type=image_type,
            size=size,
            sha256=sha256,
            description=description,
            is_public=is_public,
        )

        # Prepend the kernel image ID to the filename
        s3_filename = f"{kernel_image.id}/{name}"

        await asyncio.gather(
            self._upload_to_s3(
                data=io.BytesIO(file_data),
                name=name,
                filename=s3_filename,
                content_type="application/octet-stream",
            ),
            self._add_item(kernel_image),
        )
        return kernel_image

    async def get_raw_kernel_image(self, kernel_image_id: str) -> KernelImage | None:
        return await self._get_item(kernel_image_id, KernelImage)

    async def get_user_kernel_images(
        self,
        user_id: str,
        additional_filter_expression: ComparisonCondition | None = None,
    ) -> list[KernelImage]:
        kernel_images = await self._get_items_from_secondary_index(
            "user_id",
            user_id,
            KernelImage,
            additional_filter_expression=additional_filter_expression,
        )
        return sorted(kernel_images, key=lambda ki: ki.timestamp)

    async def edit_kernel_image(
        self,
        kernel_image_id: str,
        name: str | None = None,
        description: str | None = None,
        is_public: bool | None = None,
    ) -> None:
        kernel_image = await self.get_raw_kernel_image(kernel_image_id)
        if kernel_image is None:
            raise ItemNotFoundError("Kernel image not found")
        updates = {}
        if name is not None:
            updates["name"] = name
        if description is not None:
            updates["description"] = description
        if is_public is not None:
            updates["is_public"] = is_public
        if updates:
            await self._update_item(kernel_image_id, KernelImage, updates)

    async def remove_kernel_image(self, kernel_image: KernelImage) -> None:
        await asyncio.gather(
            self._delete_from_s3(f"{kernel_image.id}/{kernel_image.name}"),
            self._delete_item(kernel_image),
        )

    async def get_public_kernel_images(
        self,
        limit: int = 20,
        cursor: str | None = None,
        filter_expression: ComparisonCondition | None = None,
    ) -> tuple[list[KernelImage], str | None]:
        query_params = {
            "IndexName": "is_public-timestamp-index",
            "KeyConditionExpression": Key("is_public").eq(True),
            "ScanIndexForward": False,  # Sort in descending order (newest first)
            "Limit": limit,
        }

        if cursor:
            query_params["ExclusiveStartKey"] = {"id": cursor}

        if filter_expression:
            query_params["FilterExpression"] = filter_expression

        response = await self._table.query(**query_params)

        kernel_images = [KernelImage(**item) for item in response.get("Items", [])]

        next_cursor = response.get("LastEvaluatedKey", {}).get("id")

        return kernel_images, next_cursor

    async def batch_get_kernel_images(self, kernel_image_ids: list[str]) -> list[KernelImage]:
        # Split the ids into chunks of 100 (DynamoDB batch get limit)
        id_chunks = [kernel_image_ids[i : i + 100] for i in range(0, len(kernel_image_ids), 100)]

        all_kernel_images = []

        for chunk in id_chunks:
            response = await self._table.batch_get_item(
                RequestItems={
                    self._table.name: {
                        "Keys": [{"id": id} for id in chunk],
                        "ConsistentRead": True,
                    }
                }
            )

            items = response.get("Responses", {}).get(self._table.name, [])
            kernel_images = [KernelImage(**item) for item in items]
            all_kernel_images.extend(kernel_images)

        return all_kernel_images
