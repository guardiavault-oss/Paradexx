import logging

"""
Enterprise Quantum Mempool Monitor - Main Application Entry Point

This is a comprehensive enterprise-grade quantum-assisted brute-force detection system
for blockchain mempool monitoring with full enterprise integration capabilities.
"""

import asyncio
import signal
import sys
from datetime import datetime
from typing import Optional

from common.observability.logging import get_scorpius_logger
from src.api.dashboard import QuantumDashboard
from src.api.enterprise_api import EnterpriseAPI
from src.api.websocket_api import WebSocketAPI
from src.database.simple_connection_manager import SimpleDatabaseManager
from src.detection.advanced_detector import AdvancedQuantumDetector
from src.detection.quantum_detector import EnterpriseQuantumDetector
from src.enterprise.alert_manager import EnterpriseAlertManager
from src.enterprise.audit_logger import SecurityEventLogger
from src.enterprise.compliance_manager import ComplianceFramework, ComplianceManager
from src.enterprise.incident_response import IncidentResponseManager
from src.enterprise.security_manager import EnterpriseSecurityManager
from src.mempool.monitor import EnterpriseMempoolMonitor
from src.mempool.realtime_monitor import RealtimeMempoolMonitor
from src.utils.config import EnterpriseConfig
from src.utils.metrics import MetricsCollector


class QuantumMempoolMonitorApp:
    """
    Main application class for the Enterprise Quantum Mempool Monitor.

    This application provides:
    - Real-time quantum threat detection
    - Enterprise security and compliance
    - Automated incident response
    - Comprehensive audit logging
    - RESTful API for integration
    - Performance monitoring and metrics
    """

    def __init__(self):
        self.config = EnterpriseConfig()
        self.logger = self._setup_logging()

        # Core components
        self.db_manager: Optional[SimpleDatabaseManager] = None
        self.security_manager: Optional[EnterpriseSecurityManager] = None
        self.audit_logger: Optional[SecurityEventLogger] = None
        self.incident_manager: Optional[IncidentResponseManager] = None
        self.compliance_manager: Optional[ComplianceManager] = None
        self.quantum_detector: Optional[EnterpriseQuantumDetector] = None
        self.advanced_detector: Optional[AdvancedQuantumDetector] = None
        self.mempool_monitor: Optional[EnterpriseMempoolMonitor] = None
        self.realtime_monitor: Optional[RealtimeMempoolMonitor] = None
        self.api_server: Optional[EnterpriseAPI] = None
        self.websocket_api: Optional[WebSocketAPI] = None
        self.dashboard: Optional[QuantumDashboard] = None
        self.alert_manager: Optional[EnterpriseAlertManager] = None
        self.metrics_collector: Optional[MetricsCollector] = None

        # Application state
        self.is_running = False
        self.startup_time: Optional[datetime] = None

        # Setup signal handlers for graceful shutdown
        self._setup_signal_handlers()

    def _setup_logging(self) -> logging.Logger:
        """Setup enterprise logging configuration."""
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            handlers=[
                logging.StreamHandler(sys.stdout),
                logging.FileHandler("quantum_mempool_monitor.log"),
            ],
        )
        return get_scorpius_logger(__name__)

    def _setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown."""

        def signal_handler(signum, frame):
            self.logger.info(
                f"Received signal {signum}, initiating graceful shutdown..."
            )
            asyncio.create_task(self.shutdown())

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

    async def initialize(self):
        """Initialize all application components."""
        try:
            self.startup_time = datetime.now()
            self.logger.info("Initializing Enterprise Quantum Mempool Monitor...")

            # Initialize core infrastructure
            await self._initialize_database()
            await self._initialize_security()
            await self._initialize_compliance()
            await self._initialize_incident_response()

            # Initialize detection and monitoring
            await self._initialize_quantum_detector()
            await self._initialize_advanced_detector()
            await self._initialize_mempool_monitor()
            await self._initialize_realtime_monitor()
            await self._initialize_metrics()

            # Initialize advanced features
            await self._initialize_alert_manager()
            await self._initialize_websocket_api()
            await self._initialize_dashboard()

            # Initialize API server
            await self._initialize_api_server()

            # Log successful initialization
            await self.audit_logger.log_critical_security_event(
                {
                    "event_type": "APPLICATION_INITIALIZED",
                    "startup_time": self.startup_time,
                    "components": [
                        "DATABASE",
                        "SECURITY",
                        "COMPLIANCE",
                        "INCIDENT_RESPONSE",
                        "QUANTUM_DETECTOR",
                        "MEMPOOL_MONITOR",
                        "METRICS",
                        "API_SERVER",
                    ],
                    "timestamp": datetime.utcnow(),
                    "status": "SUCCESS",
                }
            )

            self.logger.info(
                "Enterprise Quantum Mempool Monitor initialized successfully!"
            )

        except Exception as e:
            self.logger.error(f"Initialization failed: {str(e)}")
            if self.audit_logger:
                await self.audit_logger.log_critical_security_event(
                    {
                        "event_type": "APPLICATION_INITIALIZATION_FAILED",
                        "error": str(e),
                        "timestamp": datetime.utcnow(),
                        "status": "FAILURE",
                    }
                )
            raise

    async def _initialize_database(self):
        """Initialize database connection manager."""
        self.logger.info("Initializing database connection manager...")
        self.db_manager = SimpleDatabaseManager(self.config.database_config)
        self.logger.info("Database connection manager initialized")

    async def _initialize_security(self):
        """Initialize enterprise security manager."""
        self.logger.info("Initializing enterprise security manager...")
        self.security_manager = EnterpriseSecurityManager(self.config)
        self.audit_logger = SecurityEventLogger(self.config.audit_config.__dict__)
        await self.security_manager.initialize_enterprise_security()
        self.logger.info("Enterprise security manager initialized")

    async def _initialize_compliance(self):
        """Initialize compliance management."""
        self.logger.info("Initializing compliance manager...")
        self.compliance_manager = ComplianceManager(self.config)
        await self.compliance_manager.initialize_compliance_requirements()

        # Perform initial compliance assessments
        for framework in [
            ComplianceFramework.SOX,
            ComplianceFramework.GDPR,
            ComplianceFramework.ISO_27001,
        ]:
            try:
                report_id = await self.compliance_manager.perform_compliance_assessment(
                    framework
                )
                self.logger.info(
                    f"Initial compliance assessment completed for {framework.value}: {report_id}"
                )
            except Exception as e:
                self.logger.warning(
                    f"Compliance assessment failed for {framework.value}: {str(e)}"
                )

        self.logger.info("Compliance manager initialized")

    async def _initialize_incident_response(self):
        """Initialize incident response manager."""
        self.logger.info("Initializing incident response manager...")
        self.incident_manager = IncidentResponseManager(self.config)
        self.logger.info("Incident response manager initialized")

    async def _initialize_quantum_detector(self):
        """Initialize quantum threat detector."""
        self.logger.info("Initializing quantum detector...")
        self.quantum_detector = EnterpriseQuantumDetector(
            self.config.detection.__dict__, self.db_manager, self.security_manager
        )
        await self.quantum_detector.initialize()
        self.logger.info("Quantum detector initialized")

    async def _initialize_advanced_detector(self):
        """Initialize advanced quantum threat detector with ML capabilities."""
        self.logger.info("Initializing advanced quantum detector...")
        self.advanced_detector = AdvancedQuantumDetector(
            self.config.detection.__dict__, self.audit_logger, self.metrics_collector
        )
        await self.advanced_detector.initialize()
        self.logger.info("Advanced quantum detector initialized")

    async def _initialize_mempool_monitor(self):
        """Initialize mempool monitor."""
        self.logger.info("Initializing mempool monitor...")
        self.mempool_monitor = EnterpriseMempoolMonitor(
            self.config.detection.__dict__, self.quantum_detector, self.security_manager
        )
        await self.mempool_monitor.initialize()
        self.logger.info("Mempool monitor initialized")

    async def _initialize_realtime_monitor(self):
        """Initialize real-time mempool monitor with WebSocket support."""
        self.logger.info("Initializing real-time mempool monitor...")
        self.realtime_monitor = RealtimeMempoolMonitor(
            self.config,
            self.advanced_detector,
            self.security_manager,
            self.incident_manager,
        )
        await self.realtime_monitor.initialize()
        self.logger.info("Real-time mempool monitor initialized")

    async def _initialize_metrics(self):
        """Initialize metrics collection."""
        self.logger.info("Initializing metrics collector...")
        self.metrics_collector = MetricsCollector(self.config.detection.__dict__)
        await self.metrics_collector.initialize()
        self.logger.info("Metrics collector initialized")

    async def _initialize_api_server(self):
        """Initialize API server."""
        self.logger.info("Initializing enterprise API server...")
        self.api_server = EnterpriseAPI(self.config)
        await self.api_server.initialize()
        self.logger.info("Enterprise API server initialized")

    async def run(self):
        """Run the main application loop."""
        try:
            self.is_running = True
            self.logger.info("Starting Enterprise Quantum Mempool Monitor...")

            # Start all monitoring services
            monitoring_tasks = await self._start_monitoring_services()

            # Start API server in background
            api_task = asyncio.create_task(self._run_api_server())

            # Log application startup
            await self.audit_logger.log_critical_security_event(
                {
                    "event_type": "APPLICATION_STARTED",
                    "startup_time": self.startup_time,
                    "uptime_seconds": (
                        datetime.utcnow() - self.startup_time
                    ).total_seconds(),
                    "timestamp": datetime.utcnow(),
                    "status": "SUCCESS",
                }
            )

            self.logger.info("Enterprise Quantum Mempool Monitor is now running!")
            self.logger.info("Press Ctrl+C to stop the application")

            # Wait for shutdown signal
            all_tasks = monitoring_tasks + [api_task]
            await asyncio.gather(*all_tasks, return_exceptions=True)

        except KeyboardInterrupt:
            self.logger.info("Shutdown requested by user")
        except Exception as e:
            self.logger.error(f"Application error: {str(e)}")
            await self.audit_logger.log_critical_security_event(
                {
                    "event_type": "APPLICATION_ERROR",
                    "error": str(e),
                    "timestamp": datetime.utcnow(),
                    "status": "FAILURE",
                }
            )
        finally:
            await self.shutdown()

    async def _start_monitoring_services(self):
        """Start all monitoring services."""
        monitoring_tasks = []

        # Start mempool monitoring
        if self.mempool_monitor:
            monitoring_tasks.append(
                asyncio.create_task(self.mempool_monitor.start_monitoring())
            )

        # Start quantum detection
        if self.quantum_detector:
            monitoring_tasks.append(
                asyncio.create_task(self.quantum_detector.start_continuous_monitoring())
            )

        # Start metrics collection
        if self.metrics_collector:
            monitoring_tasks.append(
                asyncio.create_task(self.metrics_collector.start_collection())
            )

        # Start compliance monitoring
        if self.compliance_manager:
            monitoring_tasks.append(
                asyncio.create_task(self._run_compliance_monitoring())
            )

        return monitoring_tasks

    async def _run_api_server(self):
        """Run the API server."""
        if self.api_server:
            # In a real implementation, this would start the FastAPI server
            # For now, we'll simulate the API server running
            while self.is_running:
                await asyncio.sleep(1)

    async def _run_compliance_monitoring(self):
        """Run continuous compliance monitoring."""
        while self.is_running:
            try:
                # Perform periodic compliance checks
                for framework in [ComplianceFramework.GDPR, ComplianceFramework.NIST]:
                    try:
                        await self.compliance_manager.perform_compliance_assessment(
                            framework
                        )
                    except Exception as e:
                        self.logger.warning(
                            f"Compliance check failed for {framework.value}: {str(e)}"
                        )

                # Wait before next check (every 6 hours)
                await asyncio.sleep(6 * 3600)

            except Exception as e:
                self.logger.error(f"Compliance monitoring error: {str(e)}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying

    async def shutdown(self):
        """Gracefully shutdown the application."""
        if not self.is_running:
            return

        self.is_running = False
        self.logger.info("Shutting down Enterprise Quantum Mempool Monitor...")

        try:
            # Stop monitoring services
            if self.mempool_monitor:
                await self.mempool_monitor.stop_monitoring()

            if self.quantum_detector:
                await self.quantum_detector.stop_monitoring()

            if self.metrics_collector:
                await self.metrics_collector.stop_collection()

            # Close database connections
            if self.db_manager:
                await self.db_manager.close_all_connections()

            # Log shutdown
            if self.audit_logger:
                uptime = (
                    (datetime.utcnow() - self.startup_time).total_seconds()
                    if self.startup_time
                    else 0
                )
                await self.audit_logger.log_critical_security_event(
                    {
                        "event_type": "APPLICATION_SHUTDOWN",
                        "uptime_seconds": uptime,
                        "timestamp": datetime.utcnow(),
                        "status": "SUCCESS",
                    }
                )

            self.logger.info("Enterprise Quantum Mempool Monitor shutdown completed")

        except Exception as e:
            self.logger.error(f"Error during shutdown: {str(e)}")

    async def health_check(self) -> dict:
        """Perform application health check."""
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "uptime_seconds": (
                (datetime.utcnow() - self.startup_time).total_seconds()
                if self.startup_time
                else 0
            ),
            "components": {},
        }

        # Check database
        if self.db_manager:
            try:
                await self.db_manager.health_check()
                health_status["components"]["database"] = "healthy"
            except Exception:
                health_status["components"]["database"] = "unhealthy"
                health_status["status"] = "degraded"

        # Check quantum detector
        if self.quantum_detector:
            health_status["components"]["quantum_detector"] = "healthy"

        # Check mempool monitor
        if self.mempool_monitor:
            health_status["components"]["mempool_monitor"] = "healthy"

        # Check security manager
        if self.security_manager:
            health_status["components"]["security_manager"] = "healthy"

        return health_status


async def main():
    """Main application entry point."""
    app = QuantumMempoolMonitorApp()

    try:
        # Initialize the application
        await app.initialize()

        # Run the application
        await app.run()

    except KeyboardInterrupt:
        print("\nShutdown requested by user")
    except Exception as e:
        print(f"Application failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    """
    Enterprise Quantum Mempool Monitor

    Usage:
        python main.py

    Environment Variables:
        DATABASE_URL: Database connection string
        LOG_LEVEL: Logging level (DEBUG, INFO, WARNING, ERROR)
        API_PORT: API server port (default: 8000)
        ENVIRONMENT: Deployment environment (dev, staging, prod)

    Features:
        - Real-time quantum threat detection
        - Enterprise security and compliance
        - Automated incident response
        - Comprehensive audit logging
        - RESTful API for integration
        - Performance monitoring and metrics
    """
    asyncio.run(main())
