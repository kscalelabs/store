"""Defines CRUD interface for user API."""

import asyncio
import warnings
from datetime import datetime

from store.app.crud.base import BaseCrud, GlobalSecondaryIndex
from store.app.model import APIKey, User
from store.settings import settings
from store.utils import LRUCache

# This dictionary is used to locally cache the last time a token was validated
# against the database. We give the tokens some buffer time to avoid hitting
# the database too often.
LAST_API_KEY_VALIDATION = LRUCache[str, tuple[datetime, bool]](2**20)


def github_auth_key(github_id: str) -> str:
    return f"github:{github_id}"


def google_auth_key(google_id: str) -> str:
    return f"google:{google_id}"


def email_auth_key(email: str) -> str:
    return f"email:{email}"


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
            ("authKeyIndex", "auth_key", "S", "HASH"),
        ]

    async def get_user(self, id: str) -> User | None:
        return await self._get_item(id, User, throw_if_missing=False)

    async def get_user_from_github_token(self, token: str) -> User | None:
        return await self._get_unique_item_from_secondary_index(
            "authKeyIndex",
            "auth_key",
            github_auth_key(token),
            User,
        )

    async def create_user_from_github_token(self, github_id: str, email: str) -> User:
        user = User.create(email=email, auth_keys=[github_auth_key(github_id)])
        await self._add_item(user)
        return user

    async def get_user_from_google_token(self, token: str) -> User | None:
        return await self._get_unique_item_from_secondary_index(
            "authKeyIndex",
            "auth_key",
            google_auth_key(token),
            User,
        )

    async def create_user_from_google_token(self, google_id: str, email: str) -> User:
        user = User.create(email=email, auth_keys=[google_auth_key(google_id)])
        await self._add_item(user)
        return user

    async def get_user_from_email(self, email: str) -> User | None:
        return await self._get_unique_item_from_secondary_index("emailIndex", "email", email, User)

    async def create_user_from_email(self, email: str) -> User:
        user = User.create(email=email)
        await self._add_item(user)
        return user

    async def get_user_batch(self, ids: list[str]) -> list[User]:
        return await self._get_item_batch(ids, User)

    # Note: we need to make this function throw an error if there is no user associated with the API key ("token")
    # Distinction to make: token is the id, API key is the entire object associated with the token (i.e. the id)
    async def get_user_from_token(self, token: str) -> User:
        raise NotImplementedError()

    async def delete_user(self, id: str) -> None:
        await self._delete_item(id)

    async def list_users(self) -> list[User]:
        warnings.warn("`list_users` probably shouldn't be called in production", ResourceWarning)
        return await self._list_items(User)

    async def get_user_count(self) -> int:
        return await self._count_items(User)

    async def get_api_key(self, id: str) -> APIKey:
        raise NotImplementedError()

    async def add_api_key(self, id: str) -> APIKey:
        token = APIKey.create(id=id)
        await self._add_item(token)
        return token

    async def delete_api_key(self, token: APIKey | str) -> None:
        await self._delete_item(token)

    async def api_key_is_valid(self, token: str) -> bool:
        """Validates a token against the database, with caching.

        In order to reduce the number of database queries, we locally cache
        whether or not a token is valid for some amount of time.

        Args:
            token: The token to validate.

        Returns:
            If the token is valid, meaning, if it exists in the database.
        """
        cur_time = datetime.now()
        if token in LAST_API_KEY_VALIDATION:
            last_time, is_valid = LAST_API_KEY_VALIDATION[token]
            if (cur_time - last_time).seconds < settings.crypto.cache_token_db_result_seconds:
                return is_valid
        is_valid = await self._item_exists(token)
        LAST_API_KEY_VALIDATION[token] = (cur_time, is_valid)
        return is_valid

    async def change_email(self, id: str, new_email: str) -> None:
        await self._update_item(id, User, {"email": new_email})

    async def add_register_token(self, token: str, email: str, lifetime: int) -> None:
        raise NotImplementedError()

    async def delete_register_token(self, token: str) -> None:
        raise NotImplementedError()

    async def check_register_token(self, token: str) -> str:
        raise NotImplementedError()

    async def add_reset_password_token(self, token: str, user_id: str, lifetime: int) -> None:
        raise NotImplementedError()

    async def delete_reset_password_token(self, token: str) -> None:
        raise NotImplementedError()

    async def use_reset_password_token(self, token: str, new_password: str) -> None:
        raise NotImplementedError()

    async def add_change_email_token(self, token: str, user_id: str, new_email: str, lifetime: int) -> None:
        raise NotImplementedError()

    async def use_change_email_token(self, token: str) -> None:
        raise NotImplementedError()


async def test_adhoc() -> None:
    async with UserCrud() as crud:
        await crud.create_user_from_email(email="ben@kscale.dev")


if __name__ == "__main__":
    # python -m store.app.crud.users
    asyncio.run(test_adhoc())
