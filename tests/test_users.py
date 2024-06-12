"""Runs tests on the user APIs."""

import asyncio

from fastapi.testclient import TestClient
from pytest_mock.plugin import MockType

from store.app.db import create_tables


def test_user_auth_functions(app_client: TestClient, mock_send_email: MockType) -> None:
    asyncio.run(create_tables())

    test_username = "test"
    test_email = "test@example.com"
    test_password = "test password"

    # Register.
    response = app_client.post("/users/register", json={"username": test_username, "email": test_email, "password": test_password})
    assert response.status_code == 200
    assert mock_send_email.call_count == 1

    # Checks that without the session token we get a 401 response.
    response = app_client.get("/users/me")
    assert response.status_code == 401, response.json()
    assert response.json()["detail"] == "Not authenticated"

    # Checks that we can't log the user out without the session token.
    response = app_client.delete("/users/logout")
    assert response.status_code == 401, response.json()

    # Log in.
    response = app_client.post("/users/login", json={"email": test_email, "password": test_password})
    assert response.status_code == 200
    assert "session_token" in response.cookies
    token = response.cookies["session_token"]

    # Checks that with the session token we get a 200 response.
    response = app_client.get("/users/me")
    assert response.status_code == 200, response.json()
    assert response.json()["email"] == test_email

    # Use the Authorization header instead of the cookie.
    response = app_client.get("/users/me", cookies={"session_token": ""}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200, response.json()
    assert response.json()["email"] == test_email

    # Log the user out, which deletes the session token.
    response = app_client.delete("/users/logout")
    assert response.status_code == 200, response.json()
    assert response.json() is True

    # Checks that we can no longer use that session token to get the user's info.
    response = app_client.get("/users/me")
    assert response.status_code == 401, response.json()
    assert response.json()["detail"] == "Not authenticated"

    # Log the user back in, getting new session token.
    response = app_client.post("/users/login", json={"email": test_email, "password": test_password})
    assert response.status_code == 200
    assert "session_token" in response.cookies
    token = response.cookies["session_token"]

    # Delete the user using the new session token.
    response = app_client.delete("/users/me")
    assert response.status_code == 200, response.json()
    assert response.json() is True

    # Tries deleting the user again, which should fail.
    response = app_client.delete("/users/me")
    assert response.status_code == 404, response.json()
    assert response.json()["detail"] == "User not found"
