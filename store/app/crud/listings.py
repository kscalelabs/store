"""Defines CRUD interface for managing listings."""

import asyncio
import logging

from store.app.crud.base import BaseCrud, ItemNotFoundError
from store.app.model import Artifact, Listing, ListingTag

logger = logging.getLogger(__name__)


class ListingsCrud(BaseCrud):
    @classmethod
    def get_gsis(cls) -> set[str]:
        return super().get_gsis().union({"listing_id", "name"})

    async def get_listing(self, listing_id: str) -> Listing | None:
        return await self._get_item(listing_id, Listing, throw_if_missing=False)

    async def get_listings(self, page: int, search_query: str | None = None) -> tuple[list[Listing], bool]:
        # 0 is a placeholder sorting function.
        # We might need to add timestamp back to show the most recent 12 entries.
        # Or we define some other sort of metric later like popularity.
        # (Or perhaps we even take in a function as an argument that tells us how to sort?!)
        return await self._list(Listing, page, lambda x: 0, search_query)

    async def get_user_listings(self, user_id: str, page: int, search_query: str) -> tuple[list[Listing], bool]:
        return await self._list_me(Listing, user_id, page, lambda x: 0, search_query)

    async def add_listing(self, listing: Listing) -> None:
        try:
            await asyncio.gather(
                *[self._get_item(artifact_id, Artifact, throw_if_missing=True) for artifact_id in listing.artifact_ids],
                *[self._get_item(child_id, Listing, throw_if_missing=True) for child_id in listing.child_ids],
            )
        except ItemNotFoundError:
            raise ValueError("One or more artifact or child IDs is invalid")
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
