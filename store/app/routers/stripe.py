"""Stripe integration router for handling payments and webhooks."""

import logging
import time
from datetime import datetime
from enum import Enum
from typing import Annotated, Any, Dict, Literal

import stripe
from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from pydantic import BaseModel

from store.app.crud.orders import OrderDataCreate, OrderDataUpdate
from store.app.db import Crud
from store.app.model import Listing, Order, User, UserStripeConnect
from store.app.security.user import (
    get_session_user_with_admin_permission,
    get_session_user_with_read_permission,
    get_session_user_with_write_permission,
)
from store.settings import settings

STRIPE_CONNECT_CHECKOUT_SUCCESS_URL = f"{settings.site.homepage}/order/success?session_id={{CHECKOUT_SESSION_ID}}"

STRIPE_CONNECT_FINAL_PAYMENT_SUCCESS_URL = (
    f"{settings.site.homepage}/order/final-payment/success?session_id={{CHECKOUT_SESSION_ID}}"
)

STRIPE_CONNECT_FINAL_PAYMENT_CANCEL_URL = (
    f"{settings.site.homepage}/order/final-payment/cancel?session_id={{CHECKOUT_SESSION_ID}}"
)

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
            order_data: OrderDataUpdate = {
                "stripe_refund_id": refund.id,
                "status": ("refunded" if (refund.status and refund.status) == "succeeded" else order.status),
            }

            updated_order = await crud.update_order(order_id, order_data)

            logger.info("Updated order with status: %s", refund.status)
            return updated_order
        except Exception as e:
            logger.error("Error processing refund: %s", str(e))
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request, crud: Crud = Depends(Crud.get)) -> Dict[str, str]:
    """Handle direct account webhooks (non-Connect events)."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe.webhook_secret)
        logger.info("Direct webhook event type: %s", event["type"])

        # Handle direct account events
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            await handle_checkout_session_completed(session, crud)
        elif event["type"] == "payment_intent.succeeded":
            payment_intent = event["data"]["object"]
            logger.info("Payment intent succeeded: %s", payment_intent["id"])

        return {"status": "success"}
    except Exception as e:
        logger.error("Error processing direct webhook: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/connect/webhook")
async def stripe_connect_webhook(request: Request, crud: Crud = Depends(Crud.get)) -> Dict[str, str]:
    """Handle Connect account webhooks."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe.connect_webhook_secret)
        logger.info("Connect webhook event type: %s", event["type"])

        # Get the connected account ID
        connected_account_id = event.get("account")
        if not connected_account_id:
            logger.warning("No connected account ID in webhook event")
            return {"status": "skipped"}

        # Handle Connect-specific events
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
                    # Get user_id from account metadata
                    user_id = account.get("metadata", {}).get("user_id")
                    if user_id:
                        await crud.update_stripe_connect_status(user_id, account["id"], is_completed=True)
                        logger.info(f"Updated Connect status for user {user_id}")
                    else:
                        logger.warning(f"No user_id in metadata for Connect account: {account['id']}")
                except Exception as e:
                    logger.error(f"Error updating user Connect status: {str(e)}")

        elif event["type"] == "checkout.session.completed":
            session = event["data"]["object"]

            # Check if this is a final payment for a preorder
            if session["metadata"].get("is_final_payment") == "true":
                order_id = session["metadata"].get("order_id")
                if order_id:
                    try:
                        order = await crud.get_order(order_id)
                        if order:
                            # Update order status and payment details
                            await crud.update_order(
                                order_id,
                                {
                                    "status": "processing",
                                    "final_payment_intent_id": session.get("payment_intent"),
                                    "final_payment_date": int(time.time()),
                                    "updated_at": int(time.time()),
                                },
                            )
                            logger.info(f"Final payment processed for order {order_id}")
                    except Exception as e:
                        logger.error(f"Error processing final payment webhook: {str(e)}")
                        raise
            else:
                # Handle regular checkout completion
                await handle_checkout_session_completed(session, crud)

        return {"status": "success"}
    except Exception as e:
        logger.error("Error processing Connect webhook: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


async def handle_checkout_session_completed(session: Dict[str, Any], crud: Crud) -> None:
    logger.info("Processing checkout session: %s", session["id"])
    try:
        # Retrieve full session details from the connected account
        seller_connect_account_id = session.get("metadata", {}).get("seller_connect_account_id")
        if seller_connect_account_id:
            session = stripe.checkout.Session.retrieve(session["id"], stripe_account=seller_connect_account_id)

        shipping_details = session.get("shipping_details", {})
        shipping_address = shipping_details.get("address", {})

        # Get the line items to extract the quantity
        line_items = stripe.checkout.Session.list_line_items(session["id"], stripe_account=seller_connect_account_id)
        quantity = line_items.data[0].quantity if line_items.data else 1
        if quantity is None:
            quantity = 1

        # Determine if this is a preorder and get the correct price amount
        is_preorder = session["metadata"].get("is_preorder") == "true"
        price_amount = (
            int(session["metadata"].get("full_price_amount"))  # Use full price for preorders
            if is_preorder
            else session["amount_total"]  # Use session amount for regular orders
        )

        # Create the order
        order_data: OrderDataCreate = {
            "user_id": session["metadata"].get("user_id"),
            "user_email": session["customer_details"]["email"],
            "listing_id": session["metadata"].get("listing_id"),
            "stripe_checkout_session_id": session["id"],
            "stripe_product_id": session["metadata"].get("stripe_product_id"),
            "stripe_connect_account_id": session["metadata"].get("seller_connect_account_id"),
            "stripe_payment_intent_id": session.get("payment_intent"),
            "price_amount": price_amount,
            "currency": session["currency"],
            "status": "preorder_placed" if is_preorder else "processing",
            "quantity": quantity,
            "preorder_deposit_amount": (
                int(session["amount_total"]) if is_preorder and session.get("amount_total") else None
            ),
            "preorder_release_date": (
                int(session["metadata"]["preorder_release_date"])
                if is_preorder and session["metadata"].get("preorder_release_date")
                else None
            ),
            "stripe_price_id": session["metadata"].get("stripe_price_id"),
            "shipping_name": shipping_details.get("name"),
            "shipping_address_line1": shipping_address.get("line1"),
            "shipping_address_line2": shipping_address.get("line2"),
            "shipping_city": shipping_address.get("city"),
            "shipping_state": shipping_address.get("state"),
            "shipping_postal_code": shipping_address.get("postal_code"),
            "shipping_country": shipping_address.get("country"),
        }

        listing = await crud.get_listing(session["metadata"].get("listing_id"))
        if listing:
            if listing.inventory_type == "finite" and listing.inventory_quantity is not None and quantity is not None:
                new_quantity = max(0, listing.inventory_quantity - quantity)
                await crud.edit_listing(listing_id=listing.id, inventory_quantity=new_quantity)

        await crud.create_order(order_data)

    except Exception as e:
        logger.error("Error processing checkout session: %s", str(e))
        raise


async def notify_payment_failed(session: Dict[str, Any]) -> None:
    logger.warning("Payment failed for session: %s", session["id"])


def support_affirm_payment(listing: Listing) -> bool:
    if listing.price_amount is None:
        return False
    return listing.price_amount >= 5000 and listing.inventory_type != "preorder"


class CreateCheckoutSessionRequest(BaseModel):
    listing_id: str
    stripe_product_id: str
    cancel_url: str


class CreateCheckoutSessionResponse(BaseModel):
    session_id: str
    stripe_connect_account_id: str


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
                logger.error(f"Listing not found or has no price: {request.listing_id}")
                raise HTTPException(status_code=404, detail="Listing not found or has no price")

            # Get seller details
            seller = await crud.get_user(listing.user_id)
            if not seller or not seller.stripe_connect or not seller.stripe_connect.onboarding_completed:
                raise HTTPException(status_code=400, detail="Seller not found or not connected to Stripe")

            # Check if user is trying to buy their own listing
            if seller.id == user.id:
                raise HTTPException(status_code=400, detail="You cannot purchase your own listing")

            # Calculate maximum quantity
            max_quantity = 10
            if listing.inventory_type == "finite" and listing.inventory_quantity is not None:
                max_quantity = min(listing.inventory_quantity, 10)

            metadata: dict[str, str] = {
                "user_id": user.id,
                "user_email": user.email,
                "listing_id": listing.id,
                "product_id": listing.stripe_product_id or "",
                "listing_type": listing.inventory_type,
                "seller_connect_account_id": seller.stripe_connect.account_id,
            }

            if listing.stripe_product_id:
                metadata["stripe_product_id"] = listing.stripe_product_id

            # Base checkout session parameters
            checkout_params: stripe.checkout.Session.CreateParams = {
                "mode": "payment",
                "payment_method_types": ["card", "affirm"] if support_affirm_payment(listing) else ["card"],
                "success_url": STRIPE_CONNECT_CHECKOUT_SUCCESS_URL,
                "cancel_url": f"{settings.site.homepage}{request.cancel_url}",
                "client_reference_id": user.id,
                "shipping_address_collection": {"allowed_countries": ["US"]},
                "metadata": metadata,
                "stripe_account": seller.stripe_connect.account_id,
            }

            # For preorders, use payment mode with deposit amount
            if listing.inventory_type == "preorder" and listing.preorder_deposit_amount:
                if listing.stripe_preorder_deposit_id is None:
                    raise HTTPException(status_code=400, detail="Preorder deposit price not configured")
                if listing.stripe_price_id is None:
                    raise HTTPException(status_code=400, detail="Preorder full price not configured")
                if listing.price_amount is None:
                    raise HTTPException(status_code=400, detail="Preorder full price amount not configured")

                checkout_params.update(
                    {
                        "line_items": [
                            {
                                "price": listing.stripe_preorder_deposit_id,
                                "quantity": 1,
                            }
                        ],
                        "payment_intent_data": {
                            "setup_future_usage": "off_session",  # Save card for future charge
                            "metadata": {
                                "is_preorder": "true",
                                "stripe_price_id": listing.stripe_price_id,
                                "remaining_amount": str(listing.price_amount - listing.preorder_deposit_amount),
                                "listing_id": listing.id,
                            },
                        },
                        "metadata": {
                            **metadata,
                            "is_preorder": "true",
                            "stripe_price_id": listing.stripe_price_id,
                            "full_price_amount": str(listing.price_amount),
                        },
                    }
                )

                #  Custom text for preorder explanation
                if listing.preorder_release_date:
                    formatted_date = datetime.fromtimestamp(listing.preorder_release_date).strftime("%B %d, %Y")
                    remaining_amount = (listing.price_amount - listing.preorder_deposit_amount) / 100
                    checkout_params["custom_text"] = {
                        "submit": {
                            "message": (
                                f"By paying you understand that you are placing a pre-order with a "
                                f"refundable deposit of ${listing.preorder_deposit_amount/100:,.2f}. "
                                f"You will be contacted to pay the remaining ${remaining_amount:,.2f} when your "
                                f"robot is ready to ship (estimated {formatted_date}). By continuing, you agree "
                                "to save your payment method for the future charge."
                            )
                        }
                    }

            else:
                # Regular payment mode
                if not listing.stripe_price_id and listing.stripe_product_id:
                    # Create a new price if one doesn't exist
                    price = stripe.Price.create(
                        unit_amount=listing.price_amount,
                        currency=listing.currency or "usd",
                        product=listing.stripe_product_id,
                        metadata={"listing_id": listing.id},
                        stripe_account=seller.stripe_connect.account_id,
                    )
                    # Update the listing with the new price ID
                    await crud.edit_listing(listing_id=listing.id, stripe_price_id=price.id)
                    listing.stripe_price_id = price.id

                if listing.stripe_price_id is None:
                    raise HTTPException(status_code=400, detail="Price not configured")

                # Calculate application fee
                application_fee = int(listing.price_amount * 0.02)  # 2% fee

                checkout_params.update(
                    {
                        "line_items": [
                            {
                                "price": listing.stripe_price_id,
                                "quantity": 1,
                                **(
                                    {"adjustable_quantity": {"enabled": True, "minimum": 1, "maximum": max_quantity}}
                                    if max_quantity > 1
                                    else {}
                                ),
                            }
                        ],
                        "payment_intent_data": {
                            "application_fee_amount": application_fee,
                        },
                        "stripe_account": seller.stripe_connect.account_id,
                    }
                )

            # Create the checkout session on the connected account
            checkout_session = stripe.checkout.Session.create(**checkout_params)

            return CreateCheckoutSessionResponse(
                session_id=checkout_session.id,
                stripe_connect_account_id=seller.stripe_connect.account_id,
            )

        except stripe.StripeError as e:
            logger.error(f"Stripe error: {str(e)}", exc_info=True)
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
        if not seller or not seller.stripe_connect:
            raise HTTPException(status_code=400, detail="Seller not found or not connected to Stripe")

        # Retrieve the product using the seller's connected account
        product = stripe.Product.retrieve(product_id, stripe_account=seller.stripe_connect.account_id)

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
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> CreateConnectAccountResponse:
    try:
        account = stripe.Account.create(
            type="standard",
            country="US",
            email=user.email,
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            },
            business_type="individual",
            metadata={"user_id": user.id},
        )

        logger.info("Created Connect account %s for user %s", account.id, user.id)

        # Convert UserStripeConnect to a dictionary before updating
        stripe_connect = UserStripeConnect(
            account_id=account.id,
            onboarding_completed=False,
        )

        # Update user with the dictionary representation of UserStripeConnect
        await crud.update_user(
            user.id,
            {
                "stripe_connect": stripe_connect.model_dump(),
            },
        )

        return CreateConnectAccountResponse(account_id=account.id)
    except Exception as e:
        logger.error("Error creating Connect account: %s", str(e))
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

        if not user.stripe_connect or user.stripe_connect.account_id != account_id:
            logger.error(
                "Account ID mismatch. User: %s, Requested: %s",
                user.stripe_connect.account_id if user.stripe_connect else None,
                account_id,
            )
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
            except Exception as e:
                logger.error("Failed to delete account %s: %s", account.id, str(e))

        return {"success": True, "deleted_accounts": deleted_accounts, "count": len(deleted_accounts)}
    except Exception as e:
        logger.error("Error deleting test accounts: %s", str(e))
        raise HTTPException(status_code=400, detail=str(e))


class CreateListingProductResponse(BaseModel):
    stripe_product_id: str
    stripe_price_id: str
    stripe_preorder_deposit_id: str | None


async def create_listing_product(
    name: str,
    description: str,
    price_amount: int,
    currency: str,
    inventory_type: Literal["finite", "preorder"],
    inventory_quantity: int | None,
    preorder_release_date: int | None,
    preorder_deposit_amount: int | None,
    user_id: str,
    stripe_connect_account_id: str,
) -> CreateListingProductResponse:
    """Create Stripe product and associated prices for a new listing."""
    try:
        # Create the product
        product = stripe.Product.create(
            name=name,
            description=description,
            metadata={
                "user_id": user_id,
            },
            stripe_account=stripe_connect_account_id,
        )

        # Create the main price
        price = stripe.Price.create(
            product=product.id,
            currency=currency,
            unit_amount=price_amount,
            metadata={
                "price_type": "primary",
                "inventory_quantity": str(inventory_quantity) if inventory_type == "finite" else "",
                "preorder_release_date": str(preorder_release_date) if inventory_type == "preorder" else "",
            },
            stripe_account=stripe_connect_account_id,
        )

        # Create preorder deposit price if applicable
        preorder_deposit_id = None
        if inventory_type == "preorder" and preorder_deposit_amount:
            preorder_deposit_price = stripe.Price.create(
                product=product.id,
                currency=currency,
                unit_amount=preorder_deposit_amount,
                metadata={
                    "price_type": "deposit",
                    "is_deposit": "true",
                    "full_price_amount": str(price_amount),
                    "preorder_release_date": str(preorder_release_date) if preorder_release_date else "",
                },
                stripe_account=stripe_connect_account_id,
            )
            preorder_deposit_id = preorder_deposit_price.id

        return CreateListingProductResponse(
            stripe_product_id=product.id,
            stripe_price_id=price.id,
            stripe_preorder_deposit_id=preorder_deposit_id,
        )

    except stripe.StripeError as e:
        logger.error(f"Stripe error creating listing product: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating Stripe product: {str(e)}",
        )


@router.post("/process-preorder/{order_id}")
async def process_preorder(
    order_id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    user: User = Depends(get_session_user_with_admin_permission),
) -> Dict[str, Any]:
    async with crud:
        try:
            # Get the order and verify it's a preorder
            order = await crud.get_order(order_id)
            if not order:
                raise HTTPException(status_code=404, detail="Order not found")

            if order.inventory_type != "preorder":
                raise HTTPException(status_code=400, detail="Order is not a preorder")

            if order.status != "preorder_placed":
                raise HTTPException(status_code=400, detail="Order is not in preorder_placed status")

            # Calculate remaining amount (full price minus deposit)
            remaining_amount = order.price_amount - (order.preorder_deposit_amount or 0)

            # Get the seller's connect account
            seller = await crud.get_user(order.user_id)
            if not seller or not seller.stripe_connect:
                raise HTTPException(status_code=400, detail="Seller not found or not connected to Stripe")

            # Create a new checkout session for the final payment
            checkout_params: stripe.checkout.Session.CreateParams = {
                "mode": "payment",
                "payment_method_types": ["card", "affirm"],  # Enable both card and Affirm
                "success_url": STRIPE_CONNECT_FINAL_PAYMENT_SUCCESS_URL,
                "cancel_url": STRIPE_CONNECT_FINAL_PAYMENT_CANCEL_URL,
                "metadata": {
                    "order_id": order.id,
                    "is_final_payment": "true",
                    "original_checkout_session_id": order.stripe_checkout_session_id,
                },
                "payment_intent_data": {
                    "metadata": {
                        "order_id": order.id,
                        "is_final_payment": "true",
                    },
                    "application_fee_amount": int(remaining_amount * 0.02),  # 2% platform fee
                },
                "line_items": [
                    {
                        "price_data": {
                            "currency": order.currency,
                            "unit_amount": remaining_amount,
                            "product": order.stripe_product_id,
                            "product_data": {
                                "name": "Final Payment",
                                "description": "Remaining balance for your preorder",
                            },
                        },
                        "quantity": 1,
                    }
                ],
                # Pre-fill shipping info from original order
                "shipping_address_collection": {"allowed_countries": ["US"]},
                "shipping_options": [
                    {
                        "shipping_rate_data": {
                            "type": "fixed_amount",
                            "display_name": "Free Shipping",
                            "fixed_amount": {
                                "amount": 0,
                                "currency": order.currency,
                            },
                            "delivery_estimate": {
                                "minimum": {"unit": "month", "value": 1},
                                "maximum": {"unit": "month", "value": 2},
                            },
                        },
                    }
                ],
                "stripe_account": seller.stripe_connect.account_id,
            }

            # Create checkout session on seller's connect account
            checkout_session = stripe.checkout.Session.create(**checkout_params)

            # Update order with final payment checkout session
            order_data: OrderDataUpdate = {
                "stripe_connect_account_id": seller.stripe_connect.account_id,
                "stripe_checkout_session_id": order.stripe_checkout_session_id,
                "final_payment_checkout_session_id": checkout_session.id,
                "status": "awaiting_final_payment",
                "updated_at": int(time.time()),
            }

            await crud.update_order(order_id, order_data)

            return {
                "status": "success",
                "checkout_session": {
                    "id": checkout_session.id,
                    "url": checkout_session.url,
                },
            }

        except stripe.StripeError as e:
            logger.error(f"Stripe error processing preorder final payment: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Error processing preorder final payment: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
