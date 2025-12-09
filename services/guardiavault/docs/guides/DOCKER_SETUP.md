# Docker Setup Guide

GuardiaVault includes Docker configurations for both development and production deployments.

## Quick Start

### Development with Docker Compose

1. **Create environment file**:
   ```bash
   cp .env.example .env
   # Edit .env and set your variables
   ```

2. **Start all services**:
   ```bash
   docker-compose up -d
   ```

3. **Run database migrations**:
   ```bash
   docker-compose exec app pnpm run db:migrate
   ```

4. **Access the application**:
   - Application: http://localhost:5000
   - Database: localhost:5432

5. **View logs**:
   ```bash
   docker-compose logs -f app
   ```

6. **Stop services**:
   ```bash
   docker-compose down
   ```

## Dockerfile

The application uses a multi-stage Docker build:

- **Stage 1 (deps)**: Installs dependencies
- **Stage 2 (builder)**: Builds the application
- **Stage 3 (runner)**: Production runtime with minimal dependencies

### Building the Image

```bash
# Build the Docker image
docker build -t guardiavault:latest .

# Tag for registry
docker tag guardiavault:latest your-registry/guardiavault:latest
```

### Running the Container

```bash
# Run with environment variables
docker run -d \
  --name guardiavault \
  -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e SESSION_SECRET="your-secret" \
  -e NODE_ENV=production \
  guardiavault:latest

# Run with .env file
docker run -d \
  --name guardiavault \
  -p 5000:5000 \
  --env-file .env \
  guardiavault:latest
```

## Docker Compose

### Development Setup

Use `docker-compose.yml` for local development:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Rebuild after code changes
docker-compose up -d --build
```

### Production Setup

Use `docker-compose.prod.yml` for production:

```bash
# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Stop production stack
docker-compose -f docker-compose.prod.yml down
```

**Important**: Before running production setup:
1. Set all required environment variables in `.env`
2. Review security settings
3. Configure database backups
4. Set up SSL/TLS certificates

## Services

### Application Container

- **Port**: 5000
- **Health Check**: `/health` endpoint
- **Readiness**: `/ready` endpoint

### PostgreSQL Container

- **Port**: 5432 (development only)
- **Volume**: Persistent data storage
- **Health Check**: `pg_isready`

### Backup Service (Production)

- Automatically backs up database daily
- Retains last 7 days of backups
- Stores backups in `./backups` directory

## Environment Variables

### Required

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption secret
- `NODE_ENV` - Environment (development/production)

### Optional

- `PORT` - Server port (default: 5000)
- `HOST` - Server host (default: 0.0.0.0)
- `LOG_LEVEL` - Logging level (default: info)
- `SENTRY_DSN` - Sentry error tracking
- `APP_URL` - Application URL

See `.env.example` for complete list.

## Database Migrations

Run migrations inside the container:

```bash
# Development
docker-compose exec app pnpm run db:migrate

# Production
docker-compose -f docker-compose.prod.yml exec app pnpm run db:migrate

# Check migration status
docker-compose exec app pnpm run db:migrate:status
```

## Building for Different Environments

### Development Build

```bash
docker build -t guardiavault:dev --target builder .
```

### Production Build

```bash
docker build -t guardiavault:prod --target runner .
```

## Health Checks

The Dockerfile includes a health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

Check container health:

```bash
docker ps
# Look for "healthy" status

# Inspect health check
docker inspect --format='{{json .State.Health}}' guardiavault | jq
```

## Troubleshooting

### Container Won't Start

1. **Check logs**:
   ```bash
   docker-compose logs app
   ```

2. **Check environment variables**:
   ```bash
   docker-compose exec app env
   ```

3. **Verify database connection**:
   ```bash
   docker-compose exec app pnpm run db:migrate:status
   ```

### Database Connection Issues

1. **Verify database is running**:
   ```bash
   docker-compose ps postgres
   ```

2. **Check database logs**:
   ```bash
   docker-compose logs postgres
   ```

3. **Test connection**:
   ```bash
   docker-compose exec postgres psql -U guardiavault -d guardiavault
   ```

### Port Conflicts

If port 5000 is already in use:

1. **Change port in docker-compose.yml**:
   ```yaml
   ports:
     - "5001:5000"  # Use different host port
   ```

2. **Or stop conflicting service**:
   ```bash
   # Find what's using port 5000
   lsof -i :5000
   # Kill the process or change GuardiaVault port
   ```

### Volume Issues

Clear volumes and start fresh:

```bash
# Stop and remove volumes
docker-compose down -v

# Remove specific volume
docker volume rm guardiavault_postgres_data
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] SSL/TLS certificates configured
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Health checks working
- [ ] Rate limiting configured
- [ ] Security headers enabled

### Deployment Steps

1. **Build production image**:
   ```bash
   docker build -t guardiavault:latest .
   ```

2. **Tag for registry**:
   ```bash
   docker tag guardiavault:latest your-registry/guardiavault:v1.0.0
   ```

3. **Push to registry**:
   ```bash
   docker push your-registry/guardiavault:v1.0.0
   ```

4. **Deploy**:
   ```bash
   # Using docker-compose
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   
   # Or using orchestration platform (Kubernetes, etc.)
   ```

5. **Run migrations**:
   ```bash
   docker-compose -f docker-compose.prod.yml exec app pnpm run db:migrate
   ```

6. **Verify deployment**:
   ```bash
   curl http://your-domain/health
   curl http://your-domain/ready
   ```

## Advanced Configuration

### Custom Network

Create custom network for isolation:

```bash
docker network create guardiavault-network
```

### Resource Limits

Set resource limits in `docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
```

### Volume Mounts

Mount additional volumes:

```yaml
volumes:
  - ./config:/app/config:ro
  - ./logs:/app/logs
```

## Security Considerations

1. **Use secrets management** for sensitive data (Docker Secrets, AWS Secrets Manager, etc.)
2. **Run as non-root user** (already configured in Dockerfile)
3. **Don't expose database ports** in production
4. **Use TLS/SSL** for all connections
5. **Regularly update base images**
6. **Scan images for vulnerabilities**
7. **Limit container resources**

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build Docker image
  run: docker build -t guardiavault:${{ github.sha }} .

- name: Push to registry
  run: docker push guardiavault:${{ github.sha }}
```

### GitLab CI Example

```yaml
build:
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

## Additional Resources

- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose Docs**: https://docs.docker.com/compose/
- **Multi-stage Builds**: https://docs.docker.com/build/building/multi-stage/

---

**Note**: Always test Docker configurations in a staging environment before deploying to production!

