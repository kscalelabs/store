"""Defines the table models for the API.

These correspond directly with the rows in our database, and provide helper
methods for converting from our input data into the format the database
expects (for example, converting a UUID into a string).
"""

from typing import Self

import jwt
from pydantic import BaseModel

from store.app.crypto import new_uuid
from store.settings import settings


class RobolistBaseModel(BaseModel):
    """Defines the base model for Robolist database rows.

    Our database architecture uses a single table with a single primary key
    (the `id` field). This class provides a common interface for all models
    that are stored in the database.
    """

    id: str


class UserPermissions(BaseModel):
    is_admin: bool = False


class User(RobolistBaseModel):
    """Defines the user model for the API.

    Users are defined by their email, username and password hash. This is the
    simplest form of authentication, and is used for users who sign up with
    their email and password.
    """

    username: str
    email: str
    auth_keys: list[str]
    permissions: UserPermissions = UserPermissions()

    @classmethod
    def create(cls, username: str, email: str, auth_key: str) -> Self:
        return cls(
            id=str(new_uuid()),
            username=username,
            email=email,
            auth_keys=[auth_key],
        )


class APIKey(RobolistBaseModel):
    """The API key is used for querying the API.

    Downstream users keep the JWT locally, and it is used to authenticate
    requests to the API. The key is stored in the database, and can be
    revoked by the user at any time.
    """

    user_id: str

    @classmethod
    def create(cls, id: str) -> Self:
        return cls(
            id=str(new_uuid()),
            user_id=id,
        )

    def to_jwt(self) -> str:
        return jwt.encode(
            payload={"token": self.id, "user_id": self.user_id},
            key=settings.crypto.jwt_secret,
        )

    @classmethod
    def from_jwt(cls, jwt_token: str) -> Self:
        data = jwt.decode(
            jwt=jwt_token,
            key=settings.crypto.jwt_secret,
        )
        return cls(id=data["token"], user_id=data["user_id"])


class RegisterToken(RobolistBaseModel):
    """Stores a token for registering a new user."""

    email: str

    @classmethod
    def create(cls, email: str) -> Self:
        return cls(
            id=str(new_uuid()),
            email=email,
        )

    def to_jwt(self) -> str:
        return jwt.encode(
            payload={"token": self.id, "email": self.email},
            key=settings.crypto.jwt_secret,
        )

    @classmethod
    def from_jwt(cls, jwt_token: str) -> Self:
        data = jwt.decode(
            jwt=jwt_token,
            key=settings.crypto.jwt_secret,
        )
        return cls(id=data["token"], email=data["email"])


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
