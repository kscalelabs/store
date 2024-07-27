"""Defines all listing related API endpoints."""

import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from store.app.db import Crud
from store.app.model import Listing, User
from store.app.routers.users import (
    get_session_user_with_read_permission,
    get_session_user_with_write_permission,
)
from store.utils import new_uuid

listings_router = APIRouter()

logger = logging.getLogger(__name__)


class NewListing(BaseModel):
    name: str
    child_ids: list[str]
    artifact_ids: list[str]
    description: str | None


@listings_router.get("/search")
async def list_listings(
    crud: Annotated[Crud, Depends(Crud.get)],
    page: int = Query(description="Page number for pagination"),
    search_query: str = Query(None, description="Search query string"),
) -> tuple[list[Listing], bool]:
    return await crud.get_listings(page, search_query=search_query)


@listings_router.get("/me")
async def list_my_listings(
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
    page: int = Query(description="Page number for pagination"),
    search_query: str = Query(None, description="Search query string"),
) -> tuple[list[Listing], bool]:
    return await crud.get_user_listings(user.id, page, search_query=search_query)


@listings_router.post("/add")
async def add_listing(
    new_listing: NewListing,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    await crud.add_listing(
        Listing(
            id=str(new_uuid()),
            name=new_listing.name,
            description=new_listing.description,
            user_id=user.id,
            artifact_ids=new_listing.artifact_ids,
            child_ids=new_listing.child_ids,
        )
    )
    return True


@listings_router.delete("/delete/{listing_id}")
async def delete_listing(
    listing_id: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    listing = await crud.get_listing(listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.user_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this listing")
    await crud.delete_listing(listing_id)
    return True


@listings_router.post("/edit/{id}")
async def edit_listing(
    id: str,
    listing: dict[str, Any],
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    listing_info = await crud.get_listing(id)
    if listing_info is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing_info.user_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this listing")
    listing["user_id"] = user.id
    await crud._update_item(id, Listing, listing)
    return True


@listings_router.get("/{id}")
async def get_listing(id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> Listing | None:
    return await crud.get_listing(id)
