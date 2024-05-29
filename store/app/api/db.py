"""Defines base tools for interacting with the database."""

import asyncio
from typing import AsyncGenerator, Self

from store.app.api.crud.base import BaseCrud
from store.app.api.crud.users import UserCrud


class Crud(
    UserCrud,
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
    if crud is None:
        async with Crud() as crud:
            await create_tables(crud)

    else:
        await asyncio.gather(
            crud._create_dynamodb_table(
                name="Users",
                keys=[
                    ("id", "S", "HASH"),
                ],
            ),
            crud._create_dynamodb_table(
                name="Tokens",
                keys=[
                    ("id", "S", "HASH"),
                ],
            ),
            crud._create_dynamodb_table(
                name="Robots",
                keys=[
                    ("id", "S", "HASH"),
                ]
            )
        )


if __name__ == "__main__":
    # python -m store.app.api.db
    asyncio.run(create_tables())
