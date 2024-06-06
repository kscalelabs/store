"""Defines the main API endpoint."""

import logging
from typing import Annotated, Dict, List

from fastapi import APIRouter, Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from store.app.api.crypto import get_new_user_id
from store.app.api.db import Crud
from store.app.api.routers.users import users_router
from store.settings import settings

logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.site.homepage],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

api_router = APIRouter()

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


@api_router.options("/add/robot/")
async def options_add_robot() -> Dict[str, str]:
    return {"message": "Options request allowed"}


async def verify_table_exists(table_name: str, crud: Crud) -> bool:
    try:
        table_names = [table.name for table in await crud.db.tables.all()]
        logger.debug(f"Found tables: {table_names}")
        return table_name in table_names
    except Exception as e:
        logger.error(f"Error checking table existence: {e}")
        return False


@api_router.get("/robots")
async def list_robots(crud: Annotated[Crud, Depends(Crud.get)]) -> List[Robot]:
    trace = ""
    if not verify_table_exists("Robots", crud):
        raise HTTPException(status_code=404, detail="Table not found")

    table = await crud.db.Table("Robots")
    response = await table.scan()

    trace += "Scanned table: Robots\n"
    trace += f"ResponseMetadata: {response['ResponseMetadata']}\n"
    trace += f"Full Response: {response}\n"

    if "Items" in response:
        robots = response["Items"]
        return [Robot.model_validate(robot) for robot in robots]
    else:
        raise HTTPException(status_code=404, detail=f"No robots found. Trace: {trace}")


@api_router.get("/robots/{robot_id}")
async def get_robot(robot_id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> Robot:
    table = await crud.db.Table("Robots")
    response = await table.get_item(Key={"robot_id": robot_id})
    if "Item" in response:
        return Robot.model_validate(response["Item"])
    else:
        raise HTTPException(status_code=404, detail="Robot not found")


@api_router.get("/parts/{part_id}")
async def get_part(part_id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> Part:
    table = await crud.db.Table("Parts")
    response = await table.get_item(Key={"part_id": part_id})
    if "Item" in response:
        return Part.model_validate(response["Item"])
    else:
        raise HTTPException(status_code=404, detail="Part not found")


@api_router.get("/parts")
async def list_parts(crud: Annotated[Crud, Depends(Crud.get)]) -> List[Part]:
    trace = ""
    if not verify_table_exists("Parts", crud):
        raise HTTPException(status_code=404, detail="Table not found")

    table = await crud.db.Table("Parts")
    response = await table.scan()

    trace += "Scanned table: Parts\n"
    trace += f"ResponseMetadata: {response['ResponseMetadata']}\n"
    trace += f"Full Response: {response}\n"

    if "Items" in response:
        parts = response["Items"]
        return [Part.model_validate(part) for part in parts]
    else:
        raise HTTPException(status_code=404, detail=f"No parts found. Trace: {trace}")


@api_router.post("/add/robot/")
async def add_robot(api_key: str, robot: Robot, crud: Annotated[Crud, Depends(Crud.get)]) -> bool:
    user_id = await crud.get_user_id_from_api_key(api_key)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Must be logged in to add a robot")
    robot.owner = str(user_id)
    robot.robot_id = str(get_new_user_id())
    await crud.add_robot(robot)
    return True


# Returns a 404 response for all other paths.
@api_router.get("/{path:path}")
async def not_found(path: str) -> dict[str, str]:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endpoint not found")
