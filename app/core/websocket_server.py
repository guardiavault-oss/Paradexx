#!/usr/bin/env python3
"""
WebSocket Server for real-time updates
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Set
import websockets
from websockets.server import WebSocketServerProtocol

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        self.connections: Set[WebSocketServerProtocol] = set()
        
    async def register(self, websocket: WebSocketServerProtocol):
        """Register a new WebSocket connection"""
        self.connections.add(websocket)
        logger.info(f"Client connected. Total connections: {len(self.connections)}")
        
        # Send welcome message
        await websocket.send(json.dumps({
            "type": "connected",
            "message": "Connected to GuardianX WebSocket server",
            "timestamp": datetime.now().isoformat()
        }))
    
    async def unregister(self, websocket: WebSocketServerProtocol):
        """Unregister a WebSocket connection"""
        self.connections.discard(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.connections)}")
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        if self.connections:
            message_str = json.dumps(message)
            await asyncio.gather(
                *[ws.send(message_str) for ws in self.connections],
                return_exceptions=True
            )
    
    async def send_to_client(self, websocket: WebSocketServerProtocol, message: dict):
        """Send message to specific client"""
        await websocket.send(json.dumps(message))

# Global manager instance
manager = WebSocketManager()

async def handle_client(websocket: WebSocketServerProtocol, path: str):
    """Handle a WebSocket client connection"""
    await manager.register(websocket)
    
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                logger.info(f"Received message: {data.get('type', 'unknown')}")
                
                # Handle different message types
                if data.get("type") == "ping":
                    await manager.send_to_client(websocket, {
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    })
                
                elif data.get("type") == "subscribe":
                    # Subscribe to specific events
                    await manager.send_to_client(websocket, {
                        "type": "subscribed",
                        "channel": data.get("channel", "all"),
                        "timestamp": datetime.now().isoformat()
                    })
                
                elif data.get("type") == "threat_alert":
                    # Broadcast threat alert to all clients
                    await manager.broadcast({
                        "type": "threat_detected",
                        "severity": data.get("severity", "medium"),
                        "message": data.get("message", "Potential threat detected"),
                        "timestamp": datetime.now().isoformat()
                    })
                
                elif data.get("type") == "vault_update":
                    # Broadcast vault update
                    await manager.broadcast({
                        "type": "vault_status_changed",
                        "vault_id": data.get("vault_id"),
                        "status": data.get("status"),
                        "timestamp": datetime.now().isoformat()
                    })
                
                else:
                    # Echo unknown messages back
                    await manager.send_to_client(websocket, {
                        "type": "echo",
                        "original": data,
                        "timestamp": datetime.now().isoformat()
                    })
                    
            except json.JSONDecodeError:
                await manager.send_to_client(websocket, {
                    "type": "error",
                    "message": "Invalid JSON",
                    "timestamp": datetime.now().isoformat()
                })
                
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        await manager.unregister(websocket)

async def send_periodic_updates():
    """Send periodic updates to all connected clients"""
    while True:
        await asyncio.sleep(30)  # Send update every 30 seconds
        
        # Send portfolio update
        await manager.broadcast({
            "type": "portfolio_update",
            "data": {
                "totalValue": 125430.50,
                "change": 120.50,
                "timestamp": datetime.now().isoformat()
            }
        })
        
        # Occasionally send security alerts
        import random
        if random.random() > 0.7:
            await manager.broadcast({
                "type": "security_alert",
                "level": "info",
                "message": "Routine security scan completed. No threats detected.",
                "timestamp": datetime.now().isoformat()
            })

async def main():
    """Start WebSocket server"""
    # Start periodic updates
    asyncio.create_task(send_periodic_updates())
    
    # Start WebSocket server
    async with websockets.serve(handle_client, "0.0.0.0", 8005):
        logger.info("WebSocket server started on ws://localhost:8005")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    print("\n" + "="*50)
    print("WebSocket Server")
    print("="*50)
    print(f"WebSocket: ws://localhost:8005")
    print("="*50 + "\n")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("WebSocket server stopped")

