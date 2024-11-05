"""Defines the router endpoints for handling listing artifacts."""

import asyncio
import logging
import os
from typing import Annotated, Self

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import RedirectResponse
from pydantic.main import BaseModel

from store.app.db import Crud
from store.app.model import (
    Artifact,
    ArtifactSize,
    ArtifactType,
    Listing,
    User,
    can_write_artifact,
    can_write_listing,
    check_content_type,
    get_artifact_type,
    get_artifact_url,
    get_artifact_urls,
)
from store.app.routers.users import (
    get_session_user_with_write_permission,
    maybe_get_user_from_api_key,
)
from store.settings import settings

artifacts_router = APIRouter()

logger = logging.getLogger(__name__)


@artifacts_router.get("/url/{artifact_type}/{listing_id}/{name}")
async def artifact_url(
    artifact_type: ArtifactType,
    listing_id: str,
    name: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    size: ArtifactSize = "large",
) -> RedirectResponse:
    # First, get the artifact to retrieve its ID
    artifacts = await crud.get_listing_artifacts(listing_id)
    artifact = next((a for a in artifacts if a.name == name and a.artifact_type == artifact_type), None)

    if artifact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find artifact associated with the given name and type",
        )

    # Construct the S3 filename using the artifact ID
    _, file_extension = os.path.splitext(name)
    s3_filename = f"{artifact.id}{file_extension}"

    # TODO: Use CloudFront API to return a signed CloudFront URL.
    return RedirectResponse(
        url=get_artifact_url(
            artifact_type=artifact.artifact_type,
            artifact_id=artifact.id,
            listing_id=listing_id,
            name=s3_filename,
            size=size,
        )
    )


class ArtifactUrls(BaseModel):
    small: str | None = None
    large: str


def get_artifact_url_response(artifact: Artifact) -> ArtifactUrls:
    artifact_urls = get_artifact_urls(artifact=artifact)
    return ArtifactUrls(
        small=artifact_urls.get("small"),
        large=artifact_urls["large"],
    )


class SingleArtifactResponse(BaseModel):
    artifact_id: str
    listing_id: str
    username: str
    slug: str
    name: str
    artifact_type: ArtifactType
    description: str | None
    timestamp: int
    urls: ArtifactUrls
    is_main: bool = False

    @classmethod
    async def from_artifact(cls, artifact: Artifact, crud: Crud, user: User | None = None) -> Self:
        if user is None:
            listing, user = await asyncio.gather(
                crud.get_listing(artifact.listing_id),
                crud.get_user(artifact.user_id),
            )
        else:
            listing = await crud.get_listing(artifact.listing_id)

        if listing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Could not find listing associated with the given artifact",
            )

        return cls.from_artifact_and_listing(artifact=artifact, listing=listing, user=user)

    @classmethod
    def from_artifact_and_listing(cls, artifact: Artifact, listing: Listing, user: User) -> Self:
        return cls(
            artifact_id=artifact.id,
            listing_id=artifact.listing_id,
            username=user.username,
            slug=listing.slug,
            name=artifact.name,
            artifact_type=artifact.artifact_type,
            description=artifact.description,
            timestamp=artifact.timestamp,
            urls=get_artifact_url_response(artifact=artifact),
            is_main=artifact.is_main,
        )


class ListArtifactsResponse(BaseModel):
    artifacts: list[SingleArtifactResponse]


@artifacts_router.get("/info/{artifact_id}")
async def get_artifact_info(
    artifact_id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User | None, Depends(maybe_get_user_from_api_key)],
) -> SingleArtifactResponse:
    artifact = await crud.get_raw_artifact(artifact_id)
    if artifact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find artifact associated with the given id",
        )
    return await SingleArtifactResponse.from_artifact(artifact=artifact, crud=crud)


@artifacts_router.get("/list/{listing_id}", response_model=ListArtifactsResponse)
async def list_artifacts(listing_id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> ListArtifactsResponse:
    artifacts = await crud.get_listing_artifacts(listing_id)

    # Sort artifacts so that the main image comes first
    sorted_artifacts = sorted(artifacts, key=lambda x: not x.is_main)

    return ListArtifactsResponse(
        artifacts=[
            await SingleArtifactResponse.from_artifact(artifact=artifact, crud=crud) for artifact in sorted_artifacts
        ],
    )


def validate_file(file: UploadFile) -> tuple[str, ArtifactType]:
    if file.filename is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Artifact filename was not provided",
        )
    if file.size is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Artifact size was not provided",
        )
    if file.size < settings.artifact.min_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Artifact size is too small; {file.size} is less than {settings.artifact.min_bytes} bytes",
        )
    if file.size > settings.artifact.max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Artifact size is too large; {file.size} is greater than {settings.artifact.max_bytes} bytes",
        )

    # Parses the artifact type from the content type and filename.
    artifact_type = get_artifact_type(file.content_type, file.filename)
    check_content_type(file.content_type, artifact_type)

    return file.filename, artifact_type


class UploadArtifactResponse(BaseModel):
    artifacts: list[SingleArtifactResponse]


@artifacts_router.post("/upload/{listing_id}", response_model=UploadArtifactResponse)
async def upload(
    listing_id: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    files: list[UploadFile],
) -> UploadArtifactResponse:
    # Checks that the user is not uploading too many files at once.
    if len(files) > settings.artifact.max_concurrent_file_uploads:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many files were uploaded concurrently",
        )
    filenames = [validate_file(file) for file in files]

    # Makes sure that filenames are unique.
    if len(set(filename for filename, _ in filenames)) != len(filenames):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate filenames were provided",
        )

    # Checks that the listing is valid.
    listing = await crud.get_listing(listing_id)

    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find listing associated with the given id",
        )
    if not await can_write_listing(user, listing):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to upload artifacts to this listing",
        )

    # Uploads the artifacts in chunks and adds them to the listing.
    artifacts = await asyncio.gather(
        *(
            crud.upload_artifact(
                name=filename,
                file=file,
                listing=listing,
                artifact_type=artifact_type,
            )
            for file, (filename, artifact_type) in zip(files, filenames)
        )
    )

    return UploadArtifactResponse(
        artifacts=[
            await SingleArtifactResponse.from_artifact(artifact=artifact, crud=crud, user=user)
            for artifact in artifacts
        ],
    )


class UpdateArtifactRequest(BaseModel):
    name: str | None = None
    description: str | None = None


@artifacts_router.put("/edit/{artifact_id}", response_model=bool)
async def edit_artifact(
    id: str,
    artifact: UpdateArtifactRequest,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    artifact_info = await crud.get_raw_artifact(id)
    if artifact_info is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artifact not found")
    if not await can_write_artifact(user, artifact_info):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this artifact",
        )
    await crud.edit_artifact(artifact_id=id, name=artifact.name, description=artifact.description)
    return True


@artifacts_router.delete("/delete/{artifact_id}", response_model=bool)
async def delete_artifact(
    artifact_id: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    artifact = await crud.get_raw_artifact(artifact_id)
    if artifact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find artifact associated with the given id",
        )
    if not await can_write_artifact(user, artifact):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to delete this artifact",
        )
    await crud.remove_artifact(artifact)
    return True


@artifacts_router.put("/list/{listing_id}/main", response_model=bool)
async def set_main_image(
    listing_id: str,
    artifact_id: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    listing = await crud.get_listing(listing_id)
    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )
    if not await can_write_listing(user, listing):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to edit this listing",
        )

    await crud.set_main_image(listing_id, artifact_id)
    return True
