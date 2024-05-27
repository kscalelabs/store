"""Defines CRUD interface for user API."""

import asyncio

from types_aiobotocore_dynamodb.service_resource import DynamoDBServiceResource

from store.app.api.db import get_aio_db
from store.app.api.model import Token, User


async def add_user(user: User, db: DynamoDBServiceResource) -> None:
    """Adds a user to the database.

    Args:
        user: The user to add.
        db: The DynamoDB database.
    """
    table = await db.Table("Users")
    await table.put_item(Item=user.model_dump())


async def get_user(user_id: str, db: DynamoDBServiceResource) -> User:
    """Gets a user from the database.

    Args:
        user_id: The ID of the user to retrieve.
        db: The DynamoDB database.
    """
    table = await db.Table("Users")
    user_dict = await table.get_item(Key={"user_id": user_id})
    user = User.model_validate(user_dict["Item"])
    return user


async def get_user_count(db: DynamoDBServiceResource) -> int:
    """Counts the users in the database.

    Args:
        db: The DynamoDB database.
    """
    table = await db.Table("Users")
    return await table.item_count


async def add_token(token: Token, db: DynamoDBServiceResource) -> None:
    """Adds a token to the database.

    Args:
        token: The token to add.
        db: The DynamoDB database.
    """
    table = await db.Table("UserTokens")
    await table.put_item(Item=token.model_dump())


async def get_token(token_id: str, db: DynamoDBServiceResource) -> Token:
    """Gets a token from the database.

    Args:
        token_id: The ID of the token to retrieve.
        db: The DynamoDB database.
    """
    table = await db.Table("UserTokens")
    token_dict = await table.get_item(Key={"token_id": token_id})
    token = Token.model_validate(token_dict["Item"])
    return token


async def test_adhoc() -> None:
    async with get_aio_db() as db:
        await add_user(User(user_id="ben", email="ben@kscale.dev"), db)
        # print(await get_user("ben", db))
        # print(await get_user_count(db))
        # await get_token("ben", db)


if __name__ == "__main__":
    # python -m store.app.api.crud.users
    asyncio.run(test_adhoc())
