"""Defines the CRUD interface for handling user-uploaded KClips."""

from typing import TypedDict

from boto3.session import Session
from botocore.config import Config

from store.app.crud.base import BaseCrud
from store.app.model import KClip
from store.settings import settings


class KClipPart(TypedDict):
    """Represents a KClip part in a multipart upload."""

    part_number: int
    url: str


class KClipUploadDetails(TypedDict):
    upload_id: str
    parts: list[KClipPart]
    bucket: str
    key: str


class KClipPartCompleted(TypedDict):
    """Represents a completed part in a multipart upload.

    Fields:
        PartNumber: The number of this part (1 to 10,000)
        ETag: The entity tag returned when the part was uploaded
    """

    part_number: int
    etag: str


class KClipsCrud(BaseCrud):
    def __init__(self) -> None:
        super().__init__()
        self.s3_client = Session().client("s3", config=Config(signature_version="s3v4"))

    @classmethod
    def get_gsis(cls) -> set[str]:
        return super().get_gsis().union({"user_id", "robot_id"})

    async def create_kclip(
        self, user_id: str, robot_id: str, name: str, description: str
    ) -> tuple[KClip, KClipUploadDetails]:
        kclip = KClip.create(user_id=user_id, robot_id=robot_id, name=name, description=description)

        # Initialize multipart upload in S3
        response = self.s3_client.create_multipart_upload(Bucket=settings.s3.bucket, Key=f"kclips/{kclip.id}/{name}")
        upload_id = response["UploadId"]

        # Generate presigned URLs for parts (assuming 10MB chunks)
        # The actual number of parts will be determined by the CLI
        presigned_urls: list[KClipPart] = []
        for part_number in range(1, 10001):  # S3 supports up to 10,000 parts
            presigned_url = self.s3_client.generate_presigned_url(
                "upload_part",
                Params={
                    "Bucket": settings.s3.bucket,
                    "Key": f"kclips/{kclip.id}/{name}",
                    "UploadId": upload_id,
                    "PartNumber": part_number,
                },
                ExpiresIn=3600,  # URL expires in 1 hour
            )
            presigned_urls.append({"part_number": part_number, "url": presigned_url})

        # Store the KClip in DynamoDB
        await self._add_item(kclip)

        # Return both the KClip model and the upload details
        upload_details: KClipUploadDetails = {
            "upload_id": upload_id,
            "parts": presigned_urls,
            "bucket": settings.s3.bucket,
            "key": f"kclips/{kclip.id}/{name}",
        }

        return kclip, upload_details

    async def complete_upload(self, kclip_id: str, upload_id: str, parts: list[KClipPartCompleted]) -> None:
        """Completes a multipart upload for a KClip.

        Args:
            kclip_id: The ID of the KClip
            upload_id: The upload ID from S3
            parts: List of completed parts with ETag information
        """
        kclip = await self._get_item(kclip_id, KClip)
        if not kclip:
            raise ValueError("KClip not found")

        # Complete the multipart upload
        self.s3_client.complete_multipart_upload(
            Bucket=settings.s3.bucket,
            Key=f"kclips/{kclip_id}/{kclip.name}",
            UploadId=upload_id,
            MultipartUpload={"Parts": [{"PartNumber": part["part_number"], "ETag": part["etag"]} for part in parts]},
        )

        # Update KClip status if needed
        await self._update_item(kclip_id, KClip, {"upload_status": "completed"})
