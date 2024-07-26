"""Runs tests on the user APIs."""

from httpx import AsyncClient

from store.app.db import create_tables


async def test_user_auth_functions(app_client: AsyncClient) -> None:
    await create_tables()

    # Checks that without the session token we get a 401 response.
    response = await app_client.get("/users/me")
    assert response.status_code == 401, response.json()
    assert response.json()["detail"] == "Not authenticated"

    # Checks that we can't log the user out without the session token.
    response = await app_client.delete("/users/logout")
    assert response.status_code == 401, response.json()

    # Because of the way we patched GitHub functions for mocking, it doesn't matter what token we pass in.
    response = await app_client.get("/users/github/code/doesnt-matter")
    assert response.status_code == 200, response.json()

    # Checks that with the session token we get a 200 response.
    response = await app_client.get("/users/me")
    assert response.status_code == 200, response.json()

    # Log the user out, which deletes the session token.
    response = await app_client.delete("/users/logout")
    assert response.status_code == 200, response.json()
    assert response.json() is True

    # Checks that we can no longer use that session token to get the user's info.
    response = await app_client.get("/users/me")
    assert response.status_code == 401, response.json()
    assert response.json()["detail"] == "Not authenticated"

    # Log the user back in, getting new session token.
    response = await app_client.get("/users/github/code/doesnt-matter")
    assert response.status_code == 200, response.json()

    # Delete the user using the new session token.
    response = await app_client.delete("/users/me")
    assert response.status_code == 200, response.json()
    assert response.json() is True

    # Tries deleting the user again, which should fail.
    response = await app_client.delete("/users/me")
    assert response.status_code == 400, response.json()
    assert response.json()["detail"] == "Item not found"
