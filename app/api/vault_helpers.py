#!/usr/bin/env python3
"""
Vault-Specific Helper Functions
Provides reusable functions for vault operations to eliminate code duplication
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
import structlog

logger = structlog.get_logger(__name__)

# Import vault types
try:
    from app.core.guardia_vault_integration import (
        InheritanceVault,
        Guardian,
        Beneficiary,
        VaultConfig
    )
except ImportError:
    # Fallback for testing
    InheritanceVault = None
    Guardian = None
    Beneficiary = None
    VaultConfig = None


class VaultRole(Enum):
    """Vault access roles"""
    OWNER = "owner"
    GUARDIAN = "guardian"
    BENEFICIARY = "beneficiary"
    NONE = "none"


def check_vault_access(
    vault: InheritanceVault,
    user_address: str,
    required_roles: List[VaultRole] = None
) -> VaultRole:
    """
    Check if user has access to vault and return their role
    
    Args:
        vault: InheritanceVault instance
        user_address: User's wallet address
        required_roles: List of required roles (optional)
        
    Returns:
        VaultRole enum value
        
    Raises:
        HTTPException: If access is denied
    """
    # Determine user's role
    if vault.owner_address == user_address:
        role = VaultRole.OWNER
    elif any(g.address == user_address for g in vault.guardians):
        role = VaultRole.GUARDIAN
    elif any(b.address == user_address for b in vault.beneficiaries):
        role = VaultRole.BENEFICIARY
    else:
        role = VaultRole.NONE
    
    # Check if role is required
    if required_roles and role not in required_roles:
        role_names = [r.value for r in required_roles]
        raise HTTPException(
            status_code=403,
            detail=f"Access denied. Required roles: {', '.join(role_names)}"
        )
    
    # Check if user has no access
    if role == VaultRole.NONE and required_roles is not None:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access this vault"
        )
    
    return role


def check_vault_ownership(
    vault: InheritanceVault,
    user_address: str
) -> None:
    """
    Check if user is the vault owner
    
    Args:
        vault: InheritanceVault instance
        user_address: User's wallet address
        
    Raises:
        HTTPException: If user is not the owner
    """
    if vault.owner_address != user_address:
        raise HTTPException(
            status_code=403,
            detail="Only vault owner can perform this operation"
        )


def guardian_to_dict(guardian: Guardian) -> Dict[str, Any]:
    """
    Convert Guardian object to dictionary
    
    Args:
        guardian: Guardian instance
        
    Returns:
        Dictionary representation of guardian
    """
    return {
        "address": guardian.address,
        "is_active": guardian.is_active,
        "has_attested": guardian.has_attested,
        "trust_score": guardian.trust_score,
        "risk_level": getattr(guardian, "risk_level", "low"),
        "email_hash": getattr(guardian, "email_hash", None),
        "invite_status": getattr(guardian, "invite_status", "pending"),
        "mfa_enabled": getattr(guardian, "mfa_enabled", False),
        "portal_url": getattr(guardian, "portal_url", None),
        "assigned_vaults": getattr(guardian, "assigned_vaults", []),
        "mpc_shard_id": getattr(guardian, "mpc_shard_id", None),
        "last_invited_at": guardian.last_invited_at.isoformat() if getattr(guardian, "last_invited_at", None) else None,
    }


def beneficiary_to_dict(beneficiary: Beneficiary) -> Dict[str, Any]:
    """
    Convert Beneficiary object to dictionary
    
    Args:
        beneficiary: Beneficiary instance
        
    Returns:
        Dictionary representation of beneficiary
    """
    return {
        "address": beneficiary.address,
        "share_percentage": beneficiary.share_percentage,
        "has_claimed": beneficiary.has_claimed,
        "risk_score": beneficiary.risk_score,
        "verification_status": getattr(beneficiary, "verification_status", "pending"),
        "yield_vault_id": getattr(beneficiary, "yield_vault_id", None),
    }


def build_vault_response(
    vault: InheritanceVault,
    vault_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Convert InheritanceVault to VaultResponse dictionary
    
    Args:
        vault: InheritanceVault instance
        vault_name: Optional vault name (if not stored in vault)
        
    Returns:
        Dictionary representation of vault response
    """
    return {
        "vault_id": vault.vault_id,
        "owner_address": vault.owner_address,
        "vault_name": vault_name,
        "status": vault.status,
        "created_at": vault.created_at.isoformat(),
        "last_check_in": vault.last_check_in.isoformat(),
        "security_score": vault.security_score,
        "threat_level": vault.threat_level,
        "guardians": [guardian_to_dict(g) for g in vault.guardians],
        "beneficiaries": [beneficiary_to_dict(b) for b in vault.beneficiaries],
        "eth_balance": vault.eth_balance,
        "config": vault.config.__dict__ if hasattr(vault, "config") else {},
        "guardian_contract_address": getattr(vault, "guardian_contract_address", None),
        "mpc_key_id": getattr(vault, "mpc_key_id", None),
    }


def determine_user_role(
    vault: InheritanceVault,
    user_address: str
) -> str:
    """
    Determine user's role in vault
    
    Args:
        vault: InheritanceVault instance
        user_address: User's wallet address
        
    Returns:
        Role string: "owner", "guardian", "beneficiary", or "unknown"
    """
    if vault.owner_address == user_address:
        return "owner"
    elif any(g.address == user_address for g in vault.guardians):
        return "guardian"
    elif any(b.address == user_address for b in vault.beneficiaries):
        return "beneficiary"
    else:
        return "unknown"


def validate_vault_config(config: VaultConfig) -> None:
    """
    Validate vault configuration
    
    Args:
        config: VaultConfig instance
        
    Raises:
        ValueError: If configuration is invalid
    """
    # Validate guardian counts
    if config.min_guardians > config.max_guardians:
        raise ValueError("min_guardians cannot be greater than max_guardians")
    
    # Validate attestation requirements
    if config.required_attestations > config.max_guardians:
        raise ValueError(
            f"required_attestations ({config.required_attestations}) "
            f"cannot exceed max_guardians ({config.max_guardians})"
        )
    
    # Validate time windows
    if config.check_in_frequency < 7:
        raise ValueError("check_in_frequency must be at least 7 days")
    
    if config.grace_period < 7:
        raise ValueError("grace_period must be at least 7 days")
    
    if config.revoke_window < 1:
        raise ValueError("revoke_window must be at least 1 day")
    
    if config.death_verification_delay < 1:
        raise ValueError("death_verification_delay must be at least 1 day")


def validate_beneficiary_allocation(
    beneficiaries: List[Dict[str, Any]],
    new_allocation: float = None
) -> None:
    """
    Validate beneficiary allocation totals
    
    Args:
        beneficiaries: List of beneficiary dictionaries
        new_allocation: New allocation to add (optional)
        
    Raises:
        ValueError: If allocation exceeds 100%
    """
    total_allocation = sum(b.get("share_percentage", 0) for b in beneficiaries)
    
    if new_allocation:
        total_allocation += new_allocation
    
    if total_allocation > 100.0:
        raise ValueError(
            f"Total beneficiary allocation ({total_allocation}%) exceeds 100%"
        )


# Export all helpers
__all__ = [
    "VaultRole",
    "check_vault_access",
    "check_vault_ownership",
    "guardian_to_dict",
    "beneficiary_to_dict",
    "build_vault_response",
    "determine_user_role",
    "validate_vault_config",
    "validate_beneficiary_allocation",
]


