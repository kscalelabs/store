"""Defines the router endpoints for handling URDFs."""

import asyncio
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic.main import BaseModel

from store.app.db import Crud
from store.app.model import (
    DOWNLOAD_CONTENT_TYPE,
    User,
    can_read_artifact,
    can_read_listing,
    can_write_listing,
    get_compression_type,
)
from store.app.routers.users import get_session_user_with_read_permission, get_session_user_with_write_permission
from store.settings import settings

urdf_router = APIRouter()

logger = logging.getLogger(__name__)


class UrdfResponse(BaseModel):
    urdf_id: str | None
    listing_id: str


@urdf_router.get("/info/{listing_id}")
async def get_urdf_info(
    listing_id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
) -> UrdfResponse:
    listing = await crud.get_listing(listing_id)
    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find listing associated with the given id",
        )
    if not await can_read_listing(user, listing):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to view the URDF for this listing",
        )
    urdf = await crud.get_urdf(listing_id)
    if urdf is None:
        return UrdfResponse(urdf_id=None, listing_id=listing_id)
    if not await can_read_artifact(user, urdf):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to view the URDF for this listing",
        )
    return UrdfResponse(urdf_id=urdf.id, listing_id=listing_id)


@urdf_router.get("/download/{listing_id}")
async def download_urdf(
    listing_id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
) -> StreamingResponse:
    listing = await crud.get_listing(listing_id)
    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find listing associated with the given id",
        )
    if not await can_read_listing(user, listing):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to download the URDF for this listing",
        )
    urdf = await crud.get_urdf(listing_id)
    if urdf is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find URDF associated with the given listing id",
        )
    if not await can_read_artifact(user, urdf):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to download the URDF for this listing",
        )
    urdf_stream = await crud.stream_artifact(urdf)
    return StreamingResponse(
        urdf_stream,
        media_type=DOWNLOAD_CONTENT_TYPE["urdf"],
        headers={
            "Content-Disposition": f"attachment; filename={urdf.name}",
        },
    )


@urdf_router.post("/upload/{listing_id}")
async def set_urdf(
    listing_id: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    file: UploadFile,
) -> UrdfResponse:
    if file.filename is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Artifact filename was not provided",
        )
    if file.size is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Artifact size was not provided",
        )
    if file.size < settings.artifact.min_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Artifact size is too small; {file.size} is less than {settings.artifact.min_bytes} bytes",
        )
    if file.size > settings.artifact.max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Artifact size is too large; {file.size} is greater than {settings.artifact.max_bytes} bytes",
        )

    # Gets the compression type from the file content type and filename.
    compression_type = get_compression_type(file.content_type, file.filename)
    if compression_type not in ("tgz", "zip"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The file must be a .tgz or .zip file",
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
    urdf = await crud.set_urdf(
        file=file,
        listing=listing,
        compression_type=compression_type,
    )

    return UrdfResponse(
        urdf_id=urdf.id,
        listing_id=listing.id,
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
    return UrdfResponse(urdf_id=None, listing_id=listing_id)
