"""Tests that the main website entrypoint is reachable."""

from fastapi.testclient import TestClient


def test_basic(app_client: TestClient) -> None:
    response = app_client.get("/")
    assert response.status_code == 200
