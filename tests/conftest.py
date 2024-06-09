"""Pytest configuration file."""

import os
from typing import Generator

import fakeredis
import pytest
from _pytest.python import Function
from fastapi.testclient import TestClient
from moto.dynamodb import mock_dynamodb
from moto.server import ThreadedMotoServer
from pytest_mock.plugin import MockerFixture, MockType

os.environ["ROBOLIST_ENVIRONMENT"] = "local"


def pytest_collection_modifyitems(items: list[Function]) -> None:
    items.sort(key=lambda x: x.get_closest_marker("slow") is not None)


@pytest.fixture(autouse=True)
def mock_aws() -> Generator[None, None, None]:
    server: ThreadedMotoServer | None = None

    try:
        env_vars: dict[str, str] = {}
        for k in (
            "AWS_ACCESS_KEY_ID",
            "AWS_SECRET_ACCESS_KEY",
            "AWS_ENDPOINT_URL_DYNAMODB",
            "AWS_REGION",
            "AWS_DEFAULT_REGION",
        ):
            if k in os.environ:
                env_vars[k] = os.environ[k]
                del os.environ[k]

        os.environ["AWS_SECRET_ACCESS_KEY"] = "test"
        os.environ["AWS_ACCESS_KEY_ID"] = "test"
        os.environ["AWS_DEFAULT_REGION"] = os.environ["AWS_REGION"] = "us-east-1"

        # Starts a local AWS server.
        server = ThreadedMotoServer(port=0)
        server.start()
        port = server._server.socket.getsockname()[1]
        os.environ["AWS_ENDPOINT_URL_DYNAMODB"] = f"http://127.0.0.1:{port}"

        with mock_dynamodb():
            yield

    finally:
        if server is not None:
            server.stop()

        for k, v in env_vars.items():
            if v is None:
                os.unsetenv(k)
            else:
                os.environ[k] = v


@pytest.fixture(autouse=True)
def mock_redis(mocker: MockerFixture) -> None:
    os.environ["ROBOLIST_REDIS_HOST"] = "localhost"
    os.environ["ROBOLIST_REDIS_PASSWORD"] = ""
    os.environ["ROBOLIST_REDIS_PORT"] = "6379"
    os.environ["ROBOLIST_REDIS_DB"] = "0"
    fake_redis = fakeredis.aioredis.FakeRedis()
    mocker.patch("store.app.api.crud.base.Redis", return_value=fake_redis)


@pytest.fixture()
def app_client() -> Generator[TestClient, None, None]:
    from store.app.main import app

    with TestClient(app) as app_client:
        yield app_client


@pytest.fixture(autouse=True)
def mock_send_email(mocker: MockerFixture) -> MockType:
    mock = mocker.patch("store.app.api.utils.email.send_email")
    mock.return_value = None
    return mock


@pytest.fixture()
def authenticated_user(app_client: TestClient) -> tuple[TestClient, str, str]:
    from store.app.api.utils.email import OneTimePassPayload

    test_email = "test@example.com"

    # Logs the user in using the OTP.
    otp = OneTimePassPayload(email=test_email, lifetime=3600)
    response = app_client.post("/users/otp", json={"payload": otp.encode()})
    assert response.status_code == 200, response.json()

    # Gets a session token.
    response = app_client.post("/users/refresh")
    data = response.json()
    assert response.status_code == 200, data

    return app_client, test_email, data["token"]
