#!/usr/bin/env python3
"""
Error Handling API Endpoints
Error states, network status, maintenance mode
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
import structlog

# Import core modules
from app.core.error_handler import ErrorType, ErrorSeverity

# Import dependencies and helpers
from app.api.dependencies import (
    get_authenticated_user,
    require_error_handler
)
from app.api.error_handlers import (
    handle_endpoint_errors,
    create_validation_error
)
from app.core.utils import get_utc_timestamp, format_response

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/errors", tags=["errors"])


# Request Models
class ValidateAddressRequest(BaseModel):
    """Validate address request"""
    address: str = Field(..., description="Address to validate")
    chain: str = Field(default="ethereum", description="Blockchain chain")


class EstimateGasRequest(BaseModel):
    """Estimate gas request"""
    from_address: str
    to_address: str
    value: Optional[str] = None
    data: Optional[str] = None
    chain: str = "ethereum"


# Endpoints
@router.get("/network-status")
@handle_endpoint_errors("get network status")
async def get_network_status(
    error_handler=Depends(require_error_handler)
):
    """Get network operational status"""
    networks = ["ethereum", "polygon", "arbitrum", "optimism", "base"]
    status = {}
    
    for network in networks:
        operational = await error_handler.check_network_status(network)
        status[network] = {
            "operational": operational,
            "fallback_nodes": await error_handler.get_rpc_fallback(network)
        }
    
    return format_response(
        success=True,
        data={"networks": status},
        timestamp=get_utc_timestamp()
    )


@router.post("/validate-address")
@handle_endpoint_errors("validate address")
async def validate_address(
    request: ValidateAddressRequest,
    error_handler=Depends(require_error_handler)
):
    """Validate blockchain address format"""
    valid, message = await error_handler.validate_address(request.address, request.chain)
    
    return format_response(
        success=True,
        data={
            "valid": valid,
            "message": message if not valid else "Address is valid",
            "address": request.address,
            "chain": request.chain
        },
        timestamp=get_utc_timestamp()
    )


@router.post("/estimate-gas")
@handle_endpoint_errors("estimate gas")
async def estimate_gas(
    request: EstimateGasRequest,
    user=Depends(get_authenticated_user),
    error_handler=Depends(require_error_handler)
):
    """Estimate gas for transaction"""
    transaction = {
        "from": request.from_address,
        "to": request.to_address,
        "value": request.value,
        "data": request.data
    }
    
    estimate = await error_handler.estimate_gas(transaction, request.chain)
    
    return format_response(
        success=True,
        data={"estimate": estimate},
        timestamp=get_utc_timestamp()
    )


@router.get("/maintenance-mode")
@handle_endpoint_errors("get maintenance mode")
async def get_maintenance_mode(
    error_handler=Depends(require_error_handler)
):
    """Check if maintenance mode is active"""
    maintenance = await error_handler.check_maintenance_mode()
    
    return format_response(
        success=True,
        data={
            "maintenance_mode": maintenance,
            "message": "Service is under maintenance" if maintenance else "Service is operational"
        },
        timestamp=get_utc_timestamp()
    )


# Export router
__all__ = ["router"]

