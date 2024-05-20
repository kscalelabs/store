"""Pytest configuration file."""

import os
from typing import Generator

import pytest
from _pytest.python import Function
from fastapi.testclient import TestClient

os.environ["ENVIRONMENT"] = "test"


def pytest_collection_modifyitems(items: list[Function]) -> None:
    items.sort(key=lambda x: x.get_closest_marker("slow") is not None)


@pytest.fixture()
def app_client() -> Generator[TestClient, None, None]:
    from store.app.main import app

    with TestClient(app) as app_client:
        yield app_client
