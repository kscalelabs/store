"""Defines the router endpoints for handling KClips."""

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from store.app.crud.base import MultipartUploadDetails
from store.app.crud.kclips import KClipPartCompleted
from store.app.db import Crud
from store.app.errors import ItemNotFoundError
from store.app.model import User
from store.app.security.user import (
    get_session_user_with_write_permission,
    verify_admin_permission,
)

router = APIRouter()


class UploadKClipRequest(BaseModel):
    name: str
    robot_id: str
    description: str | None = None
    file_size: int | None = None
    part_size: int | None = None


class UploadKClipResponse(BaseModel):
    kclip_id: str
    upload_details: MultipartUploadDetails


@router.post("/upload")
async def create_kclip(
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    kclip_data: UploadKClipRequest,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> UploadKClipResponse:
    robot = await crud.get_robot(kclip_data.robot_id)
    if robot is None:
        raise ItemNotFoundError("Robot with ID %s not found", kclip_data.robot_id)
    if robot.user_id != user.id:
        verify_admin_permission(user, "upload KClips for a robot by another user")

    kclip, upload_details = await crud.create_kclip(
        user_id=user.id,
        robot_id=kclip_data.robot_id,
        name=kclip_data.name,
        description=kclip_data.description,
        file_size=kclip_data.file_size,
        part_size=kclip_data.part_size,
    )

    return UploadKClipResponse(kclip_id=kclip.id, upload_details=upload_details)


class CompletedKClipUploadRequest(BaseModel):
    kclip_id: str
    upload_id: str
    parts: list[KClipPartCompleted]


class CompletedKClipUploadResponse(BaseModel):
    status: str


@router.post("/{kclip_id}/complete")
async def complete_upload(
    kclip_data: CompletedKClipUploadRequest,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> CompletedKClipUploadResponse:
    kclip = await crud.get_kclip(kclip_data.kclip_id)
    if kclip is None:
        raise ItemNotFoundError("KClip with ID %s not found", kclip_data.kclip_id)
    if kclip.user_id != user.id:
        verify_admin_permission(user, "complete upload of KClip by another user")

    await crud.complete_upload(kclip_data.kclip_id, kclip_data.upload_id, kclip_data.parts)
    return CompletedKClipUploadResponse(status="completed")
