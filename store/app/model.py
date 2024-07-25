"""Defines the table models for the API.

These correspond directly with the rows in our database, and provide helper
methods for converting from our input data into the format the database
expects (for example, converting a UUID into a string).
"""

from typing import Literal, Self

from pydantic import BaseModel

from store.utils import new_uuid


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

    email: str
    permissions: UserPermissions = UserPermissions()

    @classmethod
    def create(cls, email: str) -> Self:
        return cls(id=str(new_uuid()), email=email)


class OAuthKey(RobolistBaseModel):
    """Keys for OAuth providers which identify users."""

    user_id: str
    token: str

    @classmethod
    def create(cls, token: str, user_id: str) -> Self:
        return cls(id=str(new_uuid()), user_id=user_id, token=token)


APIKeySource = Literal["user", "oauth"]
APIKeyPermission = Literal["read", "write", "admin"]
APIKeyPermissionSet = set[APIKeyPermission] | Literal["full"]


class APIKey(RobolistBaseModel):
    """The API key is used for querying the API.

    Downstream users keep the API key, and it is used to authenticate
    requests to the API. The key is stored in the database, and can be
    revoked by the user at any time.
    """

    user_id: str
    source: APIKeySource
    permissions: set[APIKeyPermission]

    @classmethod
    def create(
        cls,
        user_id: str,
        source: APIKeySource,
        permissions: APIKeyPermissionSet,
    ) -> Self:
        if permissions == "full":
            permissions = {"read", "write", "admin"}
        return cls(
            id=str(new_uuid()),
            user_id=user_id,
            source=source,
            permissions=permissions,
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
