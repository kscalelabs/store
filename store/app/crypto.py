"""Defines crypto functions."""

import uuid

from argon2 import PasswordHasher


def new_register_jwt(email: str) -> str:
    raise NotImplementedError()

def new_reset_password_jwt(email: str) -> str:
    raise NotImplementedError()

def new_change_email_jwt(old_email: str, new_email: str) -> str:
    raise NotImplementedError()

def new_auth_jwt(id: str) -> str:
    raise NotImplementedError()

def new_uuid() -> uuid.UUID:
    return uuid.uuid4()


def hash_password(password: str) -> str:
    return PasswordHasher().hash(password)


def check_password(password: str, hash: str) -> bool:
    try:
        return PasswordHasher().verify(hash, password)
    except Exception:
        return False
