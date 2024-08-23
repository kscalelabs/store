"""This module provides CRUD operations for Onshape documents."""

import asyncio

from kol.onshape.converter import Converter, ConverterConfig

from store.app.crud.base import BaseCrud


def get_converter() -> Converter:
    return Converter(ConverterConfig())


class OnshapeCrud(BaseCrud):
    async def verify_onshape_permissions(self, document_id: str) -> bool:
        """Verifies that the user has permission to access the Onshape document.

        Args:
            document_id: The ID of the Onshape document.

        Returns:
            True if the user has permission to access the document, False otherwise.
        """
        raise NotADirectoryError


async def test_adhoc() -> None:
    async with OnshapeCrud() as crud:
        pass


if __name__ == "__main__":
    asyncio.run(test_adhoc())
