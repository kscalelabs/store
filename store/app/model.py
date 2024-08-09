"""Defines the table models for the API.

These correspond directly with the rows in our database, and provide helper
methods for converting from our input data into the format the database
expects (for example, converting a UUID into a string).
"""

import time
from datetime import datetime, timedelta
from typing import Literal, Self

from pydantic import BaseModel, EmailStr

from store.app.utils.password import hash_password
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

    Users are defined by their id and email (both unique).
    Hashed password is set if user signs up with email and password, and is
    left empty if the user signed up with Google or Github OAuth.
    """

    email: EmailStr
    hashed_password: str | None = None
    permissions: set[UserPermission] | None = None
    created_at: int
    updated_at: int
    github_id: str | None = None
    google_id: str | None = None

    @classmethod
    def create(
        cls,
        email: str,
        password: str | None = None,
        github_id: str | None = None,
        google_id: str | None = None,
    ) -> Self:
        now = int(time.time())
        hashed_pw = hash_password(password) if password else None
        return cls(
            id=new_uuid(),
            email=email,
            hashed_password=hashed_pw,
            created_at=now,
            updated_at=now,
            github_id=github_id,
            google_id=google_id,
        )

    def update_timestamp(self) -> None:
        self.updated_at = int(time.time())

    def verify_email(self) -> None:
        self.email_verified_at = int(time.time())


class EmailSignUpToken(RobolistBaseModel):
    """
    Object created when user attempts to sign up with email.

    Will be checked by register dynamic route
    """

    token: str

    @classmethod
    def create(cls) -> Self:
        return cls(token=new_uuid())


class OAuthKey(RobolistBaseModel):
    """Keys for OAuth providers which identify users."""

    user_id: str
    provider: str
    user_token: str

    @classmethod
    def create(cls, user_id: str, provider: str, user_token: str) -> Self:
        return cls(id=new_uuid(), user_id=user_id, provider=provider, user_token=user_token)


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
    def create(cls, user_id: str, source: APIKeySource, permissions: APIKeyPermissionSet) -> Self:
        if permissions == "full":
            permissions = {"read", "write", "admin"}
        ttl_timestamp = int((datetime.utcnow() + timedelta(days=90)).timestamp())
        return cls(id=new_uuid(), user_id=user_id, source=source, permissions=permissions, ttl=ttl_timestamp)


ArtifactSize = Literal["small", "large"]
ArtifactType = Literal["image", "urdf", "mjcf", "stl"]

UPLOAD_CONTENT_TYPE_OPTIONS: dict[ArtifactType, set[str]] = {
    # Image
    "image": {"image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"},
    # XML
    "urdf": {"application/xml"},
    "mjcf": {"application/xml"},
    # Binary or text
    "stl": {"application/octet-stream", "text/xml"},
}

DOWNLOAD_CONTENT_TYPE: dict[ArtifactType, str] = {
    # Image
    "image": "image/png",
    # XML
    "urdf": "application/xml",
    "mjcf": "application/xml",
    # Binary
    "stl": "application/octet-stream",
}

SizeMapping: dict[ArtifactSize, tuple[int, int]] = {
    "large": settings.artifact.large_image_size,
    "small": settings.artifact.small_image_size,
}


def get_artifact_name(id: str, artifact_type: ArtifactType, size: ArtifactSize = "large") -> str:
    match artifact_type:
        case "image":
            if size is None:
                raise ValueError("Image artifacts should have a size")
            height, width = SizeMapping[size]
            return f"{id}_{size}_{height}x{width}.png"
        case "urdf":
            return f"{id}.urdf"
        case "mjcf":
            return f"{id}.xml"
        case "stl":
            return f"{id}.stl"
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
