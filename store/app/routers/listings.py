"""Defines all listing related API endpoints."""

import asyncio
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from store.app.db import Crud
from store.app.model import Listing, User
from store.app.routers.users import (
    get_session_user_with_read_permission,
    get_session_user_with_write_permission,
    maybe_get_user_from_api_key,
)

listings_router = APIRouter()

logger = logging.getLogger(__name__)


class ListListingsResponse(BaseModel):
    listing_ids: list[str]
    has_next: bool = False


@listings_router.get("/search", response_model=ListListingsResponse)
async def list_listings(
    crud: Annotated[Crud, Depends(Crud.get)],
    page: int = Query(description="Page number for pagination"),
    search_query: str = Query(None, description="Search query string"),
) -> ListListingsResponse:
    listings, has_next = await crud.get_listings(page, search_query=search_query)
    listing_ids = [listing.id for listing in listings]
    return ListListingsResponse(listing_ids=listing_ids, has_next=has_next)


class ListingInfoResponse(BaseModel):
    id: str
    name: str
    description: str | None
    child_ids: list[str]


class GetBatchListingsResponse(BaseModel):
    listings: list[ListingInfoResponse]


@listings_router.get("/batch", response_model=GetBatchListingsResponse)
async def get_batch_listing_info(
    crud: Annotated[Crud, Depends(Crud.get)],
    ids: list[str] = Query(description="List of part ids"),
) -> GetBatchListingsResponse:
    print("IDs:", ids)
    listings = await crud._get_item_batch(ids, Listing)
    return GetBatchListingsResponse(
        listings=[
            ListingInfoResponse(
                id=listing.id,
                name=listing.name,
                description=listing.description,
                child_ids=listing.child_ids,
            )
            for listing in listings
        ]
    )


class DumpListingsResponse(BaseModel):
    listings: list[Listing]


@listings_router.get("/dump", response_model=DumpListingsResponse)
async def dump_listings(
    crud: Annotated[Crud, Depends(Crud.get)],
) -> DumpListingsResponse:
    return DumpListingsResponse(listings=await crud.dump_listings())


@listings_router.get("/me", response_model=ListListingsResponse)
async def list_my_listings(
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
    page: int = Query(description="Page number for pagination"),
    search_query: str = Query(None, description="Search query string"),
) -> ListListingsResponse:
    listings, has_next = await crud.get_user_listings(user.id, page, search_query=search_query)
    listing_ids = [listing.id for listing in listings]
    return ListListingsResponse(listing_ids=listing_ids, has_next=has_next)


class NewListingRequest(BaseModel):
    name: str
    child_ids: list[str]
    description: str | None


class NewListingResponse(BaseModel):
    listing_id: str


@listings_router.post("/add", response_model=NewListingResponse)
async def add_listing(
    new_listing: NewListingRequest,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> NewListingResponse:
    listing = Listing.create(
        name=new_listing.name,
        description=new_listing.description,
        user_id=user.id,
        child_ids=new_listing.child_ids,
    )
    await crud.add_listing(listing)
    return NewListingResponse(listing_id=listing.id)


@listings_router.delete("/delete/{listing_id}", response_model=bool)
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


class UpdateListingRequest(BaseModel):
    name: str | None = None
    child_ids: list[str] | None = None
    description: str | None = None
    tags: list[str] | None = None


@listings_router.put("/edit/{id}", response_model=bool)
async def edit_listing(
    id: str,
    listing: UpdateListingRequest,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    listing_info = await crud.get_listing(id)
    if listing_info is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    if listing_info.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this listing")
    await crud.edit_listing(
        listing_id=id,
        name=listing.name,
        child_ids=listing.child_ids,
        description=listing.description,
        tags=listing.tags,
    )
    return True


class GetListingResponse(BaseModel):
    id: str
    name: str
    description: str | None
    child_ids: list[str]
    tags: list[str]
    owner_is_user: bool


@listings_router.get("/{id}", response_model=GetListingResponse)
async def get_listing(
    id: str,
    user: Annotated[User | None, Depends(maybe_get_user_from_api_key)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> GetListingResponse:
    listing, listing_tags = await asyncio.gather(
        crud.get_listing(id),
        crud.get_tags_for_listing(id),
    )
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    return GetListingResponse(
        id=listing.id,
        name=listing.name,
        description=listing.description,
        child_ids=listing.child_ids,
        tags=listing_tags,
        owner_is_user=user is not None and user.id == listing.user_id,
    )
