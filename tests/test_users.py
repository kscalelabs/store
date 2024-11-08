"""Runs tests on the user APIs."""

from fastapi import status
from fastapi.testclient import TestClient
from httpx import AsyncClient

from store.app.db import create_tables


def test_user_auth_functions(test_client: TestClient) -> None:
    # Checks that without the session token we get a 401 response.
    response = test_client.get("/users/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED, response.json()
    assert response.json()["detail"] == "Not authenticated"

    # Checks that we can't log the user out without the session token.
    response = test_client.delete("/auth/api/logout")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED, response.json()

    # Because of the way we patched GitHub functions for mocking, it doesn't matter what token we pass in.
    response = test_client.post("/auth/github/code", json={"code": "test_code"})
    assert response.status_code == status.HTTP_200_OK, response.json()
    token = response.json()["api_key"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # Checks that with the session token we get a 200 response.
    response = test_client.get("/users/me", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()

    # Log the user out, which deletes the session token.
    response = test_client.delete("/auth/api/logout", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()
    assert response.json() is True

    # Checks that we can no longer use that session token to get the user's info.
    response = test_client.get("/users/me", headers=auth_headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED, response.json()
    assert response.json()["detail"] == "Not authenticated"

    # Log the user back in, getting new session token.
    response = test_client.post("/auth/github/code", json={"code": "test_code"})
    assert response.status_code == status.HTTP_200_OK, response.json()
    assert response.json()["api_key"] != token
    token = response.json()["api_key"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # Delete the user using the new session token.
    response = test_client.delete("/users/me", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()
    assert response.json() is True

    # Tries deleting the user again, which should fail.
    response = test_client.delete("/users/me", headers=auth_headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED, response.json()
    assert response.json()["detail"] == "Not authenticated"


async def test_user_general_functions(app_client: AsyncClient) -> None:
    await create_tables()

    # Because of the way we patched GitHub functions for mocking, it doesn't matter what token we pass in.
    response = await app_client.post("/auth/github/code", json={"code": "test_code"})
    assert response.status_code == status.HTTP_200_OK, response.json()
    token = response.json()["api_key"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # Update the user's profile (e.g., change first_name).
    update_data = {"first_name": "UpdatedFirstName", "last_name": "UpdatedLastName"}
    response = await app_client.put("/users/me", headers=auth_headers, json=update_data)
    assert response.status_code == status.HTTP_200_OK, response.json()

    # Verify that the user's profile has been updated.
    response = await app_client.get("/users/me", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK, response.json()
    updated_user_data = response.json()
    assert updated_user_data["first_name"] == "UpdatedFirstName"
    assert updated_user_data["last_name"] == "UpdatedLastName"
