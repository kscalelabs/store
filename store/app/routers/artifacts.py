"""Defines the router endpoints for handling listing artifacts."""

import logging
import os
from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from fastapi.responses import RedirectResponse
from pydantic.main import BaseModel

from store.app.db import Crud
from store.app.model import (
    Artifact,
    ArtifactLabel,
    ArtifactSize,
    ArtifactType,
    User,
    can_read_artifact,
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
    listing_id: str | None
    name: str
    artifact_type: ArtifactType
    description: str | None
    timestamp: int
    urls: ArtifactUrls


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

    return SingleArtifactResponse(
        artifact_id=artifact.id,
        listing_id=artifact.listing_id,
        name=artifact.name,
        artifact_type=artifact.artifact_type,
        description=artifact.description,
        timestamp=artifact.timestamp,
        urls=get_artifact_url_response(artifact=artifact),
    )


@artifacts_router.get("/list/{listing_id}", response_model=ListArtifactsResponse)
async def list_artifacts(listing_id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> ListArtifactsResponse:
    return ListArtifactsResponse(
        artifacts=[
            SingleArtifactResponse(
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
    artifacts: list[SingleArtifactResponse]


@artifacts_router.post("/upload", response_model=UploadArtifactResponse)
async def upload(
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    file: UploadFile,
    name: str = Form(...),
    artifact_type: ArtifactType = Form(...),
    listing_id: str | None = Form(None),
    description: str | None = Form(None),
    label: ArtifactLabel | None = Form(None),
    is_official: bool = Form(True),
) -> UploadArtifactResponse:
    logger.info(f"Starting upload process for file: {name}")
    try:
        filename, artifact_type = validate_file(file)
        logger.info(f"File validated: {filename}, type: {artifact_type}")

        listing = None
        if listing_id:
            listing = await crud.get_listing(listing_id)
            if listing is None:
                logger.error(f"Listing not found: {listing_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Could not find listing associated with the given id",
                )
            if not await can_write_listing(user, listing):
                logger.error(f"User {user.id} does not have permission to upload to listing {listing_id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User does not have permission to upload artifacts to this listing",
                )

        logger.info(f"Uploading artifact: {name}")
        artifact = await crud.upload_artifact(
            name=name,
            file=file,
            user_id=user.id,
            artifact_type=artifact_type,
            listing=listing,
            description=description,
            label=label,
            is_official=is_official,
        )
        logger.info(f"Artifact uploaded successfully: {artifact.id}")

        response = UploadArtifactResponse(
            artifacts=[
                SingleArtifactResponse(
                    artifact_id=artifact.id,
                    listing_id=artifact.listing_id,
                    name=artifact.name,
                    artifact_type=artifact.artifact_type,
                    description=artifact.description,
                    timestamp=artifact.timestamp,
                    urls=get_artifact_url_response(artifact=artifact),
                )
            ]
        )
        logger.info(f"Upload process completed successfully for file: {name}")
        return response
    except Exception as e:
        logger.error(f"Error during upload process: {str(e)}")
        raise


@artifacts_router.get("/download/{artifact_id}")
async def download_artifact(
    artifact_id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User | None, Depends(maybe_get_user_from_api_key)],
) -> RedirectResponse:
    artifact = await crud.get_raw_artifact(artifact_id)
    if artifact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find artifact associated with the given id",
        )

    if not await can_read_artifact(user, artifact):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to download this artifact",
        )

    # Increment download count
    await crud.increment_artifact_downloads(artifact_id)

    return RedirectResponse(
        url=get_artifact_url(
            artifact_type=artifact.artifact_type,
            artifact_id=artifact.id,
            listing_id=artifact.listing_id,
            name=artifact.name,
            size="large",
        )
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
