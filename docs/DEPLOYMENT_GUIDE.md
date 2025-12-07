# Deployment Guide

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- MongoDB 7+
- Redis 7+
- Python 3.10+ (for backend services)

## Environment Setup

### Development

1. **Clone repository**:
```bash
git clone <repository-url>
cd RegenX
```

2. **Install dependencies**:
```bash
# Frontend
npm install

# Backend services
cd honeypot_detector && pip install -r requirements.txt
cd ../app && pip install -r requirements.txt
```

3. **Configure environment**:
```bash
# Copy example env files
cp .env.example .env
cp honeypot_detector/.env.example honeypot_detector/.env
```

4. **Start services**:
```bash
# Start Honeypot Detector
cd honeypot_detector && docker-compose up -d

# Start Wallet Guard
python app/wallet_guard.py

# Start frontend
npm run dev
```

### Staging

1. **Build frontend**:
```bash
npm run build
```

2. **Deploy to staging server**:
```bash
# Copy build files
scp -r dist/* user@staging-server:/var/www/regenx/

# Start backend services
ssh user@staging-server
cd /opt/regenx
docker-compose -f docker-compose.staging.yml up -d
```

### Production

1. **Build optimized frontend**:
```bash
npm run build -- --mode production
```

2. **Deploy with Docker**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Configure reverse proxy** (Nginx example):
```nginx
server {
    listen 80;
    server_name regenx.example.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
    }

    location /ws {
        proxy_pass http://localhost:8003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Environment Variables

### Frontend (.env)
```bash
VITE_API_URL=https://api.regenx.com
VITE_HONEYPOT_DETECTOR_URL=https://honeypot.regenx.com
VITE_WALLET_GUARD_URL=https://walletguard.regenx.com
VITE_WS_URL=wss://walletguard.regenx.com/ws
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ENABLE_MOCK_API=false
```

### Backend
```bash
# Honeypot Detector
MONGODB_URL=mongodb://mongo:27017
REDIS_URL=redis://redis:6379
API_KEY=your-api-key

# Wallet Guard
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost/wallet_guard
SECRET_KEY=your-secret-key
```

## Health Checks

### Frontend
```bash
curl http://localhost:5173
```

### Backend Services
```bash
# Honeypot Detector
curl http://localhost:8001/health

# Wallet Guard
curl http://localhost:8003/health
```

## Monitoring

### Set up monitoring:
1. **Prometheus** - Metrics collection
2. **Grafana** - Visualization
3. **Sentry** - Error tracking
4. **Uptime monitoring** - Service availability

## Scaling

### Horizontal Scaling
- Use load balancer for multiple API instances
- Scale WebSocket connections with Redis pub/sub
- Use CDN for static assets

### Vertical Scaling
- Increase container resources
- Optimize database queries
- Enable caching

## Backup

### Database Backups
```bash
# MongoDB
mongodump --uri="mongodb://localhost:27017" --out=/backup/mongo

# PostgreSQL
pg_dump wallet_guard > /backup/wallet_guard.sql
```

### Automated Backups
Set up cron jobs or use backup services.

## Security Checklist

- [ ] HTTPS enabled
- [ ] API keys secured
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Security headers set
- [ ] Regular security updates

