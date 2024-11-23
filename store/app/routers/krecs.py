"""Defines the router endpoints for handling KRecs."""

import logging
from datetime import datetime, timedelta
from typing import Annotated, NotRequired, TypedDict

from fastapi import APIRouter, Depends, HTTPException, status
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


class CreateKRecRequest(BaseModel):
    name: str
    robot_id: str
    description: str | None = None


class CreateKRecResponse(BaseModel):
    krec_id: str
    upload_url: str
    expires_at: int


@router.post("/upload")
async def create_krec(
    request: CreateKRecRequest,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> CreateKRecResponse:
    """Initialize a KRec upload and return a presigned URL."""
    robot = await crud.get_robot(request.robot_id)
    if robot is None:
        raise ItemNotFoundError("Robot with ID %s not found", request.robot_id)
    if robot.user_id != user.id:
        verify_admin_permission(user, "upload KRecs for a robot by another user")
    if not request.name.endswith(".krec"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="KRec name must end with .krec")

    # Create KRec record first
    my_krec = KRec.create(
        user_id=user.id,
        robot_id=request.robot_id,
        name=request.name,
        description=request.description,
    )
    await crud._add_item(my_krec)

    s3_key = f"krecs/{my_krec.id}/{my_krec.name}"
    upload_url = await crud.generate_presigned_upload_url(
        filename=my_krec.name,
        s3_key=s3_key,
        content_type="video/x-matroska",
    )

    return CreateKRecResponse(
        krec_id=my_krec.id,
        upload_url=upload_url,
        expires_at=int((datetime.utcnow() + timedelta(hours=12)).timestamp()),
    )


class KRecUrls(BaseModel):
    url: str
    filename: str
    expires_at: int
    checksum: str | None = None


async def get_krec_url_response(my_krec: KRec, crud: Crud) -> KRecUrls:
    try:
        s3_key = f"krecs/{my_krec.id}/{my_krec.name}"
        download_filename = f"{my_krec.name}.mkv" if not my_krec.name.endswith(".mkv") else my_krec.name

        logger.info("Generating download URL for krec %s with key %s", my_krec.id, s3_key)

        url, checksum = await crud.generate_presigned_download_url(
            filename=download_filename,
            s3_key=s3_key,
            content_type="video/x-matroska",
            checksum_algorithm="SHA256",
        )

        expiration_time = int((datetime.utcnow() + timedelta(hours=1)).timestamp())

        return KRecUrls(url=url, filename=download_filename, expires_at=expiration_time, checksum=checksum)
    except Exception as e:
        logger.error("Error generating download URL for krec %s: %s", my_krec.id, str(e))
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
    async def from_krec(cls, my_krec: KRec, crud: Crud) -> "SingleKRecResponse":
        s3_key = f"krecs/{my_krec.id}/{my_krec.name}"
        size = await crud.get_file_size(s3_key) if crud is not None else None
        urls = await get_krec_url_response(my_krec, crud)

        return cls(
            id=my_krec.id,
            name=my_krec.name,
            created_at=my_krec.created_at,
            user_id=my_krec.user_id,
            robot_id=my_krec.robot_id,
            urls=urls,
            size=size,
        )


class KRecUrlContent(TypedDict):
    url: str
    filename: str
    expires_at: int
    checksum: NotRequired[str | None]
    urls: NotRequired[KRecUrls]


@router.get("/info/{krec_id}", response_class=SingleKRecResponse)
async def get_krec_info(
    krec_id: str,
    user: Annotated[User, Depends(get_session_user)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> SingleKRecResponse:
    """Get information about a specific KRec, including download URL."""
    my_krec = await crud.get_krec(krec_id)
    if my_krec is None:
        raise ItemNotFoundError("KRec with ID %s not found", krec_id)

    robot = await crud.get_robot(my_krec.robot_id)
    if robot is None:
        raise ItemNotFoundError("Robot not found")
    if robot.user_id != user.id:
        verify_admin_permission(user, "access KRec by another user")

    return await SingleKRecResponse.from_krec(my_krec, crud)


class KRecDownloadResponse(BaseModel):
    id: str
    name: str
    url: str
    filename: str


@router.get("/download/{krec_id}", response_class=KRecDownloadResponse)
async def get_krec_download_url(
    krec_id: str,
    user: Annotated[User, Depends(get_session_user)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> KRecDownloadResponse:
    """Get a presigned download URL for a krec."""
    my_krec = await crud.get_krec(krec_id)
    if my_krec is None:
        raise ItemNotFoundError("KRec with ID %s not found", krec_id)

    robot = await crud.get_robot(my_krec.robot_id)
    if robot is None:
        raise ItemNotFoundError("Robot not found")
    if robot.user_id != user.id:
        verify_admin_permission(user, "access KRec by another user")

    urls = await get_krec_url_response(my_krec, crud)
    return KRecDownloadResponse(
        id=my_krec.id,
        name=my_krec.name,
        url=urls.url,
        filename=urls.filename,
    )


@router.get("/{robot_id}", response_model=list[KRec])
async def list_krecs(
    robot_id: str,
    user: Annotated[User, Depends(get_session_user)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> list[KRec]:
    """List all krecs for a robot."""
    krecs = await crud.list_krecs(robot_id)
    return krecs


@router.delete("/{krec_id}", response_model=bool)
async def delete_krec(
    krec_id: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    """Delete a krec."""
    my_krec = await crud.get_krec(krec_id)
    if my_krec is None:
        raise ItemNotFoundError("KRec with ID %s not found", krec_id)
    if my_krec.user_id != user.id:
        verify_admin_permission(user, "delete KRec by another user")

    await crud.delete_krec(krec_id)
    return True
