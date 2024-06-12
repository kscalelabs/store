"""Defines the table models for the API.

These correspond directly with the rows in our database, and provide helper
methods for converting from our input data into the format the database
expects (for example, converting a UUID into a string).
"""

import uuid
from typing import Optional

from pydantic import BaseModel

from store.app.crypto import hash_password


class User(BaseModel):
    user_id: str  # Primary key
    username: str
    email: str
    password_hash: str
    verified: bool
    admin: bool

    @classmethod
    def create(cls, email: str, username: str, password: str) -> "User":
        return cls(
            user_id=str(uuid.uuid4()),
            email=email,
            username=username,
            password_hash=hash_password(password),
            verified=False,
            admin=False,
        )


class SessionToken(BaseModel):
    """Stored in Redis rather than DynamoDB."""

    token_hash: str  # Primary key
    user_id: str


class Bom(BaseModel):
    part_id: str
    quantity: int


class Image(BaseModel):
    caption: str
    url: str


class Robot(BaseModel):
    robot_id: str  # Primary key
    owner: str
    name: str
    description: str
    bom: list[Bom]
    images: list[Image]
    height: Optional[str] = ""
    weight: Optional[str] = ""
    degrees_of_freedom: Optional[str] = ""


class Part(BaseModel):
    part_id: str  # Primary key
    part_name: str
    owner: str
    description: str
    images: list[Image]
