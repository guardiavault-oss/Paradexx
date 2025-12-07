#!/usr/bin/env python3
"""
Simple Bridge Service Test - No imports required
Tests the bridge service directly via HTTP
"""

import asyncio
import httpx
import os
import json


async def test_bridge_service():
    """Test bridge service connectivity"""
    print("\n" + "=" * 70)
    print("BRIDGE SERVICE INTEGRATION TEST")
    print("=" * 70)
    
    bridge_service_url = os.getenv("BRIDGE_SERVICE_URL", "http://localhost:8000")
    paradox_api_url = os.getenv("PARADOX_API_URL", "http://localhost:8000")
    
    results = []
    
    # Test 1: Bridge Service Health
    print("\n[TEST 1] Testing Bridge Service Health...")
    print(f"   URL: {bridge_service_url}/health")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{bridge_service_url}/health")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ SUCCESS: Bridge service is healthy")
                print(f"      Status: {data.get('status', 'unknown')}")
                print(f"      Service: {data.get('service', 'unknown')}")
                results.append(("Bridge Service Health", True))
            else:
                print(f"   ⚠️  WARNING: Status {response.status_code}")
                results.append(("Bridge Service Health", False))
    except httpx.ConnectError:
        print(f"   ❌ FAILED: Cannot connect to {bridge_service_url}")
        print(f"      → Start bridge service: cd cross-chain-bridge-service && uvicorn src.api.main:app --host 0.0.0.0 --port 8000")
        results.append(("Bridge Service Health", False))
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
        results.append(("Bridge Service Health", False))
    
    # Test 2: Bridge Service Root
    print("\n[TEST 2] Testing Bridge Service Root Endpoint...")
    print(f"   URL: {bridge_service_url}/")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{bridge_service_url}/")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ SUCCESS: Bridge service API accessible")
                print(f"      Service: {data.get('service', 'unknown')}")
                print(f"      Version: {data.get('version', 'unknown')}")
                results.append(("Bridge Service API", True))
            else:
                print(f"   ⚠️  WARNING: Status {response.status_code}")
                results.append(("Bridge Service API", False))
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
        results.append(("Bridge Service API", False))
    
    # Test 3: Bridge Service Supported Networks
    print("\n[TEST 3] Testing Bridge Service Supported Networks...")
    print(f"   URL: {bridge_service_url}/api/v1/network/supported")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{bridge_service_url}/api/v1/network/supported")
            if response.status_code == 200:
                data = response.json()
                networks = data.get('data', data) if isinstance(data, dict) else data
                print(f"   ✅ SUCCESS: Supported networks endpoint working")
                if isinstance(networks, list):
                    print(f"      Networks ({len(networks)}): {', '.join(networks[:5])}{'...' if len(networks) > 5 else ''}")
                else:
                    print(f"      Response: {networks}")
                results.append(("Supported Networks", True))
            else:
                print(f"   ⚠️  WARNING: Status {response.status_code}")
                results.append(("Supported Networks", False))
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
        results.append(("Supported Networks", False))
    
    # Test 4: Bridge Service List Bridges
    print("\n[TEST 4] Testing Bridge Service List Bridges...")
    print(f"   URL: {bridge_service_url}/api/v1/bridge/list")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{bridge_service_url}/api/v1/bridge/list?limit=5")
            if response.status_code == 200:
                data = response.json()
                bridges = data.get('bridges', [])
                print(f"   ✅ SUCCESS: List bridges endpoint working")
                print(f"      Found {len(bridges)} bridges")
                if bridges:
                    print(f"      Example: {bridges[0].get('name', 'Unknown')} ({bridges[0].get('address', 'N/A')[:10]}...)")
                results.append(("List Bridges", True))
            else:
                print(f"   ⚠️  WARNING: Status {response.status_code}")
                results.append(("List Bridges", False))
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
        results.append(("List Bridges", False))
    
    # Test 5: Paradox Bridge Service Endpoint
    print("\n[TEST 5] Testing Paradox Bridge Service Endpoint...")
    print(f"   URL: {paradox_api_url}/api/bridge-service/health")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{paradox_api_url}/api/bridge-service/health")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ SUCCESS: Paradox bridge service endpoint accessible")
                print(f"      Response: {json.dumps(data, indent=2)[:200]}...")
                results.append(("Paradox Bridge Endpoint", True))
            elif response.status_code == 401:
                print(f"   ⚠️  AUTH REQUIRED: Endpoint exists but needs authentication (expected)")
                print(f"      This is normal - endpoint is protected")
                results.append(("Paradox Bridge Endpoint", True))  # Count as success since endpoint exists
            elif response.status_code == 404:
                print(f"   ❌ FAILED: Endpoint not found (404)")
                print(f"      → Check that bridge_service_endpoints.py is imported in main_comprehensive.py")
                results.append(("Paradox Bridge Endpoint", False))
            else:
                print(f"   ⚠️  WARNING: Status {response.status_code}")
                results.append(("Paradox Bridge Endpoint", False))
    except httpx.ConnectError:
        print(f"   ❌ FAILED: Cannot connect to Paradox API at {paradox_api_url}")
        print(f"      → Start Paradox API: uvicorn app.api.main_comprehensive:app --host 0.0.0.0 --port 8000")
        results.append(("Paradox Bridge Endpoint", False))
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
        results.append(("Paradox Bridge Endpoint", False))
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST RESULTS SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}  {test_name}")
    
    print(f"\n  Total: {passed}/{total} tests passed")
    print("=" * 70)
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("   Bridge service integration is working correctly.")
        return 0
    elif passed > 0:
        print(f"\n⚠️  PARTIAL SUCCESS: {passed}/{total} tests passed")
        print("   Some services may not be running.")
        print("\n   To run all tests:")
        print("   1. Start bridge service:")
        print("      cd cross-chain-bridge-service")
        print("      uvicorn src.api.main:app --host 0.0.0.0 --port 8000")
        print("\n   2. Start Paradox API (in another terminal):")
        print("      uvicorn app.api.main_comprehensive:app --host 0.0.0.0 --port 8000")
        return 1
    else:
        print("\n❌ ALL TESTS FAILED")
        print("   Bridge service is not running.")
        print("\n   Start it with:")
        print("   cd cross-chain-bridge-service")
        print("   uvicorn src.api.main:app --host 0.0.0.0 --port 8000")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(test_bridge_service())
    exit(exit_code)

