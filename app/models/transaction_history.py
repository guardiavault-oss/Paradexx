#!/usr/bin/env python3
"""
Transaction History Models
Comprehensive transaction tracking and management
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from datetime import datetime
from enum import Enum
from decimal import Decimal


class TransactionType(str, Enum):
    """Transaction type enumeration"""
    SEND = "send"
    RECEIVE = "receive"
    SWAP = "swap"
    BRIDGE = "bridge"
    STAKE = "stake"
    UNSTAKE = "unstake"
    CLAIM = "claim"
    APPROVE = "approve"
    CONTRACT_INTERACTION = "contract_interaction"
    VAULT_CHECKIN = "vault_checkin"
    VAULT_DEPOSIT = "vault_deposit"
    GUARDIAN_ATTESTATION = "guardian_attestation"
    BENEFICIARY_CLAIM = "beneficiary_claim"
    OTHER = "other"


class TransactionStatus(str, Enum):
    """Transaction status enumeration"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    FAILED = "failed"
    DROPPED = "dropped"
    REPLACED = "replaced"
    CANCELLED = "cancelled"


class TransactionPriority(str, Enum):
    """Transaction priority"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


@dataclass
class GasInfo:
    """Gas information"""
    gas_limit: int
    gas_price: int
    gas_used: Optional[int] = None
    base_fee: Optional[int] = None
    priority_fee: Optional[int] = None
    max_fee_per_gas: Optional[int] = None
    max_priority_fee_per_gas: Optional[int] = None
    total_cost: Optional[float] = None
    total_cost_usd: Optional[float] = None


@dataclass
class Transaction:
    """Transaction information"""
    tx_id: str
    tx_hash: str
    user_id: str
    wallet_id: str

    # Transaction details
    type: TransactionType
    status: TransactionStatus

    # Addresses
    from_address: str
    to_address: str

    # Amounts
    amount: Decimal
    asset: str
    asset_symbol: str

    # Optional / defaulted fields
    priority: TransactionPriority = TransactionPriority.MEDIUM
    contract_address: Optional[str] = None
    amount_usd: Optional[float] = None
    asset_decimals: int = 18

    # Network
    chain: str = "ethereum"
    chain_id: int = 1

    # Blockchain details
    block_number: Optional[int] = None
    block_hash: Optional[str] = None
    block_timestamp: Optional[datetime] = None
    confirmations: int = 0
    required_confirmations: int = 12

    # Gas information
    gas: GasInfo = field(default_factory=lambda: GasInfo(gas_limit=21000, gas_price=0))

    # Transaction data
    data: Optional[str] = None
    nonce: Optional[int] = None

    # Status tracking
    created_at: datetime = field(default_factory=datetime.utcnow)
    sent_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None

    # Failure information
    failure_reason: Optional[str] = None
    revert_reason: Optional[str] = None

    # User annotations
    note: Optional[str] = None
    tags: List[str] = field(default_factory=list)

    # Related transactions
    related_tx_ids: List[str] = field(default_factory=list)
    replaces_tx_id: Optional[str] = None
    replaced_by_tx_id: Optional[str] = None

    # Security
    risk_score: Optional[float] = None
    mev_protected: bool = False
    security_flags: List[str] = field(default_factory=list)

    # Bridge specific
    bridge_id: Optional[str] = None
    bridge_status: Optional[str] = None
    source_chain: Optional[str] = None
    destination_chain: Optional[str] = None
    bridge_tx_hash: Optional[str] = None

    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def is_pending(self) -> bool:
        """Check if transaction is pending"""
        return self.status == TransactionStatus.PENDING
    
    def is_confirmed(self) -> bool:
        """Check if transaction is confirmed"""
        return self.status == TransactionStatus.CONFIRMED and self.confirmations >= self.required_confirmations
    
    def can_speed_up(self) -> bool:
        """Check if transaction can be sped up"""
        return (
            self.is_pending() and
            self.gas.max_fee_per_gas is not None and
            self.sent_at is not None and
            (datetime.utcnow() - self.sent_at).total_seconds() > 300  # 5 minutes
        )
    
    def can_cancel(self) -> bool:
        """Check if transaction can be cancelled"""
        return (
            self.is_pending() and
            self.nonce is not None
        )


@dataclass
class TransactionFilter:
    """Transaction filter criteria"""
    user_id: str
    wallet_ids: Optional[List[str]] = None
    types: Optional[List[TransactionType]] = None
    statuses: Optional[List[TransactionStatus]] = None
    assets: Optional[List[str]] = None
    chains: Optional[List[str]] = None
    
    # Amount filters
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    min_amount_usd: Optional[float] = None
    max_amount_usd: Optional[float] = None
    
    # Date filters
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    
    # Search
    search_query: Optional[str] = None  # Search in note, addresses, tx hash
    
    # Tags
    tags: Optional[List[str]] = None
    
    # Pagination
    limit: int = 50
    offset: int = 0
    
    # Sorting
    sort_by: str = "created_at"
    sort_order: str = "desc"  # "asc" or "desc"
    
    # Security filters
    min_risk_score: Optional[float] = None
    max_risk_score: Optional[float] = None
    mev_protected_only: Optional[bool] = None


@dataclass
class TransactionStatistics:
    """Transaction statistics"""
    total_count: int
    total_sent: Decimal
    total_received: Decimal
    total_sent_usd: float
    total_received_usd: float
    net_change_usd: float
    
    # By type
    by_type: Dict[str, int] = field(default_factory=dict)
    
    # By status
    pending_count: int = 0
    confirmed_count: int = 0
    failed_count: int = 0
    
    # By asset
    by_asset: Dict[str, Decimal] = field(default_factory=dict)
    
    # By chain
    by_chain: Dict[str, int] = field(default_factory=dict)
    
    # Time periods
    today_count: int = 0
    this_week_count: int = 0
    this_month_count: int = 0
    this_year_count: int = 0
    
    # Gas statistics
    total_gas_paid: float = 0.0
    total_gas_paid_usd: float = 0.0
    average_gas_price: float = 0.0
    
    # Date range
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

