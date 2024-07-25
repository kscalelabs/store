"""Defines all part-related API endpoints."""

import logging
import time
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from store.app.db import Crud
from store.app.model import Image, Part, User
from store.app.routers.users import (
    get_session_user_with_read_permission,
    get_session_user_with_write_permission,
)
from store.utils import new_uuid

parts_router = APIRouter()

logger = logging.getLogger(__name__)


@parts_router.get("/")
async def list_parts(
    crud: Annotated[Crud, Depends(Crud.get)],
    page: int = Query(description="Page number for pagination"),
    search_query: str = Query(None, description="Search query string"),
) -> tuple[list[Part], bool]:
    return await crud.list_parts(page, search_query=search_query)


@parts_router.get("/dump/")
async def dump_parts(crud: Annotated[Crud, Depends(Crud.get)]) -> list[Part]:
    return await crud.dump_parts()


@parts_router.get("/me/")
async def list_my_parts(
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
    page: int = Query(description="Page number for pagination"),
    search_query: str = Query(None, description="Search query string"),
) -> tuple[list[Part], bool]:
    return await crud.list_user_parts(user.id, page, search_query=search_query)


@parts_router.get("/{part_id}")
async def get_part(part_id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> Part | None:
    return await crud.get_part(part_id)


@parts_router.get("/user/")
async def current_user(
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
) -> str | None:
    return user.id


class NewPart(BaseModel):
    name: str
    description: str
    images: list[Image]


@parts_router.post("/add/")
async def add_part(
    part: NewPart,
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
) -> bool:
    await crud.add_part(
        Part(
            name=part.name,
            description=part.description,
            images=part.images,
            owner=user.id,
            id=str(new_uuid()),
            timestamp=int(time.time()),
        )
    )
    return True


@parts_router.delete("/delete/{part_id}")
async def delete_part(
    part_id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
) -> bool:
    part = await crud.get_part(part_id)
    if part is None:
        raise HTTPException(status_code=404, detail="Part not found")
    if part.owner != user.id:
        raise HTTPException(status_code=403, detail="You do not own this part")
    await crud.delete_part(part_id)
    return True


# TODO: Improve part type annotations.
@parts_router.post("/edit/{part_id}/")
async def edit_part(
    part_id: str,
    part: dict[str, Any],
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    part_info = await crud.get_part(part_id)
    if part_info is None:
        raise HTTPException(status_code=404, detail="Part not found")
    if user.id != part_info.owner:
        raise HTTPException(status_code=403, detail="You do not own this part")
    part["owner"] = user.id
    await crud._update_item(part_id, Part, part)
    return True
