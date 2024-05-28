"""Defines the table models for the API."""

import datetime
from dataclasses import field
from decimal import Decimal

from pydantic import BaseModel


class User(BaseModel):
    email: str
    banned: bool = field(default=False)
    deleted: bool = field(default=False)


class Token(BaseModel):
    email: str
    issued: Decimal = field(default_factory=lambda: Decimal(datetime.datetime.now().timestamp()))
    disabled: bool = field(default=False)
