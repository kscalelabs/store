# mypy: disable-error-code="empty-body"
"""Defines base tools for interacting with the database."""

import asyncio

from store.app.api.crud.base import BaseCrud
from store.app.api.crud.users import UserCrud


class Crud(
    UserCrud,
    BaseCrud,
):
    """Composes the various CRUD classes into a single class."""


async def create_tables(crud: Crud | None = None) -> None:
    """Initializes all of the database tables.

    Args:
        crud: The top-level CRUD class.
    """
    if crud is None:
        async with Crud() as crud:
            await create_tables(crud)
    else:
        await crud._create_dynamodb_table(
            name="Users",
            columns=[
                ("user_id", "S"),
            ],
            pks=[
                ("user_id", "HASH"),
            ],
        )


if __name__ == "__main__":
    # python -m store.app.api.db
    asyncio.run(create_tables())
