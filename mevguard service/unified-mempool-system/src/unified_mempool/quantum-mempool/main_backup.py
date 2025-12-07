"""
Enterprise Quantum Mempool Monitor - Main Application Entry Point

This is the main entry point for the enterprise-grade quantum-assisted
brute-force detection system for blockchain mempool monitoring.
"""

import asyncio
import signal
import sys
from pathlib import Path
from typing import Optional

# Add src to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.enterprise.security_manager import EnterpriseSecurityManager
from src.mempool.monitor import EnterpriseMempoolMonitor, SecurityContext
from src.utils.config import load_config
from src.utils.metrics import initialize_metrics


class QuantumMempoolApplication:
    """
    Main application class for the Enterprise Quantum Mempool Monitor.

    Features:
    - Enterprise security integration
    - Comprehensive monitoring and alerting
    - Compliance and audit logging
    - High availability and disaster recovery
    - Real-time quantum attack detection
    """

    def __init__(self, config_path: Optional[str] = None):
        # Load enterprise configuration
        if config_path:
            self.config = load_config(config_path)
        else:
            self.config = load_config("config/enterprise-config.yaml")

        # Initialize components
        self.mempool_monitor: Optional[EnterpriseMempoolMonitor] = None
        self.security_manager: Optional[EnterpriseSecurityManager] = None
        self.security_context: Optional[SecurityContext] = None
        self.running = False

        # Setup signal handlers
        self._setup_signal_handlers()

    def _setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown."""

        def signal_handler(signum, frame):
            print(f"Received signal {signum}, initiating graceful shutdown...")
            asyncio.create_task(self.shutdown())

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

    async def initialize(self):
        """Initialize the enterprise quantum monitoring system."""
        try:
            print("Initializing Enterprise Quantum Mempool Monitor...")

            # Initialize metrics collection
            print("- Initializing metrics collection...")
            initialize_metrics(self.config.metrics_config.__dict__)

            # Initialize security manager
            print("- Initializing enterprise security...")
            self.security_manager = EnterpriseSecurityManager(self.config)
            await self.security_manager.initialize_enterprise_security()

            # Create security context for system operations
            session_id = await self.security_manager.create_session("SYSTEM")
            self.security_context = SecurityContext(
                user_id="SYSTEM",
                session_id=session_id,
                operation_type="MONITORING",
                risk_level="HIGH",
                compliance_required=True,
                audit_required=True,
            )

            # Initialize mempool monitor
            print("- Initializing quantum mempool monitor...")
            self.mempool_monitor = EnterpriseMempoolMonitor(self.config)
            await self.mempool_monitor.initialize_enterprise_monitoring(
                self.security_context
            )

            print("✅ Enterprise Quantum Mempool Monitor initialized successfully!")

        except Exception as e:
            print(f"❌ Failed to initialize application: {e}")
            raise

    async def start(self):
        """Start the quantum monitoring application."""
        try:
            await self.initialize()

            print("🚀 Starting Enterprise Quantum Monitoring...")
            self.running = True

            # Start mempool monitoring
            monitoring_task = asyncio.create_task(
                self.mempool_monitor.start_quantum_monitoring()
            )

            # Start health monitoring
            health_task = asyncio.create_task(self._health_monitoring_loop())

            # Wait for tasks
            await asyncio.gather(monitoring_task, health_task)

        except KeyboardInterrupt:
            print("Received keyboard interrupt, shutting down...")
        except Exception as e:
            print(f"❌ Application error: {e}")
            raise
        finally:
            await self.shutdown()

    async def _health_monitoring_loop(self):
        """Application health monitoring loop."""
        while self.running:
            try:
                # Perform health checks
                health_status = await self._perform_health_checks()

                if not health_status["healthy"]:
                    print(f"⚠️ Health check failed: {health_status['issues']}")

                # Sleep for health check interval
                await asyncio.sleep(60)  # Check every minute

            except Exception as e:
                print(f"Health monitoring error: {e}")
                await asyncio.sleep(120)  # Longer delay on error

    async def _perform_health_checks(self) -> dict:
        """Perform comprehensive health checks."""
        health_status = {
            "healthy": True,
            "issues": [],
            "timestamp": asyncio.get_event_loop().time(),
        }

        try:
            # Check mempool monitor health
            if self.mempool_monitor and not self.mempool_monitor.monitoring_active:
                health_status["healthy"] = False
                health_status["issues"].append("Mempool monitoring not active")

            # Check security manager health
            if not self.security_manager or not self.security_manager.rbac_manager:
                health_status["healthy"] = False
                health_status["issues"].append(
                    "Security manager not properly initialized"
                )

            # Additional health checks would go here

        except Exception as e:
            health_status["healthy"] = False
            health_status["issues"].append(f"Health check error: {e}")

        return health_status

    async def shutdown(self):
        """Gracefully shutdown the application."""
        if not self.running:
            return

        print("🛑 Shutting down Enterprise Quantum Mempool Monitor...")
        self.running = False

        try:
            # Stop mempool monitoring
            if self.mempool_monitor:
                print("- Stopping mempool monitoring...")
                await self.mempool_monitor.stop_monitoring()

            # Clean up security resources
            if self.security_manager:
                print("- Cleaning up security resources...")
                # Additional cleanup would go here

            print("✅ Shutdown completed successfully")

        except Exception as e:
            print(f"❌ Error during shutdown: {e}")


async def main():
    """Main entry point for the application."""
    try:
        # Initialize and start the application
        app = QuantumMempoolApplication()
        await app.start()

    except KeyboardInterrupt:
        print("\nReceived keyboard interrupt, exiting...")
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    # Run the application
    print("=" * 60)
    print("🔬 Enterprise Quantum Mempool Monitor")
    print("   Advanced Quantum Attack Detection System")
    print("=" * 60)

    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Error: Python 3.8 or higher is required")
        sys.exit(1)

    # Run the application
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Application failed to start: {e}")
        sys.exit(1)
