"""Defines the router endpoints for handling kernel images."""

import logging
from typing import Annotated, List, Literal, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from pydantic import BaseModel

from store.app.db import Crud
from store.app.model import KernelImage, User
from store.app.routers.users import (
    get_session_user_with_write_permission,
    maybe_get_user_from_api_key,
)
from store.settings import settings

kernel_images_router = APIRouter()

logger = logging.getLogger(__name__)


class KernelImageResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: str | None
    size: int
    timestamp: int
    is_public: bool
    is_official: bool
    downloads: int


@kernel_images_router.post("/upload", response_model=KernelImageResponse)
async def upload_kernel_image(
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    name: str = Form(...),
    file: UploadFile = File(...),
    is_public: bool = Form(False),
    is_official: bool = Form(False),
    description: str | None = Form(None),
) -> KernelImageResponse:
    kernel_image = await crud.upload_kernel_image(
        name=name,
        file=file,
        user=user,
        description=description,
        is_public=is_public,
        is_official=is_official,
    )
    return KernelImageResponse(**kernel_image.dict())


@kernel_images_router.get("/info/{kernel_image_id}", response_model=KernelImageResponse)
async def get_kernel_image_info(
    kernel_image_id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User | None, Depends(maybe_get_user_from_api_key)],
) -> KernelImageResponse:
    kernel_image = await crud.get_kernel_image(kernel_image_id)
    if kernel_image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kernel image not found")
    if not kernel_image.is_public and (user is None or user.id != kernel_image.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to view this kernel image"
        )
    return KernelImageResponse(**kernel_image.dict())


@kernel_images_router.put("/edit/{kernel_image_id}", response_model=bool)
async def edit_kernel_image(
    kernel_image_id: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    name: str | None = Form(None),
    description: str | None = Form(None),
    is_public: bool | None = Form(None),
    is_official: bool | None = Form(None),
) -> bool:
    kernel_image = await crud.get_kernel_image(kernel_image_id)
    if kernel_image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kernel image not found")
    if user.id != kernel_image.user_id and "is_admin" not in (user.permissions or []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to edit this kernel image"
        )
    await crud.update_kernel_image(kernel_image_id, name, description, is_public, is_official)
    return True


@kernel_images_router.delete("/delete/{kernel_image_id}", response_model=bool)
async def delete_kernel_image(
    kernel_image_id: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    kernel_image = await crud.get_kernel_image(kernel_image_id)
    if kernel_image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kernel image not found")
    if user.id != kernel_image.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this kernel image"
        )
    await crud.delete_kernel_image(kernel_image)
    return True


@kernel_images_router.get("/public", response_model=List[KernelImageResponse])
async def list_public_kernel_images(
    crud: Annotated[Crud, Depends(Crud.get)],
) -> List[KernelImageResponse]:
    kernel_images = await crud.get_public_kernel_images()
    return [KernelImageResponse(**ki.dict()) for ki in kernel_images]


@kernel_images_router.get("/download/{kernel_image_id}", response_model=str)
async def download_kernel_image(
    kernel_image_id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User | None, Depends(maybe_get_user_from_api_key)],
) -> str:
    kernel_image = await crud.get_kernel_image(kernel_image_id)
    if kernel_image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kernel image not found")
    if not kernel_image.is_public and (user is None or user.id != kernel_image.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to download this kernel image"
        )

    # Increment the download count
    await crud.increment_downloads(kernel_image_id)

    # Get the download URL
    download_url = await crud.get_kernel_image_download_url(kernel_image)
    return download_url
