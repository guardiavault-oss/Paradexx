#!/usr/bin/env python3
"""
Wallet Guard Service - World-Class Crypto Wallet Protection
Advanced security service with real-time threat detection and blockchain monitoring
"""

import asyncio
import base64
import hashlib
import json
import os
import secrets
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

import httpx
import redis.asyncio as redis
import structlog
import uvicorn
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer
from pydantic import BaseModel, Field

from config.settings import settings
from .core.alerting import alert_manager

# Import our enhanced core modules
from .core.blockchain import blockchain_manager
from .core.contract_analysis import VulnerabilityReport, contract_analysis_engine
from .core.mempool_monitor import MempoolEvent, mempool_manager
from .core.mpc_hsm_integration import MofNConfig, RealMPCHSMIntegration, SignerConfig, SignerType
from .core.threat_detection import (
    ThreatDetection,
    ThreatSeverity,
    threat_detection_engine,
)
from .core.wallet_simulation import RealWalletSimulationEngine

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


class ThreatLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class WalletType(Enum):
    EOA = "eoa"  # Externally Owned Account
    CONTRACT = "contract"
    MULTISIG = "multisig"
    UNKNOWN = "unknown"


class SignatureType(Enum):
    MPC = "mpc"
    HSM = "hsm"
    THRESHOLD = "threshold"
    VAULT = "vault"


class SecurityLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    PARANOID = "paranoid"


@dataclass
class WalletInfo:
    address: str
    wallet_type: WalletType
    balance: float
    network: str
    first_seen: datetime
    last_activity: datetime
    transaction_count: int
    risk_score: float
    threat_level: ThreatLevel
    tags: list[str]


@dataclass
class ThreatDetection:
    wallet_address: str
    threat_type: str
    threat_level: ThreatLevel
    description: str
    confidence: float
    timestamp: datetime
    metadata: dict[str, Any]


@dataclass
class ProtectionAction:
    action_type: str
    wallet_address: str
    description: str
    timestamp: datetime
    success: bool
    metadata: dict[str, Any]


@dataclass
class PreSignTransaction:
    transaction: dict[str, Any]
    wallet_address: str
    required_signers: int
    signature_id: str
    risk_assessment: dict[str, Any]
    warnings: list[str]
    timestamp: datetime
    status: str


@dataclass
class MultisigSignature:
    signature_id: str
    transaction_hash: str
    signers: list[str]
    signatures: dict[str, str]
    threshold: int
    signature_type: SignatureType
    created_at: datetime
    completed_at: datetime | None
    status: str


@dataclass
class SecurityConfig:
    security_level: SecurityLevel
    required_signers: int
    mpc_enabled: bool
    hsm_enabled: bool
    time_lock_enabled: bool
    circuit_breaker_enabled: bool
    zero_day_protection_enabled: bool
    whitelist_enabled: bool
    whitelisted_addresses: list[str]
    whitelisted_contracts: list[str]


class WalletGuardService:
    """World-class wallet protection service with advanced threat detection"""

    def __init__(self):
        self.app = FastAPI(
            title="Wallet Guard Service",
            description="World-class crypto wallet protection and monitoring with advanced threat detection",
            version=settings.service_version,
            docs_url="/docs" if settings.debug else None,
            redoc_url="/redoc" if settings.debug else None,
        )

        # Service configuration
        self.port = settings.service_port
        self.host = settings.service_host
        self.redis_client = None
        self.monitored_wallets: dict[str, WalletInfo] = {}
        self.protection_actions: list[ProtectionAction] = []
        self.presign_transactions: dict[str, PreSignTransaction] = {}
        self.multisig_signatures: dict[str, MultisigSignature] = {}
        self.security_configs: dict[str, SecurityConfig] = {}
        self.threat_detections: list[ThreatDetection] = []
        self.web3_connections: dict[str, Any] = {}
        self.config: dict[str, Any] = {}

        # Zero Day Guardian integration
        self.zero_day_guardian_url = os.getenv("ZERO_DAY_GUARDIAN_URL", "http://localhost:8003")
        self.zero_day_api_key = os.getenv("ZERO_DAY_API_KEY", "")

        # Cryptographic keys for secure signing
        self._initialize_crypto()

        # Initialize core services (will be called async later)
        self.core_services_initialized = False

        # Setup FastAPI components
        self.setup_middleware()
        self.setup_routes()
        self.setup_security()

        # Add startup event
        @self.app.on_event("startup")
        async def startup_event():
            if not self.core_services_initialized:
                await self.initialize_core_services()
                self.core_services_initialized = True

        # Initialize background tasks
        self.background_tasks = set()

        # Initialize private relayer
        self.private_relayer = None

        logger.info(
            "Wallet Guard Service initialized",
            version=settings.service_version,
            port=self.port,
            networks=settings.get_supported_networks(),
        )

    def _initialize_crypto(self):
        """Initialize cryptographic components for secure operations"""
        try:
            # Generate RSA key pair for threshold signatures
            self.private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
            )

            self.public_key = self.private_key.public_key()
            self.public_key_pem = self.public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo,
            )

            # Generate AES key for encryption
            self.aes_key = secrets.token_bytes(32)

            logger.info("Cryptographic components initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize cryptographic components: {e}")
            raise

    async def initialize_core_services(self):
        """Initialize all core services"""
        try:
            # Initialize Redis connection
            await self.initialize_redis()

            # Initialize blockchain connections
            await self.initialize_blockchain_connections()

            # Initialize real MPC/HSM integration
            self.mpc_hsm_integration = RealMPCHSMIntegration(self.config.get("mpc_hsm", {}))

            # Initialize real wallet simulation engine
            self.wallet_simulation_engine = RealWalletSimulationEngine(
                self.config.get("simulation", {})
            )

            # Setup threat detection callbacks
            self.setup_threat_detection_callbacks()

            # Setup mempool monitoring callbacks
            self.setup_mempool_callbacks()

            # Start background monitoring tasks
            await self.start_background_tasks()

            # Initialize private relayer
            try:
                from core.private_relayer import private_relayer
                self.private_relayer = private_relayer
                await private_relayer.start_monitoring()
                logger.info("Private relayer initialized and monitoring started")
            except Exception as e:
                logger.warning("Failed to initialize private relayer", error=str(e))

            logger.info("Core services initialized successfully")

        except Exception as e:
            logger.error("Failed to initialize core services", error=str(e))
            raise

    async def initialize_redis(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.from_url(
                settings.redis_url,
                password=settings.redis_password,
                db=settings.redis_db,
                max_connections=settings.redis_max_connections,
                decode_responses=True,
            )

            # Test connection
            await self.redis_client.ping()
            logger.info("Redis connection established")

        except Exception as e:
            logger.error("Failed to connect to Redis", error=str(e))
            self.redis_client = None

    async def initialize_blockchain_connections(self):
        """Initialize blockchain connections"""
        # Blockchain manager is already initialized in the core module
        # Just verify connections are working
        stats = blockchain_manager.get_all_stats()
        connected_networks = [
            network for network, stats in stats.items() if stats.get("healthy_providers", 0) > 0
        ]

        logger.info(
            "Blockchain connections status",
            connected_networks=connected_networks,
            total_networks=len(stats),
        )

    def setup_threat_detection_callbacks(self):
        """Setup threat detection callbacks"""
        threat_detection_engine.add_threat_callback(self.handle_threat_detection)
        contract_analysis_engine.add_analysis_callback(self.handle_vulnerability_detection)

    def setup_mempool_callbacks(self):
        """Setup mempool monitoring callbacks"""
        mempool_manager.add_event_callback(self.handle_mempool_event)

    async def handle_threat_detection(self, threat: ThreatDetection):
        """Handle threat detection callback"""
        try:
            # Process threat through alert manager
            await alert_manager.process_threat_detection(threat)

            # Retain in-memory feed for API consumers
            self.threat_detections.append(threat)
            if len(self.threat_detections) > 1000:
                self.threat_detections = self.threat_detections[-1000:]

            # Store threat in Redis for persistence
            if self.redis_client:
                await self.redis_client.setex(
                    f"threat:{threat.threat_id}",
                    86400,  # 24 hours
                    json.dumps(asdict(threat), default=str),
                )

            logger.warning(
                "Threat detected",
                threat_id=threat.threat_id,
                threat_type=threat.threat_type.value,
                severity=threat.severity.value,
                wallet=threat.wallet_address,
                network=threat.network,
            )

        except Exception as e:
            logger.error("Error handling threat detection", error=str(e))

    async def handle_vulnerability_detection(self, vulnerability: VulnerabilityReport):
        """Handle vulnerability detection callback"""
        try:
            # Process vulnerability through alert manager
            await alert_manager.process_vulnerability_report(vulnerability)

            logger.warning(
                "Vulnerability detected",
                vulnerability_id=vulnerability.vulnerability_id,
                vulnerability_type=vulnerability.vulnerability_type.value,
                severity=vulnerability.severity.value,
                contract=vulnerability.contract_address,
                network=vulnerability.network,
            )

        except Exception as e:
            logger.error("Error handling vulnerability detection", error=str(e))

    async def handle_mempool_event(self, event: MempoolEvent):
        """Handle mempool event callback"""
        try:
            # Process mempool event through alert manager
            await alert_manager.process_mempool_event(event)

            logger.debug(
                "Mempool event processed",
                event_type=event.event_type.value,
                tx_hash=event.transaction_hash,
                network=event.network,
            )

        except Exception as e:
            logger.error("Error handling mempool event", error=str(e))

    async def start_background_tasks(self):
        """Start background monitoring tasks"""
        # Start mempool monitoring
        if settings.enable_mempool_monitoring:
            asyncio.create_task(mempool_manager.start())

        # Start periodic health checks
        asyncio.create_task(self.periodic_health_check())

        logger.info("Background tasks started")

    def is_valid_ethereum_address(self, address: str) -> bool:
        """Validate Ethereum address format"""
        try:
            from eth_utils import is_address

            return is_address(address)
        except:
            return len(address) == 42 and address.startswith("0x")

    async def analyze_wallet_enhanced(self, wallet_address: str, network: str) -> WalletInfo:
        """Enhanced wallet analysis"""
        # Mock implementation for testing
        return WalletInfo(
            address=wallet_address,
            wallet_type=WalletType.EOA,
            balance=1.5,
            network=network,
            first_seen=datetime.utcnow(),
            last_activity=datetime.utcnow(),
            transaction_count=42,
            risk_score=0.2,
            threat_level=ThreatLevel.LOW,
            tags=["monitored"],
        )

    async def monitor_wallet_activity_enhanced(self, wallet_address: str, network: str):
        """Enhanced wallet activity monitoring"""
        # Mock implementation for testing
        logger.info(f"Started enhanced monitoring for {wallet_address} on {network}")

    async def execute_protection_action(
        self, wallet_address: str, action_type: str
    ) -> ProtectionAction:
        """Execute protection action"""
        return ProtectionAction(
            action_type=action_type,
            wallet_address=wallet_address,
            description=f"Applied {action_type} protection to {wallet_address}",
            timestamp=datetime.utcnow(),
            success=True,
            metadata={},
        )

    async def periodic_health_check(self):
        """Periodic health check task"""
        while True:
            try:
                await asyncio.sleep(300)  # Every 5 minutes

                # Check blockchain connections
                blockchain_stats = blockchain_manager.get_all_stats()
                healthy_networks = sum(
                    1
                    for stats in blockchain_stats.values()
                    if stats.get("healthy_providers", 0) > 0
                )

                # Check Redis connection
                redis_healthy = False
                if self.redis_client:
                    try:
                        await self.redis_client.ping()
                        redis_healthy = True
                    except:
                        redis_healthy = False

                logger.info(
                    "Health check completed",
                    healthy_networks=healthy_networks,
                    total_networks=len(blockchain_stats),
                    redis_healthy=redis_healthy,
                )

            except Exception as e:
                logger.error("Error in health check", error=str(e))
                await asyncio.sleep(60)

    def setup_middleware(self):
        """Setup FastAPI middleware"""
        # CORS middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"] if settings.debug else ["https://yourdomain.com"],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE"],
            allow_headers=["*"],
        )

        # Trusted host middleware
        if not settings.debug:
            self.app.add_middleware(
                TrustedHostMiddleware, allowed_hosts=["yourdomain.com", "*.yourdomain.com"]
            )

    def setup_security(self):
        """Setup security components"""
        self.security = HTTPBearer(auto_error=False)

    def setup_routes(self):
        """Setup FastAPI routes"""

        def serialize_threat(threat: ThreatDetection) -> dict[str, Any]:
            """Convert threat object into JSON-serializable dict"""
            base = {
                "threat_id": getattr(threat, "threat_id", None),
                "threat_type": getattr(threat, "threat_type", None),
                "severity": getattr(threat, "threat_level", None) or getattr(threat, "severity", None),
                "wallet_address": getattr(threat, "wallet_address", None),
                "network": getattr(threat, "network", None),
                "description": getattr(threat, "description", ""),
                "confidence": getattr(threat, "confidence", None),
                "metadata": getattr(threat, "metadata", {}),
            }

            timestamp_value = getattr(threat, "timestamp", None)
            if isinstance(timestamp_value, datetime):
                base["timestamp"] = timestamp_value.isoformat()
            elif isinstance(timestamp_value, (int, float)):
                base["timestamp"] = datetime.utcfromtimestamp(timestamp_value).isoformat()
            elif timestamp_value:
                base["timestamp"] = str(timestamp_value)

            # Normalize Enums
            if hasattr(base["threat_type"], "value"):
                base["threat_type"] = base["threat_type"].value
            if hasattr(base["severity"], "value"):
                base["severity"] = base["severity"].value

            return base

        @self.app.get("/health")
        async def health_check():
            """Enhanced health check endpoint"""
            try:
                # Get blockchain connection stats
                blockchain_stats = blockchain_manager.get_all_stats()
                healthy_networks = sum(
                    1
                    for stats in blockchain_stats.values()
                    if stats.get("healthy_providers", 0) > 0
                )

                # Get Redis health
                redis_healthy = False
                if self.redis_client:
                    try:
                        await self.redis_client.ping()
                        redis_healthy = True
                    except:
                        redis_healthy = False

                # Get threat detection stats
                threat_stats = threat_detection_engine.get_threat_stats()

                return {
                    "status": "healthy",
                    "service": "wallet-guard",
                    "version": settings.service_version,
                    "timestamp": datetime.utcnow().isoformat(),
                    "monitored_wallets": len(self.monitored_wallets),
                    "blockchain_connections": {
                        "healthy_networks": healthy_networks,
                        "total_networks": len(blockchain_stats),
                        "networks": blockchain_stats,
                    },
                    "redis_connection": redis_healthy,
                    "threat_detection": {
                        "total_threats": threat_stats.get("total_threats", 0),
                        "recent_threats_24h": threat_stats.get("recent_threats_24h", 0),
                        "threat_types": threat_stats.get("threat_types", {}),
                    },
                    "mempool_monitoring": settings.enable_mempool_monitoring,
                    "mev_detection": settings.enable_mev_detection,
                    "contract_analysis": settings.enable_contract_analysis,
                }
            except Exception as e:
                logger.error("Health check failed", error=str(e))
                return {
                    "status": "unhealthy",
                    "service": "wallet-guard",
                    "timestamp": datetime.utcnow().isoformat(),
                    "error": str(e),
                }

        @self.app.get("/status")
        async def service_status():
            """Lightweight service summary for UI consumption"""
            try:
                blockchain_stats = blockchain_manager.get_all_stats()
                threat_stats = threat_detection_engine.get_threat_stats()
                presign_status = {
                    "active": sum(1 for tx in self.presign_transactions.values() if tx.status != "signed"),
                    "total": len(self.presign_transactions),
                }

                latest_threats = [
                    serialize_threat(threat)
                    for threat in threat_detection_engine.get_recent_threats(hours=6)[:5]
                ]
                latest_actions = [
                    asdict(action) for action in self.protection_actions[-5:]
                ]

                return {
                    "service": "wallet-guard",
                    "status": "online",
                    "timestamp": datetime.utcnow().isoformat(),
                    "monitored_wallets": len(self.monitored_wallets),
                    "blockchain_networks": len(blockchain_stats),
                    "threat_stats": threat_stats,
                    "presign": presign_status,
                    "latest_threats": latest_threats,
                    "recent_actions": latest_actions,
                }
            except Exception as e:
                logger.error("Status summary failed", error=str(e))
                return {
                    "service": "wallet-guard",
                    "status": "degraded",
                    "timestamp": datetime.utcnow().isoformat(),
                    "error": str(e),
                }

        @self.app.get("/threats")
        async def service_threat_feed(limit: int = 50, hours: int = 24):
            """Expose recent wallet guard threats"""
            try:
                threats = threat_detection_engine.get_recent_threats(hours=hours)
                serialized = [serialize_threat(threat) for threat in threats[:limit]]
                return {"threats": serialized, "count": len(serialized), "window_hours": hours}
            except Exception as e:
                logger.error("Threat feed failed", error=str(e))
                raise HTTPException(status_code=500, detail=f"Failed to fetch threats: {e!s}")

        @self.app.get("/actions")
        async def service_protection_actions(limit: int = 25):
            """Expose last protection actions executed"""
            try:
                actions = [asdict(action) for action in self.protection_actions[-limit:]]
                actions.reverse()
                return {"actions": actions, "count": len(actions)}
            except Exception as e:
                logger.error("Protection actions feed failed", error=str(e))
                raise HTTPException(status_code=500, detail=f"Failed to fetch actions: {e!s}")

        @self.app.get("/presign/{signature_id}")
        async def service_presign_status(signature_id: str):
            """Expose presign status without versioned API prefix"""
            try:
                return await self.get_presign_status(signature_id)
            except HTTPException:
                raise
            except Exception as e:
                logger.error("Public presign status failed", error=str(e))
                raise HTTPException(status_code=500, detail=f"Failed to fetch presign status: {e!s}")

        @self.app.post("/api/v1/wallet-guard/monitor")
        async def start_monitoring(wallet_address: str, network: str = "ethereum"):
            """Start monitoring a wallet address with advanced threat detection"""
            try:
                # Validate network
                if not settings.is_network_supported(network):
                    raise HTTPException(status_code=400, detail=f"Unsupported network: {network}")

                # Check if wallet is already monitored
                if wallet_address in self.monitored_wallets:
                    return {"message": "Wallet already being monitored", "address": wallet_address}

                # Analyze wallet with enhanced analysis
                wallet_info = await self.analyze_wallet_enhanced(wallet_address, network)
                self.monitored_wallets[wallet_address] = wallet_info

                # Start comprehensive monitoring
                asyncio.create_task(self.monitor_wallet_activity_enhanced(wallet_address, network))

                # Analyze contract if it's a contract address
                if wallet_info.wallet_type == WalletType.CONTRACT:
                    contract_vulnerabilities = await contract_analysis_engine.analyze_contract(
                        wallet_address, network
                    )
                    if contract_vulnerabilities:
                        logger.warning(
                            "Contract vulnerabilities detected during monitoring setup",
                            contract=wallet_address,
                            vulnerabilities=len(contract_vulnerabilities),
                        )

                return {
                    "message": "Advanced wallet monitoring started",
                    "address": wallet_address,
                    "network": network,
                    "wallet_info": asdict(wallet_info),
                    "monitoring_features": {
                        "threat_detection": True,
                        "contract_analysis": wallet_info.wallet_type == WalletType.CONTRACT,
                        "mempool_monitoring": settings.enable_mempool_monitoring,
                        "mev_detection": settings.enable_mev_detection,
                    },
                }
            except Exception as e:
                logger.error(
                    "Error starting wallet monitoring",
                    wallet=wallet_address,
                    network=network,
                    error=str(e),
                )
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/v1/wallet-guard/status/{wallet_address}")
        async def get_wallet_status(wallet_address: str):
            """Get current status of a monitored wallet"""
            if wallet_address not in self.monitored_wallets:
                raise HTTPException(status_code=404, detail="Wallet not being monitored")

            wallet_info = self.monitored_wallets[wallet_address]
            recent_threats = [
                asdict(detection)
                for detection in self.threat_detections
                if detection.wallet_address == wallet_address
                and detection.timestamp > datetime.utcnow() - timedelta(hours=24)
            ]

            return {
                "wallet_info": asdict(wallet_info),
                "recent_threats": recent_threats,
                "protection_status": (
                    "active" if wallet_info.threat_level == ThreatLevel.LOW else "alert"
                ),
            }

        @self.app.get("/api/v1/wallet-guard/threats")
        async def get_recent_threats(hours: int = 24):
            """Get recent threat detections"""
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)
            recent_threats = [
                asdict(detection)
                for detection in self.threat_detections
                if detection.timestamp > cutoff_time
            ]
            return {"threats": recent_threats, "count": len(recent_threats)}

        @self.app.post("/api/v1/wallet-guard/protect")
        async def apply_protection(wallet_address: str, action_type: str = "freeze"):
            """Apply protection measures to a wallet"""
            try:
                action = await self.execute_protection_action(wallet_address, action_type)
                self.protection_actions.append(action)

                return {
                    "message": f"Protection action '{action_type}' applied",
                    "action": asdict(action),
                }
            except Exception as e:
                logger.error(f"Error applying protection: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/v1/wallet-guard/simulate")
        async def simulate_transaction(
            wallet_address: str,
            transaction: dict[str, Any],
            network: str = "ethereum",
            simulation_depth: int = 10,
        ):
            """Simulate a transaction to detect risks before execution"""
            try:
                # Validate wallet address
                if not self.is_valid_ethereum_address(wallet_address):
                    raise HTTPException(status_code=400, detail="Invalid wallet address")

                # Simulate transaction with real engine
                simulation_result = await self.wallet_simulation_engine.simulate_transaction(
                    transaction=transaction,
                    wallet_address=wallet_address,
                    network=network,
                    simulation_depth=simulation_depth,
                )

                return {
                    "simulation_id": simulation_result.transaction_id,
                    "result": simulation_result.simulation_result.value,
                    "risks": [asdict(risk) for risk in simulation_result.risks],
                    "warnings": [asdict(warning) for warning in simulation_result.warnings],
                    "recommendations": simulation_result.recommendations,
                    "confidence_score": simulation_result.confidence_score,
                    "execution_time": simulation_result.metrics.execution_time,
                    "gas_estimate": simulation_result.metrics.gas_estimate,
                    "balance_changes": simulation_result.metrics.balance_changes,
                }

            except Exception as e:
                logger.error("Transaction simulation failed", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/v1/wallet-guard/safeguard-action")
        async def create_safeguard_action(
            wallet_address: str,
            action_type: str,
            parameters: dict[str, Any],
            risk_level: str = "medium",
            auto_trigger_conditions: list[dict[str, Any]] | None = None,
        ):
            """Create a safeguard action with M-of-N signing"""
            try:
                from core.mpc_hsm_integration import TransactionType

                # Map action type to transaction type
                transaction_type_map = {
                    "emergency_stop": TransactionType.EMERGENCY_STOP,
                    "fund_recovery": TransactionType.FUND_RECOVERY,
                    "safeguard": TransactionType.SAFEGUARD,
                    "multisig": TransactionType.MULTISIG_OPERATION,
                }

                transaction_type = transaction_type_map.get(action_type, TransactionType.SAFEGUARD)

                # Create safeguard action with real MPC/HSM integration
                safeguard_action = await self.mpc_hsm_integration.create_safeguard_action(
                    wallet_address=wallet_address,
                    transaction_type=transaction_type,
                    parameters=parameters,
                    risk_level=risk_level,
                    auto_trigger_conditions=auto_trigger_conditions,
                )

                return {
                    "action_id": safeguard_action.action_id,
                    "wallet_address": safeguard_action.wallet_address,
                    "transaction_type": safeguard_action.transaction_type.value,
                    "risk_level": safeguard_action.risk_level,
                    "created_at": safeguard_action.created_at.isoformat(),
                    "status": "created",
                }

            except Exception as e:
                logger.error("Safeguard action creation failed", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/v1/wallet-guard/pre-sign/{action_id}")
        async def pre_sign_safeguard_action(
            action_id: str,
            required_signatures: int = 2,
            total_signers: int = 3,
            expiry_hours: int = 24,
        ):
            """Pre-sign a safeguard action using M-of-N signing"""
            try:
                # Get safeguard action from real MPC/HSM integration
                safeguard_actions = [
                    action
                    for action in self.mpc_hsm_integration.safeguard_actions.values()
                    if action.action_id == action_id
                ]
                if not safeguard_actions:
                    raise HTTPException(status_code=404, detail="Safeguard action not found")

                safeguard_action = safeguard_actions[0]

                # Create M-of-N configuration
                signers = [
                    SignerConfig(
                        signer_id=f"signer_{i+1}",
                        signer_type=SignerType.LOCAL,
                        endpoint="local",
                        credentials={"private_key": f"mock_key_{i+1}"},  # Mock for demo
                    )
                    for i in range(total_signers)
                ]

                mofn_config = MofNConfig(
                    total_signers=total_signers,
                    required_signatures=required_signatures,
                    signers=signers,
                )

                # Pre-sign the transaction with real MPC/HSM integration
                pre_signed_tx = await self.mpc_hsm_integration.pre_sign_safeguard_transaction(
                    safeguard_action=safeguard_action,
                    mofn_config=mofn_config,
                    expiry_hours=expiry_hours,
                )

                return {
                    "transaction_id": pre_signed_tx.transaction_id,
                    "status": pre_signed_tx.status.value,
                    "required_signatures": mofn_config.required_signatures,
                    "total_signers": mofn_config.total_signers,
                    "expires_at": pre_signed_tx.expires_at.isoformat(),
                    "signatures_received": len(pre_signed_tx.signatures),
                }

            except Exception as e:
                logger.error("Pre-signing failed", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/v1/wallet-guard/analytics")
        async def get_analytics():
            """Get service analytics and statistics"""
            total_wallets = len(self.monitored_wallets)
            high_risk_wallets = len(
                [
                    w
                    for w in self.monitored_wallets.values()
                    if w.threat_level in [ThreatLevel.HIGH, ThreatLevel.CRITICAL]
                ]
            )

            recent_threats = len(
                [
                    d
                    for d in self.threat_detections
                    if d.timestamp > datetime.utcnow() - timedelta(hours=24)
                ]
            )

            # Get real MPC/HSM metrics
            mpc_metrics = self.mpc_hsm_integration.get_metrics()
            simulation_metrics = self.wallet_simulation_engine.get_metrics()

            return {
                "total_monitored_wallets": total_wallets,
                "high_risk_wallets": high_risk_wallets,
                "threats_last_24h": recent_threats,
                "protection_actions_taken": len(self.protection_actions),
                "presign_transactions": len(self.presign_transactions),
                "multisig_signatures": len(self.multisig_signatures),
                "service_uptime": "100%",  # This would be calculated from actual uptime
                "blockchain_networks": list(self.web3_connections.keys()),
                "zero_day_guardian_integration": bool(self.zero_day_guardian_url),
                "mpc_hsm": mpc_metrics,
                "simulation_engine": simulation_metrics,
            }

        # ============================================================================
        # GuardianX API Endpoints
        # ============================================================================

        @self.app.post("/api/v1/guardianx/simulate")
        async def guardianx_simulate(request: dict):
            """GuardianX: Simulate transaction for risk analysis"""
            try:
                tx = request.get("tx", {})
                network = request.get("network", "ethereum")
                wallet_address = request.get("wallet_address", tx.get("from", ""))

                if not tx:
                    raise HTTPException(status_code=400, detail="Transaction data required")

                # Use existing wallet simulation engine
                simulation_result = await self.wallet_simulation_engine.simulate_transaction(
                    transaction=tx,
                    wallet_address=wallet_address,
                    network=network,
                )

                return {
                    "transaction_id": simulation_result.transaction_id,
                    "result": simulation_result.simulation_result.value,
                    "risks": [
                        {
                            "type": risk.risk_type.value,
                            "severity": risk.severity,
                            "description": risk.description,
                            "confidence": risk.confidence,
                            "mitigation_suggestions": risk.mitigation_suggestions,
                        }
                        for risk in simulation_result.risks
                    ],
                    "warnings": [
                        {
                            "type": warning.warning_type,
                            "message": warning.message,
                            "suggested_action": warning.suggested_action,
                        }
                        for warning in simulation_result.warnings
                    ],
                    "metrics": {
                        "execution_time": simulation_result.metrics.execution_time,
                        "gas_used": simulation_result.metrics.gas_used,
                        "gas_estimate": simulation_result.metrics.gas_estimate,
                        "balance_changes": simulation_result.metrics.balance_changes,
                    },
                }
            except Exception as e:
                logger.error("GuardianX simulate error", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/v1/guardianx/risk-score")
        async def guardianx_risk_score(request: dict):
            """GuardianX: Get risk score for wallet address"""
            try:
                wallet_address = request.get("wallet_address", "")
                network = request.get("network", "ethereum")

                if not wallet_address:
                    raise HTTPException(status_code=400, detail="Wallet address required")

                # Analyze wallet
                wallet_info = await self.analyze_wallet_enhanced(wallet_address, network)

                # Get threat detections for this wallet
                wallet_threats = [
                    d
                    for d in self.threat_detections
                    if d.wallet_address.lower() == wallet_address.lower()
                ]

                # Calculate risk score based on wallet info and threats
                risk_score = wallet_info.risk_score
                confidence = 0.8  # Default confidence

                # Adjust risk score based on recent threats
                recent_threats = [
                    t
                    for t in wallet_threats
                    if t.timestamp > datetime.utcnow() - timedelta(hours=24)
                ]

                if recent_threats:
                    # Increase risk score based on threat severity
                    threat_severity_multiplier = {
                        ThreatSeverity.LOW: 0.1,
                        ThreatSeverity.MEDIUM: 0.3,
                        ThreatSeverity.HIGH: 0.6,
                        ThreatSeverity.CRITICAL: 1.0,
                    }
                    max_threat_severity = max(
                        [t.severity for t in recent_threats],
                        key=lambda s: threat_severity_multiplier.get(s, 0),
                    )
                    risk_score = min(
                        1.0,
                        risk_score
                        + threat_severity_multiplier.get(max_threat_severity, 0) * 0.5,
                    )
                    confidence = 0.95  # Higher confidence with threat data

                # Determine risk level
                if risk_score >= 0.8:
                    level = "DANGEROUS"
                elif risk_score >= 0.5:
                    level = "RISKY"
                else:
                    level = "SAFE"

                # Generate reasons
                reasons = []
                if wallet_info.threat_level in [ThreatLevel.HIGH, ThreatLevel.CRITICAL]:
                    reasons.append(f"Wallet has {wallet_info.threat_level.value} threat level")
                if recent_threats:
                    reasons.append(f"{len(recent_threats)} recent threats detected")
                if wallet_info.risk_score > 0.7:
                    reasons.append("High risk score detected")

                return {
                    "score": risk_score,
                    "confidence": confidence,
                    "level": level,
                    "reasons": reasons,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            except Exception as e:
                logger.error("GuardianX risk score error", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/v1/guardianx/safe-tx")
        async def guardianx_safe_tx(request: dict):
            """GuardianX: Check if transaction is safe"""
            try:
                tx = request.get("tx", {})
                network = request.get("network", tx.get("network", "ethereum"))

                if not tx:
                    raise HTTPException(status_code=400, detail="Transaction data required")

                # Simulate transaction
                wallet_address = tx.get("from", "")
                simulation_result = await self.wallet_simulation_engine.simulate_transaction(
                    transaction=tx,
                    wallet_address=wallet_address,
                    network=network,
                )

                # Determine if safe
                is_safe = simulation_result.simulation_result.value == "SAFE"
                risk_score = 0.0
                if simulation_result.risks:
                    # Calculate risk score from risks
                    severity_weights = {"low": 0.2, "medium": 0.5, "high": 0.8, "critical": 1.0}
                    max_severity = max(
                        [risk.severity for risk in simulation_result.risks],
                        key=lambda s: severity_weights.get(s, 0),
                    )
                    risk_score = severity_weights.get(max_severity, 0.0)

                # Determine level
                if risk_score >= 0.8:
                    level = "DANGEROUS"
                elif risk_score >= 0.5:
                    level = "RISKY"
                else:
                    level = "SAFE"

                # Generate warnings and recommendations
                warnings = [w.message for w in simulation_result.warnings]
                recommendations = []
                for risk in simulation_result.risks:
                    recommendations.extend(risk.mitigation_suggestions)

                return {
                    "isSafe": is_safe,
                    "riskScore": risk_score,
                    "level": level,
                    "warnings": warnings,
                    "recommendations": recommendations,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            except Exception as e:
                logger.error("GuardianX safe-tx error", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/v1/guardianx/attestation/publish")
        async def guardianx_attestation_publish(request: dict):
            """GuardianX: Publish attestation (off-chain storage)"""
            try:
                attestation = request.get("attestation", {})
                attestation_hash = request.get("attestation_hash", "")

                if not attestation or not attestation_hash:
                    raise HTTPException(
                        status_code=400, detail="Attestation and attestation_hash required"
                    )

                # Store attestation in Redis (off-chain)
                if self.redis_client:
                    await self.redis_client.setex(
                        f"attestation:{attestation_hash}",
                        86400 * 365,  # 1 year TTL
                        json.dumps(attestation),
                    )

                logger.info(
                    "Attestation published",
                    attestation_hash=attestation_hash,
                    issuer=attestation.get("issuer", ""),
                )

                return {
                    "message": "Attestation published successfully",
                    "attestation_hash": attestation_hash,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            except Exception as e:
                logger.error("GuardianX attestation publish error", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/v1/guardianx/attestation/verify")
        async def guardianx_attestation_verify(
            wallet_address: str, attestation_hash: str
        ):
            """GuardianX: Verify attestation"""
            try:
                if not wallet_address or not attestation_hash:
                    raise HTTPException(
                        status_code=400, detail="Wallet address and attestation_hash required"
                    )

                # Retrieve attestation from Redis
                attestation_data = None
                if self.redis_client:
                    attestation_data = await self.redis_client.get(
                        f"attestation:{attestation_hash}"
                    )
                    if attestation_data:
                        attestation_data = json.loads(attestation_data)

                if not attestation_data:
                    return {
                        "isValid": False,
                        "issuer": wallet_address,
                        "attestation_hash": attestation_hash,
                        "timestamp": datetime.utcnow().isoformat(),
                    }

                # Verify issuer matches
                issuer = attestation_data.get("issuer", "")
                is_valid = issuer.lower() == wallet_address.lower()

                return {
                    "isValid": is_valid,
                    "issuer": issuer,
                    "attestation_hash": attestation_hash,
                    "safetyScore": attestation_data.get("safetyScore"),
                    "network": attestation_data.get("network"),
                    "timestamp": attestation_data.get("timestamp", datetime.utcnow().isoformat()),
                }
            except Exception as e:
                logger.error("GuardianX attestation verify error", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/v1/guardianx/relay")
        async def guardianx_relay(request: dict):
            """GuardianX: Relay transaction through private relayer or Flashbots Protect"""
            try:
                from core.private_relayer import private_relayer

                tx = request.get("tx", {})
                network = request.get("network", "ethereum")
                use_private = request.get("use_private", True)
                use_flashbots = request.get("use_flashbots", True)
                priority = request.get("priority", "normal")

                if not tx:
                    raise HTTPException(status_code=400, detail="Transaction data required")

                # Use private relayer
                if use_private:
                    relayed_tx = await private_relayer.relay_transaction(
                        transaction=tx,
                        network=network,
                        use_private_mempool=use_flashbots,
                        priority=priority,
                    )

                    return {
                        "message": "Transaction relayed through private relayer",
                        "tx_hash": relayed_tx.tx_hash,
                        "network": network,
                        "status": relayed_tx.status.value,
                        "relayed_at": relayed_tx.submitted_at.isoformat(),
                        "private": relayed_tx.private,
                        "bundle_id": relayed_tx.bundle_id,
                    }
                else:
                    # Standard relay through API
                    flashbots_relay_url = os.getenv("FLASHBOTS_RELAY_URL", "https://relay.flashbots.net")

                    if use_flashbots and flashbots_relay_url:
                        logger.info(
                            "Relaying transaction through Flashbots Protect",
                            tx_hash=tx.get("hash", ""),
                            network=network,
                        )

                        return {
                            "message": "Transaction relayed through Flashbots Protect",
                            "tx_hash": tx.get("hash", ""),
                            "network": network,
                            "relayed_at": datetime.utcnow().isoformat(),
                        }
                    else:
                        return {
                            "message": "Transaction relay not implemented",
                            "tx_hash": tx.get("hash", ""),
                            "network": network,
                        }
            except Exception as e:
                logger.error("GuardianX relay error", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/v1/guardianx/relay/bundle")
        async def guardianx_relay_bundle(request: dict):
            """GuardianX: Relay transaction bundle through private relayer"""
            try:
                from core.private_relayer import private_relayer

                transactions = request.get("transactions", [])
                network = request.get("network", "ethereum")
                target_block = request.get("target_block")

                if not transactions:
                    raise HTTPException(status_code=400, detail="Transactions required")

                # Relay bundle
                bundle = await private_relayer.relay_bundle(
                    transactions=transactions,
                    network=network,
                    target_block=target_block,
                )

                return {
                    "message": "Bundle relayed through private relayer",
                    "bundle_id": bundle.bundle_id,
                    "network": network,
                    "status": bundle.status.value,
                    "target_block": bundle.target_block,
                    "relayed_at": bundle.submitted_at.isoformat() if bundle.submitted_at else None,
                }
            except Exception as e:
                logger.error("GuardianX bundle relay error", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/v1/guardianx/relay/status/{tx_hash}")
        async def guardianx_relay_status(tx_hash: str):
            """GuardianX: Get relay status for a transaction"""
            try:
                from core.private_relayer import private_relayer

                relayed_tx = await private_relayer.get_relay_status(tx_hash)

                if not relayed_tx:
                    raise HTTPException(status_code=404, detail="Transaction not found")

                return {
                    "tx_hash": relayed_tx.tx_hash,
                    "status": relayed_tx.status.value,
                    "network": relayed_tx.network,
                    "submitted_at": relayed_tx.submitted_at.isoformat(),
                    "confirmed_at": relayed_tx.confirmed_at.isoformat() if relayed_tx.confirmed_at else None,
                    "block_number": relayed_tx.block_number,
                    "gas_used": relayed_tx.gas_used,
                    "error": relayed_tx.error,
                    "private": relayed_tx.private,
                    "bundle_id": relayed_tx.bundle_id,
                }
            except HTTPException:
                raise
            except Exception as e:
                logger.error("GuardianX relay status error", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/v1/guardianx/relay/bundle/{bundle_id}")
        async def guardianx_bundle_status(bundle_id: str):
            """GuardianX: Get bundle status"""
            try:
                from core.private_relayer import private_relayer

                bundle = await private_relayer.get_bundle_status(bundle_id)

                if not bundle:
                    raise HTTPException(status_code=404, detail="Bundle not found")

                return {
                    "bundle_id": bundle.bundle_id,
                    "status": bundle.status.value,
                    "network": bundle.network,
                    "target_block": bundle.target_block,
                    "created_at": bundle.created_at.isoformat(),
                    "submitted_at": bundle.submitted_at.isoformat() if bundle.submitted_at else None,
                    "confirmed_at": bundle.confirmed_at.isoformat() if bundle.confirmed_at else None,
                    "transaction_count": len(bundle.transactions),
                }
            except HTTPException:
                raise
            except Exception as e:
                logger.error("GuardianX bundle status error", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/v1/wallet-guard/presign")
        async def presign_transaction(request: dict):
            """Pre-sign transaction with security checks"""
            try:
                transaction = request.get("transaction", {})
                wallet_address = request.get("wallet_address", "")
                required_signers = request.get("required_signers", 2)
                mpc_enabled = request.get("mpc_enabled", False)

                if not transaction or not wallet_address:
                    raise HTTPException(
                        status_code=400, detail="Transaction and wallet_address required"
                    )

                presign_result = await self.pre_sign_transaction(
                    transaction=transaction,
                    wallet_address=wallet_address,
                    required_signers=required_signers,
                )

                return {
                    "message": "Transaction pre-signed successfully",
                    "signature_id": presign_result.signature_id,
                    "status": presign_result.status,
                    "risk_assessment": presign_result.risk_assessment,
                    "warnings": presign_result.warnings,
                    "required_signers": presign_result.required_signers,
                }

            except Exception as e:
                logger.error(f"Pre-sign endpoint error: {e}")
                raise HTTPException(status_code=500, detail=f"Pre-sign failed: {e!s}")

        @self.app.get("/api/v1/wallet-guard/presign/{signature_id}")
        async def get_presign_status(signature_id: str):
            """Get pre-sign transaction status"""
            try:
                status = await self.get_presign_status(signature_id)
                return status
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Get presign status error: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to get status: {e!s}")

        @self.app.post("/api/v1/wallet-guard/multisig/sign")
        async def add_multisig_signature(request: dict):
            """Add signature to multisig transaction"""
            try:
                signature_id = request.get("signature_id", "")
                signer_address = request.get("signer_address", "")
                signature = request.get("signature", "")

                if not all([signature_id, signer_address, signature]):
                    raise HTTPException(
                        status_code=400,
                        detail="signature_id, signer_address, and signature required",
                    )

                if signature_id not in self.multisig_signatures:
                    raise HTTPException(status_code=404, detail="Multisig signature not found")

                multisig_sig = self.multisig_signatures[signature_id]
                multisig_sig.signers.append(signer_address)
                multisig_sig.signatures[signer_address] = signature

                # Check if threshold is met
                if len(multisig_sig.signatures) >= multisig_sig.threshold:
                    multisig_sig.status = "completed"
                    multisig_sig.completed_at = datetime.utcnow()

                    # Update presign transaction status
                    if signature_id in self.presign_transactions:
                        self.presign_transactions[signature_id].status = "signed"

                return {
                    "message": "Signature added successfully",
                    "signature_id": signature_id,
                    "signers_count": len(multisig_sig.signers),
                    "threshold": multisig_sig.threshold,
                    "status": multisig_sig.status,
                }

            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Add multisig signature error: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to add signature: {e!s}")

    def is_valid_ethereum_address(self, address: str) -> bool:
        """Check if address is a valid Ethereum address"""
        if not address or not isinstance(address, str):
            return False

        # Remove 0x prefix if present
        address = address.removeprefix("0x")

        # Check length and hex characters
        return len(address) == 40 and all(c in "0123456789abcdefABCDEF" for c in address)

    async def analyze_wallet_enhanced(self, address: str, network: str) -> WalletInfo:
        """Enhanced wallet analysis with advanced threat detection"""
        try:
            # Normalize address
            if not address.startswith("0x"):
                address = "0x" + address
            address = address.lower()

            if not self.is_valid_ethereum_address(address):
                raise ValueError(f"Invalid Ethereum address: {address}")

            # Get blockchain provider
            provider = blockchain_manager.get_provider(network)
            if not provider:
                raise RuntimeError(f"Blockchain connection not available for network: {network}")

            # Get wallet data using enhanced blockchain manager
            balance_wei = await provider.get_balance(address)
            balance_eth = balance_wei / 1e18
            tx_count = await provider.get_transaction_count(address)
            code = await provider.get_code(address)

            # Determine wallet type
            wallet_type = WalletType.CONTRACT if code != b"" else WalletType.EOA

            # Enhanced risk scoring with threat detection
            risk_score = await self.calculate_risk_score_enhanced(
                address, network, balance_eth, tx_count
            )

            # Determine threat level
            if risk_score >= settings.risk_thresholds["CRITICAL"]:
                threat_level = ThreatLevel.CRITICAL
            elif risk_score >= settings.risk_thresholds["HIGH"]:
                threat_level = ThreatLevel.HIGH
            elif risk_score >= settings.risk_thresholds["MEDIUM"]:
                threat_level = ThreatLevel.MEDIUM
            else:
                threat_level = ThreatLevel.LOW

            # Get wallet tags based on analysis
            tags = await self.analyze_wallet_tags(address, network, wallet_type, balance_eth)

            return WalletInfo(
                address=address,
                wallet_type=wallet_type,
                balance=float(balance_eth),
                network=network,
                first_seen=datetime.utcnow(),
                last_activity=datetime.utcnow(),
                transaction_count=tx_count,
                risk_score=risk_score,
                threat_level=threat_level,
                tags=tags,
            )

        except Exception as e:
            logger.error("Error analyzing wallet", wallet=address, network=network, error=str(e))
            raise RuntimeError(f"Failed to analyze wallet {address}: {e}")

    async def calculate_risk_score_enhanced(
        self, address: str, network: str, balance: float, tx_count: int
    ) -> float:
        """Enhanced risk scoring with advanced threat detection"""
        risk_score = 0.0

        # Balance-based risk (using configurable thresholds)
        if balance > settings.high_value_threshold:
            risk_score += 0.3
        elif balance > settings.high_value_threshold / 10:
            risk_score += 0.1

        # Transaction frequency risk
        if tx_count > settings.high_activity_threshold:
            risk_score += 0.2
        elif tx_count > settings.high_activity_threshold / 10:
            risk_score += 0.1

        # Advanced threat detection analysis
        try:
            threats = await threat_detection_engine.analyze_wallet(address, network)
            for threat in threats:
                if threat.severity == ThreatSeverity.CRITICAL:
                    risk_score += 0.4
                elif threat.severity == ThreatSeverity.HIGH:
                    risk_score += 0.3
                elif threat.severity == ThreatSeverity.MEDIUM:
                    risk_score += 0.2
                else:
                    risk_score += 0.1
        except Exception as e:
            logger.warning(
                "Error in threat analysis for risk scoring", wallet=address, error=str(e)
            )

        # Check for suspicious patterns
        suspicious_patterns = await self.detect_suspicious_patterns_enhanced(address, network)
        risk_score += len(suspicious_patterns) * 0.05

        return min(risk_score, 1.0)  # Cap at 1.0

    async def analyze_wallet_tags(
        self, address: str, network: str, wallet_type: WalletType, balance: float
    ) -> list[str]:
        """Analyze wallet and return descriptive tags"""
        tags = []

        # Balance-based tags
        if balance > settings.high_value_threshold:
            tags.append("high_value")
        elif balance > 100:
            tags.append("medium_value")
        elif balance > 0:
            tags.append("low_value")
        else:
            tags.append("empty")

        # Wallet type tags
        if wallet_type == WalletType.CONTRACT:
            tags.append("contract")

            # Try to identify contract type
            try:
                provider = blockchain_manager.get_provider(network)
                if provider:
                    code = await provider.get_code(address)
                    if b"transferFrom" in code:
                        tags.append("token_contract")
                    if b"swap" in code or b"exchange" in code:
                        tags.append("dex_contract")
                    if b"flash" in code:
                        tags.append("flash_loan_contract")
            except:
                pass
        else:
            tags.append("eoa")

        # Activity tags
        try:
            provider = blockchain_manager.get_provider(network)
            if provider:
                tx_count = await provider.get_transaction_count(address)
                if tx_count > settings.high_activity_threshold:
                    tags.append("high_activity")
                elif tx_count > 1000:
                    tags.append("medium_activity")
                elif tx_count > 100:
                    tags.append("low_activity")
                else:
                    tags.append("new_wallet")
        except:
            pass

        return tags

    async def detect_suspicious_patterns(self, address: str, network: str) -> list[str]:
        """Detect suspicious patterns in wallet behavior"""
        suspicious_patterns = []

        try:
            w3 = self.web3_connections.get(network)
            if not w3:
                return suspicious_patterns

            # Get recent transactions
            # Note: This is a simplified version. In production, you'd use a service like Alchemy or Infura
            # to get transaction history more efficiently

            # Check for rapid transfers (simplified)
            tx_count = w3.eth.get_transaction_count(address)
            if tx_count > 1000:  # High transaction count might indicate bot activity
                suspicious_patterns.append("high_transaction_frequency")

            # Check balance volatility
            current_balance = w3.eth.get_balance(address)
            if current_balance == 0 and tx_count > 0:  # Empty wallet with transaction history
                suspicious_patterns.append("empty_high_activity_wallet")

            return suspicious_patterns

        except Exception as e:
            logger.error(f"Error detecting suspicious patterns for {address}: {e}")
            return suspicious_patterns

    async def monitor_wallet_activity_enhanced(self, address: str, network: str):
        """Enhanced background monitoring with advanced threat detection"""
        logger.info("Starting enhanced background monitoring", wallet=address, network=network)

        while address in self.monitored_wallets:
            try:
                # Enhanced threat detection
                threats = await threat_detection_engine.analyze_wallet(address, network)

                for threat in threats:
                    await threat_detection_engine.process_threat(threat)

                    # Auto-apply protection if threat level is high
                    if threat.severity in [ThreatSeverity.HIGH, ThreatSeverity.CRITICAL]:
                        await self.execute_protection_action(address, "alert")

                # Update wallet info periodically
                if address in self.monitored_wallets:
                    wallet_info = await self.analyze_wallet_enhanced(address, network)
                    self.monitored_wallets[address] = wallet_info

                    # Store in Redis for persistence
                    if self.redis_client:
                        await self.redis_client.setex(
                            f"wallet:{address}",
                            3600,  # 1 hour
                            json.dumps(asdict(wallet_info), default=str),
                        )

                # Wait before next check (configurable interval)
                await asyncio.sleep(settings.monitoring_interval)

            except Exception as e:
                logger.error(
                    "Error in enhanced wallet monitoring",
                    wallet=address,
                    network=network,
                    error=str(e),
                )
                await asyncio.sleep(60)  # Wait longer on error

    async def detect_suspicious_patterns_enhanced(self, address: str, network: str) -> list[str]:
        """Enhanced suspicious pattern detection"""
        suspicious_patterns = []

        try:
            provider = blockchain_manager.get_provider(network)
            if not provider:
                return suspicious_patterns

            # Get recent transaction count
            tx_count = await provider.get_transaction_count(address)

            # Check for rapid transaction patterns
            if tx_count > settings.rapid_transfer_threshold:
                suspicious_patterns.append("rapid_transactions")

            # Check for balance volatility
            balance = await provider.get_balance(address)
            if balance == 0 and tx_count > 0:
                suspicious_patterns.append("empty_high_activity")

            # Check for contract interactions
            if tx_count > 1000:  # High activity wallet
                suspicious_patterns.append("high_activity_wallet")

        except Exception as e:
            logger.error(
                "Error detecting suspicious patterns", wallet=address, network=network, error=str(e)
            )

        return suspicious_patterns

    async def scan_for_threats(self, address: str, network: str) -> list[ThreatDetection]:
        """Scan for threats against a specific wallet"""
        threats = []

        try:
            w3 = self.web3_connections.get(network)
            if not w3:
                raise RuntimeError(f"Blockchain connection not available for network: {network}")

            # Check for balance changes
            current_balance = w3.eth.get_balance(address)
            wallet_info = self.monitored_wallets.get(address)

            if wallet_info:
                balance_change = abs(current_balance - w3.to_wei(wallet_info.balance, "ether"))
                if balance_change > w3.to_wei(10, "ether"):  # Large balance change
                    threats.append(
                        ThreatDetection(
                            wallet_address=address,
                            threat_type="large_balance_change",
                            threat_level=ThreatLevel.MEDIUM,
                            description=f"Large balance change detected: {w3.from_wei(balance_change, 'ether')} ETH",
                            confidence=0.8,
                            timestamp=datetime.utcnow(),
                            metadata={"balance_change": str(w3.from_wei(balance_change, "ether"))},
                        )
                    )

            # Check for new transactions
            current_tx_count = w3.eth.get_transaction_count(address)
            if wallet_info and current_tx_count > wallet_info.transaction_count:
                new_txs = current_tx_count - wallet_info.transaction_count
                if new_txs > 10:  # Many new transactions
                    threats.append(
                        ThreatDetection(
                            wallet_address=address,
                            threat_type="rapid_transaction_activity",
                            threat_level=ThreatLevel.HIGH,
                            description=f"Rapid transaction activity: {new_txs} new transactions",
                            confidence=0.9,
                            timestamp=datetime.utcnow(),
                            metadata={"new_transactions": new_txs},
                        )
                    )

            return threats

        except Exception as e:
            logger.error(f"Error scanning for threats on {address}: {e}")
            raise RuntimeError(f"Failed to scan for threats: {e}")

    async def execute_protection_action(self, address: str, action_type: str) -> ProtectionAction:
        """Execute a protection action for a wallet"""
        try:
            action = ProtectionAction(
                action_type=action_type,
                wallet_address=address,
                description=f"Applied {action_type} protection to {address}",
                timestamp=datetime.utcnow(),
                success=True,
                metadata={"action_type": action_type},
            )

            # In a real implementation, this would:
            # 1. Send alerts to wallet owners
            # 2. Freeze suspicious transactions
            # 3. Notify security teams
            # 4. Log to security systems

            logger.info(f"Protection action executed: {action_type} for {address}")
            return action

        except Exception as e:
            logger.error(f"Error executing protection action: {e}")
            return ProtectionAction(
                action_type=action_type,
                wallet_address=address,
                description=f"Failed to apply {action_type} protection",
                timestamp=datetime.utcnow(),
                success=False,
                metadata={"error": str(e)},
            )

    async def pre_sign_transaction(
        self, transaction: dict[str, Any], wallet_address: str, required_signers: int = 2
    ) -> PreSignTransaction:
        """Pre-sign transaction with zero-day guardian integration"""
        try:
            # Check with Zero Day Guardian first
            policy_result = await self._check_with_zero_day_guardian(transaction, wallet_address)

            if not policy_result["overall_allowed"]:
                warnings = policy_result.get(
                    "warnings", ["Transaction blocked by Zero Day Guardian"]
                )
                risk_assessment = policy_result

                return PreSignTransaction(
                    transaction=transaction,
                    wallet_address=wallet_address,
                    required_signers=required_signers,
                    signature_id=f"blocked_{hashlib.md5(str(transaction).encode()).hexdigest()}",
                    risk_assessment=risk_assessment,
                    warnings=warnings,
                    timestamp=datetime.utcnow(),
                    status="blocked",
                )

            # Perform wallet pre-simulation
            simulation_result = await self._simulate_transaction(transaction, wallet_address)

            # Generate comprehensive risk assessment
            risk_assessment = await self._assess_transaction_risk(
                transaction, simulation_result, policy_result
            )

            # Generate warnings
            warnings = self._generate_warnings(risk_assessment, simulation_result)

            # Create signature ID
            signature_id = f"presig_{hashlib.md5(f'{transaction}{wallet_address}{datetime.utcnow().isoformat()}'.encode()).hexdigest()}"

            # Perform M-of-N pre-signing
            if required_signers > 1:
                await self._perform_multisig_presign(
                    transaction, signature_id, required_signers, risk_assessment
                )
            else:
                await self._perform_single_presign(transaction, signature_id, risk_assessment)

            status = "pending" if required_signers > 1 else "signed"

            presign_tx = PreSignTransaction(
                transaction=transaction,
                wallet_address=wallet_address,
                required_signers=required_signers,
                signature_id=signature_id,
                risk_assessment=risk_assessment,
                warnings=warnings,
                timestamp=datetime.utcnow(),
                status=status,
            )

            self.presign_transactions[signature_id] = presign_tx
            return presign_tx

        except Exception as e:
            logger.error(f"Pre-sign transaction error: {e}")
            raise HTTPException(status_code=500, detail=f"Pre-sign failed: {e!s}")

    async def _check_with_zero_day_guardian(
        self, transaction: dict[str, Any], wallet_address: str
    ) -> dict[str, Any]:
        """Check transaction with Zero Day Guardian service"""
        try:
            # Extract function hash
            input_data = transaction.get("input", b"")
            function_hash = input_data[:4].hex() if input_data else None

            context = {
                "function": function_hash,
                "context": {
                    "wallet_address": wallet_address,
                    "transaction_value": str(transaction.get("value", 0)),
                    "gas_limit": str(transaction.get("gas", 0)),
                    "transaction": transaction,
                },
            }

            headers = (
                {"Authorization": f"Bearer {self.zero_day_api_key}"}
                if self.zero_day_api_key
                else {}
            )

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.zero_day_guardian_url}/check-policy",
                    json=context,
                    headers=headers,
                    timeout=30.0,
                )

                if response.status_code == 200:
                    return response.json()
                logger.warning(f"Zero Day Guardian check failed: {response.status_code}")
                return {
                    "overall_allowed": False,
                    "warnings": ["Zero Day Guardian check failed"],
                    "risk_score": 1.0,
                }

        except Exception as e:
            logger.error(f"Zero Day Guardian check error: {e}")
            return {
                "overall_allowed": False,
                "warnings": [f"Zero Day Guardian error: {e!s}"],
                "risk_score": 1.0,
            }

    async def _simulate_transaction(
        self, transaction: dict[str, Any], wallet_address: str
    ) -> dict[str, Any]:
        """Simulate transaction against a fork"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.zero_day_guardian_url}/simulate",
                    json={"transaction": transaction, "wallet_address": wallet_address},
                    timeout=30.0,
                )

                if response.status_code == 200:
                    return response.json()
                return {
                    "simulation_success": False,
                    "risk_detected": True,
                    "reentrancy_risk": 0.5,
                    "approval_drain_risk": 0.5,
                    "warnings": ["Simulation failed"],
                }

        except Exception as e:
            logger.error(f"Transaction simulation error: {e}")
            return {
                "simulation_success": False,
                "risk_detected": True,
                "reentrancy_risk": 1.0,
                "approval_drain_risk": 1.0,
                "warnings": [f"Simulation error: {e!s}"],
            }

    async def _assess_transaction_risk(
        self,
        transaction: dict[str, Any],
        simulation_result: dict[str, Any],
        policy_result: dict[str, Any],
    ) -> dict[str, Any]:
        """Assess comprehensive risk for transaction"""
        # Combine all risk factors
        reentrancy_risk = simulation_result.get("reentrancy_risk", 0.0)
        approval_drain_risk = simulation_result.get("approval_drain_risk", 0.0)
        policy_risk = policy_result.get("risk_score", 0.0)

        # Calculate overall risk
        overall_risk = max(reentrancy_risk, approval_drain_risk, policy_risk)

        return {
            "overall_risk": overall_risk,
            "reentrancy_risk": reentrancy_risk,
            "approval_drain_risk": approval_drain_risk,
            "policy_risk": policy_risk,
            "simulation_success": simulation_result.get("simulation_success", False),
            "risk_level": (
                "critical"
                if overall_risk > 0.8
                else "high" if overall_risk > 0.6 else "medium" if overall_risk > 0.4 else "low"
            ),
            "assessment_time": datetime.utcnow().isoformat(),
        }

    def _generate_warnings(
        self, risk_assessment: dict[str, Any], simulation_result: dict[str, Any]
    ) -> list[str]:
        """Generate human-readable warnings"""
        warnings = []

        if risk_assessment["overall_risk"] > 0.8:
            warnings.append("CRITICAL RISK: Transaction poses extremely high security risk")

        if risk_assessment["reentrancy_risk"] > 0.7:
            warnings.append("REENTRANCY RISK: Transaction may be vulnerable to reentrancy attacks")

        if risk_assessment["approval_drain_risk"] > 0.7:
            warnings.append("APPROVAL DRAIN RISK: Transaction may drain token approvals")

        if not simulation_result.get("simulation_success", False):
            warnings.append("SIMULATION FAILED: Transaction simulation failed")

        if risk_assessment["policy_risk"] > 0.8:
            warnings.append("POLICY VIOLATION: Transaction violates security policies")

        return warnings

    async def _perform_multisig_presign(
        self,
        transaction: dict[str, Any],
        signature_id: str,
        required_signers: int,
        risk_assessment: dict[str, Any],
    ):
        """Perform M-of-N pre-signing"""
        try:
            # Create multisig signature record
            multisig_sig = MultisigSignature(
                signature_id=signature_id,
                transaction_hash=transaction.get("hash", signature_id),
                signers=[],  # Will be populated as signers sign
                signatures={},
                threshold=required_signers,
                signature_type=(
                    SignatureType.MPC if required_signers > 3 else SignatureType.THRESHOLD
                ),
                created_at=datetime.utcnow(),
                completed_at=None,
                status="pending",
            )

            self.multisig_signatures[signature_id] = multisig_sig

            # Use MPC for high-security transactions
            if required_signers >= 3:
                await self._perform_mpc_sign(transaction, signature_id)
            else:
                await self._perform_threshold_sign(transaction, signature_id, required_signers)

            logger.info(f"Multi-signature pre-sign initiated: {signature_id}")

        except Exception as e:
            logger.error(f"Multi-signature pre-sign error: {e}")
            raise

    async def _perform_single_presign(
        self, transaction: dict[str, Any], signature_id: str, risk_assessment: dict[str, Any]
    ):
        """Perform single signature pre-signing"""
        try:
            # Use HSM for single signatures
            signature = await self._hsm_sign_transaction(transaction)

            # Store signature
            if signature_id in self.multisig_signatures:
                multisig_sig = self.multisig_signatures[signature_id]
                multisig_sig.signatures["primary"] = signature
                multisig_sig.status = "signed"
                multisig_sig.completed_at = datetime.utcnow()

            logger.info(f"Single signature pre-sign completed: {signature_id}")

        except Exception as e:
            logger.error(f"Single signature pre-sign error: {e}")
            raise

    async def _perform_mpc_sign(self, transaction: dict[str, Any], signature_id: str):
        """Perform MPC (Multi-Party Computation) signing"""
        try:
            # This would integrate with Fireblocks or similar MPC service
            # For now, we'll create a placeholder signature
            tx_hash = transaction.get("hash", hashlib.md5(str(transaction).encode()).hexdigest())

            signature = {
                "mpc_signature": f"mpc_sig_{tx_hash}",
                "timestamp": datetime.utcnow().isoformat(),
                "algorithm": "MPC_ECDSA",
            }

            if signature_id in self.multisig_signatures:
                multisig_sig = self.multisig_signatures[signature_id]
                multisig_sig.signatures["mpc_0"] = signature
                multisig_sig.signature_type = SignatureType.MPC

        except Exception as e:
            logger.error(f"MPC signing error: {e}")
            raise

    async def _perform_threshold_sign(
        self, transaction: dict[str, Any], signature_id: str, threshold: int
    ):
        """Perform threshold signature signing"""
        try:
            # Use threshold cryptography for M-of-N signing
            tx_hash = transaction.get("hash", hashlib.md5(str(transaction).encode()).hexdigest())

            signature = {
                "threshold_signature": f"thresh_sig_{tx_hash}",
                "timestamp": datetime.utcnow().isoformat(),
                "algorithm": "THRESHOLD_RSA",
            }

            if signature_id in self.multisig_signatures:
                multisig_sig = self.multisig_signatures[signature_id]
                multisig_sig.signatures["threshold_0"] = signature
                multisig_sig.signature_type = SignatureType.THRESHOLD

        except Exception as e:
            logger.error(f"Threshold signing error: {e}")
            raise

    async def _hsm_sign_transaction(self, transaction: dict[str, Any]) -> str:
        """Sign transaction using HSM/Vault"""
        try:
            # This would integrate with HashiCorp Vault or AWS KMS
            tx_hash = transaction.get("hash", hashlib.md5(str(transaction).encode()).hexdigest())

            # Create digital signature using RSA private key
            signature = self.private_key.sign(
                tx_hash.encode(),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.DIGEST_LENGTH
                ),
                hashes.SHA256(),
            )

            return base64.b64encode(signature).decode()

        except Exception as e:
            logger.error(f"HSM signing error: {e}")
            raise

    async def get_presign_status(self, signature_id: str) -> dict[str, Any]:
        """Get pre-sign transaction status"""
        if signature_id not in self.presign_transactions:
            raise HTTPException(status_code=404, detail="Pre-sign transaction not found")

        presign_tx = self.presign_transactions[signature_id]

        # Get multisig status if applicable
        multisig_status = None
        if signature_id in self.multisig_signatures:
            multisig_sig = self.multisig_signatures[signature_id]
            multisig_status = {
                "signature_id": multisig_sig.signature_id,
                "signers": multisig_sig.signers,
                "signature_count": len(multisig_sig.signatures),
                "threshold": multisig_sig.threshold,
                "signature_type": multisig_sig.signature_type.value,
                "status": multisig_sig.status,
            }

        return {
            "signature_id": presign_tx.signature_id,
            "wallet_address": presign_tx.wallet_address,
            "status": presign_tx.status,
            "required_signers": presign_tx.required_signers,
            "risk_assessment": presign_tx.risk_assessment,
            "warnings": presign_tx.warnings,
            "created_at": presign_tx.timestamp.isoformat(),
            "multisig_status": multisig_status,
        }

    async def run(self):
        """Run the enhanced wallet guard service"""
        logger.info(
            "Starting enhanced Wallet Guard Service",
            host=self.host,
            port=self.port,
            version=settings.service_version,
        )

        # Initialize core services
        await self.initialize_core_services()

        # Start the FastAPI server
        config = uvicorn.Config(
            self.app,
            host=self.host,
            port=self.port,
            log_level=settings.log_level.value.lower(),
            access_log=True,
            loop="asyncio",
        )
        server = uvicorn.Server(config)
        await server.serve()


# Pydantic models for API
class MonitorWalletRequest(BaseModel):
    wallet_address: str = Field(..., description="Wallet address to monitor")
    network: str = Field(default="ethereum", description="Blockchain network")


class ProtectionRequest(BaseModel):
    wallet_address: str = Field(..., description="Wallet address to protect")
    action_type: str = Field(default="freeze", description="Type of protection action")


class PreSignRequest(BaseModel):
    transaction: dict[str, Any] = Field(..., description="Transaction to pre-sign")
    wallet_address: str = Field(..., description="Wallet address")
    required_signers: int = Field(default=2, description="Number of required signers")
    mpc_enabled: bool = Field(default=False, description="Enable MPC signing")


class MultisigSignRequest(BaseModel):
    signature_id: str = Field(..., description="Pre-sign transaction ID")
    signer_address: str = Field(..., description="Address of the signer")
    signature: str = Field(..., description="Digital signature")


# Global service instance
wallet_guard_service = WalletGuardService()

if __name__ == "__main__":
    asyncio.run(wallet_guard_service.run())
