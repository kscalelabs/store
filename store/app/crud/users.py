"""Defines CRUD interface for user API."""

import asyncio
import warnings
from datetime import datetime

from store.app.crud.base import BaseCrud, GlobalSecondaryIndex
from store.app.crypto import hash_password
from store.app.model import OauthUser, User
from store.settings import settings

# This dictionary is used to locally cache the last time a token was validated
# against the database. We give the tokens some buffer time to avoid hitting
# the database too often.
LAST_TOKEN_VALIDATION: dict[str, datetime] = {}


class UserCrud(BaseCrud):
    def __init__(self) -> None:
        super().__init__()

    @classmethod
    def get_gsis(cls) -> list[GlobalSecondaryIndex]:
        return super().get_gsis() + [
            ("usernameIndex", "username", "S", "HASH"),
            ("emailIndex", "email", "S", "HASH"),
            ("oauthIdIndex", "oauth_id", "S", "HASH"),
        ]

    async def validate_session_token(self, token: str) -> bool:
        if token in LAST_TOKEN_VALIDATION:
            if (datetime.now() - LAST_TOKEN_VALIDATION[token]).seconds < settings.crypto.expire_token_minutes * 60:
                return True
        user_id = await self.get_user_id_from_session_token(token)
        if user_id is None:
            return False
        LAST_TOKEN_VALIDATION[token] = datetime.now()
        return True

    async def add_user(self, user: User) -> None:
        # Then, add the user object to the Users table.
        table = await self.db.Table("Users")
        await table.put_item(
            Item=user.model_dump(),
            ConditionExpression="attribute_not_exists(oauth_id) AND attribute_not_exists(email) AND \
                attribute_not_exists(username)",
        )

    async def get_user(self, user_id: str) -> User | None:
        return await self._get_item(user_id, User, throw_if_missing=False)

    async def get_user_batch(self, user_ids: list[str]) -> list[User]:
        return await self._get_item_batch(user_ids, User)

    async def get_user_from_email(self, email: str) -> User | None:
        users = await self._get_items_from_secondary_index("emailIndex", "email", email, User)
        if len(users) == 0:
            return None
        if len(users) > 1:
            raise ValueError(f"Multiple users found with email {email}")
        return users[0]

    async def get_user_from_oauth_id(self, oauth_id: str) -> OauthUser | None:
        users = await self._get_items_from_secondary_index("oauthIdIndex", "oauth_id", oauth_id, OauthUser)
        if len(users) == 0:
            return None
        if len(users) > 1:
            raise ValueError(f"Multiple users found with oauth id {oauth_id}")
        return OauthUser.model_validate(users[0])

    async def delete_user(self, user_id: str) -> None:
        await self._delete_item(user_id)

    async def list_users(self) -> list[User]:
        warnings.warn("`list_users` probably shouldn't be called in production", ResourceWarning)
        return await self._list_items(User)

    async def get_user_count(self) -> int:
        return await self._count_items(User)

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
