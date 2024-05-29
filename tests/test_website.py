"""Tests that the main website entrypoint is reachable."""

import requests
from fastapi.testclient import TestClient


def test_basic(app_client: TestClient) -> None:
    response = app_client.get("/")
    assert response.status_code == 200

def test_endpoint(app_client: TestClient) -> None:
    try:
        response = requests.get("http://localhost:8080/")
        assert response.status_code == 200
    except requests.exceptions.ConnectionError:
        assert False, "The website is not running."
