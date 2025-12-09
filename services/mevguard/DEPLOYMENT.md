# 🚀 MEV Protection Service Deployment Guide

**Production deployment guide for the MEV Protection Service**

## 📋 Prerequisites

### System Requirements
- **CPU**: 4+ cores (8+ recommended for production)
- **RAM**: 8GB+ (16GB+ recommended for production)
- **Storage**: 100GB+ SSD (500GB+ recommended for production)
- **Network**: High-speed internet connection with low latency to blockchain networks

### Software Requirements
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Python**: 3.11+ (for local development)
- **PostgreSQL**: 13+ (or use Docker)
- **Redis**: 6.0+ (or use Docker)

### Blockchain Access
- **Ethereum RPC**: Alchemy, Infura, or self-hosted node
- **Polygon RPC**: Polygon RPC or self-hosted node
- **BSC RPC**: BSC RPC or self-hosted node
- **Arbitrum RPC**: Arbitrum RPC or self-hosted node

## 🐳 Docker Deployment (Recommended)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/scorpius/mev-protection-service.git
cd mev-protection-service
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start the service**
```bash
docker-compose up -d
```

4. **Verify deployment**
```bash
curl http://localhost:8000/health
```

### Production Deployment

1. **Configure production environment**
```bash
# Edit .env for production
vim .env
```

Key production settings:
```bash
# Security
JWT_SECRET=your-super-secret-jwt-key-256-bits-long
API_KEY=your-secure-api-key
ENCRYPTION_KEY=your-32-byte-encryption-key

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/mev_protection
REDIS_URL=redis://redis:6379/0

# Blockchain RPC URLs
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-rpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc

# Protection Settings
DEFAULT_PROTECTION_LEVEL=high
ENABLE_PRIVATE_MEMPOOL=true
MAX_GAS_PRICE_GWEI=100
MIN_PROFIT_THRESHOLD=0.01

# Performance
WORKERS=4
MAX_CPU_USAGE=80.0
MAX_MEMORY_USAGE=80.0
```

2. **Deploy with production configuration**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

3. **Initialize database**
```bash
docker-compose exec mev-protection python -c "
from src.mev_protection.database.models import create_tables
from sqlalchemy import create_engine
engine = create_engine('postgresql://mev_user:mev_password@postgres:5432/mev_protection')
create_tables(engine)
"
```

4. **Verify production deployment**
```bash
# Check service health
curl http://localhost:8000/health

# Check logs
docker-compose logs -f mev-protection

# Check metrics
curl http://localhost:9090/metrics
```

## 🐍 Python Deployment

### Local Development

1. **Install dependencies**
```bash
pip install -r requirements.txt
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Initialize database**
```bash
python -c "
from src.mev_protection.database.models import create_tables
from sqlalchemy import create_engine
import os
engine = create_engine(os.getenv('DATABASE_URL'))
create_tables(engine)
"
```

4. **Start the service**
```bash
python main.py
```

### Production Python Deployment

1. **Install system dependencies**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y python3.11 python3.11-pip postgresql redis-server

# CentOS/RHEL
sudo yum install -y python3.11 python3.11-pip postgresql redis
```

2. **Create system user**
```bash
sudo useradd -r -s /bin/false mev-protection
sudo mkdir -p /opt/mev-protection
sudo chown mev-protection:mev-protection /opt/mev-protection
```

3. **Install application**
```bash
cd /opt/mev-protection
sudo -u mev-protection git clone https://github.com/scorpius/mev-protection-service.git .
sudo -u mev-protection pip3.11 install -r requirements.txt
```

4. **Configure systemd service**
```bash
sudo tee /etc/systemd/system/mev-protection.service > /dev/null <<EOF
[Unit]
Description=MEV Protection Service
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=mev-protection
Group=mev-protection
WorkingDirectory=/opt/mev-protection
Environment=PATH=/opt/mev-protection/venv/bin
ExecStart=/opt/mev-protection/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable mev-protection
sudo systemctl start mev-protection
```

5. **Configure nginx reverse proxy**
```bash
sudo tee /etc/nginx/sites-available/mev-protection > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/mev-protection /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.20+)
- kubectl configured
- Helm 3.0+

### Deploy with Helm

1. **Create namespace**
```bash
kubectl create namespace mev-protection
```

2. **Create secrets**
```bash
kubectl create secret generic mev-protection-secrets \
  --from-literal=jwt-secret=your-jwt-secret \
  --from-literal=api-key=your-api-key \
  --from-literal=database-url=postgresql://user:password@postgres:5432/mev_protection \
  --from-literal=redis-url=redis://redis:6379/0 \
  --namespace=mev-protection
```

3. **Deploy with Helm**
```bash
helm install mev-protection ./helm/mev-protection \
  --namespace mev-protection \
  --set image.tag=latest \
  --set replicas=3 \
  --set resources.requests.cpu=1000m \
  --set resources.requests.memory=2Gi \
  --set resources.limits.cpu=2000m \
  --set resources.limits.memory=4Gi
```

4. **Verify deployment**
```bash
kubectl get pods -n mev-protection
kubectl get services -n mev-protection
kubectl logs -f deployment/mev-protection -n mev-protection
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `REDIS_URL` | Redis connection string | - | Yes |
| `ETHEREUM_RPC_URL` | Ethereum RPC endpoint | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `API_KEY` | API authentication key | - | Yes |
| `DEFAULT_PROTECTION_LEVEL` | Default protection level | high | No |
| `ENABLE_PRIVATE_MEMPOOL` | Enable private mempool | true | No |
| `MAX_GAS_PRICE_GWEI` | Maximum gas price | 100 | No |
| `MIN_PROFIT_THRESHOLD` | Minimum profit threshold | 0.01 | No |
| `WORKERS` | Number of worker processes | 1 | No |
| `HOST` | Bind host | 0.0.0.0 | No |
| `PORT` | Bind port | 8000 | No |

### Protection Levels

- **Low**: Basic MEV detection and gas price adjustment
- **Medium**: Enhanced detection with transaction batching
- **High**: Full protection with private mempool routing
- **Maximum**: All protection strategies with AI-enhanced analysis

### Network Configuration

Supported networks:
- Ethereum (Mainnet)
- Polygon
- BSC (Binance Smart Chain)
- Arbitrum
- Optimism
- Avalanche
- Fantom
- Base
- Linea
- Scroll

## 📊 Monitoring

### Health Checks

The service provides several health check endpoints:

- **Basic Health**: `GET /health`
- **Protection Status**: `GET /api/v1/protection/status`
- **System Metrics**: `GET /api/v1/dashboard`

### Metrics

Prometheus metrics are available at `/metrics`:

- `mev_protection_threats_detected_total`
- `mev_protection_threats_mitigated_total`
- `mev_protection_value_protected_total`
- `mev_protection_gas_saved_total`
- `mev_protection_protection_success_rate`

### Logging

Logs are structured JSON format:

```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "INFO",
  "service": "mev-protection",
  "message": "MEV threat detected",
  "threat_id": "threat_123",
  "threat_type": "sandwich",
  "network": "ethereum"
}
```

### Grafana Dashboards

Access Grafana at `http://localhost:3000` (admin/admin):

- **MEV Protection Overview**: System overview and key metrics
- **Threat Analysis**: Detailed threat detection and analysis
- **Network Performance**: Per-network performance metrics
- **System Health**: Infrastructure and application health

## 🔒 Security

### Authentication

The API uses Bearer token authentication:

```bash
curl -H "Authorization: Bearer your-api-key" \
  http://localhost:8000/api/v1/protection/status
```

### Rate Limiting

Rate limits are applied per endpoint:

- **API endpoints**: 10 requests/second
- **WebSocket**: 5 connections/second
- **Protection endpoints**: 5 requests/second

### SSL/TLS

For production, configure SSL/TLS:

1. **Obtain SSL certificates**
2. **Update nginx configuration**
3. **Enable HTTPS redirect**

### Network Security

- Use firewall rules to restrict access
- Implement network segmentation
- Use VPN for administrative access
- Monitor network traffic

## 🚨 Troubleshooting

### Common Issues

1. **Service won't start**
   - Check environment variables
   - Verify database connectivity
   - Check logs: `docker-compose logs mev-protection`

2. **Database connection errors**
   - Verify PostgreSQL is running
   - Check connection string
   - Ensure database exists

3. **High memory usage**
   - Increase memory limits
   - Check for memory leaks
   - Optimize configuration

4. **Slow performance**
   - Check CPU usage
   - Verify network latency
   - Optimize database queries

### Debug Mode

Enable debug mode for troubleshooting:

```bash
export DEBUG=true
export LOG_LEVEL=DEBUG
```

### Log Analysis

```bash
# View recent logs
docker-compose logs --tail=100 mev-protection

# Follow logs in real-time
docker-compose logs -f mev-protection

# Search for errors
docker-compose logs mev-protection | grep ERROR
```

## 📈 Scaling

### Horizontal Scaling

1. **Increase replicas**
```bash
docker-compose up -d --scale mev-protection=3
```

2. **Load balancer configuration**
```bash
# nginx.conf
upstream mev_protection {
    server mev-protection_1:8000;
    server mev-protection_2:8000;
    server mev-protection_3:8000;
}
```

### Vertical Scaling

1. **Increase resources**
```bash
# docker-compose.yml
services:
  mev-protection:
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 8G
        reservations:
          cpus: '2.0'
          memory: 4G
```

### Database Scaling

1. **Read replicas**
2. **Connection pooling**
3. **Query optimization**
4. **Indexing**

## 🔄 Updates

### Rolling Updates

1. **Pull latest image**
```bash
docker-compose pull mev-protection
```

2. **Update service**
```bash
docker-compose up -d mev-protection
```

3. **Verify update**
```bash
curl http://localhost:8000/health
```

### Database Migrations

1. **Backup database**
```bash
docker-compose exec postgres pg_dump -U mev_user mev_protection > backup.sql
```

2. **Run migrations**
```bash
docker-compose exec mev-protection python -c "
from src.mev_protection.database.models import create_tables
from sqlalchemy import create_engine
engine = create_engine('postgresql://mev_user:mev_password@postgres:5432/mev_protection')
create_tables(engine)
"
```

## 📞 Support

### Getting Help

- **Documentation**: [GitHub Wiki](https://github.com/scorpius/mev-protection-service/wiki)
- **Issues**: [GitHub Issues](https://github.com/scorpius/mev-protection-service/issues)
- **Discord**: [Scorpius Community](https://discord.gg/scorpius)
- **Email**: support@scorpius.ai

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

**Built with ❤️ by the Scorpius Team**

*The world's most advanced MEV protection service - actually protecting your transactions from MEV attacks.*