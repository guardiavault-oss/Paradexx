#!/usr/bin/env python3
"""
DEX aggregator endpoints.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Any, Dict

from app.api.dependencies import get_authenticated_user
from app.api.error_handlers import handle_endpoint_errors
from app.core.provider_clients import get_dex_routes
from app.core.utils import format_response, get_utc_timestamp


router = APIRouter(prefix="/api/swaps", tags=["dex-aggregator"])


class DexQuoteRequest(BaseModel):
    from_token: str = Field(..., description="Input token symbol")
    to_token: str = Field(..., description="Output token symbol")
    amount_in: float = Field(..., gt=0, description="Input amount")
    slippage_percent: float = Field(1.0, ge=0.1, le=5.0, description="Slippage tolerance")


@router.post("/aggregators")
@handle_endpoint_errors("dex aggregator quote")
async def get_dex_quotes(
    request: DexQuoteRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Return unified swap quotes across 1inch, Paraswap, MetaMask Swaps."""
    routes = get_dex_routes(
        from_token=request.from_token.upper(),
        to_token=request.to_token.upper(),
        amount_in=request.amount_in,
        slippage_percent=request.slippage_percent,
    )
    return format_response(
        success=True,
        data={
            "from_token": request.from_token.upper(),
            "to_token": request.to_token.upper(),
            "amount_in": request.amount_in,
            "slippage_percent": request.slippage_percent,
            "routes": routes,
        },
        timestamp=get_utc_timestamp(),
    )


__all__ = ["router"]

