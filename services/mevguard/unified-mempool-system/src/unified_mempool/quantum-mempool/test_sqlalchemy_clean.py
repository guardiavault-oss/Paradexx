#!/usr/bin/env python3
"""
Test script for SQLAlchemy integration in the quantum mempool monitor.
"""

import asyncio
import sys
from datetime import datetime
from pathlib import Path

# Add src to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.database.connection_manager import DatabaseConnectionManager
from src.database.models import TransactionRecord
from src.detection.quantum_detector import EnterpriseQuantumDetector
from src.utils.config import DatabaseConfig, EnterpriseConfig


class MockTransaction:
    """Mock transaction for testing."""

    def __init__(self, txid: str, fee: float = 1000, size: int = 250):
        self.txid = txid
        self.fee = fee
        self.size = size
        self.timestamp = datetime.utcnow()
        self.is_legacy = True
        self.inputs = [{"address": f"1Address{txid[:8]}"}]
        self.outputs = [{"address": f"3Output{txid[:8]}"}]
        self.block_hash = None
        self.block_height = None
        self.from_address = f"1From{txid[:8]}"
        self.to_address = f"3To{txid[:8]}"
        self.amount = fee * 10
        self.gas_limit = None
        self.gas_price = None


async def test_database_connection():
    """Test database connection."""
    print("Testing database connection...")

    # Create test configuration
    config = EnterpriseConfig()
    config.database_config = DatabaseConfig(
        connection_string="sqlite:///test_quantum_mempool.db"  # Use SQLite for testing
    )

    # Initialize database manager
    db_manager = DatabaseConnectionManager(config.database_config)

    try:
        # Initialize database (create tables)
        await db_manager.initialize_database()
        print("✅ Database connection successful")

        # Test session
        async with db_manager.get_session() as session:
            print("✅ Database session created successfully")

        return db_manager

    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return None


async def test_quantum_detector_with_db():
    """Test quantum detector with database integration."""
    print("\nTesting quantum detector with database integration...")

    # Get database manager
    db_manager = await test_database_connection()
    if not db_manager:
        return False

    try:
        # Create configuration
        config = EnterpriseConfig()
        config.detection.confidence_threshold = 0.5  # Lower threshold for testing
        config.detection.minimum_transactions = 3

        # Initialize quantum detector with database
        detector = EnterpriseQuantumDetector(config.detection, db_manager)
        await detector.initialize_detection_engine()
        print("✅ Quantum detector initialized with database")

        # Create mock transactions that should trigger detection
        transactions = [
            MockTransaction(f"tx{i:04d}", fee=1000, size=250) for i in range(5)
        ]

        # Analyze transactions
        is_quantum_attack = await detector.analyze_mass_sweep(transactions)
        print(f"✅ Analysis completed. Quantum attack detected: {is_quantum_attack}")
        print(f"   Confidence score: {detector.last_confidence_score:.3f}")

        # Test database retrieval
        signatures = await detector.get_historical_signatures(limit=10)
        print(f"✅ Retrieved {len(signatures)} historical signatures")

        stats = await detector.get_threat_statistics()
        print(f"✅ Threat statistics: {stats}")

        return True

    except Exception as e:
        print(f"❌ Quantum detector test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def test_manual_database_operations():
    """Test manual database operations."""
    print("\nTesting manual database operations...")

    # Create test configuration
    config = EnterpriseConfig()
    config.database_config = DatabaseConfig(
        connection_string="sqlite:///test_quantum_mempool.db"
    )

    # Initialize database manager
    db_manager = DatabaseConnectionManager(config.database_config)

    try:
        await db_manager.initialize_database()

        # Test inserting a transaction record
        async with db_manager.get_session() as session:
            tx_record = TransactionRecord(
                txid="test_transaction_001",
                from_address="1TestFromAddress",
                to_address="3TestToAddress",
                amount=1.5,
                fee=0.001,
                status="confirmed",
                risk_score=0.3,
                compliance_tags=["test"],
                created_by="test_script",
            )

            session.add(tx_record)
            session.commit()
            print("✅ Transaction record inserted")

            # Query the transaction
            queried_tx = (
                session.query(TransactionRecord)
                .filter_by(txid="test_transaction_001")
                .first()
            )
            if queried_tx:
                print(
                    f"✅ Transaction queried: {queried_tx.txid}, amount: {queried_tx.amount}"
                )
            else:
                print("❌ Transaction not found")
                return False

        return True

    except Exception as e:
        print(f"❌ Manual database operations failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def main():
    """Main test function."""
    print("=" * 60)
    print("SQLAlchemy Integration Test for Quantum Mempool Monitor")
    print("=" * 60)

    # Test basic database connection
    db_success = await test_database_connection() is not None

    # Test manual database operations
    manual_success = await test_manual_database_operations()

    # Test quantum detector with database
    detector_success = await test_quantum_detector_with_db()

    print("\n" + "=" * 60)
    print("TEST RESULTS:")
    print(f"Database Connection: {'✅ PASS' if db_success else '❌ FAIL'}")
    print(f"Manual Operations:   {'✅ PASS' if manual_success else '❌ FAIL'}")
    print(f"Quantum Detector:    {'✅ PASS' if detector_success else '❌ FAIL'}")
    print("=" * 60)

    if all([db_success, manual_success, detector_success]):
        print("🎉 All tests passed! SQLAlchemy integration is working correctly.")
        return 0
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\nTest interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"Test failed with unexpected error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
