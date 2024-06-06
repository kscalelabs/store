"""Defines CRUD interface for robot API."""

from store.app.api.crud.base import BaseCrud
from store.app.api.model import Robot


class RobotCrud(BaseCrud):
    async def add_robot(self, robot: Robot) -> None:
        table = await self.db.Table("Robots")
        await table.put_item(Item=robot.model_dump())
