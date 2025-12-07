#!/usr/bin/env python3
"""
Transaction Queue System
Manages pending transactions, retries, and status tracking
"""

import asyncio
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from collections import deque

import structlog

logger = structlog.get_logger(__name__)


class TransactionStatus(Enum):
    """Transaction status"""
    PENDING = "pending"
    QUEUED = "queued"
    BROADCASTING = "broadcasting"
    CONFIRMING = "confirming"
    CONFIRMED = "confirmed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class QueuedTransaction:
    """Queued transaction"""
    tx_hash: Optional[str] = None
    tx_data: Dict[str, Any] = field(default_factory=dict)
    status: TransactionStatus = TransactionStatus.QUEUED
    chain_id: int = 1
    network: str = "ethereum"
    account_index: int = 0
    priority: int = 0  # Higher = more priority
    retry_count: int = 0
    max_retries: int = 3
    created_at: datetime = field(default_factory=datetime.utcnow)
    broadcast_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    error: Optional[str] = None
    confirmations: int = 0
    required_confirmations: int = 1
    metadata: Dict[str, Any] = field(default_factory=dict)


class TransactionQueue:
    """Transaction queue manager"""
    
    def __init__(self, max_queue_size: int = 100):
        self.queue: deque = deque(maxlen=max_queue_size)
        self.pending: Dict[str, QueuedTransaction] = {}
        self.completed: Dict[str, QueuedTransaction] = {}
        self.running = False
        self._lock = asyncio.Lock()
        
    async def add_transaction(
        self,
        tx_data: Dict[str, Any],
        chain_id: int = 1,
        network: str = "ethereum",
        account_index: int = 0,
        priority: int = 0,
        max_retries: int = 3,
        metadata: Optional[Dict[str, Any]] = None
    ) -> QueuedTransaction:
        """Add transaction to queue"""
        async with self._lock:
            queued_tx = QueuedTransaction(
                tx_data=tx_data,
                chain_id=chain_id,
                network=network,
                account_index=account_index,
                priority=priority,
                max_retries=max_retries,
                metadata=metadata or {}
            )
            
            # Insert based on priority
            inserted = False
            for i, existing in enumerate(self.queue):
                if priority > existing.priority:
                    self.queue.insert(i, queued_tx)
                    inserted = True
                    break
            
            if not inserted:
                self.queue.append(queued_tx)
            
            logger.info(
                "Transaction queued",
                queue_size=len(self.queue),
                priority=priority,
                network=network
            )
            
            return queued_tx
    
    async def get_next_transaction(self) -> Optional[QueuedTransaction]:
        """Get next transaction from queue"""
        async with self._lock:
            if not self.queue:
                return None
            
            return self.queue.popleft()
    
    async def mark_broadcasting(self, tx_hash: str, queued_tx: QueuedTransaction):
        """Mark transaction as broadcasting"""
        async with self._lock:
            queued_tx.tx_hash = tx_hash
            queued_tx.status = TransactionStatus.BROADCASTING
            queued_tx.broadcast_at = datetime.utcnow()
            self.pending[tx_hash] = queued_tx
            
            logger.info("Transaction broadcasting", tx_hash=tx_hash)
    
    async def mark_confirming(self, tx_hash: str, confirmations: int = 0):
        """Mark transaction as confirming"""
        async with self._lock:
            if tx_hash in self.pending:
                self.pending[tx_hash].status = TransactionStatus.CONFIRMING
                self.pending[tx_hash].confirmations = confirmations
                logger.info(
                    "Transaction confirming",
                    tx_hash=tx_hash,
                    confirmations=confirmations
                )
    
    async def mark_confirmed(self, tx_hash: str, confirmations: int):
        """Mark transaction as confirmed"""
        async with self._lock:
            if tx_hash in self.pending:
                tx = self.pending.pop(tx_hash)
                tx.status = TransactionStatus.CONFIRMED
                tx.confirmed_at = datetime.utcnow()
                tx.confirmations = confirmations
                self.completed[tx_hash] = tx
                
                logger.info(
                    "Transaction confirmed",
                    tx_hash=tx_hash,
                    confirmations=confirmations
                )
    
    async def mark_failed(self, tx_hash: str, error: str):
        """Mark transaction as failed"""
        async with self._lock:
            if tx_hash in self.pending:
                tx = self.pending.pop(tx_hash)
                tx.status = TransactionStatus.FAILED
                tx.error = error
                self.completed[tx_hash] = tx
                
                logger.error("Transaction failed", tx_hash=tx_hash, error=error)
    
    async def retry_transaction(self, queued_tx: QueuedTransaction) -> bool:
        """Retry a failed transaction"""
        async with self._lock:
            if queued_tx.retry_count >= queued_tx.max_retries:
                await self.mark_failed(
                    queued_tx.tx_hash or "unknown",
                    f"Max retries ({queued_tx.max_retries}) exceeded"
                )
                return False
            
            queued_tx.retry_count += 1
            queued_tx.status = TransactionStatus.QUEUED
            queued_tx.error = None
            
            # Re-queue with same priority
            inserted = False
            for i, existing in enumerate(self.queue):
                if queued_tx.priority > existing.priority:
                    self.queue.insert(i, queued_tx)
                    inserted = True
                    break
            
            if not inserted:
                self.queue.append(queued_tx)
            
            logger.info(
                "Transaction retry queued",
                retry_count=queued_tx.retry_count,
                max_retries=queued_tx.max_retries
            )
            
            return True
    
    async def cancel_transaction(self, tx_hash: str) -> bool:
        """Cancel a pending transaction"""
        async with self._lock:
            # Check queue
            for tx in self.queue:
                if tx.tx_hash == tx_hash:
                    tx.status = TransactionStatus.CANCELLED
                    self.queue.remove(tx)
                    logger.info("Transaction cancelled from queue", tx_hash=tx_hash)
                    return True
            
            # Check pending
            if tx_hash in self.pending:
                self.pending[tx_hash].status = TransactionStatus.CANCELLED
                del self.pending[tx_hash]
                logger.info("Transaction cancelled", tx_hash=tx_hash)
                return True
            
            return False
    
    async def get_queue_status(self) -> Dict[str, Any]:
        """Get queue status"""
        async with self._lock:
            return {
                "queue_size": len(self.queue),
                "pending_count": len(self.pending),
                "completed_count": len(self.completed),
                "queued": [
                    {
                        "tx_hash": tx.tx_hash,
                        "network": tx.network,
                        "priority": tx.priority,
                        "status": tx.status.value,
                        "created_at": tx.created_at.isoformat(),
                    }
                    for tx in list(self.queue)[:10]  # First 10
                ],
                "pending": [
                    {
                        "tx_hash": tx.tx_hash,
                        "network": tx.network,
                        "status": tx.status.value,
                        "confirmations": tx.confirmations,
                        "broadcast_at": tx.broadcast_at.isoformat() if tx.broadcast_at else None,
                    }
                    for tx in list(self.pending.values())[:10]  # First 10
                ],
            }
    
    async def get_transaction(self, tx_hash: str) -> Optional[QueuedTransaction]:
        """Get transaction by hash"""
        async with self._lock:
            if tx_hash in self.pending:
                return self.pending[tx_hash]
            if tx_hash in self.completed:
                return self.completed[tx_hash]
            return None
    
    async def clear_completed(self, older_than_hours: int = 24):
        """Clear old completed transactions"""
        async with self._lock:
            cutoff = datetime.utcnow().timestamp() - (older_than_hours * 3600)
            to_remove = []
            
            for tx_hash, tx in self.completed.items():
                if tx.confirmed_at and tx.confirmed_at.timestamp() < cutoff:
                    to_remove.append(tx_hash)
            
            for tx_hash in to_remove:
                del self.completed[tx_hash]
            
            logger.info("Cleared completed transactions", count=len(to_remove))


# Global queue instance
_transaction_queue: Optional[TransactionQueue] = None


def get_transaction_queue() -> TransactionQueue:
    """Get global transaction queue instance"""
    global _transaction_queue
    if _transaction_queue is None:
        _transaction_queue = TransactionQueue()
    return _transaction_queue

