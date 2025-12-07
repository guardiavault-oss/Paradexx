"""Contract-related data models."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, validator


class ContractType(str, Enum):
    """Types of smart contracts."""

    ERC20 = "erc20"
    ERC721 = "erc721"
    ERC1155 = "erc1155"
    BRIDGE = "bridge"
    DEX = "dex"
    LENDING = "lending"
    STAKING = "staking"
    GOVERNANCE = "governance"
    MULTISIG = "multisig"
    PROXY = "proxy"
    FACTORY = "factory"
    UNKNOWN = "unknown"


class Contract(BaseModel):
    """Smart contract model."""

    address: str = Field(..., description="Contract address")
    network: str = Field(..., description="Blockchain network")
    type: ContractType = Field(default=ContractType.UNKNOWN, description="Contract type")
    name: str | None = Field(None, description="Contract name")
    symbol: str | None = Field(None, description="Contract symbol")
    is_verified: bool = Field(default=False, description="Whether contract is verified")
    compiler_version: str | None = Field(None, description="Solidity compiler version")
    source_code: str | None = Field(None, description="Contract source code")
    abi: list[dict[str, Any]] | None = Field(None, description="Contract ABI")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @validator("address")
    def validate_address(cls, v):
        if not v.startswith("0x") or len(v) != 42:
            raise ValueError("Invalid contract address format")
        return v.lower()


class ContractAnalysis(BaseModel):
    """Contract security analysis results."""

    contract_address: str = Field(..., description="Contract address")
    network: str = Field(..., description="Network where contract is deployed")
    analysis_timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Analysis results
    security_score: float = Field(..., ge=0, le=10, description="Overall security score")
    risk_level: str = Field(..., description="Risk level assessment")

    # Detailed findings
    vulnerabilities: list[dict[str, Any]] = Field(default_factory=list)
    code_quality_issues: list[dict[str, Any]] = Field(default_factory=list)
    gas_optimization_issues: list[dict[str, Any]] = Field(default_factory=list)
    access_control_analysis: dict[str, Any] = Field(default_factory=dict)
    reentrancy_analysis: dict[str, Any] = Field(default_factory=dict)

    # Dependencies and interactions
    dependencies: list[str] = Field(default_factory=list)
    external_calls: list[dict[str, Any]] = Field(default_factory=list)
    token_interactions: list[dict[str, Any]] = Field(default_factory=list)

    # Recommendations
    recommendations: list[str] = Field(default_factory=list)
    critical_issues: list[str] = Field(default_factory=list)

    # Cross-chain specific analysis
    cross_chain_interactions: list[dict[str, Any]] = Field(default_factory=list)
    bridge_usage: list[dict[str, Any]] = Field(default_factory=list)
    multi_chain_deployments: list[dict[str, Any]] = Field(default_factory=list)
