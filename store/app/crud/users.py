"""Defines CRUD interface for user API."""

import asyncio
import warnings
from typing import Literal, overload

from store.app.crud.base import BaseCrud
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
    @classmethod
    def get_gsis(cls) -> set[str]:
        return super().get_gsis().union({"user_id", "email", "user_token"})

    @overload
    async def get_user(self, id: str, throw_if_missing: Literal[True]) -> User: ...

    @overload
    async def get_user(self, id: str, throw_if_missing: bool = False) -> User | None: ...

    async def get_user(self, id: str, throw_if_missing: bool = False) -> User | None:
        return await self._get_item(id, User, throw_if_missing=throw_if_missing)

    async def _create_user_from_email(self, email: str) -> User:
        user = User.create(email=email)
        await self._add_item(user, unique_fields=["email"])
        return user

    async def _create_user_from_auth_key(self, auth_key: str, email: str) -> User:
        user = await self._create_user_from_email(email)
        key = OAuthKey.create(auth_key, user.id)
        await self._add_item(key, unique_fields=["user_token"])
        return user

    @overload
    async def _get_oauth_key(self, token: str, throw_if_missing: Literal[True]) -> OAuthKey: ...

    @overload
    async def _get_oauth_key(self, token: str, throw_if_missing: bool = False) -> OAuthKey | None: ...

    async def _get_oauth_key(self, token: str, throw_if_missing: bool = False) -> OAuthKey | None:
        return await self._get_unique_item_from_secondary_index(
            "user_token",
            token,
            OAuthKey,
            throw_if_missing=throw_if_missing,
        )

    async def _get_user_from_auth_key(self, token: str) -> User | None:
        key = await self._get_oauth_key(token)
        return None if key is None else await self.get_user(key.user_id)

    async def get_user_from_github_token(self, token: str, email: str) -> User:
        auth_key = github_auth_key(token)
        user = await self._get_user_from_auth_key(auth_key)
        if user is not None:
            return user
        return await self._create_user_from_auth_key(auth_key, email)

    async def delete_github_token(self, github_id: str) -> None:
        await self._delete_item(await self._get_oauth_key(github_auth_key(github_id), throw_if_missing=True))

    async def get_user_from_google_token(self, token: str, email: str) -> User | None:
        auth_key = google_auth_key(token)
        user = await self._get_user_from_auth_key(auth_key)
        if user is not None:
            return user
        return await self._create_user_from_auth_key(auth_key, email)

    async def delete_google_token(self, google_id: str) -> None:
        await self._delete_item(await self._get_oauth_key(google_auth_key(google_id), throw_if_missing=True))

    async def get_user_from_email(self, email: str) -> User | None:
        return await self._get_unique_item_from_secondary_index("email", email, User)

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
        api_key = APIKey.create(user_id=user_id, source=source, permissions=permissions)
        await self._add_item(api_key)
        return api_key

    async def delete_api_key(self, token: APIKey | str) -> None:
        await self._delete_item(token)


async def test_adhoc() -> None:
    async with UserCrud() as crud:
        await crud._create_user_from_email(email="ben@kscale.dev")


if __name__ == "__main__":
    # python -m store.app.crud.users
    asyncio.run(test_adhoc())
