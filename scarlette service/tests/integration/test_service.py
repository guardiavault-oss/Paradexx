"""Integration tests for the complete Scarlette AI service."""

import pytest


class TestServiceIntegration:
    """Integration tests for the complete service."""

    @pytest.mark.asyncio
    async def test_full_chat_flow(self, mock_client):
        assert response2.status_code == 200
        data = response2.json()
        assert data["response"] == "Recovery successful"
