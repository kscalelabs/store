"""Defines base tools for interacting with the database."""

import argparse
import asyncio
import logging
from typing import AsyncGenerator, Self

from store.app.crud.base import BaseCrud
from store.app.crud.robots import RobotCrud
from store.app.crud.users import UserCrud

TABLE_NAME = "Robolist"


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


async def create_tables(crud: Crud | None = None, deletion_protection: bool = False) -> None:
    """Initializes all of the database tables.

    Args:
        crud: The top-level CRUD class.
        deletion_protection: Whether to enable deletion protection on the tables.
    """
    logging.basicConfig(level=logging.INFO)

    if crud is None:
        async with Crud() as new_crud:
            await create_tables(new_crud)

    else:
        await crud._create_dynamodb_table(
            name=TABLE_NAME,
            keys=[
                ("id", "S", "HASH"),
            ],
            gsis=crud.get_gsis(),
            deletion_protection=deletion_protection,
        )


async def delete_tables(crud: Crud | None = None) -> None:
    """Deletes all of the database tables.

    Args:
        crud: The top-level CRUD class.
    """
    logging.basicConfig(level=logging.INFO)

    if crud is None:
        async with Crud() as new_crud:
            await delete_tables(new_crud)

    else:
        await crud._delete_dynamodb_table(TABLE_NAME)


async def populate_with_dummy_data(crud: Crud | None = None) -> None:
    """Populates the database with dummy data.

    Args:
        crud: The top-level CRUD class.
    """
    if crud is None:
        async with Crud() as new_crud:
            await populate_with_dummy_data(new_crud)

    else:
        raise NotImplementedError("This function is not yet implemented.")


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["create", "delete", "populate"])
    args = parser.parse_args()

    async with Crud() as crud:
        match args.action:
            case "create":
                await create_tables(crud)
            case "delete":
                await delete_tables(crud)
            case "populate":
                await populate_with_dummy_data(crud)
            case _:
                raise ValueError(f"Invalid action: {args.action}")


if __name__ == "__main__":
    # python -m store.app.db
    asyncio.run(main())
