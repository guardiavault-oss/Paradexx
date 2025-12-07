#!/usr/bin/env python3
"""
Quick Test Script for Bridge Service Integration
Run from project root: python test_bridge_integration.py
"""

import sys
import os
import asyncio
import httpx
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Try to import bridge service client
try:
    from app.core.bridge_service_client import get_bridge_service_client
    from app.core.cross_chain_bridge_integration import get_cross_chain_bridge_integration
    IMPORTS_OK = True
except ImportError as e:
    print(f"⚠️ Import error: {e}")
    print("   Make sure you're running from project root")
    IMPORTS_OK = False


async def test_bridge_service_health():
    """Test bridge service health directly"""
    print("\n" + "=" * 60)
    print("TEST 1: Bridge Service Health Check")
    print("=" * 60)
    
    bridge_service_url = os.getenv("BRIDGE_SERVICE_URL", "http://localhost:8000")
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{bridge_service_url}/health")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Bridge service is healthy!")
                print(f"   Status: {data.get('status', 'unknown')}")
                print(f"   Service: {data.get('service', 'unknown')}")
                return True
            else:
                print(f"⚠️ Bridge service returned status {response.status_code}")
                return False
    except httpx.ConnectError:
        print(f"❌ Cannot connect to bridge service at {bridge_service_url}")
        print("   Start it with: cd cross-chain-bridge-service && uvicorn src.api.main:app --host 0.0.0.0 --port 8000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


async def test_bridge_service_api():
    """Test bridge service API endpoints"""
    print("\n" + "=" * 60)
    print("TEST 2: Bridge Service API Endpoints")
    print("=" * 60)
    
    bridge_service_url = os.getenv("BRIDGE_SERVICE_URL", "http://localhost:8000")
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Test root endpoint
            response = await client.get(f"{bridge_service_url}/")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Bridge service API is accessible")
                print(f"   Service: {data.get('service', 'unknown')}")
                print(f"   Version: {data.get('version', 'unknown')}")
                
                # Test supported networks endpoint
                try:
                    networks_response = await client.get(f"{bridge_service_url}/api/v1/network/supported")
                    if networks_response.status_code == 200:
                        networks_data = networks_response.json()
                        print(f"✅ Supported networks endpoint working")
                        print(f"   Networks: {networks_data.get('data', 'N/A')}")
                except Exception as e:
                    print(f"⚠️ Networks endpoint test failed: {e}")
                
                return True
            else:
                print(f"⚠️ Bridge service API returned status {response.status_code}")
                return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


async def test_paradox_integration():
    """Test Paradox bridge service integration"""
    print("\n" + "=" * 60)
    print("TEST 3: Paradox Bridge Service Integration")
    print("=" * 60)
    
    if not IMPORTS_OK:
        print("❌ Cannot test integration - imports failed")
        return False
    
    try:
        # Test bridge service client
        client = get_bridge_service_client()
        health = await client.health_check()
        
        if health.get("status") == "healthy":
            print("✅ Bridge service client initialized")
            print(f"   Health: {health.get('status')}")
        else:
            print(f"⚠️ Bridge service client health check: {health}")
        
        # Test integration layer
        integration = get_cross_chain_bridge_integration()
        await integration.initialize()
        
        if integration.initialized:
            print("✅ Bridge integration initialized")
            print(f"   Supported networks: {len(integration.supported_networks)}")
            
            # Get supported networks
            networks = await integration.get_supported_networks()
            print(f"   Networks: {networks}")
            
            await client.close()
            return True
        else:
            print("⚠️ Bridge integration initialization failed")
            await client.close()
            return False
            
    except Exception as e:
        print(f"❌ Integration test error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_paradox_api_endpoints():
    """Test Paradox API endpoints"""
    print("\n" + "=" * 60)
    print("TEST 4: Paradox API Bridge Endpoints")
    print("=" * 60)
    
    paradox_api_url = os.getenv("PARADOX_API_URL", "http://localhost:8000")
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Test health endpoint
            response = await client.get(f"{paradox_api_url}/api/bridge-service/health")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Paradox bridge service endpoint is accessible")
                print(f"   Response: {data.get('data', data)}")
                return True
            elif response.status_code == 401:
                print("⚠️ Endpoint requires authentication (expected)")
                print("   Endpoint exists but needs auth token")
                return True
            else:
                print(f"⚠️ Endpoint returned status {response.status_code}")
                return False
    except httpx.ConnectError:
        print(f"❌ Cannot connect to Paradox API at {paradox_api_url}")
        print("   Start it with: uvicorn app.api.main_comprehensive:app --host 0.0.0.0 --port 8000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


async def run_all_tests():
    """Run all tests"""
    print("\n" + "🔍 " * 30)
    print("BRIDGE SERVICE INTEGRATION TESTS")
    print("🔍 " * 30)
    
    results = []
    
    # Test 1: Bridge service health
    results.append(("Bridge Service Health", await test_bridge_service_health()))
    
    # Test 2: Bridge service API
    results.append(("Bridge Service API", await test_bridge_service_api()))
    
    # Test 3: Paradox integration
    results.append(("Paradox Integration", await test_paradox_integration()))
    
    # Test 4: Paradox API endpoints
    results.append(("Paradox API Endpoints", await test_paradox_api_endpoints()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Integration is working correctly.")
    elif passed > 0:
        print(f"\n⚠️ {passed}/{total} tests passed. Some services may not be running.")
        print("   Make sure bridge service and Paradox API are both running.")
    else:
        print("\n❌ No tests passed. Check that services are running.")
        print("\nTo start services:")
        print("1. Bridge Service: cd cross-chain-bridge-service && uvicorn src.api.main:app --host 0.0.0.0 --port 8000")
        print("2. Paradox API: uvicorn app.api.main_comprehensive:app --host 0.0.0.0 --port 8000")
    
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_all_tests())

