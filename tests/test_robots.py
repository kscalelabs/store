"""Runs tests on the robot APIs."""

from httpx import AsyncClient

from store.app.db import create_tables


async def test_robots(app_client: AsyncClient) -> None:
    await create_tables()

    # Register.
    response = await app_client.get("/users/github/code/doesnt-matter")
    assert response.status_code == 200, response.json()
    assert "session_token" in response.cookies

    # Create a part.
    response = await app_client.post(
        "/parts/add",
        json={
            "name": "test part",
            "description": "test description",
            "images": [
                {
                    "url": "",
                    "caption": "",
                }
            ],
        },
    )

    # Create a robot.
    response = await app_client.post(
        "/robots/add",
        json={
            "name": "test robot",
            "description": "test description",
            "bom": [],
            "images": [{"url": "", "caption": ""}],
        },
    )
