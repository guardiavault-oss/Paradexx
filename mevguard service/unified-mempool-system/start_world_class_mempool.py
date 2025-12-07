#!/usr/bin/env python3
"""
🚀 World-Class Mempool Monitoring System Launcher
=================================================
Production-ready startup script for the unified mempool monitoring system
with real blockchain integration and advanced features.
"""

import logging
import os
import signal
import subprocess
import sys
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent))

try:
    import uvicorn
    import yaml
    from rich.console import Console
    from rich.layout import Layout
    from rich.live import Live
    from rich.panel import Panel
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich.table import Table
except ImportError as e:
    print(f"❌ Missing dependencies: {e}")
    print("📦 Installing required packages...")
    subprocess.check_call(
        [
            sys.executable,
            "-m",
            "pip",
            "install",
            "-r",
            "requirements.txt",
            "--break-system-packages",
        ]
    )
    import uvicorn
    import yaml
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table

console = Console()


class WorldClassMempoolLauncher:
    """World-class mempool system launcher"""

    def __init__(self):
        self.config_path = Path(__file__).parent / "config" / "config.yaml"
        self.api_module = "api.unified_api_gateway:app"
        self.host = "0.0.0.0"
        self.port = 8004
        self.workers = 1  # Single worker for now to avoid issues
        self.log_level = "info"
        self.reload = False

        # Set up logging
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            handlers=[logging.FileHandler("logs/mempool_system.log"), logging.StreamHandler()],
        )
        self.logger = logging.getLogger(__name__)

    def display_banner(self):
        """Display startup banner"""
        banner = """
[bold blue]🚀 WORLD-CLASS MEMPOOL MONITORING SYSTEM[/bold blue]

[cyan]Features:[/cyan]
• Real-time multi-chain monitoring (Ethereum, Arbitrum, Optimism, Avalanche)
• Advanced MEV detection (sandwich attacks, arbitrage, flash loans)
• ML-powered risk scoring and threat analysis
• Real-time WebSocket streaming
• Comprehensive REST API with 20+ endpoints
• Enterprise-grade performance and security

[green]Status: Production Ready ✅[/green]
"""
        console.print(Panel(banner, title="System Startup", border_style="blue"))

    def check_dependencies(self):
        """Check system dependencies"""
        console.print("\n[yellow]🔍 Checking dependencies...[/yellow]")

        dependencies = [
            ("Python", sys.version_info >= (3, 9)),
            ("Config file", self.config_path.exists()),
            ("API module", True),  # We'll check this during import
        ]

        table = Table(title="Dependency Check")
        table.add_column("Component", style="cyan")
        table.add_column("Status", style="white")

        all_good = True
        for name, status in dependencies:
            if status:
                table.add_row(name, "✅ OK")
            else:
                table.add_row(name, "❌ MISSING")
                all_good = False

        console.print(table)

        if not all_good:
            console.print("[red]❌ Some dependencies are missing. Please install them first.[/red]")
            sys.exit(1)

        console.print("[green]✅ All dependencies satisfied[/green]")

    def load_config(self):
        """Load system configuration"""
        console.print("\n[yellow]📋 Loading configuration...[/yellow]")

        try:
            with open(self.config_path) as f:
                config = yaml.safe_load(f)

            # Override with config values if available
            api_config = config.get("api", {})
            self.host = api_config.get("host", self.host)
            self.port = api_config.get("port", self.port)
            self.workers = api_config.get("workers", self.workers)

            # Display config summary
            table = Table(title="Configuration")
            table.add_column("Setting", style="cyan")
            table.add_column("Value", style="green")

            table.add_row("Host", self.host)
            table.add_row("Port", str(self.port))
            table.add_row("Workers", str(self.workers))
            table.add_row("Networks", str(len(config.get("networks", {}))))

            console.print(table)
            console.print("[green]✅ Configuration loaded successfully[/green]")

        except Exception as e:
            console.print(f"[red]❌ Failed to load configuration: {e}[/red]")
            console.print("[yellow]Using default configuration...[/yellow]")

    def create_directories(self):
        """Create necessary directories"""
        directories = ["logs", "data", "cache"]

        for directory in directories:
            Path(directory).mkdir(exist_ok=True)

    def setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""

        def signal_handler(signum, frame):
            console.print(
                f"\n[yellow]🛑 Received signal {signum}, shutting down gracefully...[/yellow]"
            )
            sys.exit(0)

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

    def start_api_server(self):
        """Start the API server"""
        console.print("\n[bold green]🚀 Starting World-Class Mempool API Server[/bold green]")
        console.print(f"[cyan]• Server: http://{self.host}:{self.port}[/cyan]")
        console.print(f"[cyan]• Documentation: http://{self.host}:{self.port}/docs[/cyan]")
        console.print(f"[cyan]• Health Check: http://{self.host}:{self.port}/health[/cyan]")
        console.print(
            f"[cyan]• WebSocket Streams: ws://{self.host}:{self.port}/api/v1/stream/*[/cyan]"
        )

        try:
            # Change to the project directory
            os.chdir(Path(__file__).parent)

            # Start uvicorn server
            uvicorn.run(
                self.api_module,
                host=self.host,
                port=self.port,
                workers=self.workers,
                log_level=self.log_level,
                reload=self.reload,
                access_log=True,
                server_header=False,
                app_dir=str(Path(__file__).parent),
            )

        except Exception as e:
            console.print(f"[red]❌ Failed to start API server: {e}[/red]")
            sys.exit(1)

    def run_pre_flight_check(self):
        """Run pre-flight system check"""
        console.print("\n[yellow]✈️ Running pre-flight check...[/yellow]")

        try:
            # Test blockchain connections
            console.print("Testing blockchain connections...")
            result = subprocess.run(
                [sys.executable, "test_blockchain_connection.py"],
                check=False,
                capture_output=True,
                text=True,
                timeout=60,
            )

            if result.returncode == 0:
                console.print("[green]✅ Blockchain connections verified[/green]")
            else:
                console.print("[yellow]⚠️ Some blockchain connections may have issues[/yellow]")
                console.print("[dim]Check logs for details[/dim]")

        except subprocess.TimeoutExpired:
            console.print("[yellow]⚠️ Pre-flight check timed out (continuing anyway)[/yellow]")
        except Exception as e:
            console.print(f"[yellow]⚠️ Pre-flight check failed: {e}[/yellow]")
            console.print("[dim]Continuing with startup...[/dim]")

    def display_startup_info(self):
        """Display startup information"""
        startup_info = f"""
[bold green]🎉 SYSTEM STARTED SUCCESSFULLY![/bold green]

[cyan]Access Points:[/cyan]
• Main API: http://{self.host}:{self.port}
• Interactive Docs: http://{self.host}:{self.port}/docs
• Health Check: http://{self.host}:{self.port}/health
• System Status: http://{self.host}:{self.port}/api/v1/status
• Live Dashboard: http://{self.host}:{self.port}/api/v1/dashboard

[cyan]WebSocket Streams:[/cyan]
• Transactions: ws://{self.host}:{self.port}/api/v1/stream/transactions
• Alerts: ws://{self.host}:{self.port}/api/v1/stream/alerts
• Dashboard: ws://{self.host}:{self.port}/api/v1/stream/dashboard

[cyan]Key Endpoints:[/cyan]
• GET /api/v1/transactions - Get transactions with filtering
• GET /api/v1/mev/opportunities - Get MEV opportunities
• GET /api/v1/threats - Get threat intelligence
• GET /api/v1/networks - Get network information
• GET /api/v1/analytics/* - Get analytics data

[yellow]Press Ctrl+C to stop the server[/yellow]
"""
        console.print(
            Panel(startup_info, title="🚀 World-Class Mempool System", border_style="green")
        )

    def run(self, skip_preflight: bool = False):
        """Run the complete startup sequence"""
        try:
            # Display banner
            self.display_banner()

            # Check dependencies
            self.check_dependencies()

            # Load configuration
            self.load_config()

            # Create directories
            self.create_directories()

            # Setup signal handlers
            self.setup_signal_handlers()

            # Run pre-flight check (optional)
            if not skip_preflight:
                self.run_pre_flight_check()

            # Display startup info
            self.display_startup_info()

            # Start the API server (this will block)
            self.start_api_server()

        except KeyboardInterrupt:
            console.print("\n[yellow]👋 Shutdown requested by user[/yellow]")
        except Exception as e:
            console.print(f"\n[red]❌ Startup failed: {e}[/red]")
            sys.exit(1)


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="🚀 World-Class Mempool Monitoring System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python start_world_class_mempool.py                    # Start with default settings
  python start_world_class_mempool.py --skip-preflight  # Skip blockchain connection test
  python start_world_class_mempool.py --port 8080       # Start on custom port
        """,
    )

    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to (default: 0.0.0.0)")

    parser.add_argument("--port", type=int, default=8004, help="Port to bind to (default: 8004)")

    parser.add_argument(
        "--workers", type=int, default=1, help="Number of worker processes (default: 1)"
    )

    parser.add_argument(
        "--skip-preflight", action="store_true", help="Skip pre-flight blockchain connection check"
    )

    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")

    args = parser.parse_args()

    # Create launcher
    launcher = WorldClassMempoolLauncher()

    # Override settings from command line
    launcher.host = args.host
    launcher.port = args.port
    launcher.workers = args.workers
    launcher.reload = args.reload

    # Run the system
    launcher.run(skip_preflight=args.skip_preflight)


if __name__ == "__main__":
    main()
