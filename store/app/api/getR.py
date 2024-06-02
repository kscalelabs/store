# from typing import Union

# import boto3
# from botocore.exceptions import ClientError
# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel

# app = FastAPI()

# # Configure your DynamoDB client
# dynamodb = boto3.resource(
#     "dynamodb",
#     region_name="us-east-1",  # Replace with your AWS region
#     aws_access_key_id="test",  # Replace with your AWS access key
#     aws_secret_access_key="test",  # Replace with your AWS secret key
# )

# # Replace 'Robots' with your DynamoDB table name
# table = dynamodb.Table("Robots")


# class Robot(BaseModel):
#     robot_id: str
#     name: str
#     description: str
#     owner: str


# @app.get("/robots/{robot_id}", response_model=Robot)
# async def get_robot(robot_id: str) -> Union[Robot, HTTPException]:
#     try:
#         response = table.get_item(Key={"robot_id": robot_id})
#         if "Item" in response:
#             robot = response["Item"]
#             return Robot(**robot)
#         else:
#             raise HTTPException(status_code=404, detail="Robot not found")
#     except ClientError as e:
#         raise HTTPException(status_code=500, detail=e.response["Error"]["Message"])
