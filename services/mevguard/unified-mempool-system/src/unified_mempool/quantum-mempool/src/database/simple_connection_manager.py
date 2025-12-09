import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "core-engine"))
"""
Simplified database connection manager for quantum mempool monitoring.
"""

from contextlib import asynccontextmanager  # noqa: E402

from common.observability.logging import get_scorpius_logger  # noqa: E402

try:
    from sqlalchemy import create_engine, text  # noqa: E402
    from sqlalchemy.orm import Session, sessionmaker  # noqa: E402

    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False


from ..utils.config import DatabaseConfig  # noqa: E402


class SimpleDatabaseManager:
    """
    Simplified database connection manager for SQLAlchemy integration.

    Features:
    - Basic connection pooling
    - Session management
    - Error handling
    - Health checks
    """

    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.logger = get_scorpius_logger(__name__)
        self.engine = None
        self.session_factory = None

        if SQLALCHEMY_AVAILABLE:
            self._initialize_engine()

    def _initialize_engine(self):
        """Initialize SQLAlchemy engine with connection pooling."""
        try:
            # Create engine with connection pooling
            self.engine = create_engine(
                self.config.connection_string,
                pool_size=self.config.pool_size,
                max_overflow=self.config.max_overflow,
                pool_timeout=self.config.pool_timeout,
                pool_recycle=self.config.pool_recycle,
                pool_pre_ping=self.config.pool_pre_ping,
                echo=False,  # Set to True for SQL debugging
            )

            # Create session factory
            self.session_factory = sessionmaker(bind=self.engine)

            self.logger.info("Database engine initialized successfully")

        except Exception as e:
            self.logger.error(f"Failed to initialize database engine: {e}")
            raise

    @asynccontextmanager
    async def get_session(self):
        """
        Get database session with automatic cleanup.

        Usage:
            async with db_manager.get_session() as session:
                # Use session here
                session.add(record)
                session.commit()
        """
        if not SQLALCHEMY_AVAILABLE or not self.session_factory:
            raise RuntimeError("SQLAlchemy not available or not initialized")

        session = self.session_factory()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            self.logger.error(f"Database session error: {e}")
            raise
        finally:
            session.close()

    def get_sync_session(self) -> Session:
        """Get synchronous database session."""
        if not SQLALCHEMY_AVAILABLE or not self.session_factory:
            raise RuntimeError("SQLAlchemy not available or not initialized")

        return self.session_factory()

    async def test_connection(self) -> bool:
        """Test database connectivity."""
        if not SQLALCHEMY_AVAILABLE or not self.engine:
            return False

        try:
            async with self.get_session() as session:
                session.execute(text("SELECT 1"))

            self.logger.info("Database connection test successful")
            return True

        except Exception as e:
            self.logger.error(f"Database connection test failed: {e}")
            return False

    async def health_check(self) -> dict:
        """Perform database health check."""
        try:
            connection_ok = await self.test_connection()

            health_info = {
                "status": "healthy" if connection_ok else "unhealthy",
                "sqlalchemy_available": SQLALCHEMY_AVAILABLE,
                "engine_initialized": self.engine is not None,
                "connection_string": (
                    self.config.connection_string.split("@")[0] + "@***"
                    if "@" in self.config.connection_string
                    else "Not configured"
                ),
            }

            if self.engine:
                health_info.update(
                    {
                        "pool_size": self.engine.pool.size(),
                        "checked_in_connections": self.engine.pool.checkedin(),
                        "checked_out_connections": self.engine.pool.checkedout(),
                    }
                )

            return health_info

        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "sqlalchemy_available": SQLALCHEMY_AVAILABLE,
            }

    def close(self):
        """Close database connections."""
        if self.engine:
            self.engine.dispose()
            self.logger.info("Database connections closed")

    async def close_all_connections(self):
        """Close all database connections asynchronously."""
        self.close()


# Factory function for easy instantiation
def create_database_manager(config: DatabaseConfig) -> SimpleDatabaseManager:
    """Create and return a database manager instance."""
    return SimpleDatabaseManager(config)
