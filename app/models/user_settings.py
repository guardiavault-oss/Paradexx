#!/usr/bin/env python3
"""
User Settings Models
Comprehensive settings management for all user preferences
"""

from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional
from datetime import datetime
from enum import Enum


class NotificationType(str, Enum):
    """Notification type enumeration"""
    TRANSACTION = "transaction"
    SECURITY = "security"
    MARKETING = "marketing"
    VAULT = "vault"
    GUARDIAN = "guardian"
    YIELD = "yield"
    BRIDGE = "bridge"
    GENERAL = "general"


class Currency(str, Enum):
    """Supported currencies"""
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    JPY = "JPY"
    CNY = "CNY"


class Language(str, Enum):
    """Supported languages"""
    EN = "en"
    ES = "es"
    FR = "fr"
    DE = "de"
    ZH = "zh"
    JA = "ja"


class Theme(str, Enum):
    """Theme options"""
    DARK = "dark"
    LIGHT = "light"
    AUTO = "auto"


class AutoLockTimer(str, Enum):
    """Auto-lock timer options"""
    INSTANT = "instant"
    ONE_MIN = "1min"
    FIVE_MIN = "5min"
    FIFTEEN_MIN = "15min"
    NEVER = "never"


@dataclass
class NotificationPreferences:
    """User notification preferences"""
    enabled: bool = True
    push: bool = True
    email: bool = True
    sms: bool = False
    transaction_notifications: bool = True
    security_alerts: bool = True
    marketing_emails: bool = False
    vault_reminders: bool = True
    guardian_alerts: bool = True
    yield_updates: bool = True
    bridge_status: bool = True
    
    # Threshold-based notifications
    high_value_threshold: float = 1000.0  # Notify for transactions > $1000
    require_sms_for_high_value: bool = True
    
    # Quiet hours
    quiet_hours_enabled: bool = False
    quiet_hours_start: str = "22:00"  # 10 PM
    quiet_hours_end: str = "08:00"    # 8 AM
    timezone: str = "UTC"


@dataclass
class DisplaySettings:
    """Display preferences"""
    currency: Currency = Currency.USD
    language: Language = Language.EN
    theme: Theme = Theme.DARK
    hide_balances: bool = False
    decimal_places: int = 2
    show_fiat_values: bool = True
    compact_mode: bool = False
    show_advanced_options: bool = False


@dataclass
class SecuritySettings:
    """Security preferences"""
    auto_lock_timer: AutoLockTimer = AutoLockTimer.FIVE_MIN
    require_biometric: bool = True
    require_biometric_for_transactions: bool = False
    biometric_threshold: float = 1000.0  # Require biometric for transactions > $1000
    screenshot_protection: bool = True
    clipboard_monitoring: bool = True
    
    # Session management
    session_timeout_days: int = 30
    require_reauth_for_sensitive_actions: bool = True
    max_active_devices: int = 5
    
    # Anti-phishing
    anti_phishing_code: Optional[str] = None
    show_anti_phishing_code: bool = True
    
    # Trusted addresses
    trusted_addresses: List[str] = field(default_factory=list)
    
    # 2FA
    two_factor_enabled: bool = False
    two_factor_method: Optional[str] = None  # "totp", "sms", "email"
    backup_codes: List[str] = field(default_factory=list)


@dataclass
class PrivacySettings:
    """Privacy and data settings"""
    analytics_enabled: bool = True
    crash_reporting: bool = True
    share_anonymized_data: bool = False
    
    # Data export/deletion
    data_export_format: str = "json"  # "json", "csv", "pdf"
    account_deletion_scheduled: Optional[datetime] = None
    account_deletion_reason: Optional[str] = None


@dataclass
class TransactionSettings:
    """Transaction preferences"""
    default_slippage: float = 0.5  # 0.5%
    gas_price_preference: str = "medium"  # "slow", "medium", "fast", "custom"
    custom_gas_price: Optional[int] = None
    auto_approve_trusted_addresses: bool = False
    require_confirmation_for_high_value: bool = True
    high_value_threshold: float = 1000.0
    save_transaction_notes: bool = True


@dataclass
class VaultSettings:
    """Vault and inheritance preferences"""
    check_in_reminder_days: int = 7  # Remind 7 days before check-in
    check_in_reminder_enabled: bool = True
    guardian_notification_enabled: bool = True
    beneficiary_verification_required: bool = True
    beneficiary_kyc_threshold: float = 50000.0  # KYC for claims > $50k
    auto_compound_yield: bool = False
    yield_notification_threshold: float = 10.0  # Notify if yield > $10/month


@dataclass
class BridgeSettings:
    """Cross-chain bridge preferences"""
    preferred_bridge: Optional[str] = None
    min_security_score: int = 80  # Don't use bridges below this score
    auto_route_optimization: bool = True
    show_bridge_status: bool = True
    notify_on_completion: bool = True
    notify_on_failure: bool = True


@dataclass
class UserSettings:
    """Complete user settings"""
    user_id: str
    email: str
    phone_number: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    # Settings groups
    notifications: NotificationPreferences = field(default_factory=NotificationPreferences)
    display: DisplaySettings = field(default_factory=DisplaySettings)
    security: SecuritySettings = field(default_factory=SecuritySettings)
    privacy: PrivacySettings = field(default_factory=PrivacySettings)
    transactions: TransactionSettings = field(default_factory=TransactionSettings)
    vault: VaultSettings = field(default_factory=VaultSettings)
    bridge: BridgeSettings = field(default_factory=BridgeSettings)
    
    # Legal compliance
    tos_accepted: bool = False
    tos_accepted_at: Optional[datetime] = None
    tos_version: Optional[str] = None
    privacy_policy_accepted: bool = False
    privacy_policy_accepted_at: Optional[datetime] = None
    privacy_policy_version: Optional[str] = None
    cookie_policy_accepted: bool = False
    biometric_consent: bool = False
    age_verified: bool = False
    age_verification_date: Optional[datetime] = None
    jurisdiction: Optional[str] = None
    export_compliance_acknowledged: bool = False
    
    # App info
    app_version: Optional[str] = None
    build_number: Optional[str] = None
    last_updated_check: Optional[datetime] = None
    
    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        result = asdict(self)
        # Convert datetime objects to ISO strings
        for key, value in result.items():
            if isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, Enum):
                result[key] = value.value
        return result
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UserSettings":
        """Create from dictionary"""
        # Convert ISO strings back to datetime
        for key, value in data.items():
            if isinstance(value, str) and key.endswith("_at") or key.endswith("_date"):
                try:
                    data[key] = datetime.fromisoformat(value)
                except:
                    pass
        return cls(**data)

