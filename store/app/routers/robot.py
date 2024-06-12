"""Defines all robot related API endpoints."""

import logging
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException

from store.app.crypto import get_new_user_id
from store.app.db import Crud
from store.app.model import Robot
from store.app.routers.users import get_session_token

robots_router = APIRouter()

logger = logging.getLogger(__name__)


@robots_router.get("/")
async def list_robots(crud: Annotated[Crud, Depends(Crud.get)]) -> List[Robot]:
    return await crud.list_robots()


@robots_router.get("/your/")
async def list_your_robots(
    crud: Annotated[Crud, Depends(Crud.get)], token: Annotated[str, Depends(get_session_token)]
) -> List[Robot]:
    try:
        user_id = await crud.get_user_id_from_session_token(token)
        if user_id is None:
            raise HTTPException(status_code=401, detail="Must be logged in to view your robots")
        total = await crud.list_robots()
        user_robots = [robot for robot in total if str(robot.owner) == str(user_id)]
        return user_robots
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@robots_router.get("/{robot_id}")
async def get_robot(robot_id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> Robot | None:
    return await crud.get_robot(robot_id)


@robots_router.get("/user/")
async def current_user(
    crud: Annotated[Crud, Depends(Crud.get)], token: Annotated[str, Depends(get_session_token)]
) -> str | None:
    user_id = await crud.get_user_id_from_session_token(token)
    return str(user_id)


@robots_router.post("/add/")
async def add_robot(
    robot: Robot,
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    user_id = await crud.get_user_id_from_session_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Must be logged in to add a robot")
    robot.owner = str(user_id)
    robot.robot_id = str(get_new_user_id())
    await crud.add_robot(robot)
    return True


@robots_router.delete("/delete/{robot_id}/")
async def delete_robot(
    robot_id: str,
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    robot = await crud.get_robot(robot_id)
    if robot is None:
        raise HTTPException(status_code=404, detail="Robot not found")
    user_id = await crud.get_user_id_from_session_token(token)
    if str(robot.owner) != str(user_id):
        raise HTTPException(status_code=403, detail="You do not own this robot")
    await crud.delete_robot(robot_id)
    return True


@robots_router.post("/edit-robot/{robot_id}/")
async def edit_robot(
    robot_id: str,
    robot: Robot,
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    user_id = await crud.get_user_id_from_session_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Must be logged in to edit a robot")
    robot.owner = str(user_id)
    robot.robot_id = robot_id
    await crud.update_robot(robot_id, robot)
    return True
