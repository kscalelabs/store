"""Runs tests on the robot APIs."""

from pathlib import Path

from fastapi import status
from fastapi.testclient import TestClient
from PIL import Image

from www.app.model import ListingVote


def test_listings(test_client: TestClient, tmpdir: Path) -> None:
    # Signup.
    response = test_client.post("/auth/github/code", json={"code": "test_code"})
    assert response.status_code == status.HTTP_200_OK, response.json()
    token = response.json()["api_key"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # Create a listing.
    response = test_client.post(
        "/listings/add",
        data={
            "name": "test listing",
            "description": "test description",
            "child_ids": "",
            "slug": "test-listing",
            "username": "testuser",
            "stripe_link": "",
        },
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    listing_id = response.json()["listing_id"]

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
