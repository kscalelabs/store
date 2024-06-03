"""Runs tests on the user APIs."""

import asyncio

from fastapi.testclient import TestClient
from pytest_mock.plugin import MockType

from store.app.api.db import create_tables
from store.app.api.email_utils import OneTimePassPayload


def test_user_auth_functions(app_client: TestClient, mock_send_email: MockType) -> None:
    asyncio.run(create_tables())

    test_email = "test@example.com"
    login_url = "/"

    # Sends the one-time password to the test email.
    response = app_client.post("/api/users/login", json={"email": test_email, "login_url": login_url})
    assert response.status_code == 200, response.json()
    assert mock_send_email.call_count == 1

    # Uses the one-time pass to get an API key. We need to make a new OTP
    # manually because we can't send emails in unit tests.
    otp = OneTimePassPayload(email=test_email)
    response = app_client.post("/api/users/otp", json={"payload": otp.encode()})
    assert response.status_code == 200, response.json()
    response_data = response.json()
    api_key = response_data["api_key"]

    # Checks that without the API key we get a 401 response.
    response = app_client.get("/api/users/me")
    assert response.status_code == 401, response.json()
    assert response.json()["detail"] == "Not authenticated"

    # Checks that with the API key we get a 200 response.
    response = app_client.get("/api/users/me", headers={"Authorization": f"Bearer {api_key}"})
    assert response.status_code == 200, response.json()
    assert response.json()["email"] == test_email

    # Checks that we can't log the user out without the API key.
    response = app_client.delete("/api/users/logout")
    assert response.status_code == 401, response.json()

    # Log the user out, which deletes the API key.
    response = app_client.delete("/api/users/logout", headers={"Authorization": f"Bearer {api_key}"})
    assert response.status_code == 200, response.json()
    assert response.json() is True

    # Checks that we can no longer use that API key to get the user's info.
    response = app_client.get("/api/users/me", headers={"Authorization": f"Bearer {api_key}"})
    assert response.status_code == 404, response.json()
    assert response.json()["detail"] == "User not found"

    # Log the user back in, getting new API key.
    response = app_client.post("/api/users/otp", json={"payload": otp.encode()})
    assert response.status_code == 200, response.json()

    # Delete the user using the new API key.
    response = app_client.delete("/api/users/me", headers={"Authorization": f"Bearer {api_key}"})
    assert response.status_code == 200, response.json()
    assert response.json() is True

    # Tries deleting the user again, which should fail.
    response = app_client.delete("/api/users/me", headers={"Authorization": f"Bearer {api_key}"})
    assert response.status_code == 404, response.json()
    assert response.json()["detail"] == "User not found"
