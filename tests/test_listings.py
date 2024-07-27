"""Runs tests on the robot APIs."""

from pathlib import Path

from fastapi import status
from httpx import AsyncClient
from PIL import Image

from store.app.db import create_tables


async def test_listings(app_client: AsyncClient, tmpdir: Path) -> None:
    await create_tables()

    # Register.
    response = await app_client.get("/users/github/code/doesnt-matter")
    assert response.status_code == status.HTTP_200_OK, response.json()
    token = response.json()["api_key"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # Upload an image.
    image = Image.new("RGB", (100, 100))
    image_path = Path(tmpdir) / "test.png"
    image.save(image_path)
    response = await app_client.post(
        "/images/upload",
        headers=auth_headers,
        files={"file": ("test.png", open(image_path, "rb"), "image/png")},
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    assert response.json()["image_id"] is not None
    image_id = response.json()["image_id"]

    # Create a listing.
    response = await app_client.post(
        "/listings/add",
        json={
            "name": "test listing",
            "description": "test description",
            "artifact_ids": [image_id],
            "child_ids": [],
        },
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()

    # Searches for listings.
    response = await app_client.get(
        "/listings/search",
        params={"search_query": "test", "page": 1},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    items, has_more = response.json()
    assert len(items) == 1
    assert not has_more

    # Checks the item.
    item = items[0]
    assert item["name"] == "test listing"
    assert item["description"] == "test description"
    assert item["artifact_ids"] == [image_id]
    assert item["child_ids"] == []

    # Checks my own listings.
    response = await app_client.get(
        "/listings/me",
        params={"page": 1},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    items, has_more = response.json()
    assert len(items) == 1
    assert not has_more

    # Gets the listing by ID.
    listing_id = item["id"]
    response = await app_client.get(f"/listings/{listing_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()
    assert response.json() == item

    # Edits the listing.
    response = await app_client.post(
        f"/listings/edit/{listing_id}",
        json={"name": "edited name"},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()

    # Deletes the listing.
    response = await app_client.delete(f"/listings/delete/{listing_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()

    # Checks that no more listings are available.
    response = await app_client.get(
        "/listings/me",
        params={"page": 1},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    items, has_more = response.json()
    assert len(items) == 0
