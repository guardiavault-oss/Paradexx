#!/bin/bash
# Production Deployment Script
# Comprehensive deployment automation

set -e  # Exit on error

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check required environment variables
check_env_var() {
  if [ -z "${!1}" ]; then
    echo -e "${RED}❌ Error: $1 is not set${NC}"
    exit 1
  fi
}

echo "📋 Checking environment variables..."
check_env_var "DATABASE_URL"
check_env_var "SESSION_SECRET"
check_env_var "ENCRYPTION_KEY"

# Optional but recommended
if [ -z "$SENTRY_DSN" ]; then
  echo -e "${YELLOW}⚠️  Warning: SENTRY_DSN not set - error tracking disabled${NC}"
fi

# Step 1: Run tests
echo ""
echo "🧪 Running tests..."
pnpm run test || {
  echo -e "${RED}❌ Tests failed - aborting deployment${NC}"
  exit 1
}

# Step 2: Type check
echo ""
echo "🔍 Running type check..."
pnpm run check || {
  echo -e "${RED}❌ Type check failed - aborting deployment${NC}"
  exit 1
}

# Step 3: Build
echo ""
echo "🔨 Building application..."
pnpm run build || {
  echo -e "${RED}❌ Build failed - aborting deployment${NC}"
  exit 1
}

# Step 4: Run database migrations
echo ""
echo "🗄️  Running database migrations..."
if [ -f "server/scripts/migrate.ts" ]; then
  pnpm run db:migrate || {
    echo -e "${YELLOW}⚠️  Migration script not found or failed${NC}"
  }
fi

# Step 5: Security audit
echo ""
echo "🔒 Running security audit..."
pnpm audit --audit-level=moderate || {
  echo -e "${YELLOW}⚠️  Security vulnerabilities found - review before deploying${NC}"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
}

# Step 6: Deploy (customize based on your platform)
echo ""
echo "📦 Deployment method: ${DEPLOYMENT_METHOD:-docker}"

case "${DEPLOYMENT_METHOD:-docker}" in
  docker)
    echo "🐳 Building Docker image..."
    docker-compose -f docker-compose.prod.yml build
    
    echo "🚀 Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    echo "⏳ Waiting for services to be healthy..."
    sleep 10
    
    # Health check
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
      echo -e "${GREEN}✅ Health check passed${NC}"
    else
      echo -e "${RED}❌ Health check failed${NC}"
      docker-compose -f docker-compose.prod.yml logs
      exit 1
    fi
    ;;
  
  vercel|netlify)
    echo "☁️  Deploying to ${DEPLOYMENT_METHOD}..."
    # Add Vercel/Netlify CLI commands
    echo "Run: vercel --prod or netlify deploy --prod"
    ;;
  
  aws|gcp|azure)
    echo "☁️  Deploying to ${DEPLOYMENT_METHOD}..."
    # Add cloud provider specific deployment
    echo "Configure your cloud deployment pipeline"
    ;;
  
  *)
    echo -e "${YELLOW}⚠️  Unknown deployment method: ${DEPLOYMENT_METHOD}${NC}"
    echo "Manual deployment required"
    ;;
esac

# Step 7: Post-deployment verification
echo ""
echo "✅ Verifying deployment..."

# Check health endpoint
HEALTH_URL="${DEPLOYMENT_URL:-http://localhost:5000}/health"
if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Application is healthy${NC}"
else
  echo -e "${RED}❌ Application health check failed${NC}"
  exit 1
fi

# Check readiness endpoint
READY_URL="${DEPLOYMENT_URL:-http://localhost:5000}/ready"
if curl -f "$READY_URL" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Application is ready${NC}"
else
  echo -e "${YELLOW}⚠️  Readiness check failed (may be expected if blockchain not configured)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "📊 Next steps:"
echo "  1. Monitor application logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  2. Check monitoring dashboard: ${MONITORING_URL:-Not configured}"
echo "  3. Test critical user flows"
echo "  4. Set up alerting for errors and performance"

