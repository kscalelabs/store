"""Pytest configuration file."""

import os
from typing import Generator

import pytest
from _pytest.python import Function
from fastapi.testclient import TestClient
from pytest_mock.plugin import MockerFixture, MockType

os.environ["ROBOLIST_ENVIRONMENT"] = "local"
os.environ["JWT_SECRET"] = "123456"


def pytest_collection_modifyitems(items: list[Function]) -> None:
    items.sort(key=lambda x: x.get_closest_marker("slow") is not None)


@pytest.fixture()
def app_client() -> Generator[TestClient, None, None]:
    from store.app.main import app

    with TestClient(app) as app_client:
        yield app_client


@pytest.fixture(autouse=True)
def mock_send_email(mocker: MockerFixture) -> MockType:
    mock = mocker.patch("store.app.api.email.send_email")
    mock.return_value = None
    return mock


@pytest.fixture()
def authenticated_user(app_client: TestClient) -> tuple[TestClient, str, str]:
    from store.app.api.email import OneTimePassPayload

    test_email = "test@example.com"

    # Logs the user in using the OTP.
    otp = OneTimePassPayload(email=test_email)
    response = app_client.post("/api/users/otp", json={"payload": otp.encode()})
    assert response.status_code == 200, response.json()

    # Gets a session token.
    response = app_client.post("/api/users/refresh")
    data = response.json()
    assert response.status_code == 200, data

    return app_client, test_email, data["token"]
