"""Defines all robot related API endpoints."""

import logging
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException

from store.app.api.crypto import get_new_user_id
from store.app.api.db import Crud
from store.app.api.model import Part, Robot
from store.app.api.routers.users import ApiKeyData, get_api_key

robots_router = APIRouter()


logger = logging.getLogger(__name__)


async def verify_table_exists(table_name: str, crud: Crud) -> bool:
    try:
        table_names = [table.name async for table in crud.db.tables.all()]
        logger.debug(f"Found tables: {table_names}")
        return table_name in table_names
    except Exception as e:
        logger.error(f"Error checking table existence: {e}")
        return False


@robots_router.get("/robots")
async def list_robots(crud: Annotated[Crud, Depends(Crud.get)]) -> List[Robot]:
    return await crud.list_robots()


@robots_router.get("/robots/{robot_id}")
async def get_robot(robot_id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> Robot | None:
    return await crud.get_robot(robot_id)


@robots_router.get("/parts")
async def list_parts(crud: Annotated[Crud, Depends(Crud.get)]) -> List[Part]:
    return await crud.list_parts()


@robots_router.get("/parts/{part_id}")
async def get_part(part_id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> Part | None:
    return await crud.get_part(part_id)


@robots_router.post("/add/robot/")
async def add_robot(
    robot: Robot,
    data: Annotated[ApiKeyData, Depends(get_api_key)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    user_id = await crud.get_user_id_from_api_key(data.api_key)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Must be logged in to add a robot")
    robot.owner = str(user_id)
    robot.robot_id = str(get_new_user_id())
    await crud.add_robot(robot)
    return True
