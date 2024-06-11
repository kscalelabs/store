"""Defines crypto functions."""

import datetime
import hashlib
import secrets
import string
import uuid
from typing import Any

import jwt
from argon2 import PasswordHasher

from store.settings import settings


def get_new_user_id() -> uuid.UUID:
    return uuid.uuid4()


def new_token(length: int = 64) -> str:
    """Generates a cryptographically secure random 64 character alphanumeric token."""
    return "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(length))


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def check_hash(token: str, hash: str) -> bool:
    return hashlib.sha256(token.encode()).hexdigest() == hash


def hash_password(password: str) -> str:
    return PasswordHasher().hash(password)


def encode_jwt(data: dict[str, Any], expire_after: datetime.timedelta | None = None) -> str:  # noqa: ANN401
    if expire_after is not None:
        data["exp"] = datetime.datetime.utcnow() + expire_after
    return jwt.encode(data, settings.crypto.jwt_secret, algorithm=settings.crypto.algorithm)


def decode_jwt(token: str) -> dict[str, Any]:  # noqa: ANN401
    return jwt.decode(token, settings.crypto.jwt_secret, algorithms=[settings.crypto.algorithm])
