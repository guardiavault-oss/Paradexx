#!/usr/bin/env python3
"""
Inheritance Platform API Endpoints
Production-ready endpoints for digital inheritance management
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Any, Dict, List
import structlog

# Import core modules
try:
    from app.core.inheritance_manager import get_inheritance_manager
    from app.core.guardia_vault_integration import get_guardia_vault_integration
    INHERITANCE_AVAILABLE = True
except ImportError as e:
    structlog.get_logger(__name__).warning(f"Inheritance modules not available: {e}")
    INHERITANCE_AVAILABLE = False
    get_inheritance_manager = None
    get_guardia_vault_integration = None

# Import dependencies and helpers
from app.api.dependencies import (
    get_authenticated_user,
    require_inheritance_manager,
    require_vault_service
)
from app.api.error_handlers import (
    handle_endpoint_errors,
    create_not_found_error,
    create_validation_error,
    create_service_unavailable_error
)
from app.core.utils import get_utc_timestamp, format_response

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/inheritance", tags=["inheritance"])


# Request/Response Models
class DeathCertificateRequest(BaseModel):
    """Request model for death certificate submission"""
    vault_id: str = Field(..., description="Vault ID")
    jurisdiction: str = Field(..., description="Jurisdiction of certificate")
    certificate_date: str = Field(..., description="Date on certificate")
    issuer: str = Field(..., description="Issuing authority")
    document_hash: Optional[str] = Field(None, description="Hash of uploaded document")


class LegacyMessageRequest(BaseModel):
    """Request model for legacy message"""
    vault_id: str = Field(..., description="Vault ID")
    recipient_address: str = Field(..., description="Beneficiary address")
    message_content: str = Field(..., description="Message content")
    unlock_condition: str = Field(default="death_verified", description="Unlock condition")


class GuardianManualTriggerRequest(BaseModel):
    """Request model for guardian manual trigger"""
    vault_id: str = Field(..., description="Vault ID")
    reason: str = Field(..., description="Reason for trigger")
    evidence: Optional[Dict[str, Any]] = Field(None, description="Supporting evidence")


@router.get("/health")
@handle_endpoint_errors("inheritance health check")
async def health_check():
    """Check Inheritance Platform health"""
    if not INHERITANCE_AVAILABLE:
        return format_response(
            success=False,
            data={
                "healthy": False,
                "service": "Inheritance Platform",
                "message": "Inheritance service not available"
            },
            timestamp=get_utc_timestamp()
        )
    
    try:
        inheritance_mgr = get_inheritance_manager()
        vault_integration = get_guardia_vault_integration()
        
        vault_count = len(vault_integration.vaults) if vault_integration else 0
        active_vaults = sum(
            1 for v in vault_integration.vaults.values() 
            if v.status == "active"
        ) if vault_integration else 0
        
        return format_response(
            success=True,
            data={
                "healthy": True,
                "service": "Inheritance Platform",
                "vault_count": vault_count,
                "active_vaults": active_vaults,
                "verification_threshold": inheritance_mgr.verification_threshold if inheritance_mgr else None,
                "min_verification_sources": inheritance_mgr.min_verification_sources if inheritance_mgr else None,
            },
            timestamp=get_utc_timestamp()
        )
    except Exception as e:
        logger.error("Inheritance health check failed", error=str(e))
        return format_response(
            success=False,
            data={
                "healthy": False,
                "service": "Inheritance Platform",
                "error": str(e)
            },
            timestamp=get_utc_timestamp()
        )


@router.get("/status/{vault_id}")
@handle_endpoint_errors("get inheritance status")
async def get_inheritance_status(
    vault_id: str,
    user=Depends(get_authenticated_user),
    inheritance_mgr=Depends(require_inheritance_manager)
):
    """Get comprehensive inheritance status for a vault"""
    try:
        status = await inheritance_mgr.get_inheritance_status(vault_id)
        
        if "error" in status:
            raise create_not_found_error("Vault", vault_id)
        
        return format_response(
            success=True,
            data=status,
            timestamp=get_utc_timestamp()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get inheritance status", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")


@router.post("/death-certificate")
@handle_endpoint_errors("submit death certificate")
async def submit_death_certificate(
    request: DeathCertificateRequest,
    user=Depends(get_authenticated_user),
    inheritance_mgr=Depends(require_inheritance_manager)
):
    """Submit death certificate for verification"""
    try:
        # In production, document_data would come from file upload
        # For now, create empty bytes or use hash if provided
        if request.document_hash:
            # Convert hex hash to bytes (simulated document)
            document_data = bytes.fromhex(request.document_hash)
        else:
            # Create minimal document data
            document_data = f"{request.jurisdiction}|{request.certificate_date}|{request.issuer}".encode()
        
        verification_id = await inheritance_mgr.submit_death_certificate(
            vault_id=request.vault_id,
            document_data=document_data,
            submitter_address=user["address"]
        )
        
        # Store metadata in verification record
        verifications = inheritance_mgr.death_verifications.get(request.vault_id, [])
        if verifications:
            last_verification = verifications[-1]
            last_verification.metadata.update({
                "jurisdiction": request.jurisdiction,
                "certificate_date": request.certificate_date,
                "issuer": request.issuer
            })
        
        return format_response(
            success=True,
            data={"verification_id": verification_id},
            message="Death certificate submitted for verification",
            timestamp=get_utc_timestamp()
        )
    except Exception as e:
        logger.error("Failed to submit death certificate", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to submit certificate: {str(e)}")


@router.post("/legacy-message")
@handle_endpoint_errors("create legacy message")
async def create_legacy_message(
    request: LegacyMessageRequest,
    user=Depends(get_authenticated_user),
    inheritance_mgr=Depends(require_inheritance_manager)
):
    """Create a legacy message for beneficiaries"""
    try:
        message_id = await inheritance_mgr.create_legacy_message(
            vault_id=request.vault_id,
            from_address=user["address"],
            to_address=request.recipient_address,
            message_content=request.message_content,
            unlock_condition=request.unlock_condition
        )
        
        return format_response(
            success=True,
            data={
                "message_id": message_id,
                "recipient": request.recipient_address,
                "unlock_condition": request.unlock_condition
            },
            timestamp=get_utc_timestamp()
        )
    except Exception as e:
        logger.error("Failed to create legacy message", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to create message: {str(e)}")


@router.post("/guardian/manual-trigger")
@handle_endpoint_errors("guardian manual trigger")
async def guardian_manual_trigger(
    request: GuardianManualTriggerRequest,
    user=Depends(get_authenticated_user),
    inheritance_mgr=Depends(require_inheritance_manager)
):
    """Guardian-initiated manual trigger for inheritance process"""
    try:
        result = await inheritance_mgr.guardian_manual_trigger(
            vault_id=request.vault_id,
            guardian_address=user["address"],
            reason=request.reason,
            evidence=request.evidence or {}
        )
        
        return format_response(
            success=True,
            data=result,
            message="Manual trigger initiated",
            timestamp=get_utc_timestamp()
        )
    except Exception as e:
        logger.error("Failed to trigger manual inheritance", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to trigger: {str(e)}")


@router.get("/verifications/{vault_id}")
@handle_endpoint_errors("get death verifications")
async def get_death_verifications(
    vault_id: str,
    user=Depends(get_authenticated_user),
    inheritance_mgr=Depends(require_inheritance_manager)
):
    """Get all death verifications for a vault"""
    try:
        verifications = inheritance_mgr.death_verifications.get(vault_id, [])
        
        verification_list = [
            {
                "source": v.source.value if hasattr(v.source, 'value') else str(v.source),
                "verification_id": v.verification_id,
                "timestamp": v.timestamp.isoformat(),
                "confidence": v.confidence,
                "document_hash": v.document_hash,
                "verifier_address": v.verifier_address,
                "metadata": v.metadata
            }
            for v in verifications
        ]
        
        return format_response(
            success=True,
            data={
                "vault_id": vault_id,
                "verifications": verification_list,
                "count": len(verification_list),
                "consensus_reached": await inheritance_mgr._check_verification_consensus(
                    vault_id, verifications
                ) if verifications else False
            },
            timestamp=get_utc_timestamp()
        )
    except Exception as e:
        logger.error("Failed to get verifications", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get verifications: {str(e)}")


@router.get("/events/{vault_id}")
@handle_endpoint_errors("get inheritance events")
async def get_inheritance_events(
    vault_id: str,
    limit: int = 50,
    user=Depends(get_authenticated_user),
    inheritance_mgr=Depends(require_inheritance_manager)
):
    """Get inheritance events for a vault"""
    try:
        events = [
            e for e in inheritance_mgr.inheritance_events
            if e.vault_id == vault_id
        ][:limit]
        
        event_list = [
            {
                "event_type": e.event_type,
                "vault_id": e.vault_id,
                "timestamp": e.timestamp.isoformat(),
                "actor_address": e.actor_address,
                "details": e.details,
                "risk_score": e.risk_score,
                "verified": e.verified
            }
            for e in events
        ]
        
        return format_response(
            success=True,
            data={
                "vault_id": vault_id,
                "events": event_list,
                "count": len(event_list)
            },
            timestamp=get_utc_timestamp()
        )
    except Exception as e:
        logger.error("Failed to get events", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get events: {str(e)}")


@router.get("/stats")
@handle_endpoint_errors("get inheritance stats")
async def get_inheritance_stats(
    inheritance_mgr=Depends(require_inheritance_manager),
    vault_integration=Depends(require_vault_service)
):
    """Get global inheritance platform statistics"""
    try:
        total_vaults = len(vault_integration.vaults)
        active_vaults = sum(1 for v in vault_integration.vaults.values() if v.status == "active")
        triggered_vaults = sum(1 for v in vault_integration.vaults.values() if v.status in ["triggered", "verified"])
        
        total_verifications = sum(len(v) for v in inheritance_mgr.death_verifications.values())
        total_events = len(inheritance_mgr.inheritance_events)
        total_messages = sum(len(m) for m in inheritance_mgr.legacy_messages.values())
        
        return format_response(
            success=True,
            data={
                "total_vaults": total_vaults,
                "active_vaults": active_vaults,
                "triggered_vaults": triggered_vaults,
                "total_death_verifications": total_verifications,
                "total_inheritance_events": total_events,
                "total_legacy_messages": total_messages,
                "verification_threshold": inheritance_mgr.verification_threshold,
                "min_verification_sources": inheritance_mgr.min_verification_sources
            },
            timestamp=get_utc_timestamp()
        )
    except Exception as e:
        logger.error("Failed to get stats", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

