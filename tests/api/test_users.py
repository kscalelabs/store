"""Tests the users API endpoints."""

from fastapi.testclient import TestClient


def test_get_user(app_client: TestClient) -> None:
    response = app_client.get("/api/users/123")
    assert response.status_code == 200
    assert response.json() == {"user_id": "123", "name": "John Doe"}
