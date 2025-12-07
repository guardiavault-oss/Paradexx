#!/usr/bin/env python3
"""
Enhanced API endpoints for GuardianX with Moralis integration
Demonstrates the full autonomous DeFi intelligence layer
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

import structlog
from app.core.local_ml_model import get_local_ai_agent, TransactionIntent
from app.core.enhanced_memory import get_enhanced_memory_graph
from app.core.moralis_integration import get_moralis_api

logger = structlog.get_logger(__name__)

# Create router for enhanced API endpoints
enhanced_router = APIRouter(prefix="/api/v2/guardian", tags=["Guardian Intelligence"])


class WalletAnalysisRequest(BaseModel):
    """Request model for wallet analysis"""
    wallet_address: str = Field(..., description="Wallet address to analyze")
    network: str = Field(default="ethereum", description="Blockchain network")
    include_portfolio: bool = Field(default=True, description="Include portfolio data")
    include_behavior: bool = Field(default=True, description="Include behavioral analysis")
    analysis_depth_days: int = Field(default=30, description="Days of history to analyze")


class TransactionPreviewRequest(BaseModel):
    """Request model for transaction preview with Guardian intelligence"""
    wallet_address: str = Field(..., description="Wallet address")
    to_address: Optional[str] = Field(None, description="Destination address")
    value: int = Field(default=0, description="Transaction value in wei")
    data: str = Field(default="0x", description="Transaction data")
    network: str = Field(default="ethereum", description="Blockchain network")
    contracts: List[str] = Field(default_factory=list, description="Contract addresses")
    tokens: List[str] = Field(default_factory=list, description="Token addresses")
    route: Optional[str] = Field(None, description="DEX route")
    slippage: Optional[float] = Field(None, description="Slippage tolerance")


class GuardianModeRequest(BaseModel):
    """Request model for Guardian Mode configuration"""
    wallet_address: str = Field(..., description="Wallet address")
    network: str = Field(default="ethereum", description="Blockchain network") 
    enable_mev_protection: bool = Field(default=True, description="Enable MEV protection")
    risk_tolerance: float = Field(default=0.5, description="Risk tolerance (0-1)")
    auto_execution: bool = Field(default=False, description="Enable auto-execution")


@enhanced_router.post("/analyze-wallet")
async def analyze_wallet_intelligence(
    request: WalletAnalysisRequest
) -> Dict[str, Any]:
    """
    Get comprehensive wallet intelligence analysis using Moralis data
    
    This endpoint demonstrates the full autonomous DeFi intelligence layer:
    - On-chain portfolio analysis via Moralis
    - Behavioral pattern recognition
    - Risk scoring and trust metrics
    - AI-powered recommendations
    """
    try:
        logger.info(
            "Analyzing wallet with enhanced intelligence",
            wallet=request.wallet_address,
            network=request.network
        )
        
        # Get AI agent
        ai_agent = get_local_ai_agent()
        
        # Get comprehensive wallet intelligence
        intelligence_summary = await ai_agent.get_wallet_intelligence_summary(
            request.wallet_address,
            request.network
        )
        
        # Get enhanced memory graph for additional insights
        enhanced_memory = get_enhanced_memory_graph()
        
        # Get recommendations
        recommendations = await enhanced_memory.get_wallet_recommendations(
            request.wallet_address,
            request.network
        )
        
        # Build comprehensive response
        response = {
            "wallet_address": request.wallet_address,
            "network": request.network,
            "analysis_timestamp": intelligence_summary["last_updated"],
            "intelligence_scores": intelligence_summary["intelligence_scores"],
            "portfolio_analysis": intelligence_summary.get("portfolio_summary", {}),
            "behavioral_insights": intelligence_summary.get("behavioral_insights", {}),
            "ai_recommendations": recommendations,
            "guardian_capabilities": {
                "mev_protection": True,
                "contract_analysis": True,
                "behavior_learning": True,
                "auto_execution": True,
                "zk_attestations": True
            }
        }
        
        # Add Moralis-specific insights if requested
        if request.include_portfolio:
            try:
                moralis_api = get_moralis_api()
                
                # Get token balances
                token_balances = await moralis_api.get_wallet_token_balances(
                    request.wallet_address,
                    request.network
                )
                
                # Get native balance
                native_balance = await moralis_api.get_native_balance(
                    request.wallet_address,
                    request.network
                )
                
                response["moralis_data"] = {
                    "native_balance": native_balance,
                    "token_count": len(token_balances),
                    "verified_tokens": sum(1 for t in token_balances if t.verified_contract),
                    "unverified_tokens": sum(1 for t in token_balances if not t.verified_contract)
                }
                
            except Exception as e:
                logger.warning("Failed to fetch additional Moralis data", error=str(e))
                response["moralis_data"] = {"error": "Unable to fetch additional data"}
        
        # Add behavioral analysis if requested
        if request.include_behavior:
            try:
                moralis_api = get_moralis_api()
                behavior_analysis = await moralis_api.analyze_wallet_behavior(
                    request.wallet_address,
                    request.network,
                    request.analysis_depth_days
                )
                
                response["behavioral_analysis"] = {
                    "transaction_patterns": behavior_analysis.get("transaction_patterns", {}),
                    "value_patterns": behavior_analysis.get("value_patterns", {}),
                    "counterparty_analysis": behavior_analysis.get("counterparty_analysis", {}),
                    "risk_indicators": behavior_analysis.get("risk_indicators", [])
                }
                
            except Exception as e:
                logger.warning("Failed to fetch behavioral analysis", error=str(e))
                response["behavioral_analysis"] = {"error": "Unable to analyze behavior"}
        
        logger.info(
            "Wallet intelligence analysis completed",
            wallet=request.wallet_address,
            risk_score=intelligence_summary["intelligence_scores"].get("risk_score", 0)
        )
        
        return response
        
    except Exception as e:
        logger.error(
            "Failed to analyze wallet intelligence",
            wallet=request.wallet_address,
            error=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze wallet: {str(e)}"
        )


@enhanced_router.post("/preview-transaction")
async def preview_transaction_with_guardian(
    request: TransactionPreviewRequest
) -> Dict[str, Any]:
    """
    Preview transaction with full Guardian intelligence
    
    Combines:
    - MEV risk analysis
    - Smart contract security scanning
    - Behavioral analysis using Moralis data
    - AI-powered recommendations
    - Gas optimization suggestions
    """
    try:
        logger.info(
            "Previewing transaction with Guardian intelligence",
            wallet=request.wallet_address,
            to_address=request.to_address,
            value=request.value
        )
        
        # Create transaction intent
        intent = TransactionIntent(
            wallet_address=request.wallet_address,
            network=request.network,
            to_address=request.to_address,
            value=request.value,
            data=request.data,
            contracts=request.contracts,
            tokens=request.tokens,
            route=request.route,
            slippage=request.slippage
        )
        
        # Get AI agent analysis
        ai_agent = get_local_ai_agent()
        recommendation = await ai_agent.analyze_transaction_intent(intent)
        
        # Get enhanced wallet profile for context
        enhanced_memory = get_enhanced_memory_graph()
        enhanced_profile = await enhanced_memory.get_enhanced_wallet_profile(
            request.wallet_address,
            request.network
        )
        
        # Build comprehensive preview response
        response = {
            "transaction_preview": {
                "from": request.wallet_address,
                "to": request.to_address,
                "value": request.value,
                "network": request.network
            },
            "guardian_analysis": {
                "risk_score": recommendation.risk_score,
                "risk_level": recommendation.risk_level,
                "recommendation": recommendation.recommendation,
                "explanation": recommendation.explanation,
                "factors": recommendation.factors
            },
            "optimization_suggestions": {
                "suggested_route": recommendation.suggested_route,
                "suggested_slippage": recommendation.suggested_slippage,
                "use_private_relayer": recommendation.use_private_relayer,
                "guardian_mode_enabled": True
            },
            "wallet_context": {
                "risk_score": enhanced_profile.risk_score,
                "trust_score": enhanced_profile.trust_score,
                "activity_score": enhanced_profile.activity_score,
                "recent_risk_indicators": enhanced_profile.risk_indicators[:3]
            },
            "security_features": {
                "mev_protection": recommendation.use_private_relayer,
                "contract_analysis": len(request.contracts) > 0,
                "behavioral_analysis": enhanced_profile.guardian_profile is not None,
                "attestation_available": True
            }
        }
        
        logger.info(
            "Transaction preview completed",
            wallet=request.wallet_address,
            risk_score=recommendation.risk_score,
            recommendation=recommendation.recommendation
        )
        
        return response
        
    except Exception as e:
        logger.error(
            "Failed to preview transaction",
            wallet=request.wallet_address,
            error=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to preview transaction: {str(e)}"
        )


@enhanced_router.post("/configure-guardian-mode")
async def configure_guardian_mode(
    request: GuardianModeRequest
) -> Dict[str, Any]:
    """
    Configure Guardian Mode with AI-powered settings
    
    Automatically configures protection settings based on:
    - Wallet behavior analysis
    - Risk tolerance
    - Portfolio composition
    - Historical patterns
    """
    try:
        logger.info(
            "Configuring Guardian Mode",
            wallet=request.wallet_address,
            risk_tolerance=request.risk_tolerance
        )
        
        # Get enhanced profile for personalized configuration
        enhanced_memory = get_enhanced_memory_graph()
        enhanced_profile = await enhanced_memory.get_enhanced_wallet_profile(
            request.wallet_address,
            request.network
        )
        
        # AI-powered configuration based on profile
        config = {
            "wallet_address": request.wallet_address,
            "network": request.network,
            "guardian_mode_enabled": True,
            "protection_settings": {},
            "auto_execution_rules": [],
            "personalized_thresholds": {}
        }
        
        # Configure protection settings based on wallet profile
        if enhanced_profile.risk_score > 0.7:
            # High-risk wallet - maximum protection
            config["protection_settings"] = {
                "mev_protection": True,
                "contract_analysis": "strict",
                "transaction_simulation": True,
                "approval_limits": "strict",
                "gas_optimization": True
            }
        elif enhanced_profile.trust_score > 0.8:
            # High-trust wallet - balanced protection
            config["protection_settings"] = {
                "mev_protection": request.enable_mev_protection,
                "contract_analysis": "standard", 
                "transaction_simulation": True,
                "approval_limits": "standard",
                "gas_optimization": True
            }
        else:
            # Default protection
            config["protection_settings"] = {
                "mev_protection": request.enable_mev_protection,
                "contract_analysis": "standard",
                "transaction_simulation": False,
                "approval_limits": "relaxed",
                "gas_optimization": True
            }
        
        # Configure auto-execution rules if enabled
        if request.auto_execution:
            config["auto_execution_rules"] = [
                {
                    "rule": "auto_claim_rewards",
                    "enabled": enhanced_profile.activity_score > 0.6,
                    "conditions": {
                        "min_reward_value": 0.01,  # ETH
                        "gas_threshold": 50  # gwei
                    }
                },
                {
                    "rule": "auto_rebalance_portfolio",
                    "enabled": enhanced_profile.diversity_score > 0.7,
                    "conditions": {
                        "rebalance_threshold": 0.15,  # 15%
                        "min_portfolio_value": 1.0  # ETH
                    }
                }
            ]
        
        # Set personalized thresholds
        config["personalized_thresholds"] = {
            "risk_score_threshold": max(0.3, 1.0 - request.risk_tolerance),
            "large_transaction_threshold": enhanced_profile.guardian_profile.typical_amounts[-1] * 3 if enhanced_profile.guardian_profile and enhanced_profile.guardian_profile.typical_amounts else 1.0,
            "approval_amount_limit": 1000.0,  # USD equivalent
            "daily_transaction_limit": 10
        }
        
        # Add AI recommendations for optimization
        config["ai_recommendations"] = [
            f"Based on your {enhanced_profile.activity_score:.1%} activity score, we recommend {'enabling' if enhanced_profile.activity_score > 0.5 else 'keeping disabled'} auto-execution",
            f"Your risk score of {enhanced_profile.risk_score:.1%} suggests {'maximum' if enhanced_profile.risk_score > 0.7 else 'standard'} protection settings",
            f"Portfolio diversity of {enhanced_profile.diversity_score:.1%} indicates {'good' if enhanced_profile.diversity_score > 0.6 else 'concentrated'} risk distribution"
        ]
        
        logger.info(
            "Guardian Mode configured successfully",
            wallet=request.wallet_address,
            protection_level="high" if enhanced_profile.risk_score > 0.7 else "standard"
        )
        
        return config
        
    except Exception as e:
        logger.error(
            "Failed to configure Guardian Mode",
            wallet=request.wallet_address,
            error=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to configure Guardian Mode: {str(e)}"
        )


@enhanced_router.get("/wallet/{wallet_address}/portfolio")
async def get_wallet_portfolio(
    wallet_address: str,
    network: str = "ethereum"
) -> Dict[str, Any]:
    """
    Get comprehensive wallet portfolio using Moralis data
    """
    try:
        moralis_api = get_moralis_api()
        
        # Get portfolio data
        portfolio = await moralis_api.get_wallet_portfolio(wallet_address, network)
        
        # Get behavior analysis
        behavior = await moralis_api.analyze_wallet_behavior(
            wallet_address, network, 30
        )
        
        return {
            "portfolio": {
                "address": portfolio.address,
                "network": portfolio.network,
                "native_balance": portfolio.native_balance_formatted,
                "estimated_usd_value": portfolio.usd_balance,
                "token_count": len(portfolio.token_balances),
                "nft_count": len(portfolio.nfts)
            },
            "behavioral_insights": behavior,
            "guardian_integration": {
                "ai_analysis_available": True,
                "mev_protection_compatible": True,
                "auto_execution_supported": True
            }
        }
        
    except Exception as e:
        logger.error("Failed to get portfolio", wallet=wallet_address, error=str(e))
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get portfolio: {str(e)}"
        )