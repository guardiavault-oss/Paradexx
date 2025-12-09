"""Bridge-related data models."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, validator


class BridgeType(str, Enum):
    """Types of cross-chain bridges."""

    LOCK_AND_MINT = "lock_and_mint"
    BURN_AND_MINT = "burn_and_mint"
    ATOMIC_SWAP = "atomic_swap"
    RELAY = "relay"
    SIDECHAIN = "sidechain"
    LAYER_2 = "layer_2"
    CUSTODIAL = "custodial"
    NON_CUSTODIAL = "non_custodial"


class SecurityLevel(str, Enum):
    """Security levels for bridge analysis."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    SAFE = "safe"


class Bridge(BaseModel):
    """Bridge contract model."""

    address: str = Field(..., description="Bridge contract address")
    name: str = Field(..., description="Bridge name")
    type: BridgeType = Field(..., description="Bridge type")
    source_network: str = Field(..., description="Source blockchain network")
    target_network: str = Field(..., description="Target blockchain network")
    is_verified: bool = Field(default=False, description="Whether contract is verified")
    total_value_locked: float | None = Field(None, description="Total value locked in USD")
    daily_volume: float | None = Field(None, description="Daily transaction volume in USD")
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())

    @validator("address")
    def validate_address(cls, v):
        if not v.startswith("0x") or len(v) != 42:
            raise ValueError("Invalid contract address format")
        return v.lower()


class BridgeAnalysis(BaseModel):
    """Bridge security analysis results."""

    bridge_address: str = Field(..., description="Bridge contract address")
    analysis_timestamp: datetime = Field(default_factory=lambda: datetime.now())
    security_score: float = Field(..., ge=0, le=10, description="Overall security score (0-10)")
    risk_level: SecurityLevel = Field(..., description="Overall risk level")

    # Detailed analysis results
    code_quality_score: float = Field(..., ge=0, le=10)
    audit_status: str = Field(..., description="Audit status and findings")
    governance_analysis: dict[str, Any] = Field(default_factory=dict)
    validator_set_analysis: dict[str, Any] = Field(default_factory=dict)
    economic_security_analysis: dict[str, Any] = Field(default_factory=dict)
    operational_security_analysis: dict[str, Any] = Field(default_factory=dict)

    # Vulnerability findings
    vulnerabilities: list[dict[str, Any]] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)

    # Liquidity and token flow analysis
    liquidity_analysis: dict[str, Any] | None = None
    token_flow_analysis: dict[str, Any] | None = None

    # Network-specific analysis
    source_network_analysis: dict[str, Any] = Field(default_factory=dict)
    target_network_analysis: dict[str, Any] = Field(default_factory=dict)


class BridgeSecurityScore(BaseModel):
    """Detailed security scoring for bridges."""

    bridge_address: str = Field(..., description="Bridge contract address")
    network: str = Field(..., description="Network where bridge is deployed")

    # Scoring criteria (0-10 scale)
    code_quality: float = Field(..., ge=0, le=10)
    audit_status: float = Field(..., ge=0, le=10)
    governance_decentralization: float = Field(..., ge=0, le=10)
    validator_set: float = Field(..., ge=0, le=10)
    economic_security: float = Field(..., ge=0, le=10)
    operational_security: float = Field(..., ge=0, le=10)

    # Calculated overall score
    overall_score: float = Field(..., ge=0, le=10)
    risk_level: SecurityLevel = Field(..., description="Calculated risk level")

    # Detailed breakdown
    scoring_details: dict[str, Any] = Field(default_factory=dict)
    last_updated: datetime = Field(default_factory=lambda: datetime.now())

    def calculate_overall_score(self) -> float:
        """Calculate overall score from individual criteria."""
        criteria = [
            self.code_quality,
            self.audit_status,
            self.governance_decentralization,
            self.validator_set,
            self.economic_security,
            self.operational_security,
        ]
        # Only include non-zero scores
        non_zero_criteria = [c for c in criteria if c > 0]
        return sum(non_zero_criteria) / len(non_zero_criteria) if non_zero_criteria else 0.0

    @validator("risk_level")
    def calculate_risk_level(cls, v, values):
        """Calculate risk level based on overall score."""
        score = values.get("overall_score", 0)
        if score >= 8:
            return SecurityLevel.SAFE
        if score >= 6:
            return SecurityLevel.LOW
        if score >= 4:
            return SecurityLevel.MEDIUM
        if score >= 2:
            return SecurityLevel.HIGH
        return SecurityLevel.CRITICAL
