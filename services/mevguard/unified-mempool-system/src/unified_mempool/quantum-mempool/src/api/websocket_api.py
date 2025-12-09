import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "core-engine"))
"""
Real-time WebSocket API for quantum mempool monitoring.
"""

import asyncio  # noqa: E402
import json  # noqa: E402
from datetime import datetime  # noqa: E402
from typing import Dict, Set  # noqa: E402

import websockets  # noqa: E402
from common.observability.logging import get_scorpius_logger  # noqa: E402
from websockets.server import WebSocketServerProtocol  # noqa: E402

from ..enterprise.audit_logger import SecurityEventLogger  # noqa: E402
from ..enterprise.security_manager import EnterpriseSecurityManager  # noqa: E402
from ..utils.config import EnterpriseConfig  # noqa: E402


class WebSocketAPI:
    """
    Real-time WebSocket API for quantum mempool monitoring.

    Features:
    - Real-time threat alerts
    - Live mempool statistics
    - System health monitoring
    - Client subscription management
    - Enterprise security integration
    """

    def __init__(self, config: EnterpriseConfig):
        self.config = config
        self.logger = get_scorpius_logger(__name__)

        # Security and audit
        self.security_manager = EnterpriseSecurityManager(config)
        self.audit_logger = SecurityEventLogger(config.audit_config.__dict__)

        # Client management
        self.clients: Set[WebSocketServerProtocol] = set()
        self.client_subscriptions: Dict[WebSocketServerProtocol, Set[str]] = {}

        # Message queues
        self.alert_queue = asyncio.Queue()
        self.metrics_queue = asyncio.Queue()
        self.system_queue = asyncio.Queue()

        # State
        self.is_running = False
        self.server = None

    async def initialize(self):
        """Initialize WebSocket API."""
        await self.security_manager.initialize_enterprise_security()
        self.logger.info("WebSocket API initialized")

    async def start_server(self):
        """Start WebSocket server."""
        try:
            self.is_running = True

            # Start WebSocket server
            self.server = await websockets.serve(
                self.handle_client,
                self.config.websocket_config.host,
                self.config.websocket_config.port,
                ping_interval=self.config.websocket_config.ping_interval,
                ping_timeout=self.config.websocket_config.ping_timeout,
                compression=self.config.websocket_config.compression,
                max_size=10**6,  # 1MB max message size
            )

            # Start message broadcasting tasks
            asyncio.create_task(self.broadcast_alerts())
            asyncio.create_task(self.broadcast_metrics())
            asyncio.create_task(self.broadcast_system_status())

            self.logger.info(
                f"WebSocket server started on {self.config.websocket_config.host}:{self.config.websocket_config.port}"
            )

        except Exception as e:
            self.logger.error(f"Failed to start WebSocket server: {str(e)}")
            raise

    async def handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """Handle new WebSocket client connection."""
        client_ip = (
            websocket.remote_address[0] if websocket.remote_address else "unknown"
        )

        try:
            # Add client to set
            self.clients.add(websocket)
            self.client_subscriptions[websocket] = set()

            # Log connection
            await self.audit_logger.log_security_event(
                {
                    "event_type": "WEBSOCKET_CONNECTION",
                    "client_ip": client_ip,
                    "timestamp": datetime.utcnow(),
                    "status": "CONNECTED",
                }
            )

            self.logger.info(f"WebSocket client connected: {client_ip}")

            # Send welcome message
            await self.send_to_client(
                websocket,
                {
                    "type": "welcome",
                    "server_time": datetime.utcnow().isoformat(),
                    "available_channels": [
                        "alerts",
                        "metrics",
                        "system_status",
                        "mempool_stats",
                        "quantum_threats",
                    ],
                },
            )

            # Handle client messages
            async for message in websocket:
                await self.handle_client_message(websocket, message)

        except websockets.exceptions.ConnectionClosed:
            self.logger.info(f"WebSocket client disconnected: {client_ip}")
        except Exception as e:
            self.logger.error(f"WebSocket client error: {str(e)}")
        finally:
            # Clean up client
            self.clients.discard(websocket)
            self.client_subscriptions.pop(websocket, None)

            # Log disconnection
            await self.audit_logger.log_security_event(
                {
                    "event_type": "WEBSOCKET_DISCONNECTION",
                    "client_ip": client_ip,
                    "timestamp": datetime.utcnow(),
                    "status": "DISCONNECTED",
                }
            )

    async def handle_client_message(
        self, websocket: WebSocketServerProtocol, message: str
    ):
        """Handle incoming client message."""
        try:
            data = json.loads(message)
            message_type = data.get("type")

            if message_type == "subscribe":
                channels = data.get("channels", [])
                await self.subscribe_client(websocket, channels)

            elif message_type == "unsubscribe":
                channels = data.get("channels", [])
                await self.unsubscribe_client(websocket, channels)

            elif message_type == "get_status":
                await self.send_system_status(websocket)

            elif message_type == "get_metrics":
                await self.send_current_metrics(websocket)

            else:
                await self.send_to_client(
                    websocket,
                    {
                        "type": "error",
                        "message": f"Unknown message type: {message_type}",
                    },
                )

        except json.JSONDecodeError:
            await self.send_to_client(
                websocket, {"type": "error", "message": "Invalid JSON message"}
            )
        except Exception as e:
            self.logger.error(f"Error handling client message: {str(e)}")
            await self.send_to_client(
                websocket, {"type": "error", "message": "Internal server error"}
            )

    async def subscribe_client(
        self, websocket: WebSocketServerProtocol, channels: list
    ):
        """Subscribe client to channels."""
        valid_channels = {
            "alerts",
            "metrics",
            "system_status",
            "mempool_stats",
            "quantum_threats",
        }

        subscribed = []
        for channel in channels:
            if channel in valid_channels:
                self.client_subscriptions[websocket].add(channel)
                subscribed.append(channel)

        await self.send_to_client(
            websocket, {"type": "subscription_confirmed", "channels": subscribed}
        )

        self.logger.info(f"Client subscribed to channels: {subscribed}")

    async def unsubscribe_client(
        self, websocket: WebSocketServerProtocol, channels: list
    ):
        """Unsubscribe client from channels."""
        unsubscribed = []
        for channel in channels:
            if channel in self.client_subscriptions[websocket]:
                self.client_subscriptions[websocket].remove(channel)
                unsubscribed.append(channel)

        await self.send_to_client(
            websocket, {"type": "unsubscription_confirmed", "channels": unsubscribed}
        )

    async def send_to_client(self, websocket: WebSocketServerProtocol, data: dict):
        """Send data to specific client."""
        try:
            message = json.dumps(data, default=str)
            await websocket.send(message)
        except Exception as e:
            self.logger.error(f"Failed to send message to client: {str(e)}")

    async def broadcast_to_channel(self, channel: str, data: dict):
        """Broadcast data to all clients subscribed to channel."""
        if not self.clients:
            return

        message = json.dumps(
            {"channel": channel, "timestamp": datetime.utcnow().isoformat(), **data},
            default=str,
        )

        # Send to subscribed clients
        tasks = []
        for websocket in self.clients.copy():
            if channel in self.client_subscriptions.get(websocket, set()):
                tasks.append(self.safe_send(websocket, message))

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def safe_send(self, websocket: WebSocketServerProtocol, message: str):
        """Safely send message to client with error handling."""
        try:
            await websocket.send(message)
        except websockets.exceptions.ConnectionClosed:
            # Client disconnected, remove from clients
            self.clients.discard(websocket)
            self.client_subscriptions.pop(websocket, None)
        except Exception as e:
            self.logger.error(f"Error sending message to client: {str(e)}")

    async def send_alert(self, alert_data: dict):
        """Queue alert for broadcasting."""
        await self.alert_queue.put(alert_data)

    async def send_metrics(self, metrics_data: dict):
        """Queue metrics for broadcasting."""
        await self.metrics_queue.put(metrics_data)

    async def send_system_update(self, system_data: dict):
        """Queue system update for broadcasting."""
        await self.system_queue.put(system_data)

    async def broadcast_alerts(self):
        """Background task to broadcast alerts."""
        while self.is_running:
            try:
                alert_data = await asyncio.wait_for(self.alert_queue.get(), timeout=1.0)
                await self.broadcast_to_channel(
                    "alerts", {"type": "alert", "data": alert_data}
                )
                await self.broadcast_to_channel(
                    "quantum_threats", {"type": "quantum_threat", "data": alert_data}
                )
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                self.logger.error(f"Error broadcasting alerts: {str(e)}")

    async def broadcast_metrics(self):
        """Background task to broadcast metrics."""
        while self.is_running:
            try:
                metrics_data = await asyncio.wait_for(
                    self.metrics_queue.get(), timeout=1.0
                )
                await self.broadcast_to_channel(
                    "metrics", {"type": "metrics", "data": metrics_data}
                )
                await self.broadcast_to_channel(
                    "mempool_stats", {"type": "mempool_stats", "data": metrics_data}
                )
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                self.logger.error(f"Error broadcasting metrics: {str(e)}")

    async def broadcast_system_status(self):
        """Background task to broadcast system status."""
        while self.is_running:
            try:
                system_data = await asyncio.wait_for(
                    self.system_queue.get(), timeout=1.0
                )
                await self.broadcast_to_channel(
                    "system_status", {"type": "system_status", "data": system_data}
                )
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                self.logger.error(f"Error broadcasting system status: {str(e)}")

    async def send_system_status(self, websocket: WebSocketServerProtocol):
        """Send current system status to client."""
        status = {
            "uptime": datetime.utcnow().isoformat(),
            "connected_clients": len(self.clients),
            "active_subscriptions": sum(
                len(subs) for subs in self.client_subscriptions.values()
            ),
            "server_status": "healthy",
        }

        await self.send_to_client(websocket, {"type": "system_status", "data": status})

    async def send_current_metrics(self, websocket: WebSocketServerProtocol):
        """Send current metrics to client."""
        # This would be populated by the metrics collector
        metrics = {
            "timestamp": datetime.utcnow().isoformat(),
            "transactions_processed": 0,
            "threats_detected": 0,
            "system_load": 0.0,
        }

        await self.send_to_client(websocket, {"type": "metrics", "data": metrics})

    async def stop_server(self):
        """Stop WebSocket server."""
        self.is_running = False

        if self.server:
            self.server.close()
            await self.server.wait_closed()

        # Close all client connections
        if self.clients:
            await asyncio.gather(
                *[client.close() for client in self.clients], return_exceptions=True
            )

        self.logger.info("WebSocket server stopped")
