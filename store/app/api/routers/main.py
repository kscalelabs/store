"""Defines the main API endpoint."""

import logging
from typing import List

import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from store.app.api.routers.users import users_router

logger = logging.getLogger(__name__)

api_router = APIRouter()

api_router.include_router(users_router, prefix="/users", tags=["users"])

# dynamodb = boto3.resource("dynamodb", endpoint_url="http://localhost:8000")

dynamodb = boto3.resource("dynamodb")


class Bom(BaseModel):
    id: str
    name: str
    quantity: int
    price: int


class Image(BaseModel):
    caption: str
    url: str


class Robot(BaseModel):
    name: str
    owner: str
    description: str
    bom: List[Bom]
    images: List[Image]
    robot_id: str


@api_router.get("/robots/{robot_id}")
async def get_robot(robot_id: str) -> Robot:
    debug = list(dynamodb.tables.all())
    test = ""
    try:
        table = dynamodb.Table("Robots")
        response = table.get_item(Key={"robot_id": robot_id})
        # response = table.scan()
        if "Item" in response:
            robot = response["Item"]
            return Robot(**robot)
        else:
            raise HTTPException(
                status_code=404, detail=f"Robot not {test} found {response} {table} ooga {robot_id} booga"
            )
    except ClientError as e:
        raise HTTPException(status_code=500, detail=e.response["Error"]["Message"])


# Returns a 404 response for all other paths.
@api_router.get("/{path:path}")
async def not_found(path: str) -> dict[str, str]:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endpoint not found")
