"""Defines CRUD interface for managing listings."""

import asyncio
import logging
from enum import Enum
from typing import Any

from boto3.dynamodb.conditions import Attr

from store.app.crud.artifacts import ArtifactsCrud
from store.app.crud.base import BaseCrud, ItemNotFoundError
from store.app.model import Listing, ListingTag, ListingVote

logger = logging.getLogger(__name__)


class SortOption(str, Enum):
    NEWEST = "newest"
    MOST_VIEWED = "most_viewed"
    MOST_UPVOTED = "most_upvoted"


class ListingsCrud(ArtifactsCrud, BaseCrud):
    PAGE_SIZE = 20

    @classmethod
    def get_gsis(cls) -> set[str]:
        return super().get_gsis().union({"listing_id", "name"})

    async def get_listing(self, listing_id: str) -> Listing | None:
        return await self._get_item(listing_id, Listing, throw_if_missing=False)

    async def get_listings(
        self, page: int, search_query: str | None = None, sort_by: SortOption = SortOption.NEWEST
    ) -> tuple[list[Listing], bool]:
        logger.info(f"Getting listings - page: {page}, search_query: {search_query}, sort_by: {sort_by}")
        sort_function = self._get_sort_function(sort_by)
        try:
            result = await self._list(Listing, page, sort_function, search_query)
            logger.info(f"Retrieved {len(result[0])} listings")
            return result
        except Exception as e:
            logger.error(f"Error in get_listings: {str(e)}")
            raise

    def _get_sort_function(self, sort_by: SortOption):
        if sort_by == SortOption.NEWEST:
            return lambda x: (x.get("created_at") or 0, x.get("id", ""))
        elif sort_by == SortOption.MOST_VIEWED:
            return lambda x: int(x.get("views", 0))
        elif sort_by == SortOption.MOST_UPVOTED:
            return lambda x: int(x.get("score", 0))
        else:
            return lambda x: x.get("id", "")

    async def _list(
        self, model_class, page: int, sort_function, search_query: str | None = None
    ) -> tuple[list[Any], bool]:
        table = await self.db.Table(self._get_table_name(model_class))

        scan_params = {}
        if search_query:
            filter_expression = Attr("name").contains(search_query) | Attr("description").contains(search_query)
            scan_params["FilterExpression"] = filter_expression

        response = await table.scan(**scan_params)
        items = response["Items"]

        sorted_items = sorted(items, key=sort_function, reverse=True)

        # Filter out items with missing required fields
        required_fields = {"updated_at", "name", "child_ids"}
        valid_items = [item for item in sorted_items if all(field in item for field in required_fields)]

        # Paginate results
        start = (page - 1) * self.PAGE_SIZE
        end = start + self.PAGE_SIZE
        paginated_items = valid_items[start:end]

        return [model_class(**item) for item in paginated_items], len(valid_items) > end

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

        updates: dict[str, Any] = {}
        if name is not None:
            updates["name"] = name
        if child_ids is not None:
            updates["child_ids"] = child_ids
        if description is not None:
            updates["description"] = description

        coroutines = []
        if tags is not None:
            coroutines.append(self.set_listing_tags(listing, tags))
        if onshape_url is not None:
            updates["onshape_url"] = onshape_url
        if updates:
            coroutines.append(self._update_item(listing_id, Listing, updates))

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

    async def increment_view_count(self, listing_id: str) -> None:
        table = await self.db.Table(self._get_table_name(Listing))
        await table.update_item(
            Key={"id": listing_id},
            UpdateExpression="ADD #views :inc",
            ExpressionAttributeNames={"#views": "views"},
            ExpressionAttributeValues={":inc": 1},
        )

    async def update_vote(self, listing_id: str, upvote: bool) -> None:
        table = await self.db.Table(self._get_table_name(Listing))
        await table.update_item(
            Key={"id": listing_id},
            UpdateExpression="ADD #vote_type :inc, score :score_inc",
            ExpressionAttributeNames={"#vote_type": "upvotes" if upvote else "downvotes"},
            ExpressionAttributeValues={":inc": 1, ":score_inc": 1 if upvote else -1},
        )

    async def remove_vote(self, listing_id: str, was_upvote: bool) -> None:
        table = await self.db.Table(self._get_table_name(Listing))
        await table.update_item(
            Key={"id": listing_id},
            UpdateExpression="ADD #vote_type :dec, score :score_dec",
            ExpressionAttributeNames={"#vote_type": "upvotes" if was_upvote else "downvotes"},
            ExpressionAttributeValues={":dec": -1, ":score_dec": -1 if was_upvote else 1},
            ConditionExpression=Attr(f"{'upvotes' if was_upvote else 'downvotes'}").gt(0),
        )

    async def get_user_vote(self, user_id: str, listing_id: str) -> ListingVote | None:
        votes = await self._get_items_from_secondary_index("user_id", user_id, ListingVote)
        return next((vote for vote in votes if vote.listing_id == listing_id), None)

    async def add_user_vote(self, user_id: str, listing_id: str, is_upvote: bool) -> None:
        vote = ListingVote.create(user_id=user_id, listing_id=listing_id, is_upvote=is_upvote)
        await self._add_item(vote)

    async def update_user_vote(self, vote_id: str, is_upvote: bool) -> None:
        await self._update_item(vote_id, ListingVote, {"is_upvote": is_upvote})

    async def delete_user_vote(self, vote_id: str) -> None:
        await self._delete_item(vote_id)

    async def get_user_votes(self, user_id: str, listing_ids: list[str]) -> list[ListingVote]:
        votes = await self._get_items_from_secondary_index("user_id", user_id, ListingVote)
        return [vote for vote in votes if vote.listing_id in listing_ids]
