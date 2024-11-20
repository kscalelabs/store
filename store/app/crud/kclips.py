"""Defines the CRUD interface for handling user-uploaded KClips."""

from typing import TypedDict

from store.app.crud.base import BaseCrud, MultipartUploadDetails, MultipartUploadPart
from store.app.model import KClip


class KClipPartCompleted(TypedDict):
    """Represents a completed part in a multipart upload."""

    part_number: int
    etag: str


class KClipsCrud(BaseCrud):
    @classmethod
    def get_gsis(cls) -> set[str]:
        return super().get_gsis().union({"user_id", "robot_id"})

    async def create_kclip(
        self,
        user_id: str,
        robot_id: str,
        name: str,
        description: str | None = None,
        file_size: int | None = None,
        part_size: int | None = None,
    ) -> tuple[KClip, MultipartUploadDetails]:
        """Creates a KClip and initializes multipart upload."""
        kclip = KClip.create(user_id=user_id, robot_id=robot_id, name=name, description=description)

        await self._add_item(kclip)

        key = f"kclips/{kclip.id}/{name}"
        upload_details = await self._initiate_multipart_upload(
            key=key, file_size=file_size, part_size=part_size, content_type="application/octet-stream"
        )

        return kclip, upload_details

    async def complete_upload(self, kclip_id: str, upload_id: str, parts: list[KClipPartCompleted]) -> None:
        """Completes a multipart upload for a KClip."""
        kclip = await self._get_item(kclip_id, KClip)
        if not kclip:
            raise ValueError("KClip not found")

        # Convert to S3 expected format
        s3_parts: list[MultipartUploadPart] = [
            {"PartNumber": part["part_number"], "ETag": part["etag"]} for part in parts
        ]

        # Complete the multipart upload
        key = f"kclips/{kclip_id}/{kclip.name}"
        await self._complete_multipart_upload(key, upload_id, s3_parts)

        # Update KClip status
        await self._update_item(kclip_id, KClip, {"upload_status": "completed"})
