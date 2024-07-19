"""Defines crypto functions."""

import uuid

from argon2 import PasswordHasher


def new_uuid() -> uuid.UUID:
    return uuid.uuid4()


def hash_password(password: str) -> str:
    return PasswordHasher().hash(password)


def check_password(password: str, hash: str) -> bool:
    try:
        return PasswordHasher().verify(hash, password)
    except Exception:
        return False
