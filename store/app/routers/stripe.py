"""Stripe integration router for handling payments and webhooks."""

import logging
from typing import Annotated, Any, Dict

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

from store.app.db import Crud
from store.app.model import User
from store.app.routers.users import get_session_user_with_read_permission
from store.settings import settings

logger = logging.getLogger(__name__)

stripe_router = APIRouter()

# Initialize Stripe with your secret key
stripe.api_key = settings.stripe.secret_key


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


@stripe_router.post("/webhook")
async def stripe_webhook(request: Request, crud: Crud = Depends(Crud.get)) -> Dict[str, str]:
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    logger.info(f"Received Stripe webhook. Signature: {sig_header}")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe.webhook_secret)
        logger.info(f"Webhook verified. Event type: {event['type']}")
    except ValueError as e:
        logger.error(f"Invalid payload: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid payload")

    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        logger.info(f"Checkout session completed: {session['id']}")
        await handle_checkout_session_completed(session, crud)
    elif event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        logger.info(f"Payment intent succeeded: {payment_intent['id']}")
    else:
        logger.info(f"Unhandled event type: {event['type']}")

    return {"status": "success"}


async def handle_checkout_session_completed(session: Dict[str, Any], crud: Crud) -> None:
    try:
        order_data = {
            "user_id": session.get("client_reference_id"),
            "user_email": session["customer_details"]["email"],
            "stripe_checkout_session_id": session["id"],
            "stripe_payment_intent_id": session.get("payment_intent"),
            "amount": session["amount_total"],
            "currency": session["currency"],
            "status": "processing",
            "product_id": session["metadata"].get("product_id"),
        }

        new_order = await crud.create_order(order_data)
        logger.info(f"New order created: {new_order.id}")
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        # Add some error handling here, such as retrying or notifying an admin
        raise


async def fulfill_order(
    session: Dict[str, Any],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> None:
    user_id = session.get("client_reference_id")
    if not user_id:
        logger.warning(f"No user_id found for session: {session['id']}")
        return

    user = await crud.get_user(user_id)
    if not user:
        logger.warning(f"User not found for id: {user_id}")
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
        logger.info(f"Order fulfilled for session: {session['id']} and user: {user_id}")
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        # You might want to add some error handling here, such as retrying or notifying an admin


async def notify_payment_failed(session: Dict[str, Any]) -> None:
    # Implement notification logic
    print(f"Payment failed for session: {session['id']}")


class CreateCheckoutSessionRequest(BaseModel):
    product_id: str


class CreateCheckoutSessionResponse(BaseModel):
    session_id: str


@stripe_router.post("/create-checkout-session", response_model=CreateCheckoutSessionResponse)
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
) -> CreateCheckoutSessionResponse:
    try:
        product_id = request.product_id
        logger.info(f"Creating checkout session for product: {product_id} and user: {user.id}")

        # Create a Checkout Session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product": product_id,
                        "unit_amount": 1600000,  # $16000.00
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=f"{settings.site.homepage}/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.site.homepage}/cancel",
            client_reference_id=user.id,
            metadata={
                "product_id": product_id,
                "user_email": user.email,
            },
        )

        logger.info(f"Checkout session created: {checkout_session.id}")
        return CreateCheckoutSessionResponse(session_id=checkout_session.id)
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@stripe_router.get("/get_product/{product_id}")
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
