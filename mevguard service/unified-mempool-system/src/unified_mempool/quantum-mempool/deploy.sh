#!/bin/bash

# Unified Quantum Mempool Monitor - Deployment Script
# This script helps deploy and manage the unified monitoring system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is installed and running
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Function to check if Docker Compose is installed
check_docker_compose() {
    print_status "Checking Docker Compose installation..."
    
    if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker Compose is installed"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs data config/ssl monitoring/grafana/dashboards monitoring/grafana/provisioning nginx
    
    print_success "Directories created"
}

# Function to generate SSL certificates (self-signed for development)
generate_ssl_certs() {
    print_status "Generating SSL certificates for development..."
    
    if [ ! -f "config/ssl/cert.pem" ]; then
        openssl req -x509 -newkey rsa:4096 -keyout config/ssl/key.pem -out config/ssl/cert.pem -days 365 -nodes \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" 2>/dev/null || {
            print_warning "OpenSSL not found. Skipping SSL certificate generation."
            return
        }
        print_success "SSL certificates generated"
    else
        print_status "SSL certificates already exist"
    fi
}

# Function to build Docker images
build_images() {
    print_status "Building Docker images..."
    
    docker compose build --no-cache
    
    print_success "Docker images built successfully"
}

# Function to start services
start_services() {
    print_status "Starting Unified Quantum Mempool Monitor services..."
    
    docker compose up -d
    
    print_success "Services started successfully"
}

# Function to stop services
stop_services() {
    print_status "Stopping services..."
    
    docker compose down
    
    print_success "Services stopped"
}

# Function to show logs
show_logs() {
    print_status "Showing logs..."
    
    docker compose logs -f
}

# Function to show status
show_status() {
    print_status "Service status:"
    
    docker compose ps
    
    echo ""
    print_status "Health checks:"
    
    # Check main application
    if curl -s http://localhost:8000/api/v1/unified/health > /dev/null; then
        print_success "✅ Main API is healthy (http://localhost:8000)"
    else
        print_error "❌ Main API is not responding"
    fi
    
    # Check dashboard
    if curl -s http://localhost:8001 > /dev/null; then
        print_success "✅ Dashboard is healthy (http://localhost:8001)"
    else
        print_error "❌ Dashboard is not responding"
    fi
    
    # Check WebSocket API
    if nc -z localhost 8765 2>/dev/null; then
        print_success "✅ WebSocket API is healthy (ws://localhost:8765)"
    else
        print_error "❌ WebSocket API is not responding"
    fi
    
    # Check Prometheus
    if curl -s http://localhost:9091 > /dev/null; then
        print_success "✅ Prometheus is healthy (http://localhost:9091)"
    else
        print_error "❌ Prometheus is not responding"
    fi
    
    # Check Grafana
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "✅ Grafana is healthy (http://localhost:3000)"
    else
        print_error "❌ Grafana is not responding"
    fi
}

# Function to run tests
run_tests() {
    print_status "Running system tests..."
    
    # Test main API endpoints
    print_status "Testing main API..."
    if curl -s http://localhost:8000/api/v1/unified/health | jq '.status' | grep -q "healthy"; then
        print_success "✅ Main API health check passed"
    else
        print_error "❌ Main API health check failed"
    fi
    
    # Test quantum endpoints
    print_status "Testing quantum endpoints..."
    if curl -s http://localhost:8000/api/v1/quantum/status > /dev/null; then
        print_success "✅ Quantum status endpoint accessible"
    else
        print_error "❌ Quantum status endpoint failed"
    fi
    
    print_success "System tests completed"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    
    docker compose down -v
    docker system prune -f
    
    print_success "Cleanup completed"
}

# Function to show help
show_help() {
    echo "Unified Quantum Mempool Monitor - Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup      - Initial setup (create directories, generate certs)"
    echo "  build      - Build Docker images"
    echo "  start      - Start all services"
    echo "  stop       - Stop all services"
    echo "  restart    - Restart all services"
    echo "  logs       - Show logs"
    echo "  status     - Show service status and health"
    echo "  test       - Run system tests"
    echo "  cleanup    - Stop services and clean up"
    echo "  deploy     - Full deployment (setup + build + start)"
    echo "  help       - Show this help message"
    echo ""
    echo "Service URLs:"
    echo "  Main API:     http://localhost:8000"
    echo "  Dashboard:    http://localhost:8001"
    echo "  WebSocket:    ws://localhost:8765"
    echo "  Prometheus:   http://localhost:9091"
    echo "  Grafana:      http://localhost:3000 (admin/admin)"
    echo "  API Docs:     http://localhost:8000/docs"
}

# Main script logic
case "${1:-help}" in
    setup)
        check_docker
        check_docker_compose
        create_directories
        generate_ssl_certs
        print_success "Setup completed!"
        ;;
    build)
        check_docker
        check_docker_compose
        build_images
        ;;
    start)
        check_docker
        check_docker_compose
        start_services
        print_success "Services started! Check status with: $0 status"
        ;;
    stop)
        stop_services
        ;;
    restart)
        print_status "Restarting services..."
        stop_services
        start_services
        print_success "Services restarted!"
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    test)
        run_tests
        ;;
    cleanup)
        cleanup
        ;;
    deploy)
        print_status "🚀 Starting full deployment..."
        check_docker
        check_docker_compose
        create_directories
        generate_ssl_certs
        build_images
        start_services
        sleep 10  # Wait for services to start
        show_status
        print_success "🎉 Deployment completed successfully!"
        echo ""
        echo "🔗 Access your services:"
        echo "   Dashboard:  http://localhost:8001"
        echo "   API:        http://localhost:8000/docs"
        echo "   Grafana:    http://localhost:3000 (admin/admin)"
        echo "   Prometheus: http://localhost:9091"
        ;;
    help|*)
        show_help
        ;;
esac
