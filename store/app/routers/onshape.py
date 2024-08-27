"""Defines the router endpoints for handling the Onshape flow."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, WebSocket, status
from pydantic.main import BaseModel

from store.app.db import Crud
from store.app.errors import ItemNotFoundError, NotAuthenticatedError
from store.app.model import User, can_write_listing
from store.app.routers.users import get_api_key_from_header, get_session_user_with_write_permission

onshape_router = APIRouter()

logger = logging.getLogger(__name__)


class SetRequest(BaseModel):
    onshape_url: str | None


@onshape_router.post("/set/{listing_id}")
async def set_onshape_document(
    listing_id: str,
    request: SetRequest,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> None:
    listing = await crud.get_listing(listing_id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    if not await can_write_listing(user, listing):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User cannot write to this listing")
    try:
        await crud.add_onshape_url_to_listing(listing_id, request.onshape_url)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@onshape_router.websocket("/pull/{listing_id}")
async def pull_onshape_document(
    listing_id: str,
    websocket: WebSocket,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> None:
    api_key_id = await get_api_key_from_header(websocket.headers, True)
    api_key = await crud.get_api_key(api_key_id)

    # Gets the user from the API key (should probably clean up this logic
    # instead of having it duplicated, it is here because websockets don't
    # include the normal requests object).
    try:
        api_key = await crud.get_api_key(api_key_id)
        if api_key.permissions is None or "read" not in api_key.permissions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
        try:
            user = await crud.get_user(api_key.user_id, throw_if_missing=True)
        except ItemNotFoundError:
            raise NotAuthenticatedError("Not authenticated")
    except ItemNotFoundError:
        raise NotAuthenticatedError("Not authenticated")

    # Gets the listing and makes sure the user has permission to write to it.
    listing = await crud.get_listing(listing_id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    if (onshape_url := listing.onshape_url) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No Onshape URL set for this listing")
    if not await can_write_listing(user, listing):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User cannot write to this listing")

    await websocket.accept()
    await crud.download_onshape_document(
        listing,
        onshape_url,
        websocket=websocket,
    )
    await websocket.close()
