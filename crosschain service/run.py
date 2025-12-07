#!/usr/bin/env python3
"""
Cross-Chain Bridge Service Runner

This script provides a convenient way to run the Cross-Chain Bridge Service
with different configurations and options.
"""

import argparse
import os
import sys
from pathlib import Path

import uvicorn

# Add src to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))


def main():
    """Main entry point for the service runner."""
    parser = argparse.ArgumentParser(
        description="Cross-Chain Bridge Security Analysis Service",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run in development mode with auto-reload
  python run.py --dev

  # Run in production mode
  python run.py --prod

  # Run with custom host and port
  python run.py --host 0.0.0.0 --port 9000

  # Run with specific log level
  python run.py --log-level debug

  # Run with custom workers
  python run.py --workers 4
        """,
    )

    # Environment options
    parser.add_argument(
        "--dev", action="store_true", help="Run in development mode with auto-reload"
    )
    parser.add_argument("--prod", action="store_true", help="Run in production mode")

    # Server options
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to (default: 8000)")
    parser.add_argument(
        "--workers", type=int, default=1, help="Number of worker processes (default: 1)"
    )

    # Logging options
    parser.add_argument(
        "--log-level",
        choices=["debug", "info", "warning", "error", "critical"],
        default="info",
        help="Log level (default: info)",
    )

    # SSL options
    parser.add_argument("--ssl-keyfile", help="SSL key file path")
    parser.add_argument("--ssl-certfile", help="SSL certificate file path")

    # Other options
    parser.add_argument(
        "--reload", action="store_true", help="Enable auto-reload (development only)"
    )
    parser.add_argument("--access-log", action="store_true", help="Enable access logging")

    args = parser.parse_args()

    # Determine configuration based on arguments
    if args.dev:
        config = {"reload": True, "log_level": "debug", "access_log": True, "workers": 1}
    elif args.prod:
        config = {"reload": False, "log_level": "info", "access_log": True, "workers": args.workers}
    else:
        config = {
            "reload": args.reload,
            "log_level": args.log_level,
            "access_log": args.access_log,
            "workers": args.workers,
        }

    # SSL configuration
    ssl_config = {}
    if args.ssl_keyfile and args.ssl_certfile:
        ssl_config = {"ssl_keyfile": args.ssl_keyfile, "ssl_certfile": args.ssl_certfile}

    # Set environment variables
    os.environ.setdefault("PYTHONPATH", str(Path(__file__).parent / "src"))

    print("🚀 Starting Cross-Chain Bridge Security Analysis Service")
    print(f"📍 Host: {args.host}")
    print(f"🔌 Port: {args.port}")
    print(f"📊 Log Level: {config['log_level']}")
    print(f"🔄 Auto-reload: {config['reload']}")
    print(f"👥 Workers: {config['workers']}")
    if ssl_config:
        print("🔒 SSL: Enabled")
    print("=" * 60)

    try:
        uvicorn.run(
            "src.api.main:app",
            host=args.host,
            port=args.port,
            reload=config["reload"],
            log_level=config["log_level"],
            access_log=config["access_log"],
            workers=config["workers"] if not config["reload"] else 1,
            **ssl_config,
        )
    except KeyboardInterrupt:
        print("\n🛑 Service stopped by user")
    except Exception as e:
        print(f"❌ Error starting service: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
