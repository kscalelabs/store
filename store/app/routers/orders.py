"""Defines the router endpoints for handling Orders."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from store.app.crud.base import ItemNotFoundError
from store.app.crud.orders import OrdersCrud
from store.app.model import Order, User
from store.app.routers.users import get_session_user_with_read_permission

orders_router = APIRouter()
orders_crud = OrdersCrud()


@orders_router.get("/get_user_orders", response_model=List[Order])
async def get_user_orders(user: User = Depends(get_session_user_with_read_permission)) -> List[Order]:
    try:
        orders = await orders_crud.get_orders_by_user_id(user.id)
        return orders
    except ItemNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No orders found for this user")


@orders_router.get("/get_order/{order_id}", response_model=Order)
async def get_order(order_id: str, user: User = Depends(get_session_user_with_read_permission)) -> Order:
    order = await orders_crud.get_order(order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order
