"""Defines all listing related API endpoints."""

import asyncio
import logging
from typing import Annotated, List, Literal

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

from store.app.crud.listings import SortOption
from store.app.db import Crud
from store.app.model import Listing, User, can_write_listing
from store.app.routers.artifacts import SingleArtifactResponse
from store.app.routers.stripe import create_listing_product
from store.app.security.user import (
    get_session_user_with_read_permission,
    get_session_user_with_write_permission,
    maybe_get_user_from_api_key,
)
from store.settings.environment import EnvironmentSettings

# Create settings instance
settings = EnvironmentSettings()

router = APIRouter()

logger = logging.getLogger(__name__)


class FeaturedListingsResponse(BaseModel):
    listing_ids: list[str]


@router.get("/featured", response_model=FeaturedListingsResponse)
async def get_featured_listings(
    crud: Annotated[Crud, Depends(Crud.get)],
) -> FeaturedListingsResponse:
    """Get the current list of featured listing IDs."""
    featured_ids = await crud.get_featured_listings()
    return FeaturedListingsResponse(listing_ids=featured_ids)


@router.put("/featured/{listing_id}", response_model=bool)
async def toggle_featured_listing(
    listing_id: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    featured: bool = Query(...),
) -> bool:
    if not user.permissions or ("is_content_manager" not in user.permissions and "is_admin" not in user.permissions):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content managers and admins can set featured listings",
        )

    listing = await crud.get_listing(listing_id)
    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing ID does not exist",
        )

    current_featured = await crud.get_featured_listings()

    if featured and listing_id not in current_featured and len(current_featured) >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum of 3 featured listings allowed. Unfeature another listing first.",
        )

    if featured and listing_id not in current_featured:
        current_featured.append(listing_id)
    elif not featured and listing_id in current_featured:
        current_featured.remove(listing_id)

    await crud.set_featured_listings(current_featured)
    return featured


@router.delete("/featured/{listing_id}", response_model=bool)
async def remove_featured_listing(
    listing_id: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    if not user.permissions or ("content_manager" not in user.permissions and "is_admin" not in user.permissions):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content managers can modify featured listings",
        )

    current_featured = await crud.get_featured_listings()
    if listing_id in current_featured:
        current_featured.remove(listing_id)
        await crud.set_featured_listings(current_featured)

    return True


class ListingInfo(BaseModel):
    id: str
    username: str
    slug: str | None


class ListListingsResponse(BaseModel):
    listings: list[ListingInfo]
    has_next: bool = False


@router.get("/search", response_model=ListListingsResponse)
async def list_listings(
    crud: Annotated[Crud, Depends(Crud.get)],
    page: int = Query(1, description="Page number for pagination"),
    search_query: str = Query("", description="Search query string"),
    sort_by: SortOption = Query(SortOption.NEWEST, description="Sort option for listings"),
) -> ListListingsResponse:
    listings, has_next = await crud.get_listings(page, search_query=search_query, sort_by=sort_by)
    listings_with_usernames = await crud.get_listings_with_usernames(listings)
    listing_infos = [
        ListingInfo(id=listing.id, username=username, slug=listing.slug)
        for listing, username in listings_with_usernames
    ]
    return ListListingsResponse(listings=listing_infos, has_next=has_next)


class ListingInfoResponse(BaseModel):
    id: str
    name: str
    slug: str | None
    username: str | None
    description: str | None
    child_ids: list[str]
    artifacts: list[SingleArtifactResponse]
    onshape_url: str | None
    created_at: int
    views: int
    score: int
    user_vote: bool | None
    price_amount: int | None
    currency: str | None
    inventory_type: Literal["finite", "preorder"] | None
    inventory_quantity: int | None


class GetBatchListingsResponse(BaseModel):
    listings: list[ListingInfoResponse]


@router.get("/batch", response_model=GetBatchListingsResponse)
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

    users = await crud.get_user_batch(list(set(listing.user_id for listing in listings)))
    user_id_to_user = {user.id: user for user in users}
    if any(listing.user_id not in user_id_to_user for listing in listings):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find user associated with the given listing",
        )

    user_votes = {}
    if user:
        user_votes = {vote.listing_id: vote.is_upvote for vote in await crud.get_user_votes(user.id, ids)}

    listing_responses = []
    for listing, artifacts in zip(listings, artifacts):
        if listing is not None:
            try:
                artifact_responses = await asyncio.gather(
                    *(
                        SingleArtifactResponse.from_artifact(
                            artifact=artifact,
                            crud=crud,
                            listing=listing,
                            creator=user_id_to_user[listing.user_id],
                            user=user,
                        )
                        for artifact in sorted(artifacts, key=lambda x: (not x.is_main, -x.timestamp))
                    )
                )
                listing_response = ListingInfoResponse(
                    id=listing.id,
                    name=listing.name,
                    slug=listing.slug,
                    username=user_id_to_user[listing.user_id].username,
                    description=listing.description,
                    child_ids=listing.child_ids,
                    artifacts=list(artifact_responses),
                    onshape_url=listing.onshape_url,
                    created_at=listing.created_at,
                    views=listing.views,
                    score=listing.score,
                    user_vote=user_votes.get(listing.id),
                    price_amount=listing.price_amount,
                    currency=listing.currency,
                    inventory_type=listing.inventory_type,
                    inventory_quantity=listing.inventory_quantity,
                )
                listing_responses.append(listing_response)
            except Exception as e:
                logger.error(f"Error creating ListingInfoResponse for listing {listing.id}: {str(e)}")

    return GetBatchListingsResponse(listings=listing_responses)


class DumpListingsResponse(BaseModel):
    listings: list[Listing]


@router.get("/dump", response_model=DumpListingsResponse)
async def dump_listings(
    crud: Annotated[Crud, Depends(Crud.get)],
) -> DumpListingsResponse:
    return DumpListingsResponse(listings=await crud.dump_listings())


@router.get("/user/{user_id}", response_model=ListListingsResponse)
async def get_user_listings(
    user_id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    page: int = Query(1, description="Page number for pagination"),
) -> ListListingsResponse:
    listings, has_next = await crud.get_user_listings(user_id, page)
    listings_with_usernames = await crud.get_listings_with_usernames(listings)
    listing_infos = [
        ListingInfo(id=listing.id, username=username, slug=listing.slug)
        for listing, username in listings_with_usernames
    ]
    return ListListingsResponse(listings=listing_infos, has_next=has_next)


@router.get("/me", response_model=ListListingsResponse)
async def get_my_listings(
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    page: int = Query(1, description="Page number for pagination"),
) -> ListListingsResponse:
    listings, has_next = await crud.get_user_listings(user.id, page)
    listings_with_usernames = await crud.get_listings_with_usernames(listings)
    listing_infos = [
        ListingInfo(id=listing.id, username=username, slug=listing.slug)
        for listing, username in listings_with_usernames
    ]
    return ListListingsResponse(listings=listing_infos, has_next=has_next)


class NewListingResponse(BaseModel):
    listing_id: str
    username: str
    slug: str


@router.post("/add", response_model=NewListingResponse)
async def add_listing(
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    name: str = Form(...),
    description: str | None = Form(None),
    child_ids: str = Form(""),
    slug: str = Form(...),
    price_amount: str | None = Form(None),
    currency: str = Form("usd"),
    inventory_type: Literal["finite", "preorder"] = Form("finite"),
    inventory_quantity: str | None = Form(None),
    preorder_deposit_amount: str | None = Form(None),
    preorder_release_date: str | None = Form(None),
    photos: List[UploadFile] = File(None),
) -> NewListingResponse:
    try:
        logger.info("Starting to process add listing request")

        # Convert string values to appropriate types
        price_amount_int = int(price_amount) if price_amount else None
        inventory_quantity_int = int(inventory_quantity) if inventory_quantity else None
        preorder_release_date_int = int(float(preorder_release_date)) if preorder_release_date else None
        preorder_deposit_amount_int = int(preorder_deposit_amount) if preorder_deposit_amount else None

        # Initialize Stripe-related variables
        stripe_product_id = None
        stripe_price_id = None
        stripe_preorder_deposit_id = None

        # Create Stripe product if price is set
        if price_amount_int is not None and user.stripe_connect_account_id:
            stripe_product = await create_listing_product(
                name=name,
                description=description or "",
                price_amount=price_amount_int,
                currency=currency,
                inventory_type=inventory_type,
                inventory_quantity=inventory_quantity_int,
                preorder_release_date=preorder_release_date_int,
                preorder_deposit_amount=preorder_deposit_amount_int,
                user_id=user.id,
                stripe_connect_account_id=user.stripe_connect_account_id,
            )
            stripe_product_id = stripe_product.stripe_product_id
            stripe_price_id = stripe_product.stripe_price_id
            stripe_preorder_deposit_id = stripe_product.stripe_preorder_deposit_id

        # Create the listing
        listing = Listing.create(
            name=name,
            description=description or "",
            child_ids=child_ids.split(",") if child_ids else [],
            slug=slug,
            user_id=user.id,
            price_amount=price_amount_int,
            currency=currency,
            inventory_type=inventory_type,
            inventory_quantity=inventory_quantity_int,
            preorder_release_date=preorder_release_date_int,
            preorder_deposit_amount=preorder_deposit_amount_int,
            stripe_product_id=stripe_product_id,
            stripe_price_id=stripe_price_id,
            stripe_preorder_deposit_id=stripe_preorder_deposit_id,
        )

        await crud.add_listing(listing)
        logger.info("Listing created successfully")

        # Handle photo uploads
        if photos:
            for photo in photos:
                if photo.filename:
                    await crud.upload_artifact(
                        name=photo.filename,
                        file=photo,
                        listing=listing,
                        artifact_type="image",
                    )
                else:
                    logger.warning("Skipping photo upload due to missing filename")

        return NewListingResponse(listing_id=listing.id, username=user.username, slug=slug)

    except HTTPException as e:
        logger.error(f"HTTPException: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/delete/{listing_id}", response_model=bool)
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
    onshape_url: str | None = None
    slug: str | None = None
    stripe_product_id: str | None = None
    stripe_price_id: str | None = None
    stripe_deposit_price_id: str | None = None
    price_amount: int | None = None
    preorder_release_date: int | None = None
    preorder_deposit_amount: int | None = None
    stripe_preorder_deposit_id: str | None = None
    inventory_type: Literal["finite", "preorder"] | None = None
    inventory_quantity: int | None = None


@router.put("/edit/{id}", response_model=bool)
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
    if listing.slug is not None and len(listing.slug) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing slug must be at least 4 characters long.",
        )
    await crud.edit_listing(
        listing_id=id,
        name=listing.name,
        child_ids=listing.child_ids,
        description=listing.description,
        tags=listing.tags,
        onshape_url=listing.onshape_url,
        slug=listing.slug,
        stripe_product_id=listing.stripe_product_id,
        stripe_price_id=listing.stripe_price_id,
        price_amount=listing.price_amount,
        inventory_type=listing.inventory_type,
        inventory_quantity=listing.inventory_quantity,
        preorder_release_date=listing.preorder_release_date,
        preorder_deposit_amount=listing.preorder_deposit_amount,
        stripe_preorder_deposit_id=listing.stripe_preorder_deposit_id,
    )
    return True


class UpvotedListingsResponse(BaseModel):
    upvoted_listing_ids: list[str]
    has_more: bool


@router.get("/upvotes", response_model=ListListingsResponse)
async def get_upvoted_listings(
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    page: int = Query(1, description="Page number for pagination"),
) -> ListListingsResponse:
    listings, has_next = await crud.get_upvoted_listings(user.id, page)
    listings_with_usernames = await crud.get_listings_with_usernames(listings)
    listing_infos = [
        ListingInfo(id=listing.id, username=username, slug=listing.slug)
        for listing, username in listings_with_usernames
    ]
    return ListListingsResponse(listings=listing_infos, has_next=has_next)


class GetListingResponse(BaseModel):
    id: str
    name: str
    description: str | None
    creator_id: str | None
    creator_name: str | None
    username: str | None
    slug: str | None
    score: int
    views: int
    created_at: int
    artifacts: list[SingleArtifactResponse]
    can_edit: bool
    user_vote: bool | None
    onshape_url: str | None
    is_featured: bool
    currency: str | None = None
    price_amount: int | None = None
    stripe_product_id: str | None = None
    stripe_price_id: str | None = None
    preorder_deposit_amount: int | None = None
    stripe_preorder_deposit_id: str | None = None
    preorder_release_date: int | None = None
    inventory_type: str | None = None
    inventory_quantity: int | None = None


async def get_listing_common(
    listing: Listing,
    user: User | None,
    crud: Crud,
) -> GetListingResponse:
    listing_tags, _ = await asyncio.gather(
        crud.get_tags_for_listing(listing.id),
        crud.increment_view_count(listing),
    )

    user_vote = None
    if user and (vote := await crud.get_user_vote(user.id, listing.id)) is not None:
        user_vote = vote.is_upvote

    creator = await crud.get_user(listing.user_id, throw_if_missing=True)
    raw_artifacts = await crud.get_listing_artifacts(listing.id)

    artifacts = await asyncio.gather(
        *(
            SingleArtifactResponse.from_artifact(
                artifact=artifact,
                crud=crud,
                listing=listing,
                creator=creator,
                user=user,
            )
            for artifact in sorted(raw_artifacts, key=lambda x: (not x.is_main, -x.timestamp))
        )
    )

    featured_listings = await crud.get_featured_listings()
    is_featured = listing.id in featured_listings

    response = GetListingResponse(
        id=listing.id,
        name=listing.name,
        description=listing.description,
        creator_id=creator.id if creator else None,
        creator_name=creator.name,
        username=creator.username if creator else None,
        slug=listing.slug,
        views=listing.views,
        created_at=listing.created_at,
        artifacts=list(artifacts),
        can_edit=user is not None and await can_write_listing(user, listing),
        user_vote=user_vote,
        onshape_url=listing.onshape_url,
        price_amount=listing.price_amount,
        currency=listing.currency,
        stripe_product_id=listing.stripe_product_id,
        stripe_price_id=listing.stripe_price_id,
        preorder_release_date=listing.preorder_release_date,
        preorder_deposit_amount=listing.preorder_deposit_amount,
        stripe_preorder_deposit_id=listing.stripe_preorder_deposit_id,
        inventory_type=listing.inventory_type,
        inventory_quantity=listing.inventory_quantity,
        is_featured=is_featured,
        score=listing.score,
    )

    return response


@router.get("/{listing_id}", response_model=GetListingResponse)
async def get_listing(
    listing_id: str,
    user: Annotated[User | None, Depends(maybe_get_user_from_api_key)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> GetListingResponse:
    listing = await crud.get_listing(listing_id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    response = await get_listing_common(listing, user, crud)

    # Verify URLs are signed in production
    if settings.environment != "local":
        for artifact in response.artifacts:
            if not any("Key-Pair-Id=" in url for url in [artifact.urls.small, artifact.urls.large] if url is not None):
                logger.error(f"Unsigned URLs found for artifact {artifact.artifact_id} in listing {listing_id}")

    return response


@router.get("/{username}/{slug}", response_model=GetListingResponse)
async def get_listing_by_username_and_slug(
    username: str,
    slug: str,
    user: Annotated[User | None, Depends(maybe_get_user_from_api_key)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> GetListingResponse:
    listing = await crud.get_listing_by_username_and_slug(username, slug)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    return await get_listing_common(listing, user, crud)


class VoteListingResponse(BaseModel):
    score: int
    user_vote: bool


@router.post("/{id}/vote")
async def vote_listing(
    id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    upvote: bool = Query(..., description="True for upvote, False for downvote"),
) -> None:
    await crud.handle_vote(user.id, id, upvote)


@router.delete("/{id}/vote")
async def remove_vote(
    id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
) -> None:
    await crud.handle_vote(user.id, id, None)
