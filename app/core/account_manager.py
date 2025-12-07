#!/usr/bin/env python3
"""
Account Manager
Manages user accounts, wallets, and devices
"""

import hashlib
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
import structlog

from app.models.account import (
    UserAccount, Wallet, Device, Session,
    WalletStatus, DeviceStatus, SessionStatus
)

logger = structlog.get_logger(__name__)


class AccountManager:
    """Manages user accounts and wallets"""
    
    def __init__(self):
        """Initialize account manager"""
        self.accounts: Dict[str, UserAccount] = {}
        self.wallets: Dict[str, Wallet] = {}
        self.devices: Dict[str, Device] = {}
        self.sessions: Dict[str, Session] = {}
        logger.info("Account Manager initialized")
    
    async def create_account(
        self,
        email: str,
        phone_number: Optional[str] = None
    ) -> UserAccount:
        """Create new user account"""
        user_id = self._generate_user_id(email)
        
        account = UserAccount(
            user_id=user_id,
            email=email,
            phone_number=phone_number,
            created_at=datetime.utcnow()
        )
        
        self.accounts[user_id] = account
        logger.info(f"Created account for {email}")
        return account
    
    async def get_account(self, user_id: str) -> Optional[UserAccount]:
        """Get user account"""
        return self.accounts.get(user_id)
    
    async def create_wallet(
        self,
        user_id: str,
        address: str,
        name: str,
        chain: str = "ethereum",
        is_hardware: bool = False,
        is_watch_only: bool = False
    ) -> Wallet:
        """Create new wallet"""
        account = await self.get_account(user_id)
        if not account:
            raise ValueError(f"Account not found: {user_id}")
        
        wallet_id = self._generate_wallet_id(address)
        
        wallet = Wallet(
            wallet_id=wallet_id,
            user_id=user_id,
            address=address,
            name=name,
            chain=chain,
            is_hardware=is_hardware,
            is_watch_only=is_watch_only,
            status=WalletStatus.WATCH_ONLY if is_watch_only else WalletStatus.ACTIVE,
            created_at=datetime.utcnow()
        )
        
        self.wallets[wallet_id] = wallet
        account.wallets.append(wallet)
        
        if not account.default_wallet_id:
            account.default_wallet_id = wallet_id
        
        logger.info(f"Created wallet {wallet_id} for user {user_id}")
        return wallet
    
    async def archive_wallet(self, user_id: str, wallet_id: str) -> Wallet:
        """Archive a wallet"""
        wallet = self.wallets.get(wallet_id)
        if not wallet or wallet.user_id != user_id:
            raise ValueError(f"Wallet not found: {wallet_id}")
        
        wallet.status = WalletStatus.ARCHIVED
        wallet.last_used_at = datetime.utcnow()
        
        logger.info(f"Archived wallet {wallet_id}")
        return wallet
    
    async def rename_wallet(
        self,
        user_id: str,
        wallet_id: str,
        new_name: str
    ) -> Wallet:
        """Rename a wallet"""
        wallet = self.wallets.get(wallet_id)
        if not wallet or wallet.user_id != user_id:
            raise ValueError(f"Wallet not found: {wallet_id}")
        
        wallet.name = new_name
        wallet.last_used_at = datetime.utcnow()
        
        logger.info(f"Renamed wallet {wallet_id} to {new_name}")
        return wallet
    
    async def register_device(
        self,
        user_id: str,
        device_name: str,
        device_type: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        location: Optional[str] = None
    ) -> Device:
        """Register a new device"""
        account = await self.get_account(user_id)
        if not account:
            raise ValueError(f"Account not found: {user_id}")
        
        device_id = self._generate_device_id(user_id, device_name)
        
        # Check device limit
        if len(account.get_trusted_devices()) >= account.max_devices:
            # Remove oldest device
            oldest = min(account.devices, key=lambda d: d.last_seen_at)
            oldest.status = DeviceStatus.BLOCKED
        
        device = Device(
            device_id=device_id,
            user_id=user_id,
            device_name=device_name,
            device_type=device_type,
            status=DeviceStatus.UNKNOWN,  # Requires user approval
            ip_address=ip_address,
            user_agent=user_agent,
            location=location,
            last_seen_at=datetime.utcnow()
        )
        
        self.devices[device_id] = device
        account.devices.append(device)
        
        logger.info(f"Registered device {device_id} for user {user_id}")
        return device
    
    async def trust_device(
        self,
        user_id: str,
        device_id: str
    ) -> Device:
        """Trust a device"""
        device = self.devices.get(device_id)
        if not device or device.user_id != user_id:
            raise ValueError(f"Device not found: {device_id}")
        
        device.status = DeviceStatus.TRUSTED
        device.trusted_at = datetime.utcnow()
        device.last_seen_at = datetime.utcnow()
        
        logger.info(f"Trusted device {device_id}")
        return device
    
    async def create_session(
        self,
        user_id: str,
        device_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        auth_method: str = "password",
        duration_days: int = 30
    ) -> Session:
        """Create new session"""
        account = await self.get_account(user_id)
        if not account:
            raise ValueError(f"Account not found: {user_id}")
        
        # Check session limit
        active_sessions = account.get_active_sessions()
        if len(active_sessions) >= account.max_sessions:
            # Revoke oldest session
            oldest = min(active_sessions, key=lambda s: s.created_at)
            oldest.status = SessionStatus.REVOKED
        
        session_id = self._generate_session_id(user_id)
        
        session = Session(
            session_id=session_id,
            user_id=user_id,
            device_id=device_id,
            status=SessionStatus.ACTIVE,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=duration_days),
            last_activity_at=datetime.utcnow(),
            auth_method=auth_method,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        self.sessions[session_id] = session
        account.active_sessions.append(session)
        
        logger.info(f"Created session {session_id} for user {user_id}")
        return session
    
    async def revoke_session(self, session_id: str) -> Session:
        """Revoke a session"""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")
        
        session.status = SessionStatus.REVOKED
        session.expires_at = datetime.utcnow()
        
        logger.info(f"Revoked session {session_id}")
        return session
    
    async def revoke_all_sessions(self, user_id: str, keep_current: bool = True) -> int:
        """Revoke all sessions for user"""
        account = await self.get_account(user_id)
        if not account:
            raise ValueError(f"Account not found: {user_id}")
        
        revoked_count = 0
        for session in account.active_sessions:
            if session.status == SessionStatus.ACTIVE:
                if not (keep_current and session.is_current_device):
                    await self.revoke_session(session.session_id)
                    revoked_count += 1
        
        logger.info(f"Revoked {revoked_count} sessions for user {user_id}")
        return revoked_count
    
    async def update_session_activity(self, session_id: str):
        """Update session last activity"""
        session = self.sessions.get(session_id)
        if session:
            session.last_activity_at = datetime.utcnow()
    
    def _generate_user_id(self, email: str) -> str:
        """Generate user ID from email"""
        return hashlib.sha256(email.encode()).hexdigest()[:16]
    
    def _generate_wallet_id(self, address: str) -> str:
        """Generate wallet ID from address"""
        return hashlib.sha256(address.encode()).hexdigest()[:16]
    
    def _generate_device_id(self, user_id: str, device_name: str) -> str:
        """Generate device ID"""
        data = f"{user_id}_{device_name}_{datetime.utcnow().isoformat()}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    def _generate_session_id(self, user_id: str) -> str:
        """Generate session ID"""
        data = f"{user_id}_{datetime.utcnow().isoformat()}"
        return hashlib.sha256(data.encode()).hexdigest()[:32]


# Singleton instance
_account_manager = None


def get_account_manager() -> AccountManager:
    """Get or create account manager instance"""
    global _account_manager
    if _account_manager is None:
        _account_manager = AccountManager()
    return _account_manager

