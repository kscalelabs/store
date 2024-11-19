"""Defines the router endpoints for handling Orders."""

import asyncio
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from store.app.crud.orders import OrderDataUpdate, OrdersNotFoundError
from store.app.db import Crud
from store.app.model import Order, OrderStatus, User
from store.app.routers import stripe
from store.app.security.user import (
    get_session_user_with_admin_permission,
    get_session_user_with_write_permission,
)

router = APIRouter()

logger = logging.getLogger(__name__)


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


@router.get("/me", response_model=list[OrderWithProduct])
async def get_user_orders(
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
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
        async with crud:
            orders = await crud.get_orders_by_user_id(user.id)
            results = await asyncio.gather(*[get_product_info(order) for order in orders])
            return results

    except OrdersNotFoundError:
        logger.info(f"No orders found for user: {user.id}")
        return []
    except Exception as e:
        logger.error(f"Error fetching orders: {str(e)}", exc_info=True)
        print(f"Error fetching orders: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error fetching orders: {str(e)}"
        )


@router.get("/{order_id}", response_model=OrderWithProduct)
async def get_order(
    order_id: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> OrderWithProduct:
    async with crud:
        order = await crud.get_order(order_id)
        if not order or order.user_id != user.id:
            raise HTTPException(status_code=404, detail="Order not found")

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


class UpdateOrderAddressRequest(BaseModel):
    shipping_name: str
    shipping_address_line1: str
    shipping_address_line2: str | None
    shipping_city: str
    shipping_state: str
    shipping_postal_code: str
    shipping_country: str


@router.put("/shipping-address/{order_id}", response_model=Order)
async def update_order_shipping_address(
    order_id: str,
    address_update: UpdateOrderAddressRequest,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
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


class AdminOrdersResponse(BaseModel):
    orders: list[OrderWithProduct]


@router.get("/admin/all", response_model=AdminOrdersResponse)
async def get_all_orders(
    user: Annotated[User, Depends(get_session_user_with_admin_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> AdminOrdersResponse:
    """Get all orders (admin only)."""
    orders = await crud.dump_orders()

    orders_with_products = []
    for order in orders:
        try:
            product = None
            if order.stripe_product_id:
                product = await stripe.get_product(order.stripe_product_id, crud)
                product_info = ProductInfo(
                    id=product.id,
                    name=product.name,
                    description=product.description,
                    images=product.images,
                    metadata=product.metadata,
                    active=product.active,
                )
            orders_with_products.append(OrderWithProduct(order=order, product=product_info))
        except Exception as e:
            logger.error(f"Error getting product info for order {order.id}: {str(e)}")
            orders_with_products.append(OrderWithProduct(order=order, product=None))

    return AdminOrdersResponse(orders=orders_with_products)


class UpdateOrderStatusRequest(BaseModel):
    status: OrderStatus


@router.put("/admin/status/{order_id}", response_model=Order)
async def update_order_status(
    order_id: str,
    status_update: UpdateOrderStatusRequest,
    user: Annotated[User, Depends(get_session_user_with_admin_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> Order:
    order = await crud.get_order(order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    update_dict = OrderDataUpdate(status=status_update.status)
    updated_order = await crud.update_order(order_id, update_dict)
    return updated_order
