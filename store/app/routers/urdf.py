"""Defines all robot related API endpoints."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from pydantic.main import BaseModel

from store.app.db import Crud
from store.app.model import User
from store.app.routers.users import get_session_user_with_write_permission

urdf_router = APIRouter()

logger = logging.getLogger(__name__)


class UserInfoResponse(BaseModel):
    urdf_id: str


@urdf_router.post("/upload")
async def upload_urdf(
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    file: UploadFile,
) -> UserInfoResponse:
    if file.content_type != "application/gzip":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only tar.gz files containing a URDF are supported",
        )
    artifact = await crud.upload_urdf(
        file=file.file,
        user_id=user.id,
    )
    return UserInfoResponse(urdf_id=artifact.id)


@urdf_router.get("/{urdf_id}")
async def urdf_url(
    urdf_id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> str:
    raise NotImplementedError
