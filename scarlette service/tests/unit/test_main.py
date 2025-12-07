"""Unit tests for the main FastAPI application."""

from unittest.mock import AsyncMock, patch


class TestMainAPI:
    """Test cases for main API endpoints."""

    def test_root_endpoint(self, client):
        """Test the root endpoint."""
        response = client.get("/")
        assert response.status_code == 200

        data = response.json()
        assert data["service"] == "Scarlette AI Service"
        assert data["version"] == "1.0.0"
        assert "endpoints" in data

    def test_health_endpoint_healthy(self, client):
        """Test health endpoint when service is healthy."""
        with (
            patch("scarlette_ai.main.scarlette_ai", new=AsyncMock()),
            patch("scarlette_ai.main.knowledge_base", new=AsyncMock()),
            patch("scarlette_ai.main.conversation_manager", new=AsyncMock()),
            patch("scarlette_ai.main.redis_client"),
        ):
            response = client.get("/health")
            assert response.status_code == 200
