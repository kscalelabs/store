"""Defines the router endpoints for handling Orders."""

from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from store.app.crud.base import ItemNotFoundError
from store.app.db import Crud
from store.app.model import Order, User
from store.app.routers.stripe import get_product
from store.app.routers.users import get_session_user_with_read_permission

orders_router = APIRouter()


class ProductInfo(BaseModel):
    id: str
    name: str
    description: str | None
    images: List[str]
    metadata: Dict[str, str]


class OrderWithProduct(BaseModel):
    order: Order
    product: ProductInfo


@orders_router.get("/user-orders", response_model=List[Order])
async def get_user_orders(
    user: User = Depends(get_session_user_with_read_permission), crud: Crud = Depends(Crud.get)
) -> List[Order]:
    try:
        orders = await crud.get_orders_by_user_id(user.id)
        return orders
    except ItemNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No orders found for this user")


@orders_router.get("/order/{order_id}", response_model=Order)
async def get_order(
    order_id: str, user: User = Depends(get_session_user_with_read_permission), crud: Crud = Depends(Crud.get)
) -> Order:
    order = await crud.get_order(order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@orders_router.get("/order-with-product/{order_id}", response_model=OrderWithProduct)
async def get_order_with_product(
    order_id: str, user: User = Depends(get_session_user_with_read_permission), crud: Crud = Depends(Crud.get)
) -> OrderWithProduct:
    order = await crud.get_order(order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.product_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order has no associated product")

    product = await get_product(order.product_id)
    return OrderWithProduct(order=order, product=ProductInfo(**product))


@orders_router.get("/user-orders-with-products", response_model=List[OrderWithProduct])
async def get_user_orders_with_products(
    user: User = Depends(get_session_user_with_read_permission), crud: Crud = Depends(Crud.get)
) -> List[OrderWithProduct]:
    try:
        orders = await crud.get_orders_by_user_id(user.id)
        orders_with_products = []
        for order in orders:
            if order.product_id is None:
                continue  # Skip orders without a product_id
            product = await get_product(order.product_id)
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


@orders_router.put("/update-order-address/{order_id}", response_model=Order)
async def update_order_address(
    order_id: str,
    address_update: UpdateOrderAddressRequest,
    user: User = Depends(get_session_user_with_read_permission),
    crud: Crud = Depends(Crud.get),
) -> Order:
    order = await crud.get_order(order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Update the order with the new address
    updated_order = await crud.update_order(order_id, address_update.dict())
    return updated_order
