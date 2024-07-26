"""Defines CRUD interface for managing listings."""

import logging

from store.app.crud.base import BaseCrud
from store.app.model import Listing, ListingTag

logger = logging.getLogger(__name__)


class ListingsCrud(BaseCrud):
    @classmethod
    def get_gsis(cls) -> set[str]:
        return super().get_gsis().union({"listing_id", "name"})

    async def get_listing(self, listing_id: str) -> Listing | None:
        return await self._get_item(listing_id, Listing, throw_if_missing=False)

    async def add_listing(self, listing: Listing) -> None:
        await self._add_item(listing)

    async def delete_listing(self, listing_id: str) -> None:
        await self._delete_item(listing_id)

    async def get_listing_tag(self, listing_tag_id: str) -> ListingTag | None:
        return await self._get_item(listing_tag_id, ListingTag, throw_if_missing=False)

    async def add_tag(self, listing_id: str, tag: str) -> None:
        listing_tag = ListingTag.create(listing_id=listing_id, tag=tag)
        return await self._add_item(listing_tag)

    async def delete_tag(self, listing_id: str, tag: str) -> None:
        listing_tag = ListingTag.create(listing_id=listing_id, tag=tag)
        return await self._delete_item(listing_tag)
