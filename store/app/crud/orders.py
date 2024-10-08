"""This module provides CRUD operations for orders."""

from store.app.crud.base import BaseCrud, ItemNotFoundError
from store.app.model import Order


class OrdersCrud(BaseCrud):
    """CRUD operations for Orders."""

    async def create_order(self, order_data: dict) -> Order:
        order = Order.create(**order_data)
        await self._add_item(order)
        return order

    async def get_orders_by_user_id(self, user_id: str) -> list[Order]:
        orders = await self._get_items_from_secondary_index("user_id", user_id, Order)
        if not orders:
            raise ItemNotFoundError("No orders found for this user")
        return orders

    async def get_order(self, order_id: str) -> Order | None:
        return await self._get_item(order_id, Order, throw_if_missing=False)
