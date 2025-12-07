#!/usr/bin/env python3
"""
Transaction History API Endpoints
Transaction search, filters, and export
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime
import structlog

# Import core modules
from app.models.transaction_history import (
    TransactionFilter, TransactionType, TransactionStatus
)

# Import dependencies and helpers
from app.api.dependencies import (
    get_authenticated_user,
    require_transaction_history_manager
)
from app.api.error_handlers import (
    handle_endpoint_errors,
    create_not_found_error,
    create_validation_error,
    create_forbidden_error
)
from app.core.utils import get_utc_timestamp, format_response

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/transactions", tags=["transactions"])


# Request Models
class TransactionNoteRequest(BaseModel):
    """Add note to transaction"""
    note: str = Field(..., description="Transaction note")


class TransactionTagRequest(BaseModel):
    """Add tag to transaction"""
    tag: str = Field(..., description="Transaction tag")


class TransactionExportRequest(BaseModel):
    """Export transactions request"""
    format: str = Field(default="csv", description="Export format: csv, json")
    wallet_ids: Optional[List[str]] = None
    types: Optional[List[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


# Endpoints
@router.get("/")
@handle_endpoint_errors("get transactions")
async def get_transactions(
    wallet_ids: Optional[str] = Query(None, description="Comma-separated wallet IDs"),
    types: Optional[str] = Query(None, description="Comma-separated transaction types"),
    statuses: Optional[str] = Query(None, description="Comma-separated statuses"),
    assets: Optional[str] = Query(None, description="Comma-separated assets"),
    chains: Optional[str] = Query(None, description="Comma-separated chains"),
    search: Optional[str] = Query(None, description="Search query"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    user=Depends(get_authenticated_user),
    history_manager=Depends(require_transaction_history_manager)
):
    """Get transactions with filters"""
    # Parse filters
    filter_criteria = TransactionFilter(
        user_id=user["id"],
        wallet_ids=wallet_ids.split(",") if wallet_ids else None,
        types=[TransactionType(t) for t in types.split(",")] if types else None,
        statuses=[TransactionStatus(s) for s in statuses.split(",")] if statuses else None,
        assets=assets.split(",") if assets else None,
        chains=chains.split(",") if chains else None,
        search_query=search,
        start_date=datetime.fromisoformat(start_date) if start_date else None,
        end_date=datetime.fromisoformat(end_date) if end_date else None,
        limit=limit,
        offset=offset,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    transactions = await history_manager.get_transactions(filter_criteria)
    
    return format_response(
        success=True,
        data={
            "transactions": [
                {
                    "tx_id": tx.tx_id,
                    "tx_hash": tx.tx_hash,
                    "type": tx.type.value,
                    "status": tx.status.value,
                    "from_address": tx.from_address,
                    "to_address": tx.to_address,
                    "amount": str(tx.amount),
                    "amount_usd": tx.amount_usd,
                    "asset": tx.asset_symbol,
                    "chain": tx.chain,
                    "created_at": tx.created_at.isoformat(),
                    "confirmed_at": tx.confirmed_at.isoformat() if tx.confirmed_at else None,
                    "block_number": tx.block_number,
                    "confirmations": tx.confirmations,
                    "gas_cost_usd": tx.gas.total_cost_usd,
                    "note": tx.note,
                    "tags": tx.tags,
                    "risk_score": tx.risk_score,
                    "mev_protected": tx.mev_protected
                }
                for tx in transactions
            ],
            "count": len(transactions),
            "limit": limit,
            "offset": offset
        },
        timestamp=get_utc_timestamp()
    )


@router.get("/{tx_id}")
@handle_endpoint_errors("get transaction details")
async def get_transaction_details(
    tx_id: str,
    user=Depends(get_authenticated_user),
    history_manager=Depends(require_transaction_history_manager)
):
    """Get detailed transaction information"""
    tx = await history_manager.get_transaction(tx_id)
    
    if not tx or tx.user_id != user["id"]:
        raise create_not_found_error("Transaction", tx_id)
    
    return format_response(
        success=True,
        data={
            "transaction": {
                "tx_id": tx.tx_id,
                "tx_hash": tx.tx_hash,
                "type": tx.type.value,
                "status": tx.status.value,
                "priority": tx.priority.value,
                "from_address": tx.from_address,
                "to_address": tx.to_address,
                "contract_address": tx.contract_address,
                "amount": str(tx.amount),
                "amount_usd": tx.amount_usd,
                "asset": tx.asset_symbol,
                "chain": tx.chain,
                "chain_id": tx.chain_id,
                "block_number": tx.block_number,
                "block_hash": tx.block_hash,
                "block_timestamp": tx.block_timestamp.isoformat() if tx.block_timestamp else None,
                "confirmations": tx.confirmations,
                "required_confirmations": tx.required_confirmations,
                "gas": {
                    "gas_limit": tx.gas.gas_limit,
                    "gas_used": tx.gas.gas_used,
                    "gas_price": tx.gas.gas_price,
                    "total_cost_usd": tx.gas.total_cost_usd
                },
                "data": tx.data,
                "nonce": tx.nonce,
                "created_at": tx.created_at.isoformat(),
                "confirmed_at": tx.confirmed_at.isoformat() if tx.confirmed_at else None,
                "failed_at": tx.failed_at.isoformat() if tx.failed_at else None,
                "failure_reason": tx.failure_reason,
                "revert_reason": tx.revert_reason,
                "note": tx.note,
                "tags": tx.tags,
                "risk_score": tx.risk_score,
                "mev_protected": tx.mev_protected,
                "security_flags": tx.security_flags,
                "can_speed_up": tx.can_speed_up(),
                "can_cancel": tx.can_cancel(),
                "explorer_url": f"https://etherscan.io/tx/{tx.tx_hash}" if tx.chain == "ethereum" else None
            }
        },
        timestamp=get_utc_timestamp()
    )


@router.get("/stats/summary")
@handle_endpoint_errors("get transaction statistics")
async def get_transaction_statistics(
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    user=Depends(get_authenticated_user),
    history_manager=Depends(require_transaction_history_manager)
):
    """Get transaction statistics"""
    stats = await history_manager.get_statistics(
        user_id=user["id"],
        start_date=datetime.fromisoformat(start_date) if start_date else None,
        end_date=datetime.fromisoformat(end_date) if end_date else None
    )
    
    return format_response(
        success=True,
        data={
            "statistics": {
                "total_count": stats.total_count,
                "total_sent": str(stats.total_sent),
                "total_received": str(stats.total_received),
                "total_sent_usd": stats.total_sent_usd,
                "total_received_usd": stats.total_received_usd,
                "net_change_usd": stats.net_change_usd,
                "by_type": stats.by_type,
                "pending_count": stats.pending_count,
                "confirmed_count": stats.confirmed_count,
                "failed_count": stats.failed_count,
                "by_asset": {k: str(v) for k, v in stats.by_asset.items()},
                "by_chain": stats.by_chain,
                "today_count": stats.today_count,
                "this_week_count": stats.this_week_count,
                "this_month_count": stats.this_month_count,
                "this_year_count": stats.this_year_count,
                "total_gas_paid_usd": stats.total_gas_paid_usd,
                "average_gas_price": stats.average_gas_price
            }
        },
        timestamp=get_utc_timestamp()
    )


@router.post("/{tx_id}/note")
@handle_endpoint_errors("add transaction note")
async def add_transaction_note(
    tx_id: str,
    request: TransactionNoteRequest,
    user=Depends(get_authenticated_user),
    history_manager=Depends(require_transaction_history_manager)
):
    """Add note to transaction"""
    tx = await history_manager.add_note(tx_id, request.note)
    
    if tx.user_id != user["id"]:
        raise create_forbidden_error("Not authorized")
    
    return format_response(
        success=True,
        data={
            "transaction": {
                "tx_id": tx.tx_id,
                "note": tx.note
            }
        },
        timestamp=get_utc_timestamp()
    )


@router.post("/{tx_id}/tag")
@handle_endpoint_errors("add transaction tag")
async def add_transaction_tag(
    tx_id: str,
    request: TransactionTagRequest,
    user=Depends(get_authenticated_user),
    history_manager=Depends(require_transaction_history_manager)
):
    """Add tag to transaction"""
    tx = await history_manager.add_tag(tx_id, request.tag)
    
    if tx.user_id != user["id"]:
        raise create_forbidden_error("Not authorized")
    
    return format_response(
        success=True,
        data={
            "transaction": {
                "tx_id": tx.tx_id,
                "tags": tx.tags
            }
        },
        timestamp=get_utc_timestamp()
    )


@router.post("/export")
@handle_endpoint_errors("export transactions")
async def export_transactions(
    request: TransactionExportRequest,
    user=Depends(get_authenticated_user),
    history_manager=Depends(require_transaction_history_manager)
):
    """Export transactions"""
    filter_criteria = TransactionFilter(
        user_id=user["id"],
        wallet_ids=request.wallet_ids,
        types=[TransactionType(t) for t in request.types] if request.types else None,
        start_date=datetime.fromisoformat(request.start_date) if request.start_date else None,
        end_date=datetime.fromisoformat(request.end_date) if request.end_date else None,
        limit=10000
    )
    
    data = await history_manager.export_transactions(
        user_id=user["id"],
        format=request.format,
        filter_criteria=filter_criteria
    )
    
    date_str = datetime.utcnow().strftime('%Y%m%d')
    
    if request.format == "csv":
        return Response(
            content=data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=transactions_{date_str}.csv"}
        )
    elif request.format == "json":
        return Response(
            content=data,
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=transactions_{date_str}.json"}
        )
    else:
        raise create_validation_error(f"Unsupported format: {request.format}")


# Export router
__all__ = ["router"]

