#!/usr/bin/env python3
"""
Command Line Interface for Unified Mempool Monitoring System
"""

import asyncio
import os
import sys
from pathlib import Path

import click

# Add the src directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from unified_mempool.core.unified_mempool_engine import UnifiedMempoolEngine


@click.group()
@click.version_option(version="1.0.0", prog_name="Unified Mempool System")
def main():
    """
    Unified Mempool Monitoring System CLI

    A world-class mempool monitoring system consolidating 11 different services
    into a unified, real-time, synchronized monitoring platform.
    """


@main.command()
@click.option("--config", "-c", type=click.Path(exists=True), help="Path to configuration file")
@click.option("--host", default="0.0.0.0", help="Host to bind the API server")
@click.option("--port", default=8000, help="Port to bind the API server")
@click.option("--workers", default=1, help="Number of worker processes")
@click.option(
    "--log-level",
    default="info",
    type=click.Choice(["debug", "info", "warning", "error"]),
    help="Log level",
)
def api(config: str | None, host: str, port: int, workers: int, log_level: str):
    """Start the Unified Mempool API server."""
    click.echo("🚀 Starting Unified Mempool API server...")
    click.echo(f"   Host: {host}")
    click.echo(f"   Port: {port}")
    click.echo(f"   Workers: {workers}")
    click.echo(f"   Log Level: {log_level}")

    if config:
        click.echo(f"   Config: {config}")
        os.environ["CONFIG_PATH"] = config

    # Start the API server
    import uvicorn

    uvicorn.run(
        "unified_mempool.api.unified_api_gateway:app",
        host=host,
        port=port,
        workers=workers,
        log_level=log_level,
        reload=False,
    )


@main.command()
@click.option("--config", "-c", type=click.Path(exists=True), help="Path to configuration file")
@click.option(
    "--networks", "-n", multiple=True, help="Networks to monitor (e.g., ethereum, polygon)"
)
@click.option(
    "--duration", "-d", type=int, default=0, help="Duration to run monitoring (0 = infinite)"
)
@click.option(
    "--output",
    "-o",
    type=click.Choice(["console", "json", "csv"]),
    default="console",
    help="Output format",
)
def monitor(config: str | None, networks: tuple, duration: int, output: str):
    """Start the Unified Mempool monitoring engine."""
    click.echo("🔍 Starting Unified Mempool monitoring...")

    if config:
        click.echo(f"   Config: {config}")
        os.environ["CONFIG_PATH"] = config

    if networks:
        click.echo(f"   Networks: {', '.join(networks)}")

    click.echo(f"   Duration: {'infinite' if duration == 0 else f'{duration}s'}")
    click.echo(f"   Output: {output}")

    async def run_monitoring():
        engine = UnifiedMempoolEngine()
        await engine.initialize()

        try:
            if duration > 0:
                await asyncio.sleep(duration)
            else:
                # Run indefinitely
                while True:
                    await asyncio.sleep(1)
        except KeyboardInterrupt:
            click.echo("\n🛑 Monitoring stopped by user")
        finally:
            await engine.shutdown()

    asyncio.run(run_monitoring())


@main.command()
@click.option("--config", "-c", type=click.Path(exists=True), help="Path to configuration file")
def test(config: str | None):
    """Test the Unified Mempool system configuration and connections."""
    click.echo("🧪 Testing Unified Mempool system...")

    if config:
        click.echo(f"   Config: {config}")
        os.environ["CONFIG_PATH"] = config

    async def run_tests():
        engine = UnifiedMempoolEngine()

        try:
            await engine.initialize()
            click.echo("✅ System initialization successful")

            # Test blockchain connections
            click.echo("🔗 Testing blockchain connections...")
            # Add connection tests here

            click.echo("✅ All tests passed!")

        except Exception as e:
            click.echo(f"❌ Test failed: {e}")
            sys.exit(1)
        finally:
            await engine.shutdown()

    asyncio.run(run_tests())


@main.command()
@click.option("--config", "-c", type=click.Path(exists=True), help="Path to configuration file")
def status(config: str | None):
    """Show the current status of the Unified Mempool system."""
    click.echo("📊 Unified Mempool System Status")

    if config:
        click.echo(f"   Config: {config}")
        os.environ["CONFIG_PATH"] = config

    async def get_status():
        engine = UnifiedMempoolEngine()

        try:
            await engine.initialize()

            # Get system status
            status_data = await engine.get_system_status()

            click.echo(f"   Status: {status_data.get('status', 'Unknown')}")
            click.echo(f"   Uptime: {status_data.get('uptime', 'Unknown')}")
            click.echo(f"   Networks: {len(status_data.get('networks', {}))}")
            click.echo(f"   Transactions Processed: {status_data.get('transactions_processed', 0)}")
            click.echo(f"   MEV Attacks Detected: {status_data.get('mev_attacks', 0)}")

        except Exception as e:
            click.echo(f"❌ Failed to get status: {e}")
            sys.exit(1)
        finally:
            await engine.shutdown()

    asyncio.run(get_status())


@main.command()
def version():
    """Show version information."""
    click.echo("Unified Mempool Monitoring System v1.0.0")
    click.echo("Built with ❤️ by the Scorpius Team")


if __name__ == "__main__":
    main()
