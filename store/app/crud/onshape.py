"""This module provides CRUD operations for Onshape documents."""

import argparse
import asyncio
import io
import logging
import tempfile

from fastapi import WebSocket
from kol.onshape.api import OnshapeApi
from kol.onshape.client import OnshapeClient
from kol.onshape.config import ConverterConfig
from kol.onshape.download import download
from kol.onshape.postprocess import postprocess

from store.app.crud.base import BaseCrud
from store.app.crud.listings import ListingsCrud
from store.app.model import Artifact, Listing

logger = logging.getLogger(__name__)


class RedirectToWebsocketHandler(logging.Handler):
    def __init__(self, websocket: WebSocket) -> None:
        super().__init__()

        self.websocket = websocket

    def emit(self, record: logging.LogRecord) -> None:
        try:
            asyncio.create_task(self.websocket.send_text(self.format(record)))
        except Exception:
            pass


class OnshapeCrud(ListingsCrud, BaseCrud):
    async def onshape_document_exists(self, onshape_url: str) -> bool:
        client = OnshapeClient()
        api = OnshapeApi(client)
        document_info = client.parse_url(onshape_url)
        try:
            await api.get_assembly(document_info)
            return True
        except Exception as e:
            logger.error("Error: %s", e)
            return False

    async def add_onshape_url_to_listing(self, listing_id: str, onshape_url: str | None) -> None:
        if onshape_url is None:
            await self.remove_onshape_url(listing_id)
        else:
            if not await self.onshape_document_exists(onshape_url):
                raise ValueError("Onshape URL is not accessible")
            await self.edit_listing(
                listing_id=listing_id,
                onshape_url=onshape_url,
            )

    async def download_onshape_document(
        self,
        listing: Listing,
        onshape_url: str,
        *,
        config: ConverterConfig | None = None,
        websocket: WebSocket | None = None,
    ) -> Artifact:
        if config is None:
            config = ConverterConfig()

        # Custom logger to redirect "kol.*" logs to the websocket, if provided.
        if websocket is not None:
            kol_logger = logging.getLogger("kol")
            kol_logger.addHandler(RedirectToWebsocketHandler(websocket))

        with tempfile.TemporaryDirectory() as temp_dir:
            document_info = await download(onshape_url, temp_dir, config=config)
            postprocess_info = await postprocess(document_info.urdf_info.urdf_path, config=config)
            tar_path = postprocess_info.tar_path

            # Reads the file into a buffer.
            buffer = io.BytesIO()
            with open(tar_path, "rb") as f:
                buffer.write(f.read())
            buffer.seek(0)

            return await self._upload_and_store(
                name=tar_path.name,
                file=buffer,
                listing=listing,
                artifact_type="tgz",
                description=f"Generated from {onshape_url}",
            )


async def test_adhoc() -> None:
    parser = argparse.ArgumentParser(description="Onshape CRUD operations")
    parser.add_argument("onshape_url", help="The URL of the Onshape document")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)

    async with OnshapeCrud() as crud:
        document_exists = await crud.onshape_document_exists(args.onshape_url)
        logger.info("Document exists: %s", document_exists)


if __name__ == "__main__":
    # python -m store.app.crud.onshape
    asyncio.run(test_adhoc())
