"""Runs tests on the image uploading APIs."""

from pathlib import Path

from fastapi import status
from httpx import AsyncClient
from PIL import Image

from store.app.db import create_tables


async def test_user_auth_functions(app_client: AsyncClient, tmpdir: Path) -> None:
    await create_tables()

    # Get an auth token using the mocked Github endpoint.
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

    # Gets the URLs for various sizes of images.
    response = await app_client.get(f"/images/{image_id}/large")
    assert response.status_code == status.HTTP_307_TEMPORARY_REDIRECT, response.json()
