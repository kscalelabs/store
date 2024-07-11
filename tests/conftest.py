"""Pytest configuration file."""

import os
from typing import Generator

import fakeredis
import pytest
from _pytest.python import Function
from httpx import ASGITransport, AsyncClient
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
    fake_redis = fakeredis.aioredis.FakeRedis()
    mocker.patch("store.app.crud.users.Redis", return_value=fake_redis)


@pytest.fixture()
async def app_client() -> AsyncClient:
    from store.app.main import app
    transport = ASGITransport(app)

    async with AsyncClient(transport=transport, base_url="http://test") as app_client:
        yield app_client


@pytest.fixture(autouse=True)
def mock_send_email(mocker: MockerFixture) -> MockType:
    mock = mocker.patch("store.app.utils.email.send_email")
    mock.return_value = None
    return mock
