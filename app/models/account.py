#!/usr/bin/env python3
"""
Account Management Models
User accounts, wallets, and device management
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from datetime import datetime
from enum import Enum


class WalletStatus(str, Enum):
    """Wallet status enumeration"""
    ACTIVE = "active"
    ARCHIVED = "archived"
    HIDDEN = "hidden"
    WATCH_ONLY = "watch_only"
    RECOVERY_PENDING = "recovery_pending"


class DeviceStatus(str, Enum):
    """Device status enumeration"""
    TRUSTED = "trusted"
    UNKNOWN = "unknown"
    SUSPICIOUS = "suspicious"
    BLOCKED = "blocked"


class SessionStatus(str, Enum):
    """Session status enumeration"""
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"


@dataclass
class Wallet:
    """Wallet information"""
    wallet_id: str
    user_id: str
    address: str
    name: str
    status: WalletStatus = WalletStatus.ACTIVE
    chain: str = "ethereum"
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_used_at: datetime = field(default_factory=datetime.utcnow)
    
    # Wallet metadata
    is_hardware: bool = False
    hardware_type: Optional[str] = None
    is_multisig: bool = False
    is_watch_only: bool = False
    
    # Backup status
    backup_completed: bool = False
    backup_method: Optional[str] = None  # "seed", "guardian", "multi_sig"
    backup_reminder_sent: bool = False
    last_backup_reminder: Optional[datetime] = None
    
    # Balance cache
    cached_balance: float = 0.0
    balance_updated_at: Optional[datetime] = None
    
    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Device:
    """Device information"""
    device_id: str
    user_id: str
    device_name: str
    device_type: str  # "ios", "android", "web", "desktop"
    status: DeviceStatus = DeviceStatus.UNKNOWN
    trusted_at: Optional[datetime] = None
    
    # Device details
    os_version: Optional[str] = None
    app_version: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None  # City, Country
    user_agent: Optional[str] = None
    
    # Security
    fingerprint: Optional[str] = None
    last_seen_at: datetime = field(default_factory=datetime.utcnow)
    is_current_device: bool = False
    
    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Session:
    """User session information"""
    session_id: str
    user_id: str
    device_id: Optional[str] = None
    status: SessionStatus = SessionStatus.ACTIVE
    
    # Session details
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime = field(default_factory=lambda: datetime.utcnow())
    last_activity_at: datetime = field(default_factory=datetime.utcnow)
    
    # Authentication
    auth_method: str = "password"  # "password", "biometric", "2fa"
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    location: Optional[str] = None
    
    # Security
    requires_reauth: bool = False
    suspicious_activity_detected: bool = False
    
    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class UserAccount:
    """Complete user account"""
    user_id: str
    email: str
    phone_number: Optional[str] = None
    
    # Account status
    is_verified: bool = False
    is_active: bool = True
    is_deleted: bool = False
    deletion_scheduled_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_login_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    
    # Compliance
    age_verified: bool = False
    age_verification_date: Optional[datetime] = None
    jurisdiction: Optional[str] = None
    restricted_jurisdictions: List[str] = field(default_factory=list)
    
    # Account type
    account_tier: str = "free"  # "free", "premium", "enterprise"
    subscription_status: Optional[str] = None
    
    # Wallets
    wallets: List[Wallet] = field(default_factory=list)
    default_wallet_id: Optional[str] = None
    
    # Devices
    devices: List[Device] = field(default_factory=list)
    max_devices: int = 5
    
    # Sessions
    active_sessions: List[Session] = field(default_factory=list)
    max_sessions: int = 5
    
    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def get_active_wallets(self) -> List[Wallet]:
        """Get active wallets"""
        return [w for w in self.wallets if w.status == WalletStatus.ACTIVE]
    
    def get_default_wallet(self) -> Optional[Wallet]:
        """Get default wallet"""
        if self.default_wallet_id:
            for wallet in self.wallets:
                if wallet.wallet_id == self.default_wallet_id:
                    return wallet
        return self.wallets[0] if self.wallets else None
    
    def get_trusted_devices(self) -> List[Device]:
        """Get trusted devices"""
        return [d for d in self.devices if d.status == DeviceStatus.TRUSTED]
    
    def get_active_sessions(self) -> List[Session]:
        """Get active sessions"""
        return [s for s in self.active_sessions if s.status == SessionStatus.ACTIVE]

