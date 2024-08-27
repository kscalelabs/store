"""Tests the flow of uploading an artifact to Onshape."""

from pathlib import Path

from fastapi import status
from httpx import AsyncClient

from store.app.db import create_tables

TEST_URL = (
    "https://cad.onshape.com/documents/4b3eeb430e3d28511ab9cba8/w/"
    "dc58c6e8cf7c1ee8bd864ee4/e/de14dfcca89a312f32f77d02"
)

BAD_URL = (
    "https://cad.onshape.com/documents/1234123412341324/w/"
    "12341234123412341324123412342134/e/1234123432123412341234124231"
)


async def test_onshape(app_client: AsyncClient, tmpdir: Path) -> None:
    await create_tables()

    # Logs the user in.
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

    # Sets the Onshape URL.
    response = await app_client.post(
        f"/onshape/set/{listing_id}",
        json={"onshape_url": TEST_URL},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK

    # Tests that a random Onshape URL fails.
    response = await app_client.post(
        f"/onshape/set/{listing_id}",
        json={"onshape_url": BAD_URL},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
