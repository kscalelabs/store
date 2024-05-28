"""Runs tests on the user APIs."""

import asyncio

from fastapi.testclient import TestClient
from pytest_mock.plugin import MockType

from store.app.api.db import create_tables
from store.app.api.email import OneTimePassPayload


def test_user_auth_functions(app_client: TestClient, mock_send_email: MockType) -> None:
    asyncio.run(create_tables())

    test_email = "test@example.com"
    login_url = "/"
    bad_actor_email = "badactor@gmail.com"

    # Creates a bad actor user for testing admin actions later.
    otp = OneTimePassPayload(email=bad_actor_email)
    response = app_client.post("/api/users/otp", json={"payload": otp.encode()})
    assert response.status_code == 200, response.json()

    # Sends an email to the user with their one-time pass.
    response = app_client.post(
        "/api/users/login",
        json={
            "email": test_email,
            "login_url": login_url,
        },
    )
    assert response.status_code == 200, response.json()
    assert mock_send_email.call_count == 1

    # Uses the one-time pass to set client cookies.
    otp = OneTimePassPayload(email=test_email)
    response = app_client.post("/api/users/otp", json={"payload": otp.encode()})
    assert response.status_code == 200, response.json()

    # Checks that we get a 401 without a session token.
    response = app_client.get("/api/users/me")
    assert response.status_code == 401, response.json()
    assert response.json()["detail"] == "Not authenticated"

    # Get a session token.
    response = app_client.post("/api/users/refresh")
    assert response.status_code == 200, response.json()
    assert response.json()["token_type"] == "Bearer"

    # Gets the user's profile using the token.
    response = app_client.get("/api/users/me")
    assert response.status_code == 200, response.json()
    assert response.json()["email"] == test_email

    # Log the user out.
    response = app_client.delete("/api/users/logout")
    assert response.status_code == 200, response.json()
    assert response.json() is True

    # Check that the user cookie has been cleared.
    response = app_client.get("/api/users/me")
    assert response.status_code == 401, response.json()
    assert response.json()["detail"] == "Not authenticated"

    # Log the user back in.
    response = app_client.post("/api/users/otp", json={"payload": otp.encode()})
    assert response.status_code == 200, response.json()

    # Gets another session token.
    response = app_client.post("/api/users/refresh")
    assert response.status_code == 200, response.json()

    # Delete the user.
    response = app_client.delete("/api/users/me")
    assert response.status_code == 200, response.json()
    assert response.json() is True

    # Make sure the user is gone.
    response = app_client.get("/api/users/me")
    assert response.status_code == 400, response.json()
    assert response.json()["detail"] == "User not found"
