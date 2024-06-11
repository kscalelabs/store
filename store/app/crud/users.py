"""Defines CRUD interface for user API."""

import asyncio
import warnings

from boto3.dynamodb.conditions import Key

from store.app.crud.base import BaseCrud
from store.app.crypto import hash_token
from store.app.model import User


class UserCrud(BaseCrud):
    async def add_user(self, user: User) -> None:
        # Then, add the user object to the Users table.
        table = await self.db.Table("Users")
        await table.put_item(Item=user.model_dump(), ConditionExpression="attribute_not_exists(user_id)")

    async def get_user(self, user_id: str) -> User | None:
        table = await self.db.Table("Users")
        user_dict = await table.get_item(Key={"user_id": user_id})
        if "Item" not in user_dict:
            return None
        return User.model_validate(user_dict["Item"])

    async def get_user_from_email(self, email: str) -> User | None:
        table = await self.db.Table("Users")
        user_dict = await table.query(
            IndexName="emailIndex",
            KeyConditionExpression=Key("email").eq(email),
        )
        items = user_dict["Items"]
        if len(items) == 0:
            return None
        if len(items) > 1:
            raise ValueError(f"Multiple users found with email {email}")
        return User.model_validate(items[0])

    async def get_user_id_from_session_token(self, session_token: str) -> str | None:
        user_id = await self.session_kv.get(hash_token(session_token))
        if user_id is None:
            return None
        return user_id.decode("utf-8")

    async def delete_user(self, user_id: str) -> None:
        # Then, delete the user object from the Users table.
        table = await self.db.Table("Users")
        await table.delete_item(Key={"user_id": user_id})

    async def list_users(self) -> list[User]:
        warnings.warn("`list_users` probably shouldn't be called in production", ResourceWarning)
        table = await self.db.Table("Users")
        return [User.model_validate(user) for user in await table.scan()]

    async def get_user_count(self) -> int:
        table = await self.db.Table("Users")
        return await table.item_count

    async def add_session_token(self, token: str, user_id: str, lifetime: int) -> None:
        await self.session_kv.setex(hash_token(token), lifetime, user_id)

    async def delete_session_token(self, token: str) -> None:
        await self.session_kv.delete(hash_token(token))

    async def add_verify_email_token(self, token: str, user_id: str, lifetime: int) -> None:
        await self.verify_email_kv.setex(hash_token(token), lifetime, user_id)

    async def delete_verify_email_token(self, token: str) -> None:
        await self.verify_email_kv.delete(hash_token(token))

    async def check_verify_email_token(self, token: str) -> None:
        id = await self.verify_email_kv.get(hash_token(token))
        if id is None:
            raise ValueError("Token not found")
        await (await self.db.Table("Users")).update_item(
            Key={"user_id": id},
            UpdateExpression="SET verified = :v",
            ExpressionAttributeValues={":v": True},
        )
        await self.delete_verify_email_token(token)


async def test_adhoc() -> None:
    async with UserCrud() as crud:
        await crud.add_user(User.create(username="ben", email="ben@kscale.dev", password="password"))


if __name__ == "__main__":
    # python -m store.app.crud.users
    asyncio.run(test_adhoc())
