#!/usr/bin/env python3
"""
Tests for Cross-Chain Bridge Service Integration
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from app.core.bridge_service_client import BridgeServiceClient, get_bridge_service_client
from app.core.cross_chain_bridge_integration import CrossChainBridgeIntegration
from app.api.bridge_service_endpoints import router


class TestBridgeServiceClient:
    """Test bridge service client"""
    
    @pytest.fixture
    def client(self):
        """Create bridge service client"""
        return BridgeServiceClient(base_url="http://localhost:8000")
    
    @pytest.mark.asyncio
    async def test_health_check_success(self, client):
        """Test successful health check"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"status": "healthy"}
            mock_response.raise_for_status = MagicMock()
            
            mock_client_instance = AsyncMock()
            mock_client_instance.get = AsyncMock(return_value=mock_response)
            mock_client_instance.aclose = AsyncMock()
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            result = await client.health_check()
            assert result["status"] == "healthy"
    
    @pytest.mark.asyncio
    async def test_analyze_bridge(self, client):
        """Test bridge analysis"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "bridge_address": "0x1234...",
                "security_score": 85,
                "risk_level": "medium"
            }
            mock_response.raise_for_status = MagicMock()
            
            mock_client_instance = AsyncMock()
            mock_client_instance.post = AsyncMock(return_value=mock_response)
            mock_client_instance.aclose = AsyncMock()
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            result = await client.analyze_bridge(
                bridge_address="0x1234...",
                source_network="ethereum",
                target_network="polygon"
            )
            assert result["security_score"] == 85
            assert result["risk_level"] == "medium"
    
    @pytest.mark.asyncio
    async def test_get_security_score(self, client):
        """Test getting security score"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "overall_score": 85,
                "scores": {"code_quality": 90}
            }
            mock_response.raise_for_status = MagicMock()
            
            mock_client_instance = AsyncMock()
            mock_client_instance.post = AsyncMock(return_value=mock_response)
            mock_client_instance.aclose = AsyncMock()
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            result = await client.get_bridge_security_score(
                bridge_address="0x1234...",
                network="ethereum"
            )
            assert result["overall_score"] == 85
    
    @pytest.mark.asyncio
    async def test_comprehensive_scan(self, client):
        """Test comprehensive security scan"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "overall_risk_score": 3.5,
                "risk_level": "medium",
                "alerts": []
            }
            mock_response.raise_for_status = MagicMock()
            
            mock_client_instance = AsyncMock()
            mock_client_instance.post = AsyncMock(return_value=mock_response)
            mock_client_instance.aclose = AsyncMock()
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            result = await client.comprehensive_security_scan(
                bridge_address="0x1234...",
                network="ethereum"
            )
            assert result["overall_risk_score"] == 3.5
    
    @pytest.mark.asyncio
    async def test_get_network_status(self, client):
        """Test getting network status"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "network": "ethereum",
                "status": "operational"
            }
            mock_response.raise_for_status = MagicMock()
            
            mock_client_instance = AsyncMock()
            mock_client_instance.get = AsyncMock(return_value=mock_response)
            mock_client_instance.aclose = AsyncMock()
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            result = await client.get_network_status(network="ethereum")
            assert result["status"] == "operational"
    
    @pytest.mark.asyncio
    async def test_error_handling(self, client):
        """Test error handling"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get = AsyncMock(side_effect=Exception("Connection error"))
            mock_client_instance.aclose = AsyncMock()
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            result = await client.health_check()
            assert result["status"] == "unhealthy"
            assert "error" in result


class TestCrossChainBridgeIntegration:
    """Test bridge integration layer"""
    
    @pytest.fixture
    def integration(self):
        """Create bridge integration"""
        return CrossChainBridgeIntegration()
    
    @pytest.mark.asyncio
    async def test_initialize(self, integration):
        """Test initialization"""
        with patch.object(integration.bridge_client, 'health_check', new_callable=AsyncMock) as mock_health:
            mock_health.return_value = {"status": "healthy"}
            
            with patch.object(integration.bridge_client, 'get_supported_networks', new_callable=AsyncMock) as mock_networks:
                mock_networks.return_value = ["ethereum", "polygon", "arbitrum"]
                
                await integration.initialize()
                
                assert integration.initialized is True
                assert len(integration.supported_networks) > 0
    
    @pytest.mark.asyncio
    async def test_analyze_bridge(self, integration):
        """Test bridge analysis"""
        integration.initialized = True
        
        with patch.object(integration.bridge_client, 'analyze_bridge', new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = {
                "bridge_address": "0x1234...",
                "security_score": 85,
                "risk_level": "medium"
            }
            
            result = await integration.analyze_bridge(
                bridge_address="0x1234...",
                source_network="ethereum",
                target_network="polygon"
            )
            
            assert result["security_score"] == 85
            mock_analyze.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_check_bridge_security(self, integration):
        """Test bridge security check"""
        integration.initialized = True
        
        with patch.object(integration.bridge_client, 'comprehensive_security_scan', new_callable=AsyncMock) as mock_scan:
            mock_scan.return_value = {
                "overall_risk_score": 3.5,
                "risk_level": "medium",
                "alerts": []
            }
            
            result = await integration.check_bridge_security(
                bridge_address="0x1234...",
                network="ethereum"
            )
            
            assert "overall_risk_score" in result or "security_score" in result
            mock_scan.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_network_status(self, integration):
        """Test getting network status"""
        integration.initialized = True
        
        with patch.object(integration.bridge_client, 'get_network_status', new_callable=AsyncMock) as mock_status:
            mock_status.return_value = {
                "network": "ethereum",
                "status": "operational"
            }
            
            result = await integration.get_network_status("ethereum")
            
            assert result["status"] == "operational"
            mock_status.assert_called_once()


class TestBridgeServiceEndpoints:
    """Test bridge service API endpoints"""
    
    @pytest.mark.asyncio
    async def test_health_endpoint(self):
        """Test health endpoint"""
        from fastapi.testclient import TestClient
        from app.api.main_comprehensive import app
        
        client = TestClient(app)
        response = client.get("/api/bridge-service/health")
        
        # Should return 200 or 503 depending on service availability
        assert response.status_code in [200, 503]
    
    @pytest.mark.asyncio
    async def test_get_supported_networks(self):
        """Test getting supported networks"""
        from fastapi.testclient import TestClient
        from app.api.main_comprehensive import app
        
        client = TestClient(app)
        # This would require authentication in real scenario
        # For now, just check endpoint exists
        response = client.get("/api/bridge-service/network/supported")
        
        # Should return 401 (unauthorized) or 200 if no auth required
        assert response.status_code in [200, 401, 403]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

