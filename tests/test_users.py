"""Runs tests on the user APIs."""



from httpx import AsyncClient
from pytest_mock.plugin import MockType

from store.app.crud.users import UserCrud
from store.app.db import create_tables


async def test_user_auth_functions(app_client: AsyncClient, mock_send_email: MockType) -> None:
    crud = UserCrud()
    await create_tables()
    await crud.__aenter__()

    test_username = "test"
    test_email = "test@example.com"
    test_password = "test password"
    test_token = "test_token"

    await crud.add_register_token(test_token, test_email, 3600)

    # Send registration email.
    response = await app_client.post("/users/send-register-email", json={"email": test_email})
    assert response.status_code == 200
    assert mock_send_email.call_count == 1

    # Register.
    response = await app_client.post("/users/register", json={
        "username": test_username,
        "token": test_token,
        "password": test_password
    })
    assert response.status_code == 200

    # Checks that without the session token we get a 401 response.
    response = await app_client.get("/users/me")
    assert response.status_code == 401, response.json()
    assert response.json()["detail"] == "Not authenticated"

    # Checks that we can't log the user out without the session token.
    response = await app_client.delete("/users/logout")
    assert response.status_code == 401, response.json()

    # Log in.
    response = await app_client.post("/users/login", json={
        "email": test_email,
        "password": test_password,
    })
    assert response.status_code == 200
    assert "session_token" in response.cookies
    token = response.cookies["session_token"]

    # Checks that with the session token we get a 200 response.
    response = await app_client.get("/users/me")
    assert response.status_code == 200, response.json()
    assert response.json()["email"] == test_email

    # Use the Authorization header instead of the cookie.
    response = await app_client.get(
        "/users/me",
        cookies={"session_token": ""},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, response.json()
    assert response.json()["email"] == test_email

    # Log the user out, which deletes the session token.
    response = await app_client.delete("/users/logout")
    assert response.status_code == 200, response.json()
    assert response.json() is True

    # Checks that we can no longer use that session token to get the user's info.
    response = await app_client.get("/users/me")
    assert response.status_code == 401, response.json()
    assert response.json()["detail"] == "Not authenticated"

    # Log the user back in, getting new session token.
    response = await app_client.post("/users/login", json={
        "email": test_email,
        "password": test_password,
    })
    assert response.status_code == 200
    assert "session_token" in response.cookies
    token = response.cookies["session_token"]

    # Delete the user using the new session token.
    response = await app_client.delete("/users/me")
    assert response.status_code == 200, response.json()
    assert response.json() is True

    # Tries deleting the user again, which should fail.
    response = await app_client.delete("/users/me")
    assert response.status_code == 404, response.json()
    assert response.json()["detail"] == "User not found"
