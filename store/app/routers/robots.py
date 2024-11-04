"""Defines the router endpoints for handling Robots."""

from annotated_types import MaxLen
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ValidationError
from typing_extensions import Annotated

from store.app.crud.base import ItemNotFoundError
from store.app.db import Crud
from store.app.model import Robot, User
from store.app.routers.users import (
    get_session_user_with_read_permission,
    get_session_user_with_write_permission,
)

robots_router = APIRouter()


class CreateRobotRequest(BaseModel):
    listing_id: str
    name: Annotated[str, MaxLen(32)]
    description: Annotated[str, MaxLen(2048)] | None = None
    order_id: str | None = None


class UpdateRobotRequest(BaseModel):
    name: Annotated[str, MaxLen(32)] | None = None
    description: Annotated[str, MaxLen(2048)] | None = None
    order_id: str | None = None


@robots_router.post("/create", response_model=Robot)
async def create_robot(
    robot_data: CreateRobotRequest,
    user: User = Depends(get_session_user_with_write_permission),
    crud: Crud = Depends(Crud.get),
) -> Robot:
    """Create a new robot."""
    try:
        # Log the incoming request data for debugging
        print("Received robot data:", robot_data.model_dump())

        robot = await crud.create_robot({"user_id": user.id, **robot_data.model_dump()})
        return robot
    except ItemNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print("Error creating robot:", str(e))  # Log the error for debugging
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@robots_router.get("/get/{robot_id}", response_model=Robot)
async def get_robot(
    robot_id: str,
    user: User = Depends(get_session_user_with_read_permission),
    crud: Crud = Depends(Crud.get),
) -> Robot:
    """Get a specific robot."""
    try:
        robot = await crud.get_robot(robot_id)
        if robot.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this robot")
        return robot
    except ItemNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Robot not found")


@robots_router.get("/list", response_model=list[Robot])
async def list_user_robots(
    user: User = Depends(get_session_user_with_read_permission),
    crud: Crud = Depends(Crud.get),
) -> list[Robot]:
    """List all robots for the current user."""
    robots = await crud.get_robots_by_user_id(user.id)
    return robots


@robots_router.put("/update/{robot_id}", response_model=Robot)
async def update_robot(
    robot_id: str,
    update_data: UpdateRobotRequest,
    user: User = Depends(get_session_user_with_write_permission),
    crud: Crud = Depends(Crud.get),
) -> Robot:
    """Update a robot's information."""
    try:
        robot = await crud.get_robot(robot_id)
        if robot.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this robot")

        updated_robot = await crud.update_robot(robot_id, update_data.model_dump(exclude_unset=True))
        return updated_robot
    except ItemNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Robot not found")


@robots_router.delete("/delete/{robot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_robot(
    robot_id: str,
    user: User = Depends(get_session_user_with_write_permission),
    crud: Crud = Depends(Crud.get),
) -> None:
    """Delete a robot."""
    try:
        robot = await crud.get_robot(robot_id)
        if not robot:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Robot not found")
        if robot.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this robot")

        await crud.delete_robot(robot)
    except ItemNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Robot not found")


@robots_router.get("/check-order/{order_id}", response_model=Robot | None)
async def check_order_robot(
    order_id: str,
    user: User = Depends(get_session_user_with_read_permission),
    crud: Crud = Depends(Crud.get),
) -> Robot | None:
    """Check if an order has an associated robot."""
    try:
        # First verify the order belongs to the user
        order = await crud.get_order(order_id)
        if not order or order.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        # Then check for an associated robot
        robot = await crud.get_robot_by_order_id(order_id)
        return robot
    except ItemNotFoundError:
        return None
