#!/bin/bash
# Cross-Chain Bridge Service - Standalone Launcher
# ================================================

export SERVICE_NAME="cross-chain-bridge-service"
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-8000}"

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Use the universal startup script
exec "./start-standalone-service.sh" "$@"