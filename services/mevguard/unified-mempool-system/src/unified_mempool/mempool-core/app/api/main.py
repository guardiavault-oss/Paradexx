import logging
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "core-engine"))
"""
Main API Application

FastAPI application with all routers, middleware, and configuration.
This is the main entry point for the Elite Mempool System API.
"""

import os  # noqa: E402
import time  # noqa: E402
from contextlib import asynccontextmanager  # noqa: E402
from datetime import datetime  # noqa: E402

try:
    from common.observability.logging import get_scorpius_logger  # noqa: E402
except ImportError:
    def get_scorpius_logger(name):
        return logging.getLogger(name)
from fastapi import FastAPI, Request, status  # noqa: E402
from fastapi.exception_handlers import RequestValidationError  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.middleware.gzip import GZipMiddleware  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from prometheus_client import Counter, Histogram, generate_latest  # noqa: E402
from starlette.responses import Response  # noqa: E402

from .dependencies import db_manager  # noqa: E402

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = get_scorpius_logger(__name__)

# Import routers
try:
    from .routers import (
        transactions_router,
        alerts_router,
        rules_router,
        mev_router,
        analytics_router,
        websocket_router,
    )
    ROUTERS_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Some routers not available: {e}")
    ROUTERS_AVAILABLE = False
    # Create dummy routers to prevent errors
    from fastapi import APIRouter
    transactions_router = APIRouter()
    alerts_router = APIRouter()
    rules_router = APIRouter()
    mev_router = APIRouter()
    analytics_router = APIRouter()
    websocket_router = APIRouter()

# Prometheus metrics
REQUEST_COUNT = Counter(
    "scorpius_api_requests_total",
    "Total API requests",
    ["method", "endpoint", "status"],
)
REQUEST_DURATION = Histogram(
    "scorpius_api_request_duration_seconds", "Request duration"
)


class Config:
    """Application configuration"""

    def __init__(self):
        self.database_url = os.getenv(
            "POSTGRES_URL", "postgresql://postgres:password@localhost:5432/scorpius"
        )
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.jwt_secret = os.getenv("JWT_SECRET", "your-secret-key")
        self.cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
        self.log_level = os.getenv("LOG_LEVEL", "INFO")
        self.max_connections = int(os.getenv("MAX_WEBSOCKET_CONNECTIONS", "1000"))
        self.rate_limit_per_minute = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
        self.environment = os.getenv("ENVIRONMENT", "development")


config = Config()


# Application lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events"""
    # Startup
    logger.info("Starting Elite Mempool System API...")

    try:
        await db_manager.initialize()
        logger.info("Database connections initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down Elite Mempool System API...")
    try:
        await db_manager.close()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


# Create FastAPI app
app = FastAPI(
    title="Elite Mempool System API",
    description="Enterprise-grade mempool intelligence and MEV detection platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if config.environment == "development" else None,
    redoc_url="/redoc" if config.environment == "development" else None,
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)


# Middleware for metrics and logging
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Record request metrics and handle errors"""
    start_time = time.time()

    try:
        response = await call_next(request)
        duration = time.time() - start_time

        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code,
        ).inc()

        REQUEST_DURATION.observe(duration)

        # Add response headers
        response.headers["X-Response-Time"] = f"{duration:.4f}s"
        response.headers["X-Request-ID"] = getattr(
            request.state, "request_id", "unknown"
        )

        return response

    except Exception as e:
        duration = time.time() - start_time

        REQUEST_COUNT.labels(
            method=request.method, endpoint=request.url.path, status=500
        ).inc()

        logger.error(f"Request failed: {request.method} {request.url.path} - {e}")

        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "message": "An unexpected error occurred",
                "timestamp": datetime.utcnow().isoformat(),
                "path": request.url.path,
            },
        )


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "Request validation failed",
            "details": exc.errors(),
            "timestamp": datetime.utcnow().isoformat(),
            "path": request.url.path,
        },
    )


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Handle 404 errors"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": f"The requested resource '{request.url.path}' was not found",
            "timestamp": datetime.utcnow().isoformat(),
            "path": request.url.path,
        },
    )


# Health check endpoints
@app.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": config.environment,
    }


@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with component status"""
    checks = {"api": "healthy", "database": "unknown", "redis": "unknown"}

    try:
        # Check database
        if db_manager.pool:
            async with db_manager.pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            checks["database"] = "healthy"
        else:
            checks["database"] = "unhealthy"
    except Exception as e:
        checks["database"] = "unhealthy"
        logger.error(f"Database health check failed: {e}")

    try:
        # Check Redis
        if db_manager.redis:
            await db_manager.redis.ping()
            checks["redis"] = "healthy"
        else:
            checks["redis"] = "unhealthy"
    except Exception as e:
        checks["redis"] = "unhealthy"
        logger.error(f"Redis health check failed: {e}")

    overall_status = (
        "healthy"
        if all(status == "healthy" for status in checks.values())
        else "degraded"
    )

    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": config.environment,
        "checks": checks,
    }


@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type="text/plain")


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Elite Mempool System API",
        "version": "1.0.0",
        "description": "Enterprise-grade mempool intelligence and MEV detection platform",
        "docs_url": "/docs" if config.environment == "development" else None,
        "health_url": "/health",
        "metrics_url": "/metrics",
        "timestamp": datetime.utcnow().isoformat(),
    }


# Include routers
if ROUTERS_AVAILABLE:
    try:
        app.include_router(transactions_router)
        app.include_router(alerts_router)
        app.include_router(rules_router)
        app.include_router(mev_router)
        app.include_router(analytics_router)
        app.include_router(websocket_router)
        logger.info("All routers included successfully")
    except Exception as e:
        logger.warning(f"Failed to include some routers: {e}")
else:
    logger.warning("Routers not available - running in minimal mode")


# Development startup
if __name__ == "__main__":
    import uvicorn  # noqa: E402

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=config.log_level.lower(),
    )
