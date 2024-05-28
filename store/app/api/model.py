"""Defines the table models for the API."""

import datetime
from dataclasses import field

from pydantic import BaseModel


class User(BaseModel):
    email: str
    banned: bool = field(default=False)
    deleted: bool = field(default=False)


class Token(BaseModel):
    email: str
    issued: datetime.datetime = field(default_factory=datetime.datetime.now)
    disabled: bool = field(default=False)
