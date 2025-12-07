#!/usr/bin/env python3
"""
Security Manager
2FA, biometric, recovery, and security features
"""

import secrets
import pyotp
import qrcode
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import structlog

logger = structlog.get_logger(__name__)


class TwoFactorMethod(str):
    """2FA method enumeration"""
    TOTP = "totp"
    SMS = "sms"
    EMAIL = "email"


@dataclass
class TwoFactorSetup:
    """2FA setup information"""
    user_id: str
    method: str
    secret: Optional[str] = None
    qr_code: Optional[str] = None
    backup_codes: List[str] = field(default_factory=list)
    setup_complete: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class SecurityEvent:
    """Security event log"""
    event_id: str
    user_id: str
    event_type: str  # "login", "logout", "suspicious_activity", "recovery_request", etc.
    timestamp: datetime = field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None
    location: Optional[str] = None
    device_id: Optional[str] = None
    details: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "event_id": self.event_id,
            "user_id": self.user_id,
            "event_type": self.event_type,
            "timestamp": self.timestamp.isoformat(),
            "ip_address": self.ip_address,
            "location": self.location,
            "device_id": self.device_id,
            "details": self.details
        }


class SecurityManager:
    """Manages security features"""
    
    def __init__(self):
        """Initialize security manager"""
        self.two_factor_setups: Dict[str, TwoFactorSetup] = {}
        self.security_events: List[SecurityEvent] = []
        self.recovery_requests: Dict[str, Dict[str, Any]] = {}
        self.suspicious_activity: Dict[str, List[Dict[str, Any]]] = {}
        logger.info("Security Manager initialized")
    
    async def setup_two_factor(
        self,
        user_id: str,
        method: str = "totp"
    ) -> TwoFactorSetup:
        """Setup 2FA for user"""
        if method == "totp":
            secret = pyotp.random_base32()
            totp = pyotp.TOTP(secret)
            
            # Generate QR code data
            uri = totp.provisioning_uri(
                name=user_id,
                issuer_name="GuardianX"
            )
            
            # Generate backup codes
            backup_codes = [secrets.token_hex(4).upper() for _ in range(10)]
            
            setup = TwoFactorSetup(
                user_id=user_id,
                method=method,
                secret=secret,
                qr_code=uri,
                backup_codes=backup_codes
            )
            
            self.two_factor_setups[user_id] = setup
            logger.info(f"2FA setup initiated for user {user_id}")
            return setup
        else:
            raise ValueError(f"Unsupported 2FA method: {method}")
    
    async def verify_two_factor(
        self,
        user_id: str,
        code: str
    ) -> bool:
        """Verify 2FA code"""
        setup = self.two_factor_setups.get(user_id)
        if not setup:
            return False
        
        if not setup.setup_complete:
            return False
        
        if setup.method == "totp":
            totp = pyotp.TOTP(setup.secret)
            return totp.verify(code, valid_window=1)
        elif setup.method == "sms" or setup.method == "email":
            # In production, verify SMS/email code
            return code == "123456"  # Mock verification
        
        return False
    
    async def verify_backup_code(
        self,
        user_id: str,
        code: str
    ) -> bool:
        """Verify backup code"""
        setup = self.two_factor_setups.get(user_id)
        if not setup:
            return False
        
        if code.upper() in setup.backup_codes:
            setup.backup_codes.remove(code.upper())
            logger.info(f"Backup code used for user {user_id}")
            return True
        
        return False
    
    async def log_security_event(
        self,
        user_id: str,
        event_type: str,
        ip_address: Optional[str] = None,
        location: Optional[str] = None,
        device_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> SecurityEvent:
        """Log security event"""
        import hashlib
        event_id = hashlib.sha256(
            f"{user_id}_{event_type}_{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]
        
        event = SecurityEvent(
            event_id=event_id,
            user_id=user_id,
            event_type=event_type,
            ip_address=ip_address,
            location=location,
            device_id=device_id,
            details=details or {}
        )
        
        self.security_events.append(event)
        
        # Track suspicious activity
        if event_type in ["suspicious_login", "unusual_activity", "failed_2fa"]:
            if user_id not in self.suspicious_activity:
                self.suspicious_activity[user_id] = []
            self.suspicious_activity[user_id].append(event.to_dict())
        
        logger.info(f"Security event logged: {event_type} for user {user_id}")
        return event
    
    async def get_security_events(
        self,
        user_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get security events for user"""
        events = [
            e for e in self.security_events
            if e.user_id == user_id
        ][-limit:]
        
        return [e.to_dict() for e in events]
    
    async def detect_suspicious_activity(
        self,
        user_id: str,
        current_ip: str,
        current_location: str,
        device_id: str
    ) -> bool:
        """Detect suspicious activity"""
        # Get recent events
        recent_events = [
            e for e in self.security_events
            if e.user_id == user_id and
            (datetime.utcnow() - e.timestamp).total_seconds() < 3600  # Last hour
        ]
        
        # Check for unusual patterns
        ip_changes = len(set(e.ip_address for e in recent_events if e.ip_address))
        location_changes = len(set(e.location for e in recent_events if e.location))
        
        # Multiple IPs in short time = suspicious
        if ip_changes > 3:
            await self.log_security_event(
                user_id=user_id,
                event_type="suspicious_activity",
                ip_address=current_ip,
                location=current_location,
                device_id=device_id,
                details={"reason": "multiple_ip_changes", "ip_count": ip_changes}
            )
            return True
        
        # Different location = suspicious
        if location_changes > 2:
            await self.log_security_event(
                user_id=user_id,
                event_type="suspicious_activity",
                ip_address=current_ip,
                location=current_location,
                device_id=device_id,
                details={"reason": "location_changes", "location_count": location_changes}
            )
            return True
        
        return False
    
    async def request_recovery(
        self,
        user_id: str,
        recovery_method: str = "guardian"
    ) -> str:
        """Request account recovery"""
        import hashlib
        request_id = hashlib.sha256(
            f"{user_id}_{recovery_method}_{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]
        
        self.recovery_requests[request_id] = {
            "user_id": user_id,
            "method": recovery_method,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(days=7)).isoformat()
        }
        
        await self.log_security_event(
            user_id=user_id,
            event_type="recovery_request",
            details={"recovery_method": recovery_method, "request_id": request_id}
        )
        
        logger.info(f"Recovery requested for user {user_id}: {request_id}")
        return request_id
    
    async def cancel_recovery(self, request_id: str, user_id: str) -> bool:
        """Cancel recovery request"""
        request = self.recovery_requests.get(request_id)
        if not request or request["user_id"] != user_id:
            return False
        
        if request["status"] == "pending":
            request["status"] = "cancelled"
            await self.log_security_event(
                user_id=user_id,
                event_type="recovery_cancelled",
                details={"request_id": request_id}
            )
            return True
        
        return False


# Singleton instance
_security_manager = None


def get_security_manager() -> SecurityManager:
    """Get or create security manager instance"""
    global _security_manager
    if _security_manager is None:
        _security_manager = SecurityManager()
    return _security_manager

