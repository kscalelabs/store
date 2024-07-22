"""Defines all robot related API endpoints."""

import io
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import JSONResponse, RedirectResponse
from PIL import Image

from store.app.crypto import new_uuid
from store.app.db import Crud

image_router = APIRouter()

logger = logging.getLogger(__name__)


@image_router.post("/upload/")
async def upload_image(crud: Annotated[Crud, Depends(Crud.get)], file: UploadFile) -> JSONResponse:
    try:
        if file.content_type != "image/png":
            raise HTTPException(status_code=400, detail="Only PNG images are supported")
        if len(await file.read()) > 1024 * 1024 * 2:
            raise HTTPException(status_code=400, detail="Image is too large")
        image_id = str(new_uuid())
        file.filename = image_id + ".png"
        file.file.seek(0)
        await crud.upload_image(file)

        image = Image.open(file.file)
        compressed_image_io = io.BytesIO()
        image.save(compressed_image_io, format="PNG", optimize=True, quality=30)
        compressed_image_io.seek(0)
        upload = UploadFile(filename="mini" + image_id + ".png", file=compressed_image_io)
        await crud.upload_image(upload)

        return JSONResponse(status_code=200, content={"id": image_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
