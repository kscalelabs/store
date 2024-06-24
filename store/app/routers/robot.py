"""Defines all robot related API endpoints."""

import logging
import time
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from store.app.crud.robots import EditRobot
from store.app.crypto import new_uuid
from store.app.db import Crud
from store.app.model import Bom, Image, Package, Robot
from store.app.routers.users import get_session_token

robots_router = APIRouter()

logger = logging.getLogger(__name__)


@robots_router.get("/")
async def list_robots(
    crud: Annotated[Crud, Depends(Crud.get)],
    page: int = Query(description="Page number for pagination"),
) -> tuple[List[Robot], bool]:
    """Lists the robots in the database.

    The function is paginated. The page size is 12.

    Returns the robots on the page and a boolean indicating if there are more pages.
    """
    return await crud.list_robots(page)


@robots_router.get("/your/")
async def list_your_robots(
    crud: Annotated[Crud, Depends(Crud.get)],
    token: Annotated[str, Depends(get_session_token)],
    page: int = Query(description="Page number for pagination"),
) -> tuple[List[Robot], bool]:
    """Lists the robots that you own."""
    user_id = await crud.get_user_id_from_session_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Must be logged in to view your parts")

    return await crud.list_your_robots(user_id, page)


@robots_router.get("/{robot_id}")
async def get_robot(robot_id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> Robot | None:
    return await crud.get_robot(robot_id)


@robots_router.get("/user/")
async def current_user(
    crud: Annotated[Crud, Depends(Crud.get)], token: Annotated[str, Depends(get_session_token)]
) -> str | None:
    user_id = await crud.get_user_id_from_session_token(token)
    return str(user_id)


class NewRobot(BaseModel):
    name: str
    description: str
    bom: List[Bom]
    images: List[Image]
    height: Optional[str]
    weight: Optional[str]
    degrees_of_freedom: Optional[str]
    urdf: str
    packages: List[Package]


@robots_router.post("/add/")
async def add_robot(
    new_robot: NewRobot,
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    user_id = await crud.get_user_id_from_session_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Must be logged in to add a robot")

    await crud.add_robot(
        Robot(
            name=new_robot.name,
            description=new_robot.description,
            bom=new_robot.bom,
            images=new_robot.images,
            height=new_robot.height,
            weight=new_robot.weight,
            degrees_of_freedom=new_robot.degrees_of_freedom,
            owner=str(user_id),
            robot_id=str(new_uuid()),
            timestamp=int(time.time()),
            urdf=new_robot.urdf,
            packages=new_robot.packages,
        )
    )
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


@robots_router.post("/edit-robot/{id}/")
async def edit_robot(
    id: str,
    robot: EditRobot,
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    user_id = await crud.get_user_id_from_session_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Must be logged in to edit a robot")
    await crud.update_robot(id, robot)
    return True
