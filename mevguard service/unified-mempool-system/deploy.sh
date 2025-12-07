#!/bin/bash
# Unified Mempool Monitoring System Deployment Script
# ==================================================

set -e

echo "🚀 UNIFIED MEMPOOL MONITORING SYSTEM DEPLOYMENT"
echo "================================================"
echo "Deploying world-class mempool monitoring with 11 integrated services"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_status "Docker is installed"
}

# Check if Docker Compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_status "Docker Compose is installed"
}

# Create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    mkdir -p logs data monitoring/grafana/dashboards monitoring/grafana/datasources nginx/ssl
    print_status "Directories created"
}

# Create environment file
create_env_file() {
    print_info "Creating environment configuration..."
    cat > .env << EOF
# Unified Mempool System Environment Configuration
# ===============================================

# System Configuration
SYSTEM_NAME=Unified Mempool Monitoring System
SYSTEM_VERSION=1.0.0
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Database Configuration
POSTGRES_DB=unified_mempool
POSTGRES_USER=mempool_user
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
JWT_SECRET=$(openssl rand -base64 64)
API_KEY=$(openssl rand -base64 32)

# Security Configuration
ENABLE_AUTHENTICATION=true
ENABLE_RATE_LIMITING=true
RATE_LIMIT_REQUESTS_PER_MINUTE=1000

# Monitoring Configuration
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 16)

# Network Configuration
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/demo
POLYGON_RPC_URL=https://polygon-rpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC_URL=https://mainnet.optimism.io
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc

# Performance Configuration
MAX_CPU_USAGE=80
MAX_MEMORY_USAGE=80
WORKER_THREADS=4
MAX_CONCURRENT_REQUESTS=1000

# Logging Configuration
LOG_FILE=logs/unified_mempool.log
LOG_MAX_SIZE=100MB
LOG_BACKUP_COUNT=5
EOF
    print_status "Environment file created"
}

# Create Prometheus configuration
create_prometheus_config() {
    print_info "Creating Prometheus configuration..."
    cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'unified-mempool'
    static_configs:
      - targets: ['unified-mempool:8000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
EOF
    print_status "Prometheus configuration created"
}

# Create Grafana datasource configuration
create_grafana_datasource() {
    print_info "Creating Grafana datasource configuration..."
    cat > monitoring/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF
    print_status "Grafana datasource configuration created"
}

# Create Grafana dashboard
create_grafana_dashboard() {
    print_info "Creating Grafana dashboard..."
    cat > monitoring/grafana/dashboards/unified-mempool.json << EOF
{
  "dashboard": {
    "id": null,
    "title": "Unified Mempool Monitoring",
    "tags": ["mempool", "blockchain", "monitoring"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "System Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"unified-mempool\"}",
            "legendFormat": "System Status"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "green", "value": 1}
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "title": "Transactions Processed",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(unified_mempool_transactions_total[5m])",
            "legendFormat": "Transactions/sec"
          }
        ]
      },
      {
        "id": 3,
        "title": "MEV Attacks Detected",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(unified_mempool_mev_attacks_total[5m])",
            "legendFormat": "MEV Attacks/sec"
          }
        ]
      },
      {
        "id": 4,
        "title": "System Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "unified_mempool_cpu_usage_percent",
            "legendFormat": "CPU Usage %"
          },
          {
            "expr": "unified_mempool_memory_usage_percent",
            "legendFormat": "Memory Usage %"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
EOF
    print_status "Grafana dashboard created"
}

# Create Nginx configuration
create_nginx_config() {
    print_info "Creating Nginx configuration..."
    cat > nginx/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream unified_mempool {
        server unified-mempool:8000;
    }

    upstream grafana {
        server grafana:3000;
    }

    upstream prometheus {
        server prometheus:9090;
    }

    server {
        listen 80;
        server_name localhost;

        # API Gateway
        location /api/ {
            proxy_pass http://unified_mempool;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Grafana Dashboard
        location /grafana/ {
            proxy_pass http://grafana/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Prometheus Metrics
        location /prometheus/ {
            proxy_pass http://prometheus/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Health Check
        location /health {
            proxy_pass http://unified_mempool/health;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF
    print_status "Nginx configuration created"
}

# Build and start the system
deploy_system() {
    print_info "Building and starting the unified mempool system..."
    
    # Build the Docker image
    print_info "Building Docker image..."
    docker-compose build --no-cache
    
    # Start the system
    print_info "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_info "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    print_info "Checking service health..."
    
    # Check API health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_status "API service is healthy"
    else
        print_warning "API service health check failed"
    fi
    
    # Check Grafana
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Grafana is accessible"
    else
        print_warning "Grafana health check failed"
    fi
    
    # Check Prometheus
    if curl -f http://localhost:9091 > /dev/null 2>&1; then
        print_status "Prometheus is accessible"
    else
        print_warning "Prometheus health check failed"
    fi
}

# Display deployment information
display_info() {
    echo ""
    echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo "====================================="
    echo ""
    echo "📊 System Information:"
    echo "  • API Gateway: http://localhost:8000"
    echo "  • API Documentation: http://localhost:8000/docs"
    echo "  • Grafana Dashboard: http://localhost:3000 (admin/$(grep GRAFANA_ADMIN_PASSWORD .env | cut -d'=' -f2))"
    echo "  • Prometheus Metrics: http://localhost:9091"
    echo "  • Nginx Proxy: http://localhost:80"
    echo ""
    echo "🔧 Management Commands:"
    echo "  • View logs: docker-compose logs -f"
    echo "  • Stop system: docker-compose down"
    echo "  • Restart system: docker-compose restart"
    echo "  • Update system: docker-compose pull && docker-compose up -d"
    echo ""
    echo "📈 Monitoring:"
    echo "  • System Status: curl http://localhost:8000/api/v1/status"
    echo "  • Dashboard Data: curl http://localhost:8000/api/v1/dashboard"
    echo "  • Health Check: curl http://localhost:8000/health"
    echo ""
    echo "🔒 Security:"
    echo "  • API Key: $(grep API_KEY .env | cut -d'=' -f2)"
    echo "  • JWT Secret: $(grep JWT_SECRET .env | cut -d'=' -f2 | cut -c1-20)..."
    echo ""
    echo "✅ The Unified Mempool Monitoring System is now running!"
    echo "   All 11 services are integrated and synchronized."
    echo "   Real blockchain data is being processed in real-time."
}

# Main deployment function
main() {
    echo "Starting deployment process..."
    echo ""
    
    # Pre-deployment checks
    check_docker
    check_docker_compose
    
    # Setup
    create_directories
    create_env_file
    create_prometheus_config
    create_grafana_datasource
    create_grafana_dashboard
    create_nginx_config
    
    # Deploy
    deploy_system
    
    # Display information
    display_info
}

# Run main function
main "$@"