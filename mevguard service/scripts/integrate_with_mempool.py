#!/usr/bin/env python3
"""
🔗 MEMPOOL INTEGRATION SCRIPT
=============================
Integration script to connect MEV Protection Service with existing mempool system.

This script integrates the enhanced MEV protection service with the existing
unified mempool system to provide comprehensive MEV protection.
"""

import asyncio
import json
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

import aiohttp
import redis.asyncio as redis

# Add src to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from mev_protection.core.mev_protection_engine import (
    MEVProtectionEngine,
    MEVThreat,
    NetworkType,
    ProtectionLevel,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class MempoolIntegration:
    """
    🔗 MEMPOOL INTEGRATION
    ======================
    Integrates MEV Protection Service with existing mempool system.
    """

    def __init__(self, config: dict[str, Any] = None):
        self.config = config or self._get_default_config()

        # MEV Protection Engine
        self.mev_engine: MEVProtectionEngine | None = None

        # Mempool system connection
        self.mempool_api_url = self.config.get("mempool_api_url", "http://localhost:8001")
        self.session: aiohttp.ClientSession | None = None
        self.redis_client: redis.Redis | None = None

        # Integration state
        self.is_integrated = False
        self.integration_tasks: list[asyncio.Task] = []

        # Statistics
        self.stats = {
            "transactions_processed": 0,
            "threats_detected": 0,
            "protections_applied": 0,
            "integration_uptime": 0,
            "start_time": None,
        }

    def _get_default_config(self) -> dict[str, Any]:
        """Get default configuration"""
        return {
            "mempool_api_url": "http://localhost:8001",
            "mev_protection_api_url": "http://localhost:8000",
            "redis_url": "redis://localhost:6379/1",
            "integration_interval": 1.0,  # seconds
            "batch_size": 100,
            "networks": ["ethereum", "polygon", "bsc", "arbitrum"],
            "protection_level": "high",
        }

    async def initialize(self):
        """Initialize the integration"""
        logger.info("🔗 Initializing Mempool Integration...")

        try:
            # Initialize MEV Protection Engine
            self.mev_engine = MEVProtectionEngine()
            await self.mev_engine.initialize()

            # Initialize HTTP session
            self.session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30))

            # Initialize Redis connection
            self.redis_client = redis.from_url(self.config["redis_url"], decode_responses=True)
            await self.redis_client.ping()

            logger.info("✅ Mempool Integration initialized successfully!")

        except Exception as e:
            logger.error(f"Failed to initialize mempool integration: {e}")
            raise

    async def start_integration(self):
        """Start the integration"""
        if self.is_integrated:
            logger.warning("⚠️ Integration already active")
            return

        self.stats["start_time"] = datetime.now()
        self.is_integrated = True

        logger.info("🚀 Starting Mempool Integration...")

        # Start MEV protection
        networks = [NetworkType(network) for network in self.config["networks"]]
        protection_level = ProtectionLevel(self.config["protection_level"])
        await self.mev_engine.start_protection(networks, protection_level)

        # Start integration tasks
        self.integration_tasks = [
            asyncio.create_task(self._mempool_monitoring_loop()),
            asyncio.create_task(self._threat_processing_loop()),
            asyncio.create_task(self._protection_coordination_loop()),
            asyncio.create_task(self._statistics_loop()),
        ]

        logger.info(f"✅ Started {len(self.integration_tasks)} integration tasks")

    async def stop_integration(self):
        """Stop the integration"""
        if not self.is_integrated:
            return

        self.is_integrated = False

        # Stop MEV protection
        if self.mev_engine:
            await self.mev_engine.stop_protection()

        # Cancel integration tasks
        for task in self.integration_tasks:
            task.cancel()

        await asyncio.gather(*self.integration_tasks, return_exceptions=True)

        # Close connections
        if self.session:
            await self.session.close()
        if self.redis_client:
            await self.redis_client.close()

        logger.info("⏹️ Mempool Integration stopped")

    async def _mempool_monitoring_loop(self):
        """Monitor mempool for new transactions"""
        while self.is_integrated:
            try:
                # Get recent transactions from mempool system
                transactions = await self._get_mempool_transactions()

                if transactions:
                    logger.info(f"📊 Processing {len(transactions)} transactions from mempool")

                    # Process transactions through MEV protection
                    for tx in transactions:
                        await self._process_transaction(tx)
                        self.stats["transactions_processed"] += 1

                await asyncio.sleep(self.config["integration_interval"])

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in mempool monitoring: {e}")
                await asyncio.sleep(5)

    async def _get_mempool_transactions(self) -> list[dict[str, Any]]:
        """Get transactions from mempool system"""
        try:
            async with self.session.get(f"{self.mempool_api_url}/api/v1/transactions") as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("transactions", [])
                logger.warning(f"Mempool API returned status {response.status}")
                return []
        except Exception as e:
            logger.error(f"Error getting mempool transactions: {e}")
            return []

    async def _process_transaction(self, tx: dict[str, Any]):
        """Process transaction through MEV protection"""
        try:
            # Convert mempool transaction to MEV protection format
            protection_data = {
                "hash": tx.get("hash"),
                "network": tx.get("network", "ethereum"),
                "gas_limit": tx.get("gas_limit"),
                "max_gas_price": tx.get("gas_price"),
                "slippage_tolerance": 0.5,
                "private_mempool": True,
            }

            # Apply MEV protection
            if self.mev_engine:
                protection = await self.mev_engine.protect_transaction(
                    protection_data, ProtectionLevel.HIGH
                )

                # Store protection result
                await self._store_protection_result(protection)

                # Update statistics
                if protection.protection_result and protection.protection_result.success:
                    self.stats["protections_applied"] += 1

        except Exception as e:
            logger.error(f"Error processing transaction: {e}")

    async def _threat_processing_loop(self):
        """Process detected threats"""
        while self.is_integrated:
            try:
                if self.mev_engine:
                    # Get recent threats
                    recent_threats = [
                        threat
                        for threat in self.mev_engine.detected_threats
                        if (datetime.now() - threat.detected_at).seconds < 60
                    ]

                    for threat in recent_threats:
                        await self._process_threat(threat)
                        self.stats["threats_detected"] += 1

                await asyncio.sleep(2)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in threat processing: {e}")
                await asyncio.sleep(5)

    async def _process_threat(self, threat: MEVThreat):
        """Process detected threat"""
        try:
            # Store threat in Redis for mempool system
            threat_data = {
                "threat_id": threat.threat_id,
                "threat_type": threat.threat_type.value,
                "target_transaction": threat.target_transaction,
                "attacker_address": threat.attacker_address,
                "profit_potential": threat.profit_potential,
                "confidence": threat.confidence,
                "severity": threat.severity.value,
                "network": threat.network.value,
                "detected_at": threat.detected_at.isoformat(),
                "protection_applied": threat.protection_applied,
            }

            if self.redis_client:
                await self.redis_client.setex(
                    f"mev_threat:{threat.threat_id}", 3600, json.dumps(threat_data)  # 1 hour expiry
                )

                # Publish threat to mempool system
                await self.redis_client.publish("mev_threats", json.dumps(threat_data))

            logger.info(f"🚨 Processed threat {threat.threat_id} ({threat.threat_type.value})")

        except Exception as e:
            logger.error(f"Error processing threat: {e}")

    async def _protection_coordination_loop(self):
        """Coordinate protection between systems"""
        while self.is_integrated:
            try:
                # Get protection requests from mempool system
                if self.redis_client:
                    # Check for protection requests
                    requests = await self.redis_client.lrange("protection_requests", 0, 9)

                    for request_data in requests:
                        try:
                            request = json.loads(request_data)
                            await self._handle_protection_request(request)

                            # Remove processed request
                            await self.redis_client.lrem("protection_requests", 1, request_data)

                        except Exception as e:
                            logger.error(f"Error handling protection request: {e}")

                await asyncio.sleep(1)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in protection coordination: {e}")
                await asyncio.sleep(5)

    async def _handle_protection_request(self, request: dict[str, Any]):
        """Handle protection request from mempool system"""
        try:
            # Apply protection using MEV engine
            if self.mev_engine:
                protection = await self.mev_engine.protect_transaction(
                    request, ProtectionLevel.HIGH
                )

                # Send protection result back
                result_data = {
                    "request_id": request.get("request_id"),
                    "success": (
                        protection.protection_result.success
                        if protection.protection_result
                        else False
                    ),
                    "strategy_used": (
                        protection.protection_result.strategy_used
                        if protection.protection_result
                        else None
                    ),
                    "gas_saved": (
                        protection.protection_result.gas_saved
                        if protection.protection_result
                        else 0
                    ),
                    "value_protected": (
                        protection.protection_result.value_protected
                        if protection.protection_result
                        else 0.0
                    ),
                    "execution_time": (
                        protection.protection_result.execution_time
                        if protection.protection_result
                        else 0.0
                    ),
                }

                if self.redis_client:
                    await self.redis_client.publish("protection_results", json.dumps(result_data))

                logger.info(f"🛡️ Handled protection request {request.get('request_id')}")

        except Exception as e:
            logger.error(f"Error handling protection request: {e}")

    async def _store_protection_result(self, protection):
        """Store protection result in Redis"""
        try:
            if self.redis_client and protection.protection_result:
                result_data = {
                    "transaction_hash": protection.transaction_hash,
                    "network": protection.network.value,
                    "protection_level": protection.protection_level.value,
                    "strategies": protection.strategies,
                    "status": protection.status,
                    "success": protection.protection_result.success,
                    "strategy_used": protection.protection_result.strategy_used,
                    "gas_saved": protection.protection_result.gas_saved,
                    "value_protected": protection.protection_result.value_protected,
                    "execution_time": protection.protection_result.execution_time,
                    "created_at": protection.created_at.isoformat(),
                }

                await self.redis_client.setex(
                    f"protection_result:{protection.transaction_hash}",
                    3600,  # 1 hour expiry
                    json.dumps(result_data),
                )

        except Exception as e:
            logger.error(f"Error storing protection result: {e}")

    async def _statistics_loop(self):
        """Update integration statistics"""
        while self.is_integrated:
            try:
                # Calculate uptime
                if self.stats["start_time"]:
                    uptime = (datetime.now() - self.stats["start_time"]).total_seconds()
                    self.stats["integration_uptime"] = uptime

                # Store statistics in Redis
                if self.redis_client:
                    await self.redis_client.setex(
                        "integration_stats",
                        60,  # 1 minute expiry
                        json.dumps(self.stats, default=str),
                    )

                await asyncio.sleep(10)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in statistics loop: {e}")
                await asyncio.sleep(5)

    async def get_integration_status(self) -> dict[str, Any]:
        """Get integration status"""
        return {
            "status": "active" if self.is_integrated else "inactive",
            "uptime_seconds": self.stats["integration_uptime"],
            "statistics": self.stats,
            "mev_engine_status": (
                await self.mev_engine.get_protection_status() if self.mev_engine else None
            ),
            "last_updated": datetime.now().isoformat(),
        }


async def main():
    """Main integration function"""
    logger.info("🔗 MEMPOOL INTEGRATION")
    logger.info("Connecting MEV Protection Service with Mempool System")

    # Create integration instance
    integration = MempoolIntegration()

    try:
        # Initialize integration
        await integration.initialize()

        # Start integration
        await integration.start_integration()

        # Run for demonstration
        logger.info("✅ Integration started! Running for 60 seconds...")

        await asyncio.sleep(60)

        # Show final results
        status = await integration.get_integration_status()
        logger.info("📊 FINAL INTEGRATION STATUS")
        logger.info(f"Transactions processed: {status['statistics']['transactions_processed']}")
        logger.info(f"Threats detected: {status['statistics']['threats_detected']}")
        logger.info(f"Protections applied: {status['statistics']['protections_applied']}")
        logger.info(f"Integration uptime: {status['statistics']['integration_uptime']:.2f} seconds")

    except KeyboardInterrupt:
        logger.info("⏹️ Shutting down integration...")
    except Exception as e:
        logger.error(f"❌ Error: {e}")
    finally:
        await integration.stop_integration()


if __name__ == "__main__":
    asyncio.run(main())
