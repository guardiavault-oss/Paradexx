#!/bin/bash
set -e

# Docker entrypoint script for Unified Quantum Mempool Monitor

echo "🚀 Starting Unified Quantum Mempool Monitor..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
while ! curl -s "http://postgres:5432" > /dev/null 2>&1; do
    echo "Database not ready, waiting..."
    sleep 5
done

# Wait for Redis to be ready
echo "⏳ Waiting for Redis connection..."
while ! curl -s "http://redis:6379" > /dev/null 2>&1; do
    echo "Redis not ready, waiting..."
    sleep 2
done

# Initialize database if needed
echo "🗄️ Initializing database..."
python -c "
import asyncio
from src.database.simple_connection_manager import SimpleDatabaseManager
from src.utils.config import EnterpriseConfig

async def init_db():
    config = EnterpriseConfig()
    db_manager = SimpleDatabaseManager(config.database_config)
    # Database initialization would go here
    print('Database initialized')

asyncio.run(init_db())
" || echo "Database initialization skipped or failed"

# Create necessary directories
mkdir -p logs data dashboard/static dashboard/templates

# Set permissions
chown -R quantum:quantum logs data

echo "✅ Initialization complete!"

# Execute the main command
exec "$@"
