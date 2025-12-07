#!/usr/bin/env python3
"""
Transaction History Manager
Manages transaction history, search, and filters
"""

from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import structlog

from app.models.transaction_history import (
    Transaction, TransactionFilter, TransactionStatistics,
    TransactionType, TransactionStatus, TransactionPriority,
    GasInfo
)

logger = structlog.get_logger(__name__)


class TransactionHistoryManager:
    """Manages transaction history"""
    
    def __init__(self):
        """Initialize transaction history manager"""
        self.transactions: Dict[str, Transaction] = {}
        # In production, this would use a database
        logger.info("Transaction History Manager initialized")
    
    async def add_transaction(self, transaction: Transaction) -> Transaction:
        """Add a new transaction"""
        self.transactions[transaction.tx_id] = transaction
        logger.info(f"Added transaction {transaction.tx_id}")
        return transaction
    
    async def get_transaction(self, tx_id: str) -> Optional[Transaction]:
        """Get transaction by ID"""
        return self.transactions.get(tx_id)
    
    async def get_transactions(
        self,
        filter_criteria: TransactionFilter
    ) -> List[Transaction]:
        """Get transactions matching filter criteria"""
        results = []
        
        for tx in self.transactions.values():
            if tx.user_id != filter_criteria.user_id:
                continue
            
            # Filter by wallet
            if filter_criteria.wallet_ids and tx.wallet_id not in filter_criteria.wallet_ids:
                continue
            
            # Filter by type
            if filter_criteria.types and tx.type not in filter_criteria.types:
                continue
            
            # Filter by status
            if filter_criteria.statuses and tx.status not in filter_criteria.statuses:
                continue
            
            # Filter by asset
            if filter_criteria.assets and tx.asset_symbol not in filter_criteria.assets:
                continue
            
            # Filter by chain
            if filter_criteria.chains and tx.chain not in filter_criteria.chains:
                continue
            
            # Filter by amount
            if filter_criteria.min_amount and tx.amount < filter_criteria.min_amount:
                continue
            if filter_criteria.max_amount and tx.amount > filter_criteria.max_amount:
                continue
            
            # Filter by USD amount
            if filter_criteria.min_amount_usd and (tx.amount_usd is None or tx.amount_usd < filter_criteria.min_amount_usd):
                continue
            if filter_criteria.max_amount_usd and (tx.amount_usd is None or tx.amount_usd > filter_criteria.max_amount_usd):
                continue
            
            # Filter by date
            if filter_criteria.start_date and tx.created_at < filter_criteria.start_date:
                continue
            if filter_criteria.end_date and tx.created_at > filter_criteria.end_date:
                continue
            
            # Search query
            if filter_criteria.search_query:
                query = filter_criteria.search_query.lower()
                if (
                    query not in tx.tx_hash.lower() and
                    query not in tx.from_address.lower() and
                    query not in tx.to_address.lower() and
                    (tx.note is None or query not in tx.note.lower())
                ):
                    continue
            
            # Filter by tags
            if filter_criteria.tags and not any(tag in tx.tags for tag in filter_criteria.tags):
                continue
            
            # Filter by risk score
            if filter_criteria.min_risk_score and (tx.risk_score is None or tx.risk_score < filter_criteria.min_risk_score):
                continue
            if filter_criteria.max_risk_score and (tx.risk_score is None or tx.risk_score > filter_criteria.max_risk_score):
                continue
            
            # Filter by MEV protection
            if filter_criteria.mev_protected_only is not None and tx.mev_protected != filter_criteria.mev_protected_only:
                continue
            
            results.append(tx)
        
        # Sort
        reverse = filter_criteria.sort_order == "desc"
        if filter_criteria.sort_by == "created_at":
            results.sort(key=lambda x: x.created_at, reverse=reverse)
        elif filter_criteria.sort_by == "amount":
            results.sort(key=lambda x: float(x.amount), reverse=reverse)
        elif filter_criteria.sort_by == "amount_usd":
            results.sort(key=lambda x: x.amount_usd or 0, reverse=reverse)
        
        # Paginate
        start = filter_criteria.offset
        end = start + filter_criteria.limit
        return results[start:end]
    
    async def get_statistics(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> TransactionStatistics:
        """Get transaction statistics"""
        stats = TransactionStatistics(
            total_count=0,
            total_sent=Decimal(0),
            total_received=Decimal(0),
            total_sent_usd=0.0,
            total_received_usd=0.0,
            net_change_usd=0.0,
            start_date=start_date,
            end_date=end_date
        )
        
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        
        for tx in self.transactions.values():
            if tx.user_id != user_id:
                continue
            
            # Date filter
            if start_date and tx.created_at < start_date:
                continue
            if end_date and tx.created_at > end_date:
                continue
            
            stats.total_count += 1
            
            # By type
            tx_type = tx.type.value
            stats.by_type[tx_type] = stats.by_type.get(tx_type, 0) + 1
            
            # By status
            if tx.status == TransactionStatus.PENDING:
                stats.pending_count += 1
            elif tx.status == TransactionStatus.CONFIRMED:
                stats.confirmed_count += 1
            elif tx.status == TransactionStatus.FAILED:
                stats.failed_count += 1
            
            # By asset
            stats.by_asset[tx.asset_symbol] = stats.by_asset.get(tx.asset_symbol, Decimal(0)) + tx.amount
            
            # By chain
            stats.by_chain[tx.chain] = stats.by_chain.get(tx.chain, 0) + 1
            
            # Amounts
            if tx.type == TransactionType.SEND:
                stats.total_sent += tx.amount
                if tx.amount_usd:
                    stats.total_sent_usd += tx.amount_usd
            elif tx.type == TransactionType.RECEIVE:
                stats.total_received += tx.amount
                if tx.amount_usd:
                    stats.total_received_usd += tx.amount_usd
            
            # Time periods
            if tx.created_at >= today_start:
                stats.today_count += 1
            if tx.created_at >= week_start:
                stats.this_week_count += 1
            if tx.created_at >= month_start:
                stats.this_month_count += 1
            if tx.created_at >= year_start:
                stats.this_year_count += 1
            
            # Gas statistics
            if tx.gas.total_cost_usd:
                stats.total_gas_paid_usd += tx.gas.total_cost_usd
        
        stats.net_change_usd = stats.total_received_usd - stats.total_sent_usd
        
        if stats.total_count > 0:
            stats.average_gas_price = stats.total_gas_paid / stats.total_count if stats.total_gas_paid > 0 else 0
        
        return stats
    
    async def add_note(self, tx_id: str, note: str) -> Transaction:
        """Add note to transaction"""
        tx = await self.get_transaction(tx_id)
        if not tx:
            raise ValueError(f"Transaction not found: {tx_id}")
        
        tx.note = note
        logger.info(f"Added note to transaction {tx_id}")
        return tx
    
    async def add_tag(self, tx_id: str, tag: str) -> Transaction:
        """Add tag to transaction"""
        tx = await self.get_transaction(tx_id)
        if not tx:
            raise ValueError(f"Transaction not found: {tx_id}")
        
        if tag not in tx.tags:
            tx.tags.append(tag)
        
        logger.info(f"Added tag {tag} to transaction {tx_id}")
        return tx
    
    async def export_transactions(
        self,
        user_id: str,
        format: str = "csv",
        filter_criteria: Optional[TransactionFilter] = None
    ) -> str:
        """Export transactions"""
        if not filter_criteria:
            filter_criteria = TransactionFilter(user_id=user_id, limit=10000)
        
        transactions = await self.get_transactions(filter_criteria)
        
        if format == "csv":
            lines = ["tx_hash,type,from,to,amount,asset,status,created_at,gas_cost_usd"]
            for tx in transactions:
                lines.append(
                    f"{tx.tx_hash},{tx.type.value},{tx.from_address},{tx.to_address},"
                    f"{tx.amount},{tx.asset_symbol},{tx.status.value},"
                    f"{tx.created_at.isoformat()},{tx.gas.total_cost_usd or 0}"
                )
            return "\n".join(lines)
        elif format == "json":
            import json
            return json.dumps([tx.to_dict() for tx in transactions], indent=2, default=str)
        else:
            raise ValueError(f"Unsupported format: {format}")


# Singleton instance
_transaction_history_manager = None


def get_transaction_history_manager() -> TransactionHistoryManager:
    """Get or create transaction history manager instance"""
    global _transaction_history_manager
    if _transaction_history_manager is None:
        _transaction_history_manager = TransactionHistoryManager()
    return _transaction_history_manager

