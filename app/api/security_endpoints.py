#!/usr/bin/env python3
"""
Security API Endpoints
2FA, biometric, recovery, security events
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
import structlog

# Import dependencies and helpers
from app.api.dependencies import (
    get_authenticated_user,
    require_security_manager,
    require_mpc_hsm_integration,
    require_wallet_guard_client,
)
from app.api.error_handlers import (
    handle_endpoint_errors,
    create_not_found_error,
    create_validation_error,
)
from app.core.utils import get_utc_timestamp, format_response
from app.core.wallet_guard_client import WalletGuardClientError

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/security", tags=["security"])

# MPC telemetry


@router.get("/mpc")
@handle_endpoint_errors("get mpc metrics")
async def get_mpc_metrics(
    mpc_integration=Depends(require_mpc_hsm_integration),
):
    """Return MPC/HSM metrics and key summaries."""
    metrics = mpc_integration.get_metrics()

    key_summaries = [
        {
            "key_id": key_id,
            "key_type": key.key_type,
            "parties": len(key.parties),
            "threshold": key.threshold,
            "quantum_resistant": key.quantum_resistant,
            "backends": key.metadata.get("backends", {}),
            "created_at": key.created_at.isoformat(),
        }
        for key_id, key in mpc_integration.multi_party_keys.items()
    ]

    return format_response(
        success=True,
        data={
            "metrics": metrics,
            "multi_party_keys": key_summaries,
        },
        timestamp=get_utc_timestamp(),
    )


# Request Models
class TwoFactorVerifyRequest(BaseModel):
    """Verify 2FA code"""
    code: str = Field(..., description="2FA code")


class RecoveryRequest(BaseModel):
    """Request account recovery"""
    method: str = Field(default="guardian", description="Recovery method")


class WalletGuardPresignRequest(BaseModel):
    """Request payload for Wallet Guard presign"""
    transaction: Dict[str, Any] = Field(..., description="Transaction data to pre-sign")
    wallet_address: str = Field(..., description="Origin wallet address")
    required_signers: int = Field(default=2, ge=1, le=10, description="Required signatures")
    mpc_enabled: bool = Field(default=False, description="Request MPC signing path")


# Endpoints
@router.post("/2fa/setup")
@handle_endpoint_errors("setup 2FA")
async def setup_two_factor(
    method: str = "totp",
    user=Depends(get_authenticated_user),
    security_manager=Depends(require_security_manager)
):
    """Setup 2FA"""
    setup = await security_manager.setup_two_factor(user["id"], method)
    
    return format_response(
        success=True,
        data={
            "setup": {
                "method": setup.method,
                "qr_code": setup.qr_code,
                "backup_codes": setup.backup_codes,
                "secret": setup.secret  # Only for TOTP setup, remove in production
            }
        },
        timestamp=get_utc_timestamp()
    )


@router.post("/2fa/verify")
@handle_endpoint_errors("verify 2FA")
async def verify_two_factor(
    request: TwoFactorVerifyRequest,
    user=Depends(get_authenticated_user),
    security_manager=Depends(require_security_manager)
):
    """Verify 2FA code"""
    valid = await security_manager.verify_two_factor(user["id"], request.code)
    
    if not valid:
        raise create_validation_error("Invalid 2FA code")
    
    return format_response(
        success=True,
        data={"verified": True},
        timestamp=get_utc_timestamp()
    )


@router.post("/2fa/backup-verify")
@handle_endpoint_errors("verify backup code")
async def verify_backup_code(
    request: TwoFactorVerifyRequest,
    user=Depends(get_authenticated_user),
    security_manager=Depends(require_security_manager)
):
    """Verify backup code"""
    valid = await security_manager.verify_backup_code(user["id"], request.code)
    
    if not valid:
        raise create_validation_error("Invalid backup code")
    
    return format_response(
        success=True,
        data={"verified": True},
        timestamp=get_utc_timestamp()
    )


@router.get("/events")
@handle_endpoint_errors("get security events")
async def get_security_events(
    limit: int = 50,
    user=Depends(get_authenticated_user),
    security_manager=Depends(require_security_manager)
):
    """Get security events"""
    events = await security_manager.get_security_events(user["id"], limit)
    
    return format_response(
        success=True,
        data={"events": events},
        timestamp=get_utc_timestamp()
    )


@router.post("/recovery/request")
@handle_endpoint_errors("request recovery")
async def request_recovery(
    request: RecoveryRequest,
    user=Depends(get_authenticated_user),
    security_manager=Depends(require_security_manager)
):
    """Request account recovery"""
    request_id = await security_manager.request_recovery(user["id"], request.method)
    
    return format_response(
        success=True,
        data={"request_id": request_id},
        message="Recovery request submitted. Guardians will be notified.",
        timestamp=get_utc_timestamp()
    )


@router.post("/recovery/{request_id}/cancel")
@handle_endpoint_errors("cancel recovery")
async def cancel_recovery(
    request_id: str,
    user=Depends(get_authenticated_user),
    security_manager=Depends(require_security_manager)
):
    """Cancel recovery request"""
    cancelled = await security_manager.cancel_recovery(request_id, user["id"])
    
    if not cancelled:
        raise create_not_found_error("Recovery request", request_id)
    
    return format_response(
        success=True,
        message="Recovery request cancelled",
        timestamp=get_utc_timestamp()
    )


@router.get("/wallet-guard/threats")
@handle_endpoint_errors("get wallet guard threats")
async def wallet_guard_threats(
    limit: int = 50,
    hours: int = 24,
    client=Depends(require_wallet_guard_client),
):
    """Expose Wallet Guard threat feed for dashboards"""
    feed = await client.get_threat_feed(limit=limit, hours=hours)
    success = feed.get("available", True)
    message = None if success else feed.get("error", "Wallet Guard service unavailable")
    data = {
        "threats": feed.get("threats", []),
        "metadata": {
            "count": feed.get("count", 0),
            "window_hours": feed.get("window_hours", hours),
            "cached": feed.get("cached", False),
            "cached_at": feed.get("cached_at"),
        },
    }
    return format_response(
        success=success,
        data=data,
        message=message,
        timestamp=get_utc_timestamp(),
    )


@router.get("/wallet-guard/actions")
@handle_endpoint_errors("get wallet guard actions")
async def wallet_guard_actions(
    limit: int = 25,
    client=Depends(require_wallet_guard_client),
):
    """Expose recently executed protection actions"""
    actions = await client.get_protection_actions(limit=limit)
    success = actions.get("available", True)
    message = None if success else actions.get("error", "Wallet Guard service unavailable")
    data = {
        "actions": actions.get("actions", []),
        "metadata": {
            "count": actions.get("count", 0),
            "cached": actions.get("cached", False),
            "cached_at": actions.get("cached_at"),
        },
    }
    return format_response(
        success=success,
        data=data,
        message=message,
        timestamp=get_utc_timestamp(),
    )


@router.post("/wallet-guard/presign")
@handle_endpoint_errors("wallet guard presign transaction")
async def wallet_guard_presign(
    request: WalletGuardPresignRequest,
    client=Depends(require_wallet_guard_client),
):
    """Request Wallet Guard MPC/HSM presign flow"""
    result = await client.request_presign(request.model_dump())
    success = result.get("available", True)
    message = None if success else result.get("error", "Wallet Guard service unavailable")
    return format_response(
        success=success,
        data={"presign": result},
        message=message,
        timestamp=get_utc_timestamp(),
    )


@router.get("/wallet-guard/presign/{signature_id}")
@handle_endpoint_errors("wallet guard presign status")
async def wallet_guard_presign_status(
    signature_id: str,
    client=Depends(require_wallet_guard_client),
):
    """Get Wallet Guard presign status for MPC workflows"""
    try:
        result = await client.get_presign_status(signature_id)
    except WalletGuardClientError as exc:
        if exc.status_code == 404:
            raise create_not_found_error("Pre-sign request", signature_id)
        raise

    success = result.get("available", True)
    message = None if success else result.get("error", "Wallet Guard service unavailable")
    return format_response(
        success=success,
        data={"presign": result},
        message=message,
        timestamp=get_utc_timestamp(),
    )


# Export router
__all__ = ["router"]

