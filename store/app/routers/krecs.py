"""Defines the router endpoints for handling KRecs."""

import logging
from datetime import datetime, timedelta
from typing import Annotated, Any, List, NotRequired, TypedDict, Union

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from store.app.db import Crud
from store.app.errors import ItemNotFoundError
from store.app.model import KRec, User
from store.app.security.user import (
    get_session_user,
    get_session_user_with_write_permission,
    verify_admin_permission,
)

logger = logging.getLogger(__name__)
router = APIRouter()


class UploadKRecRequest(BaseModel):
    name: str
    robot_id: str
    description: str | None = None


@router.post("/upload")
async def create_krec(
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    krec_data: UploadKRecRequest,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> dict[str, Any]:
    """Initialize a KRec upload and return a presigned URL."""
    robot = await crud.get_robot(krec_data.robot_id)
    if robot is None:
        raise ItemNotFoundError("Robot with ID %s not found", krec_data.robot_id)
    if robot.user_id != user.id:
        verify_admin_permission(user, "upload KRecs for a robot by another user")

    # Create KRec record first
    krec = KRec.create(
        user_id=user.id,
        robot_id=krec_data.robot_id,
        name=krec_data.name,
        description=krec_data.description,
    )
    await crud._add_item(krec)

    s3_key = f"krecs/{krec.id}/{krec.name}"
    upload_url = await crud.generate_presigned_video_upload_url(
        filename=krec.name,
        s3_key=s3_key,
        expires_in=12 * 3600,
    )

    return {
        "krec_id": krec.id,
        "upload_url": upload_url,
        "expires_at": int((datetime.utcnow() + timedelta(hours=12)).timestamp()),
    }


class KRecUrls(BaseModel):
    url: str
    filename: str
    expires_at: int
    checksum: str | None = None


async def get_krec_url_response(krec: KRec, crud: Crud) -> KRecUrls:
    try:
        s3_key = f"krecs/{krec.id}/{krec.name}"
        download_filename = f"{krec.name}.mkv" if not krec.name.endswith(".mkv") else krec.name

        logger.info("Generating download URL for krec %s with key %s", krec.id, s3_key)

        url, checksum = await crud.generate_presigned_download_url(
            filename=download_filename,
            s3_key=s3_key,
            content_type="video/x-matroska",
            checksum_algorithm="SHA256",
        )

        expiration_time = int((datetime.utcnow() + timedelta(hours=1)).timestamp())

        return KRecUrls(url=url, filename=download_filename, expires_at=expiration_time, checksum=checksum)
    except Exception as e:
        logger.error("Error generating download URL for krec %s: %s", krec.id, str(e))
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Could not generate download URL: {str(e)}")


class SingleKRecResponse(BaseModel):
    """Response model for a single KRec with download URL."""

    id: str
    name: str
    created_at: int
    user_id: str
    robot_id: str
    type: str = "KRec"
    urls: KRecUrls | None = None
    size: int | None = None

    @classmethod
    async def from_krec(cls, krec: KRec, crud: Crud) -> "SingleKRecResponse":
        s3_key = f"krecs/{krec.id}/{krec.name}"
        size = await crud.get_file_size(s3_key) if crud is not None else None

        urls = await get_krec_url_response(krec, crud)

        return cls(
            id=krec.id,
            name=krec.name,
            created_at=krec.created_at,
            user_id=krec.user_id,
            robot_id=krec.robot_id,
            urls=urls,
            size=size,
        )


class KRecUrlContent(TypedDict):
    url: str
    filename: str
    expires_at: int
    checksum: NotRequired[str | None]
    urls: NotRequired[KRecUrls]


class SecureKRecResponse(JSONResponse):
    def render(self, content: Union[KRecUrlContent, dict[str, Any]]) -> bytes:
        if isinstance(content, dict):
            if "url" in content:
                content["url"] = content["url"].split("?")[0] + "?[REDACTED]"

            if "urls" in content and isinstance(content["urls"], dict) and "url" in content["urls"]:
                content["urls"]["url"] = content["urls"]["url"].split("?")[0] + "?[REDACTED]"

        return super().render(content)


@router.get("/info/{krec_id}", response_class=SecureKRecResponse)
async def get_krec_info(
    krec_id: str,
    user: Annotated[User, Depends(get_session_user)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> SingleKRecResponse:
    """Get information about a specific KRec, including download URL."""
    krec = await crud.get_krec(krec_id)
    if krec is None:
        raise ItemNotFoundError("KRec with ID %s not found", krec_id)

    robot = await crud.get_robot(krec.robot_id)
    if robot is None:
        raise ItemNotFoundError("Robot not found")
    if robot.user_id != user.id:
        verify_admin_permission(user, "access KRec by another user")

    return await SingleKRecResponse.from_krec(krec, crud)


@router.get("/download/{krec_id}", response_class=SecureKRecResponse)
async def get_krec_download_url(
    krec_id: str,
    user: Annotated[User, Depends(get_session_user)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> dict[str, Any]:
    """Get a presigned download URL for a krec."""
    krec = await crud.get_krec(krec_id)
    if krec is None:
        raise ItemNotFoundError("KRec with ID %s not found", krec_id)

    robot = await crud.get_robot(krec.robot_id)
    if robot is None:
        raise ItemNotFoundError("Robot not found")
    if robot.user_id != user.id:
        verify_admin_permission(user, "access KRec by another user")

    urls = await get_krec_url_response(krec, crud)
    return {"id": krec.id, "name": krec.name, "url": urls.url, "filename": urls.filename}


@router.get("/{robot_id}")
async def list_krecs(
    robot_id: str,
    user: Annotated[User, Depends(get_session_user)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> List[KRec]:
    """List all krecs for a robot."""
    krecs = await crud.list_krecs(robot_id)
    return krecs


@router.delete("/{krec_id}")
async def delete_krec(
    krec_id: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> dict[str, str]:
    """Delete a krec."""
    krec = await crud.get_krec(krec_id)
    if krec is None:
        raise ItemNotFoundError("KRec with ID %s not found", krec_id)
    if krec.user_id != user.id:
        verify_admin_permission(user, "delete KRec by another user")

    await crud.delete_krec(krec_id)
    return {"status": "deleted"}
