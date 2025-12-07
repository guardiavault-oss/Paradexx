#!/usr/bin/env python3
"""
Notification Manager
Handles all notifications and communications
"""

from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import structlog

logger = structlog.get_logger(__name__)


class NotificationType(str, Enum):
    """Notification type enumeration"""
    TRANSACTION = "transaction"
    SECURITY = "security"
    MARKETING = "marketing"
    VAULT = "vault"
    GUARDIAN = "guardian"
    YIELD = "yield"
    BRIDGE = "bridge"
    CHECKIN = "checkin"
    GENERAL = "general"


class NotificationChannel(str, Enum):
    """Notification channel enumeration"""
    PUSH = "push"
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"


class NotificationPriority(str, Enum):
    """Notification priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


@dataclass
class Notification:
    """Notification information"""
    notification_id: str
    user_id: str
    type: NotificationType
    title: str
    message: str
    priority: NotificationPriority = NotificationPriority.MEDIUM
    channels: List[NotificationChannel] = field(default_factory=lambda: [NotificationChannel.IN_APP])
    
    # Status
    read: bool = False
    read_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = field(default_factory=datetime.utcnow)
    sent_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    
    # Actions
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    
    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "notification_id": self.notification_id,
            "type": self.type.value,
            "title": self.title,
            "message": self.message,
            "priority": self.priority.value,
            "read": self.read,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "action_url": self.action_url,
            "action_label": self.action_label
        }


class NotificationManager:
    """Manages notifications"""
    
    def __init__(self):
        """Initialize notification manager"""
        self.notifications: Dict[str, List[Notification]] = {}
        self.badge_counts: Dict[str, int] = {}
        logger.info("Notification Manager initialized")
    
    async def send_notification(
        self,
        user_id: str,
        type: NotificationType,
        title: str,
        message: str,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        channels: Optional[List[NotificationChannel]] = None,
        action_url: Optional[str] = None,
        action_label: Optional[str] = None,
        expires_at: Optional[datetime] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """Send notification to user"""
        import hashlib
        notification_id = hashlib.sha256(
            f"{user_id}_{type}_{title}_{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]
        
        notification = Notification(
            notification_id=notification_id,
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            priority=priority,
            channels=channels or [NotificationChannel.IN_APP],
            action_url=action_url,
            action_label=action_label,
            expires_at=expires_at,
            metadata=metadata or {}
        )
        
        if user_id not in self.notifications:
            self.notifications[user_id] = []
        
        self.notifications[user_id].append(notification)
        
        # Update badge count
        if not notification.read:
            self.badge_counts[user_id] = self.badge_counts.get(user_id, 0) + 1
        
        # In production, send via push/email/SMS
        logger.info(f"Notification sent to user {user_id}: {title}")
        return notification
    
    async def get_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        type: Optional[NotificationType] = None,
        limit: int = 50
    ) -> List[Notification]:
        """Get user notifications"""
        user_notifications = self.notifications.get(user_id, [])
        
        # Filter
        filtered = user_notifications
        if unread_only:
            filtered = [n for n in filtered if not n.read]
        if type:
            filtered = [n for n in filtered if n.type == type]
        
        # Sort by created_at descending
        filtered.sort(key=lambda x: x.created_at, reverse=True)
        
        # Limit
        return filtered[:limit]
    
    async def mark_as_read(
        self,
        user_id: str,
        notification_id: str
    ) -> bool:
        """Mark notification as read"""
        notifications = self.notifications.get(user_id, [])
        
        for notification in notifications:
            if notification.notification_id == notification_id:
                notification.read = True
                notification.read_at = datetime.utcnow()
                
                # Update badge count
                if self.badge_counts.get(user_id, 0) > 0:
                    self.badge_counts[user_id] -= 1
                
                logger.info(f"Notification {notification_id} marked as read")
                return True
        
        return False
    
    async def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications as read"""
        notifications = self.notifications.get(user_id, [])
        
        count = 0
        for notification in notifications:
            if not notification.read:
                notification.read = True
                notification.read_at = datetime.utcnow()
                count += 1
        
        self.badge_counts[user_id] = 0
        logger.info(f"Marked {count} notifications as read for user {user_id}")
        return count
    
    async def get_badge_count(self, user_id: str) -> int:
        """Get unread notification count"""
        return self.badge_counts.get(user_id, 0)
    
    async def delete_notification(
        self,
        user_id: str,
        notification_id: str
    ) -> bool:
        """Delete notification"""
        notifications = self.notifications.get(user_id, [])
        
        for i, notification in enumerate(notifications):
            if notification.notification_id == notification_id:
                notifications.pop(i)
                
                # Update badge count
                if not notification.read and self.badge_counts.get(user_id, 0) > 0:
                    self.badge_counts[user_id] -= 1
                
                logger.info(f"Notification {notification_id} deleted")
                return True
        
        return False
    
    async def send_transaction_notification(
        self,
        user_id: str,
        tx_hash: str,
        amount: float,
        asset: str,
        status: str
    ):
        """Send transaction notification"""
        title = f"Transaction {status.title()}"
        message = f"{amount} {asset} transaction {status}"
        action_url = f"/transactions/{tx_hash}"
        
        await self.send_notification(
            user_id=user_id,
            type=NotificationType.TRANSACTION,
            title=title,
            message=message,
            priority=NotificationPriority.HIGH if status == "failed" else NotificationPriority.MEDIUM,
            action_url=action_url,
            action_label="View Transaction",
            metadata={"tx_hash": tx_hash, "amount": amount, "asset": asset, "status": status}
        )
    
    async def send_security_alert(
        self,
        user_id: str,
        alert_type: str,
        message: str
    ):
        """Send security alert"""
        await self.send_notification(
            user_id=user_id,
            type=NotificationType.SECURITY,
            title=f"Security Alert: {alert_type}",
            message=message,
            priority=NotificationPriority.URGENT,
            channels=[NotificationChannel.PUSH, NotificationChannel.EMAIL, NotificationChannel.IN_APP],
            metadata={"alert_type": alert_type}
        )
    
    async def send_checkin_reminder(
        self,
        user_id: str,
        vault_id: str,
        days_remaining: int
    ):
        """Send vault check-in reminder"""
        await self.send_notification(
            user_id=user_id,
            type=NotificationType.CHECKIN,
            title="Check-In Reminder",
            message=f"Your vault check-in is due in {days_remaining} days",
            priority=NotificationPriority.MEDIUM if days_remaining > 3 else NotificationPriority.HIGH,
            channels=[NotificationChannel.PUSH, NotificationChannel.EMAIL, NotificationChannel.IN_APP],
            action_url=f"/vaults/{vault_id}/checkin",
            action_label="Check In Now",
            metadata={"vault_id": vault_id, "days_remaining": days_remaining}
        )


# Singleton instance
_notification_manager = None


def get_notification_manager() -> NotificationManager:
    """Get or create notification manager instance"""
    global _notification_manager
    if _notification_manager is None:
        _notification_manager = NotificationManager()
    return _notification_manager

