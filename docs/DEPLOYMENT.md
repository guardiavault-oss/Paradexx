# Deployment Guide

Complete deployment guide for RegenX across all environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Frontend Deployment](#frontend-deployment)
4. [Backend Deployment](#backend-deployment)
5. [Database Setup](#database-setup)
6. [WebSocket Server](#websocket-server)
7. [Monitoring](#monitoring)
8. [Rollback Procedures](#rollback-procedures)

## Prerequisites

- Node.js 18+ and npm/yarn
- Docker and Docker Compose (optional)
- PostgreSQL 14+
- Redis 6+
- SSL certificates for production

## Environment Setup

### Environment Variables

Create `.env` files for each environment:

**Development (.env.development)**
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
VITE_ENABLE_WEBSOCKET=true
VITE_SENTRY_DSN=
NODE_ENV=development
```

**Staging (.env.staging)**
```env
VITE_API_URL=https://api-staging.regenx.app
VITE_WS_URL=wss://api-staging.regenx.app/ws
VITE_ENABLE_WEBSOCKET=true
VITE_SENTRY_DSN=your-sentry-dsn
NODE_ENV=staging
```

**Production (.env.production)**
```env
VITE_API_URL=https://api.regenx.app
VITE_WS_URL=wss://api.regenx.app/ws
VITE_ENABLE_WEBSOCKET=true
VITE_SENTRY_DSN=your-sentry-dsn
NODE_ENV=production
```

## Frontend Deployment

### Build

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Output will be in dist/
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify Deployment

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and run
docker build -t regenx-frontend .
docker run -p 80:80 regenx-frontend
```

## Backend Deployment

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/regenx
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=regenx
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

```bash
# Deploy
docker-compose up -d
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: regenx-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: regenx-api
  template:
    metadata:
      labels:
        app: regenx-api
    spec:
      containers:
      - name: api
        image: regenx/api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: regenx-secrets
              key: database-url
```

## Database Setup

### PostgreSQL

```bash
# Create database
createdb regenx

# Run migrations
npm run migrate

# Seed data (optional)
npm run seed
```

### Redis

```bash
# Start Redis
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:6-alpine
```

## WebSocket Server

### Standalone Server

```typescript
// server/websocket.ts
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  // Handle connections
});

server.listen(8000);
```

### Load Balancer Configuration

For production, use a load balancer with sticky sessions:

```nginx
# nginx.conf
upstream websocket {
    ip_hash;
    server ws1:8000;
    server ws2:8000;
    server ws3:8000;
}

server {
    location /ws {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Monitoring

### Health Checks

```typescript
// health.ts
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      websocket: await checkWebSocket(),
    },
  };
  
  const isHealthy = Object.values(health.services).every(s => s === 'ok');
  res.status(isHealthy ? 200 : 503).json(health);
});
```

### Logging

```typescript
// Use structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### Metrics

```typescript
// Prometheus metrics
import promClient from 'prom-client';

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
});

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => end());
  next();
});
```

## Rollback Procedures

### Frontend Rollback

```bash
# Vercel
vercel rollback [deployment-url]

# Netlify
netlify rollback [deployment-id]

# Docker
docker pull regenx/frontend:previous-version
docker-compose up -d
```

### Database Rollback

```bash
# Rollback last migration
npm run migrate:rollback

# Or restore from backup
pg_restore -d regenx backup.dump
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - run: npm run deploy
```

## Security Checklist

- [ ] SSL/TLS certificates configured
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] API keys stored in secrets manager
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] DDoS protection active
- [ ] Security headers set
- [ ] Regular security updates

## Troubleshooting

See [Troubleshooting Guide](./TROUBLESHOOTING.md) for deployment issues.

