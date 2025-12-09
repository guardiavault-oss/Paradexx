import logging

"""
Complete Unified Quantum Mempool Monitor - Final Integration

This module creates the ultimate unified monitoring solution that combines:
- Quantum threat detection with enterprise security
- Enhanced mempool monitoring with MEV detection
- Real-time alerting and dashboard
- Full containerization and production deployment
"""

import asyncio
import signal
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import uvicorn
from common.observability.logging import get_scorpius_logger
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

# Web3 imports
from web3 import AsyncWeb3
from web3.providers import AsyncHTTPProvider

# Quantum mempool imports
sys.path.insert(0, str(Path(__file__).parent / "src"))
from src.api.dashboard import QuantumDashboard
from src.api.websocket_api import WebSocketAPI
from src.database.simple_connection_manager import SimpleDatabaseManager
from src.detection.advanced_detector import AdvancedQuantumDetector
from src.detection.quantum_detector import EnterpriseQuantumDetector
from src.enterprise.alert_manager import EnterpriseAlertManager
from src.enterprise.audit_logger import SecurityEventLogger
from src.enterprise.security_manager import EnterpriseSecurityManager
from src.utils.config import EnterpriseConfig, load_config

# Elite mempool system imports (optional)
MEMPOOL_SYSTEM_AVAILABLE = False
try:
    # Try to find the mempool service
    mempool_paths = [
        Path(__file__).parent.parent
        / "scorpius-microservices"
        / "mempool-service"
        / "app",
        Path(__file__).parent.parent / "mempool-service" / "app",
        Path(__file__).parent / "mempool-service" / "app",
    ]

    for path in mempool_paths:
        if path.exists():
            sys.path.insert(0, str(path))
            break

    from api.routers.alerts import router as alerts_router
    from api.routers.analytics import router as analytics_router
    from api.routers.mev import router as mev_router
    from api.routers.rules import router as rules_router
    from api.routers.transactions import router as transactions_router

    # API routers
    from api.routers.websocket import router as websocket_router
    from execution.execution_engine import ExecutionEngine
    from mev_analysis.mev_detector import MEVDetector
    from models.mempool_event import MempoolEvent

    from core.enhanced_mempool_monitor import EnhancedMempoolMonitor
    from core.session_manager import SessionManager

    MEMPOOL_SYSTEM_AVAILABLE = True
    print("Elite mempool subsystem found and loaded")

except ImportError as e:
    print(f"Mempool system not available: {e}")

    # Create placeholder classes
    class MempoolEvent:
        def __init__(
            self,
            tx_hash: str,
            from_address: str,
            contract_address: Optional[str] = None,
            value: int = 0,
            timestamp: Optional[datetime] = None,
        ):
            self.tx_hash = tx_hash
            self.from_address = from_address
            self.contract_address = contract_address
            self.value = value
            self.timestamp = timestamp or datetime.now()

    class EnhancedMempoolMonitor:
        def __init__(self, *args, **kwargs):
            pass

    class SessionManager:
        def __init__(self, *args, **kwargs):
            pass

    class MEVDetector:
        def __init__(self, *args, **kwargs):
            pass

    class ExecutionEngine:
        def __init__(self, *args, **kwargs):
            pass


class UltimateQuantumMempoolMonitor:
    """
    Ultimate Quantum Mempool Monitor - Complete unified monitoring solution.

    Combines quantum threat detection with advanced mempool monitoring.
    """

    def __init__(self, config_path: Optional[str] = None):
        """Initialize the ultimate monitoring system."""

        # Load configuration
        if config_path:
            self.config = load_config(config_path)
        else:
            try:
                self.config = load_config("config/unified-config.yaml")
            except:
                self.config = EnterpriseConfig()

        # Setup logging
        self.logger = self._setup_logging()
        self.logger.info("Initializing Ultimate Quantum Mempool Monitor...")

        # Initialize FastAPI app
        self.app = self._create_fastapi_app()

        # Core quantum components
        self.db_manager: Optional[SimpleDatabaseManager] = None
        self.security_manager: Optional[EnterpriseSecurityManager] = None
        self.audit_logger: Optional[SecurityEventLogger] = None
        self.quantum_detector: Optional[EnterpriseQuantumDetector] = None
        self.advanced_detector: Optional[AdvancedQuantumDetector] = None
        self.alert_manager: Optional[EnterpriseAlertManager] = None
        self.websocket_api: Optional[WebSocketAPI] = None
        self.dashboard: Optional[QuantumDashboard] = None

        # Enhanced mempool components
        self.session_manager: Optional[SessionManager] = None
        self.mempool_monitors: Dict[str, EnhancedMempoolMonitor] = {}
        self.mev_detectors: Dict[str, MEVDetector] = {}
        self.execution_engines: Dict[str, ExecutionEngine] = {}
        self.web3_instances: Dict[str, AsyncWeb3] = {}

        # Application state
        self.is_running = False
        self.startup_time: Optional[datetime] = None
        self.shutdown_event = asyncio.Event()
        self.monitoring_tasks: List[asyncio.Task] = []

        # Statistics
        self.stats = {
            "quantum_threats_detected": 0,
            "mempool_transactions_processed": 0,
            "mev_opportunities_found": 0,
            "alerts_sent": 0,
            "uptime_seconds": 0,
            "networks_monitored": 0,
        }

        # Setup signal handlers
        self._setup_signal_handlers()

    def _setup_logging(self) -> logging.Logger:
        """Setup comprehensive logging configuration."""
        log_level = getattr(self.config, "log_level", "INFO")

        # Create logs directory
        Path("logs").mkdir(exist_ok=True)

        logging.basicConfig(
            level=getattr(logging, log_level.upper()),
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            handlers=[
                logging.StreamHandler(sys.stdout),
                logging.FileHandler("logs/ultimate_quantum_mempool.log"),
            ],
        )

        # Suppress noisy loggers
        get_scorpius_logger("asyncio").setLevel(logging.WARNING)
        get_scorpius_logger("websockets").setLevel(logging.WARNING)

        return get_scorpius_logger(__name__)

    def _create_fastapi_app(self) -> FastAPI:
        """Create and configure FastAPI application."""
        app = FastAPI(
            title="Ultimate Quantum Mempool Monitor",
            description="Enterprise quantum threat detection with mempool monitoring",
            version="3.0.0",
            docs_url="/docs",
            redoc_url="/redoc",
            openapi_url="/api/v1/openapi.json",
        )

        # Setup middleware
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        app.add_middleware(GZipMiddleware, minimum_size=1000)

        # Setup routes
        self._setup_api_routes(app)

        return app

    def _setup_api_routes(self, app: FastAPI):
        """Setup all API routes."""

        # Include mempool system routes if available
        if MEMPOOL_SYSTEM_AVAILABLE:
            try:
                app.include_router(
                    websocket_router, prefix="/api/v1", tags=["websocket"]
                )
                app.include_router(
                    transactions_router, prefix="/api/v1", tags=["transactions"]
                )
                app.include_router(
                    analytics_router, prefix="/api/v1", tags=["analytics"]
                )
                app.include_router(alerts_router, prefix="/api/v1", tags=["alerts"])
                app.include_router(mev_router, prefix="/api/v1", tags=["mev"])
                app.include_router(rules_router, prefix="/api/v1", tags=["rules"])
                self.logger.info("Mempool system API routes included")
            except Exception as e:
                self.logger.warning(f"Could not include some mempool routes: {e}")

        # Core system endpoints
        @app.get("/")
        async def root():
            return {
                "message": "Ultimate Quantum Mempool Monitor",
                "version": "3.0.0",
                "status": "running" if self.is_running else "stopped",
                "docs": "/docs",
                "uptime": self.stats["uptime_seconds"] if self.startup_time else 0,
            }

        @app.get("/api/v1/health")
        async def health_check():
            """Comprehensive health check."""
            health_status = await self._get_system_health()
            return JSONResponse(
                status_code=(
                    status.HTTP_200_OK
                    if health_status["healthy"]
                    else status.HTTP_503_SERVICE_UNAVAILABLE
                ),
                content=health_status,
            )

        @app.get("/api/v1/status")
        async def system_status():
            """Get complete system status."""
            return await self._get_system_status()

        @app.get("/api/v1/quantum/threats")
        async def get_quantum_threats():
            """Get detected quantum threats."""
            if self.quantum_detector:
                return await self.quantum_detector.get_recent_threats()
            return {"threats": [], "message": "Quantum detector not initialized"}

        @app.post("/api/v1/quantum/alert-test")
        async def test_quantum_alerts():
            """Test quantum alert system."""
            if self.alert_manager:
                results = await self.alert_manager.test_channels()
                return {"test_results": results, "status": "success"}
            return {"error": "Alert manager not initialized", "status": "error"}

        @app.post("/api/v1/system/shutdown")
        async def initiate_shutdown():
            """Initiate graceful system shutdown."""
            self.logger.info("API shutdown requested")
            asyncio.create_task(self.shutdown())
            return {"message": "Shutdown initiated", "status": "success"}

    def _setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown."""

        def signal_handler(signum, frame):
            self.logger.info(
                f"Received signal {signum}, initiating graceful shutdown..."
            )
            try:
                asyncio.create_task(self.shutdown())
            except RuntimeError:
                asyncio.run(self.shutdown())

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

    async def initialize(self):
        """Initialize all system components."""
        try:
            self.startup_time = datetime.now()
            self.logger.info("Starting system initialization...")

            # Initialize quantum monitoring components
            await self._initialize_quantum_components()

            # Initialize enhanced mempool components (if available)
            if MEMPOOL_SYSTEM_AVAILABLE:
                await self._initialize_mempool_components()
            else:
                self.logger.warning(
                    "Mempool system not available - running quantum monitoring only"
                )

            # Setup integrations
            await self._initialize_integrations()

            self.logger.info(
                "Ultimate Quantum Mempool Monitor initialized successfully!"
            )

        except Exception as e:
            self.logger.error(f"Initialization failed: {str(e)}")
            raise

    async def _initialize_quantum_components(self):
        """Initialize quantum detection components."""
        self.logger.info("Initializing quantum detection components...")

        try:
            # Database manager
            database_config = getattr(self.config, "database_config", None) or getattr(
                self.config, "database", {}
            )
            self.db_manager = SimpleDatabaseManager(database_config)

            # Security and audit
            self.security_manager = EnterpriseSecurityManager(self.config)

            # Check if audit config exists, create default if not
            audit_config = getattr(self.config, "audit_config", None)
            if audit_config is None:
                audit_config = {}
            elif hasattr(audit_config, "__dict__"):
                audit_config = audit_config.__dict__

            self.audit_logger = SecurityEventLogger(audit_config)
            await self.security_manager.initialize_enterprise_security()

            # Quantum detectors - fix constructor calls
            # Check if detection config exists, create default if not
            detection_config = getattr(self.config, "detection", None)
            if detection_config is None:
                from src.utils.config import DetectionConfig

                detection_config = DetectionConfig()

            self.quantum_detector = EnterpriseQuantumDetector(
                detection_config, self.db_manager
            )
            await self.quantum_detector.initialize_detection_engine()

            self.advanced_detector = AdvancedQuantumDetector(detection_config)
            # Advanced detector doesn't need async initialization

            # Alert system
            self.alert_manager = EnterpriseAlertManager(self.config)

            # WebSocket API and Dashboard
            self.websocket_api = WebSocketAPI(self.config)
            await self.websocket_api.initialize()

            self.dashboard = QuantumDashboard(self.config)

            self.logger.info("Quantum components initialized successfully")

        except Exception as e:
            self.logger.error(f"Failed to initialize quantum components: {e}")
            raise

    async def _initialize_mempool_components(self):
        """Initialize enhanced mempool monitoring components."""
        if not MEMPOOL_SYSTEM_AVAILABLE:
            return

        self.logger.info("Initializing enhanced mempool components...")

        try:
            # Session manager
            self.session_manager = SessionManager()

            # Initialize for default Ethereum network
            networks_config = getattr(
                self.config,
                "networks",
                {
                    "ethereum": {
                        "rpc_url": "http://localhost:8545",
                        "chain_id": 1,
                        "is_active": True,
                    }
                },
            )

            for network_name, network_config in networks_config.items():
                if network_config.get("is_active", False):
                    rpc_url = network_config.get("rpc_url", "http://localhost:8545")
                    chain_id = network_config.get("chain_id", 1)

                    # Initialize Web3 client
                    self.web3_instances[network_name] = AsyncWeb3(
                        AsyncHTTPProvider(rpc_url)
                    )

                    # Initialize mempool monitor
                    self.mempool_monitors[network_name] = EnhancedMempoolMonitor(
                        chain_id=chain_id,
                        rpc_urls=[rpc_url],
                        session_manager=self.session_manager,
                    )

                    # Initialize MEV detector
                    self.mev_detectors[network_name] = MEVDetector(
                        web3_client=self.web3_instances[network_name]
                    )

                    # Initialize execution engine
                    self.execution_engines[network_name] = ExecutionEngine(
                        web3_client=self.web3_instances[network_name],
                        session_manager=self.session_manager,
                    )

                    self.logger.info(
                        f"Initialized {network_name} monitoring components"
                    )

            self.stats["networks_monitored"] = len(self.mempool_monitors)
            self.logger.info("Enhanced mempool components initialized successfully")

        except Exception as e:
            self.logger.error(f"Failed to initialize mempool components: {e}")
            # Don't raise - system can still work with quantum detection only

    async def _initialize_integrations(self):
        """Initialize integrations between quantum and mempool systems."""
        self.logger.info("Initializing system integrations...")

        try:
            # Setup event handlers for quantum-mempool integration
            if self.mempool_monitors and self.quantum_detector:
                await self._setup_quantum_mempool_integration()

            # Setup unified alerting
            if self.alert_manager:
                await self._setup_unified_alerting()

            self.logger.info("System integrations initialized successfully")

        except Exception as e:
            self.logger.error(f"Failed to initialize integrations: {e}")

    async def _setup_quantum_mempool_integration(self):
        """Setup integration between quantum detection and mempool monitoring."""

        async def on_mempool_transaction(event: MempoolEvent):
            """Handle mempool transactions with quantum analysis."""
            try:
                self.stats["mempool_transactions_processed"] += 1

                # Analyze transaction for quantum threats
                if self.quantum_detector:
                    threat_result = await self.quantum_detector.analyze_transaction(
                        {
                            "hash": event.tx_hash,
                            "from": event.from_address,
                            "to": getattr(event, "contract_address", ""),
                            "value": getattr(event, "value", 0),
                            "timestamp": getattr(event, "timestamp", datetime.now()),
                        }
                    )

                    if threat_result and threat_result.get("quantum_threat_detected"):
                        await self._handle_quantum_threat(event, threat_result)

            except Exception as e:
                self.logger.error(f"Error processing transaction: {e}")

        # Register the handler with mempool monitors
        for monitor in self.mempool_monitors.values():
            if hasattr(monitor, "add_async_callback"):
                monitor.add_async_callback(on_mempool_transaction)

    async def _setup_unified_alerting(self):
        """Setup unified alerting across all systems."""
        if not self.alert_manager:
            return

        # Configure basic alert templates
        alert_templates = {
            "quantum_threat": {
                "title": "Quantum Threat Detected",
                "severity": "critical",
                "template": "Quantum threat detected with confidence {confidence}",
            },
            "system_error": {
                "title": "System Error",
                "severity": "error",
                "template": "System error in {component}: {error_message}",
            },
        }

        # Register alert templates
        for alert_type, template in alert_templates.items():
            if hasattr(self.alert_manager, "register_alert_template"):
                await self.alert_manager.register_alert_template(alert_type, template)

    async def run(self):
        """Run the ultimate monitoring system."""
        try:
            self.is_running = True
            self.logger.info("Starting Ultimate Quantum Mempool Monitor...")

            # Start monitoring services
            tasks = []

            # Start quantum monitoring
            if self.quantum_detector and hasattr(
                self.quantum_detector, "start_continuous_monitoring"
            ):
                tasks.append(
                    asyncio.create_task(
                        self.quantum_detector.start_continuous_monitoring()
                    )
                )

            if self.advanced_detector and hasattr(
                self.advanced_detector, "start_monitoring"
            ):
                tasks.append(
                    asyncio.create_task(self.advanced_detector.start_monitoring())
                )

            # Start mempool monitoring
            for network_name, monitor in self.mempool_monitors.items():
                if hasattr(monitor, "start_monitoring"):
                    tasks.append(asyncio.create_task(monitor.start_monitoring()))
                    self.logger.info(f"Started {network_name} mempool monitoring")

            # Start WebSocket API if available
            if self.websocket_api and hasattr(self.websocket_api, "start_server"):
                tasks.append(asyncio.create_task(self.websocket_api.start_server()))

            self.logger.info(
                f"Ultimate Quantum Mempool Monitor running with {len(tasks)} active tasks"
            )
            self.logger.info("System Status:")
            self.logger.info(
                f"   • Quantum Detection: {'Active' if self.quantum_detector else 'Inactive'}"
            )
            self.logger.info(
                f"   • Mempool Monitoring: {'Active' if self.mempool_monitors else 'Inactive'}"
            )
            self.logger.info(f"   • Networks Monitored: {len(self.mempool_monitors)}")
            self.logger.info(
                f"   • Alert System: {'Active' if self.alert_manager else 'Inactive'}"
            )

            # Wait for shutdown signal
            await self.shutdown_event.wait()

        except Exception as e:
            self.logger.error(f"Runtime error: {str(e)}")
            raise
        finally:
            # Cancel all tasks
            for task in tasks:
                if not task.done():
                    task.cancel()

            # Wait for tasks to complete
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)

    async def _handle_quantum_threat(
        self, event: MempoolEvent, threat_result: Dict[str, Any]
    ):
        """Handle detected quantum threats."""
        try:
            self.stats["quantum_threats_detected"] += 1

            # Log the threat
            self.logger.warning(
                f"Quantum threat detected in transaction {getattr(event, 'tx_hash', 'unknown')}"
            )

            # Send alert
            if self.alert_manager and hasattr(self.alert_manager, "send_alert"):
                await self.alert_manager.send_alert(
                    "quantum_threat",
                    {
                        "threat_type": threat_result.get("threat_type", "unknown"),
                        "confidence": threat_result.get("confidence", 0),
                        "transaction_hash": getattr(event, "tx_hash", "unknown"),
                        "timestamp": datetime.now().isoformat(),
                    },
                )
                self.stats["alerts_sent"] += 1

        except Exception as e:
            self.logger.error(f"Error handling quantum threat: {e}")

    async def _get_system_health(self) -> Dict[str, Any]:
        """Get comprehensive system health status."""
        health = {
            "healthy": True,
            "timestamp": datetime.now().isoformat(),
            "components": {},
            "uptime_seconds": (
                (datetime.now() - self.startup_time).total_seconds()
                if self.startup_time
                else 0
            ),
        }

        # Check quantum components
        if self.quantum_detector:
            health["components"]["quantum_detector"] = {
                "status": "healthy",
                "active": True,
            }
        else:
            health["components"]["quantum_detector"] = {
                "status": "not_initialized",
                "active": False,
            }
            health["healthy"] = False

        # Check mempool components
        health["components"]["mempool_monitors"] = {
            "count": len(self.mempool_monitors),
            "active": len(self.mempool_monitors) > 0,
            "networks": list(self.mempool_monitors.keys()),
        }

        # Check database
        if self.db_manager:
            health["components"]["database"] = {"status": "healthy", "active": True}
        else:
            health["components"]["database"] = {
                "status": "not_initialized",
                "active": False,
            }

        # Check alert system
        health["components"]["alert_system"] = {
            "status": "healthy" if self.alert_manager else "not_initialized",
            "active": self.alert_manager is not None,
        }

        return health

    async def _get_system_status(self) -> Dict[str, Any]:
        """Get complete system status."""
        if self.startup_time:
            uptime = (datetime.now() - self.startup_time).total_seconds()
            self.stats["uptime_seconds"] = uptime

        return {
            "system": "Ultimate Quantum Mempool Monitor",
            "version": "3.0.0",
            "status": "running" if self.is_running else "stopped",
            "uptime_seconds": self.stats["uptime_seconds"],
            "startup_time": (
                self.startup_time.isoformat() if self.startup_time else None
            ),
            "statistics": self.stats,
            "components": {
                "quantum_detector": self.quantum_detector is not None,
                "advanced_detector": self.advanced_detector is not None,
                "mempool_monitors": len(self.mempool_monitors),
                "mev_detectors": len(self.mev_detectors),
                "execution_engines": len(self.execution_engines),
                "alert_manager": self.alert_manager is not None,
                "websocket_api": self.websocket_api is not None,
                "dashboard": self.dashboard is not None,
            },
            "networks": (
                list(self.mempool_monitors.keys()) if self.mempool_monitors else []
            ),
        }

    async def shutdown(self):
        """Gracefully shutdown the system."""
        if not self.is_running:
            return

        self.logger.info("Initiating graceful shutdown...")
        self.is_running = False

        try:
            # Stop monitoring components
            if self.quantum_detector and hasattr(self.quantum_detector, "stop"):
                await self.quantum_detector.stop()

            if self.advanced_detector and hasattr(self.advanced_detector, "stop"):
                await self.advanced_detector.stop()

            # Stop mempool monitors
            for network_name, monitor in self.mempool_monitors.items():
                if hasattr(monitor, "stop"):
                    await monitor.stop()
                    self.logger.info(f"Stopped {network_name} mempool monitoring")

            # Stop WebSocket API
            if self.websocket_api and hasattr(self.websocket_api, "stop"):
                await self.websocket_api.stop()

            # Signal shutdown
            self.shutdown_event.set()

            self.logger.info("Graceful shutdown completed")

        except Exception as e:
            self.logger.error(f"Error during shutdown: {e}")


async def main():
    """Main entry point for the ultimate monitoring system."""
    monitor = UltimateQuantumMempoolMonitor()

    try:
        # Initialize all components
        await monitor.initialize()

        # Start the unified API server and monitoring systems
        config = uvicorn.Config(
            monitor.app,
            host="0.0.0.0",
            port=8000,
            log_level="info",
            reload=False,
            access_log=True,
        )
        server = uvicorn.Server(config)

        # Run both the API server and monitoring systems concurrently
        await asyncio.gather(server.serve(), monitor.run())

    except KeyboardInterrupt:
        print("\nShutdown requested by user")
    except Exception as e:
        print(f"Application failed: {str(e)}")
        sys.exit(1)
    finally:
        await monitor.shutdown()


if __name__ == "__main__":
    """
    Ultimate Quantum Mempool Monitor - Production Ready

    Features:
        - Quantum threat detection with ML algorithms
        - Real-time mempool monitoring (multi-network)
        - MEV opportunity detection and execution
        - Enterprise security with HSM integration
        - Comprehensive audit logging
        - Real-time alerting (multiple channels)
        - WebSocket API for real-time updates
        - Interactive dashboard
        - Production-ready containerization
        - Health monitoring and metrics
        - Graceful shutdown handling
    """

    print("=" * 80)
    print("Ultimate Quantum Mempool Monitor v3.0")
    print("Enterprise-Grade Unified Monitoring Solution")
    print("=" * 80)

    # Check Python version
    if sys.version_info < (3, 9):
        print("Python 3.9+ required")
        sys.exit(1)

    asyncio.run(main())
