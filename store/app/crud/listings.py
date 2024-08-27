"""Defines CRUD interface for managing listings."""

import asyncio
import logging
from typing import Any, Coroutine

from store.app.crud.artifacts import ArtifactsCrud
from store.app.crud.base import BaseCrud, ItemNotFoundError
from store.app.model import Listing, ListingTag

logger = logging.getLogger(__name__)


class ListingsCrud(ArtifactsCrud, BaseCrud):
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

    async def dump_listings(self) -> list[Listing]:
        return await self._list_items(Listing)

    async def add_listing(self, listing: Listing) -> None:
        try:
            await asyncio.gather(
                *(self._get_item(child_id, Listing, throw_if_missing=True) for child_id in listing.child_ids),
            )
        except ItemNotFoundError:
            raise ValueError("One or more artifact or child IDs is invalid")
        await self._add_item(listing)

    async def _delete_listing_artifacts(self, listing: Listing) -> None:
        artifacts = await self.get_listing_artifacts(listing.id)
        await asyncio.gather(*[self.remove_artifact(artifact) for artifact in artifacts])

    async def _delete_listing_tags(self, listing_id: str) -> None:
        listing_tags = await self._get_items_from_secondary_index("listing_id", listing_id, ListingTag)
        await asyncio.gather(*(self._delete_item(tag) for tag in listing_tags))

    async def delete_listing(self, listing: Listing) -> None:
        await asyncio.gather(
            self._delete_listing_artifacts(listing),
            self._delete_listing_tags(listing.id),
        )

        # Only delete the listing after all artifacts have been removed.
        await self._delete_item(listing)

    async def edit_listing(
        self,
        listing_id: str,
        name: str | None = None,
        child_ids: list[str] | None = None,
        description: str | None = None,
        tags: list[str] | None = None,
        onshape_url: str | None = None,
    ) -> None:
        listing = await self.get_listing(listing_id)
        if listing is None:
            raise ItemNotFoundError("Listing not found")
        coroutines: list[Coroutine] = []
        if tags is not None:
            coroutines.append(self.set_listing_tags(listing, tags))
        listing_updates: dict[str, Any] = {}  # noqa: ANN401
        if name is not None:
            listing_updates["name"] = name
        if child_ids is not None:
            listing_updates["child_ids"] = child_ids
        if description is not None:
            listing_updates["description"] = description
        if onshape_url is not None:
            listing_updates["onshape_url"] = onshape_url
        if listing_updates:
            coroutines.append(self._update_item(listing_id, Listing, listing_updates))
        if coroutines:
            await asyncio.gather(*coroutines)

    async def remove_onshape_url(self, listing_id: str) -> None:
        await self._update_item(listing_id, Listing, {"onshape_url": None})

    async def _add_tag_to_listing(self, listing_id: str, tag: str) -> None:
        await self._add_item(ListingTag.create(listing_id=listing_id, tag=tag), unique_fields=["listing_id", "name"])

    async def _remove_tag_from_listing(self, listing_id: str, tag: str) -> None:
        await self._delete_item(listing_id)

    async def set_listing_tags(self, listing: Listing, tags: list[str]) -> None:
        """For a given listing, determines which tags to add and which to remove.

        Args:
            listing: The listing to update.
            tags: The new tags to set.
        """
        tags_to_add = set(tags)
        tags_to_remove = set(await self.get_tags_for_listing(listing.id))
        tags_to_add.difference_update(tags_to_remove)
        tags_to_remove.difference_update(tags_to_add)
        await asyncio.gather(
            *(self._add_tag_to_listing(listing.id, tag) for tag in tags_to_add),
            *(self._remove_tag_from_listing(listing.id, tag) for tag in tags_to_remove),
        )

    async def get_tags_for_listing(self, listing_id: str) -> list[str]:
        listing_tags = await self._get_items_from_secondary_index("listing_id", listing_id, ListingTag)
        return [t.name for t in listing_tags]

    async def get_listing_ids_for_tag(self, tag: str) -> list[str]:
        listing_tags = await self._get_items_from_secondary_index("name", tag, ListingTag)
        return [t.listing_id for t in listing_tags]
