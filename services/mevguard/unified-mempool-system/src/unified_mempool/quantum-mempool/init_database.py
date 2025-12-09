#!/usr/bin/env python3
"""
Database initialization script for quantum mempool monitor.
"""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent / "src"))

from src.database.models import Base  # noqa: E402
from src.database.simple_connection_manager import SimpleDatabaseManager  # noqa: E402
from src.utils.config import DatabaseConfig  # noqa: E402


async def create_tables():
    """Create all database tables."""
    print("🏗️ Creating database tables...")

    # Create database config
    db_config = DatabaseConfig()
    # Use SQLite for development
    db_config.connection_string = "sqlite:///quantum_mempool.db"

    # Create database manager
    db_manager = SimpleDatabaseManager(db_config)

    try:
        # Create all tables directly
        Base.metadata.create_all(db_manager.engine)

        print("✅ Database tables created successfully!")
        print(f"📊 Database: {db_config.connection_string}")

        # List created tables
        tables = list(Base.metadata.tables.keys())
        print(f"📋 Created tables: {', '.join(tables)}")

        # Test connection
        async with db_manager.get_session() as session:
            print("✅ Database connection test successful!")

    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(create_tables())
