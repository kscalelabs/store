"""Defines the table models for the API.

These correspond directly with the rows in our database, and provide helper
methods for converting from our input data into the format the database
expects (for example, converting a UUID into a string).
"""

import time
from datetime import datetime, timedelta
from typing import Literal, Self

from pydantic import BaseModel

from store.settings import settings
from store.utils import new_uuid


class RobolistBaseModel(BaseModel):
    """Defines the base model for Robolist database rows.

    Our database architecture uses a single table with a single primary key
    (the `id` field). This class provides a common interface for all models
    that are stored in the database.
    """

    id: str


UserPermission = Literal["is_admin"]


class User(RobolistBaseModel):
    """Defines the user model for the API.

    Users are defined by their email, username and password hash. This is the
    simplest form of authentication, and is used for users who sign up with
    their email and password.
    """

    email: str
    permissions: set[UserPermission] | None = None

    @classmethod
    def create(cls, email: str) -> Self:
        return cls(id=new_uuid(), email=email, permissions=None)


class OAuthKey(RobolistBaseModel):
    """Keys for OAuth providers which identify users."""

    user_id: str
    user_token: str

    @classmethod
    def create(cls, user_token: str, user_id: str) -> Self:
        return cls(id=new_uuid(), user_id=user_id, user_token=user_token)


APIKeySource = Literal["user", "oauth"]
APIKeyPermission = Literal["read", "write", "admin"]
APIKeyPermissionSet = set[APIKeyPermission] | Literal["full", None]


class APIKey(RobolistBaseModel):
    """The API key is used for querying the API.

    Downstream users keep the API key, and it is used to authenticate
    requests to the API. The key is stored in the database, and can be
    revoked by the user at any time.
    """

    user_id: str
    source: APIKeySource
    permissions: set[APIKeyPermission] | None = None
    ttl: int | None = None

    @classmethod
    def create(
        cls,
        user_id: str,
        source: APIKeySource,
        permissions: APIKeyPermissionSet,
    ) -> Self:
        if permissions == "full":
            permissions = {"read", "write", "admin"}
        ttl_timestamp = int((datetime.utcnow() + timedelta(days=90)).timestamp())
        return cls(id=new_uuid(), user_id=user_id, source=source, permissions=permissions, ttl=ttl_timestamp)


ArtifactSize = Literal["small", "large"]
ArtifactType = Literal["image", "urdf", "mjcf"]

UPLOAD_CONTENT_TYPE_OPTIONS: dict[ArtifactType, set[str]] = {
    "image": {"image/png", "image/jpeg", "image/jpg"},
    "urdf": {"application/gzip", "application/x-gzip"},
    "mjcf": {"application/gzip", "application/x-gzip"},
}

DOWNLOAD_CONTENT_TYPE: dict[ArtifactType, str] = {
    "image": "image/png",
    "urdf": "application/gzip",
    "mjcf": "application/gzip",
}

SizeMapping: dict[ArtifactSize, tuple[int, int]] = {
    "large": settings.image.large_size,
    "small": settings.image.small_size,
}


def get_artifact_name(id: str, artifact_type: ArtifactType, size: ArtifactSize = "large") -> str:
    match artifact_type:
        case "image":
            if size is None:
                raise ValueError("Image artifacts should have a size")
            height, width = SizeMapping[size]
            return f"{id}_{size}_{height}x{width}.png"
        case "urdf":
            return f"{id}.tar.gz"
        case "mjcf":
            return f"{id}.tar.gz"
        case _:
            raise ValueError(f"Unknown artifact type: {artifact_type}")


def get_artifact_url(id: str, artifact_type: ArtifactType, size: ArtifactSize = "large") -> str:
    return f"{settings.site.artifact_base_url}/{get_artifact_name(id, artifact_type, size)}"


def get_content_type(artifact_type: ArtifactType) -> str:
    return DOWNLOAD_CONTENT_TYPE[artifact_type]


class Artifact(RobolistBaseModel):
    """Defines an artifact that some user owns, like an image or uploaded file.

    Artifacts are stored in S3 and are accessible through CloudFront.

    Artifacts are associated to a given user and can come in different sizes;
    for example, the same image may have multiple possible sizes available.
    """

    user_id: str
    listing_id: str
    name: str
    artifact_type: ArtifactType
    sizes: list[ArtifactSize] | None = None
    description: str | None = None
    timestamp: int

    @classmethod
    def create(
        cls,
        user_id: str,
        listing_id: str,
        name: str,
        artifact_type: ArtifactType,
        sizes: list[ArtifactSize] | None = None,
        description: str | None = None,
    ) -> Self:
        return cls(
            id=new_uuid(),
            user_id=user_id,
            listing_id=listing_id,
            name=name,
            artifact_type=artifact_type,
            sizes=sizes,
            description=description,
            timestamp=int(time.time()),
        )


class Listing(RobolistBaseModel):
    """Defines a recursively-defined listing.

    Listings can have sub-listings with their component parts. They can also
    have associated user-uploaded artifacts like images and URDFs.
    """

    user_id: str
    name: str
    child_ids: list[str]
    description: str | None

    @classmethod
    def create(
        cls,
        user_id: str,
        name: str,
        child_ids: list[str],
        description: str | None = None,
    ) -> Self:
        return cls(
            id=new_uuid(),
            user_id=user_id,
            name=name,
            child_ids=child_ids,
            description=description,
        )


class ListingTag(RobolistBaseModel):
    """Marks a listing as having a given tag.

    This is useful for tagging listings with metadata, like "robot", "gripper",
    or "actuator". Tags are used to categorize listings and make them easier to
    search for.
    """

    listing_id: str
    name: str

    @classmethod
    def create(cls, listing_id: str, tag: str) -> Self:
        return cls(
            id=new_uuid(),
            listing_id=listing_id,
            name=tag,
        )
