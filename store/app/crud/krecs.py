"""Defines the CRUD interface for handling user-uploaded KRecs."""

from pydantic import BaseModel

from store.app.crud.base import (
    TABLE_NAME,
    BaseCrud,
    MultipartUploadDetails,
    MultipartUploadPart,
)
from store.app.model import KRec


class KRecPartCompleted(BaseModel):
    """Represents a completed part in a multipart upload."""

    part_number: int
    etag: str


class KRecsCrud(BaseCrud):
    @classmethod
    def get_gsis(cls) -> set[str]:
        return super().get_gsis().union({"user_id", "robot_id"})

    async def create_krec(
        self,
        user_id: str,
        robot_id: str,
        name: str,
        description: str | None = None,
        file_size: int | None = None,
        part_size: int | None = None,
    ) -> tuple[KRec, MultipartUploadDetails]:
        krec = KRec.create(user_id=user_id, robot_id=robot_id, name=name, description=description)

        await self._add_item(krec)

        key = f"krecs/{krec.id}/{name}"
        upload_details = await self._initiate_multipart_upload(
            key=key,
            file_size=file_size,
            part_size=part_size,
            content_type="video/x-matroska",
        )

        return krec, upload_details

    async def complete_upload(self, krec_id: str, upload_id: str, parts: list[KRecPartCompleted]) -> None:
        krec = await self._get_item(krec_id, KRec)
        if not krec:
            raise ValueError("KRec not found")

        # Convert to S3 expected format
        s3_parts: list[MultipartUploadPart] = [
            MultipartUploadPart(PartNumber=part.part_number, ETag=part.etag) for part in parts
        ]

        # Complete the multipart upload
        key = f"krecs/{krec_id}/{krec.name}"
        await self._complete_multipart_upload(key, upload_id, s3_parts)

        # Update KRec status
        await self._update_item(krec_id, KRec, {"upload_status": "completed"})

    async def get_krec(self, krec_id: str) -> KRec | None:
        return await self._get_item(krec_id, KRec)

    async def list_krecs(self, robot_id: str) -> list[KRec]:
        """List all krecs for a robot."""
        table = await self.db.Table(TABLE_NAME)
        response = await table.query(
            IndexName=self.get_gsi_index_name("robot_id"),
            KeyConditionExpression="#robot_id = :robot_id",
            ExpressionAttributeNames={
                "#robot_id": "robot_id",
            },
            ExpressionAttributeValues={
                ":robot_id": robot_id,
            },
        )

        return [self._validate_item(item, KRec) for item in response.get("Items", [])]

    async def delete_krec(self, krec_id: str) -> None:
        """Delete a krec."""
        await self._delete_item(krec_id)
