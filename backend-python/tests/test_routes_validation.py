import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def auth_headers():
    return {"x-internal-secret": settings.internal_worker_secret}

def test_missing_secret_header(client):
    response = client.post("/api/v1/scrape", json={"link_id": "l1", "url": "https://x.com", "user_id": "u1"})
    assert response.status_code in [401, 422]

def test_wrong_secret_rejected(client):
    response = client.post("/api/v1/scrape", json={"link_id": "l1", "url": "https://x.com", "user_id": "u1"}, headers={"x-internal-secret": "bad"})
    assert response.status_code == 401

def test_missing_url_field(client, auth_headers):
    response = client.post("/api/v1/scrape", json={"link_id": "l1", "user_id": "u1"}, headers=auth_headers)
    assert response.status_code == 422

def test_missing_link_id_field(client, auth_headers):
    response = client.post("/api/v1/scrape", json={"url": "https://x.com", "user_id": "u1"}, headers=auth_headers)
    assert response.status_code == 422

def test_missing_user_id_field(client, auth_headers):
    response = client.post("/api/v1/scrape", json={"link_id": "l1", "url": "https://x.com"}, headers=auth_headers)
    assert response.status_code == 422

def test_empty_body(client, auth_headers):
    response = client.post("/api/v1/scrape", json={}, headers=auth_headers)
    assert response.status_code == 422

def test_health_returns_ok(client):
    response = client.get("/health")
    assert response.status_code == 200

def test_health_returns_json(client):
    response = client.get("/health")
    assert response.headers["content-type"].startswith("application/json")

def test_health_status_field(client):
    response = client.get("/health")
    assert response.json().get("status") == "ok"

def test_unknown_route_returns_404(client):
    response = client.get("/api/v1/nonexistent")
    assert response.status_code == 404

def test_scrape_with_optional_context_text(client, auth_headers):
    with patch("app.api.routes.process_link_task") as mock_task:
        mock_task.delay.return_value = MagicMock(id="task-1")
        response = client.post("/api/v1/scrape",
            json={"link_id": "l1", "url": "https://x.com", "user_id": "u1", "context_text": "optional"},
            headers=auth_headers)
        assert response.status_code == 200

def test_task_status_missing_task_id(client, auth_headers):
    with patch("app.api.routes.AsyncResult") as mock_ar:
        mock_ar.return_value = MagicMock(status="PENDING", ready=MagicMock(return_value=False), result=None)
        response = client.get("/api/v1/scrape/status/fake-id", headers=auth_headers)
        assert response.status_code in [200, 404]

def test_scrape_success_returns_task_id(client, auth_headers):
    with patch("app.api.routes.process_link_task") as mock_task:
        mock_task.delay.return_value = MagicMock(id="task-xyz")
        response = client.post("/api/v1/scrape",
            json={"link_id": "l1", "url": "https://x.com", "user_id": "u1"},
            headers=auth_headers)
        assert response.status_code == 200
        assert response.json().get("task_id") == "task-xyz"

def test_scrape_success_field_true(client, auth_headers):
    with patch("app.api.routes.process_link_task") as mock_task:
        mock_task.delay.return_value = MagicMock(id="t1")
        response = client.post("/api/v1/scrape",
            json={"link_id": "l1", "url": "https://x.com", "user_id": "u1"},
            headers=auth_headers)
        assert response.json().get("success") is True

def test_task_status_success(client, auth_headers):
    with patch("app.api.routes.AsyncResult") as mock_ar:
        mock_result = MagicMock()
        mock_result.status = "SUCCESS"
        mock_result.ready.return_value = True
        mock_result.result = {"ok": True}
        mock_ar.return_value = mock_result
        response = client.get("/api/v1/scrape/status/some-id", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "SUCCESS"

def test_task_status_pending(client, auth_headers):
    with patch("app.api.routes.AsyncResult") as mock_ar:
        mock_result = MagicMock()
        mock_result.status = "PENDING"
        mock_result.ready.return_value = False
        mock_result.result = None
        mock_ar.return_value = mock_result
        response = client.get("/api/v1/scrape/status/pending-id", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "PENDING"
