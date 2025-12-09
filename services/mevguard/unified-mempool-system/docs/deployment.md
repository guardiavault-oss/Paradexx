# Deployment Guide

This guide covers various deployment options for the Unified Mempool Monitoring System.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **CPU**: 4+ cores recommended
- **RAM**: 8GB+ recommended (16GB+ for production)
- **Storage**: 100GB+ SSD recommended
- **Network**: Stable internet connection with low latency

### Software Requirements

- **Docker**: 20.10+ and Docker Compose 2.0+
- **Python**: 3.11+ (for local development)
- **Node.js**: 18+ (for frontend development)
- **Git**: Latest version

### External Services

- **Redis**: 7.0+ (for caching and coordination)
- **PostgreSQL**: 15+ (for persistent storage)
- **Prometheus**: Latest (for metrics collection)
- **Grafana**: Latest (for visualization)

## Docker Deployment

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/scorpius/unified-mempool-system.git
   cd unified-mempool-system
   ```

2. **Start the system**
   ```bash
   docker-compose up -d
   ```

3. **Verify deployment**
   ```bash
   curl http://localhost:8000/health
   ```

### Production Docker Deployment

1. **Use production configuration**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

2. **Set environment variables**
   ```bash
   export REDIS_HOST=redis.example.com
   export POSTGRES_HOST=postgres.example.com
   export POSTGRES_PASSWORD=secure_password
   export JWT_SECRET=your_jwt_secret
   export API_KEY=your_api_key
   ```

3. **Scale services**
   ```bash
   docker-compose up -d --scale unified-mempool=3
   ```

### Docker Configuration

#### docker-compose.yml
```yaml
version: '3.8'

services:
  unified-mempool:
    build: .
    ports:
      - "8000:8000"
    environment:
      - REDIS_HOST=redis
      - POSTGRES_HOST=postgres
      - POSTGRES_PASSWORD=postgres
    depends_on:
      - redis
      - postgres
    volumes:
      - ./config:/app/config
      - ./logs:/app/logs

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=unified_mempool
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9091:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - unified-mempool

volumes:
  redis_data:
  postgres_data:
  prometheus_data:
  grafana_data:
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.20+)
- kubectl configured
- Helm 3.0+ (optional)

### Basic Kubernetes Deployment

1. **Create namespace**
   ```bash
   kubectl create namespace unified-mempool
   ```

2. **Apply configurations**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secret.yaml
   kubectl apply -f k8s/redis.yaml
   kubectl apply -f k8s/postgres.yaml
   kubectl apply -f k8s/app.yaml
   kubectl apply -f k8s/service.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

3. **Verify deployment**
   ```bash
   kubectl get pods -n unified-mempool
   kubectl get services -n unified-mempool
   ```

### Helm Deployment

1. **Add Helm repository**
   ```bash
   helm repo add scorpius https://charts.scorpius.ai
   helm repo update
   ```

2. **Install with Helm**
   ```bash
   helm install unified-mempool scorpius/unified-mempool-system \
     --namespace unified-mempool \
     --create-namespace \
     --set redis.enabled=true \
     --set postgres.enabled=true \
     --set ingress.enabled=true
   ```

3. **Upgrade deployment**
   ```bash
   helm upgrade unified-mempool scorpius/unified-mempool-system \
     --namespace unified-mempool \
     --set image.tag=v1.0.1
   ```

### Kubernetes Configuration Files

#### k8s/app.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: unified-mempool
  namespace: unified-mempool
spec:
  replicas: 3
  selector:
    matchLabels:
      app: unified-mempool
  template:
    metadata:
      labels:
        app: unified-mempool
    spec:
      containers:
      - name: unified-mempool
        image: scorpius/unified-mempool-system:latest
        ports:
        - containerPort: 8000
        env:
        - name: REDIS_HOST
          valueFrom:
            configMapKeyRef:
              name: unified-mempool-config
              key: redis_host
        - name: POSTGRES_HOST
          valueFrom:
            configMapKeyRef:
              name: unified-mempool-config
              key: postgres_host
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: unified-mempool-secret
              key: postgres_password
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Local Development

### Setup

1. **Clone and setup**
   ```bash
   git clone https://github.com/scorpius/unified-mempool-system.git
   cd unified-mempool-system
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -e ".[dev,test]"
   ```

2. **Start external services**
   ```bash
   docker-compose up -d redis postgres
   ```

3. **Run the application**
   ```bash
   python -m unified_mempool.cli api --host 0.0.0.0 --port 8000
   ```

### Development with Hot Reload

```bash
uvicorn unified_mempool.api.unified_api_gateway:app --reload --host 0.0.0.0 --port 8000
```

## Production Deployment

### Environment Setup

1. **Create production environment**
   ```bash
   export ENVIRONMENT=production
   export LOG_LEVEL=info
   export REDIS_HOST=redis.production.com
   export POSTGRES_HOST=postgres.production.com
   export POSTGRES_PASSWORD=$(openssl rand -base64 32)
   export JWT_SECRET=$(openssl rand -base64 64)
   export API_KEY=$(openssl rand -base64 32)
   ```

2. **SSL/TLS Configuration**
   ```bash
   # Generate SSL certificates
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   ```

3. **Firewall Configuration**
   ```bash
   # Allow only necessary ports
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw allow 22/tcp
   ufw enable
   ```

### Load Balancer Configuration

#### Nginx Configuration
```nginx
upstream unified_mempool {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
}

server {
    listen 80;
    server_name mempool.scorpius.ai;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mempool.scorpius.ai;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://unified_mempool;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://unified_mempool;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### Database Setup

1. **PostgreSQL Configuration**
   ```sql
   -- Create database and user
   CREATE DATABASE unified_mempool;
   CREATE USER mempool_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE unified_mempool TO mempool_user;
   ```

2. **Redis Configuration**
   ```redis
   # redis.conf
   maxmemory 2gb
   maxmemory-policy allkeys-lru
   save 900 1
   save 300 10
   save 60 10000
   ```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REDIS_HOST` | Redis server host | `localhost` | Yes |
| `REDIS_PORT` | Redis server port | `6379` | No |
| `POSTGRES_HOST` | PostgreSQL server host | `localhost` | Yes |
| `POSTGRES_PORT` | PostgreSQL server port | `5432` | No |
| `POSTGRES_DB` | Database name | `unified_mempool` | No |
| `POSTGRES_USER` | Database user | `postgres` | No |
| `POSTGRES_PASSWORD` | Database password | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `API_KEY` | API authentication key | - | Yes |
| `LOG_LEVEL` | Logging level | `info` | No |
| `ENVIRONMENT` | Environment name | `development` | No |

### Configuration File

Create `config/production.yaml`:

```yaml
networks:
  ethereum:
    enabled: true
    rpc_url: "https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY"
    priority: 1
    timeout: 30
  
  arbitrum:
    enabled: true
    rpc_url: "https://arb1.arbitrum.io/rpc"
    priority: 2
    timeout: 30

monitoring:
  refresh_rate: 1000  # milliseconds
  batch_size: 100
  max_transactions: 10000
  enable_quantum_analysis: true
  enable_mev_protection: true

security:
  enable_authentication: true
  enable_rate_limiting: true
  rate_limit_per_hour: 1000
  enable_encryption: true

api:
  host: "0.0.0.0"
  port: 8000
  workers: 4
  enable_cors: true
  enable_swagger: true

logging:
  level: "info"
  format: "json"
  file: "/var/log/unified-mempool.log"
  max_size: "100MB"
  backup_count: 5
```

## Monitoring

### Health Checks

1. **Application Health**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Database Health**
   ```bash
   curl http://localhost:8000/api/v1/status
   ```

3. **Custom Health Check**
   ```bash
   #!/bin/bash
   response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
   if [ $response -eq 200 ]; then
       echo "Health check passed"
       exit 0
   else
       echo "Health check failed"
       exit 1
   fi
   ```

### Metrics Collection

1. **Prometheus Configuration**
   ```yaml
   # prometheus.yml
   global:
     scrape_interval: 15s
   
   scrape_configs:
     - job_name: 'unified-mempool'
       static_configs:
         - targets: ['localhost:8000']
       metrics_path: '/metrics'
       scrape_interval: 5s
   ```

2. **Grafana Dashboard**
   - Import dashboard from `monitoring/grafana/dashboards/mempool.json`
   - Configure data source to point to Prometheus

### Logging

1. **Log Aggregation**
   ```bash
   # Using ELK Stack
   docker-compose -f docker-compose.logging.yml up -d
   ```

2. **Log Rotation**
   ```bash
   # logrotate configuration
   /var/log/unified-mempool.log {
       daily
       rotate 30
       compress
       delaycompress
       missingok
       notifempty
       postrotate
           systemctl reload unified-mempool
       endscript
   }
   ```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Check if service is running
   docker ps | grep unified-mempool
   
   # Check logs
   docker logs unified-mempool
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   psql -h localhost -U postgres -d unified_mempool -c "SELECT 1;"
   ```

3. **High Memory Usage**
   ```bash
   # Check memory usage
   docker stats unified-mempool
   
   # Adjust memory limits
   docker-compose up -d --scale unified-mempool=2
   ```

4. **Performance Issues**
   ```bash
   # Check system resources
   htop
   
   # Check network latency
   ping redis.production.com
   ping postgres.production.com
   ```

### Debug Mode

1. **Enable Debug Logging**
   ```bash
   export LOG_LEVEL=debug
   docker-compose up -d
   ```

2. **Access Debug Information**
   ```bash
   curl http://localhost:8000/api/v1/debug/info
   ```

### Support

For additional support:
- **Email**: support@scorpius.ai
- **Discord**: [Scorpius Community](https://discord.gg/scorpius)
- **GitHub Issues**: [Report Issues](https://github.com/scorpius/unified-mempool-system/issues)