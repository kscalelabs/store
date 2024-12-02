"""This module provides CRUD operations for orders."""

import logging
from typing import NotRequired, TypedDict

from pydantic import ValidationError

from www.app.crud.base import BaseCrud, ItemNotFoundError
from www.app.model import InventoryType, Order, OrderStatus

logger = logging.getLogger(__name__)


class OrderDataCreate(TypedDict):
    user_id: str
    listing_id: str
    user_email: str
    quantity: int
    price_amount: int
    currency: str
    stripe_checkout_session_id: str
    stripe_product_id: str
    stripe_price_id: str
    stripe_connect_account_id: str
    stripe_payment_intent_id: str
    preorder_release_date: NotRequired[int | None]
    preorder_deposit_amount: NotRequired[int | None]
    stripe_preorder_deposit_id: NotRequired[str | None]
    status: NotRequired[OrderStatus]
    inventory_type: NotRequired[InventoryType]
    shipping_name: NotRequired[str]
    shipping_address_line1: NotRequired[str]
    shipping_address_line2: NotRequired[str]
    shipping_city: NotRequired[str]
    shipping_state: NotRequired[str]
    shipping_postal_code: NotRequired[str]
    shipping_country: NotRequired[str]


class OrderDataUpdate(TypedDict):
    updated_at: NotRequired[int]
    status: NotRequired[OrderStatus]
    stripe_connect_account_id: NotRequired[str]
    stripe_checkout_session_id: NotRequired[str]
    final_payment_checkout_session_id: NotRequired[str]
    final_payment_intent_id: NotRequired[str]
    final_payment_date: NotRequired[int]
    stripe_refund_id: NotRequired[str]
    shipping_name: NotRequired[str]
    shipping_address_line1: NotRequired[str]
    shipping_address_line2: NotRequired[str | None]
    shipping_city: NotRequired[str]
    shipping_state: NotRequired[str]
    shipping_postal_code: NotRequired[str]
    shipping_country: NotRequired[str]


class ProcessPreorderData(TypedDict):
    stripe_connect_account_id: str
    stripe_checkout_session_id: str
    final_payment_checkout_session_id: str
    status: OrderStatus
    updated_at: int


class OrdersNotFoundError(ItemNotFoundError):
    """Raised when no orders are found for a user."""

    pass


class OrdersCrud(BaseCrud):
    """CRUD operations for Orders."""

    async def create_order(self, order_data: OrderDataCreate) -> Order:
        order = Order.create(**order_data)
        await self._add_item(order)
        return order

    async def get_order(self, order_id: str) -> Order | None:
        return await self._get_item(order_id, Order, throw_if_missing=False)

    async def get_orders_by_user_id(self, user_id: str) -> list[Order]:
        orders = await self._get_items_from_secondary_index("user_id", user_id, Order)
        if not orders:
            raise OrdersNotFoundError(f"No orders found for user {user_id}")
        return orders

    async def update_order(self, order_id: str, update_data: OrderDataUpdate) -> Order:
        order = await self.get_order(order_id)
        if not order:
            raise ItemNotFoundError("Order not found")

        current_data = order.model_dump()
        update_dict = dict(update_data)
        current_data.update(update_dict)

        try:
            Order(**current_data)
        except ValidationError as e:
            raise ValueError(f"Invalid update data: {str(e)}")

        await self._update_item(order_id, Order, update_dict)
        updated_order = await self.get_order(order_id)
        if not updated_order:
            raise ItemNotFoundError("Updated order not found")
        return updated_order

    async def process_preorder(self, order_id: str, update_data: ProcessPreorderData) -> Order:
        order = await self.get_order(order_id)
        if not order:
            raise ItemNotFoundError("Order not found")

        current_data = order.model_dump()
        update_dict = dict(update_data)
        current_data.update(update_dict)

        try:
            Order(**current_data)
        except ValidationError as e:
            raise ValueError(f"Invalid update data: {str(e)}")

        await self._update_item(order_id, Order, update_dict)
        updated_order = await self.get_order(order_id)
        if not updated_order:
            raise ItemNotFoundError("Updated order not found")
        return updated_order

    async def dump_orders(self) -> list[Order]:
        return await self._list_items(Order)
