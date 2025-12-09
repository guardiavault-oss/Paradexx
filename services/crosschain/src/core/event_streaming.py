#!/usr/bin/env python3
"""
Real-time Blockchain Event Streaming - Production-grade event processing
"""

import asyncio
import json
import logging
from collections.abc import AsyncGenerator, Callable
from dataclasses import asdict, dataclass
from datetime import datetime
from enum import Enum
from typing import Any

import websockets

try:
    from web3.middleware import geth_poa_middleware
except ImportError:
    try:
        from web3 import middleware

        geth_poa_middleware = middleware.ExtraDataToPOAMiddleware
    except (ImportError, AttributeError):
        geth_poa_middleware = None
import ssl
import time
from collections import defaultdict, deque

import certifi

logger = logging.getLogger(__name__)


class EventType(str, Enum):
    """Types of blockchain events"""

    NEW_BLOCK = "new_block"
    NEW_TRANSACTION = "new_transaction"
    CONTRACT_EVENT = "contract_event"
    BRIDGE_EVENT = "bridge_event"
    VALIDATOR_EVENT = "validator_event"
    ATTESTATION_EVENT = "attestation_event"
    RESERVE_EVENT = "reserve_event"
    ATTACK_EVENT = "attack_event"


class EventPriority(str, Enum):
    """Event priority levels"""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


@dataclass
class StreamedEvent:
    """Real-time streamed blockchain event"""

    event_id: str
    event_type: EventType
    network: str
    block_number: int
    transaction_hash: str | None
    timestamp: datetime
    priority: EventPriority
    data: dict[str, Any]
    raw_data: dict[str, Any]
    processed: bool = False
    correlation_id: str | None = None


@dataclass
class EventFilter:
    """Event filtering configuration"""

    event_types: list[EventType]
    networks: list[str]
    contract_addresses: list[str]
    from_block: int | None = None
    to_block: int | None = None
    topics: list[str] = None
    min_priority: EventPriority = EventPriority.INFO


class BlockchainEventStreamer:
    """Real-time blockchain event streaming and processing"""

    def __init__(self, blockchain_integration):
        self.blockchain = blockchain_integration
        self.websocket_connections: dict[str, websockets.WebSocketServerProtocol] = {}
        self.event_handlers: dict[EventType, list[Callable]] = defaultdict(list)
        self.event_filters: list[EventFilter] = []
        self.event_queue: asyncio.Queue = asyncio.Queue(maxsize=10000)
        self.processing_tasks: list[asyncio.Task] = []
        self.is_streaming = False
        self.event_counter = 0
        self.event_history: deque = deque(maxlen=100000)  # Keep last 100k events

        # Event processing configuration
        self.max_concurrent_events = 100
        self.event_timeout = 30  # seconds
        self.retry_attempts = 3
        self.retry_delay = 1  # seconds

        logger.info("BlockchainEventStreamer initialized")

    async def start_streaming(self):
        """Start real-time event streaming"""
        if self.is_streaming:
            logger.warning("Event streaming already started")
            return

        logger.info("Starting blockchain event streaming...")
        self.is_streaming = True

        # Start event processing tasks
        for i in range(self.max_concurrent_events):
            task = asyncio.create_task(self._process_events())
            self.processing_tasks.append(task)

        # Start streaming for each network
        for network in self.blockchain.get_supported_networks():
            asyncio.create_task(self._stream_network_events(network))

        logger.info("Blockchain event streaming started")

    async def stop_streaming(self):
        """Stop event streaming"""
        logger.info("Stopping blockchain event streaming...")
        self.is_streaming = False

        # Cancel processing tasks
        for task in self.processing_tasks:
            task.cancel()

        # Close WebSocket connections
        for ws in self.websocket_connections.values():
            await ws.close()

        self.websocket_connections.clear()
        self.processing_tasks.clear()

        logger.info("Blockchain event streaming stopped")

    async def _stream_network_events(self, network: str):
        """Stream events from a specific network"""
        config = self.blockchain.get_network_config(network)
        if not config or not config.supports_ws:
            logger.warning(f"Network {network} does not support WebSocket streaming")
            return

        retry_count = 0
        max_retries = 5

        while self.is_streaming and retry_count < max_retries:
            try:
                # Try each WebSocket URL
                for ws_url in config.ws_urls:
                    try:
                        await self._connect_and_stream(network, ws_url)
                        retry_count = 0  # Reset on successful connection
                        break
                    except Exception as e:
                        logger.warning(f"Failed to connect to {network} via {ws_url}: {e}")
                        continue

                if retry_count > 0:
                    await asyncio.sleep(2**retry_count)  # Exponential backoff
                    retry_count += 1

            except Exception as e:
                logger.error(f"Error streaming events from {network}: {e}")
                retry_count += 1
                await asyncio.sleep(5)

    async def _connect_and_stream(self, network: str, ws_url: str):
        """Connect to WebSocket and stream events"""
        ssl_context = ssl.create_default_context(cafile=certifi.where())

        async with websockets.connect(
            ws_url, ssl=ssl_context, ping_interval=30, ping_timeout=10, close_timeout=10
        ) as websocket:
            self.websocket_connections[network] = websocket
            logger.info(f"Connected to {network} WebSocket: {ws_url}")

            # Subscribe to new block headers
            await websocket.send(
                json.dumps({"id": 1, "method": "eth_subscribe", "params": ["newHeads"]})
            )

            # Subscribe to pending transactions
            await websocket.send(
                json.dumps(
                    {"id": 2, "method": "eth_subscribe", "params": ["newPendingTransactions"]}
                )
            )

            # Listen for events
            async for message in websocket:
                if not self.is_streaming:
                    break

                try:
                    data = json.loads(message)
                    await self._handle_websocket_message(network, data)
                except json.JSONDecodeError as e:
                    logger.warning(f"Invalid JSON from {network} WebSocket: {e}")
                except Exception as e:
                    logger.error(f"Error handling WebSocket message from {network}: {e}")

    async def _handle_websocket_message(self, network: str, data: dict[str, Any]):
        """Handle incoming WebSocket message"""
        if "method" not in data or data["method"] != "eth_subscription":
            return

        params = data.get("params", {})
        subscription_id = params.get("subscription")
        result = params.get("result")

        if not result:
            return

        # Handle new block headers
        if subscription_id == "1":  # newHeads subscription
            await self._handle_new_block(network, result)

        # Handle pending transactions
        elif subscription_id == "2":  # pending transactions subscription
            await self._handle_pending_transaction(network, result)

    async def _handle_new_block(self, network: str, block_data: dict[str, Any]):
        """Handle new block event"""
        try:
            event = StreamedEvent(
                event_id=f"block_{network}_{block_data['number']}_{int(time.time())}",
                event_type=EventType.NEW_BLOCK,
                network=network,
                block_number=int(block_data["number"], 16),
                transaction_hash=None,
                timestamp=datetime.fromtimestamp(int(block_data["timestamp"], 16)),
                priority=EventPriority.INFO,
                data={
                    "block_hash": block_data["hash"],
                    "parent_hash": block_data["parentHash"],
                    "gas_limit": int(block_data["gasLimit"], 16),
                    "gas_used": int(block_data["gasUsed"], 16),
                    "miner": block_data.get("miner"),
                    "difficulty": int(block_data.get("difficulty", "0"), 16),
                    "size": int(block_data.get("size", "0"), 16),
                },
                raw_data=block_data,
            )

            await self._queue_event(event)

        except Exception as e:
            logger.error(f"Error handling new block from {network}: {e}")

    async def _handle_pending_transaction(self, network: str, tx_hash: str):
        """Handle pending transaction event"""
        try:
            # Get full transaction data
            tx_data = await self.blockchain.get_transaction(network, tx_hash)
            if not tx_data:
                return

            # Determine priority based on transaction characteristics
            priority = self._determine_transaction_priority(tx_data)

            event = StreamedEvent(
                event_id=f"tx_{network}_{tx_hash}_{int(time.time())}",
                event_type=EventType.NEW_TRANSACTION,
                network=network,
                block_number=tx_data.block_number,
                transaction_hash=tx_hash,
                timestamp=tx_data.timestamp,
                priority=priority,
                data={
                    "from_address": tx_data.from_address,
                    "to_address": tx_data.to_address,
                    "value": tx_data.value,
                    "gas_price": tx_data.gas_price,
                    "gas_limit": tx_data.gas,
                    "nonce": tx_data.nonce,
                    "input_data": tx_data.input_data,
                    "status": tx_data.status,
                },
                raw_data=asdict(tx_data),
            )

            await self._queue_event(event)

        except Exception as e:
            logger.error(f"Error handling pending transaction from {network}: {e}")

    def _determine_transaction_priority(self, tx_data) -> EventPriority:
        """Determine transaction priority based on characteristics"""
        # High value transactions
        if tx_data.value > 100 * 10**18:  # > 100 ETH
            return EventPriority.HIGH

        # High gas price transactions (potential MEV)
        if tx_data.gas_price > 100 * 10**9:  # > 100 gwei
            return EventPriority.MEDIUM

        # Contract creation
        if not tx_data.to_address:
            return EventPriority.MEDIUM

        # Bridge-related transactions (simplified detection)
        if tx_data.input_data and len(tx_data.input_data) > 10:
            return EventPriority.MEDIUM

        return EventPriority.LOW

    async def _queue_event(self, event: StreamedEvent):
        """Queue event for processing"""
        try:
            # Apply filters
            if not self._event_matches_filters(event):
                return

            # Add to queue
            await self.event_queue.put(event)

            # Add to history
            self.event_history.append(event)

            # Increment counter
            self.event_counter += 1

        except asyncio.QueueFull:
            logger.warning("Event queue is full, dropping event")
        except Exception as e:
            logger.error(f"Error queuing event: {e}")

    def _event_matches_filters(self, event: StreamedEvent) -> bool:
        """Check if event matches any configured filters"""
        if not self.event_filters:
            return True

        for filter_config in self.event_filters:
            # Check event type
            if event.event_type not in filter_config.event_types:
                continue

            # Check network
            if event.network not in filter_config.networks:
                continue

            # Check priority
            priority_levels = [
                EventPriority.INFO,
                EventPriority.LOW,
                EventPriority.MEDIUM,
                EventPriority.HIGH,
                EventPriority.CRITICAL,
            ]
            event_priority_level = priority_levels.index(event.priority)
            min_priority_level = priority_levels.index(filter_config.min_priority)
            if event_priority_level < min_priority_level:
                continue

            # Check contract addresses (for contract events)
            if event.event_type == EventType.CONTRACT_EVENT:
                if filter_config.contract_addresses:
                    contract_address = event.data.get("contract_address", "").lower()
                    if not any(
                        addr.lower() == contract_address
                        for addr in filter_config.contract_addresses
                    ):
                        continue

            # Check block range
            if filter_config.from_block and event.block_number < filter_config.from_block:
                continue
            if filter_config.to_block and event.block_number > filter_config.to_block:
                continue

            return True

        return False

    async def _process_events(self):
        """Process events from the queue"""
        while self.is_streaming:
            try:
                # Get event from queue with timeout
                event = await asyncio.wait_for(self.event_queue.get(), timeout=1.0)

                # Process event
                await self._process_single_event(event)

                # Mark as processed
                self.event_queue.task_done()

            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error processing event: {e}")

    async def _process_single_event(self, event: StreamedEvent):
        """Process a single event"""
        try:
            # Call registered handlers
            handlers = self.event_handlers.get(event.event_type, [])

            for handler in handlers:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        await handler(event)
                    else:
                        handler(event)
                except Exception as e:
                    logger.error(f"Error in event handler: {e}")

            # Mark as processed
            event.processed = True

        except Exception as e:
            logger.error(f"Error processing event {event.event_id}: {e}")

    def register_handler(self, event_type: EventType, handler: Callable):
        """Register event handler"""
        self.event_handlers[event_type].append(handler)
        logger.info(f"Registered handler for {event_type}")

    def add_filter(self, filter_config: EventFilter):
        """Add event filter"""
        self.event_filters.append(filter_config)
        logger.info(f"Added event filter: {filter_config}")

    async def get_event_stream(
        self, event_types: list[EventType] = None, networks: list[str] = None
    ) -> AsyncGenerator[StreamedEvent, None]:
        """Get real-time event stream"""
        # Create temporary filter
        temp_filter = EventFilter(
            event_types=event_types or list(EventType),
            networks=networks or self.blockchain.get_supported_networks(),
        )

        # Add temporary filter
        self.add_filter(temp_filter)

        try:
            # Stream events
            while self.is_streaming:
                try:
                    event = await asyncio.wait_for(self.event_queue.get(), timeout=1.0)

                    if event.event_type in (event_types or list(EventType)):
                        yield event

                    self.event_queue.task_done()

                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    logger.error(f"Error in event stream: {e}")
                    break

        finally:
            # Remove temporary filter
            if temp_filter in self.event_filters:
                self.event_filters.remove(temp_filter)

    def get_event_statistics(self) -> dict[str, Any]:
        """Get event streaming statistics"""
        return {
            "is_streaming": self.is_streaming,
            "total_events": self.event_counter,
            "queue_size": self.event_queue.qsize(),
            "history_size": len(self.event_history),
            "active_connections": len(self.websocket_connections),
            "registered_handlers": {
                event_type.value: len(handlers)
                for event_type, handlers in self.event_handlers.items()
            },
            "active_filters": len(self.event_filters),
        }

    def get_recent_events(self, limit: int = 100) -> list[StreamedEvent]:
        """Get recent events from history"""
        return list(self.event_history)[-limit:]

    async def wait_for_event(
        self, event_type: EventType, timeout: int = 30
    ) -> StreamedEvent | None:
        """Wait for specific event type"""
        start_time = time.time()

        while time.time() - start_time < timeout:
            for event in reversed(self.event_history):
                if event.event_type == event_type and not event.processed:
                    return event

            await asyncio.sleep(0.1)

        return None

    async def cleanup(self):
        """Cleanup resources"""
        await self.stop_streaming()
        self.event_handlers.clear()
        self.event_filters.clear()
        self.event_history.clear()

        # Clear queue
        while not self.event_queue.empty():
            try:
                self.event_queue.get_nowait()
                self.event_queue.task_done()
            except asyncio.QueueEmpty:
                break
