"""Defines the CRUD interface for handling user-uploaded KRecs."""

import logging

from botocore.exceptions import ClientError
from pydantic import BaseModel

from store.app.crud.base import (
    TABLE_NAME,
    BaseCrud,
    MultipartUploadDetails,
    MultipartUploadPart,
)
from store.app.model import KRec
from store.settings import settings

logger = logging.getLogger(__name__)


class KRecPartCompleted(BaseModel):
    """Represents a completed part in a multipart upload."""

    part_number: int
    etag: str
    checksum: str | None = None


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
            checksum_algorithm="SHA256",
        )

        return krec, upload_details

    async def complete_upload(self, krec_id: str, upload_id: str, parts: list[KRecPartCompleted]) -> None:
        krec = await self._get_item(krec_id, KRec)
        if not krec:
            raise ValueError("KRec not found")

        logger.info("Completing upload for krec %s (upload_id: %s) with %d parts", krec_id, upload_id, len(parts))

        key = f"krecs/{krec_id}/{krec.name}"

        try:
            parts_response = await self.s3.meta.client.list_parts(
                Bucket=settings.s3.bucket, Key=f"{settings.s3.prefix}{key}", UploadId=upload_id
            )
            existing_parts = parts_response.get("Parts", [])
            logger.info("Found existing upload with %d parts", len(existing_parts))

            existing_parts_dict = {
                p["PartNumber"]: {
                    "ETag": p["ETag"].strip('"'),
                }
                for p in existing_parts
            }

            submitted_parts_dict = {
                p.part_number: {
                    "ETag": p.etag.strip('"'),
                }
                for p in parts
            }

            for part_number, submitted_part in submitted_parts_dict.items():
                if part_number not in existing_parts_dict:
                    raise ValueError(f"Part {part_number} not found in S3")

                existing_part = existing_parts_dict[part_number]
                if submitted_part["ETag"] != existing_part["ETag"]:
                    raise ValueError(
                        f"ETag mismatch for part {part_number}: "
                        f"submitted={submitted_part['ETag']}, "
                        f"actual={existing_part['ETag']}"
                    )

            s3_parts: list[MultipartUploadPart] = [
                MultipartUploadPart(
                    PartNumber=part.part_number,
                    ETag=part.etag,
                    **({"ChecksumSHA256": part.checksum} if part.checksum is not None else {}),
                )
                for part in parts
            ]

            await self._complete_multipart_upload(key=key, upload_id=upload_id, parts=s3_parts)
            logger.info("Successfully completed multipart upload for krec %s", krec_id)

        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchUpload":
                logger.error("Upload ID %s no longer exists for krec %s", upload_id, krec_id)
                raise ValueError(f"Upload ID {upload_id} no longer exists") from e
            logger.error("Failed to verify upload status for krec %s (upload_id: %s): %s", krec_id, upload_id, str(e))
            raise

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
