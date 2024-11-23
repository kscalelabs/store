"""Runs tests on the KRec uploading APIs."""

from pathlib import Path

import krec
from fastapi import status
from fastapi.testclient import TestClient


def test_krec_upload(test_client: TestClient, tmpdir: Path) -> None:
    # Get an auth token using the mocked Github endpoint.
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

    # Verify the listing was created.
    response = test_client.get(f"/listings/{listing_id}")
    assert response.status_code == status.HTTP_200_OK, response.json()
    listing_data = response.json()
    assert listing_data["name"] == "test listing"
    assert listing_data["description"] == "test description"
    assert listing_data["slug"] == "test-listing"

    # Create a robot from the listing.
    response = test_client.post(
        "/robots/create",
        data={
            "listing_id": listing_id,
            "name": "test_robot",
            "description": "test_description",
        },
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    robot_id = response.json()["id"]

    # Upload a KRec.
    my_header = krec.KRecHeader(
        uuid="test_uuid",
        task="test_task",
        robot_platform="test_robot_platform",
        robot_serial="test_robot_serial",
        start_timestamp=1234567890,
        end_timestamp=1234567890,
    )
    my_krec = krec.KRec(my_header)
    my_krec_path = str(tmpdir / "test.krec")
    my_krec.save(my_krec_path)

    # Upload the KRec.
    response = test_client.post(
        "/krecs/upload",
        data={
            "name": "test_krec",
            "description": "test_description",
            "robot_id": robot_id,
        },
        files={"files": ("test.krec", open(my_krec_path, "rb"), "application/octet-stream")},
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    assert data["krec_id"] is not None
    assert data["upload_url"] is not None
    assert data["expires_at"] is not None
