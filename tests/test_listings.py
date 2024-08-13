"""Runs tests on the robot APIs."""

import json
from pathlib import Path

from fastapi import status
from httpx import AsyncClient
from PIL import Image

from store.app.db import create_tables


async def test_listings(app_client: AsyncClient, tmpdir: Path) -> None:
    await create_tables()

    # Signup.
    response = await app_client.post("/users/github/code", json={"code": "test_code"})
    assert response.status_code == status.HTTP_200_OK, response.json()
    token = response.json()["api_key"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # Create a listing.
    response = await app_client.post(
        "/listings/add",
        json={
            "name": "test listing",
            "description": "test description",
            "child_ids": [],
        },
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    listing_id = response.json()["listing_id"]

    # Upload an image.
    image = Image.new("RGB", (100, 100))
    image_path = Path(tmpdir) / "test.png"
    image.save(image_path)
    data_json = json.dumps({"artifact_type": "image", "listing_id": listing_id})
    response = await app_client.post(
        "/artifacts/upload",
        headers=auth_headers,
        files={"file": ("test.png", open(image_path, "rb"), "image/png"), "metadata": (None, data_json)},
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["artifact"]["artifact_id"] is not None

    # Uploads a URDF.
    urdf_path = Path(__file__).parent / "assets" / "sample.urdf"
    data_json = json.dumps({"artifact_type": "urdf", "listing_id": listing_id})
    response = await app_client.post(
        "/artifacts/upload",
        headers=auth_headers,
        files={"file": ("box.urdf", open(urdf_path, "rb"), "application/xml"), "metadata": (None, data_json)},
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["artifact"]["artifact_id"] is not None

    # Gets the URDF URL.
    artifact_id = data["artifact"]["artifact_id"]
    response = await app_client.get(f"/artifacts/url/urdf/{artifact_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_307_TEMPORARY_REDIRECT, response.content

    # Uploads an STL.
    stl_path = Path(__file__).parent / "assets" / "teapot.stl"
    data_json = json.dumps({"artifact_type": "stl", "listing_id": listing_id})
    response = await app_client.post(
        "/artifacts/upload",
        headers=auth_headers,
        files={"file": ("teapot.stl", open(stl_path, "rb"), "application/octet-stream"), "metadata": (None, data_json)},
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["artifact"]["artifact_id"] is not None

    # Searches for listings.
    response = await app_client.get(
        "/listings/search",
        params={"search_query": "test", "page": 1},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    items, has_next = data["listing_ids"], data["has_next"]
    assert len(items) == 1
    assert not has_next
    listing_ids = data["listing_ids"]
    assert listing_ids == [listing_id]

    # Checks my own listings.
    response = await app_client.get(
        "/listings/me",
        params={"page": 1},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    items, has_next = data["listing_ids"], data["has_next"]
    assert len(items) == 1
    assert not has_next

    # Gets the listing by ID.
    listing_id = listing_ids[0]
    response = await app_client.get(f"/listings/{listing_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()

    # Edits the listing.
    response = await app_client.put(
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
    data = response.json()
    items, has_next = data["listing_ids"], data["has_next"]
    assert len(items) == 0
    assert not has_next
