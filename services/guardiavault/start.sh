#!/bin/sh
# Railway Railpack startup script for GuardiaVault
# This script is used by Railway's Railpack to start the application

set -e

echo "🚀 Starting GuardiaVault via Railpack..."
echo "📊 Environment: ${NODE_ENV:-production}"
echo "🔌 Port: ${PORT:-5000}"

# Ensure we're using the production startup script if available
if [ -f "scripts/startup.sh" ]; then
    echo "📝 Using production startup script..."
    chmod +x scripts/startup.sh
    exec sh scripts/startup.sh
else
    echo "📝 Using direct startup command..."
    # Fallback to direct npm start
    exec npm start
fi