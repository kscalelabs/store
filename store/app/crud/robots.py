"""Defines CRUD interface for robot API."""

import logging

from fastapi import UploadFile

from store.app.crud.base import BaseCrud
from store.app.model import Part, Robot

logger = logging.getLogger(__name__)


class RobotCrud(BaseCrud):
    items_per_page = 12

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

    async def list_parts(self, page: int, search_query: str | None = None) -> tuple[list[Part], bool]:
        if search_query:
            response = await self._list_items(
                Part,
                filter_expression="contains(#part_name, :query) OR contains(description, :query)",
                expression_attribute_names={"#part_name": "name"},
                expression_attribute_values={":query": search_query},
            )
        else:
            response = await self._list_items(Part)
        sorted_items = sorted(response, key=lambda part: part.timestamp, reverse=True)
        return sorted_items[
            (page - 1) * self.items_per_page : page * self.items_per_page
        ], page * self.items_per_page < len(response)

    async def list_your_parts(self, user_id: str, page: int, search_query: str) -> tuple[list[Part], bool]:
        if search_query:
            response = await self._list_items(
                Part,
                filter_expression="(contains(#part_name, :query) OR contains(description, :query)) AND user_id=:user_id",
                expression_attribute_names={"#part_name": "name"},
                expression_attribute_values={":query": search_query, ":user_id": user_id},
            )
        else:
            response = await self._list_items(
                Part, filter_expression="user_id=:user_id", expression_attribute_values={":user_id": user_id}
            )
        sorted_items = sorted(response, key=lambda part: part.timestamp, reverse=True)
        return sorted_items[
            (page - 1) * self.items_per_page : page * self.items_per_page
        ], page * self.items_per_page < len(response)

    async def upload_image(self, file: UploadFile) -> None:
        raise NotImplementedError()
