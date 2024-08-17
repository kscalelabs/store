"""Defines the table models for the API.

These correspond directly with the rows in our database, and provide helper
methods for converting from our input data into the format the database
expects (for example, converting a UUID into a string).
"""

import time
from datetime import datetime, timedelta
from typing import Literal, Self

from pydantic import BaseModel

from store.app.errors import InternalError
from store.app.utils.password import hash_password
from store.settings import settings
from store.utils import new_uuid


class StoreBaseModel(BaseModel):
    """Defines the base model for store database rows.

    Our database architecture uses a single table with a single primary key
    (the `id` field). This class provides a common interface for all models
    that are stored in the database.
    """

    id: str


UserPermission = Literal["is_admin"]


class User(StoreBaseModel):
    """Defines the user model for the API.

    Users are defined by their id and email (both unique).
    Hashed password is set if user signs up with email and password, and is
    left empty if the user signed up with Google or Github OAuth.
    """

    email: str
    hashed_password: str | None = None
    permissions: set[UserPermission] | None = None
    created_at: int
    updated_at: int
    github_id: str | None = None
    google_id: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    name: str | None = None
    bio: str | None = None

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


class UserPublic(BaseModel):
    """Defines public user model for frontend.

    Omits private/sesnsitive user fields. Is the return type for
    retrieving user data on frontend (for public profile pages, etc).
    """

    id: str
    email: str
    permissions: set[UserPermission] | None = None
    created_at: int | None = None
    updated_at: int | None = None
    first_name: str | None = None
    last_name: str | None = None
    name: str | None = None
    bio: str | None = None


class EmailSignUpToken(StoreBaseModel):
    """Object created when user attempts to sign up with email.

    Will be checked by signup dynamic route to render SignupForm if authorized.
    """

    email: str

    @classmethod
    def create(cls, email: str) -> Self:
        return cls(id=new_uuid(), email=email)


class OAuthKey(StoreBaseModel):
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


class APIKey(StoreBaseModel):
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
    "urdf": {"application/octet-stream", "text/xml", "application/xml"},
    "mjcf": {"application/octet-stream", "text/xml", "application/xml"},
    # Binary or text
    "stl": {"application/octet-stream", "text/plain"},
}

DOWNLOAD_CONTENT_TYPE: dict[ArtifactType, str] = {
    # Image
    "image": "image/png",
    # XML
    "urdf": "application/octet-stream",
    "mjcf": "application/octet-stream",
    # Binary
    "stl": "application/octet-stream",
}

SizeMapping: dict[ArtifactSize, tuple[int, int]] = {
    "large": settings.artifact.large_image_size,
    "small": settings.artifact.small_image_size,
}


def get_artifact_type(content_type: str, filename: str) -> ArtifactType:
    # Attempts to determine from file extension.
    extension = filename.split(".")[-1].lower()
    if extension in ("png", "jpeg", "jpg", "gif", "webp"):
        return "image"
    if extension in ("urdf", "xml"):
        return "urdf"
    if extension in ("mjcf",):
        return "mjcf"
    if extension in ("stl",):
        return "stl"

    # Attempts to determine from content type.
    if content_type in UPLOAD_CONTENT_TYPE_OPTIONS["image"]:
        return "image"
    if content_type in UPLOAD_CONTENT_TYPE_OPTIONS["urdf"]:
        return "urdf"
    if content_type in UPLOAD_CONTENT_TYPE_OPTIONS["mjcf"]:
        return "mjcf"
    if content_type in UPLOAD_CONTENT_TYPE_OPTIONS["stl"]:
        return "stl"

    # Throws a value error if the type cannot be determined.
    raise ValueError(f"Unknown content type for file: {filename}")


def get_content_type(artifact_type: ArtifactType) -> str:
    return DOWNLOAD_CONTENT_TYPE[artifact_type]


class Artifact(StoreBaseModel):
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


class Listing(StoreBaseModel):
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


class ListingTag(StoreBaseModel):
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


def get_artifact_name(
    *,
    artifact: Artifact | None = None,
    listing_id: str | None = None,
    name: str | None = None,
    artifact_type: ArtifactType | None = None,
    size: ArtifactSize = "large",
) -> str:
    if artifact:
        listing_id = artifact.listing_id
        name = artifact.name
        artifact_type = artifact.artifact_type
    elif not listing_id or not name or not artifact_type:
        raise InternalError("Must provide artifact or listing_id, name, and artifact_type")

    match artifact_type:
        case "image":
            height, width = SizeMapping[size]
            return f"{listing_id}/{size}_{height}x{width}_{name}"
        case "urdf":
            return f"{listing_id}/{name}"
        case "mjcf":
            return f"{listing_id}/{name}"
        case "stl":
            return f"{listing_id}/{name}"
        case _:
            raise ValueError(f"Unknown artifact type: {artifact_type}")


def get_artifact_url(
    *,
    artifact: Artifact | None = None,
    artifact_type: ArtifactType | None = None,
    listing_id: str | None = None,
    name: str | None = None,
    size: ArtifactSize = "large",
) -> str:
    artifact_name = get_artifact_name(
        artifact=artifact,
        listing_id=listing_id,
        name=name,
        artifact_type=artifact_type,
        size=size,
    )
    return f"{settings.site.artifact_base_url}/{artifact_name}"
