#!/usr/bin/env python3
"""
Cross-Chain Manager for GuardianX
Unified interface for multi-chain operations
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import structlog

from .blockchain import blockchain_manager
from .memory_graph import memory_graph
from .attestations import attestation_engine

logger = structlog.get_logger(__name__)


@dataclass
class CrossChainProfile:
    """Cross-chain wallet profile"""
    wallet_address: str
    networks: List[str]
    total_balance: Dict[str, float]  # network -> balance
    total_value_usd: float
    transaction_count: Dict[str, int]
    risk_scores: Dict[str, float]
    safety_scores: Dict[str, float]


class CrossChainManager:
    """Manager for cross-chain operations"""
    
    def __init__(self):
        self.supported_networks = [
            "ethereum", "polygon", "bsc", "arbitrum", "optimism",
            "avalanche", "base", "zksync"
        ]
    
    async def get_cross_chain_profile(
        self,
        wallet_address: str,
        networks: Optional[List[str]] = None
    ) -> CrossChainProfile:
        """
        Get unified cross-chain profile for a wallet
        
        Args:
            wallet_address: Wallet address
            networks: Optional list of networks (defaults to all supported)
        
        Returns:
            CrossChainProfile
        """
        networks = networks or self.supported_networks
        
        total_balance = {}
        transaction_count = {}
        risk_scores = {}
        safety_scores = {}
        total_value_usd = 0.0
        
        for network in networks:
            try:
                # Get balance
                provider = blockchain_manager.get_provider(network)
                if provider:
                    balance = await provider.get_balance(wallet_address)
                    balance_eth = balance / 1e18
                    total_balance[network] = balance_eth
                    
                    # Get transaction history
                    history = memory_graph.get_transaction_history(wallet_address, network, limit=100)
                    transaction_count[network] = len(history)
                    
                    # Calculate average risk score
                    if history:
                        avg_risk = sum(d.risk_score for d in history) / len(history)
                        risk_scores[network] = avg_risk
                    else:
                        risk_scores[network] = 0.5
                    
                    # Get safety score
                    safety = attestation_engine.get_wallet_safety_score(wallet_address, network)
                    safety_scores[network] = safety.get("safety_score", 0.5)
                    
                    # Estimate USD value (simplified - would use price feeds)
                    total_value_usd += balance_eth * 2000  # Placeholder price
                    
            except Exception as e:
                logger.warning("Error getting network data", network=network, error=str(e))
        
        return CrossChainProfile(
            wallet_address=wallet_address,
            networks=networks,
            total_balance=total_balance,
            total_value_usd=total_value_usd,
            transaction_count=transaction_count,
            risk_scores=risk_scores,
            safety_scores=safety_scores
        )
    
    async def get_cross_chain_insights(
        self,
        wallet_address: str
    ) -> Dict[str, Any]:
        """
        Get cross-chain behavioral insights
        
        Args:
            wallet_address: Wallet address
        
        Returns:
            Dictionary with cross-chain insights
        """
        profile = await self.get_cross_chain_profile(wallet_address)
        
        # Aggregate insights across chains
        total_transactions = sum(profile.transaction_count.values())
        avg_risk_score = sum(profile.risk_scores.values()) / len(profile.risk_scores) if profile.risk_scores else 0.5
        avg_safety_score = sum(profile.safety_scores.values()) / len(profile.safety_scores) if profile.safety_scores else 0.5
        
        # Most active network
        most_active_network = max(
            profile.transaction_count.items(),
            key=lambda x: x[1]
        )[0] if profile.transaction_count else None
        
        # Highest risk network
        highest_risk_network = max(
            profile.risk_scores.items(),
            key=lambda x: x[1]
        )[0] if profile.risk_scores else None
        
        return {
            "wallet_address": wallet_address,
            "total_networks": len(profile.networks),
            "total_balance_usd": profile.total_value_usd,
            "total_transactions": total_transactions,
            "average_risk_score": avg_risk_score,
            "average_safety_score": avg_safety_score,
            "most_active_network": most_active_network,
            "highest_risk_network": highest_risk_network,
            "network_balances": profile.total_balance,
            "network_risk_scores": profile.risk_scores,
            "network_safety_scores": profile.safety_scores
        }
    
    async def sync_wallet_across_chains(
        self,
        wallet_address: str,
        networks: Optional[List[str]] = None
    ):
        """
        Sync wallet data across multiple chains
        
        Args:
            wallet_address: Wallet address
            networks: Optional list of networks
        """
        networks = networks or self.supported_networks
        
        for network in networks:
            try:
                # Get wallet profile
                profile = memory_graph.get_wallet_behavior_profile(wallet_address, network)
                
                # Get attestations
                attestations = attestation_engine.get_wallet_attestations(wallet_address, network)
                
                logger.info(
                    "Wallet synced",
                    wallet=wallet_address,
                    network=network,
                    transaction_count=profile.transaction_count,
                    attestation_count=len(attestations)
                )
                
            except Exception as e:
                logger.warning("Error syncing network", network=network, error=str(e))


# Global cross-chain manager instance
cross_chain_manager = CrossChainManager()

