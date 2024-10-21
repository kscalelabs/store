"""Tests the flow of uploading an artifact to Onshape."""

from pathlib import Path

import pytest
from fastapi import status
from fastapi.testclient import TestClient

TEST_URL = (
    "https://cad.onshape.com/documents/4b3eeb430e3d28511ab9cba8/w/"
    "dc58c6e8cf7c1ee8bd864ee4/e/de14dfcca89a312f32f77d02"
)

BAD_URL = (
    "https://cad.onshape.com/documents/1234123412341324/w/"
    "12341234123412341324123412342134/e/1234123432123412341234124231"
)


@pytest.mark.skip(reason="Onshape API is not mocked")
def test_onshape(test_client: TestClient, tmpdir: Path) -> None:
    # Logs the user in.
    response = test_client.post("/auth/github/code", json={"code": "test_code"})
    assert response.status_code == status.HTTP_200_OK, response.json()
    token = response.json()["api_key"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # Create a listing.
    response = test_client.post(
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
    response = test_client.post(
        f"/onshape/set/{listing_id}",
        json={"onshape_url": TEST_URL},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK

    # Tests server-sent events.
    with test_client.stream(
        "GET",
        f"/onshape/pull/{listing_id}",
        params={"token": token},
        headers=auth_headers,
    ) as response:
        assert response.status_code == status.HTTP_200_OK
        assert "text/event-stream" in response.headers["content-type"]
