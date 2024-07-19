"""Defines CRUD interface for user API."""

import asyncio
import warnings
from datetime import datetime

from store.app.crud.base import BaseCrud, GlobalSecondaryIndex
from store.app.crypto import hash_password
from store.app.model import APIKey, User
from store.settings import settings
from store.utils import LRUCache

# This dictionary is used to locally cache the last time a token was validated
# against the database. We give the tokens some buffer time to avoid hitting
# the database too often.
LAST_API_KEY_VALIDATION = LRUCache[str, datetime](2**20)

# This dictionary is used to locally cache the fact that a token has been
# deleted, to avoid hitting the database too often.
TOKEN_IS_DELETED = LRUCache[str, bool](2**20)


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

    async def add_user(self, user: User) -> None:
        # table = await self.db.Table("Users")
        # await table.put_item(
        #     Item=user.model_dump(),
        #     ConditionExpression="attribute_not_exists(oauth_id) AND attribute_not_exists(email) AND \
        #         attribute_not_exists(username)",
        # )
        await self._add_item(user)

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

    async def delete_user(self, user_id: str) -> None:
        await self._delete_item(user_id)

    async def list_users(self) -> list[User]:
        warnings.warn("`list_users` probably shouldn't be called in production", ResourceWarning)
        return await self._list_items(User)

    async def get_user_count(self) -> int:
        return await self._count_items(User)

    async def add_api_key(self, user_id: str) -> APIKey:
        token = APIKey.create(user_id=user_id)
        await self._add_item(token)
        return token

    async def delete_api_key(self, token: APIKey | str) -> None:
        await self._delete_item(token)

    async def api_key_is_valid(self, token: str) -> bool:
        if token in LAST_API_KEY_VALIDATION:
            if (datetime.now() - LAST_API_KEY_VALIDATION[token]).seconds < settings.crypto.expire_token_minutes * 60:
                return True
        user_id = await self._get_item(token, APIKey, throw_if_missing=False)
        if user_id is None:
            return False
        LAST_API_KEY_VALIDATION[token] = datetime.now()
        return True

    async def change_password(self, user_id: str, new_password: str) -> None:
        await self._update_item(user_id, User, {"password_hash": hash_password(new_password)})

    async def change_email(self, user_id: str, new_email: str) -> None:
        await self._update_item(user_id, User, {"email": new_email})


async def test_adhoc() -> None:
    async with UserCrud() as crud:
        await crud.add_user(User.create(username="ben", email="ben@kscale.dev", password="password"))


if __name__ == "__main__":
    # python -m store.app.crud.users
    asyncio.run(test_adhoc())
