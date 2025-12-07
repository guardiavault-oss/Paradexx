#!/usr/bin/env python3
"""
Fiat on-ramp endpoints.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.dependencies import get_authenticated_user
from app.api.error_handlers import handle_endpoint_errors
from app.core.provider_clients import get_fiat_quotes
from app.core.utils import format_response, get_utc_timestamp

router = APIRouter(prefix="/api/fiat", tags=["fiat-onramp"])


class FiatQuoteRequest(BaseModel):
    fiat_currency: str = Field(..., description="Fiat currency code, e.g. USD")
    amount: float = Field(..., gt=0, description="Fiat amount to spend")
    token_symbol: str = Field(..., description="Token being purchased (e.g. ETH)")


@router.get("/providers")
@handle_endpoint_errors("get fiat providers")
async def list_providers():
    """Return the static list of supported fiat providers."""
    data = [
        {
            "provider": name,
            "url": url,
            "supported_payment_methods": ["card", "bank_transfer", "apple_pay"],
            "supports_recurring": False,
        }
        for name, url in [
            ("MoonPay", "https://buy.moonpay.com"),
            ("Ramp", "https://buy.ramp.network"),
            ("Transak", "https://global.transak.com"),
            ("Coinbase Pay", "https://pay.coinbase.com"),
        ]
    ]
    return format_response(success=True, data=data, timestamp=get_utc_timestamp())


@router.post("/quote")
@handle_endpoint_errors("fiat quote")
async def quote_fiat_onramp(
    request: FiatQuoteRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Return provider comparison quotes for a fiat purchase."""
    quotes = get_fiat_quotes(
        fiat_currency=request.fiat_currency.upper(),
        amount=request.amount,
        token_symbol=request.token_symbol.upper(),
    )
    payload = {
        "fiat_currency": request.fiat_currency.upper(),
        "token_symbol": request.token_symbol.upper(),
        "amount": request.amount,
        "quotes": quotes,
    }
    return format_response(success=True, data=payload, timestamp=get_utc_timestamp())


__all__ = ["router"]

