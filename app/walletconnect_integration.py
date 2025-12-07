#!/usr/bin/env python3
"""
WalletConnect Integration Module
Handles WalletConnect protocol for wallet connections
"""

import os
import json
import uuid
from typing import Dict, Optional, List, Any
from datetime import datetime, timedelta
import aiohttp
from dotenv import load_dotenv

load_dotenv()

# WalletConnect Project ID (get from https://cloud.walletconnect.com)
WALLETCONNECT_PROJECT_ID = os.getenv("WALLETCONNECT_PROJECT_ID", "")

class WalletConnectManager:
    """Manage WalletConnect sessions and connections"""
    
    def __init__(self):
        self.project_id = WALLETCONNECT_PROJECT_ID
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self.pending_connections: Dict[str, Dict[str, Any]] = {}
        
    def get_project_config(self) -> Dict[str, Any]:
        """Get WalletConnect project configuration"""
        return {
            "project_id": self.project_id,
            "metadata": {
                "name": "Wallet Guard",
                "description": "Enterprise wallet protection service",
                "url": "https://wallet-guard.example.com",
                "icons": ["https://wallet-guard.example.com/icon.png"]
            },
            "supported_chains": [
                {"chain_id": 1, "name": "Ethereum"},
                {"chain_id": 137, "name": "Polygon"},
                {"chain_id": 56, "name": "BSC"},
                {"chain_id": 42161, "name": "Arbitrum"},
                {"chain_id": 10, "name": "Optimism"},
                {"chain_id": 43114, "name": "Avalanche"}
            ]
        }
    
    def create_connection_request(self, wallet_address: Optional[str] = None) -> Dict[str, Any]:
        """Create a new WalletConnect connection request"""
        session_id = str(uuid.uuid4())
        
        connection_request = {
            "session_id": session_id,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "wallet_address": wallet_address,
            "expires_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat()
        }
        
        self.pending_connections[session_id] = connection_request
        
        return {
            **connection_request,
            "wc_uri": f"wc:{session_id}@1?bridge=https://bridge.walletconnect.org&key={uuid.uuid4().hex[:32]}",
            "project_config": self.get_project_config()
        }
    
    def create_session(self, session_id: str, wallet_address: str, accounts: List[str], chain_id: int) -> Dict[str, Any]:
        """Create a WalletConnect session"""
        session = {
            "session_id": session_id,
            "wallet_address": wallet_address,
            "accounts": accounts,
            "chain_id": chain_id,
            "status": "connected",
            "connected_at": datetime.utcnow().isoformat(),
            "last_activity": datetime.utcnow().isoformat()
        }
        
        self.active_sessions[session_id] = session
        if session_id in self.pending_connections:
            del self.pending_connections[session_id]
        
        return session
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get WalletConnect session"""
        return self.active_sessions.get(session_id)
    
    def disconnect_session(self, session_id: str) -> Dict[str, Any]:
        """Disconnect WalletConnect session"""
        if session_id in self.active_sessions:
            session = self.active_sessions.pop(session_id)
            session["status"] = "disconnected"
            session["disconnected_at"] = datetime.utcnow().isoformat()
            return session
        return {"error": "Session not found"}
    
    def list_sessions(self) -> Dict[str, Any]:
        """List all active WalletConnect sessions"""
        return {
            "total": len(self.active_sessions),
            "sessions": list(self.active_sessions.values())
        }
    
    def send_transaction_request(self, session_id: str, transaction: Dict[str, Any]) -> Dict[str, Any]:
        """Send a transaction request via WalletConnect"""
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found"}
        
        request_id = str(uuid.uuid4())
        
        # Update session activity
        session["last_activity"] = datetime.utcnow().isoformat()
        
        return {
            "request_id": request_id,
            "session_id": session_id,
            "transaction": transaction,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat()
        }
    
    def approve_transaction(self, request_id: str, tx_hash: str) -> Dict[str, Any]:
        """Approve a transaction request"""
        return {
            "request_id": request_id,
            "tx_hash": tx_hash,
            "status": "approved",
            "approved_at": datetime.utcnow().isoformat()
        }
    
    def reject_transaction(self, request_id: str, reason: str) -> Dict[str, Any]:
        """Reject a transaction request"""
        return {
            "request_id": request_id,
            "status": "rejected",
            "reason": reason,
            "rejected_at": datetime.utcnow().isoformat()
        }

# Global instance
walletconnect_manager = WalletConnectManager()

