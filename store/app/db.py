"""Defines base tools for interacting with the database."""

import asyncio
import logging
from typing import AsyncGenerator, Self

from store.app.crud.base import BaseCrud
from store.app.crud.robots import RobotCrud
from store.app.crud.users import UserCrud


class Crud(
    UserCrud,
    RobotCrud,
    BaseCrud,
):
    """Composes the various CRUD classes into a single class."""

    @classmethod
    async def get(cls) -> AsyncGenerator[Self, None]:
        async with cls() as crud:
            yield crud


async def create_tables(crud: Crud | None = None) -> None:
    """Initializes all of the database tables.

    Args:
        crud: The top-level CRUD class.
    """
    logging.basicConfig(level=logging.INFO)

    if crud is None:
        async with Crud() as crud:
            await create_tables(crud)

    else:
        await crud._create_dynamodb_table(
            name="Users",
            keys=[
                ("user_id", "S", "HASH"),
            ],
            gsis=[
                ("emailIndex", "email", "S", "HASH"),
            ],
        )
        await crud._create_dynamodb_table(
            name="Robots",
            keys=[
                ("robot_id", "S", "HASH"),
            ],
            gsis=[
                ("ownerIndex", "owner", "S", "HASH"),
                ("nameIndex", "name", "S", "HASH"),
            ],
        )
        await crud._create_dynamodb_table(
            name="Parts",
            keys=[
                ("part_id", "S", "HASH"),
            ],
            gsis=[
                ("ownerIndex", "owner", "S", "HASH"),
                ("nameIndex", "name", "S", "HASH"),
            ],
        )


if __name__ == "__main__":
    # python -m store.app.db
    asyncio.run(create_tables())
