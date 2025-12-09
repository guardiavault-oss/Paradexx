#!/usr/bin/env python3
"""
🧪 MEV PROTECTION API TESTS
===========================
Comprehensive test suite for MEV Protection API.

Tests cover:
- API endpoints
- Authentication and authorization
- Request/response validation
- Error handling
- WebSocket connections
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from unittest.mock import AsyncMock, Mock, patch

import pytest

# Add src to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from fastapi.testclient import TestClient
from mev_protection.api.mev_protection_api import app
from mev_protection.core.mev_protection_engine import (
    MEVProtectionEngine,
    MEVThreat,
    MEVType,
    NetworkType,
    ProtectionLevel,
    ThreatLevel,
)


class TestMEVProtectionAPI:
    """Test suite for MEV Protection API"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    @pytest.fixture
    def mock_engine(self):
        """Create mock MEV protection engine"""
        engine = Mock(spec=MEVProtectionEngine)
        engine.is_protecting = False
        engine.active_networks = {NetworkType.ETHEREUM}
        engine.detected_threats = []
        engine.active_protections = {}
        engine.stats = {
            "threats_detected": 0,
            "threats_mitigated": 0,
            "transactions_protected": 0,
            "value_protected": 0.0,
            "gas_saved": 0,
            "protection_success_rate": 0.0,
            "ai_predictions": 0,
            "false_positives": 0,
        }
        engine.performance_metrics = {
            "cpu_usage": 0.0,
            "memory_usage": 0.0,
            "network_latency": {},
            "detection_speed": 0.0,
            "protection_speed": 0.0,
        }

        # Mock async methods
        engine.start_protection = AsyncMock()
        engine.stop_protection = AsyncMock()
        engine.get_protection_status = AsyncMock(
            return_value={
                "status": "active",
                "uptime_seconds": 3600,
                "networks_protected": 1,
                "active_networks": ["ethereum"],
                "statistics": engine.stats,
                "performance": engine.performance_metrics,
                "threat_level": "low",
                "last_updated": datetime.now().isoformat(),
            }
        )
        engine.get_live_dashboard_data = AsyncMock(
            return_value={
                "recent_threats": 0,
                "active_protections": 0,
                "threats_mitigated": 0,
                "value_protected": 0.0,
                "gas_saved": 0,
                "protection_success_rate": 0.0,
                "system_stats": engine.stats,
                "performance": engine.performance_metrics,
                "threat_level": "low",
            }
        )
        engine.protect_transaction = AsyncMock()

        return engine

    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert data["version"] == "2.0.0"
        assert data["service"] == "mev-protection"

    def test_start_protection_success(self, client, mock_engine):
        """Test successful protection start"""
        with patch("mev_protection.api.mev_protection_api.mev_engine", mock_engine):
            response = client.post(
                "/api/v1/protection/start",
                json={"networks": ["ethereum"], "protection_level": "high"},
                headers={"Authorization": "Bearer demo-api-key"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert "ethereum" in data["networks"]
            assert data["protection_level"] == "high"

    def test_start_protection_invalid_network(self, client, mock_engine):
        """Test protection start with invalid network"""
        with patch("mev_protection.api.mev_protection_api.mev_engine", mock_engine):
            response = client.post(
                "/api/v1/protection/start",
                json={"networks": ["invalid_network"], "protection_level": "high"},
                headers={"Authorization": "Bearer demo-api-key"},
            )

            assert response.status_code == 422  # Validation error

    def test_start_protection_invalid_level(self, client, mock_engine):
        """Test protection start with invalid protection level"""
        with patch("mev_protection.api.mev_protection_api.mev_engine", mock_engine):
            response = client.post(
                "/api/v1/protection/start",
                json={"networks": ["ethereum"], "protection_level": "invalid_level"},
                headers={"Authorization": "Bearer demo-api-key"},
            )

            assert response.status_code == 422  # Validation error

    def test_stop_protection(self, client, mock_engine):
        """Test protection stop"""
        with patch("mev_protection.api.mev_protection_api.mev_engine", mock_engine):
            response = client.post(
                "/api/v1/protection/stop", json={}, headers={"Authorization": "Bearer demo-api-key"}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert "stopped" in data["message"]

    def test_get_protection_status(self, client, mock_engine):
        """Test getting protection status"""
        with patch("mev_protection.api.mev_protection_api.mev_engine", mock_engine):
            response = client.get(
                "/api/v1/protection/status", headers={"Authorization": "Bearer demo-api-key"}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "active"
            assert "ethereum" in data["active_networks"]
            assert "statistics" in data
            assert "performance" in data

    def test_protect_transaction(self, client, mock_engine):
        """Test transaction protection"""
        # Mock protection result
        mock_protection = Mock()
        mock_protection.transaction_hash = "0x1234567890abcdef"
        mock_protection.network = NetworkType.ETHEREUM
        mock_protection.protection_level = ProtectionLevel.HIGH
        mock_protection.strategies = ["gas_adjustment", "private_mempool"]
        mock_protection.status = "completed"
        mock_protection.created_at = datetime.now()
        mock_protection.protection_result = Mock()
        mock_protection.protection_result.success = True
        mock_protection.protection_result.strategy_used = "gas_adjustment"
        mock_protection.protection_result.gas_saved = 1000000
        mock_protection.protection_result.value_protected = 0.5
        mock_protection.protection_result.execution_time = 0.1

        mock_engine.protect_transaction.return_value = mock_protection

        with patch("mev_protection.api.mev_protection_api.mev_engine", mock_engine):
            response = client.post(
                "/api/v1/transactions/protect",
                json={
                    "transaction_hash": "0x1234567890abcdef",
                    "network": "ethereum",
                    "protection_level": "high",
                    "gas_limit": 21000,
                    "max_gas_price": 100000000000,
                    "slippage_tolerance": 0.5,
                    "private_mempool": True,
                },
                headers={"Authorization": "Bearer demo-api-key"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert data["protection"]["transaction_hash"] == "0x1234567890abcdef"
            assert data["protection"]["network"] == "ethereum"
            assert data["protection"]["protection_level"] == "high"

    def test_get_threats(self, client, mock_engine):
        """Test getting threats"""
        # Add some test threats
        threat1 = MEVThreat(
            threat_id="threat_1",
            threat_type=MEVType.SANDWICH,
            target_transaction="0x1234567890abcdef",
            attacker_address="0xattacker1234567890",
            profit_potential=0.5,
            gas_price=50000000000,
            confidence=0.85,
            severity=ThreatLevel.HIGH,
            detected_at=datetime.now(),
            network=NetworkType.ETHEREUM,
        )

        threat2 = MEVThreat(
            threat_id="threat_2",
            threat_type=MEVType.ARBITRAGE,
            target_transaction="0x0987654321fedcba",
            attacker_address="0xattacker0987654321",
            profit_potential=0.3,
            gas_price=30000000000,
            confidence=0.75,
            severity=ThreatLevel.MEDIUM,
            detected_at=datetime.now(),
            network=NetworkType.ETHEREUM,
        )

        mock_engine.detected_threats = [threat1, threat2]

        with patch("mev_protection.api.mev_protection_api.mev_engine", mock_engine):
            response = client.get(
                "/api/v1/threats", headers={"Authorization": "Bearer demo-api-key"}
            )

            assert response.status_code == 200
            data = response.json()
            assert len(data["threats"]) == 2
            assert data["total_count"] == 2
            assert data["threats"][0]["threat_id"] == "threat_1"
            assert data["threats"][1]["threat_id"] == "threat_2"

    def test_get_threats_with_filters(self, client, mock_engine):
        """Test getting threats with filters"""
        # Add test threats
        threat1 = MEVThreat(
            threat_id="threat_1",
            threat_type=MEVType.SANDWICH,
            target_transaction="0x1234567890abcdef",
            attacker_address="0xattacker1234567890",
            profit_potential=0.5,
            gas_price=50000000000,
            confidence=0.85,
            severity=ThreatLevel.HIGH,
            detected_at=datetime.now(),
            network=NetworkType.ETHEREUM,
        )

        threat2 = MEVThreat(
            threat_id="threat_2",
            threat_type=MEVType.ARBITRAGE,
            target_transaction="0x0987654321fedcba",
            attacker_address="0xattacker0987654321",
            profit_potential=0.3,
            gas_price=30000000000,
            confidence=0.75,
            severity=ThreatLevel.MEDIUM,
            detected_at=datetime.now(),
            network=NetworkType.ETHEREUM,
        )

        mock_engine.detected_threats = [threat1, threat2]

        with patch("mev_protection.api.mev_protection_api.mev_engine", mock_engine):
            response = client.get(
                "/api/v1/threats?severity=high&limit=1",
                headers={"Authorization": "Bearer demo-api-key"},
            )

            assert response.status_code == 200
            data = response.json()
            assert len(data["threats"]) == 1
            assert data["threats"][0]["severity"] == "high"

    def test_get_specific_threat(self, client, mock_engine):
        """Test getting specific threat"""
        threat = MEVThreat(
            threat_id="specific_threat",
            threat_type=MEVType.SANDWICH,
            target_transaction="0x1234567890abcdef",
            attacker_address="0xattacker1234567890",
            profit_potential=0.5,
            gas_price=50000000000,
            confidence=0.85,
            severity=ThreatLevel.HIGH,
            detected_at=datetime.now(),
            network=NetworkType.ETHEREUM,
        )

        mock_engine.detected_threats = [threat]

        with patch("mev_protection.api.mev_protection_api.mev_engine", mock_engine):
            response = client.get(
                "/api/v1/threats/specific_threat", headers={"Authorization": "Bearer demo-api-key"}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["threat_id"] == "specific_threat"
            assert data["threat_type"] == "sandwich"
            assert data["severity"] == "high"

    def test_get_specific_threat_not_found(self, client, mock_engine):
        """Test getting non-existent threat"""
        mock_engine.detected_threats = []

        with patch("mev_protection.api.mev_protection_api.mev_engine", mock_engine):
            response = client.get(
                "/api/v1/threats/non_existent_threat",
                headers={"Authorization": "Bearer demo-api-key"},
            )

            assert response.status_code == 404
            data = response.json()
            assert "not found" in data["error"]["message"]

    def test_get_stats(self, client, mock_engine):
        """Test getting statistics"""
        with patch("mev_protection.api.mev_protection_api.mev_engine", mock_engine):
            response = client.get("/api/v1/stats", headers={"Authorization": "Bearer demo-api-key"})

            assert response.status_code == 200
            data = response.json()
            assert "statistics" in data
            assert "timeframe" in data
            assert data["statistics"]["threats_detected"] == 0
            assert data["statistics"]["threats_mitigated"] == 0

    def test_get_dashboard_data(self, client, mock_engine):
        """Test getting dashboard data"""
        with patch("mev_protection.api.mev_protection_api.mev_engine", mock_engine):
            response = client.get(
                "/api/v1/dashboard", headers={"Authorization": "Bearer demo-api-key"}
            )

            assert response.status_code == 200
            data = response.json()
            assert "recent_threats" in data
            assert "active_protections" in data
            assert "system_stats" in data
            assert "performance" in data

    def test_get_networks(self, client, mock_engine):
        """Test getting supported networks"""
        with patch("mev_protection.api.mev_protection_api.mev_engine", mock_engine):
            response = client.get(
                "/api/v1/networks", headers={"Authorization": "Bearer demo-api-key"}
            )

            assert response.status_code == 200
            data = response.json()
            assert "networks" in data
            assert len(data["networks"]) > 0

            # Check that ethereum is in the list
            ethereum_network = next((n for n in data["networks"] if n["name"] == "ethereum"), None)
            assert ethereum_network is not None
            assert ethereum_network["display_name"] == "Ethereum"

    def test_get_network_status(self, client, mock_engine):
        """Test getting network status"""
        with patch("mev_protection.api.mev_protection_api.mev_engine", mock_engine):
            response = client.get(
                "/api/v1/networks/ethereum/status", headers={"Authorization": "Bearer demo-api-key"}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["network"] == "ethereum"
            assert "status" in data
            assert "statistics" in data

    def test_get_network_status_invalid_network(self, client, mock_engine):
        """Test getting status for invalid network"""
        with patch("mev_protection.api.mev_protection_api.mev_engine", mock_engine):
            response = client.get(
                "/api/v1/networks/invalid_network/status",
                headers={"Authorization": "Bearer demo-api-key"},
            )

            assert response.status_code == 400
            data = response.json()
            assert "Invalid network" in data["error"]["message"]

    def test_unauthorized_access(self, client):
        """Test unauthorized access"""
        response = client.post(
            "/api/v1/protection/start", json={"networks": ["ethereum"], "protection_level": "high"}
        )

        assert response.status_code == 403  # Forbidden

    def test_invalid_api_key(self, client):
        """Test invalid API key"""
        response = client.post(
            "/api/v1/protection/start",
            json={"networks": ["ethereum"], "protection_level": "high"},
            headers={"Authorization": "Bearer invalid-api-key"},
        )

        assert response.status_code == 401  # Unauthorized

    def test_engine_not_initialized(self, client):
        """Test when engine is not initialized"""
        with patch("mev_protection.api.mev_protection_api.mev_engine", None):
            response = client.get(
                "/api/v1/protection/status", headers={"Authorization": "Bearer demo-api-key"}
            )

            assert response.status_code == 503
            data = response.json()
            assert "not initialized" in data["error"]["message"]


class TestWebSocketAPI:
    """Test suite for WebSocket API"""

    @pytest.mark.asyncio
    async def test_websocket_connection(self):
        """Test WebSocket connection"""
        from fastapi.testclient import TestClient

        client = TestClient(app)

        with client.websocket_connect("/ws") as websocket:
            # Should be able to connect
            assert websocket is not None

    @pytest.mark.asyncio
    async def test_websocket_data_reception(self):
        """Test receiving data through WebSocket"""
        from fastapi.testclient import TestClient

        client = TestClient(app)

        with client.websocket_connect("/ws") as websocket:
            # Wait for data
            data = websocket.receive_text()

            # Should receive JSON data
            parsed_data = json.loads(data)
            assert "recent_threats" in parsed_data
            assert "active_protections" in parsed_data


class TestAPIValidation:
    """Test suite for API validation"""

    def test_protection_start_validation(self):
        """Test protection start request validation"""
        client = TestClient(app)

        # Test missing required fields
        response = client.post(
            "/api/v1/protection/start", json={}, headers={"Authorization": "Bearer demo-api-key"}
        )

        assert response.status_code == 422  # Validation error

    def test_transaction_protection_validation(self):
        """Test transaction protection request validation"""
        client = TestClient(app)

        # Test missing required fields
        response = client.post(
            "/api/v1/transactions/protect",
            json={},
            headers={"Authorization": "Bearer demo-api-key"},
        )

        assert response.status_code == 422  # Validation error

    def test_threat_filter_validation(self):
        """Test threat filter validation"""
        client = TestClient(app)

        # Test invalid limit
        response = client.get(
            "/api/v1/threats?limit=2000", headers={"Authorization": "Bearer demo-api-key"}
        )

        assert response.status_code == 422  # Validation error

        # Test invalid offset
        response = client.get(
            "/api/v1/threats?offset=-1", headers={"Authorization": "Bearer demo-api-key"}
        )

        assert response.status_code == 422  # Validation error


class TestErrorHandling:
    """Test suite for error handling"""

    def test_internal_server_error(self, client, mock_engine):
        """Test internal server error handling"""
        # Mock engine to raise an exception
        mock_engine.get_protection_status.side_effect = Exception("Test error")

        with patch("mev_protection.api.mev_protection_api.mev_engine", mock_engine):
            response = client.get(
                "/api/v1/protection/status", headers={"Authorization": "Bearer demo-api-key"}
            )

            assert response.status_code == 500
            data = response.json()
            assert "Internal server error" in data["error"]["message"]

    def test_not_found_error(self, client, mock_engine):
        """Test not found error handling"""
        mock_engine.detected_threats = []

        with patch("mev_protection.api.mev_protection_api.mev_engine", mock_engine):
            response = client.get(
                "/api/v1/threats/non_existent", headers={"Authorization": "Bearer demo-api-key"}
            )

            assert response.status_code == 404
            data = response.json()
            assert "not found" in data["error"]["message"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
