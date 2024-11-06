"""Stripe integration router for handling payments and webhooks."""

import logging
from enum import Enum
from typing import Annotated, Any, Dict

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

from store.app.db import Crud
from store.app.model import Order, User
from store.app.routers.users import get_session_user_with_read_permission
from store.settings import settings

logger = logging.getLogger(__name__)

stripe_router = APIRouter()

# Initialize Stripe with your secret key
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
        logger.info(f"[WEBHOOK] Account updated: {account['id']}")

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
                    logger.info(f"[WEBHOOK] Updated user {user.id} Connect onboarding status to completed")
                else:
                    logger.warning(f"[WEBHOOK] No user found for Connect account: {account['id']}")
            except Exception as e:
                logger.error(f"[WEBHOOK] Error updating user Connect status: {str(e)}")
        else:
            logger.info(f"[WEBHOOK] Account {account['id']} not fully onboarded yet. Capabilities: {capabilities}")

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


@stripe_router.post("/create-connect-account", response_model=CreateConnectAccountResponse)
async def create_connect_account(
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> CreateConnectAccountResponse:
    try:
        logger.info(f"[CREATE-CONNECT] Starting new account creation for user {user.id}")

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

        logger.info(f"[CREATE-CONNECT] Created new Connect account: {account.id} for user: {user.id}")

        # Update user record with new Connect account ID
        logger.info("[CREATE-CONNECT] Updating user record with new Connect account ID")
        await crud.update_user(
            user.id,
            {
                "stripe_connect_account_id": account.id,
                "stripe_connect_onboarding_completed": False,
            },
        )

        return CreateConnectAccountResponse(account_id=account.id)
    except Exception as e:
        logger.error(f"[CREATE-CONNECT] Error creating Connect account: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))


@stripe_router.post("/connect-account/update-onboarding-status")
async def update_connect_account_onboarding_status(
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> Dict[str, bool]:
    try:
        if not user.stripe_connect_account_id:
            raise HTTPException(status_code=400, detail="No Stripe Connect account found")

        # Retrieve the account to check its status
        account = stripe.Account.retrieve(user.stripe_connect_account_id)

        # Safely access capabilities
        capabilities = getattr(account, "capabilities", {})
        card_payments_status = capabilities.get("card_payments") if capabilities else None
        transfers_status = capabilities.get("transfers") if capabilities else None

        # Check if the account has completed onboarding
        is_completed = bool(
            account.details_submitted
            and account.payouts_enabled
            and card_payments_status == "active"
            and transfers_status == "active"
        )

        # Update the user record if the status has changed
        if is_completed != user.stripe_connect_onboarding_completed:
            await crud.update_user(user.id, {"stripe_connect_onboarding_completed": is_completed})

        return {"onboarding_completed": is_completed}
    except Exception as e:
        logger.error(f"Error updating Connect account onboarding status: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@stripe_router.post("/connect-account/create-session")
async def create_connect_account_session(
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
) -> Dict[str, str]:
    try:
        if not user.stripe_connect_account_id:
            raise HTTPException(status_code=400, detail="No Stripe Connect account found")

        account_session = stripe.AccountSession.create(
            account=user.stripe_connect_account_id,
            components={
                "account_onboarding": {"enabled": True},
            },
        )

        return {"client_secret": account_session.client_secret}
    except Exception as e:
        logger.error(f"Error creating Connect account session: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# For testing workflow will remove once stripe connect payment and listing integration done
@stripe_router.post("/connect-account/delete-test-accounts")
async def delete_test_accounts(
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> Dict[str, Any]:
    try:
        # Only allow in test mode
        if not settings.stripe.secret_key.startswith("sk_test_"):
            raise HTTPException(status_code=400, detail="This operation is only allowed in test mode")

        deleted_accounts = []
        accounts = stripe.Account.list(limit=100)

        for account in accounts:
            try:
                stripe.Account.delete(account.id)
                deleted_accounts.append(account.id)
                # Update any users that had this account
                await crud.update_user_stripe_connect_reset(account.id)
            except Exception as e:
                logger.error(f"Failed to delete account {account.id}: {str(e)}")

        return {"success": True, "deleted_accounts": deleted_accounts, "count": len(deleted_accounts)}
    except Exception as e:
        logger.error(f"Error deleting test accounts: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


class ConnectAccountStatusResponse(BaseModel):
    status: str
    message: str
    missing_requirements: list[str] | None = None
    account_link: str | None = None
    dashboard_url: str | None = None


@stripe_router.get("/connect-account/status", response_model=ConnectAccountStatusResponse)
async def get_connect_account_status(
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
) -> ConnectAccountStatusResponse:
    try:
        if not user.stripe_connect_account_id:
            return ConnectAccountStatusResponse(
                status=ConnectAccountStatus.NOT_CREATED,
                message="No Stripe Connect account found",
                missing_requirements=["Create a new Stripe Connect account"],
            )

        account = stripe.Account.retrieve(user.stripe_connect_account_id)
        capabilities = account.get("capabilities", {})
        dashboard_url = f"https://dashboard.stripe.com/{account.id}"

        is_fully_onboarded = bool(
            account.get("details_submitted")
            and account.get("payouts_enabled")
            and capabilities.get("card_payments") == "active"
            and capabilities.get("transfers") == "active"
        )

        if is_fully_onboarded:
            return ConnectAccountStatusResponse(
                status=ConnectAccountStatus.COMPLETE,
                message="Your Stripe account is fully set up",
                dashboard_url=dashboard_url,
            )

        # If not fully onboarded, create an account link for completing setup
        account_link = stripe.AccountLink.create(
            account=user.stripe_connect_account_id,
            refresh_url=f"{settings.site.homepage}/seller-onboarding",
            return_url=f"{settings.site.homepage}/seller-onboarding",
            type="account_onboarding",
        )

        missing_requirements = []
        if not account.get("details_submitted"):
            missing_requirements.append("Complete business details")
        if not account.get("payouts_enabled"):
            missing_requirements.append("Set up payouts")
        if capabilities.get("card_payments") != "active":
            missing_requirements.append("Enable card payments")
        if capabilities.get("transfers") != "active":
            missing_requirements.append("Enable transfers")

        return ConnectAccountStatusResponse(
            status=ConnectAccountStatus.INCOMPLETE,
            message="Your Stripe account setup is incomplete",
            missing_requirements=missing_requirements,
            account_link=account_link.url,
            dashboard_url=dashboard_url,
        )

    except Exception as e:
        logger.error(f"Error getting Connect account status: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
