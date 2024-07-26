"""Defines all robot related API endpoints."""

import io
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import RedirectResponse
from PIL import Image
from pydantic.main import BaseModel

from store.app.db import Crud
from store.settings import settings
from store.utils import new_uuid

image_router = APIRouter()

logger = logging.getLogger(__name__)


class UserInfoResponse(BaseModel):
    image_id: str


@image_router.post("/upload/")
async def upload_image(crud: Annotated[Crud, Depends(Crud.get)], file: UploadFile) -> UserInfoResponse:
    try:
        if file.content_type not in ["image/png", "image/jpeg", "image/jpg"]:
            raise HTTPException(status_code=400, detail="Only PNG images are supported")
        if len(await file.read()) > 1024 * 1024 * 25:
            raise HTTPException(status_code=400, detail="Image is too large")
        image_id = str(new_uuid())
        ext = file.filename.split(".")[-1]
        file.filename = image_id + f".{ext}"
        file.file.seek(0)
        await crud.upload_image(file)

        image = Image.open(file.file)
        compressed_image_io = io.BytesIO()
        image.save(compressed_image_io, format="PNG", optimize=True, quality=30)
        compressed_image_io.seek(0)
        upload = UploadFile(
            filename="mini" + image_id + ".png",
            file=compressed_image_io,
        )
        await crud.upload_image(upload)

        return UserInfoResponse(image_id=image_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@image_router.get("/{image_fname}")
async def image_url(image_fname: str) -> RedirectResponse:
    image_url = f"{settings.site.image_base_url}/{image_fname}"
    return RedirectResponse(url=image_url)
