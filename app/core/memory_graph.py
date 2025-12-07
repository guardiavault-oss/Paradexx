#!/usr/bin/env python3
"""
On-Chain Memory Layer for GuardianX
Privacy-preserving memory of transactions, token safety, and wallet behavior
"""

import hashlib
import json
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

import structlog

logger = structlog.get_logger(__name__)


class MemoryEventType(Enum):
    TRANSACTION_DECISION = "transaction_decision"
    TOKEN_SAFETY_UPDATE = "token_safety_update"
    CONTRACT_INTERACTION = "contract_interaction"
    RISK_SCORE_UPDATE = "risk_score_update"
    BEHAVIOR_PATTERN = "behavior_pattern"
    APPROVAL_EVENT = "approval_event"
    SWAP_EVENT = "swap_event"


class TokenSafetyLevel(Enum):
    SAFE = "safe"
    CAUTION = "caution"
    RISKY = "risky"
    UNSAFE = "unsafe"
    UNKNOWN = "unknown"


@dataclass
class TransactionDecision:
    """Record of a transaction decision"""
    wallet_address: str
    transaction_hash: str
    network: str
    risk_score: float
    decision: str  # "approved", "rejected", "rewritten", "blocked"
    outcome: Optional[str] = None  # "success", "failed", "pending"
    timestamp: float = field(default_factory=time.time)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TokenSafetyRecord:
    """Record of token safety assessment"""
    token_address: str
    network: str
    safety_level: TokenSafetyLevel
    safety_score: float  # 0.0 = unsafe, 1.0 = safe
    source: str  # "contract_analysis", "user_report", "community", "ml_model"
    timestamp: float = field(default_factory=time.time)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class WalletBehaviorProfile:
    """Behavioral profile for a wallet"""
    wallet_address: str
    network: str
    typical_amounts: deque = field(default_factory=lambda: deque(maxlen=100))
    typical_recipients: Dict[str, int] = field(default_factory=dict)
    typical_times: List[int] = field(default_factory=list)
    approval_patterns: Dict[str, float] = field(default_factory=dict)
    swap_patterns: Dict[str, Any] = field(default_factory=dict)
    risk_tolerance: float = 0.5
    last_updated: float = field(default_factory=time.time)
    transaction_count: int = 0
    total_value_sent: float = 0.0
    total_value_received: float = 0.0


class MemoryGraph:
    """
    Privacy-preserving memory layer for GuardianX
    Stores transaction history, token safety, and behavioral patterns
    """
    
    def __init__(self, storage_backend: Optional[str] = None):
        """
        Initialize memory graph
        
        Args:
            storage_backend: Storage backend type ("local", "ceramic", "lit", "oasis")
                           Currently only "local" is implemented
        """
        self.storage_backend = storage_backend or "local"
        
        # In-memory storage (Phase 1)
        self.transaction_decisions: Dict[str, List[TransactionDecision]] = defaultdict(list)
        self.token_safety_records: Dict[str, List[TokenSafetyRecord]] = defaultdict(list)
        self.wallet_profiles: Dict[str, WalletBehaviorProfile] = {}
        
        # Cross-chain wallet mapping
        self.wallet_clusters: Dict[str, List[str]] = defaultdict(list)
        
        # Initialize storage backend if specified
        self.backend_manager = None
        if storage_backend and storage_backend != "local":
            try:
                from .storage_backends import storage_backend_manager
                self.backend_manager = storage_backend_manager
                logger.info("Storage backend initialized", backend=storage_backend)
            except ImportError:
                logger.warning("Storage backends not available, using local storage")
        
        logger.info("Memory graph initialized", backend=self.storage_backend)
    
    def record_transaction_decision(
        self,
        wallet_address: str,
        transaction_hash: str,
        network: str,
        risk_score: float,
        decision: str,
        outcome: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> TransactionDecision:
        """
        Record a transaction decision
        
        Args:
            wallet_address: Wallet address
            transaction_hash: Transaction hash
            network: Network name
            risk_score: Risk score (0.0-1.0)
            decision: Decision made ("approved", "rejected", "rewritten", "blocked")
            outcome: Transaction outcome ("success", "failed", "pending")
            metadata: Additional metadata
        
        Returns:
            TransactionDecision object
        """
        decision_record = TransactionDecision(
            wallet_address=wallet_address.lower(),
            transaction_hash=transaction_hash,
            network=network,
            risk_score=risk_score,
            decision=decision,
            outcome=outcome,
            metadata=metadata or {}
        )
        
        key = f"{wallet_address.lower()}_{network}"
        self.transaction_decisions[key].append(decision_record)
        
        # Keep only last 1000 decisions per wallet
        if len(self.transaction_decisions[key]) > 1000:
            self.transaction_decisions[key] = self.transaction_decisions[key][-1000:]
        
        # Store in backend if configured (async, but we'll handle it in background)
        if self.backend_manager:
            try:
                import asyncio
                backend_key = f"decision_{key}_{decision_record.transaction_hash}"
                # Schedule async storage (non-blocking)
                try:
                    loop = asyncio.get_event_loop()
                    loop.create_task(self.backend_manager.store(backend_key, asdict(decision_record)))
                except RuntimeError:
                    # No event loop, skip backend storage
                    pass
            except Exception as e:
                logger.warning("Failed to store in backend", error=str(e))
        
        # Update wallet profile
        self._update_wallet_profile(wallet_address, network, decision_record)
        
        logger.info(
            "Transaction decision recorded",
            wallet=wallet_address,
            tx_hash=transaction_hash,
            decision=decision,
            risk_score=risk_score
        )
        
        return decision_record
    
    def record_token_safety(
        self,
        token_address: str,
        network: str,
        safety_level: TokenSafetyLevel,
        safety_score: float,
        source: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> TokenSafetyRecord:
        """
        Record token safety assessment
        
        Args:
            token_address: Token contract address
            network: Network name
            safety_level: Safety level enum
            safety_score: Safety score (0.0-1.0)
            source: Source of assessment
            metadata: Additional metadata
        
        Returns:
            TokenSafetyRecord object
        """
        record = TokenSafetyRecord(
            token_address=token_address.lower(),
            network=network,
            safety_level=safety_level,
            safety_score=safety_score,
            source=source,
            metadata=metadata or {}
        )
        
        key = f"{token_address.lower()}_{network}"
        self.token_safety_records[key].append(record)
        
        # Keep only last 100 records per token
        if len(self.token_safety_records[key]) > 100:
            self.token_safety_records[key] = self.token_safety_records[key][-100:]
        
        logger.info(
            "Token safety recorded",
            token=token_address,
            network=network,
            safety_level=safety_level.value,
            safety_score=safety_score
        )
        
        return record
    
    def get_wallet_behavior_profile(
        self,
        wallet_address: str,
        network: str
    ) -> WalletBehaviorProfile:
        """
        Get or create wallet behavior profile
        
        Args:
            wallet_address: Wallet address
            network: Network name
        
        Returns:
            WalletBehaviorProfile object
        """
        key = f"{wallet_address.lower()}_{network}"
        
        if key not in self.wallet_profiles:
            self.wallet_profiles[key] = WalletBehaviorProfile(
                wallet_address=wallet_address.lower(),
                network=network
            )
        
        return self.wallet_profiles[key]
    
    def get_token_safety_history(
        self,
        token_address: str,
        network: str,
        limit: int = 10
    ) -> List[TokenSafetyRecord]:
        """
        Get token safety history
        
        Args:
            token_address: Token contract address
            network: Network name
            limit: Maximum number of records to return
        
        Returns:
            List of TokenSafetyRecord objects
        """
        key = f"{token_address.lower()}_{network}"
        records = self.token_safety_records.get(key, [])
        
        # Sort by timestamp (newest first) and limit
        records.sort(key=lambda x: x.timestamp, reverse=True)
        return records[:limit]
    
    def get_token_safety_score(
        self,
        token_address: str,
        network: str
    ) -> Optional[float]:
        """
        Get current token safety score
        
        Args:
            token_address: Token contract address
            network: Network name
        
        Returns:
            Current safety score (0.0-1.0) or None if no records
        """
        history = self.get_token_safety_history(token_address, network, limit=1)
        if history:
            return history[0].safety_score
        return None
    
    def get_transaction_history(
        self,
        wallet_address: str,
        network: str,
        limit: int = 100
    ) -> List[TransactionDecision]:
        """
        Get transaction decision history for a wallet
        
        Args:
            wallet_address: Wallet address
            network: Network name
            limit: Maximum number of records to return
        
        Returns:
            List of TransactionDecision objects
        """
        key = f"{wallet_address.lower()}_{network}"
        decisions = self.transaction_decisions.get(key, [])
        
        # Sort by timestamp (newest first) and limit
        decisions.sort(key=lambda x: x.timestamp, reverse=True)
        return decisions[:limit]
    
    def _update_wallet_profile(
        self,
        wallet_address: str,
        network: str,
        decision: TransactionDecision
    ):
        """Update wallet behavior profile based on transaction decision"""
        profile = self.get_wallet_behavior_profile(wallet_address, network)
        
        # Extract transaction value from metadata if available
        value = decision.metadata.get("value", 0)
        if isinstance(value, str):
            try:
                value = int(value, 16) / 1e18  # Convert from hex wei to ETH
            except (ValueError, TypeError):
                value = 0
        elif isinstance(value, (int, float)):
            value = value / 1e18 if value > 1e10 else value  # Assume wei if large
        
        # Update typical amounts
        if value > 0:
            profile.typical_amounts.append(value)
            profile.total_value_sent += value
        
        # Update transaction count
        profile.transaction_count += 1
        
        # Update risk tolerance based on decisions
        if decision.decision == "approved" and decision.risk_score > 0.7:
            # User approved high-risk transaction - increase tolerance
            profile.risk_tolerance = min(1.0, profile.risk_tolerance + 0.02)
        elif decision.decision == "rejected" and decision.risk_score < 0.3:
            # User rejected low-risk transaction - decrease tolerance
            profile.risk_tolerance = max(0.0, profile.risk_tolerance - 0.02)
        
        # Update typical times
        current_hour = datetime.now().hour
        profile.typical_times.append(current_hour)
        if len(profile.typical_times) > 100:
            profile.typical_times = profile.typical_times[-100:]
        
        profile.last_updated = time.time()
    
    def link_wallet_cluster(
        self,
        wallet_addresses: List[str]
    ):
        """
        Link wallets that belong to the same user/cluster
        
        Args:
            wallet_addresses: List of wallet addresses to cluster
        """
        normalized_addresses = [addr.lower() for addr in wallet_addresses]
        
        # Find existing cluster or create new one
        cluster_id = None
        for addr in normalized_addresses:
            for existing_cluster_id, cluster_addresses in self.wallet_clusters.items():
                if addr in cluster_addresses:
                    cluster_id = existing_cluster_id
                    break
            if cluster_id:
                break
        
        if cluster_id:
            # Add to existing cluster
            for addr in normalized_addresses:
                if addr not in self.wallet_clusters[cluster_id]:
                    self.wallet_clusters[cluster_id].append(addr)
        else:
            # Create new cluster
            cluster_id = hashlib.sha256(
                "".join(sorted(normalized_addresses)).encode()
            ).hexdigest()[:16]
            self.wallet_clusters[cluster_id] = normalized_addresses
        
        logger.info(
            "Wallet cluster linked",
            cluster_id=cluster_id,
            wallet_count=len(normalized_addresses)
        )
    
    def get_wallet_cluster(
        self,
        wallet_address: str
    ) -> List[str]:
        """
        Get all wallets in the same cluster
        
        Args:
            wallet_address: Wallet address
        
        Returns:
            List of wallet addresses in the same cluster
        """
        normalized_address = wallet_address.lower()
        
        for cluster_addresses in self.wallet_clusters.values():
            if normalized_address in cluster_addresses:
                return cluster_addresses
        
        return [normalized_address]
    
    def get_behavior_insights(
        self,
        wallet_address: str,
        network: str
    ) -> Dict[str, Any]:
        """
        Get behavioral insights for a wallet
        
        Args:
            wallet_address: Wallet address
            network: Network name
        
        Returns:
            Dictionary with behavioral insights
        """
        profile = self.get_wallet_behavior_profile(wallet_address, network)
        history = self.get_transaction_history(wallet_address, network, limit=100)
        
        # Calculate statistics
        if profile.typical_amounts:
            avg_amount = sum(profile.typical_amounts) / len(profile.typical_amounts)
            max_amount = max(profile.typical_amounts)
            min_amount = min(profile.typical_amounts)
        else:
            avg_amount = max_amount = min_amount = 0.0
        
        # Most common recipients
        top_recipients = sorted(
            profile.typical_recipients.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        # Decision distribution
        decision_counts = defaultdict(int)
        for decision in history:
            decision_counts[decision.decision] += 1
        
        # Risk score distribution
        risk_scores = [d.risk_score for d in history]
        avg_risk_score = sum(risk_scores) / len(risk_scores) if risk_scores else 0.0
        
        insights = {
            "wallet_address": wallet_address,
            "network": network,
            "transaction_count": profile.transaction_count,
            "total_value_sent": profile.total_value_sent,
            "total_value_received": profile.total_value_received,
            "average_amount": avg_amount,
            "max_amount": max_amount,
            "min_amount": min_amount,
            "risk_tolerance": profile.risk_tolerance,
            "average_risk_score": avg_risk_score,
            "top_recipients": [{"address": addr, "count": count} for addr, count in top_recipients],
            "decision_distribution": dict(decision_counts),
            "last_updated": profile.last_updated
        }
        
        return insights
    
    def export_memory_data(
        self,
        wallet_address: str,
        network: str,
        format: str = "json"
    ) -> str:
        """
        Export memory data for a wallet (for privacy-preserving backup)
        
        Args:
            wallet_address: Wallet address
            network: Network name
            format: Export format ("json", "encrypted")
        
        Returns:
            Exported data as string
        """
        profile = self.get_wallet_behavior_profile(wallet_address, network)
        history = self.get_transaction_history(wallet_address, network)
        
        export_data = {
            "wallet_address": wallet_address,
            "network": network,
            "profile": asdict(profile),
            "transaction_history": [asdict(d) for d in history],
            "export_timestamp": time.time()
        }
        
        if format == "json":
            return json.dumps(export_data, indent=2, default=str)
        else:
            # For encrypted format, would use encryption here
            return json.dumps(export_data, indent=2, default=str)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get memory graph metrics"""
        total_decisions = sum(len(decisions) for decisions in self.transaction_decisions.values())
        total_token_records = sum(len(records) for records in self.token_safety_records.values())
        
        return {
            "wallets_tracked": len(self.wallet_profiles),
            "total_transaction_decisions": total_decisions,
            "total_token_safety_records": total_token_records,
            "wallet_clusters": len(self.wallet_clusters),
            "storage_backend": self.storage_backend
        }


# Global memory graph instance
memory_graph = MemoryGraph()

