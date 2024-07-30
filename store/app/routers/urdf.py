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
    listing_id: str,
    file: UploadFile,
) -> UserInfoResponse:
    if file.content_type != "application/gzip":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only tar.gz files containing a URDF are supported",
        )
    if file.filename is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URDF filename was not provided",
        )

    # Checks that the listing is valid.
    listing = await crud.get_listing(listing_id)
    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find listing associated with the given id",
        )

    # Uploads the URDF and adds it to the listing.
    artifact = await crud.upload_raw_artifact(
        file=file.file,
        name=file.filename,
        listing=listing,
        user_id=user.id,
        artifact_type="urdf",
    )
    return UserInfoResponse(urdf_id=artifact.id)


@urdf_router.delete("/delete/{urdf_id}")
async def delete_urdf(
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    urdf_id: str,
) -> bool:
    artifact = await crud.get_raw_artifact(urdf_id)
    if artifact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find URDF associated with the given id",
        )

    # Deletes the URDF from the listing.
    await crud.remove_raw_artifact(artifact, user.id)

    return True
