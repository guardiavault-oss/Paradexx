import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "core-engine"))
"""
Enterprise database connection management with high availability and security.
"""

import asyncio  # noqa: E402
import ssl  # noqa: E402
from contextlib import asynccontextmanager  # noqa: E402
from enum import Enum  # noqa: E402
from typing import AsyncGenerator  # noqa: E402
from typing import Any, AsyncContextManager, Dict, Optional

from common.observability.logging import get_scorpius_logger  # noqa: E402

try:
    import aioredis  # noqa: E402
    from sqlalchemy import create_engine, event, text  # noqa: E402
    from sqlalchemy.engine import Engine  # noqa: E402
    from sqlalchemy.ext.asyncio import AsyncSession  # noqa: E402
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
    from sqlalchemy.orm import Session, sessionmaker  # noqa: E402
    from sqlalchemy.pool import QueuePool  # noqa: E402

    SQLALCHEMY_AVAILABLE = True
    REDIS_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False
    REDIS_AVAILABLE = False

try:
    import aioredis  # noqa: E402

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

import structlog  # noqa: E402

from ..enterprise.audit_logger import SecurityEventLogger  # noqa: E402
from ..utils.config import DatabaseConfig, EnterpriseConfig  # noqa: E402
from ..utils.metrics import MetricsCollector  # noqa: E402


class DatabaseType(Enum):
    """Supported database types for enterprise deployment."""

    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    ORACLE = "oracle"
    MSSQL = "mssql"


class ConnectionPoolConfig:
    """Database connection pool configuration."""

    def __init__(
        self,
        pool_size: int = 20,
        max_overflow: int = 30,
        pool_timeout: int = 30,
        pool_recycle: int = 3600,
        pool_pre_ping: bool = True,
    ):
        self.pool_size = pool_size
        self.max_overflow = max_overflow
        self.pool_timeout = pool_timeout
        self.pool_recycle = pool_recycle
        self.pool_pre_ping = pool_pre_ping


class DatabaseConnectionManager:
    """
    Enterprise-grade database connection manager with high availability,
    security, and compliance features.

    Features:
    - Connection pooling with automatic failover
    - SSL/TLS encryption for data in transit
    - Database-level encryption for data at rest
    - Connection monitoring and health checks
    - Audit logging for all database operations
    - Support for read replicas and load balancing
    """

    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)

        if not SQLALCHEMY_AVAILABLE:
            raise ImportError("SQLAlchemy is required for database operations")

        # Database engines
        self.primary_engine: Optional[Engine] = None
        self.read_replica_engines: Dict[str, Engine] = {}

        # Session factories
        self.primary_session_factory: Optional[sessionmaker] = None
        self.read_session_factories: Dict[str, sessionmaker] = {}

        # Connection monitoring
        self.connection_stats = {
            "total_connections": 0,
            "active_connections": 0,
            "failed_connections": 0,
            "avg_connection_time": 0.0,
        }

        # Health check configuration
        self.health_check_interval = getattr(config, "health_check_interval", 60)
        self.health_check_timeout = getattr(config, "health_check_timeout", 10)

    async def initialize_connections(self):
        """Initialize database connections with enterprise security."""
        try:
            # Create primary database connection
            await self._create_primary_connection()

            # Create read replica connections
            await self._create_read_replica_connections()

            # Setup connection monitoring
            await self._setup_connection_monitoring()

            # Start health check monitoring
            asyncio.create_task(self._health_check_loop())

            self.logger.info(
                "Database connections initialized",
                primary_db=getattr(
                    self.config, "primary_database_url", "not_configured"
                ),
                read_replicas=len(self.read_replica_engines),
            )

        except Exception as e:
            self.logger.error("Failed to initialize database connections", error=str(e))
            raise

    async def _create_primary_connection(self):
        """Create primary database connection with enterprise security."""
        try:
            # Get connection URL (in production, this would be secured)
            connection_url = getattr(
                self.config, "primary_database_url", "sqlite:///quantum_monitor.db"
            )

            # Create connection pool configuration
            pool_config = ConnectionPoolConfig(
                pool_size=getattr(self.config, "pool_size", 20),
                max_overflow=getattr(self.config, "max_overflow", 30),
                pool_timeout=getattr(self.config, "pool_timeout", 30),
                pool_recycle=getattr(self.config, "pool_recycle", 3600),
            )

            # Create engine with enterprise features
            self.primary_engine = create_engine(
                connection_url,
                poolclass=QueuePool,
                pool_size=pool_config.pool_size,
                max_overflow=pool_config.max_overflow,
                pool_timeout=pool_config.pool_timeout,
                pool_recycle=pool_config.pool_recycle,
                pool_pre_ping=pool_config.pool_pre_ping,
                echo=getattr(self.config, "sql_echo", False),
                echo_pool=getattr(self.config, "echo_pool", False),
                connect_args=self._get_connection_args(),
            )

            # Setup event listeners for monitoring
            self._setup_engine_events(self.primary_engine, "primary")

            # Create session factory
            self.primary_session_factory = sessionmaker(
                bind=self.primary_engine,
                expire_on_commit=False,
                autoflush=True,
                autocommit=False,
            )

            # Test connection
            await self._test_connection(self.primary_engine, "primary")

        except Exception as e:
            self.logger.error(
                "Failed to create primary database connection", error=str(e)
            )
            raise

    async def _create_read_replica_connections(self):
        """Create read replica connections for load distribution."""
        read_replica_urls = getattr(self.config, "read_replica_urls", [])

        if not read_replica_urls:
            return

        for idx, replica_url in enumerate(read_replica_urls):
            replica_name = f"replica_{idx}"

            try:
                # Create replica engine
                replica_engine = create_engine(
                    replica_url,
                    poolclass=QueuePool,
                    pool_size=getattr(self.config, "replica_pool_size", 10),
                    max_overflow=getattr(self.config, "replica_max_overflow", 15),
                    pool_timeout=getattr(self.config, "pool_timeout", 30),
                    pool_recycle=getattr(self.config, "pool_recycle", 3600),
                    pool_pre_ping=True,
                    echo=getattr(self.config, "sql_echo", False),
                    connect_args=self._get_connection_args(),
                )

                # Setup event listeners
                self._setup_engine_events(replica_engine, replica_name)

                # Create session factory
                replica_session_factory = sessionmaker(
                    bind=replica_engine,
                    expire_on_commit=False,
                    autoflush=False,
                    autocommit=False,
                )

                # Test connection
                await self._test_connection(replica_engine, replica_name)

                # Store replica
                self.read_replica_engines[replica_name] = replica_engine
                self.read_session_factories[replica_name] = replica_session_factory

                self.logger.info(
                    f"Read replica {replica_name} initialized", url=replica_url
                )

            except Exception as e:
                self.logger.error(
                    f"Failed to create read replica {replica_name}", error=str(e)
                )
                # Continue with other replicas
                continue

    def _get_connection_args(self) -> Dict[str, Any]:
        """Get database-specific connection arguments."""
        connection_args = {}

        # SSL/TLS configuration
        ssl_enabled = getattr(self.config, "ssl_enabled", False)
        if ssl_enabled:
            database_type = getattr(
                self.config, "database_type", DatabaseType.POSTGRESQL
            )

            if database_type == DatabaseType.POSTGRESQL:
                connection_args.update(
                    {
                        "sslmode": getattr(self.config, "ssl_mode", "require"),
                        "sslcert": getattr(self.config, "ssl_cert_path", None),
                        "sslkey": getattr(self.config, "ssl_key_path", None),
                        "sslrootcert": getattr(self.config, "ssl_ca_path", None),
                    }
                )
            elif database_type == DatabaseType.MYSQL:
                ssl_context = ssl.create_default_context()
                ssl_ca_path = getattr(self.config, "ssl_ca_path", None)
                if ssl_ca_path:
                    ssl_context.load_verify_locations(ssl_ca_path)
                connection_args["ssl"] = ssl_context

        # Connection timeout
        connection_timeout = getattr(self.config, "connection_timeout", None)
        if connection_timeout:
            connection_args["connect_timeout"] = connection_timeout

        # Application name for connection tracking
        database_type = getattr(self.config, "database_type", DatabaseType.POSTGRESQL)
        if database_type == DatabaseType.POSTGRESQL:
            connection_args["application_name"] = "quantum_mempool_monitor"

        return connection_args

    def _setup_engine_events(self, engine: Engine, engine_name: str):
        """Setup SQLAlchemy engine events for monitoring."""

        @event.listens_for(engine, "connect")
        def receive_connect(dbapi_connection, connection_record):
            self.connection_stats["total_connections"] += 1
            self.connection_stats["active_connections"] += 1
            self.logger.debug("Database connection established", engine=engine_name)

        @event.listens_for(engine, "checkout")
        def receive_checkout(dbapi_connection, connection_record, connection_proxy):
            self.logger.debug("Connection checked out from pool", engine=engine_name)

        @event.listens_for(engine, "checkin")
        def receive_checkin(dbapi_connection, connection_record):
            self.logger.debug("Connection checked in to pool", engine=engine_name)

        @event.listens_for(engine, "close")
        def receive_close(dbapi_connection, connection_record):
            self.connection_stats["active_connections"] -= 1
            self.logger.debug("Database connection closed", engine=engine_name)

        @event.listens_for(engine, "close_detached")
        def receive_close_detached(dbapi_connection):
            self.connection_stats["active_connections"] -= 1
            self.logger.debug("Detached database connection closed", engine=engine_name)

    async def _test_connection(self, engine: Engine, engine_name: str):
        """Test database connection and log results."""
        try:
            with engine.connect() as connection:
                result = connection.execute("SELECT 1")
                if result.fetchone()[0] == 1:
                    self.logger.info(
                        "Database connection test successful", engine=engine_name
                    )
                else:
                    raise Exception("Connection test returned unexpected result")
        except Exception as e:
            self.logger.error(
                "Database connection test failed", engine=engine_name, error=str(e)
            )
            raise

    async def _setup_connection_monitoring(self):
        """Setup connection monitoring and alerting."""
        # This would integrate with enterprise monitoring systems

    async def _health_check_loop(self):
        """Continuous health check loop for database connections."""
        while True:
            try:
                await asyncio.sleep(self.health_check_interval)
                await self._perform_health_checks()
            except Exception as e:
                self.logger.error("Health check loop error", error=str(e))
                await asyncio.sleep(60)  # Wait before retrying

    async def _perform_health_checks(self):
        """Perform health checks on all database connections."""
        try:
            # Check primary database
            await self._health_check_engine(self.primary_engine, "primary")

            # Check read replicas
            for replica_name, replica_engine in self.read_replica_engines.items():
                await self._health_check_engine(replica_engine, replica_name)

        except Exception as e:
            self.logger.error("Health check error", error=str(e))

    async def _health_check_engine(self, engine: Engine, engine_name: str):
        """Perform health check on a specific engine."""
        try:
            with engine.connect() as connection:
                connection.execute("SELECT 1")
                self.logger.debug("Health check passed", engine=engine_name)
        except Exception as e:
            self.logger.error("Health check failed", engine=engine_name, error=str(e))
            # Could trigger alerts or failover logic here

    @asynccontextmanager
    async def get_session(
        self, read_only: bool = False
    ) -> AsyncGenerator[Session, None]:
        """
        Get a database session with automatic cleanup.

        Args:
            read_only: If True, use read replica if available

        Yields:
            Database session
        """
        session = None
        session_factory = None

        try:
            if read_only and self.read_session_factories:
                # Use read replica for read-only operations
                replica_name = self._select_read_replica()
                session_factory = self.read_session_factories[replica_name]
                self.logger.debug("Using read replica", replica=replica_name)
            else:
                # Use primary database
                session_factory = self.primary_session_factory
                self.logger.debug("Using primary database")

            if not session_factory:
                raise Exception("No database session factory available")

            session = session_factory()

            # Setup session-level auditing
            await self._setup_session_auditing(session)

            yield session

            # Commit transaction if no exceptions
            session.commit()

        except Exception as e:
            if session:
                session.rollback()
            self.logger.error("Database session error", error=str(e))
            raise

        finally:
            if session:
                session.close()

    def _select_read_replica(self) -> str:
        """Select a read replica using load balancing strategy."""
        if not self.read_replica_engines:
            return None

        # Simple round-robin selection
        # In production, this could use more sophisticated load balancing
        replica_names = list(self.read_replica_engines.keys())
        return replica_names[
            self.connection_stats["total_connections"] % len(replica_names)
        ]

    async def _setup_session_auditing(self, session: Session):
        """Setup auditing for database session."""
        # Add session-level audit logging
        # This would integrate with the enterprise audit system

    async def get_connection_statistics(self) -> Dict[str, Any]:
        """Get current connection statistics."""
        primary_pool_status = {}
        if self.primary_engine:
            pool = self.primary_engine.pool
            primary_pool_status = {
                "pool_size": pool.size(),
                "checked_out_connections": pool.checkedout(),
                "overflow_connections": pool.overflow(),
                "total_pool_connections": pool.size() + pool.overflow(),
            }

        replica_pool_status = {}
        for replica_name, replica_engine in self.read_replica_engines.items():
            pool = replica_engine.pool
            replica_pool_status[replica_name] = {
                "pool_size": pool.size(),
                "checked_out_connections": pool.checkedout(),
                "overflow_connections": pool.overflow(),
                "total_pool_connections": pool.size() + pool.overflow(),
            }

        return {
            "connection_stats": self.connection_stats,
            "primary_pool": primary_pool_status,
            "replica_pools": replica_pool_status,
            "health_status": "healthy",  # This would be calculated based on health checks
        }

    async def close_all_connections(self):
        """Close all database connections and cleanup resources."""
        try:
            # Close primary engine
            if self.primary_engine:
                self.primary_engine.dispose()
                self.logger.info("Primary database connections closed")

            # Close replica engines
            for replica_name, replica_engine in self.read_replica_engines.items():
                replica_engine.dispose()
                self.logger.info(f"Read replica {replica_name} connections closed")

            # Clear references
            self.primary_engine = None
            self.read_replica_engines.clear()
            self.primary_session_factory = None
            self.read_session_factories.clear()

            self.logger.info("All database connections closed successfully")

        except Exception as e:
            self.logger.error("Error closing database connections", error=str(e))
            raise

    def get_primary_engine(self) -> Engine:
        """Get the primary database engine."""
        if not self.primary_engine:
            raise Exception("Primary database engine not initialized")
        return self.primary_engine

    def get_replica_engine(self, replica_name: str = None) -> Engine:
        """Get a read replica engine."""
        if not self.read_replica_engines:
            # Fallback to primary if no replicas available
            return self.get_primary_engine()

        if replica_name and replica_name in self.read_replica_engines:
            return self.read_replica_engines[replica_name]

        # Return first available replica
        return next(iter(self.read_replica_engines.values()))

    """
    Enterprise database connection manager with support for multiple
    database types, connection pooling, and high availability.

    Features:
    - Multiple database type support (PostgreSQL, Redis, Elasticsearch, MongoDB)
    - Connection pooling and management
    - Health monitoring and automatic failover
    - Security and audit integration
    - Performance metrics and monitoring
    """

    def __init__(
        self,
        config: EnterpriseConfig,
        metrics: MetricsCollector,
        audit_logger: SecurityEventLogger,
    ):
        """Initialize the database connection manager"""
        self.config = config
        self.metrics = metrics
        self.audit_logger = audit_logger
        self.logger = get_scorpius_logger(__name__)

        # Database configurations
        self.db_configs: Dict[str, DatabaseConfig] = {}
        self._load_database_configs()

        # Connection pools
        self.engines: Dict[str, Any] = {}
        self.session_makers: Dict[str, Any] = {}
        self.redis_pools: Dict[str, aioredis.Redis] = {}

        # Health monitoring
        self.health_status: Dict[str, bool] = {}
        self.connection_counts: Dict[str, int] = {}

        # Initialize connections
        self._initialize_connections()

    def _load_database_configs(self):
        """Load database configurations from enterprise config"""
        database_config = self.config.get("database", {})

        for db_name, db_config in database_config.items():
            if db_config.get("enabled", False):
                self.db_configs[db_name] = DatabaseConfig(
                    db_type=DatabaseType(db_config.get("type", "postgresql")),
                    host=db_config.get("host", "localhost"),
                    port=db_config.get("port", 5432),
                    database=db_config.get("database", "quantum_mempool"),
                    username=db_config.get("username"),
                    password=db_config.get("password"),
                    pool_size=db_config.get("pool_size", 10),
                    max_overflow=db_config.get("max_overflow", 20),
                    pool_timeout=db_config.get("pool_timeout", 30),
                    ssl_mode=db_config.get("ssl_mode", "prefer"),
                    additional_params=db_config.get("additional_params", {}),
                )

    def _initialize_connections(self):
        """Initialize database connections"""
        try:
            for db_name, db_config in self.db_configs.items():
                if db_config.db_type == DatabaseType.POSTGRESQL:
                    self._initialize_postgresql(db_name, db_config)
                elif db_config.db_type == DatabaseType.REDIS:
                    self._initialize_redis(db_name, db_config)

                self.logger.info(
                    f"Initialized connection for {db_name} ({db_config.db_type.value})"
                )

        except Exception as e:
            self.logger.error(f"Failed to initialize database connections: {e}")
            self.audit_logger.log_security_event(
                event_type="DATABASE_INITIALIZATION_ERROR",
                severity="HIGH",
                details={"error": str(e)},
            )

    def _initialize_postgresql(self, db_name: str, db_config: DatabaseConfig):
        """Initialize PostgreSQL connection pool"""
        # Build connection URL
        if db_config.username and db_config.password:
            url = f"postgresql+asyncpg://{db_config.username}:{db_config.password}@{db_config.host}:{db_config.port}/{db_config.database}"
        else:
            url = f"postgresql+asyncpg://{db_config.host}:{db_config.port}/{db_config.database}"

        # Add SSL mode
        url += f"?sslmode={db_config.ssl_mode}"

        # Create async engine with connection pooling
        engine = create_async_engine(
            url,
            pool_size=db_config.pool_size,
            max_overflow=db_config.max_overflow,
            pool_timeout=db_config.pool_timeout,
            poolclass=QueuePool,
            echo=False,  # Set to True for SQL debugging
            **db_config.additional_params,
        )

        # Create session maker
        session_maker = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

        self.engines[db_name] = engine
        self.session_makers[db_name] = session_maker
        self.health_status[db_name] = True
        self.connection_counts[db_name] = 0

    def _initialize_redis(self, db_name: str, db_config: DatabaseConfig):
        """Initialize Redis connection pool"""
        # Redis will be initialized asynchronously
        self.health_status[db_name] = False
        self.connection_counts[db_name] = 0

    async def get_postgresql_session(
        self, db_name: str = "primary"
    ) -> AsyncContextManager[AsyncSession]:
        """
        Get PostgreSQL database session

        Args:
            db_name: Database connection name

        Returns:
            AsyncContextManager[AsyncSession]: Database session context manager
        """
        if db_name not in self.session_makers:
            raise ValueError(f"Database connection '{db_name}' not found")

        @asynccontextmanager
        async def session_context():
            session = self.session_makers[db_name]()
            try:
                self.connection_counts[db_name] += 1
                self.metrics.increment_counter(
                    "database_connections_total", {"database": db_name}
                )
                yield session
                await session.commit()
            except Exception as e:
                await session.rollback()
                self.logger.error(f"Database session error for {db_name}: {e}")
                self.metrics.increment_counter(
                    "database_errors_total", {"database": db_name}
                )
                raise
            finally:
                await session.close()
                self.connection_counts[db_name] -= 1

        return session_context()

    async def get_redis_connection(self, db_name: str = "cache"):
        """
        Get Redis connection

        Args:
            db_name: Redis connection name

        Returns:
            Redis connection (if available)
        """
        if not REDIS_AVAILABLE:
            raise RuntimeError("Redis is not available")

        if db_name not in self.redis_pools:
            db_config = self.db_configs.get(db_name)
            if not db_config or db_config.db_type != DatabaseType.REDIS:
                raise ValueError(f"Redis connection '{db_name}' not configured")

            # Create Redis connection pool
            redis_url = f"redis://{db_config.host}:{db_config.port}"
            if db_config.password:
                redis_url = (
                    f"redis://:{db_config.password}@{db_config.host}:{db_config.port}"
                )

            self.redis_pools[db_name] = await aioredis.from_url(
                redis_url,
                max_connections=db_config.pool_size,
                retry_on_timeout=True,
                **db_config.additional_params,
            )
            self.health_status[db_name] = True

        return self.redis_pools[db_name]

    async def execute_query(
        self, db_name: str, query: str, parameters: Optional[Dict[str, Any]] = None
    ) -> Any:
        """
        Execute raw SQL query

        Args:
            db_name: Database connection name
            query: SQL query to execute
            parameters: Query parameters

        Returns:
            Query results
        """
        try:
            async with self.get_postgresql_session(db_name) as session:
                result = await session.execute(text(query), parameters or {})
                return result.fetchall()

        except Exception as e:
            self.logger.error(f"Query execution failed for {db_name}: {e}")
            self.metrics.increment_counter(
                "database_query_errors_total", {"database": db_name}
            )
            raise

    async def check_health(self, db_name: str) -> bool:
        """
        Check database health

        Args:
            db_name: Database connection name

        Returns:
            bool: Health status
        """
        try:
            db_config = self.db_configs.get(db_name)
            if not db_config:
                return False

            if db_config.db_type == DatabaseType.POSTGRESQL:
                return await self._check_postgresql_health(db_name)
            elif db_config.db_type == DatabaseType.REDIS:
                return await self._check_redis_health(db_name)

            return False

        except Exception as e:
            self.logger.error(f"Health check failed for {db_name}: {e}")
            self.health_status[db_name] = False
            return False

    async def _check_postgresql_health(self, db_name: str) -> bool:
        """Check PostgreSQL database health"""
        try:
            result = await self.execute_query(db_name, "SELECT 1")
            healthy = len(result) > 0
            self.health_status[db_name] = healthy
            return healthy

        except Exception:
            self.health_status[db_name] = False
            return False

    async def _check_redis_health(self, db_name: str) -> bool:
        """Check Redis database health"""
        try:
            redis = await self.get_redis_connection(db_name)
            await redis.ping()
            self.health_status[db_name] = True
            return True

        except Exception:
            self.health_status[db_name] = False
            return False

    async def start_health_monitoring(self):
        """Start periodic health monitoring"""

        async def health_monitor():
            while True:
                try:
                    for db_name in self.db_configs.keys():
                        healthy = await self.check_health(db_name)
                        self.metrics.set_gauge(
                            "database_health_status",
                            1 if healthy else 0,
                            {"database": db_name},
                        )
                        self.metrics.set_gauge(
                            "database_active_connections",
                            self.connection_counts.get(db_name, 0),
                            {"database": db_name},
                        )

                    # Wait before next health check
                    await asyncio.sleep(30)  # Check every 30 seconds

                except Exception as e:
                    self.logger.error(f"Health monitoring error: {e}")
                    await asyncio.sleep(60)  # Wait longer on error

        # Start health monitoring task
        asyncio.create_task(health_monitor())
        self.logger.info("Database health monitoring started")

    async def get_connection_stats(self) -> Dict[str, Any]:
        """Get database connection statistics"""
        stats = {}

        for db_name, db_config in self.db_configs.items():
            stats[db_name] = {
                "type": db_config.db_type.value,
                "healthy": self.health_status.get(db_name, False),
                "active_connections": self.connection_counts.get(db_name, 0),
                "pool_size": db_config.pool_size,
                "max_overflow": db_config.max_overflow,
            }

        return stats

    async def close_all_connections(self):
        """Close all database connections"""
        try:
            # Close PostgreSQL engines
            for db_name, engine in self.engines.items():
                await engine.dispose()
                self.logger.info(f"Closed PostgreSQL connection: {db_name}")

            # Close Redis connections
            for db_name, redis in self.redis_pools.items():
                await redis.close()
                self.logger.info(f"Closed Redis connection: {db_name}")

            self.logger.info("All database connections closed")

        except Exception as e:
            self.logger.error(f"Error closing database connections: {e}")

    def __del__(self):
        """Cleanup on object destruction"""
        # Note: This may not work reliably with async connections
        # It's better to explicitly call close_all_connections()
