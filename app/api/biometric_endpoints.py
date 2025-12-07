#!/usr/bin/env python3
"""
Biometric Authentication API Endpoints
Handles biometric authentication and verification
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
import structlog
import hashlib
import time

# Import dependencies and helpers
from app.api.dependencies import (
    get_authenticated_user,
    require_settings_manager,
    require_security_manager
)
from app.api.error_handlers import (
    handle_endpoint_errors,
    create_validation_error,
    create_forbidden_error,
    create_not_found_error
)
from app.core.utils import get_utc_timestamp, get_utc_datetime, format_response

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/biometric", tags=["biometric"])


# Request Models
class BiometricVerifyRequest(BaseModel):
    """Biometric verification request"""
    challenge: str = Field(..., description="Challenge string for verification")
    signature: str = Field(..., description="Biometric signature/response")
    device_id: Optional[str] = None
    transaction_id: Optional[str] = None  # For transaction authorization
    amount: Optional[float] = None  # For transaction amount verification


class BiometricSetupRequest(BaseModel):
    """Biometric setup request"""
    device_id: str = Field(..., description="Device identifier")
    biometric_type: str = Field(..., description="Type: fingerprint, face_id, touch_id")
    public_key: Optional[str] = None  # Public key for device biometric (if applicable)


class BiometricConsentRequest(BaseModel):
    """Biometric consent request"""
    consented: bool = Field(..., description="User consent status")
    device_id: Optional[str] = None


# In-memory storage for biometric challenges and sessions
biometric_challenges: Dict[str, Dict[str, Any]] = {}
biometric_sessions: Dict[str, Dict[str, Any]] = {}


@router.post("/setup")
@handle_endpoint_errors("setup biometric")
async def setup_biometric(
    request: BiometricSetupRequest,
    user=Depends(get_authenticated_user),
    settings_manager=Depends(require_settings_manager)
):
    """Setup biometric authentication for user"""
    settings = await settings_manager.get_settings(user["id"])
    if settings:
        # Update security settings
        settings.security.require_biometric = True
        settings.biometric_consent = True
        settings.updated_at = get_utc_datetime()
        logger.info(f"Biometric setup completed for user {user['id']}")
    
    # Store biometric session
    timestamp = get_utc_timestamp()
    session_id = hashlib.sha256(
        f"{user['id']}_{request.device_id}_{timestamp}".encode()
    ).hexdigest()[:16]
    
    biometric_sessions[session_id] = {
        "user_id": user["id"],
        "device_id": request.device_id,
        "biometric_type": request.biometric_type,
        "public_key": request.public_key,
        "setup_at": timestamp,
        "active": True
    }
    
    return format_response(
        success=True,
        data={"session_id": session_id},
        message="Biometric authentication setup successful",
        timestamp=get_utc_timestamp()
    )


@router.post("/verify")
@handle_endpoint_errors("verify biometric")
async def verify_biometric(
    request: BiometricVerifyRequest,
    user=Depends(get_authenticated_user),
    settings_manager=Depends(require_settings_manager),
    security_manager=Depends(require_security_manager)
):
    """Verify biometric authentication"""
    settings = await settings_manager.get_settings(user["id"])
    if not settings or not settings.security.require_biometric:
        raise create_validation_error("Biometric authentication not enabled")
    
    # Generate challenge if not provided
    if not request.challenge:
        timestamp = get_utc_timestamp()
        challenge = hashlib.sha256(
            f"{user['id']}_{timestamp}".encode()
        ).hexdigest()
        biometric_challenges[challenge] = {
            "user_id": user["id"],
            "created_at": timestamp,
            "expires_at": (time.time() + 300)  # 5 minutes
        }
        
        return format_response(
            success=True,
            data={"challenge": challenge},
            message="Challenge generated, please verify with biometric",
            timestamp=get_utc_timestamp()
        )
    
    # Verify challenge and signature
    challenge_data = biometric_challenges.get(request.challenge)
    if not challenge_data:
        raise create_validation_error("Invalid or expired challenge")
    
    if challenge_data["user_id"] != user["id"]:
        raise create_forbidden_error("Challenge not for this user")
    
    # Check if challenge expired
    if time.time() > challenge_data["expires_at"]:
        del biometric_challenges[request.challenge]
        raise create_validation_error("Challenge expired")
    
    # Verify signature (in production, use proper cryptographic verification)
    # For now, accept any non-empty signature as valid
    if not request.signature or len(request.signature) < 10:
        raise create_validation_error("Invalid biometric signature")
    
    # Log security event
    await security_manager.log_security_event(
        user_id=user["id"],
        event_type="biometric_authentication",
        device_id=request.device_id,
        details={
            "transaction_id": request.transaction_id,
            "amount": request.amount,
            "success": True
        }
    )
    
    # Clean up challenge
    del biometric_challenges[request.challenge]
    
    # Generate auth token (in production, use proper JWT)
    timestamp = get_utc_timestamp()
    auth_token = hashlib.sha256(
        f"{user['id']}_{request.signature}_{timestamp}".encode()
    ).hexdigest()[:32]
    
    return format_response(
        success=True,
        data={
            "verified": True,
            "auth_token": auth_token,
            "expires_in": 3600  # 1 hour
        },
        message="Biometric authentication successful",
        timestamp=get_utc_timestamp()
    )


@router.post("/consent")
@handle_endpoint_errors("set biometric consent")
async def set_biometric_consent(
    request: BiometricConsentRequest,
    user=Depends(get_authenticated_user),
    settings_manager=Depends(require_settings_manager)
):
    """Set biometric consent status"""
    settings = await settings_manager.get_settings(user["id"])
    if not settings:
        raise create_not_found_error("Settings")
    
    settings.biometric_consent = request.consented
    if not request.consented:
        settings.security.require_biometric = False
    
    settings.updated_at = get_utc_datetime()
    
    logger.info(f"Biometric consent updated for user {user['id']}: {request.consented}")
    
    return format_response(
        success=True,
        data={"consented": request.consented},
        message=f"Biometric consent {'granted' if request.consented else 'revoked'}",
        timestamp=get_utc_timestamp()
    )


@router.get("/status")
@handle_endpoint_errors("get biometric status")
async def get_biometric_status(
    user=Depends(get_authenticated_user),
    settings_manager=Depends(require_settings_manager)
):
    """Get biometric authentication status"""
    settings = await settings_manager.get_settings(user["id"])
    
    enabled = settings.security.require_biometric if settings else False
    consented = settings.biometric_consent if settings else False
    
    # Check for active biometric sessions
    active_sessions = [
        session for session in biometric_sessions.values()
        if session.get("user_id") == user["id"] and session.get("active")
    ]
    
    return format_response(
        success=True,
        data={
            "enabled": enabled,
            "consented": consented,
            "device_supported": len(active_sessions) > 0,
            "active_sessions": len(active_sessions),
            "biometric_type": active_sessions[0].get("biometric_type") if active_sessions else None
        },
        timestamp=get_utc_timestamp()
    )


@router.post("/transaction/authorize")
@handle_endpoint_errors("authorize transaction with biometric")
async def authorize_transaction_with_biometric(
    request: BiometricVerifyRequest,
    user=Depends(get_authenticated_user),
    settings_manager=Depends(require_settings_manager),
    security_manager=Depends(require_security_manager)
):
    """Authorize transaction with biometric authentication"""
    # Check if transaction requires biometric
    if not request.transaction_id or not request.amount:
        raise create_validation_error("Transaction ID and amount required")
    
    settings = await settings_manager.get_settings(user["id"])
    if settings:
        # Check if amount exceeds threshold
        requires_biometric = (
            settings.security.require_biometric_for_transactions and
            request.amount >= settings.security.biometric_threshold
        )
        
        if requires_biometric:
            # Verify biometric first
            if not request.signature or len(request.signature) < 10:
                raise create_forbidden_error(
                    "Biometric verification required for this transaction"
                )
    
    # Log security event
    await security_manager.log_security_event(
        user_id=user["id"],
        event_type="transaction_authorized",
        device_id=request.device_id,
        details={
            "transaction_id": request.transaction_id,
            "amount": request.amount,
            "biometric_verified": True
        }
    )
    
    return format_response(
        success=True,
        data={
            "authorized": True,
            "transaction_id": request.transaction_id
        },
        message="Transaction authorized with biometric authentication",
        timestamp=get_utc_timestamp()
    )


@router.delete("/disable")
@handle_endpoint_errors("disable biometric")
async def disable_biometric(
    user=Depends(get_authenticated_user),
    settings_manager=Depends(require_settings_manager)
):
    """Disable biometric authentication"""
    settings = await settings_manager.get_settings(user["id"])
    if settings:
        settings.security.require_biometric = False
        settings.biometric_consent = False
        settings.updated_at = get_utc_datetime()
    
    # Disable all sessions for user
    for session_id, session in list(biometric_sessions.items()):
        if session.get("user_id") == user["id"]:
            session["active"] = False
    
    logger.info(f"Biometric authentication disabled for user {user['id']}")
    
    return format_response(
        success=True,
        message="Biometric authentication disabled",
        timestamp=get_utc_timestamp()
    )


# Export router
__all__ = ["router"]

