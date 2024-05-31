"""Defines functions for controlling access tokens."""

import datetime
import logging
import uuid

import jwt
from fastapi import HTTPException, status

from store.app.api.db import Crud
from store.app.api.model import Token
from store.settings import settings
from store.utils import server_time

logger = logging.getLogger(__name__)

TIME_FORMAT = "%Y-%m-%d %H:%M:%S"


def get_token_id() -> str:
    """Generates a unique token ID.

    Returns:
        A unique token ID.
    """
    return str(uuid.uuid4())


def create_token(data: dict, expire_after: datetime.timedelta | None = None, extra: str | None = None) -> str:
    """Creates a token from a dictionary.

    The "exp" key is reserved for internal use.

    Args:
        data: The data to encode.
        expire_after: If provided, token will expire after this amount of time.
        extra: Additional secret to append to the secret key.

    Returns:
        The encoded JWT.
    """
    secret = settings.crypto.jwt_secret
    if extra is not None:
        secret += extra
    if "exp" in data:
        raise ValueError("The payload should not contain an expiration time")
    to_encode = data.copy()

    # JWT exp claim expects a timestamp in seconds. This will automatically be
    # used to determine if the token is expired.
    if expire_after is not None:
        expires = server_time() + expire_after
        to_encode.update({"exp": expires})

    encoded_jwt = jwt.encode(to_encode, secret, algorithm=settings.crypto.algorithm)
    return encoded_jwt


def load_token(payload: str, extra: str | None = None) -> dict:
    """Loads the token payload.

    Args:
        payload: The JWT-encoded payload.
        only_once: If ``True``, the token will be marked as used.
        extra: Additional secret to append to the secret key.

    Returns:
        The decoded payload.
    """
    secret = settings.crypto.jwt_secret
    if extra is not None:
        secret += extra
    try:
        data: dict = jwt.decode(payload, secret, algorithms=[settings.crypto.algorithm])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return data


async def create_refresh_token(user_id: str, crud: Crud) -> str:
    """Creates a refresh token for a user.

    Refresh tokens never expire. They are used to generate short-lived session
    tokens which are used for authentication.

    Args:
        user_id: The user ID to associate with the token.
        crud: The CRUD class for the databases.

    Returns:
        The encoded JWT.
    """
    token_id = get_token_id()
    token = Token(user_id=user_id, token_id=token_id)
    await crud.add_token(token)
    return create_token({"uid": user_id, "tid": token_id})


def load_refresh_token(payload: str) -> tuple[str, str]:
    """Loads the refresh token payload.

    Args:
        payload: The JWT-encoded payload.

    Returns:
        The decoded refresh token data.
    """
    data = load_token(payload)
    return data["uid"], data["tid"]
