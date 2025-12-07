"""Main FastAPI application for cross-chain bridge service."""

import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from ..core.attack_detection import AttackDetectionSystem
from ..core.attestation_monitor import AttestationMonitor
from ..core.blockchain_integration import BlockchainIntegration
from ..core.bridge_analyzer import BridgeAnalyzer
from ..core.cryptographic_validation import CryptographicValidator
from ..core.event_streaming import BlockchainEventStreamer
from ..core.liveness_monitor import LivenessMonitor
from ..core.ml_anomaly_detection import MLAnomalyDetector
from ..core.proof_of_reserves import ProofOfReservesMonitor
from ..core.security_orchestrator import SecurityOrchestrator
from ..utils.network_utils import get_supported_networks
from .routes import bridge, network, security, transaction, vulnerability

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global instances
bridge_analyzer = None
security_orchestrator = None
attestation_monitor = None
proof_of_reserves = None
attack_detection = None
liveness_monitor = None
blockchain_integration = None
event_streamer = None
crypto_validator = None
ml_detector = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global bridge_analyzer, security_orchestrator, attestation_monitor, proof_of_reserves, attack_detection, liveness_monitor, blockchain_integration, event_streamer, crypto_validator, ml_detector

    # Startup
    logger.info("Starting Cross-Chain Bridge Security Service...")

    try:
        # Initialize blockchain integration first
        blockchain_integration = BlockchainIntegration()
        await blockchain_integration.initialize()

        # Initialize cryptographic validator
        crypto_validator = CryptographicValidator()

        # Initialize ML detector
        ml_detector = MLAnomalyDetector()

        # Initialize event streamer
        event_streamer = BlockchainEventStreamer(blockchain_integration)

        # Initialize bridge analyzer
        bridge_analyzer = BridgeAnalyzer()

        # Initialize supported networks
        networks = get_supported_networks()
        await bridge_analyzer.initialize_networks(networks)

        # Initialize security components with real blockchain integration
        attestation_monitor = AttestationMonitor(blockchain_integration)
        proof_of_reserves = ProofOfReservesMonitor()
        attack_detection = AttackDetectionSystem()
        liveness_monitor = LivenessMonitor()

        # Initialize security orchestrator
        security_orchestrator = SecurityOrchestrator()

        # Initialize liveness monitor with real network configs
        network_configs = []
        for network in networks:
            config = blockchain_integration.get_network_config(network)
            if config:
                network_configs.append(
                    {
                        "name": network,
                        "rpc_endpoints": config.rpc_urls,
                        "ws_urls": config.ws_urls,
                        "monitoring": {"enabled": True},
                    }
                )

        await liveness_monitor.initialize_networks(network_configs)

        # Store components in app state
        app.state.bridge_analyzer = bridge_analyzer
        app.state.security_orchestrator = security_orchestrator
        app.state.attestation_monitor = attestation_monitor
        app.state.proof_of_reserves = proof_of_reserves
        app.state.attack_detection = attack_detection
        app.state.liveness_monitor = liveness_monitor
        app.state.blockchain_integration = blockchain_integration
        app.state.event_streamer = event_streamer
        app.state.crypto_validator = crypto_validator
        app.state.ml_detector = ml_detector

        # Start real-time monitoring
        await attestation_monitor.start_monitoring()
        await event_streamer.start_streaming()
        await security_orchestrator.start_security_monitoring()

        logger.info(f"Initialized {len(networks)} networks: {', '.join(networks)}")
        logger.info(
            "Cross-Chain Bridge Security Service started successfully with real blockchain integration"
        )

    except Exception as e:
        logger.error(f"Failed to start service: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down Cross-Chain Bridge Security Service...")

    # Stop all monitoring
    if attestation_monitor:
        await attestation_monitor.stop_monitoring()

    if event_streamer:
        await event_streamer.stop_streaming()

    if security_orchestrator:
        await security_orchestrator.stop_security_monitoring()

    if blockchain_integration:
        await blockchain_integration.close()

    logger.info("Cross-Chain Bridge Security Service shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="Cross-Chain Bridge Security Analysis Service",
    description="""
    A comprehensive service for analyzing cross-chain bridge security,
    vulnerabilities, and interoperability risks across multiple blockchains.

    ## Features

    * **Bridge Analysis**: Comprehensive security analysis of cross-chain bridges
    * **Vulnerability Scanning**: Advanced vulnerability detection and assessment
    * **Network Monitoring**: Real-time network status and health monitoring
    * **Transaction Validation**: Cross-chain transaction validation and verification
    * **Risk Assessment**: Multi-dimensional risk scoring and recommendations

    ## Supported Networks

    * Ethereum Mainnet
    * Polygon
    * Binance Smart Chain
    * Avalanche
    * Arbitrum
    * Optimism
    * Testnets (Goerli, Mumbai)
    """,
    version="1.0.0",
    contact={"name": "Scorpius Team", "email": "team@scorpius.dev", "url": "https://scorpius.dev"},
    license_info={"name": "MIT License", "url": "https://opensource.org/licenses/MIT"},
    lifespan=lifespan,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware, allowed_hosts=["*"]  # Configure appropriately for production
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please try again later.",
            "request_id": getattr(request.state, "request_id", None),
        },
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "cross-chain-bridge-service",
        "version": "1.0.0",
        "timestamp": "2024-01-01T00:00:00Z",
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": "Cross-Chain Bridge Security Analysis Service",
        "version": "1.0.0",
        "description": "Comprehensive cross-chain bridge security analysis and monitoring",
        "documentation": "/docs",
        "health": "/health",
        "endpoints": {
            "bridge": "/api/v1/bridge",
            "network": "/api/v1/network",
            "transaction": "/api/v1/transaction",
            "vulnerability": "/api/v1/vulnerability",
            "security": "/api/v1/security",
        },
    }


# Include routers
app.include_router(bridge.router, prefix="/api/v1/bridge", tags=["Bridge Analysis"])

app.include_router(network.router, prefix="/api/v1/network", tags=["Network Monitoring"])

app.include_router(
    transaction.router, prefix="/api/v1/transaction", tags=["Transaction Validation"]
)

app.include_router(
    vulnerability.router, prefix="/api/v1/vulnerability", tags=["Vulnerability Analysis"]
)

app.include_router(security.router, prefix="/api/v1/security", tags=["Security Monitoring"])


if __name__ == "__main__":
    uvicorn.run("src.api.main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
