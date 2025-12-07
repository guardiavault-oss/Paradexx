#!/usr/bin/env python3
"""
Test Script for Mempool Services
Tests each service individually before integration
"""

import asyncio
import sys
import time
from pathlib import Path

import httpx
import requests

# Add paths for imports
BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR / "src" / "unified_mempool"))

# Service URLs
MEMPOOL_CORE_URL = "http://localhost:8000"
MEMPOOL_HUB_URL = "http://localhost:8011"
UNIFIED_ENGINE_URL = "http://localhost:8001"


def test_service_health(url: str, service_name: str) -> bool:
    """Test if a service is healthy"""
    try:
        response = requests.get(f"{url}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"[OK] {service_name}: {data.get('status', 'unknown')}")
            return True
        else:
            print(f"[FAIL] {service_name}: HTTP {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"[FAIL] {service_name}: Connection refused (service not running)")
        return False
    except Exception as e:
        print(f"[FAIL] {service_name}: {e}")
        return False


def test_mempool_core():
    """Test mempool-core service"""
    print("\n[TEST] Testing mempool-core (port 8000)...")
    
    if not test_service_health(MEMPOOL_CORE_URL, "mempool-core"):
        return False
    
    # Test additional endpoints
    try:
        # Test root endpoint
        response = requests.get(f"{MEMPOOL_CORE_URL}/", timeout=5)
        if response.status_code == 200:
            print("  [OK] Root endpoint working")
        
        # Test metrics endpoint
        response = requests.get(f"{MEMPOOL_CORE_URL}/metrics", timeout=5)
        if response.status_code == 200:
            print("  [OK] Metrics endpoint working")
        
        return True
    except Exception as e:
        print(f"  [FAIL] Error testing endpoints: {e}")
        return False


def test_mempool_hub():
    """Test mempool-hub service"""
    print("\n[TEST] Testing mempool-hub (port 8011)...")
    
    if not test_service_health(MEMPOOL_HUB_URL, "mempool-hub"):
        return False
    
    # Test additional endpoints
    try:
        # Test stats endpoint
        for network in ["ethereum", "polygon", "arbitrum"]:
            response = requests.get(f"{MEMPOOL_HUB_URL}/stats/{network}", timeout=5)
            if response.status_code == 200:
                print(f"  [OK] Stats endpoint working for {network}")
        
        # Test threats endpoint
        response = requests.get(f"{MEMPOOL_HUB_URL}/threats", timeout=5)
        if response.status_code == 200:
            print("  [OK] Threats endpoint working")
        
        return True
    except Exception as e:
        print(f"  [FAIL] Error testing endpoints: {e}")
        return False


def test_unified_engine():
    """Test unified mempool engine"""
    print("\n[TEST] Testing unified-mempool-engine (port 8001)...")
    
    if not test_service_health(UNIFIED_ENGINE_URL, "unified-engine"):
        return False
    
    # Test additional endpoints
    try:
        # Test dashboard endpoint
        response = requests.get(f"{UNIFIED_ENGINE_URL}/api/v1/dashboard", timeout=5)
        if response.status_code == 200:
            print("  [OK] Dashboard endpoint working")
        
        # Test transactions endpoint
        response = requests.get(f"{UNIFIED_ENGINE_URL}/api/v1/transactions?limit=10", timeout=5)
        if response.status_code == 200:
            print("  [OK] Transactions endpoint working")
        
        return True
    except Exception as e:
        print(f"  [FAIL] Error testing endpoints: {e}")
        return False


async def test_mempool_ingestor():
    """Test mempool-ingestor (async service)"""
    print("\n[TEST] Testing mempool-ingestor...")
    
    try:
        # Add path for ingestor
        import sys
        from pathlib import Path
        BASE_DIR = Path(__file__).parent
        sys.path.insert(0, str(BASE_DIR / "src" / "unified_mempool"))
        
        # Import and test ingestor
        from mempool_ingestor.smart_ingestor import SmartMempoolIngestor
        
        ingestor = SmartMempoolIngestor()
        print("  [OK] Ingestor initialized successfully")
        
        # Test configuration loading
        await ingestor.load_tenant_configs()
        print("  [OK] Tenant configs loaded")
        
        return True
    except ImportError as e:
        print(f"  [WARN] Could not import ingestor (may need dependencies): {e}")
        return False
    except Exception as e:
        print(f"  [FAIL] Error testing ingestor: {e}")
        return False


def main():
    """Run all service tests"""
    # Set UTF-8 encoding for Windows
    import sys
    if sys.platform == "win32":
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    print("=" * 60)
    print("Testing Mempool Services")
    print("=" * 60)
    
    results = {
        "mempool-core": False,
        "mempool-hub": False,
        "unified-engine": False,
        "mempool-ingestor": False,
    }
    
    # Test HTTP services
    results["mempool-core"] = test_mempool_core()
    results["mempool-hub"] = test_mempool_hub()
    results["unified-engine"] = test_unified_engine()
    
    # Test async service
    try:
        results["mempool-ingestor"] = asyncio.run(test_mempool_ingestor())
    except Exception as e:
        print(f"  ⚠️  Ingestor test skipped: {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for service, status in results.items():
        status_icon = "[OK]" if status else "[FAIL]"
        print(f"{status_icon} {service}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n[SUCCESS] All services are working!")
    else:
        print("\n[WARN] Some services need attention")
        print("\nTo start services:")
        print("  mempool-core: cd src/unified_mempool/mempool-core/app && python -m api.main")
        print("  mempool-hub: cd src/unified_mempool/mempool-hub && python app.py")
        print("  unified-engine: python api/unified_api_gateway.py")
    
    return all_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

