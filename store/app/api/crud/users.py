"""Defines CRUD interface for user API."""

import asyncio

from types_aiobotocore_dynamodb.service_resource import DynamoDBServiceResource

from store.app.api.db import get_db
from store.app.api.model import Token, User


async def add_user(user: User, db: DynamoDBServiceResource) -> None:
    table = await db.Table("Users")
    await table.put_item(Item=user.model_dump())


async def get_user(email: str, db: DynamoDBServiceResource) -> User | None:
    table = await db.Table("Users")
    user_dict = await table.get_item(Key={"email": email})
    if "Item" not in user_dict:
        return None
    user = User.model_validate(user_dict["Item"])
    return user


async def delete_user(user: User, db: DynamoDBServiceResource) -> None:
    raise NotImplementedError


# async def list_users(db: DynamoDBServiceResource) -> list[User]:
#     """Lists all users in the database.

#     Args:
#         db: The DynamoDB database.
#     """
#     table = await db.Table("Users")
#     users = [User.model_validate(user) for user in await table.scan()]
#     return users


async def get_user_count(db: DynamoDBServiceResource) -> int:
    table = await db.Table("Users")
    return await table.item_count


async def add_token(token: Token, db: DynamoDBServiceResource) -> None:
    table = await db.Table("UserTokens")
    await table.put_item(Item=token.model_dump())


async def get_token(email: str, ip_addr: str, db: DynamoDBServiceResource) -> Token | None:
    table = await db.Table("UserTokens")
    token_dict = await table.get_item(Key={"email": email, "ip_addr": ip_addr})
    if "Item" not in token_dict:
        return None
    token = Token.model_validate(token_dict["Item"])
    return token


async def test_adhoc() -> None:
    async with get_db() as db:
        await add_user(User(email="ben@kscale.dev"), db)
        # print(await get_user("ben", db))
        # print(await get_user_count(db))
        # await get_token("ben", db)


if __name__ == "__main__":
    # python -m store.app.api.crud.users
    asyncio.run(test_adhoc())
