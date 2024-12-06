"""Runs tests on the robot APIs."""

import time
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from httpx import AsyncClient
from PIL import Image
from pytest_mock import MockFixture

from tests.test_cognito import MockAsyncClient
from www.app.db import create_tables
from www.app.model import ListingVote


@pytest.mark.skip(reason="WIP")
@pytest.mark.asyncio
async def test_listings(app_client: AsyncClient, test_client: TestClient, tmpdir: Path, mocker: MockFixture) -> None:
    """Test listing operations including creation, updates, and voting."""
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

    # Mock the httpx client
    class MockListingsAsyncClient(MockAsyncClient):
        async def post(self, *_: tuple[()], **__: dict[str, str]) -> MagicMock:
            return MagicMock(
                status_code=200,
                json=lambda: {"access_token": "test_access_token", "id_token": "test_id_token", "token_type": "Bearer"},
            )

    mocker.patch("httpx.AsyncClient", return_value=MockListingsAsyncClient())

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
    listing_id = response.json()["id"]  # Get listing ID from response

    # Upload an image.
    image = Image.new("RGB", (100, 100))
    image_path = Path(tmpdir) / "test.png"
    image.save(image_path)
    response = test_client.post(
        f"/artifacts/upload/{listing_id}",
        files={"files": ("test.png", open(image_path, "rb"), "image/png")},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["artifacts"][0]["artifact_id"] is not None

    # Uploads a URDF.
    urdf_path = Path(__file__).parent / "assets" / "sample.urdf"
    response = test_client.post(
        f"/artifacts/upload/{listing_id}",
        files={"files": ("sample.urdf", open(urdf_path, "rb"), "application/xml")},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["artifacts"][0]["artifact_id"] is not None

    # Gets the URDF URL.
    listing_id = data["artifacts"][0]["listing_id"]
    name = data["artifacts"][0]["name"]
    response = test_client.get(
        f"/artifacts/url/urdf/{listing_id}/{name}",
        headers=auth_headers,
        follow_redirects=False,
    )
    assert response.status_code == status.HTTP_307_TEMPORARY_REDIRECT, response.content

    # Uploads an STL.
    stl_path = Path(__file__).parent / "assets" / "teapot.stl"
    response = test_client.post(
        f"/artifacts/upload/{listing_id}",
        headers=auth_headers,
        files={
            "files": ("teapot.stl", open(stl_path, "rb"), "application/octet-stream"),
        },
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["artifacts"][0]["artifact_id"] is not None

    # List user listings
    response = test_client.get("/users/public/me", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()
    id = response.json()["id"]

    response = test_client.get(f"/listings/user/{id}", headers=auth_headers, params={"page": 1})
    assert response.status_code == status.HTTP_200_OK, response.json()
    items = response.json()["listings"]
    assert (num_listings := len(items)) >= 1

    # Checks my own listings.
    response = test_client.get(
        "/listings/me",
        params={"page": 1},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    items, has_next = data["listings"], data["has_next"]
    assert (num_listings := len(items)) >= 1

    # Uploads a zipfile.
    archive_path = Path(__file__).parent / "assets" / "compressed.zip"
    response = test_client.post(
        f"/artifacts/upload/{listing_id}",
        headers=auth_headers,
        files={"files": ("compressed.zip", open(archive_path, "rb"), "application/zip")},
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["artifacts"][0]["artifact_id"] is not None

    # Uploads a tgz file.
    archive_path = Path(__file__).parent / "assets" / "compressed.tgz"
    response = test_client.post(
        f"/artifacts/upload/{listing_id}",
        headers=auth_headers,
        files={"files": ("compressed.tgz", open(archive_path, "rb"), "application/gzip")},
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["artifacts"][0]["artifact_id"] is not None

    # Searches for listings.
    response = test_client.get(
        "/listings/search",
        params={"search_query": "test", "page": 1},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    items, has_next = data["listings"], data["has_next"]
    assert len(items) == num_listings
    listings = data["listings"]
    assert listing_id in [listing["id"] for listing in listings]

    # Gets the listing by ID.
    listing_id = listings[0]["id"]
    response = test_client.get(f"/listings/{listing_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()

    # Verify the listing was created with the correct details
    listing_data = response.json()
    assert listing_data["name"] == "test listing"
    assert listing_data["description"] == "test description"
    assert listing_data["slug"] == "test-listing"

    # Edits the listing.
    response = test_client.put(
        f"/listings/edit/{listing_id}",
        json={"name": "edited name"},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()

    # Test upvoting and downvoting
    response = test_client.post(f"/listings/{listing_id}/vote?upvote=true", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()

    # Check that the vote was recorded
    response = test_client.get(f"/listings/{listing_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["score"] == 1
    assert data["user_vote"]

    # Test changing vote to downvote
    response = test_client.post(f"/listings/{listing_id}/vote?upvote=false", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()

    # Check that the vote was changed
    response = test_client.get(f"/listings/{listing_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["score"] == -1
    assert not data["user_vote"]

    # Test removing vote
    response = test_client.delete(f"/listings/{listing_id}/vote", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()

    # Check that the vote was removed
    response = test_client.get(f"/listings/{listing_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["score"] == 0
    assert data["user_vote"] is None

    # Test upvoting again
    response = test_client.post(f"/listings/{listing_id}/vote?upvote=true", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()

    # Check that the vote was recorded
    response = test_client.get(f"/listings/{listing_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["score"] == 1
    assert data["user_vote"]

    # Test removing vote by voting the same way again
    response = test_client.delete(f"/listings/{listing_id}/vote", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()

    # Check that the vote was removed
    response = test_client.get(f"/listings/{listing_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["score"] == 0
    assert data["user_vote"] is None

    # Test deleting the listing
    response = test_client.delete(f"/listings/delete/{listing_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()

    # Checks that no more listings are available.
    response = test_client.get(
        "/listings/me",
        params={"page": 1},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    items, has_next = data["listings"], data["has_next"]
    assert len(items) == num_listings - 1
    assert not has_next


# Add a new test function for the ListingVote model
def test_listing_vote_model() -> None:
    # Test creating a ListingVote
    vote = ListingVote.create(user_id="user123", listing_id="listing456", is_upvote=True)
    assert vote.user_id == "user123"
    assert vote.listing_id == "listing456"
    assert vote.is_upvote

    # Test ListingVote serialization
    vote_dict = vote.model_dump()
    assert "id" in vote_dict
    assert vote_dict["user_id"] == "user123"
    assert vote_dict["listing_id"] == "listing456"
    assert vote_dict["is_upvote"]

    # Test ListingVote deserialization
    new_vote = ListingVote(**vote_dict)
    assert new_vote.id == vote.id
    assert new_vote.user_id == vote.user_id
    assert new_vote.listing_id == vote.listing_id
    assert new_vote.is_upvote == vote.is_upvote
