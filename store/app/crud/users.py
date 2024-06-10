"""Defines CRUD interface for user API."""

import asyncio
import uuid
import warnings

from store.app.crud.base import BaseCrud
from store.app.crypto import hash_api_key
from store.app.model import ApiKey, User


class UserCrud(BaseCrud):
    async def add_user(self, user: User) -> None:
        # First, add the user email to the UserEmails table.
        table = await self.db.Table("UserEmails")
        await table.put_item(Item={"email": user.email, "user_id": user.user_id})

        # Then, add the user object to the Users table.
        table = await self.db.Table("Users")
        await table.put_item(Item=user.model_dump())

    async def get_user(self, user_id: uuid.UUID) -> User | None:
        table = await self.db.Table("Users")
        user_dict = await table.get_item(Key={"user_id": str(user_id)})
        if "Item" not in user_dict:
            return None
        return User.model_validate(user_dict["Item"])

    async def get_user_from_email(self, email: str) -> User | None:
        # First, query the UesrEmails table to get the user_id.
        table = await self.db.Table("UserEmails")
        user_dict = await table.get_item(Key={"email": email})
        if "Item" not in user_dict:
            return None
        assert isinstance(user_id := user_dict["Item"]["user_id"], str)

        # Then, query the Users table to get the user object.
        return await self.get_user(uuid.UUID(user_id))

    async def get_user_id_from_api_key(self, api_key: uuid.UUID) -> uuid.UUID | None:
        api_key_hash = hash_api_key(api_key)
        user_id = await self.kv.get(api_key_hash)
        if user_id is None:
            return None
        return uuid.UUID(user_id.decode("utf-8"))

    async def delete_user(self, user: User) -> None:
        # First, delete the user email from the UserEmails table.
        table = await self.db.Table("UserEmails")
        await table.delete_item(Key={"email": user.email})

        # Then, delete the user object from the Users table.
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
    # python -m store.app.crud.users
    asyncio.run(test_adhoc())
