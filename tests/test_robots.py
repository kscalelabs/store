"""Runs tests on the robot APIs."""

import asyncio

from fastapi.testclient import TestClient
from pytest_mock.plugin import MockType

from store.app.db import create_tables

def test_robots(app_client: TestClient) -> None:
    asyncio.run(create_tables())

    test_username = "test"
    test_email = "test@example.com"
    test_password = "test password"

    # Register.
    response = app_client.post("/users/register", json={"username": test_username, "email": test_email, "password": test_password})
    assert response.status_code == 200

    # Log in.
    response = app_client.post("/users/login", json={"email": test_email, "password": test_password})
    assert response.status_code == 200
    assert "session_token" in response.cookies

    # Create a part.
    response = app_client.post("/parts/add", json={"part_id": "", "owner": "", "name": "test part", "description": "test description", "images": [{"url": "", "caption": ""}]})

    # Create a robot.
    response = app_client.post("/robots/add", json={"robot_id": "", "owner": "", "name": "test robot", "description": "test description", "bom": [], "images": [{"url": "", "caption": ""}]})
