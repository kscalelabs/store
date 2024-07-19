"""Defines CRUD interface for user API."""

import asyncio
import warnings

from boto3.dynamodb.conditions import Key

from store.app.crud.base import BaseCrud
from store.app.crypto import hash_password
from store.app.model import User


class UserCrud(BaseCrud):
    def __init__(self) -> None:
        super().__init__()

    async def add_user(self, user: User) -> None:
        # Then, add the user object to the Users table.
        table = await self.db.Table("Users")
        await table.put_item(
            Item=user.model_dump(),
            ConditionExpression="attribute_not_exists(oauth_id) AND attribute_not_exists(email) AND \
                attribute_not_exists(username)",
        )

    async def get_user(self, user_id: str) -> User | None:
        table = await self.db.Table("Users")
        user_dict = await table.get_item(Key={"user_id": user_id})
        if "Item" not in user_dict:
            return None
        return User.model_validate(user_dict["Item"])

    async def get_user_batch(self, user_ids: list[str]) -> list[User]:
        users: list[User] = []
        chunk_size = 100
        for i in range(0, len(user_ids), chunk_size):
            chunk = user_ids[i : i + chunk_size]
            keys = [{"user_id": user_id} for user_id in chunk]
            response = await self.db.batch_get_item(RequestItems={"Users": {"Keys": keys}})
            users.extend(User.model_validate(user) for user in response["Responses"]["Users"])
        return users

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

    async def get_user_from_oauth_id(self, oauth_id: str) -> User | None:
        table = await self.db.Table("Users")
        user_dict = await table.query(
            IndexName="oauthIdIndex",
            KeyConditionExpression=Key("oauth_id").eq(oauth_id),
        )
        items = user_dict["Items"]
        if len(items) == 0:
            return None
        if len(items) > 1:
            raise ValueError(f"Multiple users found with oauth id {oauth_id}")
        return User.model_validate(items[0])

    async def get_user_id_from_session_token(self, session_token: str) -> str | None:
        table = await self.db.Table("Sessions")
        response = await table.get_item(Key={"token": session_token})
        if "Item" not in response:
            return None
        user_id = response["Item"]["user_id"]
        if not isinstance(user_id, str):
            return None
        return user_id

    async def delete_user(self, user_id: str) -> None:
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
        table = await self.db.Table("Sessions")
        await table.put_item(
            Item={"token": token, "user_id": user_id},
            ConditionExpression="attribute_not_exists(token)",
        )

    async def delete_session_token(self, token: str) -> None:
        table = await self.db.Table("Sessions")
        await table.delete_item(Key={"token": token})

    async def add_register_token(self, token: str, email: str, lifetime: int) -> None:
        table = await self.db.Table("RegisterTokens")
        await table.put_item(
            Item={"token": token, "email": email},
            ConditionExpression="attribute_not_exists(token)",
        )

    async def delete_register_token(self, token: str) -> None:
        table = await self.db.Table("RegisterTokens")
        await table.delete_item(Key={"token": token})

    async def check_register_token(self, token: str) -> str:
        table = await self.db.Table("RegisterTokens")
        response = await table.get_item(Key={"token": token})
        if "Item" not in response:
            raise ValueError("Provided token is invalid")
        email = response["Item"]["email"]
        if not isinstance(email, str):
            raise ValueError("Provided token is invalid")
        return email

    async def change_password(self, user_id: str, new_password: str) -> None:
        table = await self.db.Table("Users")
        await table.update_item(
            Key={"user_id": user_id},
            AttributeUpdates={"password_hash": {"Value": hash_password(new_password), "Action": "PUT"}},
        )

    async def add_reset_password_token(self, token: str, user_id: str, lifetime: int) -> None:
        table = await self.db.Table("ResetPasswordTokens")
        await table.put_item(
            Item={"token": token, "user_id": user_id},
            ConditionExpression="attribute_not_exists(token)",
        )

    async def delete_reset_password_token(self, token: str) -> None:
        table = await self.db.Table("ResetPasswordTokens")
        await table.delete_item(Key={"token": token})

    async def use_reset_password_token(self, token: str, new_password: str) -> None:
        table = await self.db.Table("ResetPasswordTokens")
        response = await table.get_item(Key={"token": token})
        if "Item" not in response:
            raise ValueError("Provided token is invalid")
        user_id = response["Item"]["user_id"]
        if not isinstance(user_id, str):
            raise ValueError("Provided token is invalid")
        await self.change_password(user_id, new_password)
        await table.delete_item(Key={"token": token})

    async def add_change_email_token(self, token: str, user_id: str, new_email: str, lifetime: int) -> None:
        table = await self.db.Table("ChangeEmailTokens")
        await table.put_item(
            Item={"token": token, "user_id": user_id, "new_email": new_email},
            ConditionExpression="attribute_not_exists(token)",
        )

    async def use_change_email_token(self, token: str) -> None:
        table = await self.db.Table("ChangeEmailTokens")
        response = await table.get_item(Key={"token": token})
        if "Item" not in response:
            raise ValueError("Provided token is invalid")
        user_id = response["Item"]["user_id"]
        new_email = response["Item"]["new_email"]
        if not isinstance(user_id, str) or not isinstance(new_email, str):
            raise ValueError("Provided token is invalid")
        await (await self.db.Table("Users")).update_item(
            Key={"user_id": user_id},
            AttributeUpdates={
                "email": {"Value": new_email, "Action": "PUT"},
            },
        )
        await table.delete_item(Key={"token": token})


async def test_adhoc() -> None:
    async with UserCrud() as crud:
        await crud.add_user(User.create(username="ben", email="ben@kscale.dev", password="password"))


if __name__ == "__main__":
    # python -m store.app.crud.users
    asyncio.run(test_adhoc())
