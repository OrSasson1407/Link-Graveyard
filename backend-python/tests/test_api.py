import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def internal_headers():
    return {"x-internal-secret": settings.internal_worker_secret}


def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_scrape_endpoint_unauthorized(client):
    """Test that scrape endpoint rejects missing secret."""
    response = client.post(
        "/api/v1/scrape",
        json={
            "link_id": "test-id",
            "url": "https://example.com",
            "user_id": "user-123",
        },
    )
    assert response.status_code == 422  # Missing required header


def test_scrape_endpoint_invalid_secret(client):
    """Test that scrape endpoint rejects invalid secret."""
    response = client.post(
        "/api/v1/scrape",
        json={
            "link_id": "test-id",
            "url": "https://example.com",
            "user_id": "user-123",
        },
        headers={"x-internal-secret": "wrong-secret"},
    )
    assert response.status_code == 401


def test_scrape_endpoint_success(client, internal_headers):
    """Test successful task enqueue."""
    mock_task = MagicMock()
    mock_task.id = "celery-task-id-123"

    with patch("app.api.routes.process_link_task") as mock_process:
        mock_process.delay.return_value = mock_task

        response = client.post(
            "/api/v1/scrape",
            json={
                "link_id": "link-abc",
                "url": "https://example.com",
                "user_id": "user-xyz",
                "context_text": "Check this out",
            },
            headers=internal_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["task_id"] == "celery-task-id-123"


def test_task_status_endpoint(client, internal_headers):
    """Test task status lookup."""
    with patch("app.api.routes.AsyncResult") as mock_result_cls:
        mock_result = MagicMock()
        mock_result.status = "SUCCESS"
        mock_result.ready.return_value = True
        mock_result.result = {"success": True}
        mock_result_cls.return_value = mock_result

        response = client.get(
            "/api/v1/scrape/status/celery-task-id-123",
            headers=internal_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "SUCCESS"
