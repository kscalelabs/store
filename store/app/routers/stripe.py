"""Stripe integration router for handling payments and webhooks."""

from typing import Any, Dict

import stripe
from fastapi import APIRouter, HTTPException, Request

from store.settings import settings

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
async def stripe_webhook(request: Request) -> Dict[str, str]:
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe.webhook_secret)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        # Fulfill the purchase...
        await fulfill_order(session)
    elif event["type"] == "checkout.session.async_payment_succeeded":
        session = event["data"]["object"]
        # Fulfill the purchase...
        await fulfill_order(session)
    elif event["type"] == "checkout.session.async_payment_failed":
        session = event["data"]["object"]
        # Notify the customer that their order was not fulfilled
        await notify_payment_failed(session)

    return {"status": "success"}


async def fulfill_order(session: Dict[str, Any]) -> None:
    # Implement order fulfillment logic
    print(f"Fulfilling order for session: {session['id']}")


async def notify_payment_failed(session: Dict[str, Any]) -> None:
    # Implement notification logic
    print(f"Payment failed for session: {session['id']}")


@stripe_router.post("/create-checkout-session")
async def create_checkout_session(request: Request) -> Dict[str, Any]:
    try:
        data = await request.json()
        product_id = data.get("product_id")

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
        )

        return {"sessionId": checkout_session.id}
    except Exception as e:
        return {"error": str(e)}
