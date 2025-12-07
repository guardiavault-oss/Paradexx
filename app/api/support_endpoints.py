#!/usr/bin/env python3
"""
Support API Endpoints
Help center, bug reports, feature requests
"""

from fastapi import APIRouter, Depends, Query, File, UploadFile
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
import structlog

# Import core modules
from app.core.support_manager import TicketType, TicketStatus

# Import dependencies and helpers
from app.api.dependencies import (
    get_authenticated_user,
    require_support_manager
)
from app.api.error_handlers import (
    handle_endpoint_errors,
    create_not_found_error,
    create_validation_error
)
from app.core.utils import get_utc_timestamp, format_response

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/support", tags=["support"])


# Request Models
class CreateTicketRequest(BaseModel):
    """Create support ticket"""
    type: str = Field(..., description="Ticket type: bug, feature_request, question, etc.")
    subject: str = Field(..., description="Ticket subject")
    description: str = Field(..., description="Ticket description")
    include_logs: bool = Field(default=False, description="Include app logs")
    screenshots: Optional[List[str]] = None


# Endpoints
@router.get("/help")
@handle_endpoint_errors("get help articles")
async def get_help_articles(
    category: Optional[str] = Query(None, description="Article category"),
    search: Optional[str] = Query(None, description="Search query"),
    limit: int = Query(50, ge=1, le=200),
    support_manager=Depends(require_support_manager)
):
    """Get help center articles"""
    articles = await support_manager.get_help_articles(category, search)
    
    return format_response(
        success=True,
        data={
            "articles": articles[:limit],
            "count": len(articles)
        },
        timestamp=get_utc_timestamp()
    )


@router.post("/tickets")
@handle_endpoint_errors("create support ticket")
async def create_support_ticket(
    request: CreateTicketRequest,
    user=Depends(get_authenticated_user),
    support_manager=Depends(require_support_manager)
):
    """Create support ticket"""
    ticket_type = TicketType(request.type)
    ticket = await support_manager.create_ticket(
        user_id=user["id"],
        type=ticket_type,
        subject=request.subject,
        description=request.description,
        logs=request.include_logs,
        screenshots=request.screenshots or []
    )
    
    return format_response(
        success=True,
        data={"ticket": ticket.to_dict()},
        message="Support ticket created successfully",
        timestamp=get_utc_timestamp()
    )


@router.get("/tickets")
@handle_endpoint_errors("get user tickets")
async def get_user_tickets(
    status: Optional[str] = Query(None, description="Ticket status filter"),
    limit: int = Query(50, ge=1, le=200),
    user=Depends(get_authenticated_user),
    support_manager=Depends(require_support_manager)
):
    """Get user support tickets"""
    ticket_status = TicketStatus(status) if status else None
    tickets = await support_manager.get_user_tickets(
        user_id=user["id"],
        status=ticket_status,
        limit=limit
    )
    
    return format_response(
        success=True,
        data={
            "tickets": [t.to_dict() for t in tickets],
            "count": len(tickets)
        },
        timestamp=get_utc_timestamp()
    )


@router.get("/tickets/{ticket_id}")
@handle_endpoint_errors("get ticket")
async def get_ticket(
    ticket_id: str,
    user=Depends(get_authenticated_user),
    support_manager=Depends(require_support_manager)
):
    """Get support ticket details"""
    ticket = await support_manager.get_ticket(ticket_id, user["id"])
    
    if not ticket:
        raise create_not_found_error("Ticket", ticket_id)
    
    return format_response(
        success=True,
        data={"ticket": ticket.to_dict()},
        timestamp=get_utc_timestamp()
    )


@router.get("/status")
@handle_endpoint_errors("get system status")
async def get_system_status():
    """Get system status page"""
    return format_response(
        success=True,
        data={
            "status": {
                "overall": "operational",
                "services": {
                    "api": "operational",
                    "blockchain_nodes": "operational",
                    "bridge_service": "operational",
                    "database": "operational"
                },
                "incidents": []
            }
        },
        timestamp=get_utc_timestamp()
    )


# Export router
__all__ = ["router"]

