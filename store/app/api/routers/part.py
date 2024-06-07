"""Defines all part-related API endpoints."""

import logging
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException

from store.app.api.crypto import get_new_user_id
from store.app.api.db import Crud
from store.app.api.model import Part
from store.app.api.routers.users import ApiKeyData, get_api_key

parts_router = APIRouter()


logger = logging.getLogger(__name__)


@parts_router.get("/")
async def list_parts(crud: Annotated[Crud, Depends(Crud.get)]) -> List[Part]:
    return await crud.list_parts()


@parts_router.get("/{part_id}")
async def get_part(part_id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> Part | None:
    return await crud.get_part(part_id)


@parts_router.post("/add/")
async def add_part(
    part: Part,
    data: Annotated[ApiKeyData, Depends(get_api_key)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    user_id = await crud.get_user_id_from_api_key(data.api_key)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Must be logged in to add a part")
    part.owner = str(user_id)
    part.part_id = str(get_new_user_id())
    await crud.add_part(part)
    return True
