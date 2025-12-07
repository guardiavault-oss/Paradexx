import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "core-engine"))
"""
Mempool API service implementation
"""

from datetime import datetime  # noqa: E402
from typing import Any, Dict, List  # noqa: E402

from common.observability.logging import get_scorpius_logger  # noqa: E402

from ..mempool_monitor import MempoolMonitor  # noqa: E402

logger = get_scorpius_logger(__name__)


class MempoolAPI:
    """Mempool API service"""

    def __init__(self):
        self.monitor = MempoolMonitor()
        self.is_monitoring = False

    async def start_monitoring(self) -> Dict[str, Any]:
        """Start mempool monitoring"""
        if not self.is_monitoring:
            await self.monitor.start_monitoring()
            self.is_monitoring = True

        return {"status": "monitoring_started", "timestamp": datetime.now().isoformat()}

    async def stop_monitoring(self) -> Dict[str, Any]:
        """Stop mempool monitoring"""
        if self.is_monitoring:
            await self.monitor.stop_monitoring()
            self.is_monitoring = False

        return {"status": "monitoring_stopped", "timestamp": datetime.now().isoformat()}

    async def get_pending_transactions(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get pending transactions"""
        return await self.monitor.get_pending_transactions(limit)

    async def get_mev_opportunities(self) -> List[Dict[str, Any]]:
        """Get MEV opportunities"""
        return await self.monitor.get_mev_opportunities()

    async def get_mempool_stats(self) -> Dict[str, Any]:
        """Get mempool statistics"""
        return await self.monitor.get_mempool_stats()

    async def subscribe_to_stream(self, subscriber_id: str) -> Dict[str, Any]:
        """Subscribe to mempool stream"""
        await self.monitor.subscribe_to_stream(subscriber_id)

        return {
            "status": "subscribed",
            "subscriber_id": subscriber_id,
            "timestamp": datetime.now().isoformat(),
        }
