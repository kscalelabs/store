"""Defines the router endpoints for handling Orders."""

import asyncio
from logging import getLogger

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from store.app.crud.orders import OrderDataUpdate, OrdersNotFoundError
from store.app.db import Crud
from store.app.model import Order, User
from store.app.routers import stripe
from store.app.security.user import (
    get_session_user_with_read_permission,
    get_session_user_with_write_permission,
)

router = APIRouter()

logger = getLogger(__name__)


class ProductInfo(BaseModel):
    id: str
    name: str
    description: str | None
    images: list[str]
    metadata: dict[str, str]
    active: bool


class OrderWithProduct(BaseModel):
    order: Order
    product: ProductInfo | None


@router.get("/{order_id}", response_model=OrderWithProduct)
async def get_order(
    order_id: str,
    user: User = Depends(get_session_user_with_read_permission),
    crud: Crud = Depends(),
) -> OrderWithProduct:
    async with crud:
        order = await crud.get_order(order_id)
        if not order or order.user_id != user.id:
            raise HTTPException(status_code=404, detail="Order not found")

        # Get product info from Stripe
        product = await stripe.get_product(order.stripe_product_id, crud)

        # Convert ProductResponse to ProductInfo
        product_info = ProductInfo(
            id=product.id,
            name=product.name,
            description=product.description,
            images=product.images,
            metadata=product.metadata,
            active=product.active,
        )

        return OrderWithProduct(order=order, product=product_info)


@router.get("/me", response_model=list[OrderWithProduct])
async def get_user_orders(
    user: User = Depends(get_session_user_with_read_permission),
    crud: Crud = Depends(),
) -> list[OrderWithProduct]:
    async def get_product_info(order: Order) -> OrderWithProduct:
        if not order.stripe_product_id:
            return OrderWithProduct(order=order, product=None)

        try:
            product = await stripe.get_product(order.stripe_product_id, crud)
            product_info = ProductInfo(
                id=product.id,
                name=product.name,
                description=product.description,
                images=product.images,
                metadata=product.metadata,
                active=product.active,
            )
            return OrderWithProduct(order=order, product=product_info)
        except Exception as e:
            logger.error(
                "Error getting product info for order",
                extra={"order_id": order.id, "error": str(e), "user_id": user.id},
            )
            return OrderWithProduct(order=order, product=None)

    try:
        orders = await crud.get_orders_by_user_id(user.id)
        return await asyncio.gather(*[get_product_info(order) for order in orders])
    except OrdersNotFoundError:
        return []
    except asyncio.TimeoutError:
        logger.error("Timeout while fetching orders", extra={"user_id": user.id})
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="Request timed out while fetching orders"
        )
    except Exception as e:
        logger.error(
            "Unexpected error fetching user orders",
            extra={"user_id": user.id, "error": str(e), "error_type": type(e).__name__},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching orders",
        )


class UpdateOrderAddressRequest(BaseModel):
    shipping_name: str
    shipping_address_line1: str
    shipping_address_line2: str | None
    shipping_city: str
    shipping_state: str
    shipping_postal_code: str
    shipping_country: str


@router.put("/{order_id}/shipping-address", response_model=Order)
async def update_order_shipping_address(
    order_id: str,
    address_update: UpdateOrderAddressRequest,
    user: User = Depends(get_session_user_with_write_permission),
    crud: Crud = Depends(Crud.get),
) -> Order:
    order = await crud.get_order(order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Create OrderDataUpdate with shipping fields
    update_dict = OrderDataUpdate(
        shipping_name=address_update.shipping_name,
        shipping_address_line1=address_update.shipping_address_line1,
        shipping_address_line2=address_update.shipping_address_line2 if address_update.shipping_address_line2 else None,
        shipping_city=address_update.shipping_city,
        shipping_state=address_update.shipping_state,
        shipping_postal_code=address_update.shipping_postal_code,
        shipping_country=address_update.shipping_country,
    )

    updated_order = await crud.update_order(order_id, update_dict)
    return updated_order
