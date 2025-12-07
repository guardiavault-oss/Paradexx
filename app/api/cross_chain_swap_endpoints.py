#!/usr/bin/env python3
"""
Cross-chain swap / bridge endpoints.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Any, Dict

from app.api.dependencies import get_authenticated_user
from app.api.error_handlers import handle_endpoint_errors
from app.core.provider_clients import get_cross_chain_routes
from app.core.utils import format_response, get_utc_timestamp


router = APIRouter(prefix="/api/cross-chain", tags=["cross-chain"])


class CrossChainRouteRequest(BaseModel):
    source_chain: str = Field(..., description="Chain the assets currently live on")
    destination_chain: str = Field(..., description="Chain to receive assets on")
    from_token: str = Field(..., description="Source token symbol")
    to_token: str = Field(..., description="Destination token symbol")
    amount_in: float = Field(..., gt=0, description="Amount to bridge")


@router.post("/routes")
@handle_endpoint_errors("cross chain route")
async def cross_chain_routes(
    request: CrossChainRouteRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Return bridge candidates across Socket, LI.FI, ThorChain, Wormhole."""
    routes = get_cross_chain_routes(
        source_chain=request.source_chain,
        destination_chain=request.destination_chain,
        from_token=request.from_token.upper(),
        to_token=request.to_token.upper(),
        amount_in=request.amount_in,
    )
    return format_response(
        success=True,
        data={
            "source_chain": request.source_chain,
            "destination_chain": request.destination_chain,
            "from_token": request.from_token.upper(),
            "to_token": request.to_token.upper(),
            "amount_in": request.amount_in,
            "routes": routes,
        },
        timestamp=get_utc_timestamp(),
    )


__all__ = ["router"]

