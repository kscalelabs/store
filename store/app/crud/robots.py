"""Defines CRUD interface for robot API."""

import logging

from store.app.crud.base import BaseCrud
from store.app.model import Part, Robot

logger = logging.getLogger(__name__)


class RobotCrud(BaseCrud):
    async def add_robot(self, robot: Robot) -> None:
        table = await self.db.Table("Robots")
        await table.put_item(Item=robot.model_dump())

    async def add_part(self, part: Part) -> None:
        table = await self.db.Table("Parts")
        await table.put_item(Item=part.model_dump())

    async def list_robots(self) -> list[Robot]:
        table = await self.db.Table("Robots")
        return [Robot.model_validate(robot) for robot in (await table.scan())["Items"]]

    async def get_robot(self, robot_id: str) -> Robot | None:
        table = await self.db.Table("Robots")
        robot_dict = await table.get_item(Key={"robot_id": robot_id})
        if "Item" not in robot_dict:
            return None
        return Robot.model_validate(robot_dict["Item"])

    async def delete_robot(self, robot_id: str) -> None:
        table = await self.db.Table("Robots")
        await table.delete_item(Key={"robot_id": robot_id})

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
