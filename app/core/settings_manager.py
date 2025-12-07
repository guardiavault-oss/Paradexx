#!/usr/bin/env python3
"""
Settings Manager
Manages all user settings and preferences
"""

import json
from typing import Any, Dict, List, Optional
from datetime import datetime
import structlog

from app.models.user_settings import (
    UserSettings, NotificationPreferences, DisplaySettings,
    SecuritySettings, PrivacySettings, TransactionSettings,
    VaultSettings, BridgeSettings, Currency, Language, Theme,
    AutoLockTimer
)

logger = structlog.get_logger(__name__)


class SettingsManager:
    """Manages user settings and preferences"""
    
    def __init__(self):
        """Initialize settings manager"""
        self.settings: Dict[str, UserSettings] = {}
        # In production, this would use a database
        logger.info("Settings Manager initialized")
    
    async def get_settings(self, user_id: str) -> Optional[UserSettings]:
        """Get user settings"""
        return self.settings.get(user_id)
    
    async def create_settings(self, user_id: str, email: str) -> UserSettings:
        """Create default settings for new user"""
        settings = UserSettings(
            user_id=user_id,
            email=email,
            created_at=datetime.utcnow()
        )
        self.settings[user_id] = settings
        logger.info(f"Created default settings for user {user_id}")
        return settings
    
    async def update_notification_settings(
        self,
        user_id: str,
        updates: Dict[str, Any]
    ) -> UserSettings:
        """Update notification settings"""
        settings = await self.get_settings(user_id)
        if not settings:
            raise ValueError(f"Settings not found for user {user_id}")
        
        # Update notification preferences
        for key, value in updates.items():
            if hasattr(settings.notifications, key):
                setattr(settings.notifications, key, value)
        
        settings.updated_at = datetime.utcnow()
        logger.info(f"Updated notification settings for user {user_id}")
        return settings
    
    async def update_display_settings(
        self,
        user_id: str,
        updates: Dict[str, Any]
    ) -> UserSettings:
        """Update display settings"""
        settings = await self.get_settings(user_id)
        if not settings:
            raise ValueError(f"Settings not found for user {user_id}")
        
        # Update display preferences
        for key, value in updates.items():
            if hasattr(settings.display, key):
                if key == "currency" and isinstance(value, str):
                    value = Currency(value)
                elif key == "language" and isinstance(value, str):
                    value = Language(value)
                elif key == "theme" and isinstance(value, str):
                    value = Theme(value)
                setattr(settings.display, key, value)
        
        settings.updated_at = datetime.utcnow()
        logger.info(f"Updated display settings for user {user_id}")
        return settings
    
    async def update_security_settings(
        self,
        user_id: str,
        updates: Dict[str, Any]
    ) -> UserSettings:
        """Update security settings"""
        settings = await self.get_settings(user_id)
        if not settings:
            raise ValueError(f"Settings not found for user {user_id}")
        
        # Update security preferences
        for key, value in updates.items():
            if hasattr(settings.security, key):
                if key == "auto_lock_timer" and isinstance(value, str):
                    value = AutoLockTimer(value)
                setattr(settings.security, key, value)
        
        settings.updated_at = datetime.utcnow()
        logger.info(f"Updated security settings for user {user_id}")
        return settings
    
    async def accept_legal(
        self,
        user_id: str,
        tos_version: str,
        privacy_policy_version: str
    ) -> UserSettings:
        """Accept terms of service and privacy policy"""
        settings = await self.get_settings(user_id)
        if not settings:
            raise ValueError(f"Settings not found for user {user_id}")
        
        now = datetime.utcnow()
        settings.tos_accepted = True
        settings.tos_accepted_at = now
        settings.tos_version = tos_version
        settings.privacy_policy_accepted = True
        settings.privacy_policy_accepted_at = now
        settings.privacy_policy_version = privacy_policy_version
        settings.updated_at = now
        
        logger.info(f"User {user_id} accepted legal documents")
        return settings
    
    async def verify_age(self, user_id: str) -> UserSettings:
        """Verify user age (18+)"""
        settings = await self.get_settings(user_id)
        if not settings:
            raise ValueError(f"Settings not found for user {user_id}")
        
        settings.age_verified = True
        settings.age_verification_date = datetime.utcnow()
        settings.updated_at = datetime.utcnow()
        
        logger.info(f"Age verified for user {user_id}")
        return settings
    
    async def set_jurisdiction(
        self,
        user_id: str,
        jurisdiction: str,
        restricted: bool = False
    ) -> UserSettings:
        """Set user jurisdiction"""
        settings = await self.get_settings(user_id)
        if not settings:
            raise ValueError(f"Settings not found for user {user_id}")
        
        settings.jurisdiction = jurisdiction
        if restricted:
            # Check OFAC/sanctioned countries
            restricted_countries = [
                "IR", "KP", "SY", "CU", "BY", "RU", "CN"  # Simplified list
            ]
            if jurisdiction.upper() in restricted_countries:
                raise ValueError(f"Jurisdiction {jurisdiction} is restricted")
        
        settings.updated_at = datetime.utcnow()
        logger.info(f"Set jurisdiction for user {user_id}: {jurisdiction}")
        return settings
    
    async def export_user_data(self, user_id: str, format: str = "json") -> str:
        """Export user data (GDPR requirement)"""
        settings = await self.get_settings(user_id)
        if not settings:
            raise ValueError(f"Settings not found for user {user_id}")
        
        data = settings.to_dict()
        
        if format == "json":
            return json.dumps(data, indent=2, default=str)
        elif format == "csv":
            # Convert to CSV format
            lines = []
            for key, value in data.items():
                lines.append(f"{key},{value}")
            return "\n".join(lines)
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    async def schedule_account_deletion(
        self,
        user_id: str,
        reason: Optional[str] = None,
        delay_days: int = 30
    ) -> UserSettings:
        """Schedule account deletion"""
        settings = await self.get_settings(user_id)
        if not settings:
            raise ValueError(f"Settings not found for user {user_id}")
        
        deletion_date = datetime.utcnow().replace(
            day=datetime.utcnow().day + delay_days
        )
        
        settings.privacy.account_deletion_scheduled = deletion_date
        settings.privacy.account_deletion_reason = reason
        settings.updated_at = datetime.utcnow()
        
        logger.info(f"Scheduled account deletion for user {user_id} on {deletion_date}")
        return settings
    
    async def cancel_account_deletion(self, user_id: str) -> UserSettings:
        """Cancel scheduled account deletion"""
        settings = await self.get_settings(user_id)
        if not settings:
            raise ValueError(f"Settings not found for user {user_id}")
        
        settings.privacy.account_deletion_scheduled = None
        settings.privacy.account_deletion_reason = None
        settings.updated_at = datetime.utcnow()
        
        logger.info(f"Cancelled account deletion for user {user_id}")
        return settings


# Singleton instance
_settings_manager = None


def get_settings_manager() -> SettingsManager:
    """Get or create settings manager instance"""
    global _settings_manager
    if _settings_manager is None:
        _settings_manager = SettingsManager()
    return _settings_manager

