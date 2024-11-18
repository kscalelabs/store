"""Defines the router endpoints for handling Orders."""

from logging import getLogger

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from store.app.crud.base import ItemNotFoundError
from store.app.crud.orders import OrderDataUpdate
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


class OrderWithProduct(BaseModel):
    order: Order
    product: ProductInfo | None


@router.get("/{order_id}", response_model=OrderWithProduct)
async def get_order(
    order_id: str,
    include_product: bool = False,
    user: User = Depends(get_session_user_with_read_permission),
    crud: Crud = Depends(Crud.get),
) -> Order | OrderWithProduct:
    order = await crud.get_order(order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if not include_product:
        return order

    if order.stripe_product_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order has no associated product")

    product = await stripe.get_product(order.stripe_product_id, crud)
    return OrderWithProduct(order=order, product=ProductInfo(**product))


@router.get("/me", response_model=list[OrderWithProduct])
async def get_user_orders(
    include_products: bool = False,
    user: User = Depends(get_session_user_with_read_permission),
    crud: Crud = Depends(Crud.get),
) -> list[OrderWithProduct]:
    try:
        orders = await crud.get_orders_by_user_id(user.id)

        if not include_products:
            return [OrderWithProduct(order=order, product=None) for order in orders]

        orders_with_products = []
        for order in orders:
            try:
                if order.stripe_product_id is None:
                    orders_with_products.append(OrderWithProduct(order=order, product=None))
                    continue
                product = await stripe.get_product(order.stripe_product_id, crud)
                orders_with_products.append(OrderWithProduct(order=order, product=ProductInfo(**product)))
            except Exception as e:
                logger.error(
                    "Error processing order", extra={"order_id": order.id, "error": str(e), "user_id": user.id}
                )
                orders_with_products.append(OrderWithProduct(order=order, product=None))
                continue
        return orders_with_products
    except ItemNotFoundError:
        return []
    except Exception as e:
        logger.error("Error fetching user orders", extra={"user_id": user.id, "error": str(e)})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error fetching orders: {str(e)}"
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
