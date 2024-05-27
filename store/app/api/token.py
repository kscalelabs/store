"""Defines functions for controlling access tokens."""

import datetime
import logging

import jwt
from fastapi import HTTPException, status
from types_aiobotocore_dynamodb.service_resource import DynamoDBServiceResource

from store.app.api.crud.users import add_token
from store.app.api.model import Token
from store.settings import settings
from store.utils import server_time

logger = logging.getLogger(__name__)

TIME_FORMAT = "%Y-%m-%d %H:%M:%S"


def create_token(data: dict, expire_after: datetime.timedelta | None = None) -> str:
    """Creates a token from a dictionary.

    The "exp" key is reserved for internal use.

    Args:
        data: The data to encode.
        expire_after: If provided, token will expire after this amount of time.

    Returns:
        The encoded JWT.
    """
    if "exp" in data:
        raise ValueError("The payload should not contain an expiration time")
    to_encode = data.copy()

    # JWT exp claim expects a timestamp in seconds. This will automatically be
    # used to determine if the token is expired.
    if expire_after is not None:
        expires = server_time() + expire_after
        to_encode.update({"exp": expires})

    encoded_jwt = jwt.encode(to_encode, settings.crypto.jwt_secret, algorithm=settings.crypto.algorithm)
    return encoded_jwt


def load_token(payload: str) -> dict:
    """Loads the token payload.

    Args:
        payload: The JWT-encoded payload.
        only_once: If ``True``, the token will be marked as used.

    Returns:
        The decoded payload.
    """
    try:
        data: dict = jwt.decode(payload, settings.crypto.jwt_secret, algorithms=[settings.crypto.algorithm])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return data


async def create_refresh_token(email: str, ip_addr: str, db: DynamoDBServiceResource) -> str:
    """Creates a refresh token for a user.

    Refresh tokens never expire. They are used to generate short-lived session
    tokens which are used for authentication.

    Args:
        email: The email for the user associated with this token.
        ip_addr: The IP address of the token.
        db: The database resource for the token.

    Returns:
        The encoded JWT.
    """
    token = Token(email=email, ip_addr=ip_addr)
    await add_token(token, db)
    return create_token({"eml": email, "ip": ip_addr})


def load_refresh_token(payload: str) -> tuple[str, str]:
    """Loads the refresh token payload.

    Args:
        payload: The JWT-encoded payload.

    Returns:
        The decoded refresh token data.
    """
    data = load_token(payload)
    return data["eml"], data["ip"]
