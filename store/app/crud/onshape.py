"""This module provides CRUD operations for Onshape documents."""

import argparse
import asyncio
import logging

from kol.onshape.api import OnshapeApi
from kol.onshape.client import OnshapeClient
from kol.onshape.converter import Converter, ConverterConfig

from store.app.crud.base import BaseCrud
from store.app.crud.listings import ListingsCrud

logger = logging.getLogger(__name__)


def get_converter() -> Converter:
    return Converter(ConverterConfig())


class OnshapeCrud(ListingsCrud, BaseCrud):
    async def document_exists(self, onshape_url: str) -> bool:
        client = OnshapeClient()
        api = OnshapeApi(client)
        document_info = client.parse_url(onshape_url)
        try:
            api.get_document(document_info.document_id)
            return True
        except Exception as e:
            logger.error("Error: %s", e)
            return False

    async def add_onshape_url_to_listing(self, listing_id: str, onshape_url: str) -> None:
        if not await self.document_exists(onshape_url):
            raise ValueError("Onshape URL is not accessible")
        await self.edit_listing(
            listing_id=listing_id,
            onshape_url=onshape_url,
        )


async def test_adhoc() -> None:
    parser = argparse.ArgumentParser(description="Onshape CRUD operations")
    parser.add_argument("onshape_url", help="The URL of the Onshape document")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)

    async with OnshapeCrud() as crud:
        document_exists = await crud.document_exists(args.onshape_url)
        logger.info("Document exists: %s", document_exists)


if __name__ == "__main__":
    # python -m store.app.crud.onshape
    asyncio.run(test_adhoc())
