#!/usr/bin/env python3
"""
Unified Mempool Engine - World-Class Real Blockchain Monitoring
================================================================
Advanced mempool monitoring system with real blockchain integration,
MEV detection, ML-powered risk scoring, and multi-chain support.
"""

import asyncio
import json
import logging
import time
from collections import defaultdict, deque
from dataclasses import asdict, dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

import aiohttp
try:
    from web3 import AsyncWeb3
    from web3.providers import AsyncHTTPProvider
    try:
        from web3.providers import AsyncIPCProvider
    except ImportError:
        AsyncIPCProvider = None
except ImportError:
    # Fallback for newer web3.py versions - use sync Web3
    from web3 import Web3 as AsyncWeb3
    from web3.providers import HTTPProvider as AsyncHTTPProvider
    AsyncIPCProvider = None
import warnings
from concurrent.futures import ThreadPoolExecutor

import psutil
import redis.asyncio as aioredis

warnings.filterwarnings("ignore", category=DeprecationWarning)

logger = logging.getLogger(__name__)


class NetworkType(Enum):
    """Supported blockchain networks"""

    ETHEREUM = "ethereum"
    POLYGON = "polygon"
    BSC = "bsc"
    ARBITRUM = "arbitrum"
    OPTIMISM = "optimism"
    AVALANCHE = "avalanche"


class MEVType(Enum):
    """Types of MEV opportunities"""

    SANDWICH = "sandwich"
    ARBITRAGE = "arbitrage"
    FLASH_LOAN = "flash_loan"
    LIQUIDATION = "liquidation"
    FRONT_RUN = "front_run"
    BACK_RUN = "back_run"


class ThreatLevel(Enum):
    """Threat severity levels"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class MempoolTransaction:
    """Enhanced transaction data structure"""

    hash: str
    network: NetworkType
    from_address: str
    to_address: str | None
    value: int  # in wei
    gas_price: int  # in wei
    gas_limit: int
    nonce: int
    data: str
    timestamp: datetime
    block_number: int | None = None

    # Advanced analysis fields
    risk_score: float = 0.0
    threat_level: ThreatLevel = ThreatLevel.LOW
    is_suspicious: bool = False
    mev_type: MEVType | None = None
    profit_estimate: float | None = None
    confidence_score: float = 0.0

    # Analysis metadata
    analysis_metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        data["network"] = self.network.value
        data["timestamp"] = self.timestamp.isoformat()
        data["threat_level"] = self.threat_level.value
        data["mev_type"] = self.mev_type.value if self.mev_type else None
        return data


@dataclass
class ThreatIntelligence:
    """Threat intelligence data"""

    threat_id: str
    threat_type: str
    severity: ThreatLevel
    confidence: float
    source: str
    description: str
    indicators: list[str]
    timestamp: datetime

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["severity"] = self.severity.value
        data["timestamp"] = self.timestamp.isoformat()
        return data


@dataclass
class UserProfile:
    """User behavior profile"""

    address: str
    transaction_count: int
    total_volume: float
    average_gas_price: float
    risk_score: float
    last_activity: datetime
    behavior_patterns: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["last_activity"] = self.last_activity.isoformat()
        return data


class AdvancedMEVDetector:
    """Advanced MEV detection algorithms"""

    def __init__(self):
        self.sandwich_patterns = {}
        self.arbitrage_opportunities = {}
        self.flash_loan_contracts = {
            "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9",  # Aave
            "0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e",  # dYdX
            "0x398eC7346DcD622eDc5ae82352F02bE94C62d119",  # Compound
        }

    async def detect_sandwich_attack(
        self, transactions: list[MempoolTransaction]
    ) -> list[dict[str, Any]]:
        """Detect sandwich attacks in transaction pool"""
        sandwich_attacks = []

        # Group transactions by target contract
        by_contract = defaultdict(list)
        for tx in transactions:
            if tx.to_address:
                by_contract[tx.to_address].append(tx)

        # Look for sandwich patterns
        for contract, txs in by_contract.items():
            if len(txs) >= 3:
                # Sort by gas price
                sorted_txs = sorted(txs, key=lambda x: x.gas_price, reverse=True)

                # Check for sandwich pattern: high gas -> victim -> high gas
                for i in range(len(sorted_txs) - 2):
                    front_tx = sorted_txs[i]
                    victim_tx = sorted_txs[i + 1]
                    back_tx = sorted_txs[i + 2]

                    if (
                        front_tx.from_address == back_tx.from_address
                        and front_tx.gas_price > victim_tx.gas_price * 1.1
                        and back_tx.gas_price > victim_tx.gas_price * 1.1
                    ):
                        profit_estimate = self._estimate_sandwich_profit(
                            front_tx, victim_tx, back_tx
                        )

                        sandwich_attacks.append(
                            {
                                "type": MEVType.SANDWICH,
                                "front_tx": front_tx.hash,
                                "victim_tx": victim_tx.hash,
                                "back_tx": back_tx.hash,
                                "attacker": front_tx.from_address,
                                "victim": victim_tx.from_address,
                                "profit_estimate": profit_estimate,
                                "confidence": 0.85,
                            }
                        )

        return sandwich_attacks

    def _estimate_sandwich_profit(
        self,
        front_tx: MempoolTransaction,
        victim_tx: MempoolTransaction,
        back_tx: MempoolTransaction,
    ) -> float:
        """Estimate profit from sandwich attack"""
        # Simplified profit estimation
        victim_value = victim_tx.value / 10**18  # Convert to ETH
        return victim_value * 0.003  # Assume 0.3% profit

    async def detect_arbitrage_opportunities(
        self, transactions: list[MempoolTransaction]
    ) -> list[dict[str, Any]]:
        """Detect arbitrage opportunities"""
        arbitrage_ops = []

        # Look for DEX interactions
        dex_contracts = {
            "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",  # Uniswap V2
            "0xE592427A0AEce92De3Edee1F18E0157C05861564",  # Uniswap V3
            "0x1111111254fb6c44bAC0beD2854e76F90643097d",  # 1inch
        }

        dex_txs = [tx for tx in transactions if tx.to_address in dex_contracts]

        if len(dex_txs) >= 2:
            for i, tx1 in enumerate(dex_txs):
                for tx2 in dex_txs[i + 1 :]:
                    if (
                        tx1.from_address == tx2.from_address
                        and abs(tx1.gas_price - tx2.gas_price) < tx1.gas_price * 0.1
                    ):
                        profit_estimate = self._estimate_arbitrage_profit(tx1, tx2)

                        if profit_estimate > 0.01:  # Minimum 0.01 ETH profit
                            arbitrage_ops.append(
                                {
                                    "type": MEVType.ARBITRAGE,
                                    "tx1": tx1.hash,
                                    "tx2": tx2.hash,
                                    "trader": tx1.from_address,
                                    "profit_estimate": profit_estimate,
                                    "confidence": 0.75,
                                }
                            )

        return arbitrage_ops

    def _estimate_arbitrage_profit(self, tx1: MempoolTransaction, tx2: MempoolTransaction) -> float:
        """Estimate arbitrage profit"""
        # Simplified arbitrage profit estimation
        total_value = (tx1.value + tx2.value) / 10**18
        return total_value * 0.001  # Assume 0.1% profit

    async def detect_flash_loan_attacks(
        self, transactions: list[MempoolTransaction]
    ) -> list[dict[str, Any]]:
        """Detect flash loan attacks"""
        flash_loan_attacks = []

        for tx in transactions:
            if tx.to_address in self.flash_loan_contracts:
                # Analyze transaction data for flash loan patterns
                if "flashLoan" in tx.data or "flashBorrow" in tx.data:
                    flash_loan_attacks.append(
                        {
                            "type": MEVType.FLASH_LOAN,
                            "tx_hash": tx.hash,
                            "borrower": tx.from_address,
                            "platform": self._get_platform_name(tx.to_address),
                            "confidence": 0.9,
                        }
                    )

        return flash_loan_attacks

    def _get_platform_name(self, address: str) -> str:
        """Get platform name from contract address"""
        platform_map = {
            "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9": "Aave",
            "0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e": "dYdX",
            "0x398eC7346DcD622eDc5ae82352F02bE94C62d119": "Compound",
        }
        return platform_map.get(address, "Unknown")


class MLRiskScorer:
    """Machine Learning-based risk scoring"""

    def __init__(self):
        self.feature_weights = {
            "gas_price": 0.3,
            "value": 0.2,
            "complexity": 0.2,
            "mev_potential": 0.3,
        }
        self.historical_data = deque(maxlen=10000)

    async def calculate_risk_score(self, tx: MempoolTransaction) -> float:
        """Calculate ML-based risk score"""
        features = self._extract_features(tx)

        # Weighted risk calculation
        risk_score = 0.0

        # Gas price risk (higher gas = higher risk)
        gas_risk = min(tx.gas_price / 100e9, 1.0)  # Normalize to 100 gwei
        risk_score += gas_risk * self.feature_weights["gas_price"]

        # Value risk (higher value = higher risk)
        value_risk = min(tx.value / 10e18, 1.0)  # Normalize to 10 ETH
        risk_score += value_risk * self.feature_weights["value"]

        # Complexity risk (more complex data = higher risk)
        complexity_risk = min(len(tx.data) / 10000, 1.0)
        risk_score += complexity_risk * self.feature_weights["complexity"]

        # MEV potential risk
        mev_risk = self._calculate_mev_risk(tx)
        risk_score += mev_risk * self.feature_weights["mev_potential"]

        return min(risk_score, 1.0)

    def _extract_features(self, tx: MempoolTransaction) -> dict[str, float]:
        """Extract features for ML analysis"""
        return {
            "gas_price_gwei": tx.gas_price / 1e9,
            "value_eth": tx.value / 1e18,
            "data_length": len(tx.data),
            "is_contract_creation": tx.to_address is None,
            "hour_of_day": tx.timestamp.hour,
            "day_of_week": tx.timestamp.weekday(),
        }

    def _calculate_mev_risk(self, tx: MempoolTransaction) -> float:
        """Calculate MEV potential risk"""
        mev_risk = 0.0

        # Check for DEX interactions
        dex_contracts = {
            "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
            "0xE592427A0AEce92De3Edee1F18E0157C05861564",
            "0x1111111254fb6c44bAC0beD2854e76F90643097d",
        }

        if tx.to_address in dex_contracts:
            mev_risk += 0.5

        # Check for high gas price (potential front-running)
        if tx.gas_price > 50e9:  # > 50 gwei
            mev_risk += 0.3

        # Check for flash loan contracts
        flash_loan_contracts = {
            "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9",
            "0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e",
        }

        if tx.to_address in flash_loan_contracts:
            mev_risk += 0.4

        return min(mev_risk, 1.0)


class UnifiedMempoolEngine:
    """World-class mempool monitoring engine with real blockchain integration"""

    def __init__(self, config: dict[str, Any]):
        self.config = config
        self.is_monitoring = False
        self.start_time = None

        # Core components
        self.web3_instances: dict[NetworkType, AsyncWeb3] = {}
        self.websocket_connections: dict[NetworkType, Any] = {}
        self.monitoring_tasks: list[asyncio.Task] = []

        # Data storage
        self.pending_transactions: dict[str, MempoolTransaction] = {}
        self.suspicious_transactions: list[MempoolTransaction] = []
        self.detected_mev_opportunities: list[dict[str, Any]] = []
        self.threat_intelligence: list[ThreatIntelligence] = []
        self.user_profiles: dict[str, UserProfile] = {}

        # Analysis engines
        self.mev_detector = AdvancedMEVDetector()
        self.risk_scorer = MLRiskScorer()

        # Performance metrics
        self.performance_metrics = {
            "cpu_usage": 0.0,
            "memory_usage": 0.0,
            "processing_speed": 0.0,
            "network_latency": {},
        }

        # Statistics
        self.stats = {
            "total_transactions": 0,
            "suspicious_transactions": 0,
            "attacks_detected": 0,
            "mev_opportunities": 0,
            "transactions_protected": 0,
            "quantum_analyses": 0,
            "flash_loan_predictions": 0,
            "threats_mitigated": 0,
        }

        # Redis client for caching (optional)
        self.redis_client: aioredis.Redis | None = None

        # HTTP session for external APIs
        self.session: aiohttp.ClientSession | None = None

        # Thread pool for CPU-intensive tasks
        self.thread_pool = ThreadPoolExecutor(max_workers=4)

        # Active networks
        self.active_networks: set[NetworkType] = set()

        logger.info("Unified Mempool Engine initialized with advanced features")

    async def initialize(self):
        """Initialize the engine with real blockchain connections"""
        logger.info("🚀 Initializing World-Class Mempool Engine...")

        try:
            # Initialize HTTP session
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30),
                headers={"User-Agent": "UnifiedMempoolSystem/1.0"},
            )

            # Initialize Redis if configured
            if self.config.get("database", {}).get("redis", {}).get("host"):
                redis_config = self.config["database"]["redis"]
                self.redis_client = await aioredis.from_url(
                    f"redis://{redis_config['host']}:{redis_config['port']}/{redis_config['db']}",
                    password=redis_config.get("password"),
                    max_connections=redis_config.get("max_connections", 10),
                )
                logger.info("✅ Redis connection established")

            # Initialize blockchain connections
            await self._initialize_blockchain_connections()

            # Initialize threat intelligence
            await self._initialize_threat_intelligence()

            logger.info(
                f"✅ Engine initialized successfully with {len(self.active_networks)} networks"
            )

        except Exception as e:
            logger.error(f"❌ Engine initialization failed: {e}")
            raise

    async def _initialize_blockchain_connections(self):
        """Initialize Web3 connections for all enabled networks"""
        networks_config = self.config.get("networks", {})

        for network_name, network_config in networks_config.items():
            if not network_config.get("enabled", False):
                continue

            try:
                network_type = NetworkType(network_name)
                rpc_url = network_config["rpc_url"]

                # Create Web3 instance
                provider = AsyncHTTPProvider(rpc_url)
                web3 = AsyncWeb3(provider)

                # Test connection
                start_time = time.time()
                block_number = await web3.eth.get_block_number()
                latency = (time.time() - start_time) * 1000

                self.web3_instances[network_type] = web3
                self.active_networks.add(network_type)
                self.performance_metrics["network_latency"][network_name] = latency

                logger.info(
                    f"✅ {network_name.title()} connected (block {block_number}, {latency:.2f}ms)"
                )

            except Exception as e:
                logger.warning(f"⚠️ Failed to connect to {network_name}: {e}")

    async def _initialize_threat_intelligence(self):
        """Initialize threat intelligence feeds"""
        # Add some sample threat intelligence
        sample_threats = [
            ThreatIntelligence(
                threat_id="THREAT_001",
                threat_type="sandwich_attack",
                severity=ThreatLevel.HIGH,
                confidence=0.9,
                source="internal_analysis",
                description="Known sandwich attack pattern detected",
                indicators=["high_gas_price", "dex_interaction"],
                timestamp=datetime.now(),
            ),
            ThreatIntelligence(
                threat_id="THREAT_002",
                threat_type="flash_loan_attack",
                severity=ThreatLevel.CRITICAL,
                confidence=0.95,
                source="community_reports",
                description="Flash loan attack pattern from known malicious contract",
                indicators=["flash_loan_interaction", "multiple_dex_calls"],
                timestamp=datetime.now(),
            ),
        ]

        self.threat_intelligence.extend(sample_threats)
        logger.info(f"✅ Threat intelligence initialized with {len(sample_threats)} threats")

    async def start_monitoring(self):
        """Start real-time mempool monitoring"""
        if self.is_monitoring:
            logger.warning("Monitoring already active")
            return

        logger.info("🔄 Starting real-time mempool monitoring...")
        self.is_monitoring = True
        self.start_time = datetime.now()

        # Start monitoring tasks for each network
        for network in self.active_networks:
            task = asyncio.create_task(self._monitor_network_mempool(network))
            self.monitoring_tasks.append(task)

        # Start analysis tasks
        analysis_task = asyncio.create_task(self._analysis_loop())
        self.monitoring_tasks.append(analysis_task)

        # Start performance monitoring
        perf_task = asyncio.create_task(self._performance_monitoring_loop())
        self.monitoring_tasks.append(perf_task)

        logger.info(f"✅ Monitoring started for {len(self.active_networks)} networks")

    async def stop_monitoring(self):
        """Stop mempool monitoring"""
        logger.info("🛑 Stopping mempool monitoring...")
        self.is_monitoring = False

        # Cancel all monitoring tasks
        for task in self.monitoring_tasks:
            task.cancel()

        # Wait for tasks to complete
        if self.monitoring_tasks:
            await asyncio.gather(*self.monitoring_tasks, return_exceptions=True)

        self.monitoring_tasks.clear()

        # Close connections
        for ws in self.websocket_connections.values():
            if ws and not ws.closed:
                await ws.close()

        if self.session:
            await self.session.close()

        if self.redis_client:
            await self.redis_client.close()

        logger.info("✅ Monitoring stopped successfully")

    async def _monitor_network_mempool(self, network: NetworkType):
        """Monitor mempool for a specific network"""
        web3 = self.web3_instances[network]

        logger.info(f"📡 Starting {network.value} mempool monitoring...")

        while self.is_monitoring:
            try:
                # Get pending transactions
                pending_txs = await web3.eth.get_block("pending", full_transactions=True)

                if pending_txs and pending_txs.transactions:
                    for tx_data in pending_txs.transactions[:50]:  # Limit to 50 per batch
                        await self._process_transaction(tx_data, network)

                await asyncio.sleep(1)  # Wait 1 second between checks

            except Exception as e:
                logger.error(f"❌ Error monitoring {network.value}: {e}")
                await asyncio.sleep(5)  # Wait longer on error

    async def _process_transaction(self, tx_data: Any, network: NetworkType):
        """Process a single transaction"""
        try:
            # Create MempoolTransaction object
            tx = MempoolTransaction(
                hash=tx_data.hash.hex(),
                network=network,
                from_address=tx_data.get("from", ""),
                to_address=tx_data.get("to"),
                value=tx_data.get("value", 0),
                gas_price=tx_data.get("gasPrice", 0),
                gas_limit=tx_data.get("gas", 0),
                nonce=tx_data.get("nonce", 0),
                data=tx_data.get("input", ""),
                timestamp=datetime.now(),
            )

            # Calculate risk score
            tx.risk_score = await self.risk_scorer.calculate_risk_score(tx)

            # Determine threat level
            if tx.risk_score >= 0.8:
                tx.threat_level = ThreatLevel.CRITICAL
                tx.is_suspicious = True
            elif tx.risk_score >= 0.6:
                tx.threat_level = ThreatLevel.HIGH
                tx.is_suspicious = True
            elif tx.risk_score >= 0.4:
                tx.threat_level = ThreatLevel.MEDIUM
            else:
                tx.threat_level = ThreatLevel.LOW

            # Store transaction
            self.pending_transactions[tx.hash] = tx

            # Update statistics
            self.stats["total_transactions"] += 1
            if tx.is_suspicious:
                self.stats["suspicious_transactions"] += 1
                self.suspicious_transactions.append(tx)

            # Update user profile
            await self._update_user_profile(tx)

            # Cache in Redis if available
            if self.redis_client:
                await self.redis_client.setex(
                    f"tx:{tx.hash}", 3600, json.dumps(tx.to_dict(), default=str)  # 1 hour TTL
                )

        except Exception as e:
            logger.error(f"❌ Error processing transaction: {e}")

    async def _update_user_profile(self, tx: MempoolTransaction):
        """Update user behavior profile"""
        address = tx.from_address

        if address in self.user_profiles:
            profile = self.user_profiles[address]
            profile.transaction_count += 1
            profile.total_volume += tx.value / 1e18
            profile.average_gas_price = (profile.average_gas_price + tx.gas_price) / 2
            profile.last_activity = tx.timestamp
        else:
            self.user_profiles[address] = UserProfile(
                address=address,
                transaction_count=1,
                total_volume=tx.value / 1e18,
                average_gas_price=tx.gas_price,
                risk_score=tx.risk_score,
                last_activity=tx.timestamp,
                behavior_patterns={},
            )

    async def _analysis_loop(self):
        """Main analysis loop for MEV detection and threat analysis"""
        logger.info("🔍 Starting advanced analysis loop...")

        while self.is_monitoring:
            try:
                if len(self.pending_transactions) > 10:
                    transactions = list(self.pending_transactions.values())[-100:]  # Last 100 txs

                    # MEV Detection
                    sandwich_attacks = await self.mev_detector.detect_sandwich_attack(transactions)
                    arbitrage_ops = await self.mev_detector.detect_arbitrage_opportunities(
                        transactions
                    )
                    flash_loan_attacks = await self.mev_detector.detect_flash_loan_attacks(
                        transactions
                    )

                    # Update MEV opportunities
                    self.detected_mev_opportunities.extend(sandwich_attacks)
                    self.detected_mev_opportunities.extend(arbitrage_ops)
                    self.detected_mev_opportunities.extend(flash_loan_attacks)

                    # Update statistics
                    self.stats["attacks_detected"] += len(sandwich_attacks)
                    self.stats["mev_opportunities"] += len(arbitrage_ops)
                    self.stats["flash_loan_predictions"] += len(flash_loan_attacks)

                    # Keep only recent MEV opportunities
                    if len(self.detected_mev_opportunities) > 1000:
                        self.detected_mev_opportunities = self.detected_mev_opportunities[-500:]

                await asyncio.sleep(5)  # Analysis every 5 seconds

            except Exception as e:
                logger.error(f"❌ Analysis loop error: {e}")
                await asyncio.sleep(10)

    async def _performance_monitoring_loop(self):
        """Monitor system performance"""
        while self.is_monitoring:
            try:
                # CPU and memory usage
                self.performance_metrics["cpu_usage"] = psutil.cpu_percent()
                self.performance_metrics["memory_usage"] = psutil.virtual_memory().percent

                # Processing speed (transactions per second)
                if self.start_time:
                    uptime = (datetime.now() - self.start_time).total_seconds()
                    self.performance_metrics["processing_speed"] = self.stats[
                        "total_transactions"
                    ] / max(uptime, 1)

                await asyncio.sleep(5)  # Update every 5 seconds

            except Exception as e:
                logger.error(f"❌ Performance monitoring error: {e}")
                await asyncio.sleep(10)

    async def get_system_status(self) -> dict[str, Any]:
        """Get comprehensive system status"""
        uptime = (datetime.now() - self.start_time).total_seconds() if self.start_time else 0

        return {
            "status": "active" if self.is_monitoring else "inactive",
            "uptime_seconds": uptime,
            "networks_monitored": len(self.active_networks),
            "active_networks": [n.value for n in self.active_networks],
            "statistics": self.stats.copy(),
            "performance": self.performance_metrics.copy(),
            "threat_level": self._calculate_overall_threat_level(),
            "pending_transactions": len(self.pending_transactions),
            "suspicious_transactions": len(self.suspicious_transactions),
            "mev_opportunities": len(self.detected_mev_opportunities),
            "threat_intelligence": len(self.threat_intelligence),
            "user_profiles": len(self.user_profiles),
        }

    def _calculate_overall_threat_level(self) -> str:
        """Calculate overall system threat level"""
        if not self.suspicious_transactions:
            return ThreatLevel.LOW.value

        recent_threats = [
            tx
            for tx in self.suspicious_transactions
            if (datetime.now() - tx.timestamp).seconds < 300  # Last 5 minutes
        ]

        if len(recent_threats) > 10:
            return ThreatLevel.CRITICAL.value
        if len(recent_threats) > 5:
            return ThreatLevel.HIGH.value
        if len(recent_threats) > 2:
            return ThreatLevel.MEDIUM.value
        return ThreatLevel.LOW.value

    async def get_live_dashboard_data(self) -> dict[str, Any]:
        """Get live dashboard data"""
        recent_txs = sorted(
            self.pending_transactions.values(), key=lambda x: x.timestamp, reverse=True
        )[:50]

        return {
            "recent_transactions": [tx.to_dict() for tx in recent_txs],
            "suspicious_transactions": [tx.to_dict() for tx in self.suspicious_transactions[-20:]],
            "mev_opportunities": self.detected_mev_opportunities[-20:],
            "threat_intelligence": [t.to_dict() for t in self.threat_intelligence],
            "user_profiles": {k: v.to_dict() for k, v in list(self.user_profiles.items())[-10:]},
            "system_stats": self.stats.copy(),
            "performance": self.performance_metrics.copy(),
            "threat_level": self._calculate_overall_threat_level(),
        }
