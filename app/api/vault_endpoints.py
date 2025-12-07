#!/usr/bin/env python3
"""
API Endpoints for GuardiaVault Integration
Provides REST API for vault management and inheritance features
"""

from fastapi import APIRouter, Depends, File, UploadFile
from pydantic import BaseModel, EmailStr, Field
from typing import Any, Dict, List, Optional
import structlog

# Import core modules
from app.core.guardia_vault_integration import VaultConfig

# Import dependencies and helpers
from app.api.dependencies import (
    get_authenticated_user,
    require_vault_service,
    require_inheritance_manager
)
from app.api.error_handlers import (
    handle_endpoint_errors,
    create_not_found_error,
    create_validation_error,
    create_forbidden_error
)
from app.api.vault_helpers import (
    check_vault_access,
    check_vault_ownership,
    build_vault_response,
    determine_user_role,
    validate_vault_config,
    validate_beneficiary_allocation,
    VaultRole,
    guardian_to_dict
)
from app.core.utils import get_utc_timestamp, format_response

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/vault", tags=["vault"])


# Request/Response Models
class CreateVaultRequest(BaseModel):
    """Request model for creating a vault"""
    vault_name: str = Field(..., description="Name for the vault")
    check_in_frequency: int = Field(default=30, ge=7, le=365, description="Days between check-ins")
    grace_period: int = Field(default=14, ge=7, le=90, description="Grace period days")
    revoke_window: int = Field(default=7, ge=1, le=30, description="Days to revoke false trigger")
    death_verification_delay: int = Field(default=7, ge=1, le=30, description="Delay after verification")
    min_guardians: int = Field(default=2, ge=1, le=10, description="Minimum guardians required")
    max_guardians: int = Field(default=5, ge=2, le=10, description="Maximum guardians allowed")
    required_attestations: int = Field(default=2, ge=1, le=5, description="Required attestations")
    guardians: List[Dict[str, str]] = Field(..., description="List of guardian addresses and emails")
    beneficiaries: List[Dict[str, Any]] = Field(..., description="List of beneficiaries and shares")
    enable_yield: bool = Field(default=True, description="Enable yield generation")
    enable_mpc: bool = Field(default=True, description="Enable MPC key management")
    enable_ml_risk: bool = Field(default=True, description="Enable ML risk assessment")


class VaultResponse(BaseModel):
    """Response model for vault data"""
    vault_id: str
    owner_address: str
    vault_name: Optional[str]
    status: str
    created_at: str
    last_check_in: str
    security_score: float
    threat_level: str
    guardians: List[Dict[str, Any]]
    beneficiaries: List[Dict[str, Any]]
    eth_balance: float
    config: Dict[str, Any]


class CheckInRequest(BaseModel):
    """Request model for vault check-in"""
    message: Optional[str] = Field(None, description="Optional check-in message")
    biometric_data: Optional[str] = Field(None, description="Optional biometric verification")


class GuardianAttestRequest(BaseModel):
    """Request model for guardian attestation"""
    reason: str = Field(..., description="Reason for attestation")
    evidence: Optional[Dict[str, Any]] = Field(None, description="Supporting evidence")
    signature: Optional[str] = Field(None, description="Digital signature")


class BeneficiaryClaimRequest(BaseModel):
    """Request model for beneficiary claim"""
    claim_type: str = Field(default="all", description="Type of claim: all, eth, erc20, nft")
    specific_assets: Optional[List[str]] = Field(None, description="Specific assets to claim")


class LegacyMessageRequest(BaseModel):
    """Request model for creating legacy message"""
    recipient_address: str = Field(..., description="Beneficiary address")
    message_content: str = Field(..., description="Message content")
    unlock_condition: str = Field(default="death_verified", description="When to deliver message")


class AddGuardianRequest(BaseModel):
    """Request model for adding guardian"""
    address: str = Field(..., description="Guardian wallet address")
    email: Optional[str] = Field(None, description="Guardian email (optional)")


class AddBeneficiaryRequest(BaseModel):
    """Request model for adding beneficiary"""
    address: str = Field(..., description="Beneficiary wallet address")
    allocation: float = Field(..., ge=0, le=100, description="Allocation percentage (0-100)")
    relationship: Optional[str] = Field(None, description="Relationship to owner (optional)")


class DeathCertificateUpload(BaseModel):
    """Model for death certificate metadata"""
    jurisdiction: str = Field(..., description="Jurisdiction of certificate")
    certificate_date: str = Field(..., description="Date on certificate")
    issuer: str = Field(..., description="Issuing authority")


class GuardianInviteRequest(BaseModel):
    """Request model for sending guardian magic link"""
    email: Optional[EmailStr] = Field(None, description="Override guardian email")
    expiry_hours: int = Field(24, ge=1, le=168, description="Magic-link expiry window (hours)")


class GuardianOnboardingRequest(BaseModel):
    """Request model for completing guardian onboarding"""
    token: str = Field(..., description="Magic-link token")
    mfa_method: Optional[str] = Field("email", description="MFA method used to verify guardian")


class SeedlessWalletRequest(BaseModel):
    """Create guardian-backed seedless wallet"""
    guardians: List[str] = Field(..., min_items=1, description="Guardian wallet addresses")
    threshold: Optional[int] = Field(None, ge=1, description="Custom approval threshold (optional)")


class SeedlessRecoveryRequest(BaseModel):
    """Initiate recovery for a seedless wallet"""
    initiator: Optional[str] = Field(None, description="Address requesting recovery (defaults to caller)")


class SeedlessRecoveryApprovalRequest(BaseModel):
    """Guardian approval payload"""
    guardian_address: Optional[str] = Field(None, description="Guardian address (defaults to caller)")
    mfa_code: Optional[str] = Field(None, description="Optional MFA verification code")


# Endpoints
@router.post("/create", response_model=VaultResponse)
@handle_endpoint_errors("create vault")
async def create_vault(
    request: CreateVaultRequest,
    user=Depends(get_authenticated_user),
    vault_integration=Depends(require_vault_service)
):
    """
    Create a new inheritance vault
    """
    # Create vault configuration
    config = VaultConfig(
        check_in_frequency=request.check_in_frequency,
        grace_period=request.grace_period,
        revoke_window=request.revoke_window,
        death_verification_delay=request.death_verification_delay,
        min_guardians=request.min_guardians,
        max_guardians=request.max_guardians,
        required_attestations=request.required_attestations,
        enable_yield=request.enable_yield,
        enable_mpc=request.enable_mpc,
        enable_ml_risk=request.enable_ml_risk
    )
    
    # Validate configuration
    validate_vault_config(config)
    
    # Validate beneficiary allocation
    validate_beneficiary_allocation(request.beneficiaries)
    
    # Create vault
    vault_id = await vault_integration.create_vault(
        owner_address=user["address"],
        vault_name=request.vault_name,
        config=config,
        guardians=request.guardians,
        beneficiaries=request.beneficiaries
    )
    
    # Get created vault
    vault = vault_integration.get_vault(vault_id)
    if not vault:
        raise create_not_found_error("Vault", vault_id)
    
    # Build and return response
    vault_dict = build_vault_response(vault, request.vault_name)
    return VaultResponse(**vault_dict)


@router.get("/{vault_id}", response_model=VaultResponse)
@handle_endpoint_errors("get vault")
async def get_vault(
    vault_id: str,
    user=Depends(get_authenticated_user),
    vault_integration=Depends(require_vault_service)
):
    """
    Get vault details
    """
    vault = vault_integration.get_vault(vault_id)
    if not vault:
        raise create_not_found_error("Vault", vault_id)
    
    # Check authorization (owner, guardian, or beneficiary)
    check_vault_access(vault, user["address"])
    
    # Build and return response
    vault_dict = build_vault_response(vault)
    return VaultResponse(**vault_dict)


@router.post("/{vault_id}/checkin")
@handle_endpoint_errors("vault check-in")
async def vault_checkin(
    vault_id: str,
    request: CheckInRequest,
    user=Depends(get_authenticated_user),
    vault_integration=Depends(require_vault_service)
):
    """
    Perform vault check-in to prove owner is alive
    """
    # Perform check-in
    success = await vault_integration.check_in(vault_id, user["address"])
    
    if not success:
        raise create_validation_error("Check-in failed")
    
    return format_response(
        success=True,
        message="Check-in successful",
        timestamp=get_utc_timestamp()
    )


@router.post("/{vault_id}/attest")
@handle_endpoint_errors("guardian attestation")
async def guardian_attest(
    vault_id: str,
    request: GuardianAttestRequest,
    user=Depends(get_authenticated_user),
    vault_integration=Depends(require_vault_service),
    inheritance_mgr=Depends(require_inheritance_manager)
):
    """
    Guardian attestation of owner's death
    """
    # Process attestation
    success = await vault_integration.guardian_attest(
        vault_id=vault_id,
        guardian_address=user["address"],
        signature=request.signature
    )
    
    # If providing evidence, also trigger manual verification
    if request.evidence:
        await inheritance_mgr.guardian_manual_trigger(
            vault_id=vault_id,
            guardian_address=user["address"],
            reason=request.reason,
            evidence=request.evidence
        )
    
    return format_response(
        success=success,
        message="Attestation recorded",
        timestamp=get_utc_timestamp()
    )


@router.post("/{vault_id}/claim")
@handle_endpoint_errors("beneficiary claim")
async def beneficiary_claim(
    vault_id: str,
    request: BeneficiaryClaimRequest,
    user=Depends(get_authenticated_user),
    vault_integration=Depends(require_vault_service)
):
    """
    Beneficiary claim inheritance
    """
    # Process claim
    result = await vault_integration.claim_inheritance(
        vault_id=vault_id,
        beneficiary_address=user["address"]
    )
    
    return format_response(
        success=True,
        data={"claim_details": result},
        timestamp=get_utc_timestamp()
    )


@router.get("/{vault_id}/status")
@handle_endpoint_errors("get inheritance status")
async def get_inheritance_status(
    vault_id: str,
    user=Depends(get_authenticated_user),
    inheritance_mgr=Depends(require_inheritance_manager),
    vault_integration=Depends(require_vault_service)
):
    """
    Get comprehensive inheritance status
    """
    # Get status
    status = await inheritance_mgr.get_inheritance_status(vault_id)
    
    if "error" in status:
        raise create_not_found_error("Vault", vault_id)
    
    # Verify user has access by checking vault directly
    vault = vault_integration.get_vault(vault_id)
    if vault:
        check_vault_access(vault, user["address"])
    else:
        # Fallback: check status object
        if status.get("owner_address") != user["address"]:
            is_guardian = any(
                g.get("address") == user["address"]
                for g in status.get("guardians", {}).get("details", [])
            )
            is_beneficiary = any(
                b.get("address") == user["address"]
                for b in status.get("beneficiaries", {}).get("details", [])
            )
            
            if not is_guardian and not is_beneficiary:
                raise create_forbidden_error("Not authorized")
    
    return status


@router.post("/{vault_id}/death-certificate")
@handle_endpoint_errors("upload death certificate")
async def upload_death_certificate(
    vault_id: str,
    metadata: DeathCertificateUpload,
    file: UploadFile = File(...),
    user=Depends(get_authenticated_user),
    inheritance_mgr=Depends(require_inheritance_manager)
):
    """
    Upload death certificate for verification
    """
    # Read file data
    document_data = await file.read()
    
    # Submit certificate
    verification_id = await inheritance_mgr.submit_death_certificate(
        vault_id=vault_id,
        document_data=document_data,
        submitter_address=user["address"]
    )
    
    return format_response(
        success=True,
        data={"verification_id": verification_id},
        message="Death certificate submitted for verification",
        timestamp=get_utc_timestamp()
    )


@router.post("/{vault_id}/legacy-message")
@handle_endpoint_errors("create legacy message")
async def create_legacy_message(
    vault_id: str,
    request: LegacyMessageRequest,
    user=Depends(get_authenticated_user),
    vault_integration=Depends(require_vault_service),
    inheritance_mgr=Depends(require_inheritance_manager)
):
    """
    Create a legacy message for beneficiaries
    """
    # Verify user is vault owner
    vault = vault_integration.get_vault(vault_id)
    if not vault:
        raise create_not_found_error("Vault", vault_id)
    
    check_vault_ownership(vault, user["address"])
    
    # Create message
    message_id = await inheritance_mgr.create_legacy_message(
        vault_id=vault_id,
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


@router.get("/user/vaults")
@handle_endpoint_errors("get user vaults")
async def get_user_vaults(
    user=Depends(get_authenticated_user),
    vault_integration=Depends(require_vault_service)
):
    """
    Get all vaults associated with user (owner, guardian, or beneficiary)
    """
    # Get user's vaults
    vaults = vault_integration.get_user_vaults(user["address"])
    
    # Format response
    vault_list = []
    for vault in vaults:
        role = determine_user_role(vault, user["address"])
        
        vault_list.append({
            "vault_id": vault.vault_id,
            "role": role,
            "status": vault.status,
            "created_at": vault.created_at.isoformat(),
            "last_check_in": vault.last_check_in.isoformat(),
            "security_score": vault.security_score,
            "threat_level": vault.threat_level
        })
    
    return format_response(
        success=True,
        data={
            "total": len(vault_list),
            "vaults": vault_list
        },
        timestamp=get_utc_timestamp()
    )


@router.post("/{vault_id}/deposit")
@handle_endpoint_errors("deposit to vault")
async def deposit_to_vault(
    vault_id: str,
    amount: float,
    asset_type: str = "ETH",
    user=Depends(get_authenticated_user),
    vault_integration=Depends(require_vault_service)
):
    """
    Deposit assets to vault
    """
    vault = vault_integration.get_vault(vault_id)
    if not vault:
        raise create_not_found_error("Vault", vault_id)
    
    # For now, just update the balance (in production, would handle actual transfer)
    if asset_type == "ETH":
        vault.eth_balance += amount
    else:
        raise create_validation_error(f"Unsupported asset type: {asset_type}")
    
    return format_response(
        success=True,
        data={"new_balance": vault.eth_balance},
        message=f"Deposited {amount} {asset_type} to vault",
        timestamp=get_utc_timestamp()
    )


@router.post("/{vault_id}/guardians")
@handle_endpoint_errors("add guardian")
async def add_guardian(
    vault_id: str,
    request: AddGuardianRequest,
    user=Depends(get_authenticated_user),
    vault_integration=Depends(require_vault_service)
):
    """
    Add a guardian to an existing vault
    """
    # Verify user is vault owner
    vault = vault_integration.get_vault(vault_id)
    if not vault:
        raise create_not_found_error("Vault", vault_id)
    
    check_vault_ownership(vault, user["address"])
    
    # Add guardian
    success = await vault_integration.add_guardian(
        vault_id=vault_id,
        guardian_address=request.address,
        email=request.email
    )
    
    if not success:
        raise create_validation_error("Failed to add guardian")
    
    # Get updated vault
    updated_vault = vault_integration.get_vault(vault_id)
    
    return format_response(
        success=True,
        data={
            "guardians": [
                {
                    "address": g.address,
                    "trust_score": g.trust_score,
                    "is_active": g.is_active
                }
                for g in updated_vault.guardians
            ]
        },
        message="Guardian added successfully",
        timestamp=get_utc_timestamp()
    )


@router.post("/{vault_id}/guardians/{guardian_address}/invite")
@handle_endpoint_errors("invite guardian")
async def invite_guardian(
    vault_id: str,
    guardian_address: str,
    request: GuardianInviteRequest,
    user=Depends(get_authenticated_user),
    vault_integration=Depends(require_vault_service),
):
    """
    Re-send a magic-link onboarding invitation to a guardian.
    """
    vault = vault_integration.get_vault(vault_id)
    if not vault:
        raise create_not_found_error("Vault", vault_id)

    check_vault_ownership(vault, user["address"])

    invite = await vault_integration.initiate_guardian_onboarding(
        vault_id=vault_id,
        guardian_address=guardian_address,
        email=request.email,
        expiry_hours=request.expiry_hours,
    )

    return format_response(
        success=True,
        data=invite,
        message="Guardian invite generated",
        timestamp=get_utc_timestamp(),
    )


@router.post("/guardians/onboarding/complete")
@handle_endpoint_errors("complete guardian onboarding")
async def complete_guardian_onboarding(
    request: GuardianOnboardingRequest,
    vault_integration=Depends(require_vault_service),
):
    """
    Complete guardian onboarding via magic link + MFA.
    """
    onboarding = await vault_integration.complete_guardian_onboarding(
        token=request.token,
        mfa_method=request.mfa_method or "email",
    )

    return format_response(
        success=True,
        data=onboarding,
        message="Guardian activated successfully",
        timestamp=get_utc_timestamp(),
    )


@router.post("/{vault_id}/beneficiaries")
@handle_endpoint_errors("add beneficiary")
async def add_beneficiary(
    vault_id: str,
    request: AddBeneficiaryRequest,
    user=Depends(get_authenticated_user),
    vault_integration=Depends(require_vault_service)
):
    """
    Add a beneficiary to an existing vault
    """
    # Verify user is vault owner
    vault = vault_integration.get_vault(vault_id)
    if not vault:
        raise create_not_found_error("Vault", vault_id)
    
    check_vault_ownership(vault, user["address"])
    
    # Validate beneficiary allocation
    current_beneficiaries = [{"share_percentage": b.share_percentage} for b in vault.beneficiaries]
    validate_beneficiary_allocation(current_beneficiaries, request.allocation)
    
    # Add beneficiary
    success = await vault_integration.add_beneficiary(
        vault_id=vault_id,
        beneficiary_address=request.address,
        share_percentage=request.allocation,
        relationship=request.relationship
    )
    
    if not success:
        raise create_validation_error("Failed to add beneficiary")
    
    # Get updated vault
    updated_vault = vault_integration.get_vault(vault_id)
    
    return format_response(
        success=True,
        data={
            "beneficiaries": [
                {
                    "address": b.address,
                    "share_percentage": b.share_percentage,
                    "has_claimed": b.has_claimed,
                    "risk_score": b.risk_score
                }
                for b in updated_vault.beneficiaries
            ]
        },
        message="Beneficiary added successfully",
        timestamp=get_utc_timestamp()
    )


@router.get("/seedless-wallets")
@handle_endpoint_errors("list seedless wallets")
async def list_seedless_wallets(
    owner: Optional[str] = None,
    user=Depends(get_authenticated_user),
    vault_integration=Depends(require_vault_service),
):
    """
    List seedless wallets (defaults to caller unless owner is specified).
    """
    target_owner = owner or user["address"]
    wallets = [
        vault_integration._serialize_seedless_wallet(profile)  # type: ignore[attr-defined]
        for profile in vault_integration.list_seedless_wallets(target_owner)
    ]

    return format_response(
        success=True,
        data={"wallets": wallets},
        timestamp=get_utc_timestamp(),
    )


@router.get("/seedless-wallets/{wallet_id}")
@handle_endpoint_errors("get seedless wallet")
async def get_seedless_wallet(
    wallet_id: str,
    user=Depends(get_authenticated_user),
    vault_integration=Depends(require_vault_service),
):
    """
    Get a specific seedless wallet.
    """
    wallet = vault_integration.get_seedless_wallet(wallet_id)
    if not wallet:
        raise create_not_found_error("Seedless wallet", wallet_id)

    if wallet.owner_address.lower() != user["address"].lower():
        raise create_forbidden_error("Not authorized to view this wallet")

    return format_response(
        success=True,
        data=vault_integration._serialize_seedless_wallet(wallet),  # type: ignore[attr-defined]
        timestamp=get_utc_timestamp(),
    )


@router.get("/seedless-wallets/{wallet_id}/recovery")
@handle_endpoint_errors("list seedless recovery sessions")
async def list_seedless_recovery_sessions(
    wallet_id: str,
    session_id: Optional[str] = None,
    user=Depends(get_authenticated_user),
    vault_integration=Depends(require_vault_service),
):
    """
    List recovery sessions for a seedless wallet.
    """
    wallet = vault_integration.get_seedless_wallet(wallet_id)
    if not wallet:
        raise create_not_found_error("Seedless wallet", wallet_id)

    if wallet.owner_address.lower() != user["address"].lower():
        raise create_forbidden_error("Not authorized to view this wallet")

    sessions = vault_integration.list_seedless_recovery_sessions(wallet_id, session_id)

    return format_response(
        success=True,
        data={
            "sessions": [
                vault_integration._serialize_recovery_session(session)  # type: ignore[attr-defined]
                for session in sessions
            ]
        },
        timestamp=get_utc_timestamp(),
    )


@router.post("/seedless-wallets")
@handle_endpoint_errors("create seedless wallet")
async def create_seedless_wallet(
    request: SeedlessWalletRequest,
    user=Depends(get_authenticated_user),
    vault_integration=Depends(require_vault_service),
):
    """
    Create a guardian-backed seedless wallet profile.
    """
    wallet = await vault_integration.create_seedless_wallet(
        owner_address=user["address"],
        guardians=request.guardians,
        threshold=request.threshold,
    )

    return format_response(
        success=True,
        data=wallet,
        message="Seedless wallet created",
        timestamp=get_utc_timestamp(),
    )


@router.post("/seedless-wallets/{wallet_id}/recovery")
@handle_endpoint_errors("initiate seedless recovery")
async def initiate_seedless_recovery(
    wallet_id: str,
    request: SeedlessRecoveryRequest,
    user=Depends(get_authenticated_user),
    vault_integration=Depends(require_vault_service),
):
    """
    Start a guardian-mediated recovery session for a seedless wallet.
    """
    initiator = request.initiator or user["address"]
    session = await vault_integration.initiate_seedless_recovery(wallet_id, initiator)

    return format_response(
        success=True,
        data=session,
        message="Seedless recovery session started",
        timestamp=get_utc_timestamp(),
    )


@router.post("/seedless-wallets/{wallet_id}/recovery/{session_id}/approve")
@handle_endpoint_errors("approve seedless recovery")
async def approve_seedless_recovery(
    wallet_id: str,
    session_id: str,
    request: SeedlessRecoveryApprovalRequest,
    user=Depends(get_authenticated_user),
    vault_integration=Depends(require_vault_service),
):
    """
    Guardian approval for a recovery session.
    """
    guardian_address = request.guardian_address or user["address"]
    approval = await vault_integration.approve_seedless_recovery(
        wallet_id=wallet_id,
        session_id=session_id,
        guardian_address=guardian_address,
    )

    return format_response(
        success=True,
        data=approval,
        message="Recovery approval recorded",
        timestamp=get_utc_timestamp(),
    )


@router.get("/stats/global")
@handle_endpoint_errors("get global stats")
async def get_global_stats(
    vault_integration=Depends(require_vault_service)
):
    """
    Get global vault statistics
    """
    # Calculate statistics
    total_vaults = len(vault_integration.vaults)
    active_vaults = sum(1 for v in vault_integration.vaults.values() if v.status == "active")
    triggered_vaults = sum(1 for v in vault_integration.vaults.values() if v.status in ["triggered", "verified"])
    total_value_locked = sum(v.eth_balance for v in vault_integration.vaults.values())
    
    return format_response(
        success=True,
        data={
            "total_vaults": total_vaults,
            "active_vaults": active_vaults,
            "triggered_vaults": triggered_vaults,
            "total_value_locked": total_value_locked,
            "average_security_score": sum(v.security_score for v in vault_integration.vaults.values()) / max(1, total_vaults)
        },
        timestamp=get_utc_timestamp()
    )


# Export router
__all__ = ["router"]

