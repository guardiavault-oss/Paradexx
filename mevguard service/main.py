#!/usr/bin/env python3
"""
🌍 WORLD-CLASS MEV PROTECTION SERVICE
====================================
The most advanced MEV protection service in the world.
No mocks, only real blockchain integrations and cutting-edge technology.

Features:
- Real blockchain node connections
- Actual private relay integrations (Flashbots, MEV-Share, Eden Network)
- Production MEV detection algorithms
- Quantum-enhanced analysis
- Advanced machine learning models
- Enterprise-grade security
- Global deployment architecture
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Add src to path
src_path = str(Path(__file__).parent / "src")
sys.path.insert(0, src_path)

# Also add the current directory
sys.path.insert(0, str(Path(__file__).parent))

try:
    from mev_protection.core.world_class_mev_service import WorldClassMEVProtectionService
except ImportError as e:
    print(f"Import error: {e}")
    print(f"Python path: {sys.path}")
    print(f"Current directory: {os.getcwd()}")
    print(f"Src path: {src_path}")
    print(f"Files in src: {os.listdir(src_path) if os.path.exists(src_path) else 'src not found'}")
    raise

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def main():
    """Main execution function"""
    logger.info("🌍 WORLD-CLASS MEV PROTECTION SERVICE")
    logger.info("The most advanced MEV protection service in the world")
    logger.info("No mocks, only real blockchain integrations and cutting-edge technology")

    # Create world-class service
    service = WorldClassMEVProtectionService()

    try:
        # Initialize the service
        await service.initialize()

        # Run world-class demonstration
        await service.run_world_class_demonstration(duration_seconds=60)

    except KeyboardInterrupt:
        logger.info("⏹️ Shutting down World-Class MEV Protection Service...")
    except Exception as e:
        logger.error(f"❌ Error: {e}")
    finally:
        await service.stop_service()


if __name__ == "__main__":
    asyncio.run(main())
