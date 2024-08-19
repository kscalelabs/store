"""Defines the router endpoints for handling listing artifacts."""

import asyncio
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import RedirectResponse
from pydantic.main import BaseModel

from store.app.db import Crud
from store.app.model import (
    Artifact,
    ArtifactSize,
    ArtifactType,
    User,
    can_write_artifact,
    can_write_listing,
    check_content_type,
    get_artifact_type,
    get_artifact_url,
    get_artifact_urls,
)
from store.app.routers.users import get_session_user_with_write_permission
from store.settings import settings

artifacts_router = APIRouter()

logger = logging.getLogger(__name__)


@artifacts_router.get("/url/{artifact_type}/{listing_id}/{name}")
async def artifact_url(
    artifact_type: ArtifactType,
    listing_id: str,
    name: str,
    size: ArtifactSize = "large",
) -> RedirectResponse:
    # TODO: Use CloudFront API to return a signed CloudFront URL.
    return RedirectResponse(
        url=get_artifact_url(
            artifact_type=artifact_type,
            listing_id=listing_id,
            name=name,
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


class ListArtifactsItem(BaseModel):
    artifact_id: str
    listing_id: str
    name: str
    artifact_type: ArtifactType
    description: str | None
    timestamp: int
    urls: ArtifactUrls
    is_new: bool | None = None


class ListArtifactsResponse(BaseModel):
    artifacts: list[ListArtifactsItem]


@artifacts_router.get("/list/{listing_id}", response_model=ListArtifactsResponse)
async def list_artifacts(listing_id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> ListArtifactsResponse:
    return ListArtifactsResponse(
        artifacts=[
            ListArtifactsItem(
                artifact_id=artifact.id,
                listing_id=artifact.listing_id,
                name=artifact.name,
                artifact_type=artifact.artifact_type,
                description=artifact.description,
                timestamp=artifact.timestamp,
                urls=get_artifact_url_response(artifact=artifact),
            )
            for artifact in await crud.get_listing_artifacts(listing_id)
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
    artifacts: list[ListArtifactsItem]


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
                file=file,
                name=filename,
                listing=listing,
                artifact_type=artifact_type,
            )
            for file, (filename, artifact_type) in zip(files, filenames)
        )
    )

    return UploadArtifactResponse(
        artifacts=[
            ListArtifactsItem(
                artifact_id=artifact.id,
                listing_id=artifact.listing_id,
                name=artifact.name,
                artifact_type=artifact.artifact_type,
                description=artifact.description,
                timestamp=artifact.timestamp,
                urls=get_artifact_url_response(artifact=artifact),
                is_new=is_new,
            )
            for artifact, is_new in artifacts
        ]
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
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    artifact_id: str,
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
