import asyncio
import logging

from store.app.db import Crud
from store.app.model import Listing, User
from store.settings import load_settings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def update_listings_with_missing_fields(crud: Crud):
    logger.info("Starting migration of listings...")
    all_listings = await crud.dump_listings()
    updated_count = 0

    for listing in all_listings:
        updates = {}
        if listing.username is None:
            user = await crud._get_item(listing.user_id, User)
            updates["username"] = user.username if user else "Unknown"
        if listing.slug is None:
            updates["slug"] = f"listing-{listing.id}"
        if updates:
            await crud._update_item(listing.id, Listing, updates)
            updated_count += 1
            logger.info(f"Updated listing {listing.id}")

    logger.info(f"Migration completed. Updated {updated_count} listings.")


async def main():
    settings = load_settings()
    crud = Crud(settings)
    await update_listings_with_missing_fields(crud)


if __name__ == "__main__":
    asyncio.run(main())
