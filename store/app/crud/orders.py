"""This module provides CRUD operations for orders."""

from pydantic import ValidationError

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

    async def get_order_by_session_id(self, session_id: str) -> Order | None:
        orders = await self._get_items_from_secondary_index("stripe_checkout_session_id", session_id, Order)
        return orders[0] if orders else None

    async def update_order(self, order_id: str, update_data: dict) -> Order:
        order = await self.get_order(order_id)
        if not order:
            raise ItemNotFoundError("Order not found")

        # Create a dict of current order data
        current_data = order.model_dump()

        # Update with new data
        current_data.update(update_data)

        try:
            # Validate the updated data
            Order(**current_data)
        except ValidationError as e:
            # If validation fails, raise an error
            raise ValueError(f"Invalid update data: {str(e)}")

        # If validation passes, update the order
        await self._update_item(order_id, Order, update_data)

        # Fetch and return the updated order
        updated_order = await self.get_order(order_id)
        if not updated_order:
            raise ItemNotFoundError("Updated order not found")
        return updated_order
