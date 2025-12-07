#!/usr/bin/env python3
"""
Support Manager
Help center, bug reports, feature requests
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum
import structlog

logger = structlog.get_logger(__name__)


class TicketType(str, Enum):
    """Support ticket type enumeration"""
    BUG = "bug"
    FEATURE_REQUEST = "feature_request"
    QUESTION = "question"
    ACCOUNT_ISSUE = "account_issue"
    SECURITY = "security"
    OTHER = "other"


class TicketStatus(str, Enum):
    """Ticket status enumeration"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


@dataclass
class SupportTicket:
    """Support ticket information"""
    ticket_id: str
    user_id: str
    type: TicketType
    status: TicketStatus = TicketStatus.OPEN
    subject: str = ""
    description: str = ""
    
    # Metadata
    attachments: List[str] = field(default_factory=list)
    logs_attached: bool = False
    screenshots: List[str] = field(default_factory=list)
    
    # Timestamps
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    
    # Response
    response: Optional[str] = None
    responded_by: Optional[str] = None
    
    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "ticket_id": self.ticket_id,
            "type": self.type.value,
            "status": self.status.value,
            "subject": self.subject,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "response": self.response
        }


class SupportManager:
    """Manages support tickets and help center"""
    
    def __init__(self):
        """Initialize support manager"""
        self.tickets: Dict[str, SupportTicket] = {}
        self.help_articles: List[Dict[str, Any]] = []
        logger.info("Support Manager initialized")
    
    async def create_ticket(
        self,
        user_id: str,
        type: TicketType,
        subject: str,
        description: str,
        attachments: Optional[List[str]] = None,
        logs: bool = False,
        screenshots: Optional[List[str]] = None
    ) -> SupportTicket:
        """Create support ticket"""
        import hashlib
        ticket_id = hashlib.sha256(
            f"{user_id}_{type}_{subject}_{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]
        
        ticket = SupportTicket(
            ticket_id=ticket_id,
            user_id=user_id,
            type=type,
            subject=subject,
            description=description,
            attachments=attachments or [],
            logs_attached=logs,
            screenshots=screenshots or []
        )
        
        self.tickets[ticket_id] = ticket
        logger.info(f"Support ticket created: {ticket_id} by user {user_id}")
        return ticket
    
    async def get_ticket(self, ticket_id: str, user_id: str) -> Optional[SupportTicket]:
        """Get support ticket"""
        ticket = self.tickets.get(ticket_id)
        if ticket and ticket.user_id == user_id:
            return ticket
        return None
    
    async def get_user_tickets(
        self,
        user_id: str,
        status: Optional[TicketStatus] = None,
        limit: int = 50
    ) -> List[SupportTicket]:
        """Get user tickets"""
        tickets = [
            t for t in self.tickets.values()
            if t.user_id == user_id
        ]
        
        if status:
            tickets = [t for t in tickets if t.status == status]
        
        tickets.sort(key=lambda x: x.created_at, reverse=True)
        return tickets[:limit]
    
    async def get_help_articles(
        self,
        category: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get help center articles"""
        articles = self.help_articles.copy()
        
        if category:
            articles = [a for a in articles if a.get("category") == category]
        
        if search_query:
            query = search_query.lower()
            articles = [
                a for a in articles
                if query in a.get("title", "").lower() or
                query in a.get("content", "").lower()
            ]
        
        return articles


# Singleton instance
_support_manager = None


def get_support_manager() -> SupportManager:
    """Get or create support manager instance"""
    global _support_manager
    if _support_manager is None:
        _support_manager = SupportManager()
    return _support_manager

