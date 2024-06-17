"""Defines base tools for interacting with the database."""

import argparse
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


async def create_tables(crud: Crud | None = None, deletion_protection: bool = False) -> None:
    """Initializes all of the database tables.

    Args:
        crud: The top-level CRUD class.
        deletion_protection: Whether to enable deletion protection on the tables.
    """
    logging.basicConfig(level=logging.INFO)

    if crud is None:
        async with Crud() as crud:
            await create_tables(crud)

    else:
        await asyncio.gather(
            crud._create_dynamodb_table(
                name="Users",
                keys=[
                    ("user_id", "S", "HASH"),
                ],
                gsis=[
                    ("emailIndex", "email", "S", "HASH"),
                    ("usernameIndex", "username", "S", "HASH"),
                ],
                deletion_protection=deletion_protection,
            ),
            crud._create_dynamodb_table(
                name="Robots",
                keys=[
                    ("robot_id", "S", "HASH"),
                ],
                gsis=[
                    ("ownerIndex", "owner", "S", "HASH"),
                    ("nameIndex", "name", "S", "HASH"),
                ],
                deletion_protection=deletion_protection,
            ),
            crud._create_dynamodb_table(
                name="Parts",
                keys=[
                    ("part_id", "S", "HASH"),
                ],
                gsis=[
                    ("ownerIndex", "owner", "S", "HASH"),
                    ("nameIndex", "name", "S", "HASH"),
                ],
                deletion_protection=deletion_protection,
            ),
        )


async def delete_tables(crud: Crud | None = None) -> None:
    """Deletes all of the database tables.

    Args:
        crud: The top-level CRUD class.
    """
    logging.basicConfig(level=logging.INFO)

    if crud is None:
        async with Crud() as crud:
            await delete_tables(crud)

    else:
        await asyncio.gather(
            crud._delete_dynamodb_table("Users"),
            crud._delete_dynamodb_table("Robots"),
            crud._delete_dynamodb_table("Parts"),
        )


async def populate_with_dummy_data(crud: Crud | None = None) -> None:
    """Populates the database with dummy data.

    Args:
        crud: The top-level CRUD class.
    """
    if crud is None:
        async with Crud() as crud:
            await populate_with_dummy_data(crud)

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
