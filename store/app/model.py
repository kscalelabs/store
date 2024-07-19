"""Defines the table models for the API.

These correspond directly with the rows in our database, and provide helper
methods for converting from our input data into the format the database
expects (for example, converting a UUID into a string).
"""

from typing import Self

from pydantic import BaseModel

from store.app.crypto import hash_password, new_token, new_uuid


class RobolistBaseModel(BaseModel):
    id: str


class User(RobolistBaseModel):
    username: str
    email: str
    password_hash: str
    admin: bool = False

    @classmethod
    def create(cls, email: str, username: str, password: str) -> Self:
        return cls(
            id=str(new_uuid()),
            email=email,
            username=username,
            password_hash=hash_password(password),
        )


class OauthUser(RobolistBaseModel):
    username: str
    oauth_id: str
    admin: bool = False

    @classmethod
    def create(cls, username: str, oauth_id: str) -> Self:
        return cls(
            id=str(new_uuid()),
            username=username,
            oauth_id=oauth_id,
        )


class SessionToken(RobolistBaseModel):
    user_id: str
    token: str

    @classmethod
    def create(cls, user_id: str) -> Self:
        return cls(
            id=str(new_uuid()),
            user_id=user_id,
            token=str(new_token()),
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


class Robot(RobolistBaseModel):
    owner: str
    name: str
    description: str
    bom: list[Bom]
    images: list[Image]
    height: str | None = None
    weight: str | None = None
    degrees_of_freedom: int | None = None
    timestamp: int
    urdf: str
    packages: list[Package]


class Part(RobolistBaseModel):
    name: str
    owner: str
    description: str
    images: list[Image]
    timestamp: int
