"""Defines all listing related API endpoints."""

import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from store.app.db import Crud
from store.app.model import Listing, User
from store.app.routers.users import (
    get_session_user_with_read_permission,
    get_session_user_with_write_permission,
    maybe_get_user_from_api_key,
)
from store.utils import new_uuid

listings_router = APIRouter()

logger = logging.getLogger(__name__)


class NewListing(BaseModel):
    name: str
    child_ids: list[str]
    description: str | None


@listings_router.get("/search")
async def list_listings(
    crud: Annotated[Crud, Depends(Crud.get)],
    page: int = Query(description="Page number for pagination"),
    search_query: str = Query(None, description="Search query string"),
) -> tuple[list[Listing], bool]:
    return await crud.get_listings(page, search_query=search_query)


@listings_router.get("/batch")
async def get_batch(
    crud: Annotated[Crud, Depends(Crud.get)],
    ids: list[str] = Query(description="List of part ids"),
) -> list[Listing]:
    return await crud._get_item_batch(ids, Listing)


@listings_router.get("/dump")
async def dump_listings(
    crud: Annotated[Crud, Depends(Crud.get)],
) -> list[Listing]:
    return await crud.dump_listings()


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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    if listing.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this listing")
    await crud.delete_listing(listing)
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    if listing_info.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this listing")
    await crud._update_item(id, Listing, listing)
    return True


class GetListingResponse(BaseModel):
    id: str
    name: str
    description: str | None
    child_ids: list[str]
    owner_is_user: bool


@listings_router.get("/{id}", response_model=GetListingResponse)
async def get_listing(
    id: str,
    user: Annotated[User | None, Depends(maybe_get_user_from_api_key)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> GetListingResponse | None:
    listing = await crud.get_listing(id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    return GetListingResponse(
        id=listing.id,
        name=listing.name,
        description=listing.description,
        child_ids=listing.child_ids,
        owner_is_user=user is not None and user.id == listing.user_id,
    )
