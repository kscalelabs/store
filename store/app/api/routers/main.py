"""Defines the main API endpoint."""

import logging
from typing import Dict, List

import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from store.app.api.routers.users import users_router
from store.settings import settings

logger = logging.getLogger(__name__)

app = FastAPI()

api_router = APIRouter()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.site.homepage],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)
app.include_router(api_router, prefix="/api")
api_router.include_router(users_router, prefix="/users", tags=["users"])


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


class PurchaseLink(BaseModel):
    url: str
    price: int
    name: str


class UsedBy(BaseModel):
    name: str
    id: str
    stars: int


class Part(BaseModel):
    name: str
    owner: str
    description: str
    images: List[Image]
    part_id: str
    used_by: List[UsedBy]
    purchase_links: List[PurchaseLink]


@api_router.options("/add_robot/")
async def options_add_robot() -> Dict[str, str]:
    return {"message": "Options request allowed"}


def verify_table_exists(table_name: str) -> bool:
    try:
        table_names = [table.name for table in dynamodb.tables.all()]
        logger.debug(f"Found tables: {table_names}")
        return table_name in table_names
    except Exception as e:
        logger.error(f"Error checking table existence: {e}")
        return False


@api_router.get("/robots")
async def list_robots() -> List[Robot]:
    trace = ""
    try:
        if not verify_table_exists("Robots"):
            raise HTTPException(status_code=404, detail="Table not found")

        table = dynamodb.Table("Robots")
        response = table.scan()

        trace += "Scanned table: Robots\n"
        trace += f"ResponseMetadata: {response['ResponseMetadata']}\n"
        trace += f"Full Response: {response}\n"

        if "Items" in response:
            robots = response["Items"]
            return [Robot(**robot) for robot in robots]
        else:
            raise HTTPException(status_code=404, detail=f"No robots found. Trace: {trace}")

    except ClientError as e:
        trace += f"ClientError: {e.response['Error']['Message']}\n"
        raise HTTPException(status_code=500, detail=f"Internal server error. Trace: {trace}")


@api_router.get("/robots/{robot_id}")
async def get_robot(robot_id: str) -> Robot:
    try:
        table = dynamodb.Table("Robots")
        response = table.get_item(Key={"robot_id": robot_id})
        # response = table.scan()
        if "Item" in response:
            robot = response["Item"]
            return Robot(**robot)
        else:
            raise HTTPException(status_code=404, detail="Robot not found")
    except ClientError as e:
        raise HTTPException(status_code=500, detail=e.response["Error"]["Message"])


@api_router.get("/parts/{part_id}")
async def get_part(part_id: str) -> Part:
    try:
        table = dynamodb.Table("Parts")
        response = table.get_item(Key={"part_id": part_id})
        # response = table.scan()
        if "Item" in response:
            part = response["Item"]
            return Part(**part)
        else:
            raise HTTPException(status_code=404, detail="Part not found")
    except ClientError as e:
        raise HTTPException(status_code=500, detail=e.response["Error"]["Message"])


@api_router.get("/parts")
async def list_parts() -> List[Part]:
    trace = ""
    try:
        if not verify_table_exists("Parts"):
            raise HTTPException(status_code=404, detail="Table not found")

        table = dynamodb.Table("Parts")
        response = table.scan()

        trace += "Scanned table: Parts\n"
        trace += f"ResponseMetadata: {response['ResponseMetadata']}\n"
        trace += f"Full Response: {response}\n"

        if "Items" in response:
            parts = response["Items"]
            return [Part(**part) for part in parts]
        else:
            raise HTTPException(status_code=404, detail=f"No parts found. Trace: {trace}")

    except ClientError as e:
        trace += f"ClientError: {e.response['Error']['Message']}\n"
        raise HTTPException(status_code=500, detail=f"Internal server error. Trace: {trace}")


@api_router.post("/add_robot/")
async def add_robot(robot: Robot) -> Dict[str, str]:
    table = dynamodb.Table("Robots")
    try:
        table.put_item(Item=robot.dict())
        return {"message": "Robot added successfully"}
    except ClientError as e:
        raise HTTPException(status_code=500, detail=e.response["Error"]["Message"])


# Returns a 404 response for all other paths.
@api_router.get("/{path:path}")
async def not_found(path: str) -> dict[str, str]:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endpoint not found")
