"""Defines CRUD interface for user API."""

import asyncio
import uuid
import warnings

from boto3.dynamodb.conditions import Key as KeyCondition

from store.app.api.crud.base import BaseCrud
from store.app.api.model import Token, User


class UserCrud(BaseCrud):
    async def add_user(self, user: User) -> None:
        table = await self.db.Table("Users")
        await table.put_item(Item=user.model_dump())

    async def get_user(self, email: str) -> User | None:
        table = await self.db.Table("Users")
        user_dict = await table.query(IndexName="emailIndex", KeyConditionExpression=KeyCondition("email").eq(email))
        items = user_dict["Items"]
        if len(items) == 0:
            return None
        if len(items) > 1:
            raise ValueError(f"Multiple users found with email {email}")
        user = User.model_validate(items[0])
        return user

    async def delete_user(self, user: User) -> None:
        table = await self.db.Table("Users")
        await table.delete_item(Key={"id": user.user_id})

    async def list_users(self) -> list[User]:
        warnings.warn("`list_users` probably shouldn't be called in production", ResourceWarning)
        table = await self.db.Table("Users")
        users = [User.model_validate(user) for user in await table.scan()]
        return users

    async def get_user_count(self) -> int:
        table = await self.db.Table("Users")
        return await table.item_count

    async def add_token(self, token: Token) -> None:
        table = await self.db.Table("Tokens")
        await table.put_item(Item=token.model_dump())

    async def get_token(self, email: str) -> Token | None:
        table = await self.db.Table("Tokens")
        token_dict = await table.query(IndexName="emailIndex", KeyConditionExpression=KeyCondition("email").eq(email))
        if len(token_dict["Items"]) == 0:
            return None
        token = Token.model_validate(token_dict["Items"][0])
        return token


async def test_adhoc() -> None:
    async with UserCrud() as crud:
        await crud.add_user(User(user_id=str(uuid.uuid4()), email="ben@kscale.dev"))


if __name__ == "__main__":
    # python -m store.app.api.crud.users
    asyncio.run(test_adhoc())
