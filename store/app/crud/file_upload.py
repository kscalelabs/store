"""Defines the file upload CRUD interface."""

import logging
from typing import Dict, Literal, Sequence, TypedDict, TypeVar

from botocore.exceptions import ClientError
from pydantic import BaseModel
from types_aiobotocore_s3.service_resource import S3ServiceResource
from types_aiobotocore_s3.type_defs import (
    CompletedPartTypeDef,
    CreateMultipartUploadOutputTypeDef,
)

from store.settings import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# Constants for multipart upload limits
MIN_PART_SIZE = 5 * 1024 * 1024  # 5MB (AWS minimum)
MAX_PART_SIZE = 5 * 1024 * 1024 * 1024  # 5GB (AWS maximum)
MAX_PARTS = 10000  # AWS maximum number of parts
DEFAULT_PART_SIZE = 100 * 1024 * 1024  # 100MB default part size


class MultipartUploadPart(BaseModel):
    """Represents a part in a multipart upload."""

    PartNumber: int
    ETag: str


class MultipartUploadDetails(BaseModel):
    """Details needed for multipart upload."""

    upload_id: str
    presigned_urls: list[dict[str, str | int]]
    bucket: str
    key: str
    part_size: int
    num_parts: int


class MultipartUploadParams(TypedDict, total=False):
    Bucket: str
    Key: str
    ContentType: str
    Metadata: Dict[str, str]
    ACL: Literal[
        "private",
        "public-read",
        "public-read-write",
        "authenticated-read",
        "aws-exec-read",
        "bucket-owner-read",
        "bucket-owner-full-control",
    ]
    ServerSideEncryption: Literal["AES256", "aws:kms", "aws:kms:dsse"]
    StorageClass: Literal[
        "STANDARD",
        "REDUCED_REDUNDANCY",
        "STANDARD_IA",
        "ONEZONE_IA",
        "INTELLIGENT_TIERING",
        "GLACIER",
        "DEEP_ARCHIVE",
        "OUTPOSTS",
        "GLACIER_IR",
        "SNOW",
        "EXPRESS_ONEZONE",
    ]
    RequestPayer: Literal["requester"]
    ObjectLockMode: Literal["GOVERNANCE", "COMPLIANCE"]
    ObjectLockRetainUntilDate: str
    ObjectLockLegalHoldStatus: Literal["ON", "OFF"]


class FileUploadCrud:
    """CRUD operations for file uploads."""

    def __init__(self) -> None:
        self._s3: S3ServiceResource | None = None

    @property
    def s3(self) -> S3ServiceResource:
        """Get the S3 client."""
        if self._s3 is None:
            raise RuntimeError("S3 client not initialized")
        return self._s3

    async def create_multipart_upload(
        self,
        key: str,
        content_type: str | None = None,
        metadata: dict[str, str] | None = None,
    ) -> tuple[str, str]:
        """Initializes a multipart upload."""
        params: MultipartUploadParams = {
            "Bucket": settings.s3.bucket,
            "Key": key,
            "ACL": "private",
            "ServerSideEncryption": "AES256",
        }
        if content_type:
            params["ContentType"] = content_type
        if metadata:
            params["Metadata"] = dict(metadata)  # Create a copy to ensure type safety

        response: CreateMultipartUploadOutputTypeDef = await self.s3.meta.client.create_multipart_upload(**params)
        return settings.s3.bucket, response["UploadId"]

    async def generate_presigned_urls(
        self, key: str, upload_id: str, num_parts: int, expires_in: int = 3600
    ) -> list[dict[str, str | int]]:
        """Generates presigned URLs for multipart upload parts."""
        urls: list[dict[str, str | int]] = []
        for part_number in range(1, num_parts + 1):
            url = await self.s3.meta.client.generate_presigned_url(
                "upload_part",
                Params={
                    "Bucket": settings.s3.bucket,
                    "Key": f"{settings.s3.prefix}{key}",
                    "UploadId": upload_id,
                    "PartNumber": part_number,
                },
                ExpiresIn=expires_in,
            )
            urls.append({"part_number": part_number, "url": url})
        return urls

    async def complete_multipart_upload(self, key: str, upload_id: str, parts: list[MultipartUploadPart]) -> None:
        """Completes a multipart upload."""
        try:
            completed_parts: Sequence[CompletedPartTypeDef] = [
                {"PartNumber": p.PartNumber, "ETag": p.ETag} for p in parts
            ]

            full_key = f"{settings.s3.prefix}{key}"

            logger.info(
                "Completing multipart upload - Bucket: %s, Key: %s, UploadId: %s, Parts: %d",
                settings.s3.bucket,
                full_key,
                upload_id,
                len(parts),
            )

            await self.s3.meta.client.complete_multipart_upload(
                Bucket=settings.s3.bucket, Key=full_key, UploadId=upload_id, MultipartUpload={"Parts": completed_parts}
            )
        except ClientError as e:
            logger.error(
                "Failed to complete multipart upload - Bucket: %s, Key: %s, UploadId: %s: %s",
                settings.s3.bucket,
                full_key,
                upload_id,
                str(e),
            )
            raise

    async def initiate_multipart_upload(
        self,
        key: str,
        file_size: int | None = None,
        part_size: int | None = None,
        content_type: str | None = None,
    ) -> MultipartUploadDetails:
        """Initiates a multipart upload and generates presigned URLs."""
        try:
            logger.info(
                "Initiating multipart upload - Key: %s, FileSize: %s, ContentType: %s", key, file_size, content_type
            )

            # Create the multipart upload
            params: MultipartUploadParams = {
                "Bucket": settings.s3.bucket,
                "Key": f"{settings.s3.prefix}{key}",
            }
            if content_type:
                params["ContentType"] = content_type

            response = await self.s3.meta.client.create_multipart_upload(**params)
            upload_id = response["UploadId"]

            # Generate presigned URLs for each part
            presigned_urls: list[dict[str, str | int]] = []
            if file_size and part_size:
                num_parts = (file_size + part_size - 1) // part_size
                for part_number in range(1, num_parts + 1):
                    url = await self.s3.meta.client.generate_presigned_url(
                        "upload_part",
                        Params={
                            "Bucket": settings.s3.bucket,
                            "Key": f"{settings.s3.prefix}{key}",
                            "UploadId": upload_id,
                            "PartNumber": part_number,
                        },
                        ExpiresIn=3600,  # 1 hour
                    )
                    presigned_urls.append({"part_number": int(part_number), "url": str(url)})

            logger.info("Generated %d presigned URLs for multipart upload", len(presigned_urls))

            return MultipartUploadDetails(
                upload_id=upload_id,
                presigned_urls=presigned_urls,
                bucket=settings.s3.bucket,
                key=f"{settings.s3.prefix}{key}",
                part_size=part_size if part_size is not None else DEFAULT_PART_SIZE,
                num_parts=num_parts if file_size and part_size else 1,
            )

        except ClientError as e:
            logger.error("Failed to initiate multipart upload: %s", e)
            raise
