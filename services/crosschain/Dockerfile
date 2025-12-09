# Multi-stage build for production optimization
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    libpq-dev \
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev \
    libjpeg-dev \
    libpng-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libwebp-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libxcb1-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

# Production stage
FROM python:3.11-slim as production

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH" \
    PYTHONPATH="/app" \
    ENVIRONMENT=production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    libssl3 \
    libxml2 \
    libxslt1.1 \
    zlib1g \
    libjpeg62-turbo \
    libpng16-16 \
    libfreetype6 \
    liblcms2-2 \
    libwebp7 \
    libharfbuzz0b \
    libfribidi0 \
    libxcb1 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r bridgeuser && useradd -r -g bridgeuser bridgeuser

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/data /app/logs /app/models /app/tmp && \
    chown -R bridgeuser:bridgeuser /app

# Install additional production dependencies
RUN pip install --no-cache-dir \
    gunicorn[gevent] \
    uvicorn[standard] \
    psycopg2-binary \
    redis \
    celery[redis] \
    flower \
    prometheus-client \
    structlog \
    sentry-sdk[fastapi] \
    opentelemetry-api \
    opentelemetry-sdk \
    opentelemetry-instrumentation-fastapi \
    opentelemetry-instrumentation-requests \
    opentelemetry-instrumentation-psycopg2 \
    opentelemetry-instrumentation-redis \
    opentelemetry-instrumentation-celery \
    opentelemetry-exporter-jaeger \
    opentelemetry-exporter-prometheus

# Create health check script
RUN echo '#!/bin/bash\ncurl -f http://localhost:8000/health || exit 1' > /app/healthcheck.sh && \
    chmod +x /app/healthcheck.sh

# Switch to non-root user
USER bridgeuser

# Expose ports
EXPOSE 8000 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /app/healthcheck.sh

# Default command
CMD ["gunicorn", "src.api.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "--access-logfile", "-", "--error-logfile", "-", "--log-level", "info"]

# Labels for metadata
LABEL maintainer="Bridge Security Team" \
      version="1.0.0" \
      description="Cross-Chain Bridge Security Analysis Service" \
      org.opencontainers.image.title="Cross-Chain Bridge Security Service" \
      org.opencontainers.image.description="Production-grade cross-chain bridge security monitoring and analysis" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.authors="Bridge Security Team" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.url="https://github.com/bridge-security/cross-chain-bridge-service" \
      org.opencontainers.image.documentation="https://docs.bridge-security.com" \
      org.opencontainers.image.source="https://github.com/bridge-security/cross-chain-bridge-service" \
      org.opencontainers.image.revision="latest"