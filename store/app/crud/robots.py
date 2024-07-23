"""Defines CRUD interface for robot API."""

import logging

from fastapi import UploadFile

from store.app.crud.base import BaseCrud
from store.app.model import Part, Robot

logger = logging.getLogger(__name__)


class RobotCrud(BaseCrud):
    async def add_robot(self, robot: Robot) -> None:
        await self._add_item(robot)

    async def get_robot(self, robot_id: str) -> Robot | None:
        return await self._get_item(robot_id, Robot, throw_if_missing=False)

    async def delete_robot(self, robot_id: str) -> None:
        await self._delete_item(robot_id)

    async def add_part(self, part: Part) -> None:
        await self._add_item(part)

    async def get_part(self, part_id: str) -> Part | None:
        return await self._get_item(part_id, Part, throw_if_missing=False)

    async def delete_part(self, part_id: str) -> None:
        await self._delete_item(part_id)

    async def dump_parts(self) -> list[Part]:
        return await self._list_items(Part)

    async def list_robots(self, page: int, search_query: str | None = None) -> tuple[list[Robot], bool]:
        return await self._list(Robot, page, lambda x: x.timestamp, search_query)

    async def list_your_robots(self, user_id: str, page: int, search_query: str) -> tuple[list[Robot], bool]:
        return await self._list_your(Robot, user_id, page, lambda x: x.timestamp, search_query)

    async def list_parts(self, page: int, search_query: str | None = None) -> tuple[list[Part], bool]:
        return await self._list(Part, page, lambda x: x.timestamp, search_query)

    async def list_your_parts(self, user_id: str, page: int, search_query: str) -> tuple[list[Part], bool]:
        return await self._list_your(Part, user_id, page, lambda x: x.timestamp, search_query)

    async def upload_image(self, file: UploadFile) -> None:
        await (await self.s3.Bucket("images")).upload_fileobj(file.file, file.filename or "")
