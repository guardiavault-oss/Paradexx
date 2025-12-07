#!/usr/bin/env python3
"""
Dependency Injection for API Endpoints
Provides centralized service dependencies to eliminate code duplication
"""

from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Any, Optional
import structlog

logger = structlog.get_logger(__name__)

# Security
security = HTTPBearer(auto_error=False)


# Service imports with fallbacks for testing
try:
    from app.core.guardia_vault_integration import get_guardia_vault_integration
    from app.core.inheritance_manager import get_inheritance_manager
    from app.core.account_manager import get_account_manager
    from app.core.authentication import get_current_user
    from app.core.security_manager import get_security_manager
    from app.core.settings_manager import get_settings_manager
    from app.core.notification_manager import get_notification_manager
    from app.core.support_manager import get_support_manager
    from app.core.transaction_history_manager import get_transaction_history_manager
    from app.core.cross_chain_bridge_integration import get_bridge_integration
    from app.core.error_handler import get_error_handler
    from app.core.mpc_hsm_integration import mpc_hsm_integration
    from app.core.wallet_guard_client import get_wallet_guard_client
except ImportError:
    # Fallback for testing
    get_guardia_vault_integration = None
    get_inheritance_manager = None
    get_account_manager = None
    get_current_user = None
    get_security_manager = None
    get_settings_manager = None
    get_notification_manager = None
    get_support_manager = None
    get_transaction_history_manager = None
    get_bridge_integration = None
    get_error_handler = None
    mpc_hsm_integration = None
    get_wallet_guard_client = None


# Authentication Dependency
async def get_authenticated_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    Get authenticated user from token
    Returns user dict with address/id and other user info
    """
    # Demo mode or local development: allow unauthenticated access
    if not get_current_user:
        return {"address": "0x123...", "id": "user123", "email": "user@example.com"}

    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        token = credentials.credentials
        user = await get_current_user(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


# Service Dependencies
def require_vault_service():
    """
    Dependency to ensure vault service is available
    Returns GuardiaVaultIntegration instance
    """
    if not get_guardia_vault_integration:
        raise HTTPException(
            status_code=503,
            detail="Vault service unavailable"
        )
    return get_guardia_vault_integration()


def require_inheritance_manager():
    """
    Dependency to ensure inheritance manager is available
    Returns InheritanceManager instance
    """
    if not get_inheritance_manager:
        raise HTTPException(
            status_code=503,
            detail="Inheritance service unavailable"
        )
    return get_inheritance_manager()


def require_account_manager():
    """
    Dependency to ensure account manager is available
    Returns AccountManager instance
    """
    if not get_account_manager:
        raise HTTPException(
            status_code=503,
            detail="Account service unavailable"
        )
    return get_account_manager()


def require_security_manager():
    """
    Dependency to ensure security manager is available
    Returns SecurityManager instance
    """
    if not get_security_manager:
        raise HTTPException(
            status_code=503,
            detail="Security service unavailable"
        )
    return get_security_manager()


def require_settings_manager():
    """
    Dependency to ensure settings manager is available
    Returns SettingsManager instance
    """
    if not get_settings_manager:
        raise HTTPException(
            status_code=503,
            detail="Settings service unavailable"
        )
    return get_settings_manager()


def require_notification_manager():
    """
    Dependency to ensure notification manager is available
    Returns NotificationManager instance
    """
    if not get_notification_manager:
        raise HTTPException(
            status_code=503,
            detail="Notification service unavailable"
        )
    return get_notification_manager()


def require_support_manager():
    """
    Dependency to ensure support manager is available
    Returns SupportManager instance
    """
    if not get_support_manager:
        raise HTTPException(
            status_code=503,
            detail="Support service unavailable"
        )
    return get_support_manager()


def require_transaction_history_manager():
    """
    Dependency to ensure transaction history manager is available
    Returns TransactionHistoryManager instance
    """
    if not get_transaction_history_manager:
        raise HTTPException(
            status_code=503,
            detail="Transaction service unavailable"
        )
    return get_transaction_history_manager()


def require_bridge_integration():
    """
    Dependency to ensure bridge integration is available
    Returns BridgeIntegration instance
    """
    if not get_bridge_integration:
        raise HTTPException(
            status_code=503,
            detail="Bridge service unavailable"
        )
    return get_bridge_integration()


def require_error_handler():
    """
    Dependency to ensure error handler is available
    Returns ErrorHandler instance
    """
    if not get_error_handler:
        raise HTTPException(
            status_code=503,
            detail="Error service unavailable"
        )
    return get_error_handler()


def require_mpc_hsm_integration():
    """
    Dependency to access the global MPC/HSM integration.
    """
    if not mpc_hsm_integration:
        raise HTTPException(
            status_code=503,
            detail="MPC/HSM service unavailable"
        )
    return mpc_hsm_integration


def require_wallet_guard_client():
    """
    Dependency to provide Wallet Guard client.
    """
    if not get_wallet_guard_client:
        raise HTTPException(
            status_code=503,
            detail="Wallet Guard client unavailable"
        )
    client = get_wallet_guard_client()
    if not client:
        raise HTTPException(
            status_code=503,
            detail="Wallet Guard client initialization failed"
        )
    return client




# Export all dependencies
__all__ = [
    "security",
    "get_authenticated_user",
    "require_vault_service",
    "require_inheritance_manager",
    "require_account_manager",
    "require_security_manager",
    "require_settings_manager",
    "require_notification_manager",
    "require_support_manager",
    "require_transaction_history_manager",
    "require_bridge_integration",
    "require_error_handler",
    "require_mpc_hsm_integration",
    "require_wallet_guard_client",
]

