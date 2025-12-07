# Scarlette AI Service - Development and Deployment Automation

.PHONY: help install install-dev clean test lint format build docker-build docker-run docs

# Default target
help: ## Show this help message
	@echo "Scarlette AI Service - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

# Installation
install: ## Install the package and dependencies
	pip install -r requirements.txt
	pip install -e .

install-dev: ## Install development dependencies
	pip install -r requirements.txt
	pip install -r requirements-dev.txt
	pip install -e .
	pre-commit install

install-ai: ## Install with AI dependencies (OpenAI, HuggingFace)
	pip install -e .[ai]

install-all: ## Install with all optional dependencies
	pip install -e .[all]

# Development
clean: ## Clean up build artifacts and cache files
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/ dist/ .coverage htmlcov/ .pytest_cache/ .mypy_cache/

format: ## Format code with black and isort
	black src/ tests/
	isort src/ tests/

lint: ## Run linting tools
	flake8 src/ tests/
	mypy src/
	black --check src/ tests/
	isort --check-only src/ tests/

# Testing
test: ## Run all tests
	pytest

test-unit: ## Run unit tests only
	pytest tests/unit/

test-integration: ## Run integration tests only
	pytest tests/integration/

test-coverage: ## Run tests with coverage report
	pytest --cov=src --cov-report=html --cov-report=term

test-watch: ## Run tests in watch mode
	pytest-watch

# Service Management
serve: ## Start the development server
	uvicorn src.scarlette_ai.main:app --host 0.0.0.0 --port 8000 --reload

serve-prod: ## Start the production server
	uvicorn src.scarlette_ai.main:app --host 0.0.0.0 --port 8000 --workers 4

health: ## Check service health
	curl -f http://localhost:8000/health || echo "Service not responding"

# Docker
docker-build: ## Build Docker image
	docker build -t scarlette-ai-service .

docker-build-dev: ## Build Docker image for development
	docker build -t scarlette-ai-service:dev --target builder .

docker-run: ## Run Docker container
	docker-compose up -d

docker-run-dev: ## Run Docker container in development mode
	docker-compose -f docker-compose.dev.yml up

docker-stop: ## Stop Docker containers
	docker-compose down

docker-logs: ## View Docker container logs
	docker-compose logs -f scarlette-ai

docker-clean: ## Clean up Docker images and containers
	docker-compose down --volumes --remove-orphans
	docker system prune -f

# Database and Redis
redis-start: ## Start Redis container
	docker run -d --name scarlette-redis -p 6379:6379 redis:7-alpine redis-server --requirepass scarlette_redis_2024

redis-stop: ## Stop Redis container
	docker stop scarlette-redis
	docker rm scarlette-redis

redis-cli: ## Connect to Redis CLI
	docker exec -it scarlette-redis redis-cli -a scarlette_redis_2024

# Package Management
build: ## Build distribution packages
	python setup.py sdist bdist_wheel

publish-test: ## Publish to TestPyPI
	twine upload --repository testpypi dist/*

publish: ## Publish to PyPI
	twine upload dist/*

# Documentation
docs-serve: ## Serve documentation locally
	mkdocs serve

docs-build: ## Build documentation
	mkdocs build

docs-deploy: ## Deploy documentation to GitHub Pages
	mkdocs gh-deploy

# Security and Validation
security-scan: ## Run security scans
	safety check
	bandit -r src/

validate: ## Run all validation checks
	make lint
	make test
	make security-scan

# Environment Setup
env-copy: ## Copy environment template
	cp .env.example .env
	@echo "Please edit .env with your configuration"

# CI/CD
ci-install: ## Install dependencies for CI
	pip install -r requirements.txt
	pip install -r requirements-dev.txt

ci-test: ## Run CI test suite
	make lint
	make test-coverage
	make security-scan

# Cleanup and Reset
reset: ## Reset development environment
	make clean
	make docker-clean
	pip uninstall -y scarlette-ai-service
	rm -rf .env

# Quick Start
quickstart: ## Quick setup for new developers
	make install-dev
	make env-copy
	make redis-start
	@echo ""
	@echo "🚀 Quick Start Complete!"
	@echo "1. Edit .env with your configuration"
	@echo "2. Run 'make serve' to start the development server"
	@echo "3. Visit http://localhost:8000 to see the API"