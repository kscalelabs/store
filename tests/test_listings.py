"""Runs tests on the robot APIs."""

import json
import tarfile
import tempfile
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
    data_json = json.dumps({"listing_id": listing_id})
    response = await app_client.post(
        "/artifacts/upload",
        headers=auth_headers,
        files={"files": ("test.png", open(image_path, "rb"), "image/png"), "metadata": (None, data_json)},
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["artifacts"][0]["artifact_id"] is not None

    # Uploads a URDF.
    urdf_path = Path(__file__).parent / "assets" / "sample.urdf"
    data_json = json.dumps({"listing_id": listing_id})
    response = await app_client.post(
        "/artifacts/upload",
        headers=auth_headers,
        files={"files": ("box.urdf", open(urdf_path, "rb"), "application/xml"), "metadata": (None, data_json)},
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["artifacts"][0]["artifact_id"] is not None

    # Gets the URDF URL.
    listing_id = data["artifacts"][0]["listing_id"]
    name = data["artifacts"][0]["name"]
    response = await app_client.get(f"/artifacts/url/urdf/{listing_id}/{name}", headers=auth_headers)
    assert response.status_code == status.HTTP_307_TEMPORARY_REDIRECT, response.content

    # Uploads an STL.
    stl_path = Path(__file__).parent / "assets" / "teapot.stl"
    data_json = json.dumps({"listing_id": listing_id})
    response = await app_client.post(
        "/artifacts/upload",
        headers=auth_headers,
        files={
            "files": ("teapot.stl", open(stl_path, "rb"), "application/octet-stream"),
            "metadata": (None, data_json),
        },
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["artifacts"][0]["artifact_id"] is not None

    # Uploads a combined URDF + STL.
    with tempfile.NamedTemporaryFile(suffix=".tgz") as f:
        with tarfile.open(f.name, "w:gz") as tar:
            tar.add(urdf_path, arcname="box.urdf")
            tar.add(stl_path, arcname="teapot.stl")
        f.seek(0)
        response = await app_client.post(
            f"/urdf/upload/{listing_id}",
            headers=auth_headers,
            files={"file": (f.name, open(f.name, "rb"), "application/gzip")},
        )
        assert response.status_code == status.HTTP_200_OK, response.json()
        data = response.json()
        assert data["urdf"]["artifact_id"] is not None

    # Ensures that trying to upload the same STL again fails.
    response = await app_client.post(
        "/artifacts/upload",
        headers=auth_headers,
        files={
            "files": ("teapot.stl", open(stl_path, "rb"), "application/octet-stream"),
            "metadata": (None, data_json),
        },
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["artifacts"][0]["is_new"] is False

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
