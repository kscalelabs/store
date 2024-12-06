"""Runs tests on authentication and image uploading APIs."""

import time
import urllib.parse
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import status
from httpx import AsyncClient
from PIL import Image
from pytest_mock import MockFixture

from tests.test_cognito import MockAsyncClient
from www.app.db import create_tables
from www.app.model import APIKey
from www.settings import settings

COGNITO_DOMAIN = settings.oauth.cognito_domain
CLIENT_ID = settings.oauth.cognito_client_id
CLIENT_SECRET = settings.oauth.cognito_client_secret
REDIRECT_URI = settings.oauth.cognito_redirect_uri


@pytest.mark.skip(reason="WIP")
@pytest.mark.asyncio
async def test_auth_and_upload_flow(app_client: AsyncClient, tmpdir: Path, mocker: MockFixture) -> None:
    """Test the complete authentication and image upload flow."""
    await create_tables()

    # Test Cognito login endpoint
    response = await app_client.get("/auth/cognito/login")
    assert response.status_code == 200
    assert "authorization_url" in response.json()
    auth_url = response.json()["authorization_url"]
    assert CLIENT_ID in auth_url
    decoded_auth_url = urllib.parse.unquote(auth_url)
    assert REDIRECT_URI in decoded_auth_url
    assert "oauth2/authorize" in auth_url

    # Mock Cognito authentication
    mocker.patch("httpx.AsyncClient", return_value=MockAsyncClient())
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

    # Create mock user with required permissions
    mock_user = MagicMock(
        id="test_user_id",
        email="test@example.com",
        cognito_id="test_cognito_id",
        username="testuser",
        permissions={"is_admin"},  # Add necessary permissions
    )

    # Create mock API key with full permissions
    test_raw_key = "test_raw_key"
    mock_api_key = APIKey(
        id="test_api_key",
        user_id="test_user_id",
        source="cognito",
        permissions="full",
        hashed_key=APIKey.hash_key(test_raw_key),
        created_at=int(time.time()),
        expires_at=None,
        type="APIKey",
    )

    # Mock UserCrud methods
    mocker.patch("www.app.crud.users.UserCrud.get_api_key", AsyncMock(return_value=mock_api_key))
    mocker.patch("www.app.crud.users.UserCrud.get_user", AsyncMock(return_value=mock_user))
    mocker.patch("www.app.crud.users.UserCrud.get_user_from_cognito_id", AsyncMock(return_value=None))
    mocker.patch("www.app.crud.users.UserCrud.create_user_from_cognito", AsyncMock(return_value=mock_user))
    mocker.patch("www.app.crud.users.UserCrud.add_api_key", AsyncMock(return_value=(mock_api_key, test_raw_key)))

    # Mock get_current_user to ensure it returns our mock user
    mocker.patch("www.app.security.cognito.get_current_user", AsyncMock(return_value=mock_user))

    # Test Cognito callback
    response = await app_client.get(
        "/auth/cognito/callback",
        params={"code": "test_code"},
        follow_redirects=False,
    )
    assert response.status_code == status.HTTP_200_OK

    # Use API key for subsequent requests
    auth_headers = {"X-API-Key": test_raw_key}

    # Create a listing
    response = await app_client.post(
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

    # Verify the listing was created
    response = await app_client.get(f"/listings/{listing_id}")
    assert response.status_code == status.HTTP_200_OK
    listing_data = response.json()
    assert listing_data["name"] == "test listing"
    assert listing_data["description"] == "test description"
    assert listing_data["slug"] == "test-listing"

    # Upload an image
    image = Image.new("RGB", (100, 100))
    image_path = Path(tmpdir) / "test.png"
    image.save(image_path)
    response = await app_client.post(
        f"/artifacts/upload/{listing_id}",
        files={"files": ("test.png", open(image_path, "rb"), "image/png")},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["artifacts"] is not None
    artifact_name = data["artifacts"][0]["name"]

    # Get image URLs
    response = await app_client.get(
        f"/artifacts/url/image/{listing_id}/{artifact_name}",
        params={"size": "small"},
        follow_redirects=False,
    )
    assert response.status_code == status.HTTP_307_TEMPORARY_REDIRECT

    # Test logout
    response = await app_client.get("/auth/cognito/logout", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    assert "cognito_logout_url" in response.json()
