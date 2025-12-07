#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comprehensive API Endpoint Tester
Tests all endpoints from both FastAPI (port 8000) and TypeScript (port 3001) backends
"""

import sys
import io
# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import asyncio
import httpx
import json
from datetime import datetime
from typing import List, Tuple, Dict, Any
from dataclasses import dataclass

@dataclass
class EndpointTest:
    name: str
    method: str
    url: str
    data: Dict[str, Any] = None
    headers: Dict[str, str] = None
    expected_status: int = 200
    requires_auth: bool = False
    service: str = "FastAPI"  # "FastAPI" or "TypeScript"

class EndpointTester:
    def __init__(self):
        self.fastapi_base = "http://localhost:8000"
        self.typescript_base = "http://localhost:3001"
        self.results: List[Tuple[str, bool, int, str]] = []
        self.auth_token = None
        
    async def test_endpoint(self, test: EndpointTest) -> Tuple[bool, int, str]:
        """Test a single endpoint"""
        headers = test.headers or {}
        if test.requires_auth and self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                if test.method == "GET":
                    response = await client.get(test.url, headers=headers)
                elif test.method == "POST":
                    response = await client.post(test.url, json=test.data, headers=headers)
                elif test.method == "PUT":
                    response = await client.put(test.url, json=test.data, headers=headers)
                elif test.method == "DELETE":
                    response = await client.delete(test.url, headers=headers)
                else:
                    response = await client.request(test.method, test.url, json=test.data, headers=headers)
                
                # Accept 200, 201, 401 (auth required), 403 (forbidden), 404 (not found is ok for some endpoints)
                success = response.status_code in [200, 201] or (
                    response.status_code in [401, 403] and test.requires_auth
                )
                
                error_msg = ""
                if not success and response.status_code not in [401, 403, 404]:
                    try:
                        error_data = response.json()
                        error_msg = str(error_data.get("detail", error_data.get("error", response.text[:200])))
                    except:
                        error_msg = response.text[:200]
                
                return success, response.status_code, error_msg
                
        except httpx.ConnectError:
            return False, 0, f"Cannot connect to {test.url} - Service may not be running"
        except httpx.TimeoutException:
            return False, 0, f"Timeout connecting to {test.url}"
        except Exception as e:
            return False, 0, str(e)[:100]
    
    def get_all_endpoints(self) -> List[EndpointTest]:
        """Get all endpoints to test"""
        endpoints = []
        
        # FastAPI Endpoints (port 8000)
        # Root & Health
        endpoints.append(EndpointTest("FastAPI Root", "GET", f"{self.fastapi_base}/", expected_status=200))
        endpoints.append(EndpointTest("FastAPI Health", "GET", f"{self.fastapi_base}/health", expected_status=200))
        
        # Account Endpoints
        endpoints.append(EndpointTest("Get Account", "GET", f"{self.fastapi_base}/api/account/", requires_auth=True))
        endpoints.append(EndpointTest("Get Wallets", "GET", f"{self.fastapi_base}/api/account/wallets", requires_auth=True))
        endpoints.append(EndpointTest("Get Devices", "GET", f"{self.fastapi_base}/api/account/devices", requires_auth=True))
        endpoints.append(EndpointTest("Get Sessions", "GET", f"{self.fastapi_base}/api/account/sessions", requires_auth=True))
        
        # Settings Endpoints
        endpoints.append(EndpointTest("Get Settings", "GET", f"{self.fastapi_base}/api/settings/", requires_auth=True))
        endpoints.append(EndpointTest("Get App Version", "GET", f"{self.fastapi_base}/api/settings/app-version", expected_status=200))
        
        # Transaction History
        endpoints.append(EndpointTest("Get Transactions", "GET", f"{self.fastapi_base}/api/transactions/", requires_auth=True))
        endpoints.append(EndpointTest("Get Transaction Stats", "GET", f"{self.fastapi_base}/api/transactions/stats/summary", requires_auth=True))
        
        # Notifications
        endpoints.append(EndpointTest("Get Notifications", "GET", f"{self.fastapi_base}/api/notifications/", requires_auth=True))
        endpoints.append(EndpointTest("Get Badge Count", "GET", f"{self.fastapi_base}/api/notifications/badge-count", requires_auth=True))
        
        # Security
        endpoints.append(EndpointTest("Get Security Events", "GET", f"{self.fastapi_base}/api/security/events", requires_auth=True))
        endpoints.append(EndpointTest("Get Wallet Guard Threats", "GET", f"{self.fastapi_base}/api/security/wallet-guard/threats", requires_auth=True))
        
        # Support
        endpoints.append(EndpointTest("Get Help", "GET", f"{self.fastapi_base}/api/support/help", expected_status=200))
        endpoints.append(EndpointTest("Get Support Status", "GET", f"{self.fastapi_base}/api/support/status", expected_status=200))
        
        # Legal
        endpoints.append(EndpointTest("Get Terms of Service", "GET", f"{self.fastapi_base}/api/legal/terms-of-service", expected_status=200))
        endpoints.append(EndpointTest("Get Privacy Policy", "GET", f"{self.fastapi_base}/api/legal/privacy-policy", expected_status=200))
        
        # Error/Network Status
        endpoints.append(EndpointTest("Get Network Status", "GET", f"{self.fastapi_base}/api/errors/network-status", expected_status=200))
        endpoints.append(EndpointTest("Get Maintenance Mode", "GET", f"{self.fastapi_base}/api/errors/maintenance-mode", expected_status=200))
        
        # Bridge Endpoints
        endpoints.append(EndpointTest("Get Bridge Networks", "GET", f"{self.fastapi_base}/api/bridge/networks", expected_status=200))
        endpoints.append(EndpointTest("Get Bridge Network Status", "GET", f"{self.fastapi_base}/api/bridge/network/ethereum/status", expected_status=200))
        
        # Bridge Service Endpoints
        endpoints.append(EndpointTest("Bridge Service Health", "GET", f"{self.fastapi_base}/api/bridge-service/health", expected_status=200))
        endpoints.append(EndpointTest("Get Supported Networks", "GET", f"{self.fastapi_base}/api/bridge-service/network/supported", expected_status=200))
        endpoints.append(EndpointTest("Get Network Status", "GET", f"{self.fastapi_base}/api/bridge-service/network/status", expected_status=200))
        endpoints.append(EndpointTest("List Bridges", "GET", f"{self.fastapi_base}/api/bridge-service/list?limit=5", expected_status=200))
        
        # Wallet Endpoints
        endpoints.append(EndpointTest("Get Wallet Status", "GET", f"{self.fastapi_base}/api/wallet/status", requires_auth=True))
        endpoints.append(EndpointTest("Get Wallet Accounts", "GET", f"{self.fastapi_base}/api/wallet/accounts", requires_auth=True))
        
        # AI/Scarlette Endpoints
        endpoints.append(EndpointTest("Scarlette Health", "GET", f"{self.fastapi_base}/api/scarlette/health", expected_status=200))
        endpoints.append(EndpointTest("Scarlette Greeting", "GET", f"{self.fastapi_base}/api/scarlette/greeting", expected_status=200))
        
        # MEV Endpoints
        endpoints.append(EndpointTest("MEV Status", "GET", f"{self.fastapi_base}/api/mev/status", expected_status=200))
        endpoints.append(EndpointTest("MEV Stats", "GET", f"{self.fastapi_base}/api/mev/stats", expected_status=200))
        
        # Wallet Guard Endpoints
        endpoints.append(EndpointTest("Wallet Guard Health", "GET", f"{self.fastapi_base}/api/wallet-guard/health", expected_status=200))
        endpoints.append(EndpointTest("Wallet Guard Status", "GET", f"{self.fastapi_base}/api/wallet-guard/status", expected_status=200))
        
        # Inheritance Endpoints
        endpoints.append(EndpointTest("Inheritance Health", "GET", f"{self.fastapi_base}/api/inheritance/health", expected_status=200))
        endpoints.append(EndpointTest("Inheritance Stats", "GET", f"{self.fastapi_base}/api/inheritance/stats", expected_status=200))
        
        # Vault Endpoints
        endpoints.append(EndpointTest("Get User Vaults", "GET", f"{self.fastapi_base}/api/vault/user/vaults", requires_auth=True))
        endpoints.append(EndpointTest("Get Global Stats", "GET", f"{self.fastapi_base}/api/vault/stats/global", expected_status=200))
        
        # TypeScript Backend Endpoints (port 3001)
        # Health
        endpoints.append(EndpointTest("TypeScript Health", "GET", f"{self.typescript_base}/health", expected_status=200, service="TypeScript"))
        
        # Auth (public endpoints)
        endpoints.append(EndpointTest("API Root", "GET", f"{self.typescript_base}/api", expected_status=200, service="TypeScript"))
        
        # AI Routes
        endpoints.append(EndpointTest("AI Health", "GET", f"{self.typescript_base}/api/ai/health", expected_status=200, service="TypeScript"))
        
        # Bridge Routes
        endpoints.append(EndpointTest("Bridge Routes Available", "GET", f"{self.typescript_base}/api/bridge", requires_auth=True, service="TypeScript"))
        
        # Security Routes
        endpoints.append(EndpointTest("Security Routes Available", "GET", f"{self.typescript_base}/api/security", requires_auth=True, service="TypeScript"))
        
        # Wallet Guard Routes
        endpoints.append(EndpointTest("Wallet Guard Health (TS)", "GET", f"{self.typescript_base}/api/wallet-guard/health", expected_status=200, service="TypeScript"))
        
        return endpoints
    
    async def run_all_tests(self):
        """Run all endpoint tests"""
        print("\n" + "="*80)
        print("COMPREHENSIVE API ENDPOINT TESTING")
        print("="*80)
        print(f"\nTime: {datetime.now().isoformat()}")
        print(f"FastAPI Base: {self.fastapi_base}")
        print(f"TypeScript Base: {self.typescript_base}\n")
        
        endpoints = self.get_all_endpoints()
        
        # Group by service
        fastapi_endpoints = [e for e in endpoints if e.service == "FastAPI"]
        typescript_endpoints = [e for e in endpoints if e.service == "TypeScript"]
        
        print(f"Total Endpoints to Test: {len(endpoints)}")
        print(f"  - FastAPI: {len(fastapi_endpoints)}")
        print(f"  - TypeScript: {len(typescript_endpoints)}\n")
        
        # Test FastAPI endpoints
        if fastapi_endpoints:
            print("="*80)
            print("TESTING FASTAPI ENDPOINTS (Port 8000)")
            print("="*80)
            for endpoint in fastapi_endpoints:
                success, status, error = await self.test_endpoint(endpoint)
                self.results.append((endpoint.name, success, status, error))
                
                status_icon = "[OK]" if success else "[FAIL]"
                print(f"{status_icon} {endpoint.name:50} {status:3} {error[:50] if error else ''}")
        
        # Test TypeScript endpoints
        if typescript_endpoints:
            print("\n" + "="*80)
            print("TESTING TYPESCRIPT ENDPOINTS (Port 3001)")
            print("="*80)
            for endpoint in typescript_endpoints:
                success, status, error = await self.test_endpoint(endpoint)
                self.results.append((endpoint.name, success, status, error))
                
                status_icon = "[OK]" if success else "[FAIL]"
                print(f"{status_icon} {endpoint.name:50} {status:3} {error[:50] if error else ''}")
        
        # Print summary
        self.print_summary()
        
        # Return failed endpoints for fixing
        failed = [(name, status, error) for name, success, status, error in self.results if not success and status not in [401, 403]]
        return failed
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        
        total = len(self.results)
        passed = sum(1 for _, success, _, _ in self.results if success)
        auth_required = sum(1 for _, success, status, _ in self.results if status in [401, 403] and not success)
        failed = sum(1 for _, success, status, _ in self.results if not success and status not in [401, 403, 404])
        
        print(f"\nTotal Endpoints Tested: {total}")
        print(f"[OK] Successful (200/201): {passed}")
        print(f"[AUTH] Auth Required (401/403): {auth_required}")
        print(f"[FAIL] Failed: {failed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if failed > 0:
            print("\n" + "="*80)
            print("FAILED ENDPOINTS (Need Fixing)")
            print("="*80)
            for name, success, status, error in self.results:
                if not success and status not in [401, 403, 404]:
                    print(f"\n[FAIL] {name}")
                    print(f"  Status: {status}")
                    print(f"  Error: {error[:200]}")
        
        print("\n" + "="*80)

async def main():
    tester = EndpointTester()
    failed = await tester.run_all_tests()
    
    if failed:
        print(f"\n[WARN] Found {len(failed)} endpoints that need fixing")
        return 1
    else:
        print("\n[SUCCESS] All accessible endpoints are working!")
        return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)

