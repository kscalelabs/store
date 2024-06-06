"""Defines all part-related API endpoints."""

import logging
from typing import Annotated, List

from fastapi import APIRouter, Depends

from store.app.api.db import Crud
from store.app.api.model import Part

parts_router = APIRouter()


logger = logging.getLogger(__name__)


@parts_router.get("/parts")
async def list_parts(crud: Annotated[Crud, Depends(Crud.get)]) -> List[Part]:
    return await crud.list_parts()


@parts_router.get("/parts/{part_id}")
async def get_part(part_id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> Part | None:
    return await crud.get_part(part_id)
