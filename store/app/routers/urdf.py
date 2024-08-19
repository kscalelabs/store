"""Defines the router endpoints for handling URDFs."""

import asyncio
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from pydantic.main import BaseModel

from store.app.crud.urdf import URDF_PACKAGE_NAME
from store.app.db import Crud
from store.app.model import (
    User,
    can_write_listing,
    get_artifact_type,
    get_artifact_url,
)
from store.app.routers.users import get_session_user_with_write_permission

urdf_router = APIRouter()

logger = logging.getLogger(__name__)


def get_urdf_url(listing_id: str) -> str:
    return get_artifact_url(
        artifact_type="urdf",
        listing_id=listing_id,
        name=URDF_PACKAGE_NAME,
    )


class UrdfInfo(BaseModel):
    artifact_id: str
    url: str


class UrdfResponse(BaseModel):
    urdf: UrdfInfo | None
    listing_id: str


@urdf_router.get("/info/{listing_id}", response_model=UrdfResponse)
async def get_urdf(
    listing_id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> UrdfResponse:
    urdf = await crud.get_urdf(listing_id)
    if urdf is None:
        return UrdfResponse(urdf=None, listing_id=listing_id)
    return UrdfResponse(
        urdf=UrdfInfo(artifact_id=urdf.id, url=get_urdf_url(listing_id)),
        listing_id=listing_id,
    )


class SetUrdfResponse(BaseModel):
    urdf: UrdfInfo


@urdf_router.post("/upload/{listing_id}")
async def set_urdf(
    listing_id: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    file: UploadFile,
) -> UrdfResponse:
    if get_artifact_type(file.content_type, file.filename) != "tgz":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The file must be a .tgz file",
        )

    # Checks that the listing is valid.
    listing = await crud.get_listing(listing_id)
    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find listing associated with the given id",
        )
    if not await can_write_listing(user, listing):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to upload artifacts to this listing",
        )

    # Uploads the URDF for the listing.
    urdf = await crud.set_urdf(file=file, listing=listing)

    return UrdfResponse(
        urdf=UrdfInfo(artifact_id=urdf.id, url=get_urdf_url(listing_id)),
        listing_id=listing_id,
    )


@urdf_router.delete("/delete/{listing_id}")
async def delete_urdf(
    listing_id: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> UrdfResponse:
    urdf, listing = await asyncio.gather(
        crud.get_urdf(listing_id),
        crud.get_listing(listing_id),
    )
    if urdf is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find URDF associated with the given listing id",
        )
    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find listing associated with the given id",
        )
    if not await can_write_listing(user, listing):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to delete the URDF for this listing",
        )
    await crud.remove_artifact(urdf)
    return UrdfResponse(urdf=None, listing_id=listing_id)
