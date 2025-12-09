#!/usr/bin/env python3
"""
Basic usage example for the Unified Mempool Monitoring System
"""

import asyncio
import sys
from pathlib import Path

# Add the src directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from unified_mempool.api.unified_api_gateway import UnifiedAPIGateway
from unified_mempool.core.unified_mempool_engine import UnifiedMempoolEngine


async def basic_monitoring_example():
    """Basic example of using the Unified Mempool Engine"""
    print("🚀 Starting Unified Mempool Monitoring System...")

    # Initialize the engine
    engine = UnifiedMempoolEngine()

    try:
        # Initialize the system
        await engine.initialize()
        print("✅ System initialized successfully")

        # Get system status
        status = await engine.get_system_status()
        print(f"📊 System Status: {status}")

        # Monitor for a short period
        print("🔍 Monitoring transactions for 30 seconds...")
        await asyncio.sleep(30)

        # Get final statistics
        final_status = await engine.get_system_status()
        print(f"📈 Final Statistics: {final_status}")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        # Cleanup
        await engine.shutdown()
        print("🛑 System shutdown complete")


async def api_server_example():
    """Example of starting the API server"""
    print("🌐 Starting Unified Mempool API Server...")

    # Initialize the API gateway
    api_gateway = UnifiedAPIGateway()

    try:
        # Start the server (this would normally be done with uvicorn)
        print("✅ API server would start here")
        print("   Endpoints available at: http://localhost:8000")
        print("   Documentation at: http://localhost:8000/docs")

        # Simulate running for a bit
        await asyncio.sleep(5)

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        print("🛑 API server shutdown")


def main():
    """Main function to run examples"""
    print("🎯 Unified Mempool Monitoring System - Examples")
    print("=" * 50)

    # Run basic monitoring example
    print("\n1. Basic Monitoring Example:")
    asyncio.run(basic_monitoring_example())

    print("\n2. API Server Example:")
    asyncio.run(api_server_example())

    print("\n✅ All examples completed!")


if __name__ == "__main__":
    main()
