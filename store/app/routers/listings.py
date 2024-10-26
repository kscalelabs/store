"""Defines all listing related API endpoints."""

import asyncio
import logging
from typing import Annotated, List

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from pydantic import BaseModel

"""Defines all listing related API endpoints."""


from store.app.crud.listings import SortOption  # noqa: E402
from store.app.db import Crud  # noqa: E402
from store.app.model import (  # noqa: E402
    Listing,
    User,
    can_write_listing,
    get_artifact_url,
)
from store.app.routers.users import (  # noqa: E402
    get_session_user_with_read_permission,
    get_session_user_with_write_permission,
    maybe_get_user_from_api_key,
)

listings_router = APIRouter()

logger = logging.getLogger(__name__)


class ListingInfo(BaseModel):
    id: str
    username: str
    slug: str | None


class ListListingsResponse(BaseModel):
    listings: list[ListingInfo]
    has_next: bool = False


@listings_router.get("/search", response_model=ListListingsResponse)
async def list_listings(
    crud: Annotated[Crud, Depends(Crud.get)],
    page: int = Query(1, description="Page number for pagination"),
    search_query: str = Query("", description="Search query string"),
    sort_by: SortOption = Query(SortOption.NEWEST, description="Sort option for listings"),
) -> ListListingsResponse:
    listings, has_next = await crud.get_listings(page, search_query=search_query, sort_by=sort_by)
    listing_infos = [
        ListingInfo(id=listing.id, username=listing.username or "Unknown", slug=listing.slug) for listing in listings
    ]
    return ListListingsResponse(listings=listing_infos, has_next=has_next)


class ListingInfoResponse(BaseModel):
    id: str
    name: str
    slug: str | None
    username: str | None
    description: str | None
    child_ids: list[str]
    image_url: str | None
    onshape_url: str | None
    created_at: int
    views: int
    score: int
    user_vote: bool | None


class GetBatchListingsResponse(BaseModel):
    listings: list[ListingInfoResponse]


@listings_router.get("/batch", response_model=GetBatchListingsResponse)
async def get_batch_listing_info(
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User | None, Depends(maybe_get_user_from_api_key)],
    ids: list[str] = Query(description="List of part ids"),
) -> GetBatchListingsResponse:
    logger.info(f"Fetching batch listing info for ids: {ids}")

    listings, artifacts = await asyncio.gather(
        crud._get_item_batch(ids, Listing),
        crud.get_listings_artifacts(ids),
    )

    logger.info(f"Retrieved {len(listings)} listings and {len(artifacts)} artifacts")

    user_votes = {}
    if user:
        user_votes = {vote.listing_id: vote.is_upvote for vote in await crud.get_user_votes(user.id, ids)}

    logger.info(f"User votes: {user_votes}")

    listing_responses = []
    for listing, artifacts in zip(listings, artifacts):
        if listing is not None:
            try:
                image_url = next(
                    (
                        get_artifact_url(artifact=artifact, size="small")
                        for artifact in artifacts
                        if artifact.artifact_type == "image"
                    ),
                    None,
                )
                listing_response = ListingInfoResponse(
                    id=listing.id,
                    name=listing.name,
                    slug=listing.slug,  # This can be None
                    username=listing.username,
                    description=listing.description,
                    child_ids=listing.child_ids,
                    image_url=image_url,
                    onshape_url=listing.onshape_url,
                    created_at=listing.created_at,
                    views=listing.views,
                    score=listing.score,
                    user_vote=user_votes.get(listing.id),
                )
                listing_responses.append(listing_response)
            except Exception as e:
                logger.error(f"Error creating ListingInfoResponse for listing {listing.id}: {str(e)}")

    logger.info(f"Returning {len(listing_responses)} listing responses")
    return GetBatchListingsResponse(listings=listing_responses)


class DumpListingsResponse(BaseModel):
    listings: list[Listing]


@listings_router.get("/dump", response_model=DumpListingsResponse)
async def dump_listings(
    crud: Annotated[Crud, Depends(Crud.get)],
) -> DumpListingsResponse:
    return DumpListingsResponse(listings=await crud.dump_listings())


@listings_router.get("/user/{user_id}", response_model=ListListingsResponse)
async def get_user_listings(
    user_id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    page: int = Query(1, description="Page number for pagination"),
) -> ListListingsResponse:
    listings, has_next = await crud.get_user_listings(user_id, page)
    listing_infos = [
        ListingInfo(id=listing.id, username=listing.username or "Unknown", slug=listing.slug) for listing in listings
    ]
    return ListListingsResponse(listings=listing_infos, has_next=has_next)


@listings_router.get("/me", response_model=ListListingsResponse)
async def get_my_listings(
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    page: int = Query(1, description="Page number for pagination"),
) -> ListListingsResponse:
    listings, has_next = await crud.get_user_listings(user.id, page)
    listing_infos = [
        ListingInfo(id=listing.id, username=listing.username or user.username, slug=listing.slug)
        for listing in listings
    ]
    return ListListingsResponse(listings=listing_infos, has_next=has_next)


class NewListingRequest(BaseModel):
    name: str
    description: str | None
    child_ids: list[str]
    slug: str
    stripe_link: str | None
    key_features: str | None
    price: float | None  # Add this line


class NewListingResponse(BaseModel):
    listing_id: str
    username: str
    slug: str


@listings_router.post("/add", response_model=NewListingResponse)
async def add_listing(
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    name: str = Form(...),
    description: str | None = Form(None),
    child_ids: str = Form(""),
    slug: str = Form(""),
    stripe_link: str | None = Form(None),
    key_features: str | None = Form(None),
    price: float | None = Form(None),
    photos: List[UploadFile] = File(None),
) -> NewListingResponse:
    logger.info(f"Received {len(photos) if photos else 0} photos")

    # Convert price to float if it's not None
    float_price = float(price) if price is not None else None

    # Creates a new listing.
    listing = Listing.create(
        name=name,
        description=description or "",
        child_ids=child_ids.split(",") if child_ids else [],
        slug=slug,
        user_id=user.id,
        username=user.username,
        stripe_link=stripe_link,
        key_features=key_features or "",
        price=float_price,  # Use float_price instead of decimal_price
    )
    await crud.add_listing(listing)

    # Handle photo uploads
    if photos:
        for photo in photos:
            if photo.filename:  # Add this check
                await crud.upload_artifact(
                    name=photo.filename,
                    file=photo,
                    listing=listing,
                    artifact_type="image",
                )
            else:
                logger.warning("Skipping photo upload due to missing filename")

    return NewListingResponse(listing_id=listing.id, username=user.username, slug=slug)


@listings_router.delete("/delete/{listing_id}", response_model=bool)
async def delete_listing(
    listing_id: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    listing = await crud.get_listing(listing_id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    if not await can_write_listing(user, listing):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this listing.",
        )
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")
    if not await can_write_listing(user, listing_info):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this listing.",
        )
    if listing.name is not None and len(listing.name) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing name must be at least 4 characters long.",
        )
    if listing.description is not None and len(listing.description) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing description must be at least 6 characters long.",
        )
    await crud.edit_listing(
        listing_id=id,
        name=listing.name,
        child_ids=listing.child_ids,
        description=listing.description,
        tags=listing.tags,
    )
    return True


class UpvotedListingsResponse(BaseModel):
    upvoted_listing_ids: list[str]
    has_more: bool


@listings_router.get("/upvotes", response_model=ListListingsResponse)
async def get_upvoted_listings(
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    page: int = Query(1, description="Page number for pagination"),
) -> ListListingsResponse:
    listings, has_next = await crud.get_upvoted_listings(user.id, page)
    listing_infos = [
        ListingInfo(id=listing["id"], username=listing["username"] or "Unknown", slug=listing["slug"])
        for listing in listings
    ]
    return ListListingsResponse(listings=listing_infos, has_next=has_next)


class GetListingResponse(BaseModel):
    id: str
    name: str
    username: str | None
    slug: str | None
    description: str | None
    child_ids: list[str]
    tags: list[str]
    onshape_url: str | None
    can_edit: bool
    created_at: int
    views: int
    score: int
    user_vote: bool | None
    creator_id: str
    creator_name: str | None
    key_features: str | None
    price: float | None  # Add this line


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

    user_vote = None
    if user and (vote := await crud.get_user_vote(user.id, id)) is not None:
        user_vote = vote.is_upvote

    creator_name = None
    if (creator := await crud.get_user_public(listing.user_id)) is not None:
        creator_name = " ".join(filter(None, [creator.first_name, creator.last_name]))

    # Convert Decimal to float if price is not None
    price = float(listing.price) if listing.price is not None else None

    return GetListingResponse(
        id=listing.id,
        name=listing.name,
        username=listing.username,
        slug=listing.slug,
        description=listing.description,
        child_ids=listing.child_ids,
        tags=listing_tags,
        onshape_url=listing.onshape_url,
        can_edit=user is not None and await can_write_listing(user, listing),
        created_at=listing.created_at,
        views=listing.views,
        score=listing.score,
        user_vote=user_vote,
        creator_id=listing.user_id,
        creator_name=creator_name,
        key_features=listing.key_features,
        price=price,  # Use the converted price here
    )


@listings_router.post("/{id}/view")
async def increment_view_count(
    id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> None:
    listing = await crud.get_listing(id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    await crud.increment_view_count(id)


class VoteListingResponse(BaseModel):
    score: int
    user_vote: bool


@listings_router.post("/{id}/vote")
async def vote_listing(
    id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    upvote: bool = Query(..., description="True for upvote, False for downvote"),
) -> None:
    await crud.handle_vote(user.id, id, upvote)


@listings_router.delete("/{id}/vote")
async def remove_vote(
    id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
) -> None:
    await crud.handle_vote(user.id, id, None)


@listings_router.put("/edit/{id}/slug", response_model=bool)
async def update_listing_slug(
    id: str,
    new_slug: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    listing = await crud.get_listing(id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    if not await can_write_listing(user, listing):
        raise HTTPException(status_code=403, detail="You don't have permission to edit this listing")
    if await crud.is_slug_taken(user.id, new_slug):
        raise HTTPException(status_code=400, detail="Slug is already taken for this user")
    await crud.set_slug(id, new_slug)
    return True


@listings_router.get("/{username}/{slug}", response_model=GetListingResponse)
async def get_listing_by_username_and_slug(
    username: str,
    slug: str,
    user: Annotated[User | None, Depends(maybe_get_user_from_api_key)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> GetListingResponse:
    listing = await crud.get_listing_by_username_and_slug(username, slug)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing_tags = await crud.get_tags_for_listing(listing.id)

    user_vote = None
    if user and (vote := await crud.get_user_vote(user.id, listing.id)) is not None:
        user_vote = vote.is_upvote

    creator_name = None
    if (creator := await crud.get_user_public(listing.user_id)) is not None:
        creator_name = " ".join(filter(None, [creator.first_name, creator.last_name]))

    # Convert Decimal to float if price is not None
    price = float(listing.price) if listing.price is not None else None

    return GetListingResponse(
        id=listing.id,
        name=listing.name,
        username=listing.username,
        slug=listing.slug,
        description=listing.description,
        child_ids=listing.child_ids,
        tags=listing_tags,
        onshape_url=listing.onshape_url,
        can_edit=user is not None and await can_write_listing(user, listing),
        created_at=listing.created_at,
        views=listing.views,
        score=listing.score,
        user_vote=user_vote,
        creator_id=listing.user_id,
        creator_name=creator_name,
        key_features=listing.key_features,
        price=price,  # Use the converted price here
    )
