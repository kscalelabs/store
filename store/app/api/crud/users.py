"""Defines CRUD interface for user API."""

import asyncio
import uuid
import warnings

from boto3.dynamodb.conditions import Key as KeyCondition

from store.app.api.crud.base import BaseCrud
from store.app.api.crypto import hash_api_key
from store.app.api.model import ApiKey, User


class UserCrud(BaseCrud):
    async def add_user(self, user: User) -> None:
        table = await self.db.Table("Users")
        await table.put_item(Item=user.model_dump())

    async def get_user(self, user_id: uuid.UUID) -> User | None:
        table = await self.db.Table("Users")
        user_dict = await table.get_item(Key={"user_id": str(user_id)})
        if "Item" not in user_dict:
            return None
        return User.model_validate(user_dict["Item"])

    async def get_user_from_email(self, email: str) -> User | None:
        table = await self.db.Table("Users")
        user_dict = await table.query(IndexName="emailIndex", KeyConditionExpression=KeyCondition("email").eq(email))
        items = user_dict["Items"]
        if len(items) == 0:
            return None
        if len(items) > 1:
            raise ValueError(f"Multiple users found with email {email}")
        return User.model_validate(items[0])

    async def get_user_id_from_api_key(self, api_key: uuid.UUID) -> uuid.UUID | None:
        api_key_hash = hash_api_key(api_key)
        user_id = await self.kv.get(api_key_hash)
        if user_id is None:
            return None
        return uuid.UUID(user_id.decode("utf-8"))

    async def delete_user(self, user: User) -> None:
        table = await self.db.Table("Users")
        await table.delete_item(Key={"user_id": user.user_id})

    async def list_users(self) -> list[User]:
        warnings.warn("`list_users` probably shouldn't be called in production", ResourceWarning)
        table = await self.db.Table("Users")
        return [User.model_validate(user) for user in await table.scan()]

    async def get_user_count(self) -> int:
        table = await self.db.Table("Users")
        return await table.item_count

    async def add_api_key(self, api_key: uuid.UUID, user_id: uuid.UUID, lifetime: int) -> None:
        row = ApiKey.from_api_key(api_key, user_id, lifetime)
        await self.kv.setex(row.api_key_hash, row.lifetime, row.user_id)

    async def check_api_key(self, api_key: uuid.UUID, user_id: uuid.UUID) -> bool:
        row = await self.kv.get(hash_api_key(api_key))
        return row is not None and row == user_id

    async def delete_api_key(self, api_key: uuid.UUID) -> None:
        await self.kv.delete(hash_api_key(api_key))


async def test_adhoc() -> None:
    async with UserCrud() as crud:
        await crud.add_user(User(user_id=str(uuid.uuid4()), email="ben@kscale.dev"))


if __name__ == "__main__":
    # python -m store.app.api.crud.users
    asyncio.run(test_adhoc())
