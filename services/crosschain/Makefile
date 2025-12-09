# Cross-Chain Bridge Service Makefile

.PHONY: help install dev prod test lint format clean docker-build docker-run docker-stop

# Default target
help:
	@echo "Cross-Chain Bridge Security Analysis Service"
	@echo "============================================="
	@echo ""
	@echo "Available targets:"
	@echo "  install      Install dependencies"
	@echo "  dev          Run in development mode"
	@echo "  prod         Run in production mode"
	@echo "  test         Run tests"
	@echo "  lint         Run linting"
	@echo "  format       Format code"
	@echo "  clean        Clean up temporary files"
	@echo "  docker-build Build Docker image"
	@echo "  docker-run   Run with Docker Compose"
	@echo "  docker-stop  Stop Docker Compose services"
	@echo ""

# Installation
install:
	@echo "Installing dependencies..."
	pip install -r requirements.txt
	pip install -e .

# Development
dev:
	@echo "Starting development server..."
	python run.py --dev

# Production
prod:
	@echo "Starting production server..."
	python run.py --prod

# Testing
test:
	@echo "Running tests..."
	pytest tests/ -v --cov=src --cov-report=html --cov-report=term-missing

test-unit:
	@echo "Running unit tests..."
	pytest tests/ -v -m unit

test-integration:
	@echo "Running integration tests..."
	pytest tests/ -v -m integration

# Code quality
lint:
	@echo "Running linting..."
	flake8 src/ tests/
	mypy src/

format:
	@echo "Formatting code..."
	black src/ tests/
	isort src/ tests/

# Cleanup
clean:
	@echo "Cleaning up..."
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/
	rm -rf dist/
	rm -rf htmlcov/
	rm -rf .coverage
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/

# Docker
docker-build:
	@echo "Building Docker image..."
	docker build -t cross-chain-bridge-service .

docker-run:
	@echo "Starting services with Docker Compose..."
	docker-compose up -d

docker-stop:
	@echo "Stopping Docker Compose services..."
	docker-compose down

docker-logs:
	@echo "Showing Docker logs..."
	docker-compose logs -f

# Database
db-init:
	@echo "Initializing database..."
	docker-compose exec postgres psql -U postgres -d bridge_service -f /docker-entrypoint-initdb.d/init-db.sql

db-reset:
	@echo "Resetting database..."
	docker-compose down -v
	docker-compose up -d postgres
	sleep 10
	$(MAKE) db-init

# Monitoring
monitor:
	@echo "Opening monitoring dashboards..."
	@echo "Grafana: http://localhost:3000 (admin/admin)"
	@echo "Prometheus: http://localhost:9090"
	@echo "Service: http://localhost:8000"

# Security
security-scan:
	@echo "Running security scan..."
	safety check
	bandit -r src/

# Documentation
docs:
	@echo "Generating documentation..."
	@echo "API Documentation: http://localhost:8000/docs"
	@echo "ReDoc: http://localhost:8000/redoc"

# Setup
setup: install
	@echo "Setting up development environment..."
	cp .env.example .env
	@echo "Please edit .env file with your configuration"

# CI/CD
ci-test:
	@echo "Running CI tests..."
	pytest tests/ --cov=src --cov-report=xml --junitxml=test-results.xml

ci-lint:
	@echo "Running CI linting..."
	flake8 src/ tests/
	mypy src/
	black --check src/ tests/

# Release
release-check:
	@echo "Checking release readiness..."
	$(MAKE) test
	$(MAKE) lint
	$(MAKE) security-scan
	@echo "Release check complete!"

# Quick start
quick-start: setup docker-run
	@echo "Quick start complete!"
	@echo "Service available at: http://localhost:8000"
	@echo "API docs at: http://localhost:8000/docs"
	@echo "Grafana at: http://localhost:3000"