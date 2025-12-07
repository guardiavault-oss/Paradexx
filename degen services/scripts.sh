#!/bin/bash

# ============================================================================
# APEX SNIPER - Operations Scripts
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print with color
print_color() {
    printf "${1}${2}${NC}\n"
}

# Banner
print_banner() {
    print_color $CYAN "
 █████╗ ██████╗ ███████╗██╗  ██╗    ███████╗███╗   ██╗██╗██████╗ ███████╗██████╗ 
██╔══██╗██╔══██╗██╔════╝╚██╗██╔╝    ██╔════╝████╗  ██║██║██╔══██╗██╔════╝██╔══██╗
███████║██████╔╝█████╗   ╚███╔╝     ███████╗██╔██╗ ██║██║██████╔╝█████╗  ██████╔╝
██╔══██║██╔═══╝ ██╔══╝   ██╔██╗     ╚════██║██║╚██╗██║██║██╔═══╝ ██╔══╝  ██╔══██╗
██║  ██║██║     ███████╗██╔╝ ██╗    ███████║██║ ╚████║██║██║     ███████╗██║  ██║
╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝    ╚══════╝╚═╝  ╚═══╝╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝
    "
}

# Help
show_help() {
    print_banner
    echo "Usage: ./scripts.sh [command]"
    echo ""
    echo "Commands:"
    echo "  install     Install all dependencies"
    echo "  dev         Start development server"
    echo "  build       Build for production"
    echo "  start       Start production server"
    echo "  docker      Build and start Docker containers"
    echo "  docker-stop Stop Docker containers"
    echo "  db-push     Push Prisma schema to database"
    echo "  db-studio   Open Prisma Studio"
    echo "  lint        Run linter"
    echo "  test        Run tests"
    echo "  clean       Clean build artifacts"
    echo ""
}

# Install dependencies
install_deps() {
    print_color $YELLOW "Installing backend dependencies..."
    npm install

    print_color $YELLOW "Installing dashboard dependencies..."
    cd src/dashboard && npm install && cd ../..

    print_color $YELLOW "Generating Prisma client..."
    npx prisma generate

    print_color $GREEN "✓ Installation complete!"
}

# Development
dev() {
    print_banner
    print_color $CYAN "Starting development server..."
    npm run dev
}

# Build
build() {
    print_color $YELLOW "Building backend..."
    npm run build

    print_color $YELLOW "Building dashboard..."
    cd src/dashboard && npm run build && cd ../..

    print_color $GREEN "✓ Build complete!"
}

# Start production
start() {
    print_banner
    print_color $CYAN "Starting production server..."
    npm start
}

# Docker
docker_start() {
    print_color $YELLOW "Building Docker images..."
    docker-compose build

    print_color $YELLOW "Starting containers..."
    docker-compose up -d

    print_color $GREEN "✓ Containers started!"
    print_color $CYAN "Dashboard: http://localhost:3000"
    print_color $CYAN "API: http://localhost:3001"
}

docker_stop() {
    print_color $YELLOW "Stopping containers..."
    docker-compose down
    print_color $GREEN "✓ Containers stopped!"
}

# Database
db_push() {
    print_color $YELLOW "Pushing schema to database..."
    npx prisma db push
    print_color $GREEN "✓ Database updated!"
}

db_studio() {
    print_color $CYAN "Opening Prisma Studio..."
    npx prisma studio
}

# Lint
lint() {
    print_color $YELLOW "Running linter..."
    npm run lint
}

# Test
test() {
    print_color $YELLOW "Running tests..."
    npm test
}

# Clean
clean() {
    print_color $YELLOW "Cleaning build artifacts..."
    rm -rf dist
    rm -rf src/dashboard/dist
    rm -rf node_modules/.cache
    print_color $GREEN "✓ Cleaned!"
}

# Main
case "$1" in
    install)
        install_deps
        ;;
    dev)
        dev
        ;;
    build)
        build
        ;;
    start)
        start
        ;;
    docker)
        docker_start
        ;;
    docker-stop)
        docker_stop
        ;;
    db-push)
        db_push
        ;;
    db-studio)
        db_studio
        ;;
    lint)
        lint
        ;;
    test)
        test
        ;;
    clean)
        clean
        ;;
    *)
        show_help
        ;;
esac
