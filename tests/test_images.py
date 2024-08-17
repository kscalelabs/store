"""Runs tests on the image uploading APIs."""

import json
from pathlib import Path

from fastapi import status
from httpx import AsyncClient
from PIL import Image

from store.app.db import create_tables


async def test_user_auth_functions(app_client: AsyncClient, tmpdir: Path) -> None:
    await create_tables()

    # Get an auth token using the mocked Github endpoint.
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
        files={"files": ("test.png", open(image_path, "rb"), "image/png"), "metadata": (None, data_json)},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["artifacts"] is not None
    image_id = data["artifacts"][0]["artifact_id"]

    # Gets the URLs for various sizes of images.
    response = await app_client.get(f"/artifacts/url/image/{image_id}", params={"size": "small"})
    assert response.status_code == status.HTTP_307_TEMPORARY_REDIRECT, response.json()
