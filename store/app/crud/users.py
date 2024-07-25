"""Defines CRUD interface for user API."""

import asyncio
import warnings
from typing import Literal, overload

from store.app.crud.base import BaseCrud, GlobalSecondaryIndex
from store.app.model import APIKey, APIKeyPermissionSet, APIKeySource, OAuthKey, User
from store.settings import settings
from store.utils import cache_result


def github_auth_key(github_id: str) -> str:
    return f"github:{github_id}"


def google_auth_key(google_id: str) -> str:
    return f"google:{google_id}"


class UserNotFoundError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)


class UserCrud(BaseCrud):
    def __init__(self) -> None:
        super().__init__()

    @classmethod
    def get_gsis(cls) -> list[GlobalSecondaryIndex]:
        return super().get_gsis() + [
            ("emailIndex", "email", "S", "HASH"),
        ]

    @overload
    async def get_user(self, id: str) -> User | None: ...

    @overload
    async def get_user(self, id: str, throw_if_missing: Literal[True]) -> User: ...

    async def get_user(self, id: str, throw_if_missing: bool = False) -> User | None:
        return await self._get_item(id, User, throw_if_missing=throw_if_missing)

    async def create_user_from_token(self, token: str, email: str) -> User:
        user = User.create(email=email)
        await self._add_item(user)
        key = OAuthKey.create(token, user.id)
        await self._add_item(key)
        return user

    async def get_user_from_token(self, token: str) -> User | None:
        key = await self._get_item(token, OAuthKey, throw_if_missing=False)
        if key is None:
            return None
        return await self.get_user(key.user_id)

    async def create_user_from_github_token(self, github_id: str, email: str) -> User:
        return await self.create_user_from_token(github_auth_key(github_id), email)

    async def create_user_from_google_token(self, google_id: str, email: str) -> User:
        return await self.create_user_from_token(google_auth_key(google_id), email)

    async def get_user_from_github_token(self, token: str) -> User | None:
        return await self.get_user_from_token(github_auth_key(token))

    async def get_user_from_google_token(self, token: str) -> User | None:
        return await self.get_user_from_token(google_auth_key(token))

    async def get_user_from_email(self, email: str) -> User | None:
        return await self._get_unique_item_from_secondary_index("emailIndex", "email", email, User)

    async def create_user_from_email(self, email: str) -> User:
        user = User.create(email=email)
        await self._add_item(user)
        return user

    async def get_user_batch(self, ids: list[str]) -> list[User]:
        return await self._get_item_batch(ids, User)

    async def get_user_from_api_key(self, api_key_id: str) -> User:
        api_key = await self.get_api_key(api_key_id)
        return await self._get_item(api_key.user_id, User, throw_if_missing=True)

    async def delete_user(self, id: str) -> None:
        await self._delete_item(id)

    async def list_users(self) -> list[User]:
        warnings.warn("`list_users` probably shouldn't be called in production", ResourceWarning)
        return await self._list_items(User)

    async def get_user_count(self) -> int:
        return await self._count_items(User)

    @cache_result(settings.crypto.cache_token_db_result_seconds)
    async def get_api_key(self, api_key_id: str) -> APIKey:
        return await self._get_item(api_key_id, APIKey, throw_if_missing=True)

    async def add_api_key(
        self,
        user_id: str,
        source: APIKeySource,
        permissions: APIKeyPermissionSet,
    ) -> APIKey:
        token = APIKey.create(user_id=user_id, source=source, permissions=permissions)
        await self._add_item(token)
        return token

    async def delete_api_key(self, token: APIKey | str) -> None:
        await self._delete_item(token)


async def test_adhoc() -> None:
    async with UserCrud() as crud:
        await crud.create_user_from_email(email="ben@kscale.dev")


if __name__ == "__main__":
    # python -m store.app.crud.users
    asyncio.run(test_adhoc())
