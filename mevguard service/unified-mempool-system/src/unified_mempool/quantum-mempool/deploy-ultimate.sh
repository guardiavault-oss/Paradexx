#!/bin/bash

# Ultimate Quantum Mempool Monitor - Deployment Script
# Complete setup and deployment automation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ultimate-quantum-mempool"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose-ultimate.yml}"
ENV_FILE="${ENV_FILE:-.env}"
LOG_LEVEL="${LOG_LEVEL:-INFO}"

echo -e "${BLUE}🚀 Ultimate Quantum Mempool Monitor Deployment${NC}"
echo "============================================================"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker compose is available
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    print_error "docker compose is not available."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    print_warning "Creating default .env file..."
    cat > "$ENV_FILE" << EOF
# Ultimate Quantum Mempool Monitor Environment Configuration

# Database
POSTGRES_PASSWORD=quantum_secure_pass_$(date +%s)
REDIS_PASSWORD=redis_secure_pass_$(date +%s)

# Monitoring
GRAFANA_PASSWORD=grafana_admin_$(date +%s)
GRAFANA_SECRET_KEY=grafana_secret_$(openssl rand -hex 32)

# Security
ELASTIC_PASSWORD=elastic_secure_pass_$(date +%s)

# Object Storage
MINIO_ROOT_USER=quantum_admin
MINIO_ROOT_PASSWORD=quantum_minio_$(date +%s)

# Application
QUANTUM_ENV=production
LOG_LEVEL=INFO
DEBUG=false

# Blockchain Configuration
ETHEREUM_RPC_URL=http://localhost:8545
BITCOIN_RPC_URL=http://localhost:8332
BITCOIN_RPC_USER=bitcoin_user
BITCOIN_RPC_PASSWORD=bitcoin_password

# JWT Configuration
JWT_SECRET=$(openssl rand -hex 64)
EOF
    print_status "Default environment file created: $ENV_FILE"
    print_warning "Please review and update the configuration in $ENV_FILE"
fi

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local timeout=${3:-60}
    
    echo "⏳ Waiting for $service_name to be ready on port $port..."
    for i in $(seq 1 $timeout); do
        if curl -s "http://localhost:$port" > /dev/null 2>&1; then
            print_status "$service_name is ready!"
            return 0
        fi
        sleep 1
    done
    print_error "$service_name failed to start within $timeout seconds"
    return 1
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local health_url=$2
    
    echo "🔍 Checking $service_name health..."
    if curl -s "$health_url" | grep -q "healthy\|ok\|UP" 2>/dev/null; then
        print_status "$service_name is healthy"
        return 0
    else
        print_warning "$service_name health check inconclusive"
        return 1
    fi
}

# Main deployment function
deploy() {
    print_status "Starting Ultimate Quantum Mempool Monitor deployment..."
    
    # Pull latest images
    echo -e "${BLUE}📥 Pulling latest Docker images...${NC}"
    docker compose -f "$COMPOSE_FILE" pull
    
    # Build the application
    echo -e "${BLUE}🏗️  Building application...${NC}"
    docker compose -f "$COMPOSE_FILE" build
    
    # Start infrastructure services first
    echo -e "${BLUE}🗄️  Starting infrastructure services...${NC}"
    docker compose -f "$COMPOSE_FILE" up -d postgres redis elasticsearch
    
    # Wait for infrastructure to be ready
    wait_for_service "PostgreSQL" 5432
    wait_for_service "Redis" 6379
    wait_for_service "Elasticsearch" 9200
    
    # Start monitoring services
    echo -e "${BLUE}📊 Starting monitoring services...${NC}"
    docker compose -f "$COMPOSE_FILE" up -d prometheus grafana kibana
    
    # Wait for monitoring services
    wait_for_service "Prometheus" 9091
    wait_for_service "Grafana" 3000
    wait_for_service "Kibana" 5601
    
    # Start the main application
    echo -e "${BLUE}🎯 Starting Ultimate Quantum Mempool Monitor...${NC}"
    docker compose -f "$COMPOSE_FILE" up -d ultimate-quantum-monitor
    
    # Wait for main application
    wait_for_service "Ultimate Quantum Monitor API" 8000
    wait_for_service "WebSocket Server" 8765
    wait_for_service "Dashboard" 8001
    
    # Start supporting services
    echo -e "${BLUE}🔧 Starting supporting services...${NC}"
    docker compose -f "$COMPOSE_FILE" up -d nginx jaeger minio
    
    # Final health checks
    echo -e "${BLUE}🏥 Performing health checks...${NC}"
    sleep 10  # Allow services to stabilize
    
    check_service_health "Ultimate Quantum Monitor" "http://localhost:8000/api/v1/health"
    check_service_health "Grafana" "http://localhost:3000/api/health"
    check_service_health "Kibana" "http://localhost:5601/api/status"
    
    print_status "Deployment completed successfully!"
    
    # Display service URLs
    echo ""
    echo -e "${GREEN}🎉 Ultimate Quantum Mempool Monitor is running!${NC}"
    echo "=============================================================="
    echo -e "${BLUE}📊 Service URLs:${NC}"
    echo "  • Main Application API: http://localhost:8000"
    echo "  • Interactive Dashboard: http://localhost:8001"
    echo "  • WebSocket Feed: ws://localhost:8765"
    echo "  • API Documentation: http://localhost:8000/docs"
    echo "  • System Health: http://localhost:8000/api/v1/health"
    echo ""
    echo -e "${BLUE}📈 Monitoring & Analytics:${NC}"
    echo "  • Grafana Dashboards: http://localhost:3000"
    echo "  • Prometheus Metrics: http://localhost:9091"
    echo "  • Kibana Logs: http://localhost:5601"
    echo "  • Jaeger Tracing: http://localhost:16686"
    echo ""
    echo -e "${BLUE}🛠️  Management:${NC}"
    echo "  • MinIO Object Storage: http://localhost:9001"
    echo "  • Container Logs: docker compose -f $COMPOSE_FILE logs -f"
    echo "  • System Status: docker compose -f $COMPOSE_FILE ps"
    echo ""
    echo -e "${YELLOW}🔐 Default Credentials (change in production):${NC}"
    echo "  • Check $ENV_FILE for all passwords"
    echo "  • Grafana: admin / (see GRAFANA_PASSWORD in $ENV_FILE)"
    echo "  • MinIO: (see MINIO_ROOT_USER/MINIO_ROOT_PASSWORD in $ENV_FILE)"
}

# Stop function
stop() {
    print_status "Stopping Ultimate Quantum Mempool Monitor..."
    docker compose -f "$COMPOSE_FILE" down
    print_status "All services stopped"
}

# Status function
status() {
    echo -e "${BLUE}📊 Ultimate Quantum Mempool Monitor Status${NC}"
    echo "=============================================="
    docker compose -f "$COMPOSE_FILE" ps
    
    echo ""
    echo -e "${BLUE}📈 Quick Health Check${NC}"
    echo "======================"
    
    # Check main services
    services=(
        "Ultimate Quantum Monitor API:8000:/api/v1/health"
        "Dashboard:8001:/"
        "Grafana:3000:/api/health"
        "Prometheus:9091:/-/healthy"
        "Kibana:5601:/api/status"
    )
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r name port path <<< "$service_info"
        if curl -s "http://localhost:$port$path" >/dev/null 2>&1; then
            print_status "$name is running"
        else
            print_error "$name is not responding"
        fi
    done
}

# Logs function
logs() {
    local service=${1:-ultimate-quantum-monitor}
    echo -e "${BLUE}📋 Showing logs for $service${NC}"
    docker-compose -f "$COMPOSE_FILE" logs -f "$service"
}

# Cleanup function
cleanup() {
    print_warning "This will remove all containers and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_status "Cleaning up all containers and volumes..."
        docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans
        docker system prune -f
        print_status "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Update function
update() {
    print_status "Updating Ultimate Quantum Mempool Monitor..."
    
    # Pull latest images
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Rebuild and restart
    docker-compose -f "$COMPOSE_FILE" up -d --build
    
    print_status "Update completed"
}

# Main script logic
case "${1:-deploy}" in
    "deploy" | "start" | "up")
        deploy
        ;;
    "stop" | "down")
        stop
        ;;
    "restart")
        stop
        sleep 5
        deploy
        ;;
    "status" | "ps")
        status
        ;;
    "logs")
        logs "${2:-}"
        ;;
    "cleanup" | "clean")
        cleanup
        ;;
    "update")
        update
        ;;
    "help" | "-h" | "--help")
        echo "Ultimate Quantum Mempool Monitor Deployment Script"
        echo ""
        echo "Usage: $0 [COMMAND]"
        echo ""
        echo "Commands:"
        echo "  deploy, start, up    Deploy and start all services (default)"
        echo "  stop, down           Stop all services"
        echo "  restart              Restart all services"
        echo "  status, ps           Show service status"
        echo "  logs [service]       Show logs (optionally for specific service)"
        echo "  update               Update and restart services"
        echo "  cleanup, clean       Remove all containers and volumes"
        echo "  help                 Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  COMPOSE_FILE         Docker compose file (default: docker-compose-ultimate.yml)"
        echo "  ENV_FILE             Environment file (default: .env)"
        echo "  LOG_LEVEL            Log level (default: INFO)"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
