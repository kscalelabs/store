"""Defines all part-related API endpoints."""

import logging
import time
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from store.app.crypto import new_uuid
from store.app.db import Crud
from store.app.model import Image, Part
from store.app.routers.users import get_session_token

parts_router = APIRouter()

logger = logging.getLogger(__name__)


@parts_router.get("/")
async def list_parts(
    crud: Annotated[Crud, Depends(Crud.get)],
    page: int = Query(description="Page number for pagination"),
    search_query: str = Query(None, description="Search query string"),
) -> tuple[List[Part], bool]:
    return await crud.list_parts(page, search_query=search_query)


@parts_router.get("/dump/")
async def dump_parts(crud: Annotated[Crud, Depends(Crud.get)]) -> List[Part]:
    return await crud.dump_parts()


@parts_router.get("/your/")
async def list_your_parts(
    crud: Annotated[Crud, Depends(Crud.get)],
    token: Annotated[str, Depends(get_session_token)],
    page: int = Query(description="Page number for pagination"),
) -> tuple[List[Part], bool]:
    user = await crud.get_user_from_jwt(token)
    return await crud.list_your_parts(user, page)


@parts_router.get("/{part_id}")
async def get_part(part_id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> Part | None:
    return await crud.get_part(part_id)


@parts_router.get("/user/")
async def current_user(
    crud: Annotated[Crud, Depends(Crud.get)],
    token: Annotated[str, Depends(get_session_token)],
) -> str | None:
    user = await crud.get_user_from_jwt(token)
    return user.id


class NewPart(BaseModel):
    name: str
    description: str
    images: List[Image]


@parts_router.post("/add/")
async def add_part(
    part: NewPart,
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    user = await crud.get_user_from_jwt(token)
    await crud.add_part(
        Part(
            name=part.name,
            description=part.description,
            images=part.images,
            owner=user.id,
            part_id=str(new_uuid()),
            timestamp=int(time.time()),
        )
    )
    return True


@parts_router.delete("/delete/{part_id}")
async def delete_part(
    part_id: str,
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    part = await crud.get_part(part_id)
    if part is None:
        raise HTTPException(status_code=404, detail="Part not found")
    user = await crud.get_user_from_jwt(token)
    if part.owner != user.id:
        raise HTTPException(status_code=403, detail="You do not own this part")
    await crud.delete_part(part_id)
    return True


@parts_router.post("/edit-part/{part_id}/")
async def edit_part(
    part_id: str,
    part: dict[
        str, any
    ],  # There has got to be a better type annotation than this (possibly the deleted) EditPart class
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    user = await crud.get_user_from_jwt(token)
    part_info = await crud.get_part(part_id)
    if part_info is None:
        raise HTTPException(status_code=404, detail="Part not found")
    if user.id != part_info.owner:
        raise HTTPException(status_code=403, detail="You do not own this part")
    await crud._update_item(part_id, Part, part)
    return True
