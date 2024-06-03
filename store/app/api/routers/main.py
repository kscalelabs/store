"""Defines the main API endpoint."""

import logging
from typing import Union

import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, FastAPI, HTTPException, status
from pydantic import BaseModel

from store.app.api.routers.users import users_router

logging.basicConfig(level = logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

api_router = APIRouter()
api_router.include_router(api_router, prefix="/api")
api_router.include_router(users_router, prefix="/users", tags=["users"])

# Configure your DynamoDB client
# dynamodb = boto3.resource(
#     "dynamodb",
#     region_name="us-east-1",  # Replace with your AWS region
#     aws_access_key_id="something",  # Replace with your AWS access key
#     aws_secret_access_key="something",  # Replace with your AWS secret key
# )
dynamodb = boto3.resource('dynamodb')
# Replace 'Robots' with your DynamoDB table name
# table = dynamodb.Table('Robots')
table = dynamodb.Table("Robots")

class Robot(BaseModel):
    robot_id: str
    name: str
    description: str
    owner: str

@api_router.get("/robots/{robot_id}", response_model=Robot)
async def get_robot(robot_id: str) -> Union[Robot, HTTPException]:
    try:
        response = table.get_item(Key={"robot_id": robot_id})
        if "Item" in response:
            robot = response["Item"]
            return Robot(**robot)
        else:
            raise HTTPException(status_code=404, detail="Robot not found {response} ooga booga")
    except ClientError as e:
        raise HTTPException(status_code=500, detail=e.response["Error"]["Message"])
# @api_router.get("/robots/{robot_id}", response_model=Robot)
# async def get_robot(robot_id: str) -> Union[Robot, HTTPException]:

#     tables = list(dynamodb.tables.all())
#     dbugtables = (f"Connected to DynamoDB. Found tables: {[table.name for table in tables]}")

#     trace = ""
#     try:
#         # Query the DynamoDB table for the item with the specified robot_id
#         table = dynamodb.Table("Robots")
#         response = table.get_item(Key={"robot_id": robot_id})

#         # Log the trace information
#         trace += "Queried table: Robots\n"
#         trace += f"Response: {response}\n"

#         # Check if the item was found in the response
#         if "Item" in response:
#             # Extract the item from the response and create a Robot object
#             robot = response["Item"]
#             return Robot(**robot)
#         else:
#             raise HTTPException(status_code=404, detail=f"Robot not found {response} {trace} {dbugtables} ooga booga")
#     except ClientError:
#         raise HTTPException(status_code=500, detail=dbugtables)
#         #raise HTTPException(status_code=500, detail=e.response["Error"]["Message"])


# Returns a 404 response for all other paths.
@api_router.get("/{path:path}")
async def not_found(path: str) -> dict[str, str]:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endpoint not found")
