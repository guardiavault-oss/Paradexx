#!/usr/bin/env python3
"""
🚀 UNIFIED MEMPOOL SYSTEM STARTUP SCRIPT
========================================
Startup script for the world-class unified mempool monitoring system.
"""

import asyncio
import logging
import os
import signal
import sys
from pathlib import Path
from typing import Any

import yaml
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

import uvicorn

from api.unified_api_gateway import app
from core.unified_mempool_engine import UnifiedMempoolEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

console = Console()


class UnifiedMempoolSystem:
    """Unified Mempool System Manager"""

    def __init__(self, config_path: str = "config/config.yaml"):
        self.config_path = config_path
        self.config = self._load_config()
        self.engine = None
        self.api_server = None
        self.is_running = False

    def _load_config(self) -> dict[str, Any]:
        """Load configuration from YAML file"""
        try:
            with open(self.config_path) as f:
                config = yaml.safe_load(f)
            console.print(f"[green]✅ Configuration loaded from {self.config_path}[/green]")
            return config
        except FileNotFoundError:
            console.print(f"[yellow]⚠️ Config file not found: {self.config_path}[/yellow]")
            console.print("[cyan]Using default configuration...[/cyan]")
            return self._get_default_config()
        except Exception as e:
            console.print(f"[red]❌ Error loading config: {e}[/red]")
            return self._get_default_config()

    def _get_default_config(self) -> dict[str, Any]:
        """Get default configuration"""
        return {
            "system": {
                "name": "Unified Mempool Monitoring System",
                "version": "1.0.0",
                "environment": "development",
                "debug": True,
                "log_level": "INFO",
            },
            "networks": {
                "ethereum": {
                    "enabled": True,
                    "rpc_url": "https://eth-mainnet.alchemyapi.io/v2/demo",
                    "priority": 1,
                },
                "polygon": {"enabled": True, "rpc_url": "https://polygon-rpc.com", "priority": 2},
                "bsc": {
                    "enabled": True,
                    "rpc_url": "https://bsc-dataseed.binance.org",
                    "priority": 3,
                },
            },
            "monitoring": {
                "refresh_rate": 1000,
                "batch_size": 100,
                "max_transactions": 10000,
                "retention_hours": 24,
            },
            "api": {"host": "0.0.0.0", "port": 8000, "workers": 4, "reload": True},
        }

    async def initialize_engine(self):
        """Initialize the unified mempool engine"""
        console.print("[bold blue]🚀 Initializing Unified Mempool Engine...[/bold blue]")

        try:
            # Create engine with configuration
            engine_config = {
                "networks": self.config["networks"],
                "monitoring": self.config["monitoring"],
                "security": self.config.get("security", {}),
                "performance": self.config.get("performance", {}),
            }

            self.engine = UnifiedMempoolEngine(engine_config)

            # Initialize with progress bar
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console,
            ) as progress:
                task = progress.add_task("Initializing engine components...", total=None)

                await self.engine.initialize()
                progress.update(task, description="✅ Engine initialized successfully!")

            console.print("[green]✅ Unified Mempool Engine ready![/green]")

        except Exception as e:
            console.print(f"[red]❌ Failed to initialize engine: {e}[/red]")
            raise

    async def start_monitoring(self):
        """Start mempool monitoring"""
        if not self.engine:
            raise RuntimeError("Engine not initialized")

        console.print("[bold green]🚀 Starting Mempool Monitoring...[/bold green]")

        try:
            await self.engine.start_monitoring()
            self.is_running = True
            console.print("[green]✅ Mempool monitoring started![/green]")

        except Exception as e:
            console.print(f"[red]❌ Failed to start monitoring: {e}[/red]")
            raise

    async def start_api_server(self):
        """Start the API server"""
        console.print("[bold blue]🌐 Starting API Server...[/bold blue]")

        try:
            api_config = self.config["api"]

            # Start API server in background
            config = uvicorn.Config(
                app=app,
                host=api_config["host"],
                port=api_config["port"],
                workers=api_config.get("workers", 1),
                reload=api_config.get("reload", False),
                log_level="info",
            )

            self.api_server = uvicorn.Server(config)

            # Start server in background task
            asyncio.create_task(self.api_server.serve())

            console.print(
                f"[green]✅ API Server started on http://{api_config['host']}:{api_config['port']}[/green]"
            )
            console.print(
                f"[cyan]📚 API Documentation: http://{api_config['host']}:{api_config['port']}/docs[/cyan]"
            )

        except Exception as e:
            console.print(f"[red]❌ Failed to start API server: {e}[/red]")
            raise

    async def display_system_status(self):
        """Display system status"""
        if not self.engine:
            return

        try:
            status = await self.engine.get_system_status()

            # Create status table
            table = Table(title="🚀 Unified Mempool System Status")
            table.add_column("Component", style="cyan")
            table.add_column("Status", style="green")
            table.add_column("Details", style="white")

            table.add_row(
                "System",
                "Active" if self.is_running else "Inactive",
                f"Uptime: {status['uptime_seconds']:.1f}s",
            )
            table.add_row(
                "Networks",
                f"{status['networks_monitored']}",
                f"Active: {', '.join(status['active_networks'])}",
            )
            table.add_row(
                "Transactions", f"{status['statistics']['total_transactions']}", "Processed"
            )
            table.add_row("MEV Attacks", f"{status['statistics']['attacks_detected']}", "Detected")
            table.add_row(
                "Protected", f"{status['statistics']['transactions_protected']}", "Transactions"
            )
            table.add_row("Threat Level", status["threat_level"].upper(), "Overall")

            console.print(table)

        except Exception as e:
            console.print(f"[red]❌ Error displaying status: {e}[/red]")

    async def run_system(self):
        """Run the complete system"""
        try:
            # Initialize engine
            await self.initialize_engine()

            # Start monitoring
            await self.start_monitoring()

            # Start API server
            await self.start_api_server()

            # Display initial status
            await self.display_system_status()

            console.print("\n[bold green]🎉 Unified Mempool System is running![/bold green]")
            console.print("[cyan]Press Ctrl+C to stop the system[/cyan]")

            # Keep system running
            while self.is_running:
                await asyncio.sleep(10)

                # Display periodic status updates
                if self.engine:
                    await self.display_system_status()

        except KeyboardInterrupt:
            console.print("\n[yellow]⏹️ Shutting down system...[/yellow]")
        except Exception as e:
            console.print(f"\n[red]❌ System error: {e}[/red]")
            logger.error(f"System error: {e}", exc_info=True)
        finally:
            await self.shutdown()

    async def shutdown(self):
        """Shutdown the system gracefully"""
        console.print("[yellow]⏹️ Shutting down Unified Mempool System...[/yellow]")

        try:
            # Stop monitoring
            if self.engine:
                await self.engine.stop_monitoring()
                console.print("[green]✅ Monitoring stopped[/green]")

            # Stop API server
            if self.api_server:
                self.api_server.should_exit = True
                console.print("[green]✅ API server stopped[/green]")

            self.is_running = False
            console.print("[green]✅ System shutdown complete![/green]")

        except Exception as e:
            console.print(f"[red]❌ Error during shutdown: {e}[/red]")
            logger.error(f"Shutdown error: {e}", exc_info=True)


def setup_signal_handlers(system: UnifiedMempoolSystem):
    """Setup signal handlers for graceful shutdown"""

    def signal_handler(signum, frame):
        console.print(f"\n[yellow]Received signal {signum}, shutting down...[/yellow]")
        system.is_running = False

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)


async def main():
    """Main entry point"""
    console.print(
        Panel.fit(
            "[bold blue]🚀 UNIFIED MEMPOOL MONITORING SYSTEM[/bold blue]\n"
            "[cyan]World-class mempool monitoring with 11 integrated services[/cyan]\n"
            "[green]Version 1.0.0[/green]",
            title="System Startup",
            border_style="blue",
        )
    )

    # Create system instance
    system = UnifiedMempoolSystem()

    # Setup signal handlers
    setup_signal_handlers(system)

    # Create logs directory
    os.makedirs("logs", exist_ok=True)

    # Run the system
    await system.run_system()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        console.print("\n[yellow]👋 Goodbye![/yellow]")
    except Exception as e:
        console.print(f"\n[red]❌ Fatal error: {e}[/red]")
        sys.exit(1)
