"""Defines the router endpoints for handling KClips."""

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from store.app.crud.kclips import KClipPartCompleted, KClipUploadDetails
from store.app.db import Crud
from store.app.model import User
from store.app.security.user import get_session_user_with_write_permission

router = APIRouter()


class NewKClipResponse(BaseModel):
    kclip_id: str
    upload_details: KClipUploadDetails


@router.post("/create")
async def create_kclip(
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    robot_id: str,
    name: str,
    description: str,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> NewKClipResponse:
    kclip, upload_details = await crud.create_kclip(
        user_id=user.id, robot_id=robot_id, name=name, description=description
    )

    return NewKClipResponse(kclip_id=kclip.id, upload_details=upload_details)


@router.post("/{kclip_id}/complete")
async def complete_upload(
    kclip_id: str,
    upload_id: str,
    parts: list[KClipPartCompleted],
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> dict:
    await crud.complete_upload(kclip_id, upload_id, parts)
    return {"status": "completed"}
