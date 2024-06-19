"""Runs tests on the robot APIs."""
from httpx import AsyncClient
from store.app.db import create_tables
from store.app.crud.users import UserCrud


async def test_robots(app_client: AsyncClient) -> None:
    crud = UserCrud()
    await create_tables()
    await crud.__aenter__()

    test_username = "test"
    test_email = "test@example.com"
    test_password = "test password"
    test_token = "test_token"

    await crud.add_register_token(test_token, test_email, 3600)
    

    # Register.
    response = await app_client.post("/users/register", json={"username": test_username, "token": test_token, "password": test_password})
    assert response.status_code == 200

    # Log in.
    response = await app_client.post("/users/login", json={"email": test_email, "password": test_password})
    assert response.status_code == 200
    assert "session_token" in response.cookies

    # Create a part.
    response = await app_client.post("/parts/add", json={"part_id": "", "owner": "", "name": "test part", "description": "test description", "images": [{"url": "", "caption": ""}]})

    # Create a robot.
    response = await app_client.post("/robots/add", json={"robot_id": "", "owner": "", "name": "test robot", "description": "test description", "bom": [], "images": [{"url": "", "caption": ""}]})
