#!/usr/bin/env python3
"""
MEV Protection API Endpoints
Provides API for MEV protection features and mempool defense
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import structlog

# Import core modules
try:
    from app.core.mempool_defense import get_mempool_defense, MempoolDefense
    from app.core.private_relayer import get_private_relayer
except ImportError as e:
    print(f"Warning: Could not import MEV protection modules: {e}")
    get_mempool_defense = None
    get_private_relayer = None
    MempoolDefense = None

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/mev", tags=["mev"])


# Request/Response Models
class RouteTransactionRequest(BaseModel):
    """Request model for routing transaction through MEV protection"""
    transaction: Dict[str, Any] = Field(..., description="Transaction dictionary")
    chain_id: int = Field(1, description="Chain ID")
    protection_level: str = Field("high", description="Protection level: low, medium, high, maximum")


class MEVProtectionStatus(BaseModel):
    """Response model for MEV protection status"""
    enabled: bool
    active_relayers: int
    default_relayer: Optional[str] = None
    protection_level: str
    available_relayers: list[str]
    relayer_stats: Dict[str, Any]


class MEVStats(BaseModel):
    """Response model for MEV protection statistics"""
    total_transactions_protected: int
    mev_attacks_blocked: int
    savings_estimate_usd: float
    average_protection_level: float
    relayer_performance: Dict[str, Any]


@router.post("/route", response_model=Dict[str, Any])
async def route_transaction_mev(request: RouteTransactionRequest):
    """
    Route transaction through MEV protection (private mempool)
    
    This endpoint routes transactions through private relayers like Flashbots
    to protect against front-running and sandwich attacks.
    """
    try:
        if not get_mempool_defense:
            raise HTTPException(
                status_code=503,
                detail="MEV protection service unavailable. Please ensure mempool defense is configured."
            )
        
        mempool = get_mempool_defense()
        
        if not mempool.enabled:
            raise HTTPException(
                status_code=503,
                detail="MEV protection is currently disabled"
            )
        
        result = await mempool.route_transaction(
            transaction=request.transaction,
            chain_id=request.chain_id,
            protection_level=request.protection_level
        )
        
        return {
            "success": result.success,
            "transaction_hash": result.transaction_hash,
            "relayer_used": result.relayer_used,
            "route_type": result.route_type,
            "protection_level": result.protection_level,
            "estimated_blocks": result.estimated_blocks,
            "cost_premium": result.cost_premium,
            "metadata": result.metadata,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error routing transaction through MEV protection: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"MEV routing failed: {str(e)}"
        )


@router.get("/status", response_model=MEVProtectionStatus)
async def get_mev_protection_status():
    """Get MEV protection service status"""
    try:
        if not get_mempool_defense:
            return MEVProtectionStatus(
                enabled=False,
                active_relayers=0,
                protection_level="disabled",
                available_relayers=[],
                relayer_stats={}
            )
        
        mempool = get_mempool_defense()
        
        # Get active relayers
        active_relayers = [
            relayer.relayer_id
            for relayer in mempool.relayers.values()
            if relayer.enabled
        ]
        
        # Get relayer stats
        relayer_stats = {}
        for relayer_id, relayer in mempool.relayers.items():
            relayer_stats[relayer_id] = {
                "enabled": relayer.enabled,
                "type": relayer.relayer_type.value if hasattr(relayer.relayer_type, 'value') else str(relayer.relayer_type),
                "priority": relayer.priority,
                "success_rate": relayer.success_rate,
                "max_gas_multiplier": relayer.max_gas_price_multiplier
            }
        
        return MEVProtectionStatus(
            enabled=mempool.enabled,
            active_relayers=len(active_relayers),
            default_relayer=mempool.default_relayer,
            protection_level="high",  # Default protection level
            available_relayers=active_relayers,
            relayer_stats=relayer_stats
        )
        
    except Exception as e:
        logger.error(f"Error getting MEV protection status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get MEV protection status: {str(e)}"
        )


@router.get("/stats", response_model=MEVStats)
async def get_mev_protection_stats():
    """Get MEV protection statistics"""
    try:
        if not get_mempool_defense:
            return MEVStats(
                total_transactions_protected=0,
                mev_attacks_blocked=0,
                savings_estimate_usd=0.0,
                average_protection_level=0.0,
                relayer_performance={}
            )
        
        mempool = get_mempool_defense()
        
        # Calculate statistics (mock for now - would be tracked in production)
        # In production, these would be stored in database
        total_protected = 0
        attacks_blocked = 0
        savings_estimate = 0.0
        
        # Get relayer performance
        relayer_performance = {}
        for relayer_id, relayer in mempool.relayers.items():
            if relayer.enabled:
                relayer_performance[relayer_id] = {
                    "success_rate": relayer.success_rate,
                    "avg_blocks_to_confirm": 1,  # Mock
                    "total_routes": 0  # Mock
                }
        
        return MEVStats(
            total_transactions_protected=total_protected,
            mev_attacks_blocked=attacks_blocked,
            savings_estimate_usd=savings_estimate,
            average_protection_level=0.85,  # Mock average
            relayer_performance=relayer_performance
        )
        
    except Exception as e:
        logger.error(f"Error getting MEV protection stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get MEV protection stats: {str(e)}"
        )


@router.post("/toggle")
async def toggle_mev_protection(enabled: bool = True):
    """Toggle MEV protection on/off"""
    try:
        if not get_mempool_defense:
            raise HTTPException(
                status_code=503,
                detail="MEV protection service unavailable"
            )
        
        mempool = get_mempool_defense()
        mempool.enabled = enabled
        
        return {
            "success": True,
            "enabled": enabled,
            "message": f"MEV protection {'enabled' if enabled else 'disabled'}",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error toggling MEV protection: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to toggle MEV protection: {str(e)}"
        )


