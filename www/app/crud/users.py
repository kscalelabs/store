"""Defines CRUD interface for user API."""

import logging
import random
import string
import time
import warnings
from typing import Any, Literal, Optional, overload

from boto3.dynamodb.conditions import Attr, Key
from botocore.exceptions import ClientError
from pydantic import BaseModel

from www.app.crud.base import TABLE_NAME, BaseCrud
from www.app.crud.listings import ListingsCrud
from www.app.model import APIKey, User, UserPermission, UserStripeConnect
from www.settings import settings
from www.utils import cache_async_result

logger = logging.getLogger(__name__)


class UserNotFoundError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)


class UserPublic(BaseModel):
    """Defines public user model for frontend.

    Omits private/sesnsitive user fields. Is the return type for
    retrieving user data on frontend (for public profile pages, etc).
    """

    id: str
    email: str
    username: str
    permissions: set[UserPermission] | None = None
    created_at: int
    updated_at: int | None = None
    first_name: str | None = None
    last_name: str | None = None
    name: str | None = None
    bio: str | None = None
    stripe_connect: UserStripeConnect | None = None


class UserCrud(BaseCrud):
    @classmethod
    def get_gsis(cls) -> set[str]:
        """Get the GSIs for the User model."""
        return {"email", "username", "cognito_id", "user_id", "type", "hashed_key"}

    @overload
    async def get_user(self, id: str, throw_if_missing: Literal[True]) -> User: ...

    @overload
    async def get_user(self, id: str, throw_if_missing: bool = False) -> User | None: ...

    async def get_user(self, id: str, throw_if_missing: bool = False) -> User | None:
        return await self._get_item(id, User, throw_if_missing=throw_if_missing)

    @overload
    async def get_user_public(self, id: str, throw_if_missing: Literal[True]) -> UserPublic: ...

    @overload
    async def get_user_public(self, id: str, throw_if_missing: bool = False) -> UserPublic | None: ...

    async def get_user_public(self, id: str, throw_if_missing: bool = False) -> UserPublic | None:
        user = await self.get_user(id, throw_if_missing=throw_if_missing)
        if user is None:
            if throw_if_missing:
                raise UserNotFoundError(f"User with id {id} not found")
            return None
        return UserPublic(**user.model_dump())

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

    @cache_async_result(settings.crypto.cache_token_db_result_seconds)
    async def get_api_key(self, raw_key: str) -> Optional[APIKey]:
        """Get API key by its raw (unhashed) value."""
        try:
            hashed_key = APIKey.hash_key(raw_key)
            table = await self.db.Table(TABLE_NAME)
            response = await table.scan(FilterExpression=Key("type").eq("APIKey") & Key("hashed_key").eq(hashed_key))
            items = response.get("Items", [])
            if not items:
                return None

            api_key = APIKey.model_validate(items[0])

            now = int(time.time())
            if api_key.expires_at and api_key.expires_at < now:
                return None

            return api_key

        except Exception as e:
            logger.exception("Error in get_api_key: %s", e)
            raise

    async def add_api_key(
        self, user_id: str, source: Literal["cognito"], permissions: Literal["full"], expiration_days: int = 30
    ) -> tuple[APIKey, str]:
        """Add or reuse an API key for a user."""
        try:
            now = int(time.time())
            expires_at = now + (expiration_days * 24 * 60 * 60)

            api_key, raw_key = APIKey.create(
                user_id=user_id, source=source, permissions=permissions, expires_at=expires_at
            )
            await self._add_item(api_key)
            return api_key, raw_key

        except Exception as e:
            logger.exception("Error in add_api_key: %s", e)
            raise

    async def get_api_key_count(self, user_id: str) -> int:
        table = await self.db.Table(TABLE_NAME)
        item_dict = await table.scan(
            IndexName="type_index",
            Select="COUNT",
            FilterExpression=Key("type").eq(APIKey.__name__) & Key("user_id").eq(user_id),
        )
        return item_dict["Count"]

    async def delete_api_key(self, token: APIKey | str) -> None:
        """Delete an API key.

        Args:
            token: Either an APIKey object or a raw key string
        """
        if isinstance(token, str):
            # If string provided, look up the API key first
            api_key = await self.get_api_key(token)
            if api_key is None:
                return  # Key doesn't exist, nothing to delete
            token = api_key

        await self._delete_item(token)

    async def list_api_keys(self, user_id: str) -> list[APIKey]:
        keys = await self._get_items_from_secondary_index("user_id", user_id, APIKey)
        keys.sort(key=lambda x: x.created_at, reverse=True)
        return keys

    async def update_user(self, user_id: str, updates: dict[str, Any]) -> User:
        if not updates:
            raise ValueError("No updates provided")

        user = await self.get_user(user_id, throw_if_missing=True)

        user.update_timestamp()
        updates["updated_at"] = user.updated_at

        try:
            await self._update_item(user_id, User, updates)
        except ClientError as e:
            if e.response["Error"]["Code"] == "ValidationException":
                raise ValueError(f"Invalid update: {str(e)}")
            raise

        return await self.get_user(user_id, throw_if_missing=True)

    async def set_moderator(self, user_id: str, is_mod: bool) -> User:
        user = await self.get_user(user_id, throw_if_missing=True)
        if user.permissions is None:
            user.permissions = set()
        if is_mod:
            user.permissions.add("is_mod")
        else:
            user.permissions.discard("is_mod")
        await self._update_item(user_id, User, {"permissions": list(user.permissions)})
        return user

    async def set_username(self, user_id: str, new_username: str) -> User:
        user = await self.get_user(user_id, throw_if_missing=True)
        user.set_username(new_username)
        await self._update_item(user_id, User, {"username": new_username, "updated_at": user.updated_at})

        # Update username in all listings
        listings_crud = ListingsCrud()
        async with listings_crud:
            await listings_crud.update_username_for_user_listings(user_id, new_username)

        return user

    async def is_username_taken(self, username: str) -> bool:
        logger.info("Checking if username %s is taken", username)
        existing_users = await self._get_items_from_secondary_index("username", username, User)
        logger.info("existing_users: %s", existing_users)
        return len(existing_users) > 0

    async def generate_unique_username(self, base: str) -> str:
        username = base
        while await self.is_username_taken(username):
            random_suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=5))
            username = f"{base}{random_suffix}"
        return username

    async def update_stripe_connect_status(self, user_id: str, account_id: str, is_completed: bool) -> User:
        stripe_connect = UserStripeConnect(
            account_id=account_id,
            onboarding_completed=is_completed,
        )
        updates = {
            "stripe_connect": stripe_connect.model_dump(),
            "updated_at": int(time.time()),
        }
        return await self.update_user(user_id, updates)

    async def set_content_manager(self, user_id: str, is_content_manager: bool) -> User:
        user = await self.get_user(user_id, throw_if_missing=True)
        if user.permissions is None:
            user.permissions = set()
        if is_content_manager:
            user.permissions.add("is_content_manager")
        else:
            user.permissions.discard("is_content_manager")

        await self._update_item(user_id, User, {"permissions": list(user.permissions)})
        return user

    async def create_user_from_cognito(
        self,
        email: str,
        cognito_id: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
    ) -> User:
        """Creates or updates a user from Cognito authentication."""
        try:
            user = await self.get_user_from_cognito_id(cognito_id)
            if user is None:
                # Create new user
                base_username = email.split("@")[0]
                unique_username = await self.generate_unique_username(base_username)

                user = User.create(
                    email=email,
                    username=unique_username,
                    first_name=first_name,
                    last_name=last_name,
                    cognito_id=cognito_id,
                )
                await self._add_item(user, unique_fields=["email", "username"])
            else:
                updates = {}
                if user.email != email:
                    updates["email"] = email
                if first_name and user.first_name != first_name:
                    updates["first_name"] = first_name
                if last_name and user.last_name != last_name:
                    updates["last_name"] = last_name

                if updates:
                    await self._update_item(user.id, User, updates)
                    user = await self.get_user(user.id, throw_if_missing=True)

            return user

        except Exception as e:
            logger.exception("Error in create_user_from_cognito: %s", e)
            raise

    async def get_user_from_cognito_token(
        self,
        email: str,
        cognito_id: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
    ) -> User:
        """Get or create a user from Cognito token."""
        try:
            # Try to get existing user by Cognito ID
            user = await self.get_user_from_cognito_id(cognito_id)
            if user is not None:
                return user

            # Create new user if not found
            return await self.create_user_from_cognito(
                email=email,
                cognito_id=cognito_id,
                first_name=first_name,
                last_name=last_name,
            )
        except Exception as e:
            logger.exception("Error in get_user_from_cognito_token: %s", e)
            raise

    async def get_user_from_cognito_id(self, cognito_id: str) -> Optional[User]:
        """Get a user by their Cognito ID."""
        users = await self._get_items_from_secondary_index("cognito_id", cognito_id, User)
        return users[0] if users else None

    async def cleanup_expired_api_keys(self) -> None:
        """Remove expired API keys from the database."""
        try:
            now = int(time.time())
            table = await self.db.Table(TABLE_NAME)

            # Get all expired API keys
            response = await table.query(
                IndexName="type_index",
                KeyConditionExpression=Key("type").eq("APIKey"),
                FilterExpression=Attr("expires_at").lt(now),
            )

            # Delete expired keys
            for item in response["Items"]:
                await self._delete_item(item["id"])

        except Exception as e:
            logger.exception("Error in cleanup_expired_api_keys: %s", e)
            raise

    async def update_api_key(self, api_key_id: str, updates: dict) -> None:
        """Update an API key's attributes.

        Args:
            api_key_id: The ID of the API key to update
            updates: Dictionary of attributes to update
        """
        try:
            await self._update_item(api_key_id, APIKey, updates)
        except Exception as e:
            logger.exception("Error in update_api_key: %s", e)
            raise
