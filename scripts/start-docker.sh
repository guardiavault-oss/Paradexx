#!/bin/bash

# ===========================================
# DEGENX DOCKER STARTUP SCRIPT
# ===========================================

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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    print_error "docker-compose is not installed. Please install it first."
    exit 1
fi

print_status "Starting DegenX development environment..."

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.production .env
    print_warning "Please edit .env file with your API keys before running the application."
fi

# Create necessary directories
mkdir -p logs
mkdir -p data/postgres
mkdir -p data/redis

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true

# Build and start services
print_status "Building Docker images..."
docker-compose build --no-cache

print_status "Starting services..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check service health
print_status "Checking service health..."

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U degenx_user -d degenx > /dev/null 2>&1; then
    print_success "PostgreSQL is ready"
else
    print_error "PostgreSQL is not ready"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is ready"
else
    print_error "Redis is not ready"
fi

# Check Backend
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_success "Backend API is ready"
else
    print_warning "Backend API is still starting..."
fi

# Check Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend is ready"
else
    print_warning "Frontend is still starting..."
fi

# ===========================================
# DISPLAY ACCESS INFORMATION
# ===========================================

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}    DEGENX DEVELOPMENT ENVIRONMENT     ${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}🌐 Frontend Application:${NC}"
echo -e "   URL: ${YELLOW}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}🔧 Backend API:${NC}"
echo -e "   URL: ${YELLOW}http://localhost:3001${NC}"
echo -e "   Health: ${YELLOW}http://localhost:3001/health${NC}"
echo ""
echo -e "${BLUE}🗄️  Database Admin (pgAdmin):${NC}"
echo -e "   URL: ${YELLOW}http://localhost:5050${NC}"
echo -e "   Email: ${YELLOW}admin@degenx.com${NC}"
echo -e "   Password: ${YELLOW}degenx_admin_2024${NC}"
echo ""
echo -e "${BLUE}🔴 Redis Admin (Redis Commander):${NC}"
echo -e "   URL: ${YELLOW}http://localhost:8081${NC}"
echo ""
echo -e "${BLUE}📊 Database Connection:${NC}"
echo -e "   Host: ${YELLOW}localhost:5432${NC}"
echo -e "   Database: ${YELLOW}degenx${NC}"
echo -e "   User: ${YELLOW}degenx_user${NC}"
echo -e "   Password: ${YELLOW}degenx_secure_password_2024${NC}"
echo ""
echo -e "${BLUE}🔑 Sample Admin User:${NC}"
echo -e "   Email: ${YELLOW}admin@degenx.com${NC}"
echo -e "   Password: ${YELLOW}admin123${NC}"
echo ""
echo -e "${BLUE}📝 Useful Commands:${NC}"
echo -e "   View logs: ${YELLOW}docker-compose logs -f${NC}"
echo -e "   Stop services: ${YELLOW}docker-compose down${NC}"
echo -e "   Restart services: ${YELLOW}docker-compose restart${NC}"
echo -e "   Access backend shell: ${YELLOW}docker-compose exec backend sh${NC}"
echo -e "   Access database: ${YELLOW}docker-compose exec postgres psql -U degenx_user -d degenx${NC}"
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}     🚀 DegenX is ready to use! 🚀      ${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""

# Show logs for a few seconds
print_status "Showing recent logs (Ctrl+C to exit)..."
timeout 15s docker-compose logs -f --tail=20 || true
