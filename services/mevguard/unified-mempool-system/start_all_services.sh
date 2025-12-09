#!/bin/bash
# Start All Mempool Services
# This script starts all mempool services in separate terminals/processes

echo "🚀 Starting All Mempool Services..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to start service in background
start_service() {
    local service_name=$1
    local command=$2
    local port=$3
    
    echo -e "${YELLOW}Starting $service_name on port $port...${NC}"
    
    # Create log directory if it doesn't exist
    mkdir -p logs
    
    # Start service in background and log output
    nohup bash -c "$command" > "logs/${service_name}.log" 2>&1 &
    echo $! > "logs/${service_name}.pid"
    
    echo -e "${GREEN}✅ $service_name started (PID: $(cat logs/${service_name}.pid))${NC}"
    echo "   Logs: logs/${service_name}.log"
}

# Start mempool-core (port 8000)
start_service "mempool-core" \
    "cd src/unified_mempool/mempool-core/app && python -m api.main" \
    8000

# Wait a bit for service to start
sleep 2

# Start mempool-hub (port 8011)
start_service "mempool-hub" \
    "cd src/unified_mempool/mempool-hub && python app.py" \
    8011

# Wait a bit
sleep 2

# Start unified-engine (port 8001)
start_service "unified-engine" \
    "python api/unified_api_gateway.py" \
    8001

# Wait a bit
sleep 3

echo ""
echo "🎉 All services started!"
echo ""
echo "Service Status:"
echo "  - mempool-core:    http://localhost:8000"
echo "  - mempool-hub:     http://localhost:8011"
echo "  - unified-engine:  http://localhost:8001"
echo ""
echo "To check logs:"
echo "  tail -f logs/mempool-core.log"
echo "  tail -f logs/mempool-hub.log"
echo "  tail -f logs/unified-engine.log"
echo ""
echo "To stop all services:"
echo "  ./stop_all_services.sh"


