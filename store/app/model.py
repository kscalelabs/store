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
    oauth_id: str
    admin: bool

    @classmethod
    def create(cls, email: str, username: str, password: str) -> "User":
        return cls(
            user_id=str(uuid.uuid4()),
            email=email,
            username=username,
            password_hash=hash_password(password),
            oauth_id="dummy_oauth",
            admin=False,
        )

    @classmethod
    def create_oauth(cls, username: str, oauth_id: str) -> "User":
        return cls(
            user_id=str(uuid.uuid4()),
            username=username,
            email="dummy@kscale.dev",
            oauth_id=oauth_id,
            admin=False,
            password_hash="",
        )


class Bom(BaseModel):
    part_id: str
    quantity: int


class Image(BaseModel):
    caption: str
    url: str


class Package(BaseModel):
    name: str
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
    timestamp: int
    urdf: str
    packages: list[Package]


class Part(BaseModel):
    part_id: str  # Primary key
    name: str
    owner: str
    description: str
    images: list[Image]
    timestamp: int
