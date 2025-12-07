"""Transaction-related data models."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, validator


class TransactionStatus(str, Enum):
    """Transaction status indicators."""

    PENDING = "pending"
    CONFIRMED = "confirmed"
    FAILED = "failed"
    REVERTED = "reverted"
    UNKNOWN = "unknown"


class TransactionType(str, Enum):
    """Types of cross-chain transactions."""

    BRIDGE_DEPOSIT = "bridge_deposit"
    BRIDGE_WITHDRAWAL = "bridge_withdrawal"
    TOKEN_SWAP = "token_swap"
    LIQUIDITY_PROVISION = "liquidity_provision"
    GOVERNANCE_VOTE = "governance_vote"
    STAKING = "staking"
    UNSTAKING = "unstaking"
    REGULAR = "regular"


class CrossChainTransaction(BaseModel):
    """Cross-chain transaction model."""

    transaction_hash: str = Field(..., description="Transaction hash")
    source_network: str = Field(..., description="Source blockchain network")
    target_network: str = Field(..., description="Target blockchain network")
    from_address: str = Field(..., description="Sender address")
    to_address: str = Field(..., description="Recipient address")
    amount: float = Field(..., description="Transaction amount")
    token_address: str | None = Field(None, description="Token contract address")
    token_symbol: str | None = Field(None, description="Token symbol")
    transaction_type: TransactionType = Field(..., description="Type of transaction")
    status: TransactionStatus = Field(..., description="Transaction status")
    gas_used: int | None = Field(None, description="Gas used")
    gas_price: float | None = Field(None, description="Gas price in Gwei")
    block_number: int | None = Field(None, description="Block number")
    timestamp: datetime = Field(..., description="Transaction timestamp")

    # Cross-chain specific fields
    bridge_address: str | None = Field(None, description="Bridge contract address")
    cross_chain_tx_hash: str | None = Field(None, description="Cross-chain transaction hash")
    confirmation_blocks: int | None = Field(None, description="Required confirmation blocks")
    finality_time: datetime | None = Field(None, description="Expected finality time")

    # Validation fields
    is_validated: bool = Field(default=False, description="Whether transaction is validated")
    validation_timestamp: datetime | None = Field(None, description="Validation timestamp")
    validation_errors: list[str] = Field(default_factory=list, description="Validation errors")

    @validator("transaction_hash")
    def validate_tx_hash(cls, v):
        if not v.startswith("0x") or len(v) != 66:
            raise ValueError("Invalid transaction hash format")
        return v.lower()

    @validator("from_address", "to_address")
    def validate_address(cls, v):
        if not v.startswith("0x") or len(v) != 42:
            raise ValueError("Invalid address format")
        return v.lower()


class TransactionValidation(BaseModel):
    """Transaction validation results."""

    transaction_hash: str = Field(..., description="Transaction hash")
    source_network: str = Field(..., description="Source network")
    target_network: str = Field(..., description="Target network")
    is_valid: bool = Field(..., description="Whether transaction is valid")
    validation_timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Validation details
    amount_matches: bool = Field(..., description="Whether amount matches expected")
    recipient_matches: bool = Field(..., description="Whether recipient matches expected")
    finality_confirmed: bool = Field(..., description="Whether finality is confirmed")
    slippage_within_limits: bool = Field(..., description="Whether slippage is within limits")

    # Detailed results
    expected_amount: float | None = Field(None, description="Expected amount")
    actual_amount: float | None = Field(None, description="Actual amount")
    expected_recipient: str | None = Field(None, description="Expected recipient")
    actual_recipient: str | None = Field(None, description="Actual recipient")
    slippage_percentage: float | None = Field(None, description="Slippage percentage")

    # Validation errors
    validation_errors: list[str] = Field(default_factory=list, description="Validation errors")
    warnings: list[str] = Field(default_factory=list, description="Validation warnings")

    # Additional metadata
    validation_metadata: dict[str, Any] = Field(
        default_factory=dict, description="Additional validation data"
    )
