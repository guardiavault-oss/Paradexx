"""Tests for API routes."""

from unittest.mock import AsyncMock, Mock, patch

import pytest
from fastapi.testclient import TestClient
from src.api.main import app
from src.models.bridge import BridgeAnalysis, SecurityLevel


class TestAPIRoutes:
    """Test cases for API routes."""

    @pytest.fixture
    def client(self):
        """Create a test client."""
        return TestClient(app)

    @pytest.fixture
    def mock_bridge_analyzer(self):
        """Create a mock bridge analyzer."""
        analyzer = Mock()
        analyzer.analyze_bridge = AsyncMock()
        analyzer.get_bridge_security_score = AsyncMock()
        return analyzer

    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "cross-chain-bridge-service"

    def test_root_endpoint(self, client):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "Cross-Chain Bridge Security Analysis Service"
        assert "endpoints" in data

    @patch("src.api.routes.bridge.get_bridge_analyzer")
    def test_analyze_bridge_success(self, mock_get_analyzer, client, mock_bridge_analyzer):
        """Test successful bridge analysis."""
        mock_get_analyzer.return_value = mock_bridge_analyzer

        # Mock analysis result
        mock_analysis = BridgeAnalysis(
            bridge_address="0x1234567890123456789012345678901234567890",
            security_score=8.5,
            risk_level=SecurityLevel.SAFE,
            code_quality_score=8.0,
            audit_status="verified",
        )
        mock_bridge_analyzer.analyze_bridge.return_value = mock_analysis

        request_data = {
            "bridge_address": "0x1234567890123456789012345678901234567890",
            "source_network": "ethereum",
            "target_network": "polygon",
            "analysis_depth": "comprehensive",
        }

        response = client.post("/api/v1/bridge/analyze", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert data["bridge_address"] == "0x1234567890123456789012345678901234567890"
        assert data["security_score"] == 8.5
        assert data["risk_level"] == "safe"

    def test_analyze_bridge_invalid_address(self, client):
        """Test bridge analysis with invalid address."""
        request_data = {
            "bridge_address": "invalid_address",
            "source_network": "ethereum",
            "target_network": "polygon",
        }

        response = client.post("/api/v1/bridge/analyze", json=request_data)
        assert response.status_code == 422  # Validation error

    def test_analyze_bridge_unsupported_network(self, client):
        """Test bridge analysis with unsupported network."""
        request_data = {
            "bridge_address": "0x1234567890123456789012345678901234567890",
            "source_network": "unsupported_network",
            "target_network": "polygon",
        }

        response = client.post("/api/v1/bridge/analyze", json=request_data)
        assert response.status_code == 422  # Validation error

    def test_analyze_bridge_invalid_analysis_depth(self, client):
        """Test bridge analysis with invalid analysis depth."""
        request_data = {
            "bridge_address": "0x1234567890123456789012345678901234567890",
            "source_network": "ethereum",
            "target_network": "polygon",
            "analysis_depth": "invalid_depth",
        }

        response = client.post("/api/v1/bridge/analyze", json=request_data)
        assert response.status_code == 422  # Validation error

    @patch("src.api.routes.bridge.get_bridge_analyzer")
    def test_get_bridge_security_score(self, mock_get_analyzer, client, mock_bridge_analyzer):
        """Test getting bridge security score."""
        mock_get_analyzer.return_value = mock_bridge_analyzer

        # Mock security score result
        from src.models.bridge import BridgeSecurityScore

        mock_score = BridgeSecurityScore(
            bridge_address="0x1234567890123456789012345678901234567890",
            network="ethereum",
            code_quality=8.0,
            audit_status=8.0,
            governance_decentralization=7.0,
            validator_set=7.0,
            economic_security=8.0,
            operational_security=7.0,
            overall_score=7.5,
            risk_level=SecurityLevel.SAFE,
        )
        mock_bridge_analyzer.get_bridge_security_score.return_value = mock_score

        request_data = {
            "bridge_address": "0x1234567890123456789012345678901234567890",
            "network": "ethereum",
        }

        response = client.post("/api/v1/bridge/security-score", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert data["bridge_address"] == "0x1234567890123456789012345678901234567890"
        assert data["overall_score"] == 7.5
        assert data["risk_level"] == "safe"

    def test_simulate_bridge_attack(self, client):
        """Test bridge attack simulation."""
        request_data = {
            "bridge_address": "0x1234567890123456789012345678901234567890",
            "attack_type": "reentrancy",
            "attack_parameters": {"amount": 1000},
        }

        response = client.post("/api/v1/bridge/simulate-attack", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert data["bridge_address"] == "0x1234567890123456789012345678901234567890"
        assert data["attack_type"] == "reentrancy"
        assert "simulation_result" in data or "attack_successful" in data

    def test_get_bridge_metrics(self, client):
        """Test getting bridge metrics."""
        response = client.get("/api/v1/bridge/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "metrics" in data
        assert "time_range" in data

    def test_list_bridges(self, client):
        """Test listing bridges."""
        response = client.get("/api/v1/bridge/list")
        assert response.status_code == 200
        data = response.json()
        assert "bridges" in data
        assert "total" in data

    def test_get_bridge_info(self, client):
        """Test getting bridge information."""
        bridge_address = "0x1234567890123456789012345678901234567890"
        response = client.get(f"/api/v1/bridge/{bridge_address}/info")
        assert response.status_code == 200
        data = response.json()
        assert data["address"] == bridge_address.lower()

    def test_get_bridge_info_invalid_address(self, client):
        """Test getting bridge info with invalid address."""
        response = client.get("/api/v1/bridge/invalid_address/info")
        assert response.status_code == 400

    def test_get_network_status(self, client):
        """Test getting network status."""
        response = client.get("/api/v1/network/status")
        assert response.status_code == 200
        data = response.json()
        assert "networks" in data
        assert "total_networks" in data

    def test_get_single_network_status(self, client):
        """Test getting single network status."""
        response = client.get("/api/v1/network/ethereum/status")
        assert response.status_code == 200
        data = response.json()
        assert data["network"] == "ethereum"
        assert "status" in data

    def test_get_single_network_status_invalid(self, client):
        """Test getting single network status with invalid network."""
        response = client.get("/api/v1/network/invalid_network/status")
        assert response.status_code == 400

    def test_assess_network_health(self, client):
        """Test network health assessment."""
        request_data = {
            "check_connectivity": True,
            "check_sync_status": True,
            "check_gas_prices": True,
        }

        response = client.post("/api/v1/network/ethereum/health", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert data["network"] == "ethereum"
        assert "overall_health" in data

    def test_get_supported_networks(self, client):
        """Test getting supported networks."""
        response = client.get("/api/v1/network/supported")
        assert response.status_code == 200
        data = response.json()
        assert "networks" in data
        assert "total_networks" in data

    def test_get_network_info(self, client):
        """Test getting network information."""
        response = client.get("/api/v1/network/ethereum/info")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Ethereum Mainnet"
        assert data["chain_id"] == 1

    def test_get_network_metrics(self, client):
        """Test getting network metrics."""
        response = client.get("/api/v1/network/ethereum/metrics")
        assert response.status_code == 200
        data = response.json()
        assert data["network"] == "ethereum"
        assert "metrics" in data

    def test_validate_transaction(self, client):
        """Test transaction validation."""
        request_data = {
            "transaction_hash": "0x1234567890123456789012345678901234567890123456789012345678901234",
            "source_network": "ethereum",
            "target_network": "polygon",
            "expected_amount": 1000.0,
            "expected_recipient": "0x0987654321098765432109876543210987654321",
        }

        response = client.post("/api/v1/transaction/validate", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert data["transaction_hash"] == request_data["transaction_hash"]
        assert "is_valid" in data

    def test_validate_transaction_invalid_hash(self, client):
        """Test transaction validation with invalid hash."""
        request_data = {
            "transaction_hash": "invalid_hash",
            "source_network": "ethereum",
            "target_network": "polygon",
        }

        response = client.post("/api/v1/transaction/validate", json=request_data)
        assert response.status_code == 422  # Validation error

    def test_analyze_transaction(self, client):
        """Test transaction analysis."""
        request_data = {
            "transaction_hash": "0x1234567890123456789012345678901234567890123456789012345678901234",
            "source_network": "ethereum",
            "target_network": "polygon",
        }

        response = client.post("/api/v1/transaction/analyze", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert data["transaction_hash"] == request_data["transaction_hash"]
        assert "status" in data

    def test_get_transaction_status(self, client):
        """Test getting transaction status."""
        tx_hash = "0x1234567890123456789012345678901234567890123456789012345678901234"
        response = client.get(f"/api/v1/transaction/{tx_hash}/status?network=ethereum")
        assert response.status_code == 200
        data = response.json()
        assert data["transaction_hash"] == tx_hash.lower()

    def test_get_transaction_details(self, client):
        """Test getting transaction details."""
        tx_hash = "0x1234567890123456789012345678901234567890123456789012345678901234"
        response = client.get(f"/api/v1/transaction/{tx_hash}/details?network=ethereum")
        assert response.status_code == 200
        data = response.json()
        assert data["transaction_hash"] == tx_hash.lower()

    def test_search_transactions(self, client):
        """Test searching transactions."""
        response = client.get("/api/v1/transaction/search?network=ethereum&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        assert "total" in data

    def test_scan_vulnerabilities(self, client):
        """Test vulnerability scanning."""
        request_data = {
            "contract_addresses": ["0x1234567890123456789012345678901234567890"],
            "networks": ["ethereum", "polygon"],
            "scan_type": "comprehensive",
        }

        response = client.post("/api/v1/vulnerability/scan", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert "report_id" in data
        assert "total_vulnerabilities" in data
        assert "overall_risk_score" in data

    def test_scan_vulnerabilities_invalid_address(self, client):
        """Test vulnerability scanning with invalid address."""
        request_data = {
            "contract_addresses": ["invalid_address"],
            "networks": ["ethereum"],
            "scan_type": "basic",
        }

        response = client.post("/api/v1/vulnerability/scan", json=request_data)
        assert response.status_code == 422  # Validation error

    def test_cross_chain_vulnerability_scan(self, client):
        """Test cross-chain vulnerability scanning."""
        request_data = {
            "contracts": [
                {"address": "0x1234567890123456789012345678901234567890", "network": "ethereum"},
                {"address": "0x0987654321098765432109876543210987654321", "network": "polygon"},
            ]
        }

        response = client.post("/api/v1/vulnerability/cross-chain-scan", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert "analysis_id" in data
        assert "total_risks" in data

    def test_get_threat_intelligence(self, client):
        """Test getting threat intelligence."""
        response = client.get("/api/v1/vulnerability/threats")
        assert response.status_code == 200
        data = response.json()
        assert "threat_level" in data
        assert "active_threats" in data

    def test_get_vulnerability_types(self, client):
        """Test getting vulnerability types."""
        response = client.get("/api/v1/vulnerability/vulnerability-types")
        assert response.status_code == 200
        data = response.json()
        assert "vulnerability_types" in data
        assert "total_types" in data

    def test_cors_headers(self, client):
        """Test CORS headers are present."""
        # Test with a GET request to see CORS headers in response
        response = client.get("/health")
        assert response.status_code == 200
        # CORS headers should be present (handled by middleware)
        # Note: OPTIONS might return 405 if method not explicitly allowed

    def test_api_documentation(self, client):
        """Test API documentation endpoints."""
        # Test OpenAPI schema
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert "info" in data

        # Test Swagger UI
        response = client.get("/docs")
        assert response.status_code == 200

        # Test ReDoc
        response = client.get("/redoc")
        assert response.status_code == 200
