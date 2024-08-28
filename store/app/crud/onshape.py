"""This module provides CRUD operations for Onshape documents."""

import argparse
import asyncio
import io
import logging
import tempfile
import traceback

from fastapi import WebSocket
from kol.onshape.api import OnshapeApi
from kol.onshape.client import OnshapeClient
from kol.onshape.config import ConverterConfig
from kol.onshape.download import download
from kol.onshape.postprocess import postprocess
from PIL import Image

from store.app.crud.base import BaseCrud
from store.app.crud.listings import ListingsCrud
from store.app.model import Artifact, Listing

logger = logging.getLogger(__name__)


class RedirectToWebsocketHandler(logging.Handler):
    def __init__(self, queue: asyncio.Queue[str]) -> None:
        super().__init__()

        self.queue = queue

    def emit(self, record: logging.LogRecord) -> None:
        self.queue.put_nowait(self.format(record))


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

        # Creates a worker to send logs to the websocket.
        queue: asyncio.Queue[str] = asyncio.Queue()

        async def send_logs() -> None:
            while True:
                message = await queue.get()
                if websocket is not None:
                    await websocket.send_text(message)
                queue.task_done()

        asyncio.create_task(send_logs())

        # Custom logger to redirect "kol.*" logs to the websocket, if provided.
        if websocket is not None:
            kol_logger = logging.getLogger("kol")
            kol_logger.addHandler(RedirectToWebsocketHandler(queue))
            kol_logger.setLevel(logging.INFO)

        async def maybe_send_message(message: str) -> None:
            if websocket is not None:
                try:
                    await websocket.send_text(message)
                except Exception:
                    pass

        with tempfile.TemporaryDirectory() as temp_dir:
            # Downloads the document and postprocesses it.
            try:
                document_info = await download(onshape_url, temp_dir, config=config)
                postprocess_info = await postprocess(document_info.urdf_info.urdf_path, config=config)
                tar_path = postprocess_info.tar_path

            except Exception as e:
                full_msg = "".join(traceback.format_exception(type(e), e, e.__traceback__))
                await maybe_send_message(full_msg)
                raise e

            # Reads the file into a buffer.
            buffer = io.BytesIO()
            with open(tar_path, "rb") as f:
                buffer.write(f.read())
            buffer.seek(0)

            new_artifact = await self._upload_and_store(
                name=tar_path.name,
                file=buffer,
                listing=listing,
                artifact_type="tgz",
                description=f"Generated from {onshape_url}",
            )
            await maybe_send_message(f"Artifact uploaded: {new_artifact.id}")

            # Downloads the thumbnail and adds it to the listing.
            api = OnshapeApi(OnshapeClient())
            document = api.parse_url(onshape_url)
            out_file = io.BytesIO()
            await api.download_thumbnail(out_file, document)
            out_file.seek(0)
            image = Image.open(out_file)
            image_artifact = await self._upload_image("thumbnail.png", image, listing)
            await maybe_send_message(f"Thumbnail uploaded: {image_artifact.id}")

            return new_artifact


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
