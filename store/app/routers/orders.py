"""Defines the router endpoints for handling Orders."""

from typing import Annotated, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from store.app.crud.base import ItemNotFoundError
from store.app.crud.orders import OrderDataUpdate
from store.app.db import Crud
from store.app.model import Order, User
from store.app.routers import stripe
from store.app.routers.users import get_session_user_with_read_permission

router = APIRouter()


class ProductInfo(BaseModel):
    id: str
    name: str
    description: str | None
    images: List[str]
    metadata: Dict[str, str]


class OrderWithProduct(BaseModel):
    order: Order
    product: ProductInfo


@router.get("/user-orders", response_model=List[Order])
async def get_user_orders(
    user: User = Depends(get_session_user_with_read_permission), crud: Crud = Depends(Crud.get)
) -> List[Order]:
    try:
        orders = await crud.get_orders_by_user_id(user.id)
        return orders
    except ItemNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No orders found for this user")


@router.get("/order/{order_id}", response_model=Order)
async def get_order(
    order_id: str,
    user: User = Depends(get_session_user_with_read_permission),
    crud: Crud = Depends(Crud.get),
) -> Order:
    order = await crud.get_order(order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.get("/order-with-product/{order_id}", response_model=OrderWithProduct)
async def get_order_with_product(
    order_id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    user: User = Depends(get_session_user_with_read_permission),
) -> OrderWithProduct:
    order = await crud.get_order(order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.stripe_product_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order has no associated product")

    product = await stripe.get_product(order.stripe_product_id, crud)
    return OrderWithProduct(order=order, product=ProductInfo(**product))


@router.get("/user-orders-with-products", response_model=List[OrderWithProduct])
async def get_user_orders_with_products(
    crud: Annotated[Crud, Depends(Crud.get)],
    user: User = Depends(get_session_user_with_read_permission),
) -> List[OrderWithProduct]:
    try:
        orders = await crud.get_orders_by_user_id(user.id)
        orders_with_products = []
        for order in orders:
            if order.stripe_product_id is None:
                continue  # Skip orders without a stripe_product_id
            product = await stripe.get_product(order.stripe_product_id, crud)
            orders_with_products.append(OrderWithProduct(order=order, product=ProductInfo(**product)))
        return orders_with_products
    except ItemNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No orders found for this user")


class UpdateOrderAddressRequest(BaseModel):
    shipping_name: str
    shipping_address_line1: str
    shipping_address_line2: str | None
    shipping_city: str
    shipping_state: str
    shipping_postal_code: str
    shipping_country: str


@router.put("/update-order-address/{order_id}", response_model=Order)
async def update_order_address(
    order_id: str,
    address_update: UpdateOrderAddressRequest,
    user: User = Depends(get_session_user_with_read_permission),
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
