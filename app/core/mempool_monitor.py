#!/usr/bin/env python3
"""
Advanced Mempool Monitoring Module
Real-time mempool monitoring with WebSocket connections and MEV detection
"""

import asyncio
import json
import time
from collections import defaultdict
from collections.abc import Callable
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

import structlog
import websockets

from config.settings import settings

from .blockchain import MempoolTransaction, blockchain_manager
from .threat_detection import threat_detection_engine

logger = structlog.get_logger(__name__)


class MempoolEventType(Enum):
    NEW_TRANSACTION = "new_transaction"
    TRANSACTION_REMOVED = "transaction_removed"
    FRONT_RUNNING_DETECTED = "front_running_detected"
    SANDWICH_ATTACK_DETECTED = "sandwich_attack_detected"
    ARBITRAGE_DETECTED = "arbitrage_detected"
    HIGH_VALUE_TRANSACTION = "high_value_transaction"
    SUSPICIOUS_PATTERN = "suspicious_pattern"


@dataclass
class MempoolEvent:
    event_type: MempoolEventType
    transaction_hash: str
    network: str
    timestamp: float
    data: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class MempoolStats:
    total_transactions: int = 0
    pending_transactions: int = 0
    confirmed_transactions: int = 0
    failed_transactions: int = 0
    mev_transactions: int = 0
    high_value_transactions: int = 0
    suspicious_transactions: int = 0
    average_gas_price: float = 0.0
    network_congestion: float = 0.0


class WebSocketMempoolMonitor:
    """WebSocket-based mempool monitoring"""

    def __init__(self, network: str):
        self.network = network
        self.websocket_urls = self._get_websocket_urls()
        self.current_websocket = None
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 10
        self.reconnect_delay = 5
        self.running = False
        self.event_callbacks: list[Callable] = []
        self.subscription_id = None

    def _get_websocket_urls(self) -> list[str]:
        """Get WebSocket URLs for mempool monitoring"""
        websocket_urls = {
            "ethereum": [
                "wss://eth-mainnet.g.alchemy.com/v2/demo",
                "wss://mainnet.infura.io/ws/v3/demo",
                "wss://ethereum.publicnode.com",
            ],
            "polygon": [
                "wss://polygon-mainnet.g.alchemy.com/v2/demo",
                "wss://polygon-rpc.com/ws",
            ],
            "bsc": [
                "wss://bsc-ws-node.nariox.org:443/ws",
                "wss://bsc.publicnode.com",
            ],
        }

        return websocket_urls.get(self.network, [])

    async def start(self):
        """Start WebSocket mempool monitoring"""
        self.running = True
        asyncio.create_task(self._connect_and_monitor())
        logger.info("Started WebSocket mempool monitoring", network=self.network)

    async def stop(self):
        """Stop WebSocket mempool monitoring"""
        self.running = False
        if self.current_websocket:
            await self.current_websocket.close()
        logger.info("Stopped WebSocket mempool monitoring", network=self.network)

    async def _connect_and_monitor(self):
        """Connect to WebSocket and monitor mempool"""
        while self.running and self.reconnect_attempts < self.max_reconnect_attempts:
            try:
                await self._connect_to_websocket()
            except Exception as e:
                logger.error("WebSocket connection failed", network=self.network, error=str(e))
                self.reconnect_attempts += 1
                await asyncio.sleep(self.reconnect_delay * self.reconnect_attempts)

        if self.reconnect_attempts >= self.max_reconnect_attempts:
            logger.error("Max reconnection attempts reached", network=self.network)

    async def _connect_to_websocket(self):
        """Connect to WebSocket endpoint"""
        for ws_url in self.websocket_urls:
            try:
                async with websockets.connect(
                    ws_url, ping_interval=20, ping_timeout=10, close_timeout=10
                ) as websocket:
                    self.current_websocket = websocket
                    self.reconnect_attempts = 0

                    # Subscribe to pending transactions
                    await self._subscribe_to_pending_transactions(websocket)

                    # Listen for messages
                    async for message in websocket:
                        if not self.running:
                            break

                        await self._handle_websocket_message(message)

            except Exception as e:
                logger.warning(
                    "Failed to connect to WebSocket",
                    network=self.network,
                    url=ws_url,
                    error=str(e),
                )
                continue

    async def _subscribe_to_pending_transactions(self, websocket):
        """Subscribe to pending transactions"""
        subscription_message = {
            "id": 1,
            "method": "eth_subscribe",
            "params": ["newPendingTransactions"],
        }

        await websocket.send(json.dumps(subscription_message))

        # Wait for subscription confirmation
        response = await websocket.recv()
        response_data = json.loads(response)

        if "result" in response_data:
            self.subscription_id = response_data["result"]
            logger.info(
                "Subscribed to pending transactions",
                network=self.network,
                subscription_id=self.subscription_id,
            )
        else:
            logger.error(
                "Failed to subscribe to pending transactions",
                network=self.network,
                response=response_data,
            )

    async def _handle_websocket_message(self, message: str):
        """Handle incoming WebSocket message"""
        try:
            data = json.loads(message)

            if "method" in data and data["method"] == "eth_subscription":
                await self._handle_subscription_notification(data)
            elif "result" in data and isinstance(data["result"], str):
                # This is likely a transaction hash
                await self._handle_new_transaction(data["result"])

        except json.JSONDecodeError:
            logger.warning("Invalid JSON received", network=self.network, message=message)
        except Exception as e:
            logger.error("Error handling WebSocket message", network=self.network, error=str(e))

    async def _handle_subscription_notification(self, data: dict[str, Any]):
        """Handle subscription notification"""
        if "params" in data and "result" in data["params"]:
            tx_hash = data["params"]["result"]
            await self._handle_new_transaction(tx_hash)

    async def _handle_new_transaction(self, tx_hash: str):
        """Handle new pending transaction"""
        try:
            # Get transaction details
            provider = blockchain_manager.get_provider(self.network)
            if not provider:
                return

            # Get transaction from mempool (this might not work with all providers)
            # For now, we'll create a basic transaction object
            mempool_tx = MempoolTransaction(
                hash=tx_hash,
                from_address="",  # Would be filled from actual transaction data
                to_address="",
                value=0,
                gas=0,
                gas_price=0,
                nonce=0,
                timestamp=time.time(),
            )

            # Create mempool event
            event = MempoolEvent(
                event_type=MempoolEventType.NEW_TRANSACTION,
                transaction_hash=tx_hash,
                network=self.network,
                timestamp=time.time(),
                data={"transaction": mempool_tx},
            )

            # Notify callbacks
            await self._notify_event(event)

            # Analyze for threats
            threats = await threat_detection_engine.analyze_mempool_transaction(
                mempool_tx, self.network
            )
            for threat in threats:
                await threat_detection_engine.process_threat(threat)

        except Exception as e:
            logger.error(
                "Error handling new transaction",
                network=self.network,
                tx_hash=tx_hash,
                error=str(e),
            )

    async def _notify_event(self, event: MempoolEvent):
        """Notify event callbacks"""
        for callback in self.event_callbacks:
            try:
                await callback(event)
            except Exception as e:
                logger.error("Error in mempool event callback", error=str(e))

    def add_event_callback(self, callback: Callable):
        """Add event callback"""
        self.event_callbacks.append(callback)

    def remove_event_callback(self, callback: Callable):
        """Remove event callback"""
        if callback in self.event_callbacks:
            self.event_callbacks.remove(callback)


class BlockNativeMempoolMonitor:
    """BlockNative-based mempool monitoring"""

    def __init__(self, network: str):
        self.network = network
        self.websocket_url = settings.blocknative_websocket_url
        self.api_key = settings.blocknative_api_key
        self.websocket = None
        self.running = False
        self.event_callbacks: list[Callable] = []

    async def start(self):
        """Start BlockNative mempool monitoring"""
        if not self.api_key:
            logger.warning("BlockNative API key not configured", network=self.network)
            return

        self.running = True
        asyncio.create_task(self._connect_and_monitor())
        logger.info("Started BlockNative mempool monitoring", network=self.network)

    async def stop(self):
        """Stop BlockNative mempool monitoring"""
        self.running = False
        if self.websocket:
            await self.websocket.close()
        logger.info("Stopped BlockNative mempool monitoring", network=self.network)

    async def _connect_and_monitor(self):
        """Connect to BlockNative WebSocket and monitor"""
        try:
            async with websockets.connect(
                self.websocket_url, extra_headers={"Authorization": self.api_key}
            ) as websocket:
                self.websocket = websocket

                # Subscribe to all transactions
                subscribe_message = {
                    "categoryCode": "initialize",
                    "eventCode": "checkDappId",
                    "dappId": self.api_key,
                }

                await websocket.send(json.dumps(subscribe_message))

                async for message in websocket:
                    if not self.running:
                        break

                    await self._handle_blocknative_message(message)

        except Exception as e:
            logger.error(
                "BlockNative WebSocket connection failed", network=self.network, error=str(e)
            )

    async def _handle_blocknative_message(self, message: str):
        """Handle BlockNative WebSocket message"""
        try:
            data = json.loads(message)

            if data.get("eventCode") == "txPending":
                await self._handle_pending_transaction(data)
            elif data.get("eventCode") == "txConfirmed":
                await self._handle_confirmed_transaction(data)
            elif data.get("eventCode") == "txFailed":
                await self._handle_failed_transaction(data)

        except json.JSONDecodeError:
            logger.warning("Invalid JSON from BlockNative", network=self.network, message=message)
        except Exception as e:
            logger.error("Error handling BlockNative message", network=self.network, error=str(e))

    async def _handle_pending_transaction(self, data: dict[str, Any]):
        """Handle pending transaction from BlockNative"""
        try:
            tx_hash = data.get("hash", "")
            if not tx_hash:
                return

            # Create mempool transaction object
            mempool_tx = MempoolTransaction(
                hash=tx_hash,
                from_address=data.get("from", ""),
                to_address=data.get("to", ""),
                value=int(data.get("value", "0"), 16) if data.get("value") else 0,
                gas=int(data.get("gas", "0"), 16) if data.get("gas") else 0,
                gas_price=int(data.get("gasPrice", "0"), 16) if data.get("gasPrice") else 0,
                nonce=int(data.get("nonce", "0"), 16) if data.get("nonce") else 0,
                timestamp=time.time(),
            )

            # Create event
            event = MempoolEvent(
                event_type=MempoolEventType.NEW_TRANSACTION,
                transaction_hash=tx_hash,
                network=self.network,
                timestamp=time.time(),
                data={"transaction": mempool_tx, "blocknative_data": data},
            )

            # Notify callbacks
            await self._notify_event(event)

            # Analyze for threats
            threats = await threat_detection_engine.analyze_mempool_transaction(
                mempool_tx, self.network
            )
            for threat in threats:
                await threat_detection_engine.process_threat(threat)

        except Exception as e:
            logger.error(
                "Error handling BlockNative pending transaction",
                network=self.network,
                error=str(e),
            )

    async def _handle_confirmed_transaction(self, data: dict[str, Any]):
        """Handle confirmed transaction from BlockNative"""
        event = MempoolEvent(
            event_type=MempoolEventType.TRANSACTION_REMOVED,
            transaction_hash=data.get("hash", ""),
            network=self.network,
            timestamp=time.time(),
            data={"status": "confirmed", "blocknative_data": data},
        )

        await self._notify_event(event)

    async def _handle_failed_transaction(self, data: dict[str, Any]):
        """Handle failed transaction from BlockNative"""
        event = MempoolEvent(
            event_type=MempoolEventType.TRANSACTION_REMOVED,
            transaction_hash=data.get("hash", ""),
            network=self.network,
            timestamp=time.time(),
            data={"status": "failed", "blocknative_data": data},
        )

        await self._notify_event(event)

    async def _notify_event(self, event: MempoolEvent):
        """Notify event callbacks"""
        for callback in self.event_callbacks:
            try:
                await callback(event)
            except Exception as e:
                logger.error("Error in BlockNative event callback", error=str(e))

    def add_event_callback(self, callback: Callable):
        """Add event callback"""
        self.event_callbacks.append(callback)

    def remove_event_callback(self, callback: Callable):
        """Remove event callback"""
        if callback in self.event_callbacks:
            self.event_callbacks.remove(callback)


class MempoolAnalyzer:
    """Analyze mempool for patterns and threats"""

    def __init__(self):
        self.transaction_pool: dict[str, list[MempoolTransaction]] = defaultdict(list)
        self.pattern_detectors: list[Callable] = []
        self.stats = MempoolStats()
        self.high_value_threshold = settings.high_value_threshold * 1e18  # Convert to wei

    async def analyze_transaction(self, tx: MempoolTransaction, network: str) -> list[MempoolEvent]:
        """Analyze transaction for patterns and threats"""
        events = []

        # Add to transaction pool
        self.transaction_pool[network].append(tx)

        # Keep only recent transactions (last 1000)
        if len(self.transaction_pool[network]) > 1000:
            self.transaction_pool[network] = self.transaction_pool[network][-1000:]

        # Update stats
        self.stats.total_transactions += 1
        self.stats.pending_transactions += 1

        # Check for high value transaction
        if tx.value > self.high_value_threshold:
            event = MempoolEvent(
                event_type=MempoolEventType.HIGH_VALUE_TRANSACTION,
                transaction_hash=tx.hash,
                network=network,
                timestamp=time.time(),
                data={"value": tx.value, "value_eth": tx.value / 1e18},
            )
            events.append(event)
            self.stats.high_value_transactions += 1

        # Check for suspicious patterns
        suspicious_patterns = await self._detect_suspicious_patterns(tx, network)
        if suspicious_patterns:
            event = MempoolEvent(
                event_type=MempoolEventType.SUSPICIOUS_PATTERN,
                transaction_hash=tx.hash,
                network=network,
                timestamp=time.time(),
                data={"patterns": suspicious_patterns},
            )
            events.append(event)
            self.stats.suspicious_transactions += 1

        # Update average gas price
        self._update_gas_price_stats(tx)

        return events

    async def _detect_suspicious_patterns(self, tx: MempoolTransaction, network: str) -> list[str]:
        """Detect suspicious patterns in transaction"""
        patterns = []

        # Check for rapid transactions from same address
        recent_txs = [
            t for t in self.transaction_pool[network][-100:] if t.from_address == tx.from_address
        ]

        if len(recent_txs) > 10:  # More than 10 transactions in recent pool
            patterns.append("rapid_transactions")

        # Check for unusual gas prices
        if tx.gas_price > 100e9:  # Very high gas price
            patterns.append("unusual_gas_price")

        # Check for zero value transactions to contracts
        if (
            tx.value == 0
            and tx.to_address
            and tx.to_address != "0x0000000000000000000000000000000000000000"
        ):
            patterns.append("contract_interaction")

        return patterns

    def _update_gas_price_stats(self, tx: MempoolTransaction):
        """Update gas price statistics"""
        # Simple moving average
        if self.stats.average_gas_price == 0:
            self.stats.average_gas_price = tx.gas_price / 1e9  # Convert to Gwei
        else:
            self.stats.average_gas_price = (
                self.stats.average_gas_price * 0.9 + (tx.gas_price / 1e9) * 0.1
            )

    def get_stats(self) -> MempoolStats:
        """Get mempool statistics"""
        return self.stats

    def add_pattern_detector(self, detector: Callable):
        """Add custom pattern detector"""
        self.pattern_detectors.append(detector)


class MempoolManager:
    """Main mempool monitoring manager"""

    def __init__(self):
        self.monitors: dict[str, list[Any]] = defaultdict(list)
        self.analyzer = MempoolAnalyzer()
        self.event_callbacks: list[Callable] = []
        self.running = False

    async def start(self):
        """Start mempool monitoring for all networks"""
        if not settings.enable_mempool_monitoring:
            logger.info("Mempool monitoring disabled in configuration")
            return

        self.running = True

        # Start monitors for each network
        for network in settings.get_supported_networks():
            await self._start_network_monitors(network)

        logger.info("Started mempool monitoring for all networks")

    async def stop(self):
        """Stop all mempool monitoring"""
        self.running = False

        for network_monitors in self.monitors.values():
            for monitor in network_monitors:
                await monitor.stop()

        logger.info("Stopped all mempool monitoring")

    async def _start_network_monitors(self, network: str):
        """Start monitors for specific network"""
        # Start WebSocket monitor
        ws_monitor = WebSocketMempoolMonitor(network)
        ws_monitor.add_event_callback(self._handle_mempool_event)
        await ws_monitor.start()
        self.monitors[network].append(ws_monitor)

        # Start BlockNative monitor if API key is available
        if settings.blocknative_api_key:
            bn_monitor = BlockNativeMempoolMonitor(network)
            bn_monitor.add_event_callback(self._handle_mempool_event)
            await bn_monitor.start()
            self.monitors[network].append(bn_monitor)

    async def _handle_mempool_event(self, event: MempoolEvent):
        """Handle mempool event from monitors"""
        try:
            # Analyze transaction if it's a new transaction event
            if event.event_type == MempoolEventType.NEW_TRANSACTION:
                tx = event.data.get("transaction")
                if tx:
                    analysis_events = await self.analyzer.analyze_transaction(tx, event.network)

                    # Add analysis events to the main event
                    event.metadata["analysis_events"] = analysis_events

            # Notify callbacks
            await self._notify_event(event)

        except Exception as e:
            logger.error("Error handling mempool event", error=str(e))

    async def _notify_event(self, event: MempoolEvent):
        """Notify event callbacks"""
        for callback in self.event_callbacks:
            try:
                await callback(event)
            except Exception as e:
                logger.error("Error in mempool event callback", error=str(e))

    def add_event_callback(self, callback: Callable):
        """Add event callback"""
        self.event_callbacks.append(callback)

    def remove_event_callback(self, callback: Callable):
        """Remove event callback"""
        if callback in self.event_callbacks:
            self.event_callbacks.remove(callback)

    def get_network_stats(self, network: str) -> MempoolStats:
        """Get mempool statistics for specific network"""
        return self.analyzer.get_stats()

    def get_all_stats(self) -> dict[str, MempoolStats]:
        """Get mempool statistics for all networks"""
        stats = {}
        for network in settings.get_supported_networks():
            stats[network] = self.get_network_stats(network)
        return stats


# Global mempool manager instance
mempool_manager = MempoolManager()
