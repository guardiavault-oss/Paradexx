#!/usr/bin/env python3
"""
Test script for the Ultimate Quantum Mempool Monitor
"""

import asyncio
import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))


def test_imports():
    """Test basic imports."""
    print("🧪 Testing imports...")

    try:
        from unified_integration import UltimateQuantumMempoolMonitor

        print("✅ UltimateQuantumMempoolMonitor import successful")
        return UltimateQuantumMempoolMonitor
    except Exception as e:
        print(f"❌ Import failed: {e}")
        import traceback

        traceback.print_exc()
        return None


def test_instantiation(monitor_class):
    """Test class instantiation."""
    print("\n🏗️  Testing instantiation...")

    try:
        monitor = monitor_class()
        print("✅ Monitor instance created successfully")

        print(f"   • Config: {'✅' if monitor.config else '❌'}")
        print(f"   • Logger: {'✅' if monitor.logger else '❌'}")
        print(f"   • FastAPI app: {'✅' if monitor.app else '❌'}")
        print(f"   • Startup time: {monitor.startup_time}")
        print(f"   • Running: {monitor.is_running}")

        return monitor
    except Exception as e:
        print(f"❌ Instantiation failed: {e}")
        import traceback

        traceback.print_exc()
        return None


async def test_initialization(monitor):
    """Test monitor initialization."""
    print("\n⚙️  Testing initialization...")

    try:
        await monitor.initialize()
        print("✅ Monitor initialization successful")

        print(f"   • Quantum detector: {'✅' if monitor.quantum_detector else '❌'}")
        print(f"   • Advanced detector: {'✅' if monitor.advanced_detector else '❌'}")
        print(f"   • Database manager: {'✅' if monitor.db_manager else '❌'}")
        print(f"   • Security manager: {'✅' if monitor.security_manager else '❌'}")
        print(f"   • Alert manager: {'✅' if monitor.alert_manager else '❌'}")
        print(f"   • Mempool monitors: {len(monitor.mempool_monitors)}")
        print(f"   • MEV detectors: {len(monitor.mev_detectors)}")

        return True
    except Exception as e:
        print(f"❌ Initialization failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def test_health_check(monitor):
    """Test system health check."""
    print("\n🏥 Testing health check...")

    try:
        health = await monitor._get_system_health()
        print(f"✅ Health check successful: {health['healthy']}")
        print(f"   • Components: {len(health['components'])}")
        print(f"   • Uptime: {health['uptime_seconds']} seconds")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False


async def main():
    """Main test function."""
    print("=" * 60)
    print("🚀 ULTIMATE QUANTUM MEMPOOL MONITOR - TEST SUITE")
    print("=" * 60)

    # Test imports
    monitor_class = test_imports()
    if not monitor_class:
        print("❌ Cannot proceed - import failed")
        return False

    # Test instantiation
    monitor = test_instantiation(monitor_class)
    if not monitor:
        print("❌ Cannot proceed - instantiation failed")
        return False

    # Test initialization
    init_success = await test_initialization(monitor)
    if not init_success:
        print("⚠️  Initialization failed but continuing...")

    # Test health check
    health_success = await test_health_check(monitor)

    # Clean shutdown
    try:
        await monitor.shutdown()
        print("✅ Clean shutdown completed")
    except Exception as e:
        print(f"⚠️  Shutdown warning: {e}")

    print("\n" + "=" * 60)
    print("🎯 TEST SUMMARY")
    print("=" * 60)
    print(f"Import test: {'✅ PASS' if monitor_class else '❌ FAIL'}")
    print(f"Instantiation test: {'✅ PASS' if monitor else '❌ FAIL'}")
    print(f"Initialization test: {'✅ PASS' if init_success else '❌ FAIL'}")
    print(f"Health check test: {'✅ PASS' if health_success else '❌ FAIL'}")

    overall_success = all([monitor_class, monitor, init_success, health_success])
    print(
        f"\nOverall: {'🎉 ALL TESTS PASSED' if overall_success else '⚠️  SOME TESTS FAILED'}"
    )

    return overall_success


if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
