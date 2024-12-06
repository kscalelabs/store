"""Runs tests on the KRec uploading APIs."""

import time
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import httpx
import krec
import pytest
from fastapi import status
from fastapi.testclient import TestClient
from pytest_mock import MockFixture

from tests.test_cognito import MockAsyncClient
from www.app.db import create_tables


@pytest.mark.asyncio
async def test_krec_upload(test_client: TestClient, tmpdir: Path, mocker: MockFixture) -> None:
    """Test KRec upload functionality."""
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

    # Configure mock to return proper values
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
    mocker.patch("www.app.security.cognito.get_current_user", AsyncMock(return_value=mock_user))

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

    # Mock the httpx client with put method
    class MockKRecAsyncClient(MockAsyncClient):
        async def put(self, *_: tuple[()], **__: dict[str, str]) -> MagicMock:
            return MagicMock(
                status_code=status.HTTP_403_FORBIDDEN,
            )

    mocker.patch("httpx.AsyncClient", return_value=MockKRecAsyncClient())

    # Test Cognito callback (login)
    response = test_client.get(
        "/auth/cognito/callback",
        params={"code": "test_code"},
        follow_redirects=False,
    )
    assert response.status_code == status.HTTP_200_OK

    # Get API key from response
    api_key = response.json()["api_key"]
    auth_headers = {"X-API-Key": api_key}

    # Create a listing
    response = test_client.post(
        "/listings/add",
        data={
            "name": "test listing",
            "description": "test description",
            "child_ids": "",
            "slug": "test-listing",
            "username": "testuser",
        },
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    listing_id = response.json()["listing_id"]

    # Create a robot from the listing
    response = test_client.post(
        "/robots/create",
        json={
            "listing_id": listing_id,
            "name": "test_robot",
            "description": "test_description",
        },
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    robot_id = response.json()["robot_id"]

    # Upload a KRec
    my_header = krec.KRecHeader(
        uuid="test_uuid",
        task="test_task",
        robot_platform="test_robot_platform",
        robot_serial="test_robot_serial",
        start_timestamp=1234567890,
        end_timestamp=1234567890,
    )
    my_krec = krec.KRec(my_header)
    my_krec_path = str(tmpdir / "test.krec")
    my_krec.save(my_krec_path)

    # Upload the KRec
    response = test_client.post(
        "/krecs/upload",
        json={
            "name": "test.krec",
            "description": "test_description",
            "robot_id": robot_id,
        },
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    upload_url = data["upload_url"]

    # Upload the KRec to the presigned URL
    async with httpx.AsyncClient() as client:
        with open(my_krec_path, "rb") as f:
            krec_bytes = f.read()
        response = await client.put(
            upload_url,
            content=krec_bytes,
            headers={"Content-Type": "application/octet-stream"},
        )
    assert response.status_code == status.HTTP_403_FORBIDDEN
