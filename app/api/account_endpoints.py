#!/usr/bin/env python3
"""
Account Management API Endpoints
Wallet, device, and session management
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
import structlog

# Import core modules
from app.models.account import WalletStatus

# Import dependencies and helpers
from app.api.dependencies import (
    get_authenticated_user,
    require_account_manager
)
from app.api.error_handlers import (
    handle_endpoint_errors,
    create_not_found_error,
    create_validation_error
)
from app.core.utils import get_utc_timestamp, format_response

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/account", tags=["account"])


# Request Models
class CreateWalletRequest(BaseModel):
    """Create wallet request"""
    address: str = Field(..., description="Wallet address")
    name: str = Field(..., description="Wallet name")
    chain: str = Field(default="ethereum", description="Blockchain chain")
    is_hardware: bool = Field(default=False, description="Is hardware wallet")
    is_watch_only: bool = Field(default=False, description="Is watch-only wallet")


class RenameWalletRequest(BaseModel):
    """Rename wallet request"""
    name: str = Field(..., description="New wallet name")


class RegisterDeviceRequest(BaseModel):
    """Register device request"""
    device_name: str = Field(..., description="Device name")
    device_type: str = Field(..., description="Device type: ios, android, web, desktop")
    os_version: Optional[str] = None
    app_version: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None
    user_agent: Optional[str] = None


# Endpoints
@router.get("/")
@handle_endpoint_errors("get account")
async def get_account(
    user=Depends(get_authenticated_user),
    account_manager=Depends(require_account_manager)
):
    """Get user account information"""
    account = await account_manager.get_account(user["id"])
    
    if not account:
        # Create account if doesn't exist
        account = await account_manager.create_account(
            user.get("email", ""),
            user.get("phone_number")
        )
    
    return format_response(
        success=True,
        data={
            "account": {
                "user_id": account.user_id,
                "email": account.email,
                "is_verified": account.is_verified,
                "account_tier": account.account_tier,
                "created_at": account.created_at.isoformat(),
                "wallets_count": len(account.wallets),
                "devices_count": len(account.devices),
                "sessions_count": len(account.active_sessions)
            }
        },
        timestamp=get_utc_timestamp()
    )


@router.get("/wallets")
@handle_endpoint_errors("get wallets")
async def get_wallets(
    user=Depends(get_authenticated_user),
    account_manager=Depends(require_account_manager)
):
    """Get all user wallets"""
    account = await account_manager.get_account(user["id"])
    
    if not account:
        return format_response(
            success=True,
            data={"wallets": []},
            timestamp=get_utc_timestamp()
        )
    
    wallets = account.get_active_wallets()
    
    return format_response(
        success=True,
        data={
            "wallets": [
                {
                    "wallet_id": w.wallet_id,
                    "address": w.address,
                    "name": w.name,
                    "chain": w.chain,
                    "status": w.status.value,
                    "is_hardware": w.is_hardware,
                    "is_watch_only": w.is_watch_only,
                    "created_at": w.created_at.isoformat(),
                    "last_used_at": w.last_used_at.isoformat()
                }
                for w in wallets
            ]
        },
        timestamp=get_utc_timestamp()
    )


@router.post("/wallets")
@handle_endpoint_errors("create wallet")
async def create_wallet(
    request: CreateWalletRequest,
    user=Depends(get_authenticated_user),
    account_manager=Depends(require_account_manager)
):
    """Create new wallet"""
    wallet = await account_manager.create_wallet(
        user_id=user["id"],
        address=request.address,
        name=request.name,
        chain=request.chain,
        is_hardware=request.is_hardware,
        is_watch_only=request.is_watch_only
    )
    
    return format_response(
        success=True,
        data={
            "wallet": {
                "wallet_id": wallet.wallet_id,
                "address": wallet.address,
                "name": wallet.name,
                "chain": wallet.chain,
                "status": wallet.status.value
            }
        },
        timestamp=get_utc_timestamp()
    )


@router.put("/wallets/{wallet_id}/rename")
@handle_endpoint_errors("rename wallet")
async def rename_wallet(
    wallet_id: str,
    request: RenameWalletRequest,
    user=Depends(get_authenticated_user),
    account_manager=Depends(require_account_manager)
):
    """Rename wallet"""
    wallet = await account_manager.rename_wallet(
        user_id=user["id"],
        wallet_id=wallet_id,
        new_name=request.name
    )
    
    return format_response(
        success=True,
        data={
            "wallet": {
                "wallet_id": wallet.wallet_id,
                "name": wallet.name
            }
        },
        timestamp=get_utc_timestamp()
    )


@router.post("/wallets/{wallet_id}/archive")
@handle_endpoint_errors("archive wallet")
async def archive_wallet(
    wallet_id: str,
    user=Depends(get_authenticated_user),
    account_manager=Depends(require_account_manager)
):
    """Archive wallet"""
    wallet = await account_manager.archive_wallet(
        user_id=user["id"],
        wallet_id=wallet_id
    )
    
    return format_response(
        success=True,
        data={
            "wallet": {
                "wallet_id": wallet.wallet_id,
                "status": wallet.status.value
            }
        },
        timestamp=get_utc_timestamp()
    )


@router.get("/devices")
@handle_endpoint_errors("get devices")
async def get_devices(
    user=Depends(get_authenticated_user),
    account_manager=Depends(require_account_manager)
):
    """Get all user devices"""
    account = await account_manager.get_account(user["id"])
    
    if not account:
        return format_response(
            success=True,
            data={"devices": []},
            timestamp=get_utc_timestamp()
        )
    
    return format_response(
        success=True,
        data={
            "devices": [
                {
                    "device_id": d.device_id,
                    "device_name": d.device_name,
                    "device_type": d.device_type,
                    "status": d.status.value,
                    "trusted_at": d.trusted_at.isoformat() if d.trusted_at else None,
                    "last_seen_at": d.last_seen_at.isoformat(),
                    "location": d.location,
                    "is_current_device": d.is_current_device
                }
                for d in account.devices
            ]
        },
        timestamp=get_utc_timestamp()
    )


@router.post("/devices")
@handle_endpoint_errors("register device")
async def register_device(
    request: RegisterDeviceRequest,
    user=Depends(get_authenticated_user),
    account_manager=Depends(require_account_manager)
):
    """Register a new device"""
    device = await account_manager.register_device(
        user_id=user["id"],
        device_name=request.device_name,
        device_type=request.device_type,
        ip_address=request.ip_address,
        user_agent=request.user_agent,
        location=request.location
    )
    
    return format_response(
        success=True,
        data={
            "device": {
                "device_id": device.device_id,
                "device_name": device.device_name,
                "status": device.status.value,
                "requires_approval": device.status.value == "unknown"
            }
        },
        timestamp=get_utc_timestamp()
    )


@router.post("/devices/{device_id}/trust")
@handle_endpoint_errors("trust device")
async def trust_device(
    device_id: str,
    user=Depends(get_authenticated_user),
    account_manager=Depends(require_account_manager)
):
    """Trust a device"""
    device = await account_manager.trust_device(
        user_id=user["id"],
        device_id=device_id
    )
    
    return format_response(
        success=True,
        data={
            "device": {
                "device_id": device.device_id,
                "status": device.status.value,
                "trusted_at": device.trusted_at.isoformat() if device.trusted_at else None
            }
        },
        timestamp=get_utc_timestamp()
    )


@router.get("/sessions")
@handle_endpoint_errors("get sessions")
async def get_sessions(
    user=Depends(get_authenticated_user),
    account_manager=Depends(require_account_manager)
):
    """Get active sessions"""
    account = await account_manager.get_account(user["id"])
    
    if not account:
        return format_response(
            success=True,
            data={"sessions": []},
            timestamp=get_utc_timestamp()
        )
    
    sessions = account.get_active_sessions()
    
    return format_response(
        success=True,
        data={
            "sessions": [
                {
                    "session_id": s.session_id,
                    "device_id": s.device_id,
                    "status": s.status.value,
                    "created_at": s.created_at.isoformat(),
                    "expires_at": s.expires_at.isoformat(),
                    "last_activity_at": s.last_activity_at.isoformat(),
                    "location": s.location,
                    "ip_address": s.ip_address
                }
                for s in sessions
            ]
        },
        timestamp=get_utc_timestamp()
    )


@router.delete("/sessions/{session_id}")
@handle_endpoint_errors("revoke session")
async def revoke_session(
    session_id: str,
    user=Depends(get_authenticated_user),
    account_manager=Depends(require_account_manager)
):
    """Revoke a session"""
    await account_manager.revoke_session(session_id)
    
    return format_response(
        success=True,
        message="Session revoked",
        timestamp=get_utc_timestamp()
    )


@router.post("/sessions/revoke-all")
@handle_endpoint_errors("revoke all sessions")
async def revoke_all_sessions(
    keep_current: bool = True,
    user=Depends(get_authenticated_user),
    account_manager=Depends(require_account_manager)
):
    """Revoke all sessions"""
    count = await account_manager.revoke_all_sessions(
        user_id=user["id"],
        keep_current=keep_current
    )
    
    return format_response(
        success=True,
        data={"revoked_count": count},
        message=f"Revoked {count} session(s)",
        timestamp=get_utc_timestamp()
    )


# Export router
__all__ = ["router"]

