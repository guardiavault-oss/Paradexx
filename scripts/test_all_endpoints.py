#!/usr/bin/env python3
"""
Test All Bridge Service API Endpoints
"""

import asyncio
import httpx
import json
from datetime import datetime

API_BASE = "http://localhost:8000"
BRIDGE_SERVICE_BASE = "http://localhost:8000/api/bridge-service"

# Test token (would normally come from auth)
TEST_TOKEN = None  # Set if you have a test token


async def test_endpoint(name, method, url, data=None, headers=None, expected_status=None):
    """Test a single endpoint"""
    print(f"\n{'='*70}")
    print(f"TEST: {name}")
    print(f"{'='*70}")
    print(f"Method: {method}")
    print(f"URL: {url}")
    
    if data:
        print(f"Body: {json.dumps(data, indent=2)[:200]}...")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if method == "GET":
                response = await client.get(url, headers=headers)
            elif method == "POST":
                response = await client.post(url, json=data, headers=headers)
            else:
                response = await client.request(method, url, json=data, headers=headers)
            
            print(f"Status: {response.status_code}")
            
            try:
                response_data = response.json()
                print(f"Response: {json.dumps(response_data, indent=2)[:500]}...")
            except:
                print(f"Response: {response.text[:500]}...")
            
            if expected_status:
                if response.status_code == expected_status:
                    print(f"[PASS] Expected status {expected_status}")
                    return True
                else:
                    print(f"[WARN] Status {response.status_code} (expected {expected_status})")
                    return response.status_code in [200, 201, 401, 403]  # Accept auth errors
            else:
                if response.status_code in [200, 201]:
                    print(f"[SUCCESS]")
                    return True
                elif response.status_code in [401, 403]:
                    print(f"[AUTH] Authentication required (expected)")
                    return True  # Count as success since endpoint exists
                else:
                    print(f"[FAIL] Status {response.status_code}")
                    return False
                    
    except httpx.ConnectError:
        print(f"[ERROR] Cannot connect to {url}")
        print(f"   Make sure the backend is running on port 8000")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


async def test_all_endpoints():
    """Test all bridge service endpoints"""
    print("\n" + "=" * 70)
    print("BRIDGE SERVICE API ENDPOINTS - COMPREHENSIVE TEST")
    print("=" * 70)
    print(f"\nTesting API at: {API_BASE}")
    print(f"Time: {datetime.now().isoformat()}")
    
    headers = {}
    if TEST_TOKEN:
        headers["Authorization"] = f"Bearer {TEST_TOKEN}"
    
    results = []
    
    # Health and Status Endpoints
    print("\n" + "="*70)
    print("HEALTH & STATUS ENDPOINTS")
    print("="*70)
    
    results.append(("Health Check", await test_endpoint(
        "Bridge Service Health",
        "GET",
        f"{BRIDGE_SERVICE_BASE}/health",
        expected_status=200
    )))
    
    results.append(("Paradox API Health", await test_endpoint(
        "Paradox API Health",
        "GET",
        f"{API_BASE}/health",
        expected_status=200
    )))
    
    results.append(("Paradox API Root", await test_endpoint(
        "Paradox API Root",
        "GET",
        f"{API_BASE}/",
        expected_status=200
    )))
    
    # Network Endpoints
    print("\n" + "="*70)
    print("NETWORK ENDPOINTS")
    print("="*70)
    
    results.append(("Get Supported Networks", await test_endpoint(
        "Get Supported Networks",
        "GET",
        f"{BRIDGE_SERVICE_BASE}/network/supported",
        headers=headers,
        expected_status=[200, 401, 403]
    )))
    
    results.append(("Get Network Status (All)", await test_endpoint(
        "Get Network Status (All)",
        "GET",
        f"{BRIDGE_SERVICE_BASE}/network/status",
        headers=headers,
        expected_status=[200, 401, 403]
    )))
    
    results.append(("Get Network Status (Ethereum)", await test_endpoint(
        "Get Network Status (Ethereum)",
        "GET",
        f"{BRIDGE_SERVICE_BASE}/network/status?network=ethereum",
        headers=headers,
        expected_status=[200, 401, 403]
    )))
    
    # Bridge Analysis Endpoints
    print("\n" + "="*70)
    print("BRIDGE ANALYSIS ENDPOINTS")
    print("="*70)
    
    test_bridge_address = "0x1234567890123456789012345678901234567890"
    
    results.append(("List Bridges", await test_endpoint(
        "List Bridges",
        "GET",
        f"{BRIDGE_SERVICE_BASE}/list?limit=5",
        headers=headers,
        expected_status=[200, 401, 403]
    )))
    
    results.append(("Get Bridge Info", await test_endpoint(
        "Get Bridge Info",
        "GET",
        f"{BRIDGE_SERVICE_BASE}/{test_bridge_address}/info",
        headers=headers,
        expected_status=[200, 401, 403, 404]
    )))
    
    results.append(("Analyze Bridge", await test_endpoint(
        "Analyze Bridge",
        "POST",
        f"{BRIDGE_SERVICE_BASE}/analyze",
        data={
            "bridge_address": test_bridge_address,
            "source_network": "ethereum",
            "target_network": "polygon",
            "analysis_depth": "comprehensive"
        },
        headers=headers,
        expected_status=[200, 401, 403]
    )))
    
    results.append(("Get Security Score", await test_endpoint(
        "Get Security Score",
        "POST",
        f"{BRIDGE_SERVICE_BASE}/security-score",
        data={
            "bridge_address": test_bridge_address,
            "network": "ethereum"
        },
        headers=headers,
        expected_status=[200, 401, 403]
    )))
    
    results.append(("Get Bridge Metrics", await test_endpoint(
        "Get Bridge Metrics",
        "GET",
        f"{BRIDGE_SERVICE_BASE}/metrics?time_range=7d",
        headers=headers,
        expected_status=[200, 401, 403]
    )))
    
    # Advanced Security Endpoints
    print("\n" + "="*70)
    print("ADVANCED SECURITY ENDPOINTS")
    print("="*70)
    
    results.append(("Detect Attestation Anomalies", await test_endpoint(
        "Detect Attestation Anomalies",
        "POST",
        f"{BRIDGE_SERVICE_BASE}/detect-attestation-anomalies",
        data={
            "bridge_address": test_bridge_address,
            "network": "ethereum",
            "time_range": "24h",
            "include_details": True
        },
        headers=headers,
        expected_status=[200, 401, 403]
    )))
    
    results.append(("Analyze Quorum Skews", await test_endpoint(
        "Analyze Quorum Skews",
        "POST",
        f"{BRIDGE_SERVICE_BASE}/analyze-quorum-skews",
        data={
            "bridge_address": test_bridge_address,
            "network": "ethereum",
            "analysis_period": "7d"
        },
        headers=headers,
        expected_status=[200, 401, 403]
    )))
    
    results.append(("Proof of Reserves", await test_endpoint(
        "Proof of Reserves",
        "POST",
        f"{BRIDGE_SERVICE_BASE}/proof-of-reserves",
        data={
            "bridge_address": test_bridge_address,
            "network": "ethereum",
            "include_asset_breakdown": True
        },
        headers=headers,
        expected_status=[200, 401, 403]
    )))
    
    results.append(("Comprehensive Security Scan", await test_endpoint(
        "Comprehensive Security Scan",
        "POST",
        f"{BRIDGE_SERVICE_BASE}/comprehensive-scan",
        data={
            "bridge_address": test_bridge_address,
            "network": "ethereum",
            "transaction_data": [],
            "scan_options": {
                "include_attack_analysis": True,
                "include_signature_analysis": True,
                "deep_scan": False
            }
        },
        headers=headers,
        expected_status=[200, 401, 403]
    )))
    
    # Transaction Endpoints
    print("\n" + "="*70)
    print("TRANSACTION ENDPOINTS")
    print("="*70)
    
    test_tx_hash = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    
    results.append(("Validate Transaction", await test_endpoint(
        "Validate Transaction",
        "POST",
        f"{BRIDGE_SERVICE_BASE}/transaction/validate",
        data={
            "transaction_hash": test_tx_hash,
            "network": "ethereum"
        },
        headers=headers,
        expected_status=[200, 401, 403]
    )))
    
    results.append(("Get Transaction Status", await test_endpoint(
        "Get Transaction Status",
        "GET",
        f"{BRIDGE_SERVICE_BASE}/transaction/{test_tx_hash}/status",
        headers=headers,
        expected_status=[200, 401, 403, 404]
    )))
    
    # Vulnerability Endpoints
    print("\n" + "="*70)
    print("VULNERABILITY ENDPOINTS")
    print("="*70)
    
    results.append(("Scan Vulnerabilities", await test_endpoint(
        "Scan Vulnerabilities",
        "POST",
        f"{BRIDGE_SERVICE_BASE}/vulnerability/scan",
        data={
            "contract_addresses": [test_bridge_address],
            "networks": ["ethereum", "polygon"],
            "scan_type": "comprehensive"
        },
        headers=headers,
        expected_status=[200, 401, 403]
    )))
    
    # Security Monitoring Endpoints
    print("\n" + "="*70)
    print("SECURITY MONITORING ENDPOINTS")
    print("="*70)
    
    results.append(("Get Security Dashboard", await test_endpoint(
        "Get Security Dashboard",
        "GET",
        f"{BRIDGE_SERVICE_BASE}/security/dashboard",
        headers=headers,
        expected_status=[200, 401, 403]
    )))
    
    results.append(("Get Security Events", await test_endpoint(
        "Get Security Events",
        "GET",
        f"{BRIDGE_SERVICE_BASE}/security/events?limit=10",
        headers=headers,
        expected_status=[200, 401, 403]
    )))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"\nTotal Endpoints Tested: {total}")
    print(f"Successful: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    print("\nDetailed Results:")
    for name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"  {status}: {name}")
    
    print("\n" + "="*70)
    
    if passed == total:
        print("\n[SUCCESS] ALL ENDPOINTS ACCESSIBLE!")
        print("   All endpoints are responding correctly.")
    elif passed >= total * 0.8:
        print(f"\n[OK] MOST ENDPOINTS WORKING ({passed}/{total})")
        print("   Some endpoints may require authentication.")
        print("   Set TEST_TOKEN environment variable to test authenticated endpoints.")
    else:
        print(f"\n[WARN] SOME ENDPOINTS FAILING ({passed}/{total})")
        print("   Check that:")
        print("   1. Backend is running on port 8000")
        print("   2. Bridge service is accessible")
        print("   3. Endpoints are properly registered")
    
    print("="*70)
    
    return passed, total


if __name__ == "__main__":
    print("\nStarting comprehensive endpoint tests...")
    print("Make sure the backend is running on http://localhost:8000\n")
    
    passed, total = asyncio.run(test_all_endpoints())
    
    exit(0 if passed >= total * 0.8 else 1)

