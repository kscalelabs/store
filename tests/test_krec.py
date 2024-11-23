"""Runs tests on the KRec uploading APIs."""

from pathlib import Path

import httpx
import krec
from fastapi import status
from fastapi.testclient import TestClient


async def test_krec_upload(test_client: TestClient, tmpdir: Path) -> None:
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
    robot_id = response.json()["robot_id"]

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
            "name": "test.krec",
            "description": "test_description",
            "robot_id": robot_id,
        },
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    data = response.json()
    upload_url = data["upload_url"]

    # Upload the KRec to the presigned URL.
    async with httpx.AsyncClient() as client:
        with open(my_krec_path, "rb") as f:
            krec_bytes = f.read()
        response = await client.put(
            upload_url,
            content=krec_bytes,
            headers={"Content-Type": "application/octet-stream"},
        )
    assert response.status_code == status.HTTP_200_OK, response.text
