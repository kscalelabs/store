"""Unit tests for Cognito authentication integration."""

import urllib.parse
from types import TracebackType
from typing import Self
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import status
from httpx import AsyncClient
from pytest_mock import MockFixture

from www.app.db import create_tables
from www.settings import settings

COGNITO_DOMAIN = settings.oauth.cognito_domain
CLIENT_ID = settings.oauth.cognito_client_id
CLIENT_SECRET = settings.oauth.cognito_client_secret
REDIRECT_URI = settings.oauth.cognito_redirect_uri


class MockAsyncClient:
    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        pass

    async def post(self, *_: tuple[()], **__: dict[str, str]) -> MagicMock:
        return MagicMock(
            status_code=200,
            json=lambda: {"access_token": "test_access_token", "id_token": "test_id_token", "token_type": "Bearer"},
        )


@pytest.mark.asyncio
async def test_cognito_callback(app_client: AsyncClient, mocker: MockFixture) -> None:
    await create_tables()

    mocker.patch("www.app.crud.users.UserCrud.get_user_from_cognito_id", AsyncMock(return_value=None))

    mock_user = MagicMock(
        id="test_user_id",
        email="test@example.com",
        cognito_id="test_cognito_id",
    )
    mocker.patch("www.app.crud.users.UserCrud.create_user_from_cognito", AsyncMock(return_value=mock_user))

    mock_api_key = MagicMock(id="test_api_key", user_id="test_user_id", source="cognito", permissions="full")
    mocker.patch("www.app.crud.users.UserCrud.add_api_key", AsyncMock(return_value=(mock_api_key, "test_raw_key")))

    mocker.patch(
        "www.app.routers.auth.cognito.verify_cognito_token",
        AsyncMock(
            return_value={
                "sub": "test_cognito_id",
                "email": "test@example.com",
                "given_name": "Test",
                "family_name": "User",
            }
        ),
    )

    mocker.patch("httpx.AsyncClient", return_value=MockAsyncClient())

    response = await app_client.get(
        "/auth/cognito/callback",
        params={
            "code": "test_code",
        },
        follow_redirects=False,
    )

    assert response.status_code == status.HTTP_200_OK


@pytest.mark.asyncio
async def test_cognito_login(app_client: AsyncClient) -> None:
    response = await app_client.get("/auth/cognito/login")
    assert response.status_code == 200
    assert "authorization_url" in response.json()
    auth_url = response.json()["authorization_url"]
    assert CLIENT_ID in auth_url
    decoded_auth_url = urllib.parse.unquote(auth_url)
    assert REDIRECT_URI in decoded_auth_url
    assert "oauth2/authorize" in auth_url
