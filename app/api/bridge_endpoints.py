#!/usr/bin/env python3
"""
Bridge API Endpoints for GuardianX
Provides REST API for cross-chain bridge operations
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
import structlog

# Import dependencies and helpers
from app.api.dependencies import (
    get_authenticated_user,
    require_bridge_integration
)
from app.api.error_handlers import (
    handle_endpoint_errors,
    create_validation_error
)
from app.core.utils import get_utc_timestamp, format_response
from app.api.bridge_helpers import ensure_bridge_initialized

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/bridge", tags=["bridge"])


# Request/Response Models
class BridgeAnalysisRequest(BaseModel):
    """Request model for bridge analysis"""
    bridge_address: str = Field(..., description="Bridge contract address")
    source_network: str = Field(..., description="Source blockchain network")
    target_network: str = Field(..., description="Target blockchain network")
    analysis_depth: str = Field(default="comprehensive", description="Analysis depth")


class BridgeQuoteRequest(BaseModel):
    """Request model for bridge quote"""
    from_network: str = Field(..., description="Source network")
    to_network: str = Field(..., description="Target network")
    amount: float = Field(..., ge=0, description="Amount to bridge")
    asset: str = Field(default="ETH", description="Asset symbol")


class BridgeExecuteRequest(BaseModel):
    """Request model for executing bridge"""
    from_network: str = Field(..., description="Source network")
    to_network: str = Field(..., description="Target network")
    amount: float = Field(..., ge=0, description="Amount to bridge")
    recipient: str = Field(..., description="Recipient address")
    asset: str = Field(default="ETH", description="Asset symbol")
    bridge_address: Optional[str] = Field(None, description="Specific bridge to use")


class TransactionValidationRequest(BaseModel):
    """Request model for transaction validation"""
    tx_hash: str = Field(..., description="Transaction hash")
    network: str = Field(..., description="Network")
    bridge_address: Optional[str] = Field(None, description="Bridge address")


class LiquidityCheckRequest(BaseModel):
    """Request model for liquidity check"""
    network: str = Field(..., description="Network")
    token: str = Field(..., description="Token symbol or address")
    amount: str = Field(..., description="Amount to check")


class BridgeRecoveryRequest(BaseModel):
    """Request model for bridge recovery"""
    action: str = Field(..., description="Recovery action: retry, cancel, or refund")


# Endpoints
@router.get("/networks")
@handle_endpoint_errors("get supported networks")
async def get_supported_networks(
    bridge_integration=Depends(require_bridge_integration)
):
    """Get list of supported networks"""
    networks = await bridge_integration.get_supported_networks()
    
    return format_response(
        success=True,
        data={
            "networks": networks,
            "count": len(networks)
        },
        timestamp=get_utc_timestamp()
    )


@router.get("/network/{network}/status")
@handle_endpoint_errors("get network status")
async def get_network_status(
    network: str,
    bridge_integration=Depends(require_bridge_integration)
):
    """Get network status and health"""
    status = await bridge_integration.get_network_status(network)
    
    return format_response(
        success=True,
        data={"status": status},
        timestamp=get_utc_timestamp()
    )


@router.post("/analyze")
@handle_endpoint_errors("analyze bridge")
async def analyze_bridge(
    request: BridgeAnalysisRequest,
    user=Depends(get_authenticated_user),
    bridge_integration=Depends(require_bridge_integration)
):
    """Analyze a cross-chain bridge for security"""
    # Ensure initialized
    await ensure_bridge_initialized(bridge_integration)
    
    analysis = await bridge_integration.analyze_bridge(
        bridge_address=request.bridge_address,
        source_network=request.source_network,
        target_network=request.target_network,
        analysis_depth=request.analysis_depth
    )
    
    return format_response(
        success=True,
        data={"analysis": analysis},
        timestamp=get_utc_timestamp()
    )


@router.post("/quote")
@handle_endpoint_errors("get bridge quote")
async def get_bridge_quote(
    request: BridgeQuoteRequest,
    user=Depends(get_authenticated_user),
    bridge_integration=Depends(require_bridge_integration)
):
    """Get a quote for bridging assets"""
    # Ensure initialized
    await ensure_bridge_initialized(bridge_integration)
    
    quote = await bridge_integration.get_bridge_quote(
        from_network=request.from_network,
        to_network=request.to_network,
        amount=request.amount,
        asset=request.asset
    )
    
    return format_response(
        success=True,
        data={"quote": quote},
        timestamp=get_utc_timestamp()
    )


@router.post("/execute")
@handle_endpoint_errors("execute bridge")
async def execute_bridge(
    request: BridgeExecuteRequest,
    user=Depends(get_authenticated_user),
    bridge_integration=Depends(require_bridge_integration)
):
    """Execute a cross-chain bridge transaction"""
    # Ensure initialized
    await ensure_bridge_initialized(bridge_integration)
    
    result = await bridge_integration.execute_bridge(
        from_network=request.from_network,
        to_network=request.to_network,
        amount=request.amount,
        recipient=request.recipient,
        asset=request.asset,
        bridge_address=request.bridge_address
    )
    
    if not result.get("success"):
        raise create_validation_error(result.get("error", "Bridge execution failed"))
    
    return format_response(
        success=True,
        data={"result": result},
        timestamp=get_utc_timestamp()
    )


@router.post("/validate")
@handle_endpoint_errors("validate transaction")
async def validate_transaction(
    request: TransactionValidationRequest,
    user=Depends(get_authenticated_user),
    bridge_integration=Depends(require_bridge_integration)
):
    """Validate a cross-chain bridge transaction"""
    # Ensure initialized
    await ensure_bridge_initialized(bridge_integration)
    
    validation = await bridge_integration.validate_bridge_transaction(
        tx_hash=request.tx_hash,
        network=request.network,
        bridge_address=request.bridge_address
    )
    
    return format_response(
        success=True,
        data={"validation": validation},
        timestamp=get_utc_timestamp()
    )


@router.post("/security-check")
@handle_endpoint_errors("check bridge security")
async def check_bridge_security(
    bridge_address: str,
    network: str,
    user=Depends(get_authenticated_user),
    bridge_integration=Depends(require_bridge_integration)
):
    """Check bridge security status"""
    # Ensure initialized
    await ensure_bridge_initialized(bridge_integration)
    
    security = await bridge_integration.check_bridge_security(
        bridge_address=bridge_address,
        network=network
    )
    
    return format_response(
        success=True,
        data={"security": security},
        timestamp=get_utc_timestamp()
    )


@router.get("/status/{transaction_id}")
@handle_endpoint_errors("get bridge status")
async def get_bridge_status(
    transaction_id: str,
    user=Depends(get_authenticated_user),
    bridge_integration=Depends(require_bridge_integration)
):
    """Get bridge transaction status"""
    await ensure_bridge_initialized(bridge_integration)
    
    status = await bridge_integration.get_bridge_status(transaction_id)
    
    return format_response(
        success=True,
        data={"status": status},
        timestamp=get_utc_timestamp()
    )


@router.get("/history")
@handle_endpoint_errors("get bridge history")
async def get_bridge_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None),
    from_network: Optional[str] = Query(None),
    to_network: Optional[str] = Query(None),
    asset: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    user=Depends(get_authenticated_user),
    bridge_integration=Depends(require_bridge_integration)
):
    """Get bridge transaction history with filters"""
    await ensure_bridge_initialized(bridge_integration)
    
    history = await bridge_integration.get_bridge_history(
        user_id=user.get("id") or user.get("address"),
        limit=limit,
        offset=offset,
        status=status,
        from_network=from_network,
        to_network=to_network,
        asset=asset,
        start_date=start_date,
        end_date=end_date
    )
    
    return format_response(
        success=True,
        data=history,
        timestamp=get_utc_timestamp()
    )


@router.get("/analytics")
@handle_endpoint_errors("get bridge analytics")
async def get_bridge_analytics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    network: Optional[str] = Query(None),
    user=Depends(get_authenticated_user),
    bridge_integration=Depends(require_bridge_integration)
):
    """Get bridge analytics and statistics"""
    await ensure_bridge_initialized(bridge_integration)
    
    analytics = await bridge_integration.get_bridge_analytics(
        user_id=user.get("id") or user.get("address"),
        start_date=start_date,
        end_date=end_date,
        network=network
    )
    
    return format_response(
        success=True,
        data={"analytics": analytics},
        timestamp=get_utc_timestamp()
    )


@router.post("/{transaction_id}/recover")
@handle_endpoint_errors("recover bridge transaction")
async def recover_bridge_transaction(
    transaction_id: str,
    request: BridgeRecoveryRequest,
    user=Depends(get_authenticated_user),
    bridge_integration=Depends(require_bridge_integration)
):
    """Recover a failed bridge transaction"""
    await ensure_bridge_initialized(bridge_integration)
    
    result = await bridge_integration.recover_bridge_transaction(
        transaction_id=transaction_id,
        action=request.action
    )
    
    return format_response(
        success=True,
        data={"result": result},
        timestamp=get_utc_timestamp()
    )


@router.post("/liquidity/check")
@handle_endpoint_errors("check liquidity")
async def check_liquidity(
    request: LiquidityCheckRequest,
    user=Depends(get_authenticated_user),
    bridge_integration=Depends(require_bridge_integration)
):
    """Check liquidity availability for bridge"""
    await ensure_bridge_initialized(bridge_integration)
    
    liquidity = await bridge_integration.check_liquidity(
        network=request.network,
        token=request.token,
        amount=request.amount
    )
    
    return format_response(
        success=True,
        data={"liquidity": liquidity},
        timestamp=get_utc_timestamp()
    )


@router.get("/fee")
@handle_endpoint_errors("estimate bridge fee")
async def estimate_bridge_fee(
    from_network: str = Query(..., description="Source network"),
    to_network: str = Query(..., description="Target network"),
    asset: str = Query(..., description="Asset symbol"),
    amount: float = Query(..., ge=0, description="Amount"),
    user=Depends(get_authenticated_user),
    bridge_integration=Depends(require_bridge_integration)
):
    """Estimate bridge fee"""
    await ensure_bridge_initialized(bridge_integration)
    
    fee_info = await bridge_integration.estimate_fee(
        from_network=from_network,
        to_network=to_network,
        asset=asset,
        amount=amount
    )
    
    return format_response(
        success=True,
        data=fee_info,
        timestamp=get_utc_timestamp()
    )


@router.get("/network/{network}/tokens")
@handle_endpoint_errors("get supported tokens")
async def get_supported_tokens(
    network: str,
    bridge_integration=Depends(require_bridge_integration)
):
    """Get supported tokens for a network"""
    await ensure_bridge_initialized(bridge_integration)
    
    tokens = await bridge_integration.get_supported_tokens(network)
    
    return format_response(
        success=True,
        data={"tokens": tokens, "network": network},
        timestamp=get_utc_timestamp()
    )


@router.post("/{transaction_id}/cancel")
@handle_endpoint_errors("cancel bridge transaction")
async def cancel_bridge_transaction(
    transaction_id: str,
    user=Depends(get_authenticated_user),
    bridge_integration=Depends(require_bridge_integration)
):
    """Cancel a pending bridge transaction"""
    await ensure_bridge_initialized(bridge_integration)
    
    result = await bridge_integration.cancel_bridge_transaction(transaction_id)
    
    return format_response(
        success=True,
        data={"result": result},
        timestamp=get_utc_timestamp()
    )


# Export router
__all__ = ["router"]
