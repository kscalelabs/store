"""Runs tests on the image uploading APIs."""

from pathlib import Path

from fastapi import status
from fastapi.testclient import TestClient
from PIL import Image


def test_user_auth_functions(test_client: TestClient, tmpdir: Path) -> None:
    # Get an auth token using the mocked Github endpoint.
    response = test_client.post("/auth/github/code", json={"code": "test_code"})
    assert response.status_code == status.HTTP_200_OK, response.json()
    token = response.json()["api_key"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # Create a listing.
    response = test_client.post(
        "/listings/add",
        json={"name": "test listing", "description": "test description", "child_ids": [], "slug": "test-listing"},
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
    assert data["artifacts"] is not None
    listing_id = data["artifacts"][0]["listing_id"]
    name = data["artifacts"][0]["name"]

    # Gets the URLs for various sizes of images.
    response = test_client.get(
        f"/artifacts/url/image/{listing_id}/{name}",
        params={"size": "small"},
        follow_redirects=False,
    )
    assert response.status_code == status.HTTP_307_TEMPORARY_REDIRECT, response.json()
