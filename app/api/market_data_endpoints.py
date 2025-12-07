#!/usr/bin/env python3
"""
Market data + Pendle integration endpoints.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.dependencies import get_authenticated_user
from app.api.error_handlers import handle_endpoint_errors
from app.core.provider_clients import (
    call_pendle_hosted_sdk,
    get_pendle_markets,
    get_pendle_positions,
    get_token_prices,
)
from app.core.utils import format_response, get_utc_timestamp

router = APIRouter(prefix="/api/market", tags=["market-data"])


class TokenPriceRequest(BaseModel):
    tokens: List[str] = Field(
        default_factory=lambda: ["ETH", "USDC", "WBTC"],
        description="Token symbols to fetch (uppercase).",
    )


class PendlePositionRequest(BaseModel):
    address: str = Field(..., description="Wallet address to inspect")


class PendleHostedSdkRequest(BaseModel):
    action: str = Field(..., description="Hosted SDK endpoint, e.g. swap/preview")
    payload: Dict[str, Any] = Field(..., description="JSON payload forwarded to Pendle Hosted SDK")


@router.post("/prices")
@handle_endpoint_errors("token prices")
async def token_prices(
    request: TokenPriceRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Return Moralis-backed token prices (falls back to mock)."""
    data = get_token_prices(request.tokens)
    return format_response(success=True, data=data, timestamp=get_utc_timestamp())


@router.get("/pendle/markets")
@handle_endpoint_errors("pendle markets")
async def pendle_markets(
    chain_id: Optional[int] = None,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Return Pendle market stats."""
    data = get_pendle_markets(chain_id=chain_id)
    return format_response(success=True, data=data, timestamp=get_utc_timestamp())


@router.post("/pendle/positions")
@handle_endpoint_errors("pendle positions")
async def pendle_positions(
    request: PendlePositionRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Return user Pendle positions."""
    data = get_pendle_positions(address=request.address)
    return format_response(success=True, data=data, timestamp=get_utc_timestamp())


@router.post("/pendle/hosted-sdk")
@handle_endpoint_errors("pendle hosted sdk")
async def pendle_hosted_sdk(
    request: PendleHostedSdkRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Proxy requests to Pendle Hosted SDK."""
    data = call_pendle_hosted_sdk(action=request.action, payload=request.payload)
    return format_response(success=True, data=data, timestamp=get_utc_timestamp())


__all__ = ["router"]

