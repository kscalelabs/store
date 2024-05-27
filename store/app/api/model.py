# mypy: disable-error-code="var-annotated"
"""Defines the table models for the API."""

import datetime
from dataclasses import field

from pydantic import BaseModel


class User(BaseModel):
    user_id: str
    email: str
    banned: bool = field(default=False)
    deleted: bool = field(default=False)


class Token(BaseModel):
    token_id: str
    user_id: str
    issued: datetime.datetime = field(default_factory=datetime.datetime.now)
    disabled: bool = field(default=False)
