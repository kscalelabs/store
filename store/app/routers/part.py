"""Defines all part-related API endpoints."""

import logging
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException

from store.app.crypto import new_uuid
from store.app.db import Crud
from store.app.model import Part
from store.app.routers.users import get_session_token

parts_router = APIRouter()

logger = logging.getLogger(__name__)


@parts_router.get("/")
async def list_parts(crud: Annotated[Crud, Depends(Crud.get)]) -> List[Part]:
    return await crud.list_parts()


@parts_router.get("/your/")
async def list_your_parts(
    crud: Annotated[Crud, Depends(Crud.get)], token: Annotated[str, Depends(get_session_token)]
) -> List[Part]:
    try:
        user_id = await crud.get_user_id_from_session_token(token)
        if user_id is None:
            raise HTTPException(status_code=401, detail="Must be logged in to view your parts")
        total = await crud.list_parts()
        user_parts = [part for part in total if str(part.owner) == str(user_id)]
        return user_parts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@parts_router.get("/{part_id}")
async def get_part(part_id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> Part | None:
    return await crud.get_part(part_id)


@parts_router.get("/user/")
async def current_user(
    crud: Annotated[Crud, Depends(Crud.get)],
    token: Annotated[str, Depends(get_session_token)],
) -> str | None:
    user_id = await crud.get_user_id_from_session_token(token)
    return str(user_id)


@parts_router.post("/add/")
async def add_part(
    part: Part,
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    user_id = await crud.get_user_id_from_session_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Must be logged in to add a part")
    part.owner = str(user_id)
    part.part_id = str(new_uuid())
    await crud.add_part(part)
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
    user_id = await crud.get_user_id_from_session_token(token)
    if part.owner != user_id:
        raise HTTPException(status_code=403, detail="You do not own this part")
    await crud.delete_part(part_id)
    return True


@parts_router.post("/edit-part/{part_id}/")
async def edit_part(
    part_id: str,
    part: Part,
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    user_id = await crud.get_user_id_from_session_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Must be logged in to edit a part")
    part.owner = str(user_id)
    part.part_id = part_id
    await crud.update_part(part)
    return True
