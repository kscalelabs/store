"""Defines all robot related API endpoints."""

import logging
import time
from typing import Annotated, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from store.app.crypto import new_uuid
from store.app.db import Crud
from store.app.model import Bom, Image, Package, Robot
from store.app.routers.users import get_session_token

robots_router = APIRouter()

logger = logging.getLogger(__name__)


@robots_router.get("/{robot_id}")
async def get_robot(robot_id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> Robot | None:
    return await crud.get_robot(robot_id)


class NewRobot(BaseModel):
    name: str
    description: str
    bom: List[Bom]
    images: List[Image]
    height: Optional[str]
    weight: Optional[str]
    degrees_of_freedom: Optional[int]
    urdf: str
    packages: List[Package]


@robots_router.get("/")
async def list_parts(
    crud: Annotated[Crud, Depends(Crud.get)],
    page: int = Query(description="Page number for pagination"),
    search_query: str = Query(None, description="Search query string"),
) -> tuple[list[Robot], bool]:
    return await crud.list_robots(page, search_query=search_query)


@robots_router.get("/your/")
async def list_your_parts(
    crud: Annotated[Crud, Depends(Crud.get)],
    token: Annotated[str, Depends(get_session_token)],
    page: int = Query(description="Page number for pagination"),
    search_query: str = Query(None, description="Search query string"),
) -> tuple[list[Robot], bool]:
    user = await crud.get_user_from_api_key(token)
    return await crud.list_your_robots(user.id, page, search_query=search_query)


@robots_router.post("/add/")
async def add_robot(
    new_robot: NewRobot,
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    id = await crud.get_user_from_api_key(token)

    await crud.add_robot(
        Robot(
            id=str(new_uuid()),
            name=new_robot.name,
            description=new_robot.description,
            bom=new_robot.bom,
            images=new_robot.images,
            height=new_robot.height,
            weight=new_robot.weight,
            degrees_of_freedom=new_robot.degrees_of_freedom,
            owner=str(id),
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
    user = await crud.get_user_from_api_key(token)
    if robot.owner != user.id:
        raise HTTPException(status_code=403, detail="You do not own this robot")
    await crud.delete_robot(robot_id)
    return True


@robots_router.post("/edit-robot/{id}/")
async def edit_robot(
    id: str,
    robot: dict[str, Any],
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    robot_info = await crud.get_robot(id)
    if robot_info is None:
        raise HTTPException(status_code=404, detail="Robot not found")
    user = await crud.get_user_from_api_key(token)
    if robot_info.owner != user.id:
        raise HTTPException(status_code=403, detail="You do not own this robot")
    await crud._update_item(id, Robot, robot)
    return True
