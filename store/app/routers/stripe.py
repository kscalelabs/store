"""Stripe integration router for handling payments and webhooks."""

import logging
from enum import Enum
from typing import Annotated, Any, Dict

import stripe
from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from pydantic import BaseModel

from store.app.db import Crud
from store.app.model import Order, User
from store.app.security.user import get_session_user_with_read_permission
from store.settings import settings

logger = logging.getLogger(__name__)

stripe_router = APIRouter()
stripe.api_key = settings.stripe.secret_key


class ConnectAccountStatus(str, Enum):
    NOT_CREATED = "not_created"
    INCOMPLETE = "incomplete"
    COMPLETE = "complete"


@stripe_router.post("/create-payment-intent")
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


@stripe_router.put("/refunds/{order_id}", response_model=Order)
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


@stripe_router.post("/webhook")
async def stripe_webhook(request: Request, crud: Crud = Depends(Crud.get)) -> Dict[str, str]:
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    logger.info("Received Stripe webhook. Signature: %s", sig_header)

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe.webhook_secret)
        logger.info("Webhook verified. Event type: %s", event["type"])
    except ValueError as e:
        logger.error("Invalid payload: %s", str(e))
        raise HTTPException(status_code=400, detail="Invalid payload")

    # Handle the event
    if event["type"] == "account.updated":
        account = event["data"]["object"]
        logger.info("Account updated: %s", account["id"])

        # Check if this is a Connect account becoming fully onboarded
        capabilities = account.get("capabilities", {})
        is_fully_onboarded = bool(
            account.get("details_submitted")
            and account.get("payouts_enabled")
            and capabilities.get("card_payments") == "active"
            and capabilities.get("transfers") == "active"
        )

        if is_fully_onboarded:
            try:
                # Find user with this Connect account ID
                users = await crud.get_users_by_stripe_connect_id(account["id"])
                if users:
                    user = users[0]  # Assume one user per Connect account
                    # Update user's onboarding status
                    await crud.update_stripe_connect_status(user.id, account["id"], is_completed=True)
                    logger.info("Updated user %s Connect onboarding status to completed", user.id)
                else:
                    logger.warning("No user found for Connect account: %s", account["id"])
            except Exception as e:
                logger.error("Error updating user Connect status: %s", str(e))
        else:
            logger.info("Account %s not fully onboarded yet. Capabilities: %s", account["id"], capabilities)

    elif event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        logger.info("Checkout session completed: %s", session["id"])
        await handle_checkout_session_completed(session, crud)
    elif event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        logger.info("Payment intent succeeded: %s", payment_intent["id"])
    else:
        logger.info("Unhandled event type: %s", event["type"])

    return {"status": "success"}


async def handle_checkout_session_completed(session: Dict[str, Any], crud: Crud) -> None:
    try:
        shipping_details = session.get("shipping_details", {})
        shipping_address = shipping_details.get("address", {})

        # Get the line items to extract the quantity
        line_items = stripe.checkout.Session.list_line_items(session["id"])
        quantity = line_items.data[0].quantity if line_items.data else 1

        order_data = {
            "user_id": session.get("client_reference_id"),
            "user_email": session["customer_details"]["email"],
            "stripe_checkout_session_id": session["id"],
            "stripe_payment_intent_id": session.get("payment_intent"),
            "amount": session["amount_total"],
            "currency": session["currency"],
            "status": "processing",
            "product_id": session["metadata"].get("product_id"),
            "quantity": quantity,
            "shipping_name": shipping_details.get("name"),
            "shipping_address_line1": shipping_address.get("line1"),
            "shipping_address_line2": shipping_address.get("line2"),
            "shipping_city": shipping_address.get("city"),
            "shipping_state": shipping_address.get("state"),
            "shipping_postal_code": shipping_address.get("postal_code"),
            "shipping_country": shipping_address.get("country"),
        }

        new_order = await crud.create_order(order_data)
        logger.info("New order created: %s", new_order.id)
    except Exception as e:
        logger.error("Error creating order: %s", str(e))
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
        "product_id": session["metadata"].get("product_id"),
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
    product_id: str
    cancel_url: str


class CreateCheckoutSessionResponse(BaseModel):
    session_id: str


@stripe_router.post("/create-checkout-session", response_model=CreateCheckoutSessionResponse)
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
) -> CreateCheckoutSessionResponse:
    try:
        product_id = request.product_id
        cancel_url = request.cancel_url
        logger.info("Creating checkout session for product: %s and user: %s", product_id, user.id)

        # Fetch the price associated with the product
        prices = stripe.Price.list(product=product_id, active=True, limit=1)
        if not prices.data:
            raise HTTPException(status_code=400, detail="No active price found for this product")
        price = prices.data[0]

        # Create a Checkout Session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card", "affirm"],
            line_items=[
                {
                    "price": price.id,
                    "quantity": 1,
                    "adjustable_quantity": {
                        "enabled": True,
                        "minimum": 1,
                        "maximum": 10,
                    },
                }
            ],
            automatic_tax={"enabled": True},
            mode="payment",
            success_url=f"{settings.site.homepage}/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.site.homepage}{cancel_url}",
            client_reference_id=user.id,
            metadata={
                "product_id": product_id,
                "user_email": user.email,
            },
            shipping_address_collection={
                "allowed_countries": ["US", "CA"],
            },
            currency="usd",
            shipping_options=[
                {
                    "shipping_rate_data": {
                        "type": "fixed_amount",
                        "fixed_amount": {"amount": 0, "currency": "usd"},
                        "display_name": "Free shipping",
                        "delivery_estimate": {
                            "minimum": {"unit": "business_day", "value": 5},
                            "maximum": {"unit": "business_day", "value": 7},
                        },
                    },
                },
                {
                    "shipping_rate_data": {
                        "type": "fixed_amount",
                        "fixed_amount": {"amount": 2500, "currency": "usd"},
                        "display_name": "Ground - Express",
                        "delivery_estimate": {
                            "minimum": {"unit": "business_day", "value": 3},
                            "maximum": {"unit": "business_day", "value": 7},
                        },
                    },
                },
            ],
        )

        logger.info("Checkout session created: %s", checkout_session.id)
        return CreateCheckoutSessionResponse(session_id=checkout_session.id)
    except Exception as e:
        logger.error("Error creating checkout session: %s", str(e))
        raise HTTPException(status_code=400, detail=str(e))


@stripe_router.get("/get-product/{product_id}")
async def get_product(product_id: str) -> Dict[str, Any]:
    try:
        product = stripe.Product.retrieve(product_id)
        return {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "images": product.images,
            "metadata": product.metadata,
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


class CreateConnectAccountResponse(BaseModel):
    account_id: str


@stripe_router.post("/connect/account", response_model=CreateConnectAccountResponse)
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


@stripe_router.post("/connect/account/session")
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


@stripe_router.post("/connect/delete/accounts")
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
