#!/usr/bin/env python3
"""
End-to-End Tests for Bridge Service Integration
Requires bridge service to be running
"""

import pytest
import httpx
import os
from app.core.bridge_service_client import get_bridge_service_client
from app.core.cross_chain_bridge_integration import get_cross_chain_bridge_integration


# Skip if bridge service not available
BRIDGE_SERVICE_URL = os.getenv("BRIDGE_SERVICE_URL", "http://localhost:8000")
SKIP_IF_NO_SERVICE = pytest.mark.skipif(
    not os.getenv("RUN_E2E_TESTS", "false").lower() == "true",
    reason="E2E tests require bridge service running"
)


@SKIP_IF_NO_SERVICE
class TestBridgeServiceE2E:
    """End-to-end tests requiring bridge service"""
    
    @pytest.fixture
    async def client(self):
        """Get bridge service client"""
        client = get_bridge_service_client()
        yield client
        await client.close()
    
    @pytest.mark.asyncio
    async def test_health_check(self, client):
        """Test health check endpoint"""
        health = await client.health_check()
        assert "status" in health
        print(f"Bridge service health: {health}")
    
    @pytest.mark.asyncio
    async def test_get_supported_networks(self, client):
        """Test getting supported networks"""
        networks = await client.get_supported_networks()
        assert isinstance(networks, (list, dict))
        print(f"Supported networks: {networks}")
    
    @pytest.mark.asyncio
    async def test_get_network_status(self, client):
        """Test getting network status"""
        status = await client.get_network_status()
        assert isinstance(status, dict)
        print(f"Network status: {status}")
    
    @pytest.mark.asyncio
    async def test_list_bridges(self, client):
        """Test listing bridges"""
        bridges = await client.list_bridges(limit=5)
        assert "bridges" in bridges or isinstance(bridges, list)
        print(f"Found bridges: {len(bridges.get('bridges', bridges) if isinstance(bridges, dict) else bridges)}")


@SKIP_IF_NO_SERVICE
class TestBridgeIntegrationE2E:
    """End-to-end tests for bridge integration"""
    
    @pytest.fixture
    async def integration(self):
        """Get bridge integration"""
        integration = get_cross_chain_bridge_integration()
        await integration.initialize()
        yield integration
    
    @pytest.mark.asyncio
    async def test_initialization(self, integration):
        """Test integration initialization"""
        assert integration.initialized is True
        assert len(integration.supported_networks) > 0
        print(f"Integration initialized with {len(integration.supported_networks)} networks")
    
    @pytest.mark.asyncio
    async def test_get_supported_networks(self, integration):
        """Test getting supported networks"""
        networks = await integration.get_supported_networks()
        assert isinstance(networks, list)
        assert len(networks) > 0
        print(f"Supported networks: {networks}")


class TestBridgeServiceDirectHTTP:
    """Direct HTTP tests for bridge service"""
    
    @pytest.mark.asyncio
    async def test_bridge_service_health_direct(self):
        """Test bridge service health directly"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{BRIDGE_SERVICE_URL}/health")
                if response.status_code == 200:
                    data = response.json()
                    assert "status" in data
                    print(f"✅ Bridge service is healthy: {data}")
                    return True
                else:
                    print(f"⚠️ Bridge service returned {response.status_code}")
                    return False
        except Exception as e:
            print(f"❌ Bridge service not available: {e}")
            print(f"   URL: {BRIDGE_SERVICE_URL}")
            print(f"   To run E2E tests, start bridge service and set RUN_E2E_TESTS=true")
            return False
    
    @pytest.mark.asyncio
    async def test_bridge_service_api_direct(self):
        """Test bridge service API directly"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                # Test root endpoint
                response = await client.get(f"{BRIDGE_SERVICE_URL}/")
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Bridge service API accessible: {data.get('service', 'Unknown')}")
                    return True
                else:
                    print(f"⚠️ Bridge service API returned {response.status_code}")
                    return False
        except Exception as e:
            print(f"❌ Bridge service API not available: {e}")
            return False


if __name__ == "__main__":
    import asyncio
    
    async def run_quick_tests():
        """Run quick connectivity tests"""
        print("=" * 60)
        print("Testing Bridge Service Integration")
        print("=" * 60)
        
        # Test direct HTTP
        print("\n1. Testing direct HTTP connection...")
        http_test = TestBridgeServiceDirectHTTP()
        health_ok = await http_test.test_bridge_service_health_direct()
        api_ok = await http_test.test_bridge_service_api_direct()
        
        if health_ok and api_ok:
            print("\n✅ Bridge service is running and accessible!")
            print("\n2. Running integration tests...")
            
            # Test integration
            integration = get_cross_chain_bridge_integration()
            await integration.initialize()
            
            if integration.initialized:
                print(f"✅ Integration initialized successfully")
                print(f"   Supported networks: {len(integration.supported_networks)}")
                networks = await integration.get_supported_networks()
                print(f"   Networks: {networks}")
            else:
                print("⚠️ Integration initialization failed")
        else:
            print("\n❌ Bridge service is not running")
            print("   Start it with: cd cross-chain-bridge-service && uvicorn src.api.main:app --host 0.0.0.0 --port 8000")
        
        print("\n" + "=" * 60)
    
    asyncio.run(run_quick_tests())

