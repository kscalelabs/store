"""Defines all robot related API endpoints."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import RedirectResponse
from pydantic.main import BaseModel

from store.app.crud.artifacts import get_urdf_name
from store.app.db import Crud
from store.app.model import Listing, User
from store.app.routers.users import get_session_user_with_write_permission
from store.settings import settings

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
    listing = await crud.get_listing(listing_id)
    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find listing associated with the given id",
        )
    if listing.user_id is not user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this listing.",
        )
    if file.content_type != "application/gzip":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only tar.gz files containing a URDF are supported",
        )
    artifact = await crud.upload_urdf(
        file=file.file,
        name=file.filename,
        user_id=user.id,
    )
    await crud._update_item(listing_id, Listing, {"artifact_ids": listing.artifact_ids.append(artifact.id)})
    return UserInfoResponse(urdf_id=artifact.id)


@urdf_router.get("/{listing_id}")
async def listing_urdf(
    listing_id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> RedirectResponse:
    urdf_id = await crud.get_urdf_id(listing_id)
    if urdf_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    urdf_url = f"{settings.site.artifact_base_url}/{get_urdf_name(urdf_id)}"
    return RedirectResponse(url=urdf_url)
