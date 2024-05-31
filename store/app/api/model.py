"""Defines the table models for the API."""

import datetime
from dataclasses import field
from decimal import Decimal

from pydantic import BaseModel


class User(BaseModel):
    user_id: str  # Primary key
    email: str


class Token(BaseModel):
    token_id: str  # Primary key
    user_id: str
    issued: Decimal = field(default_factory=lambda: Decimal(datetime.datetime.now().timestamp()))


class PurchaseLink(BaseModel):
    name: str
    url: str
    price: Decimal


class Robot(BaseModel):
    robot_id: str  # Primary key
    owner: str
    name: str
    description: str
    price: Decimal
    part_ids: set[str]
    purchase_links: set[PurchaseLink]


class Part(BaseModel):
    part_id: str  # Primary key
    owner: str
    name: str
    description: str
    price: Decimal
    robot_ids: set[str]
    purchase_links: set[PurchaseLink]
