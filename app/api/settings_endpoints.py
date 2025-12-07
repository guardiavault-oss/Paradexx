#!/usr/bin/env python3
"""
Settings API Endpoints
Comprehensive settings management API
"""

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
import structlog

# Import core modules
from app.models.user_settings import Currency, Language, Theme, AutoLockTimer

# Import dependencies and helpers
from app.api.dependencies import (
    get_authenticated_user,
    require_settings_manager
)
from app.api.error_handlers import (
    handle_endpoint_errors,
    create_validation_error
)
from app.core.utils import get_utc_timestamp, format_response

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/settings", tags=["settings"])


# Request Models
class NotificationSettingsUpdate(BaseModel):
    """Update notification settings"""
    enabled: Optional[bool] = None
    push: Optional[bool] = None
    email: Optional[bool] = None
    sms: Optional[bool] = None
    transaction_notifications: Optional[bool] = None
    security_alerts: Optional[bool] = None
    marketing_emails: Optional[bool] = None
    vault_reminders: Optional[bool] = None
    guardian_alerts: Optional[bool] = None
    yield_updates: Optional[bool] = None
    bridge_status: Optional[bool] = None
    high_value_threshold: Optional[float] = None
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None


class DisplaySettingsUpdate(BaseModel):
    """Update display settings"""
    currency: Optional[str] = None
    language: Optional[str] = None
    theme: Optional[str] = None
    hide_balances: Optional[bool] = None
    decimal_places: Optional[int] = None
    show_fiat_values: Optional[bool] = None
    compact_mode: Optional[bool] = None
    show_advanced_options: Optional[bool] = None


class SecuritySettingsUpdate(BaseModel):
    """Update security settings"""
    auto_lock_timer: Optional[str] = None
    require_biometric: Optional[bool] = None
    require_biometric_for_transactions: Optional[bool] = None
    biometric_threshold: Optional[float] = None
    screenshot_protection: Optional[bool] = None
    clipboard_monitoring: Optional[bool] = None
    session_timeout_days: Optional[int] = None
    max_active_devices: Optional[int] = None
    trusted_addresses: Optional[List[str]] = None


class LegalAcceptance(BaseModel):
    """Legal document acceptance"""
    tos_version: str
    privacy_policy_version: str


class AccountDeletionRequest(BaseModel):
    """Account deletion request"""
    reason: Optional[str] = None
    delay_days: int = Field(default=30, ge=0, le=90)


# Endpoints
@router.get("/")
@handle_endpoint_errors("get settings")
async def get_settings(
    user=Depends(get_authenticated_user),
    settings_manager=Depends(require_settings_manager)
):
    """Get all user settings"""
    settings = await settings_manager.get_settings(user["id"])
    
    if not settings:
        # Create default settings
        settings = await settings_manager.create_settings(user["id"], user.get("email", ""))
    
    return format_response(
        success=True,
        data={"settings": settings.to_dict()},
        timestamp=get_utc_timestamp()
    )


@router.put("/notifications")
@handle_endpoint_errors("update notification settings")
async def update_notification_settings(
    updates: NotificationSettingsUpdate,
    user=Depends(get_authenticated_user),
    settings_manager=Depends(require_settings_manager)
):
    """Update notification settings"""
    settings = await settings_manager.update_notification_settings(
        user["id"],
        updates.dict(exclude_none=True)
    )
    
    return format_response(
        success=True,
        data={"settings": settings.to_dict()},
        timestamp=get_utc_timestamp()
    )


@router.put("/display")
@handle_endpoint_errors("update display settings")
async def update_display_settings(
    updates: DisplaySettingsUpdate,
    user=Depends(get_authenticated_user),
    settings_manager=Depends(require_settings_manager)
):
    """Update display settings"""
    settings = await settings_manager.update_display_settings(
        user["id"],
        updates.dict(exclude_none=True)
    )
    
    return format_response(
        success=True,
        data={"settings": settings.to_dict()},
        timestamp=get_utc_timestamp()
    )


@router.put("/security")
@handle_endpoint_errors("update security settings")
async def update_security_settings(
    updates: SecuritySettingsUpdate,
    user=Depends(get_authenticated_user),
    settings_manager=Depends(require_settings_manager)
):
    """Update security settings"""
    settings = await settings_manager.update_security_settings(
        user["id"],
        updates.dict(exclude_none=True)
    )
    
    return format_response(
        success=True,
        data={"settings": settings.to_dict()},
        timestamp=get_utc_timestamp()
    )


@router.post("/legal/accept")
@handle_endpoint_errors("accept legal documents")
async def accept_legal_documents(
    acceptance: LegalAcceptance,
    user=Depends(get_authenticated_user),
    settings_manager=Depends(require_settings_manager)
):
    """Accept terms of service and privacy policy"""
    settings = await settings_manager.accept_legal(
        user["id"],
        acceptance.tos_version,
        acceptance.privacy_policy_version
    )
    
    return format_response(
        success=True,
        data={"settings": settings.to_dict()},
        timestamp=get_utc_timestamp()
    )


@router.post("/legal/verify-age")
@handle_endpoint_errors("verify age")
async def verify_age(
    user=Depends(get_authenticated_user),
    settings_manager=Depends(require_settings_manager)
):
    """Verify user age (18+)"""
    settings = await settings_manager.verify_age(user["id"])
    
    return format_response(
        success=True,
        data={"age_verified": settings.age_verified},
        timestamp=get_utc_timestamp()
    )


@router.post("/legal/set-jurisdiction")
@handle_endpoint_errors("set jurisdiction")
async def set_jurisdiction(
    jurisdiction: str,
    user=Depends(get_authenticated_user),
    settings_manager=Depends(require_settings_manager)
):
    """Set user jurisdiction"""
    settings = await settings_manager.set_jurisdiction(user["id"], jurisdiction)
    
    return format_response(
        success=True,
        data={"jurisdiction": settings.jurisdiction},
        timestamp=get_utc_timestamp()
    )


@router.get("/export-data")
@handle_endpoint_errors("export user data")
async def export_user_data(
    format: str = "json",
    user=Depends(get_authenticated_user),
    settings_manager=Depends(require_settings_manager)
):
    """Export user data (GDPR requirement)"""
    data = await settings_manager.export_user_data(user["id"], format)
    
    if format == "json":
        return Response(content=data, media_type="application/json")
    elif format == "csv":
        return Response(content=data, media_type="text/csv")
    else:
        raise create_validation_error(f"Unsupported format: {format}")


@router.post("/account/delete")
@handle_endpoint_errors("schedule account deletion")
async def schedule_account_deletion(
    request: AccountDeletionRequest,
    user=Depends(get_authenticated_user),
    settings_manager=Depends(require_settings_manager)
):
    """Schedule account deletion"""
    settings = await settings_manager.schedule_account_deletion(
        user["id"],
        request.reason,
        request.delay_days
    )
    
    return format_response(
        success=True,
        data={
            "deletion_scheduled": settings.privacy.account_deletion_scheduled.isoformat(),
            "deletion_date": settings.privacy.account_deletion_scheduled.isoformat()
        },
        timestamp=get_utc_timestamp()
    )


@router.post("/account/delete/cancel")
@handle_endpoint_errors("cancel account deletion")
async def cancel_account_deletion(
    user=Depends(get_authenticated_user),
    settings_manager=Depends(require_settings_manager)
):
    """Cancel scheduled account deletion"""
    await settings_manager.cancel_account_deletion(user["id"])
    
    return format_response(
        success=True,
        message="Account deletion cancelled",
        timestamp=get_utc_timestamp()
    )


@router.get("/app-version")
@handle_endpoint_errors("get app version")
async def get_app_version():
    """Get app version information"""
    return format_response(
        success=True,
        data={
            "version": "2.0.0",
            "build_number": "2024.01.15",
            "min_supported_version": "1.0.0",
            "force_update_required": False,
            "update_message": None
        },
        timestamp=get_utc_timestamp()
    )


# Export router
__all__ = ["router"]

