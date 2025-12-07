# Unified Mempool Monitoring System - Makefile
# =============================================

.PHONY: help install dev test lint format clean build run stop logs status health

# Default target
help: ## Show this help message
	@echo "Unified Mempool Monitoring System"
	@echo "================================="
	@echo ""
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development setup
install: ## Install dependencies
	python -m pip install --upgrade pip
	pip install -e ".[dev,test]"
	pre-commit install

dev: ## Start development environment
	docker-compose up -d redis postgres
	python -m unified_mempool.cli api --host 0.0.0.0 --port 8000 --log-level debug

# Testing
test: ## Run tests
	pytest tests/ -v --cov=src/unified_mempool --cov-report=html --cov-report=term

test-unit: ## Run unit tests only
	pytest tests/unit/ -v

test-integration: ## Run integration tests only
	pytest tests/integration/ -v

test-performance: ## Run performance tests
	pytest tests/performance/ -v -m performance

# Code quality
lint: ## Run linting
	flake8 src/ tests/
	mypy src/
	black --check src/ tests/

format: ## Format code
	black src/ tests/
	isort src/ tests/

# Docker operations
build: ## Build Docker image
	docker build -t unified-mempool-system:latest .

build-dev: ## Build development Docker image
	docker build --target development -t unified-mempool-system:dev .

run: ## Run with Docker Compose
	docker-compose up -d

run-prod: ## Run production environment
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

stop: ## Stop all services
	docker-compose down

logs: ## Show logs
	docker-compose logs -f

logs-app: ## Show application logs only
	docker-compose logs -f unified-mempool

# Monitoring and status
status: ## Show system status
	curl -s http://localhost:8000/health | jq .

health: ## Check system health
	@echo "Checking system health..."
	@curl -s http://localhost:8000/health > /dev/null && echo "✅ API is healthy" || echo "❌ API is not responding"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ Grafana is healthy" || echo "❌ Grafana is not responding"
	@curl -s http://localhost:9091 > /dev/null && echo "✅ Prometheus is healthy" || echo "❌ Prometheus is not responding"

# Database operations
db-init: ## Initialize database
	docker-compose exec postgres psql -U postgres -d unified_mempool -f /docker-entrypoint-initdb.d/init-db.sql

db-reset: ## Reset database
	docker-compose down -v
	docker-compose up -d postgres
	sleep 10
	$(MAKE) db-init

db-backup: ## Backup database
	docker-compose exec postgres pg_dump -U postgres unified_mempool > backup_$(shell date +%Y%m%d_%H%M%S).sql

# Security
security: ## Run security checks
	safety check
	bandit -r src/

# Documentation
docs: ## Generate documentation
	mkdocs serve

docs-build: ## Build documentation
	mkdocs build

# Cleanup
clean: ## Clean up temporary files
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/
	rm -rf dist/
	rm -rf .coverage
	rm -rf htmlcov/
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/

clean-docker: ## Clean up Docker resources
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

# Release operations
version: ## Show current version
	@python -c "import unified_mempool; print(unified_mempool.__version__)"

release: ## Create a new release
	@echo "Creating release..."
	@read -p "Enter version number: " version; \
	git tag -a v$$version -m "Release v$$version"; \
	git push origin v$$version

# Performance testing
benchmark: ## Run performance benchmarks
	python -m pytest tests/performance/ -v --benchmark-only

load-test: ## Run load tests
	@echo "Running load tests..."
	@for i in {1..100}; do \
		curl -s http://localhost:8000/health > /dev/null; \
	done
	@echo "Load test completed"

# Monitoring setup
monitoring: ## Setup monitoring stack
	docker-compose up -d prometheus grafana
	@echo "Monitoring stack started"
	@echo "Grafana: http://localhost:3000 (admin/admin)"
	@echo "Prometheus: http://localhost:9091"

# SSL/TLS setup
ssl: ## Generate SSL certificates
	@echo "Generating SSL certificates..."
	openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Environment setup
env: ## Create environment file
	@echo "Creating .env file..."
	@echo "POSTGRES_PASSWORD=$(shell openssl rand -base64 32)" > .env
	@echo "JWT_SECRET=$(shell openssl rand -base64 64)" >> .env
	@echo "API_KEY=$(shell openssl rand -base64 32)" >> .env
	@echo "GRAFANA_PASSWORD=$(shell openssl rand -base64 16)" >> .env
	@echo ".env file created"

# Quick start
quickstart: env build run ## Quick start setup
	@echo "🚀 Unified Mempool System is starting..."
	@echo "⏳ Waiting for services to be ready..."
	@sleep 30
	@$(MAKE) health
	@echo ""
	@echo "✅ System is ready!"
	@echo "🌐 API: http://localhost:8000"
	@echo "📊 Grafana: http://localhost:3000"
	@echo "📈 Prometheus: http://localhost:9091"
	@echo "📚 API Docs: http://localhost:8000/docs"

# Production deployment
deploy: ## Deploy to production
	@echo "Deploying to production..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo "Production deployment completed"

# Backup and restore
backup: ## Create full backup
	@echo "Creating backup..."
	@mkdir -p backups
	@$(MAKE) db-backup
	@docker-compose exec redis redis-cli BGSAVE
	@echo "Backup completed"

restore: ## Restore from backup
	@echo "Available backups:"
	@ls -la *.sql 2>/dev/null || echo "No backups found"
	@read -p "Enter backup filename: " backup; \
	docker-compose exec -T postgres psql -U postgres -d unified_mempool < $$backup

# Development helpers
shell: ## Open shell in container
	docker-compose exec unified-mempool /bin/bash

db-shell: ## Open database shell
	docker-compose exec postgres psql -U postgres -d unified_mempool

redis-shell: ## Open Redis shell
	docker-compose exec redis redis-cli

# Update dependencies
update: ## Update dependencies
	pip install --upgrade pip
	pip install -r requirements.txt --upgrade
	pip freeze > requirements.txt

# Check system requirements
check: ## Check system requirements
	@echo "Checking system requirements..."
	@python --version
	@docker --version
	@docker-compose --version
	@echo "✅ All requirements met"