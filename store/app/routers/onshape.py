"""Defines the router endpoints for handling the Onshape flow."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic.main import BaseModel

from store.app.db import Crud
from store.app.model import User, can_write_listing
from store.app.routers.users import get_session_user_with_write_permission

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
    if not can_write_listing(user, listing):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User cannot write to this listing")
    try:
        await crud.add_onshape_url_to_listing(listing_id, request.onshape_url)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
