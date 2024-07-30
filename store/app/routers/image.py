"""Defines all robot related API endpoints."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from fastapi.responses import RedirectResponse
from PIL import Image
from pydantic.main import BaseModel

from store.app.crud.artifacts import get_image_name
from store.app.db import Crud
from store.app.model import Artifact, ArtifactSize, User
from store.app.routers.users import get_session_user_with_write_permission
from store.settings import settings

image_router = APIRouter()

logger = logging.getLogger(__name__)


class UserInfoResponse(BaseModel):
    image_id: str


@image_router.post("/upload")
async def upload_image(
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    file: UploadFile,
    description: str | None = None,
) -> UserInfoResponse:
    try:
        if file.content_type not in ["image/png", "image/jpeg", "image/jpg"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PNG and JPEG images are supported",
            )
        if file.size is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image size was not provided",
            )
        if file.size > settings.image.max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image is too large",
            )

        image = Image.open(file.file)
        artifact = await crud.upload_image(
            image=image,
            name=file.filename,
            user_id=user.id,
            description=description,
        )

        return UserInfoResponse(image_id=artifact.id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@image_router.get("/{image_id}/{size}")
async def image_url(image_id: str, size: ArtifactSize) -> RedirectResponse:
    # TODO: Use CloudFront API to return a signed CloudFront URL.
    image_url = f"{settings.site.artifact_base_url}/{get_image_name(image_id, size)}"
    return RedirectResponse(url=image_url)


class ImageInfoResponse(BaseModel):
    id: str
    caption: str | None


@image_router.get("/batch")
async def batch(
    crud: Annotated[Crud, Depends(Crud.get)],
    ids: list[str] = Query(description="List of part ids"),
) -> list[ImageInfoResponse]:
    artifacts = await crud._get_item_batch(ids, Artifact)
    return [
        ImageInfoResponse(id=artifact.id, caption=artifact.description)
        for artifact in artifacts
        if artifact.artifact_type == "image"
    ]
