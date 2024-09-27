"""Defines the router endpoints for handling kernel images."""

import logging
from typing import Annotated, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
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
    image_type: Literal["dockerfile", "singularity"]
    size: int
    sha256: str
    timestamp: int
    is_public: bool


class ListKernelImagesResponse(BaseModel):
    kernel_images: list[KernelImageResponse]
    next_cursor: Optional[str] = None


@kernel_images_router.get("/info/{kernel_image_id}")
async def get_kernel_image_info(
    kernel_image_id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User | None, Depends(maybe_get_user_from_api_key)],
) -> KernelImageResponse:
    kernel_image = await crud.get_raw_kernel_image(kernel_image_id)
    if kernel_image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find kernel image associated with the given id",
        )

    if not kernel_image.is_public and (user is None or user.id != kernel_image.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this kernel image",
        )

    return KernelImageResponse(**kernel_image.dict())


@kernel_images_router.get("/list/{user_id}", response_model=ListKernelImagesResponse)
async def list_kernel_images(
    user_id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    current_user: Annotated[User | None, Depends(maybe_get_user_from_api_key)],
) -> ListKernelImagesResponse:
    kernel_images = await crud.get_user_kernel_images(user_id)

    if current_user is None or current_user.id != user_id:
        kernel_images = [ki for ki in kernel_images if ki.is_public]

    return ListKernelImagesResponse(kernel_images=[KernelImageResponse(**ki.dict()) for ki in kernel_images])


@kernel_images_router.post("/upload", response_model=KernelImageResponse)
async def upload_kernel_image(
    name: str,
    image_type: Literal["dockerfile", "singularity"],
    file: UploadFile,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    description: str | None = None,
    is_public: bool = False,
) -> KernelImageResponse:
    if file.size is None or file.size > settings.kernel_image.max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Kernel image size is too large; must be less than {settings.kernel_image.max_bytes} bytes",
        )

    kernel_image = await crud.upload_kernel_image(
        name=name,
        file=file,
        user=user,
        image_type=image_type,
        description=description,
        is_public=is_public,
    )

    return KernelImageResponse(**kernel_image.dict())


class UpdateKernelImageRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    is_public: bool | None = None


@kernel_images_router.put("/edit/{kernel_image_id}", response_model=bool)
async def edit_kernel_image(
    kernel_image_id: str,
    update_data: UpdateKernelImageRequest,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    kernel_image = await crud.get_raw_kernel_image(kernel_image_id)
    if kernel_image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kernel image not found")
    if user.id != kernel_image.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this kernel image",
        )
    await crud.edit_kernel_image(
        kernel_image_id=kernel_image_id,
        name=update_data.name,
        description=update_data.description,
        is_public=update_data.is_public,
    )
    return True


@kernel_images_router.delete("/delete/{kernel_image_id}", response_model=bool)
async def delete_kernel_image(
    kernel_image_id: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    kernel_image = await crud.get_raw_kernel_image(kernel_image_id)
    if kernel_image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find kernel image associated with the given id",
        )
    if user.id != kernel_image.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this kernel image",
        )
    await crud.remove_kernel_image(kernel_image)
    return True


@kernel_images_router.get("/public", response_model=ListKernelImagesResponse)
async def list_public_kernel_images(
    crud: Annotated[Crud, Depends(Crud.get)],
    cursor: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
) -> ListKernelImagesResponse:
    kernel_images, next_cursor = await crud.get_public_kernel_images(limit=limit, cursor=cursor)

    return ListKernelImagesResponse(
        kernel_images=[KernelImageResponse(**ki.dict()) for ki in kernel_images], next_cursor=next_cursor
    )


@kernel_images_router.post("/batch", response_model=List[KernelImageResponse])
async def batch_get_kernel_images(
    kernel_image_ids: List[str],
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User | None, Depends(maybe_get_user_from_api_key)],
) -> List[KernelImageResponse]:
    kernel_images = await crud.batch_get_kernel_images(kernel_image_ids)

    # Filter out private kernel images if the user doesn't have permission
    authorized_kernel_images = [ki for ki in kernel_images if ki.is_public or (user and user.id == ki.user_id)]

    return [KernelImageResponse(**ki.dict()) for ki in authorized_kernel_images]
