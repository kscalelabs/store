"""Defines all listing related API endpoints."""

import asyncio
import logging
from typing import Annotated, List, Literal

import stripe
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
from store.app.security.user import (
    get_session_user_with_read_permission,
    get_session_user_with_write_permission,
    maybe_get_user_from_api_key,
)

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
    users = await crud.get_user_batch(list(set(listing.user_id for listing in listings)))
    user_id_to_username = {user.id: user.username for user in users}
    listing_infos = [
        ListingInfo(id=listing.id, username=user_id_to_username.get(listing.user_id, "Unknown"), slug=listing.slug)
        for listing in listings
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
    inventory_type: Literal["finite", "infinite", "preorder"] | None
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
    (listings, has_next), user = await asyncio.gather(
        crud.get_user_listings(user_id, page),
        crud.get_user(user_id),
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find user associated with the given id",
        )
    listing_infos = [ListingInfo(id=listing.id, username=user.username, slug=listing.slug) for listing in listings]
    return ListListingsResponse(listings=listing_infos, has_next=has_next)


@router.get("/me", response_model=ListListingsResponse)
async def get_my_listings(
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
    page: int = Query(1, description="Page number for pagination"),
) -> ListListingsResponse:
    listings, has_next = await crud.get_user_listings(user.id, page)
    listing_infos = [ListingInfo(id=listing.id, username=user.username, slug=listing.slug) for listing in listings]
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
    price_amount: int | None = Form(None),
    currency: str = Form("usd"),
    inventory_type: Literal["finite", "infinite", "preorder"] = Form("infinite"),
    inventory_quantity: int | None = Form(None),
    preorder_release_date: int | None = Form(None),
    is_reservation: bool = Form(False),
    reservation_deposit_amount: int | None = Form(None),
    photos: List[UploadFile] = File(None),
) -> NewListingResponse:
    logger.info(f"Received {len(photos) if photos else 0} photos")

    # Initialize Stripe-related variables
    stripe_product_id = None
    stripe_price_id = None
    deposit_price_id = None

    # Validate the input
    if price_amount is not None and price_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Price amount must be greater than 0",
        )

    if inventory_type == "finite" and (inventory_quantity is None or inventory_quantity <= 0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Finite inventory requires a positive quantity",
        )

    if inventory_type == "preorder" and not preorder_release_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Preorder requires a release date",
        )

    if is_reservation and (not reservation_deposit_amount or reservation_deposit_amount <= 0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reservations require a deposit amount",
        )

    if is_reservation and (
        not price_amount or not reservation_deposit_amount or price_amount <= reservation_deposit_amount
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full price must be greater than deposit amount",
        )

    # Create Stripe product if price is set
    if price_amount is not None and user.stripe_connect_account_id:
        try:
            product = stripe.Product.create(
                name=name,
                description=description or "",
                metadata={
                    "user_id": user.id,
                },
                stripe_account=user.stripe_connect_account_id,
            )

            price = stripe.Price.create(
                product=product.id,
                currency=currency,
                unit_amount=price_amount,
                metadata={
                    "inventory_quantity": str(inventory_quantity) if inventory_type == "finite" else "",
                    "preorder_release_date": str(preorder_release_date) if inventory_type == "preorder" else "",
                },
                stripe_account=user.stripe_connect_account_id,
            )

            if is_reservation and reservation_deposit_amount:
                deposit_price = stripe.Price.create(
                    product=product.id,
                    currency=currency,
                    unit_amount=reservation_deposit_amount,
                    metadata={"is_deposit": "true"},
                    stripe_account=user.stripe_connect_account_id,
                )
                deposit_price_id = deposit_price.id

            stripe_product_id = product.id
            stripe_price_id = price.id

        except stripe.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error creating Stripe product: {str(e)}",
            )

    # Create the listing
    listing = Listing.create(
        name=name,
        description=description or "",
        child_ids=child_ids.split(",") if child_ids else [],
        slug=slug,
        user_id=user.id,
        price_amount=price_amount,
        currency=currency,
        inventory_type=inventory_type,
        inventory_quantity=inventory_quantity,
        preorder_release_date=preorder_release_date,
        is_reservation=is_reservation,
        reservation_deposit_amount=reservation_deposit_amount,
        stripe_product_id=stripe_product_id,
        stripe_price_id=stripe_price_id,
        stripe_deposit_price_id=deposit_price_id,
    )

    await crud.add_listing(listing)

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
    inventory_type: Literal["finite", "infinite", "preorder"] | None = None
    inventory_quantity: int | None = None
    preorder_release_date: int | None = None
    is_reservation: bool | None = None
    reservation_deposit_amount: int | None = None


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
        stripe_deposit_price_id=listing.stripe_deposit_price_id,
        price_amount=listing.price_amount,
        inventory_type=listing.inventory_type,
        inventory_quantity=listing.inventory_quantity,
        preorder_release_date=listing.preorder_release_date,
        is_reservation=listing.is_reservation,
        reservation_deposit_amount=listing.reservation_deposit_amount,
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
    listing_infos = [ListingInfo(id=listing.id, username=user.username, slug=listing.slug) for listing in listings]
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
    stripe_product_id: str | None = None
    stripe_price_id: str | None = None
    price_amount: int | None = None
    currency: str | None = None
    inventory_type: str | None = None
    inventory_quantity: int | None = None
    preorder_release_date: int | None = None
    is_reservation: bool | None = None
    reservation_deposit_amount: int | None = None


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
        stripe_product_id=listing.stripe_product_id,
        stripe_price_id=listing.stripe_price_id,
        price_amount=listing.price_amount,
        currency=listing.currency,
        inventory_type=listing.inventory_type,
        inventory_quantity=listing.inventory_quantity,
        preorder_release_date=listing.preorder_release_date,
        is_reservation=listing.is_reservation,
        reservation_deposit_amount=listing.reservation_deposit_amount,
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
    return await get_listing_common(listing, user, crud)


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


@router.post("/{listing_id}/convert")
async def convert_listing_type(
    listing_id: str,
    new_type: Literal["standard", "preorder", "reservation"],
    crud: Annotated[Crud, Depends(Crud.get)],
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
) -> dict:
    """Convert a listing from one type to another."""
    listing = await crud.get_listing(listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if not listing.stripe_product_id:
        raise HTTPException(status_code=400, detail="Listing has no associated Stripe product")

    try:
        # Archive old price
        if listing.stripe_price_id:
            stripe.Price.modify(
                listing.stripe_price_id,
                active=False,
                stripe_account=user.stripe_connect_account_id,
            )

        # Create new price
        if not listing.price_amount:
            raise HTTPException(status_code=400, detail="Listing has no price amount")

        if new_type == "standard":
            # Convert to standard product
            price = stripe.Price.create(
                product=listing.stripe_product_id,
                currency=listing.currency or "usd",
                unit_amount=listing.price_amount,
                stripe_account=user.stripe_connect_account_id,
            )

        # Update listing
        await crud.edit_listing(
            listing_id=listing.id,
            stripe_product_id=listing.stripe_product_id,
            stripe_price_id=price.id,
            inventory_type="infinite",
            preorder_release_date=None,
            is_reservation=False,
            reservation_deposit_amount=None,
        )

        return {"success": True, "new_type": new_type}

    except stripe.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
