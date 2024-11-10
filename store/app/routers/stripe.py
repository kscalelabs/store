"""Stripe integration router for handling payments and webhooks."""

import asyncio
import logging
from enum import Enum
from typing import Annotated, Any, Dict, Literal

import stripe
from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from pydantic import BaseModel

from store.app.db import Crud
from store.app.model import Order, User
from store.app.security.user import (
    get_session_user_with_read_permission,
    get_session_user_with_write_permission,
)
from store.settings import settings

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Add a console handler if one doesn't exist
if not logger.handlers:
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)


router = APIRouter()
stripe.api_key = settings.stripe.secret_key


class ConnectAccountStatus(str, Enum):
    NOT_CREATED = "not_created"
    INCOMPLETE = "incomplete"
    COMPLETE = "complete"


@router.post("/create-payment-intent")
async def create_payment_intent(request: Request) -> Dict[str, Any]:
    try:
        data = await request.json()
        amount = data.get("amount")

        # Create a PaymentIntent with the order amount and currency
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency="usd",
            automatic_payment_methods={
                "enabled": True,
            },
        )

        return {"clientSecret": intent.client_secret}
    except Exception as e:
        return {"error": str(e)}


class CancelReason(BaseModel):
    reason: str
    details: str


class CreateRefundsRequest(BaseModel):
    payment_intent_id: str
    cancel_reason: CancelReason
    amount: int


@router.put("/refunds/{order_id}", response_model=Order)
async def refund_payment_intent(
    order_id: str,
    refund_request: CreateRefundsRequest,
    user: User = Depends(get_session_user_with_read_permission),
    crud: Crud = Depends(),
) -> Order:
    async with crud:
        try:
            amount = refund_request.amount
            payment_intent_id = refund_request.payment_intent_id
            customer_reason = (
                refund_request.cancel_reason.details
                if (refund_request.cancel_reason.reason == "Other" and refund_request.cancel_reason.details)
                else refund_request.cancel_reason.reason
            )

            # Create a Refund for payment_intent_id with the order amount
            refund = stripe.Refund.create(
                payment_intent=payment_intent_id,
                amount=amount,
                reason="requested_by_customer",
                metadata={"customer_reason": customer_reason},
            )
            logger.info("Refund created: %s", refund.id)

            # Make sure order exists
            order = await crud.get_order(order_id)
            if order is None or order.user_id != user.id:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
            logger.info("Found order id: %s", order.id)

            # Update order status
            order_data = {
                "stripe_refund_id": refund.id,
                "status": (
                    "refunded" if (refund.status and refund.status) == "succeeded" else (refund.status or "no status!")
                ),
            }

            updated_order = await crud.update_order(order_id, order_data)

            logger.info("Updated order with status: %s", refund.status)
            return updated_order
        except Exception as e:
            logger.error("Error processing refund: %s", str(e))
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request, crud: Crud = Depends(Crud.get)) -> Dict[str, str]:
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe.webhook_secret)
        logger.info("Webhook event type: %s", event["type"])

        # Handle the event
        if event["type"] == "account.updated":
            account = event["data"]["object"]
            capabilities = account.get("capabilities", {})
            is_fully_onboarded = bool(
                account.get("details_submitted")
                and account.get("payouts_enabled")
                and capabilities.get("card_payments") == "active"
                and capabilities.get("transfers") == "active"
            )

            if is_fully_onboarded:
                try:
                    users = await crud.get_users_by_stripe_connect_id(account["id"])
                    if users:
                        user = users[0]  # Assume one user per Connect account
                        await crud.update_stripe_connect_status(user.id, account["id"], is_completed=True)
                    else:
                        logger.warning("No user found for Connect account: %s", account["id"])
                except Exception as e:
                    logger.error("Error updating user Connect status: %s", str(e))

        elif event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            await handle_checkout_session_completed(session, crud)
        elif event["type"] == "payment_intent.succeeded":
            payment_intent = event["data"]["object"]
            logger.info("Payment intent succeeded: %s", payment_intent["id"])

        return {"status": "success"}
    except ValueError as e:
        logger.error("Invalid payload: %s", str(e))
        raise HTTPException(status_code=400, detail="Invalid payload")


async def handle_checkout_session_completed(session: Dict[str, Any], crud: Crud) -> None:
    try:
        shipping_details = session.get("shipping_details", {})
        shipping_address = shipping_details.get("address", {})

        # Get the line items to extract the quantity
        line_items = stripe.checkout.Session.list_line_items(session["id"])
        quantity = line_items.data[0].quantity if line_items.data else 1

        # Create the order
        order_data = {
            "user_id": session.get("client_reference_id"),
            "user_email": session["customer_details"]["email"],
            "stripe_checkout_session_id": session["id"],
            "stripe_payment_intent_id": session.get("payment_intent"),
            "amount": session["amount_total"],
            "currency": session["currency"],
            "status": "processing",
            "stripe_product_id": session["metadata"].get("stripe_product_id"),
            "quantity": quantity,
            "shipping_name": shipping_details.get("name"),
            "shipping_address_line1": shipping_address.get("line1"),
            "shipping_address_line2": shipping_address.get("line2"),
            "shipping_city": shipping_address.get("city"),
            "shipping_state": shipping_address.get("state"),
            "shipping_postal_code": shipping_address.get("postal_code"),
            "shipping_country": shipping_address.get("country"),
        }

        # Create order and update inventory in parallel
        product_id = session["metadata"].get("product_id")
        if product_id:
            listing = await crud.get_listing_by_stripe_product_id(product_id)
            if listing and listing.inventory_type == "finite":
                if listing.inventory_quantity is not None and quantity is not None:
                    new_quantity = max(0, listing.inventory_quantity - quantity)
                    await asyncio.gather(
                        crud.create_order(order_data),
                        crud.edit_listing(listing_id=listing.id, inventory_quantity=new_quantity),
                    )
                    logger.info("Updated listing inventory from %d to %d", listing.inventory_quantity, new_quantity)
                    return

        # If no inventory update needed, just create the order
        new_order = await crud.create_order(order_data)
        logger.info("New order created: %s", new_order.id)

    except Exception as e:
        logger.error("Error processing checkout session: %s", str(e))
        raise


async def fulfill_order(
    session: Dict[str, Any],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> None:
    user_id = session.get("client_reference_id")
    if not user_id:
        logger.warning("No user_id found for session: %s", session["id"])
        return

    user = await crud.get_user(user_id)
    if not user:
        logger.warning("User not found for id: %s", user_id)
        return

    order_data = {
        "user_id": user_id,
        "stripe_checkout_session_id": session["id"],
        "stripe_payment_intent_id": session["payment_intent"],
        "amount": session["amount_total"],
        "currency": session["currency"],
        "status": "processing",
        "stripe_product_id": session["metadata"].get("stripe_product_id"),
        "user_email": session["metadata"].get("user_email"),
    }

    try:
        await crud.create_order(order_data)
        logger.info("Order fulfilled for session: %s and user: %s", session["id"], user_id)
    except Exception as e:
        logger.error("Error creating order: %s", str(e))
        # You might want to add some error handling here, such as retrying or notifying an admin


async def notify_payment_failed(session: Dict[str, Any]) -> None:
    logger.warning("Payment failed for session: %s", session["id"])


class CreateCheckoutSessionRequest(BaseModel):
    listing_id: str
    stripe_product_id: str
    cancel_url: str


class CreateCheckoutSessionResponse(BaseModel):
    session_id: str


@router.post("/create-checkout-session", response_model=CreateCheckoutSessionResponse)
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    user: User = Depends(get_session_user_with_read_permission),
    crud: Crud = Depends(),
) -> CreateCheckoutSessionResponse:
    async with crud:
        try:
            # Get the listing
            listing = await crud.get_listing(request.listing_id)
            if not listing or not listing.price_amount:
                raise HTTPException(status_code=404, detail="Listing not found or has no price")

            if not listing.stripe_price_id:
                raise HTTPException(status_code=400, detail="Listing has no associated Stripe price")

            # Get seller details
            seller = await crud.get_user(listing.user_id)
            if not seller or not seller.stripe_connect_account_id:
                raise HTTPException(status_code=400, detail="Seller not found or not connected to Stripe")

            # Check if user is trying to buy their own listing
            if seller.id == user.id:
                raise HTTPException(status_code=400, detail="You cannot purchase your own listing")

            # Calculate maximum quantity and application fee
            max_quantity = 10
            if listing.inventory_type == "finite" and listing.inventory_quantity is not None:
                max_quantity = listing.inventory_quantity

            application_fee = int(listing.price_amount * 0.02)  # 2% fee for our platform

            # Create a clone of the price on the platform account
            platform_price = stripe.Price.create(
                unit_amount=listing.price_amount,
                currency="usd",
                product_data={
                    "name": listing.name,
                    "metadata": {
                        "original_price_id": listing.stripe_price_id,
                        "seller_connect_account_id": seller.stripe_connect_account_id,
                    },
                },
            )

            # Ensure stripe_product_id is not None before adding to metadata
            metadata = {
                "user_email": user.email,
            }
            if listing.stripe_product_id:
                metadata["stripe_product_id"] = listing.stripe_product_id

            checkout_session = stripe.checkout.Session.create(
                line_items=[
                    {
                        "price": platform_price.id,
                        "quantity": 1,
                        "adjustable_quantity": {
                            "enabled": True,
                            "minimum": 1,
                            "maximum": max_quantity,
                        },
                    }
                ],
                mode="payment",
                payment_method_types=["card", "affirm"],
                success_url=f"{settings.site.homepage}/order/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.site.homepage}{request.cancel_url}",
                client_reference_id=user.id,
                metadata=metadata,
                shipping_address_collection={"allowed_countries": ["US", "CA"]},
                payment_intent_data={
                    "application_fee_amount": application_fee,
                    "transfer_data": {
                        "destination": seller.stripe_connect_account_id,
                    },
                },
            )
            return CreateCheckoutSessionResponse(session_id=checkout_session.id)

        except stripe.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}", exc_info=True)
            raise HTTPException(status_code=400, detail=str(e))


@router.get("/get-product/{product_id}")
async def get_product(product_id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> Dict[str, Any]:
    try:
        # First get the listing by stripe_product_id
        listing = await crud.get_listing_by_stripe_product_id(product_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")

        # Get the seller
        seller = await crud.get_user(listing.user_id)
        if not seller or not seller.stripe_connect_account_id:
            raise HTTPException(status_code=400, detail="Seller not found or not connected to Stripe")

        # Retrieve the product using the seller's connected account
        product = stripe.Product.retrieve(product_id, stripe_account=seller.stripe_connect_account_id)

        return {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "images": product.images,
            "metadata": product.metadata,
        }
    except stripe.StripeError as e:
        logger.error(f"Stripe error retrieving product: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error retrieving product: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


class CreateConnectAccountResponse(BaseModel):
    account_id: str


@router.post("/connect/account", response_model=CreateConnectAccountResponse)
async def create_connect_account(
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> CreateConnectAccountResponse:
    try:
        logger.info("Starting new account creation for user %s", user.id)

        # Create a Standard Connect account
        account = stripe.Account.create(
            type="standard",
            country="US",
            email=user.email,
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            },
            business_type="individual",
        )

        logger.info("Created new Connect account: %s for user: %s", account.id, user.id)

        # Update user record with new Connect account ID
        logger.info("Updating user record with new Connect account ID")
        await crud.update_user(
            user.id,
            {
                "stripe_connect_account_id": account.id,
                "stripe_connect_onboarding_completed": False,
            },
        )

        return CreateConnectAccountResponse(account_id=account.id)
    except Exception as e:
        logger.error("Error creating Connect account: %s", str(e), exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/connect/account/session")
async def create_connect_account_session(
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
    account_id: str = Body(..., embed=True),
) -> Dict[str, str]:
    try:
        logger.info("Creating account session for account: %s", account_id)

        if not account_id:
            logger.error("No account ID provided in request body")
            raise HTTPException(status_code=400, detail="No account ID provided")

        if user.stripe_connect_account_id != account_id:
            logger.error("Account ID mismatch. User: %s, Requested: %s", user.stripe_connect_account_id, account_id)
            raise HTTPException(status_code=400, detail="Account ID does not match user's connected account")

        account_session = stripe.AccountSession.create(
            account=account_id,
            components={
                "account_onboarding": {"enabled": True},
            },
        )

        logger.info("Successfully created account session for account: %s", account_id)
        return {"client_secret": account_session.client_secret}
    except Exception as e:
        logger.error("Error creating account session: %s", str(e), exc_info=True)
        raise


@router.post("/connect/delete/accounts")
async def delete_test_accounts(
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> Dict[str, Any]:
    if not user.permissions or "is_admin" not in user.permissions:
        raise HTTPException(status_code=403, detail="Admin permission required to delete accounts")

    try:
        deleted_accounts = []
        accounts = stripe.Account.list(limit=100)

        for account in accounts:
            try:
                stripe.Account.delete(account.id)
                deleted_accounts.append(account.id)
                # Update any users that had this account
                await crud.update_user_stripe_connect_reset(account.id)
            except Exception as e:
                logger.error("Failed to delete account %s: %s", account.id, str(e))

        return {"success": True, "deleted_accounts": deleted_accounts, "count": len(deleted_accounts)}
    except Exception as e:
        logger.error("Error deleting test accounts: %s", str(e))
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create-product", response_model=dict)
async def create_stripe_product(
    listing_id: str = Body(...),
    price_amount: int = Body(...),  # in cents
    inventory_type: Literal["finite", "infinite", "preorder"] = Body(...),
    inventory_quantity: int | None = Body(None),
    preorder_release_date: int | None = Body(None),
    is_reservation: bool = Body(False),
    reservation_deposit_amount: int | None = Body(None),
    user: User = Depends(get_session_user_with_write_permission),
    crud: Crud = Depends(),
) -> dict:
    try:
        listing = await crud.get_listing(listing_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")

        # Create product
        product = stripe.Product.create(
            name=listing.name,
            description=listing.description or "",
            metadata={
                "listing_id": listing_id,
                "seller_id": user.id,
            },
            stripe_account=user.stripe_connect_account_id,
        )

        # Create price metadata
        metadata: dict[str, str] = {"listing_id": listing_id}
        if inventory_type == "finite":
            metadata["inventory_quantity"] = str(inventory_quantity)
        elif inventory_type == "preorder" and preorder_release_date:
            metadata["preorder_release_date"] = str(preorder_release_date)

        # Create deposit price for reservations
        deposit_price = None
        if is_reservation and reservation_deposit_amount:
            deposit_price = stripe.Price.create(
                product=product.id,
                currency="usd",
                unit_amount=reservation_deposit_amount,
                metadata={"is_deposit": "true", **metadata},
                stripe_account=user.stripe_connect_account_id,
            )

        # Create main price
        price = stripe.Price.create(
            product=product.id,
            currency="usd",
            unit_amount=price_amount,
            metadata=metadata,
            stripe_account=user.stripe_connect_account_id,
        )

        await crud.edit_listing(
            listing_id=listing.id,
            stripe_product_id=product.id,
            stripe_price_id=price.id,
            price_amount=price_amount,
            inventory_type=inventory_type,
            inventory_quantity=inventory_quantity,
            preorder_release_date=preorder_release_date,
            is_reservation=is_reservation,
            reservation_deposit_amount=reservation_deposit_amount,
        )

        return {
            "product_id": product.id,
            "price_id": price.id,
            "deposit_price_id": deposit_price.id if deposit_price else None,
        }

    except stripe.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
