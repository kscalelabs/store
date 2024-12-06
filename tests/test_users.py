"""Runs tests on the user APIs."""

import time
from typing import Self
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import status
from httpx import AsyncClient
from pytest_mock import MockFixture

from www.app.db import create_tables
from www.app.routers.users import UpdateUserRequest


@pytest.mark.asyncio
async def test_user_profile_flow(app_client: AsyncClient, mocker: MockFixture) -> None:
    """Test user profile operations including access and updates."""
    await create_tables()

    # Create mock user with all fields
    current_time = int(time.time())
    mock_user = MagicMock(
        id="test_user_id",
        email="test@example.com",
        cognito_id="test_cognito_id",
        username="testuser",
        first_name="Test",
        last_name="User",
        name="Test User",
        bio="Test bio",
        permissions=None,
        created_at=current_time,
        updated_at=current_time,
        stripe_connect=None,
    )

    # Configure mock to return proper values instead of MagicMock objects
    mock_user.model_dump = lambda: {
        "id": "test_user_id",
        "email": "test@example.com",
        "username": "testuser",
        "first_name": "Test",
        "last_name": "User",
        "name": "Test User",
        "bio": "Test bio",
        "permissions": None,
        "created_at": current_time,
        "updated_at": current_time,
        "stripe_connect": None,
    }

    # Create mock API key
    test_raw_key = "test_raw_key"
    mock_api_key = MagicMock(id="test_api_key", user_id="test_user_id", source="cognito", permissions="full")

    # Set up CRUD mocks
    mocker.patch("www.app.crud.users.UserCrud.get_user_from_cognito_id", AsyncMock(return_value=None))
    mocker.patch("www.app.crud.users.UserCrud.create_user_from_cognito", AsyncMock(return_value=mock_user))
    mocker.patch("www.app.crud.users.UserCrud.add_api_key", AsyncMock(return_value=(mock_api_key, test_raw_key)))
    mocker.patch("www.app.crud.users.UserCrud.get_api_key", AsyncMock(return_value=mock_api_key))
    mocker.patch("www.app.crud.users.UserCrud.get_user", AsyncMock(return_value=mock_user))
    mocker.patch("www.app.crud.users.UserCrud.update_user", AsyncMock(return_value=mock_user))

    # Mock Cognito authentication
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

    # Mock the httpx client
    class MockAsyncClient:
        async def __aenter__(self) -> Self:
            return self

        async def __aexit__(self, *_: tuple[()]) -> None:
            pass

        async def post(self, *_: tuple[()], **__: dict[str, str]) -> MagicMock:
            return MagicMock(
                status_code=200,
                json=lambda: {"access_token": "test_access_token", "id_token": "test_id_token", "token_type": "Bearer"},
            )

    mocker.patch("httpx.AsyncClient", return_value=MockAsyncClient())

    # Test Cognito callback (login)
    response = await app_client.get(
        "/auth/cognito/callback",
        params={"code": "test_code"},
        follow_redirects=False,
    )
    assert response.status_code == status.HTTP_200_OK

    # Get API key from response
    api_key = response.json()["api_key"]
    auth_headers = {"X-API-Key": api_key}

    # Test profile update
    update_data = UpdateUserRequest(
        email="test@example.com",
        first_name="UpdatedFirst",
        last_name="UpdatedLast",
        name="Updated Name",
        bio="Updated bio",
    ).model_dump()

    response = await app_client.put("/users/me", headers=auth_headers, json=update_data)
    assert response.status_code == status.HTTP_200_OK
