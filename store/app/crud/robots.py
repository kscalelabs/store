"""Defines CRUD interface for robot API."""

import logging
from typing import List, Optional

from fastapi import UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from boto3.dynamodb.conditions import Key


from store.app.crud.base import BaseCrud
from store.app.model import Bom, Image, Part, Robot

logger = logging.getLogger(__name__)


class EditRobot(BaseModel):
    name: str
    description: str
    bom: List[Bom]
    images: List[Image]
    height: Optional[str]
    weight: Optional[str]
    degrees_of_freedom: Optional[str]


def serialize_bom(bom: Bom) -> dict:
    return {"part_id": bom.part_id, "quantity": str(bom.quantity)}


def serialize_bom_list(bom_list: List[Bom]) -> List[dict]:
    return [serialize_bom(bom) for bom in bom_list]


def serialize_image(image: Image) -> dict:
    return {"caption": image.caption, "url": image.url}


def serialize_image_list(image_list: List[Image]) -> List[dict]:
    return [serialize_image(image) for image in image_list]


class RobotCrud(BaseCrud):
    async def add_robot(self, robot: Robot) -> None:
        table = await self.db.Table("Robots")
        await table.put_item(Item=robot.model_dump())

    async def add_part(self, part: Part) -> None:
        table = await self.db.Table("Parts")
        await table.put_item(Item=part.model_dump())

    async def list_robots(self, page: int = 1, items_per_page: int = 18) -> tuple[list[Robot], bool]:
        table = await self.db.Table("Robots")
        response = await table.scan()
        return [
            Robot.model_validate(item)
            for item in response["Items"][(page - 1) * items_per_page : page * items_per_page]
        ], page * items_per_page < response["Count"]

    async def list_your_robots(self, user_id: str, page: int = 1, items_per_page: int = 18) -> tuple[list[Robot], bool]:
        table = await self.db.Table("Robots")
        response = await table.query(IndexName="ownerIndex", KeyConditionExpression=Key("owner").eq(user_id))
        return [
            Robot.model_validate(item)
            for item in response["Items"][(page - 1) * items_per_page : page * items_per_page]
        ], page * items_per_page < response["Count"]

    async def get_robot(self, robot_id: str) -> Robot | None:
        table = await self.db.Table("Robots")
        robot_dict = await table.get_item(Key={"robot_id": robot_id})
        if "Item" not in robot_dict:
            return None
        return Robot.model_validate(robot_dict["Item"])

    async def list_parts(self) -> list[Part]:
        table = await self.db.Table("Parts")
        return [Part.model_validate(part) for part in (await table.scan())["Items"]]

    async def get_part(self, part_id: str) -> Part | None:
        table = await self.db.Table("Parts")
        part_dict = await table.get_item(Key={"part_id": part_id})
        if "Item" not in part_dict:
            return None
        return Part.model_validate(part_dict["Item"])

    async def delete_part(self, part_id: str) -> None:
        table = await self.db.Table("Parts")
        await table.delete_item(Key={"part_id": part_id})

    async def delete_robot(self, robot_id: str) -> None:
        table = await self.db.Table("Robots")
        await table.delete_item(Key={"robot_id": robot_id})

    async def update_part(self, part: Part) -> None:
        await self.delete_part(part.part_id)
        await self.add_part(part)

    async def update_robot(self, id: str, robot: EditRobot) -> None:
        table = await self.db.Table("Robots")
        update_expression = "SET #name = :name, \
            #description = :description, \
            #bom = :bom, \
            #images = :images, "

        expression_attribute_names = {
            "#name": "name",
            "#description": "description",
            "#bom": "bom",
            "#images": "images",
        }

        expression_attribute_values = {
            ":name": robot.name,
            ":description": robot.description,
            ":bom": serialize_bom_list(robot.bom),
            ":images": serialize_image_list(robot.images),
        }

        if robot.height:
            update_expression += "#height = :height, "
            expression_attribute_names["#height"] = "height"
            expression_attribute_values[":height"] = robot.height

        if robot.weight:
            update_expression += "#weight = :weight, "
            expression_attribute_names["#weight"] = "weight"
            expression_attribute_values[":weight"] = robot.weight

        if robot.degrees_of_freedom:
            update_expression += "#degrees_of_freedom = :degrees_of_freedom, "
            expression_attribute_names["#degrees_of_freedom"] = "degrees_of_freedom"
            expression_attribute_values[":degrees_of_freedom"] = robot.degrees_of_freedom

        await table.update_item(
            Key={"robot_id": id},
            UpdateExpression=update_expression[:-2],
            ExpressionAttributeValues=expression_attribute_values,
            ExpressionAttributeNames=expression_attribute_names,
            ReturnValues="NONE",
        )

    async def get_image(self, url: str) -> StreamingResponse:
        s3_object = await (await (await self.s3.Bucket("images")).Object(url)).get()
        file_stream = s3_object["Body"]
        return StreamingResponse(content=file_stream, media_type="image/png")

    async def upload_image(self, file: UploadFile) -> None:
        await (await self.s3.Bucket("images")).upload_fileobj(file.file, file.filename or "")
