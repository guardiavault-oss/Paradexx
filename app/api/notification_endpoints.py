#!/usr/bin/env python3
"""
Notification API Endpoints
Notification management and preferences
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
import structlog

# Import core modules
from app.core.notification_manager import NotificationType

# Import dependencies and helpers
from app.api.dependencies import (
    get_authenticated_user,
    require_notification_manager
)
from app.api.error_handlers import (
    handle_endpoint_errors,
    create_not_found_error
)
from app.core.utils import get_utc_timestamp, format_response

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/notifications", tags=["notifications"])


# Endpoints
@router.get("/")
@handle_endpoint_errors("get notifications")
async def get_notifications(
    unread_only: bool = Query(False, description="Only unread notifications"),
    type: Optional[str] = Query(None, description="Notification type filter"),
    limit: int = Query(50, ge=1, le=500),
    user=Depends(get_authenticated_user),
    notification_manager=Depends(require_notification_manager)
):
    """Get user notifications"""
    notification_type = NotificationType(type) if type else None
    notifications = await notification_manager.get_notifications(
        user_id=user["id"],
        unread_only=unread_only,
        type=notification_type,
        limit=limit
    )
    
    return format_response(
        success=True,
        data={
            "notifications": [n.to_dict() for n in notifications],
            "count": len(notifications)
        },
        timestamp=get_utc_timestamp()
    )


@router.get("/badge-count")
@handle_endpoint_errors("get badge count")
async def get_badge_count(
    user=Depends(get_authenticated_user),
    notification_manager=Depends(require_notification_manager)
):
    """Get unread notification badge count"""
    count = await notification_manager.get_badge_count(user["id"])
    
    return format_response(
        success=True,
        data={"count": count},
        timestamp=get_utc_timestamp()
    )


@router.post("/{notification_id}/read")
@handle_endpoint_errors("mark notification as read")
async def mark_notification_as_read(
    notification_id: str,
    user=Depends(get_authenticated_user),
    notification_manager=Depends(require_notification_manager)
):
    """Mark notification as read"""
    success = await notification_manager.mark_as_read(user["id"], notification_id)
    
    if not success:
        raise create_not_found_error("Notification", notification_id)
    
    return format_response(
        success=True,
        message="Notification marked as read",
        timestamp=get_utc_timestamp()
    )


@router.post("/read-all")
@handle_endpoint_errors("mark all as read")
async def mark_all_as_read(
    user=Depends(get_authenticated_user),
    notification_manager=Depends(require_notification_manager)
):
    """Mark all notifications as read"""
    count = await notification_manager.mark_all_as_read(user["id"])
    
    return format_response(
        success=True,
        data={"count": count},
        message=f"Marked {count} notifications as read",
        timestamp=get_utc_timestamp()
    )


@router.delete("/{notification_id}")
@handle_endpoint_errors("delete notification")
async def delete_notification(
    notification_id: str,
    user=Depends(get_authenticated_user),
    notification_manager=Depends(require_notification_manager)
):
    """Delete notification"""
    success = await notification_manager.delete_notification(user["id"], notification_id)
    
    if not success:
        raise create_not_found_error("Notification", notification_id)
    
    return format_response(
        success=True,
        message="Notification deleted",
        timestamp=get_utc_timestamp()
    )


# Export router
__all__ = ["router"]

