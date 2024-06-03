"""Defines crypto functions."""

import datetime
import hashlib
import uuid
from typing import Any

import jwt

from store.settings import settings


def hash_api_key(api_key: uuid.UUID) -> str:
    return hashlib.sha256(api_key.bytes).hexdigest()


def get_new_user_id() -> uuid.UUID:
    return uuid.uuid4()


def get_new_api_key(user_id: uuid.UUID) -> uuid.UUID:
    user_id_hash = hashlib.sha1(user_id.bytes).digest()
    return uuid.UUID(bytes=user_id_hash[:16], version=5)


def encode_jwt(data: dict[str, Any], expire_after: datetime.timedelta | None = None) -> str:  # noqa: ANN401
    if expire_after is not None:
        data["exp"] = datetime.datetime.utcnow() + expire_after
    return jwt.encode(data, settings.crypto.jwt_secret, algorithm=settings.crypto.algorithm)


def decode_jwt(token: str) -> dict[str, Any]:  # noqa: ANN401
    return jwt.decode(token, settings.crypto.jwt_secret, algorithms=[settings.crypto.algorithm])
