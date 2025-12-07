#!/usr/bin/env python3
"""
Enhanced Memory Graph Integration with Moralis
Combines GuardianX memory graph with rich Moralis on-chain data
"""

import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

import structlog
from app.core.memory_graph import (
    MemoryGraph, 
    WalletBehaviorProfile, 
    TokenSafetyRecord,
    TokenSafetyLevel
)
from app.core.moralis_integration import get_moralis_api, WalletProfile

logger = structlog.get_logger(__name__)


@dataclass
class EnhancedWalletProfile:
    """Enhanced wallet profile combining GuardianX and Moralis data"""
    # Basic wallet info
    address: str
    network: str
    
    # Moralis portfolio data
    moralis_profile: Optional[WalletProfile] = None
    
    # GuardianX behavioral data
    guardian_profile: Optional[WalletBehaviorProfile] = None
    
    # Enhanced analytics
    risk_score: float = 0.5
    trust_score: float = 0.5
    activity_score: float = 0.5
    diversity_score: float = 0.5
    
    # Behavioral insights
    transaction_patterns: Dict[str, Any] = field(default_factory=dict)
    token_preferences: Dict[str, float] = field(default_factory=dict)
    interaction_networks: Dict[str, int] = field(default_factory=dict)
    
    # Risk indicators
    risk_indicators: List[str] = field(default_factory=list)
    safety_flags: List[str] = field(default_factory=list)
    
    # Temporal data
    last_updated: float = field(default_factory=time.time)
    analysis_depth_days: int = 30


class EnhancedMemoryGraph:
    """
    Enhanced memory graph that integrates Moralis on-chain data
    with GuardianX's privacy-preserving behavioral analysis
    """
    
    def __init__(self, storage_backend: Optional[str] = None):
        """Initialize enhanced memory graph"""
        self.memory_graph = MemoryGraph(storage_backend)
        self.moralis_api = get_moralis_api()
        
        # Enhanced profile cache
        self.enhanced_profiles: Dict[str, EnhancedWalletProfile] = {}
        self.profile_cache_ttl = 3600  # 1 hour cache
        
        logger.info("Enhanced memory graph initialized")
    
    async def get_enhanced_wallet_profile(
        self,
        wallet_address: str,
        network: str = "ethereum",
        force_refresh: bool = False
    ) -> EnhancedWalletProfile:
        """
        Get comprehensive wallet profile combining all data sources
        
        Args:
            wallet_address: Wallet address to analyze
            network: Blockchain network
            force_refresh: Force refresh of cached data
            
        Returns:
            Enhanced wallet profile with all available data
        """
        cache_key = f"{wallet_address}_{network}"
        
        # Check cache first
        if not force_refresh and cache_key in self.enhanced_profiles:
            profile = self.enhanced_profiles[cache_key]
            if time.time() - profile.last_updated < self.profile_cache_ttl:
                logger.debug("Returning cached enhanced profile", 
                           address=wallet_address)
                return profile
        
        logger.info("Building enhanced wallet profile", 
                   address=wallet_address, network=network)
        
        # Get GuardianX behavioral profile
        guardian_profile = self.memory_graph.get_wallet_behavior_profile(
            wallet_address, network
        )
        
        # Get Moralis portfolio data
        moralis_profile = None
        try:
            moralis_profile = await self.moralis_api.get_wallet_portfolio(
                wallet_address, network
            )
            logger.debug("Retrieved Moralis portfolio data", 
                        tokens=len(moralis_profile.token_balances))
        except Exception as e:
            logger.warning("Failed to get Moralis portfolio data", 
                         error=str(e))
        
        # Get Moralis behavioral analysis
        moralis_behavior = None
        try:
            moralis_behavior = await self.moralis_api.analyze_wallet_behavior(
                wallet_address, network, days=30
            )
            logger.debug("Retrieved Moralis behavioral analysis",
                        transactions=moralis_behavior.get("total_transactions", 0))
        except Exception as e:
            logger.warning("Failed to get Moralis behavioral analysis",
                         error=str(e))
        
        # Build enhanced profile
        enhanced_profile = EnhancedWalletProfile(
            address=wallet_address,
            network=network,
            moralis_profile=moralis_profile,
            guardian_profile=guardian_profile
        )
        
        # Calculate enhanced metrics
        await self._calculate_enhanced_metrics(
            enhanced_profile, moralis_behavior
        )
        
        # Cache the profile
        self.enhanced_profiles[cache_key] = enhanced_profile
        
        logger.info("Enhanced wallet profile created",
                   address=wallet_address,
                   risk_score=enhanced_profile.risk_score,
                   trust_score=enhanced_profile.trust_score)
        
        return enhanced_profile
    
    async def _calculate_enhanced_metrics(
        self,
        profile: EnhancedWalletProfile,
        moralis_behavior: Optional[Dict[str, Any]]
    ):
        """Calculate enhanced risk and trust metrics"""
        
        # Initialize scores
        risk_components = []
        trust_components = []
        activity_components = []
        diversity_components = []
        
        # === MORALIS DATA ANALYSIS ===
        if profile.moralis_profile:
            moralis = profile.moralis_profile
            
            # Portfolio diversity analysis
            token_count = len(moralis.token_balances)
            if token_count == 0:
                diversity_components.append(0.2)  # Low diversity
            elif token_count < 5:
                diversity_components.append(0.4)
            elif token_count < 15:
                diversity_components.append(0.7)
            else:
                diversity_components.append(0.9)  # High diversity
            
            # Balance concentration analysis
            if moralis.token_balances:
                total_balance = sum(
                    float(token.balance_formatted) 
                    for token in moralis.token_balances
                    if token.balance_formatted != "0"
                )
                
                if total_balance > 0:
                    # Calculate concentration (Gini coefficient approximation)
                    balances = [
                        float(token.balance_formatted) 
                        for token in moralis.token_balances
                        if token.balance_formatted != "0"
                    ]
                    balances.sort()
                    
                    concentration = self._calculate_concentration(balances)
                    diversity_components.append(1.0 - concentration)
            
            # Transaction frequency (if available)
            if moralis.transaction_count > 0:
                if moralis.transaction_count < 10:
                    activity_components.append(0.3)  # Low activity
                elif moralis.transaction_count < 100:
                    activity_components.append(0.6)
                elif moralis.transaction_count < 1000:
                    activity_components.append(0.8)
                else:
                    activity_components.append(0.9)  # High activity
        
        # === MORALIS BEHAVIORAL ANALYSIS ===
        if moralis_behavior:
            behavior = moralis_behavior
            
            # Transaction patterns analysis
            tx_count = behavior.get("total_transactions", 0)
            if tx_count > 0:
                activity_components.append(min(1.0, tx_count / 100))
            
            # Value patterns analysis
            value_patterns = behavior.get("value_patterns", {})
            if value_patterns:
                avg_value = value_patterns.get("average_value", 0)
                std_dev = value_patterns.get("std_deviation", 0)
                
                # High standard deviation might indicate irregular patterns
                if avg_value > 0:
                    cv = std_dev / avg_value  # Coefficient of variation
                    if cv > 2.0:  # Very irregular
                        risk_components.append(0.3)
                    elif cv > 1.0:  # Somewhat irregular
                        risk_components.append(0.1)
                    else:  # Regular patterns
                        trust_components.append(0.2)
            
            # Counterparty analysis
            counterparty_analysis = behavior.get("counterparty_analysis", {})
            top_recipients = counterparty_analysis.get("top_recipients", {})
            
            if top_recipients:
                # Many unique counterparties = higher trust
                unique_recipients = len(top_recipients)
                if unique_recipients > 20:
                    trust_components.append(0.3)
                elif unique_recipients > 10:
                    trust_components.append(0.2)
                elif unique_recipients < 3:
                    risk_components.append(0.2)  # Very concentrated interactions
            
            # Risk indicators from Moralis
            risk_indicators = behavior.get("risk_indicators", [])
            profile.risk_indicators.extend(risk_indicators)
            
            # Add risk based on indicators
            risk_from_indicators = min(0.5, len(risk_indicators) * 0.1)
            if risk_from_indicators > 0:
                risk_components.append(risk_from_indicators)
        
        # === GUARDIAN BEHAVIORAL ANALYSIS ===
        if profile.guardian_profile:
            guardian = profile.guardian_profile
            
            # Risk tolerance analysis
            if guardian.risk_tolerance < 0.3:
                trust_components.append(0.3)  # Conservative user
            elif guardian.risk_tolerance > 0.8:
                risk_components.append(0.2)  # High risk tolerance
            
            # Transaction count and patterns
            if guardian.transaction_count > 100:
                trust_components.append(0.2)  # Experienced user
                activity_components.append(0.3)
            
            # Approval patterns analysis
            if len(guardian.approval_patterns) > 10:
                risk_components.append(0.1)  # Many approvals = higher risk
            
            # Typical amounts consistency
            if len(guardian.typical_amounts) > 10:
                import numpy as np
                amounts_array = list(guardian.typical_amounts)
                cv = np.std(amounts_array) / (np.mean(amounts_array) + 1e-8)
                if cv < 0.5:  # Consistent amounts
                    trust_components.append(0.2)
                elif cv > 2.0:  # Very inconsistent
                    risk_components.append(0.1)
        
        # === TOKEN SAFETY ANALYSIS ===
        # Check token safety records for this wallet's tokens
        if profile.moralis_profile and profile.moralis_profile.token_balances:
            unsafe_tokens = 0
            safe_tokens = 0
            
            for token in profile.moralis_profile.token_balances:
                safety_records = self.memory_graph.get_token_safety_history(
                    token.token_address, profile.network
                )
                
                if safety_records:
                    latest_record = safety_records[-1]  # Most recent
                    if latest_record.safety_level in [
                        TokenSafetyLevel.UNSAFE, 
                        TokenSafetyLevel.RISKY
                    ]:
                        unsafe_tokens += 1
                        profile.safety_flags.append(
                            f"Holds risky token: {token.symbol}"
                        )
                    elif latest_record.safety_level == TokenSafetyLevel.SAFE:
                        safe_tokens += 1
            
            # Adjust trust based on token safety
            if unsafe_tokens > 0:
                risk_components.append(min(0.4, unsafe_tokens * 0.1))
            if safe_tokens > 3:
                trust_components.append(0.2)
        
        # === CALCULATE FINAL SCORES ===
        
        # Risk Score (0.0 = low risk, 1.0 = high risk)
        base_risk = 0.5
        risk_adjustment = sum(risk_components)
        trust_adjustment = sum(trust_components)
        profile.risk_score = max(0.0, min(1.0, 
                                        base_risk + risk_adjustment - trust_adjustment))
        
        # Trust Score (0.0 = low trust, 1.0 = high trust)
        profile.trust_score = 1.0 - profile.risk_score
        
        # Activity Score
        profile.activity_score = min(1.0, sum(activity_components))
        
        # Diversity Score
        if diversity_components:
            profile.diversity_score = sum(diversity_components) / len(diversity_components)
        
        logger.debug("Enhanced metrics calculated",
                    address=profile.address,
                    risk=profile.risk_score,
                    trust=profile.trust_score,
                    activity=profile.activity_score,
                    diversity=profile.diversity_score)
    
    def _calculate_concentration(self, values: List[float]) -> float:
        """Calculate concentration index (simplified Gini coefficient)"""
        if len(values) <= 1:
            return 1.0
        
        values = sorted(values)
        n = len(values)
        total = sum(values)
        
        if total == 0:
            return 1.0
        
        # Calculate Gini coefficient
        cumsum = 0
        gini_sum = 0
        
        for i, value in enumerate(values):
            cumsum += value
            gini_sum += (2 * (i + 1) - n - 1) * value
        
        gini = gini_sum / (n * total)
        return max(0.0, min(1.0, gini))
    
    async def get_wallet_recommendations(
        self,
        wallet_address: str,
        network: str = "ethereum"
    ) -> Dict[str, Any]:
        """
        Generate AI-powered recommendations for wallet optimization
        
        Args:
            wallet_address: Wallet address
            network: Blockchain network
            
        Returns:
            Dictionary of recommendations and insights
        """
        profile = await self.get_enhanced_wallet_profile(
            wallet_address, network
        )
        
        recommendations = {
            "address": wallet_address,
            "network": network,
            "overall_score": {
                "risk": profile.risk_score,
                "trust": profile.trust_score,
                "activity": profile.activity_score,
                "diversity": profile.diversity_score
            },
            "security_recommendations": [],
            "optimization_recommendations": [],
            "risk_warnings": [],
            "insights": []
        }
        
        # Security recommendations based on risk score
        if profile.risk_score > 0.7:
            recommendations["security_recommendations"].extend([
                "Enable Guardian Mode for enhanced protection",
                "Review and revoke unnecessary token approvals",
                "Consider using a hardware wallet for high-value transactions"
            ])
            recommendations["risk_warnings"].extend(profile.risk_indicators)
        
        # Diversity recommendations
        if profile.diversity_score < 0.4:
            recommendations["optimization_recommendations"].append(
                "Consider diversifying token holdings to reduce concentration risk"
            )
        
        # Activity insights
        if profile.activity_score < 0.3:
            recommendations["insights"].append(
                "Low activity detected - consider this when setting security parameters"
            )
        elif profile.activity_score > 0.8:
            recommendations["insights"].append(
                "High activity detected - automated protections may be beneficial"
            )
        
        # Token safety warnings
        if profile.safety_flags:
            recommendations["risk_warnings"].extend(profile.safety_flags[:3])
        
        return recommendations
    
    # Delegate all other MemoryGraph methods
    def record_transaction_decision(self, *args, **kwargs):
        """Record transaction decision in base memory graph"""
        return self.memory_graph.record_transaction_decision(*args, **kwargs)
    
    def record_token_safety(self, *args, **kwargs):
        """Record token safety in base memory graph"""
        return self.memory_graph.record_token_safety(*args, **kwargs)
    
    def get_wallet_behavior_profile(self, *args, **kwargs):
        """Get behavior profile from base memory graph"""
        return self.memory_graph.get_wallet_behavior_profile(*args, **kwargs)
    
    def update_wallet_behavior(self, *args, **kwargs):
        """Update behavior in base memory graph"""
        return self.memory_graph.update_wallet_behavior(*args, **kwargs)


# Global instance
_enhanced_memory_graph: Optional[EnhancedMemoryGraph] = None


def get_enhanced_memory_graph() -> EnhancedMemoryGraph:
    """Get or create global enhanced memory graph instance"""
    global _enhanced_memory_graph
    if _enhanced_memory_graph is None:
        _enhanced_memory_graph = EnhancedMemoryGraph()
    return _enhanced_memory_graph