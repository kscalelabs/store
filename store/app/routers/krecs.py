"""Defines the router endpoints for handling KRecs."""

from typing import Annotated, List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from store.app.crud.base import MultipartUploadDetails
from store.app.crud.krecs import KRecPartCompleted
from store.app.db import Crud
from store.app.errors import ItemNotFoundError
from store.app.model import KRec, User
from store.app.security.user import (
    get_session_user,
    get_session_user_with_write_permission,
    verify_admin_permission,
)

router = APIRouter()


class UploadKRecRequest(BaseModel):
    name: str
    robot_id: str
    description: str | None = None
    file_size: int | None = None
    part_size: int | None = None


class UploadKRecResponse(BaseModel):
    krec_id: str
    upload_details: MultipartUploadDetails


@router.post("/upload")
async def create_krec(
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    krec_data: UploadKRecRequest,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> UploadKRecResponse:
    robot = await crud.get_robot(krec_data.robot_id)
    if robot is None:
        raise ItemNotFoundError("Robot with ID %s not found", krec_data.robot_id)
    if robot.user_id != user.id:
        verify_admin_permission(user, "upload KRecs for a robot by another user")

    krec, upload_details = await crud.create_krec(
        user_id=user.id,
        robot_id=krec_data.robot_id,
        name=krec_data.name,
        description=krec_data.description,
        file_size=krec_data.file_size,
        part_size=krec_data.part_size,
    )

    return UploadKRecResponse(krec_id=krec.id, upload_details=upload_details)


class CompletedKRecUploadRequest(BaseModel):
    krec_id: str
    upload_id: str
    parts: list[KRecPartCompleted]


class CompletedKRecUploadResponse(BaseModel):
    status: str


@router.post("/{krec_id}/complete")
async def complete_upload(
    krec_data: CompletedKRecUploadRequest,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> CompletedKRecUploadResponse:
    krec = await crud.get_krec(krec_data.krec_id)
    if krec is None:
        raise ItemNotFoundError("KRec with ID %s not found", krec_data.krec_id)
    if krec.user_id != user.id:
        verify_admin_permission(user, "complete upload of KRec by another user")

    await crud.complete_upload(krec_data.krec_id, krec_data.upload_id, krec_data.parts)
    return CompletedKRecUploadResponse(status="completed")


class KRecResponse(BaseModel):
    """Response model for a KRec."""

    id: str
    name: str
    created_at: int
    user_id: str
    robot_id: str
    type: str = "KRec"
    upload_status: str

    @classmethod
    async def from_krec(cls, krec: KRec, crud: Crud) -> "KRecResponse":
        return cls(
            id=krec.id,
            name=krec.name,
            created_at=krec.created_at,
            user_id=krec.user_id,
            robot_id=krec.robot_id,
            upload_status=krec.upload_status,
        )


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
