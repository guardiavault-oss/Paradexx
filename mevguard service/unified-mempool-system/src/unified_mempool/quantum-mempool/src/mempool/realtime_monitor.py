import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "core-engine"))
"""
Enhanced real-time mempool monitor with WebSocket connections and advanced quantum detection.
"""

import asyncio  # noqa: E402
import json  # noqa: E402
from collections import deque  # noqa: E402
from dataclasses import asdict, dataclass  # noqa: E402
from datetime import datetime, timedelta  # noqa: E402
from typing import Any, Callable, Dict, List, Optional  # noqa: E402

import aiohttp  # noqa: E402
import websockets  # noqa: E402
from common.observability.logging import get_scorpius_logger  # noqa: E402

from ..detection.quantum_detector import EnterpriseQuantumDetector  # noqa: E402
from ..enterprise.incident_response import (  # noqa: E402
    IncidentResponseManager,
    IncidentSeverity,
)
from ..enterprise.security_manager import EnterpriseSecurityManager  # noqa: E402
from ..utils.config import EnterpriseConfig  # noqa: E402
from ..utils.metrics import MetricsCollector  # noqa: E402


@dataclass
class TransactionData:
    """Enhanced transaction data structure."""

    hash: str
    from_address: str
    to_address: str
    amount: float
    fee: float
    timestamp: datetime
    block_height: Optional[int] = None
    confirmations: int = 0
    signature: Optional[str] = None
    script_type: Optional[str] = None
    size_bytes: int = 0
    quantum_risk_score: float = 0.0


@dataclass
class MempoolMetrics:
    """Real-time mempool metrics."""

    total_transactions: int
    total_value: float
    average_fee: float
    median_fee: float
    pending_transactions: int
    quantum_threats_detected: int
    high_risk_addresses: int
    last_updated: datetime


class RealtimeMempoolMonitor:
    """
    Enhanced real-time mempool monitoring with quantum threat detection.

    Features:
    - WebSocket connections to multiple blockchain networks
    - Real-time transaction analysis
    - Quantum threat detection and alerting
    - Performance metrics and monitoring
    - Automated incident response
    - Compliance reporting
    """

    def __init__(self, config: EnterpriseConfig):
        self.config = config
        self.logger = get_scorpius_logger(__name__)

        # Core components
        self.quantum_detector: Optional[EnterpriseQuantumDetector] = None
        self.security_manager: Optional[EnterpriseSecurityManager] = None
        self.incident_manager: Optional[IncidentResponseManager] = None
        self.metrics = MetricsCollector(config.metrics_config.__dict__)

        # Real-time data storage
        self.transaction_buffer = deque(maxlen=10000)  # Last 10k transactions
        self.active_connections: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.monitored_addresses: Dict[str, Dict[str, Any]] = {}

        # Monitoring state
        self.is_monitoring = False
        self.mempool_metrics = MempoolMetrics(
            total_transactions=0,
            total_value=0.0,
            average_fee=0.0,
            median_fee=0.0,
            pending_transactions=0,
            quantum_threats_detected=0,
            high_risk_addresses=0,
            last_updated=datetime.now(),
        )

        # Event callbacks
        self.threat_detected_callbacks: List[Callable] = []
        self.transaction_callbacks: List[Callable] = []

    async def initialize(
        self,
        quantum_detector: EnterpriseQuantumDetector,
        security_manager: EnterpriseSecurityManager,
        incident_manager: IncidentResponseManager,
    ):
        """Initialize the monitor with required components."""
        try:
            self.quantum_detector = quantum_detector
            self.security_manager = security_manager
            self.incident_manager = incident_manager

            # Initialize monitoring connections
            await self._initialize_blockchain_connections()

            # Start background tasks
            asyncio.create_task(self._metrics_updater())
            asyncio.create_task(self._threat_analysis_worker())

            self.logger.info("Real-time mempool monitor initialized successfully")

        except Exception as e:
            self.logger.error(f"Failed to initialize mempool monitor: {e}")
            raise

    async def start_monitoring(self):
        """Start real-time mempool monitoring."""
        if self.is_monitoring:
            self.logger.warning("Mempool monitoring is already active")
            return

        try:
            self.is_monitoring = True

            # Start WebSocket connections
            tasks = [
                self._monitor_bitcoin_mempool(),
                self._monitor_ethereum_mempool(),
                self._monitor_quantum_threats(),
            ]

            await asyncio.gather(*tasks, return_exceptions=True)

        except Exception as e:
            self.logger.error(f"Error in mempool monitoring: {e}")
            self.is_monitoring = False
            raise

    async def stop_monitoring(self):
        """Stop real-time mempool monitoring."""
        self.is_monitoring = False

        # Close WebSocket connections
        for connection_id, websocket in self.active_connections.items():
            try:
                await websocket.close()
                self.logger.info(f"Closed WebSocket connection: {connection_id}")
            except Exception as e:
                self.logger.error(f"Error closing WebSocket {connection_id}: {e}")

        self.active_connections.clear()
        self.logger.info("Mempool monitoring stopped")

    async def _initialize_blockchain_connections(self):
        """Initialize connections to blockchain networks."""
        try:
            # Initialize Bitcoin RPC connection
            self.bitcoin_session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.config.bitcoin.timeout)
            )

            # Initialize Ethereum Web3 connection
            self.ethereum_session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.config.ethereum.timeout)
            )

            self.logger.info("Blockchain connections initialized")

        except Exception as e:
            self.logger.error(f"Failed to initialize blockchain connections: {e}")
            raise

    async def _monitor_bitcoin_mempool(self):
        """Monitor Bitcoin mempool via WebSocket."""
        while self.is_monitoring:
            try:
                uri = self.config.bitcoin.websocket_url
                async with websockets.connect(uri) as websocket:
                    self.active_connections["bitcoin"] = websocket

                    # Subscribe to mempool transactions
                    subscribe_msg = json.dumps({"action": "want", "data": ["live-2h"]})
                    await websocket.send(subscribe_msg)

                    async for message in websocket:
                        if not self.is_monitoring:
                            break

                        await self._process_bitcoin_transaction(json.loads(message))

            except websockets.exceptions.ConnectionClosed:
                self.logger.warning(
                    "Bitcoin WebSocket connection closed, reconnecting..."
                )
                await asyncio.sleep(5)
            except Exception as e:
                self.logger.error(f"Bitcoin mempool monitoring error: {e}")
                await asyncio.sleep(10)

    async def _monitor_ethereum_mempool(self):
        """Monitor Ethereum mempool via HTTP polling."""
        while self.is_monitoring:
            try:
                async with self.ethereum_session.get(
                    f"{self.config.ethereum.provider_url}/api/v1/pending"
                ) as response:
                    if response.status == 200:
                        pending_txs = await response.json()
                        for tx in pending_txs.get("result", []):
                            await self._process_ethereum_transaction(tx)

                await asyncio.sleep(2)  # Poll every 2 seconds

            except Exception as e:
                self.logger.error(f"Ethereum mempool monitoring error: {e}")
                await asyncio.sleep(10)

    async def _process_bitcoin_transaction(self, tx_data: Dict[str, Any]):
        """Process incoming Bitcoin transaction."""
        try:
            # Parse transaction data
            transaction = TransactionData(
                hash=tx_data.get("hash", ""),
                from_address=tx_data.get("from", ""),
                to_address=tx_data.get("to", ""),
                amount=float(tx_data.get("value", 0)) / 1e8,  # Convert satoshis to BTC
                fee=float(tx_data.get("fee", 0)) / 1e8,
                timestamp=datetime.fromtimestamp(tx_data.get("timestamp", 0)),
                size_bytes=tx_data.get("size", 0),
            )

            # Add to buffer
            self.transaction_buffer.append(transaction)

            # Update metrics
            self.mempool_metrics.total_transactions += 1
            self.mempool_metrics.total_value += transaction.amount
            self.mempool_metrics.last_updated = datetime.now()

            # Trigger analysis
            await self._analyze_transaction(transaction)

            # Notify callbacks
            for callback in self.transaction_callbacks:
                await callback(transaction)

        except Exception as e:
            self.logger.error(f"Error processing Bitcoin transaction: {e}")

    async def _process_ethereum_transaction(self, tx_data: Dict[str, Any]):
        """Process incoming Ethereum transaction."""
        try:
            # Parse transaction data
            transaction = TransactionData(
                hash=tx_data.get("hash", ""),
                from_address=tx_data.get("from", ""),
                to_address=tx_data.get("to", ""),
                amount=float(int(tx_data.get("value", "0x0"), 16))
                / 1e18,  # Convert wei to ETH
                fee=float(int(tx_data.get("gasPrice", "0x0"), 16))
                * float(int(tx_data.get("gas", "0x0"), 16))
                / 1e18,
                timestamp=datetime.now(),
                size_bytes=len(tx_data.get("input", "")) // 2,
            )

            # Add to buffer
            self.transaction_buffer.append(transaction)

            # Update metrics
            self.mempool_metrics.total_transactions += 1
            self.mempool_metrics.total_value += transaction.amount
            self.mempool_metrics.last_updated = datetime.now()

            # Trigger analysis
            await self._analyze_transaction(transaction)

            # Notify callbacks
            for callback in self.transaction_callbacks:
                await callback(transaction)

        except Exception as e:
            self.logger.error(f"Error processing Ethereum transaction: {e}")

    async def _analyze_transaction(self, transaction: TransactionData):
        """Analyze transaction for quantum threats."""
        try:
            if not self.quantum_detector:
                return

            # Prepare transaction data for quantum analysis
            tx_analysis_data = {
                "hash": transaction.hash,
                "from_address": transaction.from_address,
                "to_address": transaction.to_address,
                "amount": transaction.amount,
                "fee": transaction.fee,
                "timestamp": transaction.timestamp,
                "size_bytes": transaction.size_bytes,
            }

            # Check if this transaction is part of a potential quantum attack
            is_quantum_threat = await self.quantum_detector.analyze_single_transaction(
                tx_analysis_data
            )

            if is_quantum_threat:
                transaction.quantum_risk_score = 0.95  # High risk
                await self._handle_quantum_threat(transaction)
            else:
                # Calculate risk score based on patterns
                transaction.quantum_risk_score = await self._calculate_risk_score(
                    transaction
                )

        except Exception as e:
            self.logger.error(f"Error analyzing transaction {transaction.hash}: {e}")

    async def _calculate_risk_score(self, transaction: TransactionData) -> float:
        """Calculate quantum risk score for a transaction."""
        try:
            risk_factors = []

            # High-value transactions
            if transaction.amount > 10.0:  # More than 10 BTC/ETH
                risk_factors.append(0.3)

            # Low fee (potential sweeping)
            if transaction.fee < 0.001:
                risk_factors.append(0.2)

            # Small transaction size (efficient attack)
            if transaction.size_bytes < 250:
                risk_factors.append(0.2)

            # Address patterns (simplified)
            if len(transaction.from_address) == len(transaction.to_address):
                risk_factors.append(0.1)

            return min(sum(risk_factors), 1.0)

        except Exception as e:
            self.logger.error(f"Error calculating risk score: {e}")
            return 0.0

    async def _handle_quantum_threat(self, transaction: TransactionData):
        """Handle detected quantum threat."""
        try:
            self.mempool_metrics.quantum_threats_detected += 1

            # Create incident
            if self.incident_manager:
                incident_id = await self.incident_manager.create_incident(
                    title=f"Quantum Threat Detected: {transaction.hash[:16]}...",
                    description=f"Potential quantum attack on transaction {transaction.hash}",
                    severity=IncidentSeverity.HIGH,
                    affected_systems=[transaction.from_address, transaction.to_address],
                    tags=["quantum_attack", "real_time", "mempool"],
                )

                self.logger.critical(f"Quantum threat detected: {incident_id}")

            # Notify threat callbacks
            for callback in self.threat_detected_callbacks:
                await callback(transaction)

        except Exception as e:
            self.logger.error(f"Error handling quantum threat: {e}")

    async def _monitor_quantum_threats(self):
        """Continuous quantum threat monitoring."""
        while self.is_monitoring:
            try:
                # Analyze recent transaction patterns
                if len(self.transaction_buffer) >= 10:
                    recent_transactions = list(self.transaction_buffer)[
                        -100:
                    ]  # Last 100 transactions

                    # Group by address for pattern analysis
                    address_patterns = {}
                    for tx in recent_transactions:
                        if tx.from_address not in address_patterns:
                            address_patterns[tx.from_address] = []
                        address_patterns[tx.from_address].append(tx)

                    # Check for mass sweeping patterns
                    for address, transactions in address_patterns.items():
                        if (
                            len(transactions) >= 5
                        ):  # 5 or more transactions from same address
                            await self._analyze_address_pattern(address, transactions)

                await asyncio.sleep(30)  # Check every 30 seconds

            except Exception as e:
                self.logger.error(f"Quantum threat monitoring error: {e}")
                await asyncio.sleep(60)

    async def _analyze_address_pattern(
        self, address: str, transactions: List[TransactionData]
    ):
        """Analyze transaction patterns for a specific address."""
        try:
            if not self.quantum_detector:
                return

            # Prepare data for quantum analysis
            tx_data = [asdict(tx) for tx in transactions]

            # Use quantum detector to analyze pattern
            is_quantum_attack = await self.quantum_detector.analyze_transaction_pattern(
                tx_data
            )

            if is_quantum_attack:
                self.monitored_addresses[address] = {
                    "risk_level": "HIGH",
                    "transaction_count": len(transactions),
                    "total_value": sum(tx.amount for tx in transactions),
                    "first_seen": min(tx.timestamp for tx in transactions),
                    "last_seen": max(tx.timestamp for tx in transactions),
                }

                self.mempool_metrics.high_risk_addresses += 1
                self.logger.warning(f"High-risk address detected: {address}")

        except Exception as e:
            self.logger.error(f"Error analyzing address pattern for {address}: {e}")

    async def _metrics_updater(self):
        """Update mempool metrics periodically."""
        while True:
            try:
                if len(self.transaction_buffer) > 0:
                    # Calculate fees
                    fees = [tx.fee for tx in self.transaction_buffer if tx.fee > 0]
                    if fees:
                        self.mempool_metrics.average_fee = sum(fees) / len(fees)
                        self.mempool_metrics.median_fee = sorted(fees)[len(fees) // 2]

                    # Update pending count
                    recent_time = datetime.now() - timedelta(hours=1)
                    self.mempool_metrics.pending_transactions = sum(
                        1
                        for tx in self.transaction_buffer
                        if tx.timestamp > recent_time and tx.confirmations == 0
                    )

                # Update metrics collector
                self.metrics.set_gauge(
                    "mempool_total_transactions",
                    self.mempool_metrics.total_transactions,
                )
                self.metrics.set_gauge(
                    "mempool_total_value", self.mempool_metrics.total_value
                )
                self.metrics.set_gauge(
                    "mempool_quantum_threats",
                    self.mempool_metrics.quantum_threats_detected,
                )
                self.metrics.set_gauge(
                    "mempool_high_risk_addresses",
                    self.mempool_metrics.high_risk_addresses,
                )

                await asyncio.sleep(60)  # Update every minute

            except Exception as e:
                self.logger.error(f"Metrics update error: {e}")
                await asyncio.sleep(60)

    async def _threat_analysis_worker(self):
        """Background worker for threat analysis."""
        while True:
            try:
                # Perform periodic threat analysis
                if len(self.transaction_buffer) >= 50:
                    # Analyze transaction volume patterns
                    recent_transactions = list(self.transaction_buffer)[-50:]

                    # Check for unusual volume spikes
                    current_volume = len(recent_transactions)
                    if current_volume > 40:  # Threshold for concern
                        self.logger.warning(
                            f"High transaction volume detected: {current_volume} transactions"
                        )

                await asyncio.sleep(300)  # Run every 5 minutes

            except Exception as e:
                self.logger.error(f"Threat analysis worker error: {e}")
                await asyncio.sleep(300)

    def add_threat_callback(self, callback: Callable):
        """Add callback for threat detection events."""
        self.threat_detected_callbacks.append(callback)

    def add_transaction_callback(self, callback: Callable):
        """Add callback for new transactions."""
        self.transaction_callbacks.append(callback)

    def get_mempool_metrics(self) -> MempoolMetrics:
        """Get current mempool metrics."""
        return self.mempool_metrics

    def get_monitored_addresses(self) -> Dict[str, Dict[str, Any]]:
        """Get currently monitored high-risk addresses."""
        return self.monitored_addresses.copy()

    def get_recent_transactions(self, limit: int = 100) -> List[TransactionData]:
        """Get recent transactions from buffer."""
        return list(self.transaction_buffer)[-limit:]
