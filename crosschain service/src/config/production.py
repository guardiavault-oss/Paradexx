#!/usr/bin/env python3
"""
Production Configuration - Enterprise-grade configuration for production deployment
"""

import os
import secrets
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class DatabaseConfig:
    """Database configuration"""

    url: str
    pool_size: int = 20
    max_overflow: int = 30
    pool_timeout: int = 30
    pool_recycle: int = 3600
    echo: bool = False
    echo_pool: bool = False


@dataclass
class RedisConfig:
    """Redis configuration"""

    url: str
    max_connections: int = 50
    socket_timeout: int = 5
    socket_connect_timeout: int = 5
    retry_on_timeout: bool = True
    health_check_interval: int = 30


@dataclass
class SecurityConfig:
    """Security configuration"""

    jwt_secret_key: str
    encryption_key: str
    password_hashing_rounds: int = 12
    session_timeout: int = 3600
    max_login_attempts: int = 5
    lockout_duration: int = 900
    require_2fa: bool = True
    allowed_origins: list[str] = None


@dataclass
class MonitoringConfig:
    """Monitoring configuration"""

    prometheus_enabled: bool = True
    metrics_port: int = 9090
    jaeger_endpoint: str | None = None
    sentry_dsn: str | None = None
    log_level: str = "INFO"
    log_format: str = "json"
    enable_tracing: bool = True
    enable_profiling: bool = False


@dataclass
class MLConfig:
    """Machine Learning configuration"""

    model_path: str = "/app/models"
    update_interval: int = 3600
    batch_size: int = 1000
    max_workers: int = 4
    enable_gpu: bool = False
    model_cache_size: int = 1000
    prediction_timeout: int = 30


@dataclass
class BlockchainConfig:
    """Blockchain configuration"""

    networks: dict[str, dict[str, Any]]
    rpc_timeout: int = 30
    max_retries: int = 3
    rate_limit: int = 1000
    enable_websocket: bool = True
    connection_pool_size: int = 100


@dataclass
class CeleryConfig:
    """Celery configuration"""

    broker_url: str
    result_backend: str
    task_serializer: str = "json"
    accept_content: list[str] = None
    result_serializer: str = "json"
    timezone: str = "UTC"
    enable_utc: bool = True
    task_track_started: bool = True
    task_time_limit: int = 300
    task_soft_time_limit: int = 240
    worker_prefetch_multiplier: int = 1
    worker_max_tasks_per_child: int = 1000


@dataclass
class CacheConfig:
    """Cache configuration"""

    default_timeout: int = 300
    key_prefix: str = "bridge_security"
    enable_compression: bool = True
    compression_threshold: int = 1024
    max_memory_policy: str = "allkeys-lru"


@dataclass
class RateLimitConfig:
    """Rate limiting configuration"""

    enabled: bool = True
    default_limit: str = "1000/hour"
    burst_limit: str = "100/minute"
    window_size: int = 60
    max_requests: int = 1000


class ProductionConfig:
    """Production configuration manager"""

    def __init__(self):
        self.environment = os.getenv("ENVIRONMENT", "production")
        self.debug = os.getenv("DEBUG", "false").lower() == "true"

        # Database configuration
        self.database = DatabaseConfig(
            url=os.getenv(
                "DATABASE_URL", "postgresql://postgres:password@localhost:5432/bridge_security"
            ),
            pool_size=int(os.getenv("DB_POOL_SIZE", "20")),
            max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "30")),
            pool_timeout=int(os.getenv("DB_POOL_TIMEOUT", "30")),
            pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "3600")),
            echo=os.getenv("DB_ECHO", "false").lower() == "true",
        )

        # Redis configuration
        self.redis = RedisConfig(
            url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
            max_connections=int(os.getenv("REDIS_MAX_CONNECTIONS", "50")),
            socket_timeout=int(os.getenv("REDIS_SOCKET_TIMEOUT", "5")),
            socket_connect_timeout=int(os.getenv("REDIS_CONNECT_TIMEOUT", "5")),
            retry_on_timeout=os.getenv("REDIS_RETRY_ON_TIMEOUT", "true").lower() == "true",
            health_check_interval=int(os.getenv("REDIS_HEALTH_CHECK_INTERVAL", "30")),
        )

        # Security configuration
        self.security = SecurityConfig(
            jwt_secret_key=os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32)),
            encryption_key=os.getenv("ENCRYPTION_KEY", secrets.token_urlsafe(32)),
            password_hashing_rounds=int(os.getenv("PASSWORD_HASHING_ROUNDS", "12")),
            session_timeout=int(os.getenv("SESSION_TIMEOUT", "3600")),
            max_login_attempts=int(os.getenv("MAX_LOGIN_ATTEMPTS", "5")),
            lockout_duration=int(os.getenv("LOCKOUT_DURATION", "900")),
            require_2fa=os.getenv("REQUIRE_2FA", "true").lower() == "true",
            allowed_origins=self._parse_allowed_origins(),
        )

        # Monitoring configuration
        self.monitoring = MonitoringConfig(
            prometheus_enabled=os.getenv("PROMETHEUS_ENABLED", "true").lower() == "true",
            metrics_port=int(os.getenv("METRICS_PORT", "9090")),
            jaeger_endpoint=os.getenv("JAEGER_ENDPOINT"),
            sentry_dsn=os.getenv("SENTRY_DSN"),
            log_level=os.getenv("LOG_LEVEL", "INFO"),
            log_format=os.getenv("LOG_FORMAT", "json"),
            enable_tracing=os.getenv("ENABLE_TRACING", "true").lower() == "true",
            enable_profiling=os.getenv("ENABLE_PROFILING", "false").lower() == "true",
        )

        # ML configuration
        self.ml = MLConfig(
            model_path=os.getenv("ML_MODEL_PATH", "/app/models"),
            update_interval=int(os.getenv("MODEL_UPDATE_INTERVAL", "3600")),
            batch_size=int(os.getenv("ML_BATCH_SIZE", "1000")),
            max_workers=int(os.getenv("ML_MAX_WORKERS", "4")),
            enable_gpu=os.getenv("ML_ENABLE_GPU", "false").lower() == "true",
            model_cache_size=int(os.getenv("ML_MODEL_CACHE_SIZE", "1000")),
            prediction_timeout=int(os.getenv("ML_PREDICTION_TIMEOUT", "30")),
        )

        # Blockchain configuration
        self.blockchain = BlockchainConfig(
            networks=self._get_blockchain_networks(),
            rpc_timeout=int(os.getenv("RPC_TIMEOUT", "30")),
            max_retries=int(os.getenv("RPC_MAX_RETRIES", "3")),
            rate_limit=int(os.getenv("RPC_RATE_LIMIT", "1000")),
            enable_websocket=os.getenv("ENABLE_WEBSOCKET", "true").lower() == "true",
            connection_pool_size=int(os.getenv("CONNECTION_POOL_SIZE", "100")),
        )

        # Celery configuration
        self.celery = CeleryConfig(
            broker_url=os.getenv("CELERY_BROKER_URL", self.redis.url),
            result_backend=os.getenv("CELERY_RESULT_BACKEND", self.redis.url),
            task_serializer=os.getenv("CELERY_TASK_SERIALIZER", "json"),
            accept_content=self._parse_accept_content(),
            result_serializer=os.getenv("CELERY_RESULT_SERIALIZER", "json"),
            timezone=os.getenv("CELERY_TIMEZONE", "UTC"),
            enable_utc=os.getenv("CELERY_ENABLE_UTC", "true").lower() == "true",
            task_track_started=os.getenv("CELERY_TASK_TRACK_STARTED", "true").lower() == "true",
            task_time_limit=int(os.getenv("CELERY_TASK_TIME_LIMIT", "300")),
            task_soft_time_limit=int(os.getenv("CELERY_TASK_SOFT_TIME_LIMIT", "240")),
            worker_prefetch_multiplier=int(os.getenv("CELERY_WORKER_PREFETCH_MULTIPLIER", "1")),
            worker_max_tasks_per_child=int(os.getenv("CELERY_WORKER_MAX_TASKS_PER_CHILD", "1000")),
        )

        # Cache configuration
        self.cache = CacheConfig(
            default_timeout=int(os.getenv("CACHE_DEFAULT_TIMEOUT", "300")),
            key_prefix=os.getenv("CACHE_KEY_PREFIX", "bridge_security"),
            enable_compression=os.getenv("CACHE_ENABLE_COMPRESSION", "true").lower() == "true",
            compression_threshold=int(os.getenv("CACHE_COMPRESSION_THRESHOLD", "1024")),
            max_memory_policy=os.getenv("CACHE_MAX_MEMORY_POLICY", "allkeys-lru"),
        )

        # Rate limiting configuration
        self.rate_limit = RateLimitConfig(
            enabled=os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true",
            default_limit=os.getenv("RATE_LIMIT_DEFAULT", "1000/hour"),
            burst_limit=os.getenv("RATE_LIMIT_BURST", "100/minute"),
            window_size=int(os.getenv("RATE_LIMIT_WINDOW_SIZE", "60")),
            max_requests=int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "1000")),
        )

        # Application configuration
        self.app_name = "Cross-Chain Bridge Security Service"
        self.app_version = "1.0.0"
        self.host = os.getenv("HOST", "0.0.0.0")
        self.port = int(os.getenv("PORT", "8000"))
        self.workers = int(os.getenv("WORKERS", "4"))
        self.worker_class = os.getenv("WORKER_CLASS", "uvicorn.workers.UvicornWorker")
        self.max_requests = int(os.getenv("MAX_REQUESTS", "1000"))
        self.max_requests_jitter = int(os.getenv("MAX_REQUESTS_JITTER", "100"))
        self.timeout = int(os.getenv("TIMEOUT", "30"))
        self.keepalive = int(os.getenv("KEEPALIVE", "2"))

        # File paths
        self.data_dir = Path(os.getenv("DATA_DIR", "/app/data"))
        self.logs_dir = Path(os.getenv("LOGS_DIR", "/app/logs"))
        self.models_dir = Path(os.getenv("MODELS_DIR", "/app/models"))
        self.tmp_dir = Path(os.getenv("TMP_DIR", "/app/tmp"))

        # Create directories
        self._create_directories()

    def _parse_allowed_origins(self) -> list[str]:
        """Parse allowed origins from environment variable"""
        origins = os.getenv("ALLOWED_ORIGINS", "*")
        if origins == "*":
            return ["*"]
        return [origin.strip() for origin in origins.split(",")]

    def _parse_accept_content(self) -> list[str]:
        """Parse Celery accept content from environment variable"""
        content = os.getenv("CELERY_ACCEPT_CONTENT", "json")
        return [item.strip() for item in content.split(",")]

    def _get_blockchain_networks(self) -> dict[str, dict[str, Any]]:
        """Get blockchain network configurations"""
        return {
            "ethereum": {
                "rpc_urls": [
                    os.getenv("ETHEREUM_RPC_URL", "https://eth-mainnet.alchemyapi.io/v2/demo"),
                    os.getenv("ETHEREUM_RPC_URL_2", "https://mainnet.infura.io/v3/demo"),
                    os.getenv("ETHEREUM_RPC_URL_3", "https://rpc.ankr.com/eth"),
                ],
                "ws_urls": [
                    os.getenv("ETHEREUM_WS_URL", "wss://eth-mainnet.alchemyapi.io/v2/demo"),
                    os.getenv("ETHEREUM_WS_URL_2", "wss://mainnet.infura.io/ws/v3/demo"),
                ],
                "chain_id": 1,
                "block_time": 12.0,
                "supports_eip1559": True,
            },
            "polygon": {
                "rpc_urls": [
                    os.getenv("POLYGON_RPC_URL", "https://polygon-rpc.com"),
                    os.getenv("POLYGON_RPC_URL_2", "https://rpc-mainnet.maticvigil.com"),
                    os.getenv("POLYGON_RPC_URL_3", "https://rpc.ankr.com/polygon"),
                ],
                "ws_urls": [
                    os.getenv("POLYGON_WS_URL", "wss://polygon-rpc.com/ws"),
                    os.getenv("POLYGON_WS_URL_2", "wss://rpc-mainnet.maticvigil.com/ws"),
                ],
                "chain_id": 137,
                "block_time": 2.0,
                "supports_eip1559": True,
            },
            "bsc": {
                "rpc_urls": [
                    os.getenv("BSC_RPC_URL", "https://bsc-dataseed.binance.org"),
                    os.getenv("BSC_RPC_URL_2", "https://bsc-dataseed1.defibit.io"),
                    os.getenv("BSC_RPC_URL_3", "https://rpc.ankr.com/bsc"),
                ],
                "ws_urls": [os.getenv("BSC_WS_URL", "wss://bsc-ws-node.nariox.org:443/ws")],
                "chain_id": 56,
                "block_time": 3.0,
                "supports_eip1559": False,
            },
            "avalanche": {
                "rpc_urls": [
                    os.getenv("AVALANCHE_RPC_URL", "https://api.avax.network/ext/bc/C/rpc"),
                    os.getenv("AVALANCHE_RPC_URL_2", "https://rpc.ankr.com/avalanche"),
                    os.getenv("AVALANCHE_RPC_URL_3", "https://avalanche-mainnet.infura.io/v3/demo"),
                ],
                "ws_urls": [os.getenv("AVALANCHE_WS_URL", "wss://api.avax.network/ext/bc/C/ws")],
                "chain_id": 43114,
                "block_time": 2.0,
                "supports_eip1559": True,
            },
            "arbitrum": {
                "rpc_urls": [
                    os.getenv("ARBITRUM_RPC_URL", "https://arb1.arbitrum.io/rpc"),
                    os.getenv("ARBITRUM_RPC_URL_2", "https://rpc.ankr.com/arbitrum"),
                    os.getenv("ARBITRUM_RPC_URL_3", "https://arbitrum-mainnet.infura.io/v3/demo"),
                ],
                "ws_urls": [os.getenv("ARBITRUM_WS_URL", "wss://arb1.arbitrum.io/ws")],
                "chain_id": 42161,
                "block_time": 0.25,
                "supports_eip1559": True,
            },
            "optimism": {
                "rpc_urls": [
                    os.getenv("OPTIMISM_RPC_URL", "https://mainnet.optimism.io"),
                    os.getenv("OPTIMISM_RPC_URL_2", "https://rpc.ankr.com/optimism"),
                    os.getenv("OPTIMISM_RPC_URL_3", "https://optimism-mainnet.infura.io/v3/demo"),
                ],
                "ws_urls": [os.getenv("OPTIMISM_WS_URL", "wss://mainnet.optimism.io/ws")],
                "chain_id": 10,
                "block_time": 2.0,
                "supports_eip1559": True,
            },
            "fantom": {
                "rpc_urls": [
                    os.getenv("FANTOM_RPC_URL", "https://rpc.ftm.tools"),
                    os.getenv("FANTOM_RPC_URL_2", "https://rpc.ankr.com/fantom"),
                    os.getenv("FANTOM_RPC_URL_3", "https://fantom-mainnet.infura.io/v3/demo"),
                ],
                "ws_urls": [os.getenv("FANTOM_WS_URL", "wss://rpc.ftm.tools/ws")],
                "chain_id": 250,
                "block_time": 1.0,
                "supports_eip1559": False,
            },
            "base": {
                "rpc_urls": [
                    os.getenv("BASE_RPC_URL", "https://mainnet.base.org"),
                    os.getenv("BASE_RPC_URL_2", "https://base-mainnet.infura.io/v3/demo"),
                    os.getenv("BASE_RPC_URL_3", "https://rpc.ankr.com/base"),
                ],
                "ws_urls": [os.getenv("BASE_WS_URL", "wss://mainnet.base.org/ws")],
                "chain_id": 8453,
                "block_time": 2.0,
                "supports_eip1559": True,
            },
        }

    def _create_directories(self):
        """Create necessary directories"""
        for directory in [self.data_dir, self.logs_dir, self.models_dir, self.tmp_dir]:
            directory.mkdir(parents=True, exist_ok=True)

    def get_database_url(self) -> str:
        """Get database URL"""
        return self.database.url

    def get_redis_url(self) -> str:
        """Get Redis URL"""
        return self.redis.url

    def get_celery_config(self) -> dict[str, Any]:
        """Get Celery configuration"""
        return {
            "broker_url": self.celery.broker_url,
            "result_backend": self.celery.result_backend,
            "task_serializer": self.celery.task_serializer,
            "accept_content": self.celery.accept_content,
            "result_serializer": self.celery.result_serializer,
            "timezone": self.celery.timezone,
            "enable_utc": self.celery.enable_utc,
            "task_track_started": self.celery.task_track_started,
            "task_time_limit": self.celery.task_time_limit,
            "task_soft_time_limit": self.celery.task_soft_time_limit,
            "worker_prefetch_multiplier": self.celery.worker_prefetch_multiplier,
            "worker_max_tasks_per_child": self.celery.worker_max_tasks_per_child,
        }

    def get_gunicorn_config(self) -> dict[str, Any]:
        """Get Gunicorn configuration"""
        return {
            "bind": f"{self.host}:{self.port}",
            "workers": self.workers,
            "worker_class": self.worker_class,
            "max_requests": self.max_requests,
            "max_requests_jitter": self.max_requests_jitter,
            "timeout": self.timeout,
            "keepalive": self.keepalive,
            "preload_app": True,
            "accesslog": "-",
            "errorlog": "-",
            "loglevel": self.monitoring.log_level.lower(),
        }

    def is_production(self) -> bool:
        """Check if running in production"""
        return self.environment == "production"

    def is_development(self) -> bool:
        """Check if running in development"""
        return self.environment == "development"

    def is_testing(self) -> bool:
        """Check if running in testing"""
        return self.environment == "testing"


# Global configuration instance
config = ProductionConfig()
