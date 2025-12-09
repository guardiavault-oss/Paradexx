#!/bin/bash
# Ultimate Quantum Mempool Monitor - Docker Entrypoint Script

set -e

echo "=========================================="
echo "Ultimate Quantum Mempool Monitor v3.0"
echo "Starting Enterprise-Grade Monitoring..."
echo "=========================================="

# Environment setup
export PYTHONPATH=/app
export QUANTUM_ENV=${QUANTUM_ENV:-production}

# Wait for external dependencies (if needed)
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    
    echo "Waiting for $service_name to be ready..."
    while ! nc -z "$host" "$port" 2>/dev/null; do
        echo "Waiting for $service_name at $host:$port..."
        sleep 2
    done
    echo "$service_name is ready!"
}

# Check if we should wait for external services
if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ]; then
    wait_for_service "$REDIS_HOST" "$REDIS_PORT" "Redis"
fi

if [ -n "$POSTGRES_HOST" ] && [ -n "$POSTGRES_PORT" ]; then
    wait_for_service "$POSTGRES_HOST" "$POSTGRES_PORT" "PostgreSQL"
fi

# Initialize database if needed
echo "Initializing database..."
python -c "
import asyncio
from src.database.simple_connection_manager import SimpleDatabaseManager
from src.utils.config import EnterpriseConfig

async def init_db():
    config = EnterpriseConfig()
    db_config = getattr(config, 'database_config', None) or getattr(config, 'database', {})
    db_manager = SimpleDatabaseManager(db_config)
    print('Database initialization completed')

try:
    asyncio.run(init_db())
except Exception as e:
    print(f'Database initialization warning: {e}')
"

# Create necessary directories
mkdir -p /app/logs /app/data /app/dashboard/static /app/dashboard/templates

# Set proper permissions
chmod -R 755 /app/logs /app/data /app/dashboard

echo "Environment: $QUANTUM_ENV"
echo "Python path: $PYTHONPATH"
echo "Working directory: $(pwd)"
echo "User: $(whoami)"

# Print system information
echo "System Information:"
echo "- Python version: $(python --version)"
echo "- Available memory: $(free -h | grep '^Mem:' | awk '{print $2}')"
echo "- Disk space: $(df -h / | tail -1 | awk '{print $4}')"

# Start the application
echo "Starting Ultimate Quantum Mempool Monitor..."
echo "=========================================="

# Execute the provided command
exec "$@"
