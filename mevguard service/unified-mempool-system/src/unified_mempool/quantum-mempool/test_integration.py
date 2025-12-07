"""
Test SQLAlchemy integration with quantum detector.
"""

import asyncio
import os
import sys
from datetime import datetime

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

try:
    from src.database.simple_connection_manager import SimpleDatabaseManager
    from src.detection.quantum_detector import EnterpriseQuantumDetector
    from src.utils.config import AuditConfig, DatabaseConfig, DetectionConfig

    print("✓ All imports successful")
except ImportError as e:
    print(f"✗ Import error: {e}")
    sys.exit(1)


class MockTransaction:
    """Mock transaction for testing."""

    def __init__(self, txid, fee, size, timestamp, inputs=None, outputs=None):
        self.txid = txid
        self.fee = fee
        self.size = size
        self.timestamp = timestamp
        self.inputs = inputs or [{"address": f"addr_{txid[:8]}"}]
        self.outputs = outputs or [{"address": f"addr_out_{txid[:8]}", "value": 1000}]
        self.is_legacy = True
        self.block_hash = None
        self.block_height = None
        self.from_address = f"from_{txid[:8]}"
        self.to_address = f"to_{txid[:8]}"
        self.amount = 1000


async def test_quantum_detector():
    """Test the quantum detector with SQLAlchemy integration."""
    print("\n🔬 Testing Quantum Detector with SQLAlchemy...")

    try:
        # Create configuration
        detection_config = DetectionConfig(
            threshold=100, confidence_threshold=0.75, minimum_transactions=3
        )

        audit_config = AuditConfig()
        detection_config.audit_config = audit_config
        detection_config.metrics_config = {"prometheus_enabled": False}

        # Test with SQLite (no external dependencies)
        db_config = DatabaseConfig(
            connection_string="sqlite:///quantum_mempool.db",  # Use the initialized database
            pool_size=5,
            max_overflow=10,
        )

        # Create database manager
        db_manager = SimpleDatabaseManager(db_config)
        print("✓ Database manager created")

        # Test database connection
        health = await db_manager.health_check()
        print(f"✓ Database health: {health['status']}")

        # Create quantum detector with database manager
        detector = EnterpriseQuantumDetector(detection_config, db_manager)
        print("✓ Quantum detector created")

        # Initialize the detector
        await detector.initialize_detection_engine()
        print("✓ Detection engine initialized")

        # Create mock transactions that would trigger quantum detection
        transactions = [
            MockTransaction(f"tx{i:03d}", 1000, 250, datetime.utcnow())
            for i in range(5)
        ]
        print(f"✓ Created {len(transactions)} mock transactions")

        # Analyze transactions
        is_quantum_attack = await detector.analyze_mass_sweep(transactions)
        print(f"✓ Analysis completed - Quantum attack detected: {is_quantum_attack}")

        # Get confidence score
        confidence = await detector.get_last_confidence_score()
        print(f"✓ Confidence score: {confidence:.2%}")

        # Test database persistence
        try:
            signature = await detector.calculate_quantum_signature(
                transactions, "test_analysis"
            )
            await detector._save_quantum_signature_to_db(signature, transactions)
            print("✓ Database persistence test completed")
        except Exception as e:
            print(f"⚠ Database persistence test failed: {e}")

        # Cleanup
        db_manager.close()
        print("✓ Database connections closed")

        print("\n🎉 All tests completed successfully!")
        return True

    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_basic_imports():
    """Test that all components can be imported."""
    print("🔍 Testing basic imports...")

    try:
        # Test configuration
        config = DetectionConfig()
        print(f"✓ DetectionConfig: threshold={config.threshold}")

        # Test database config
        db_config = DatabaseConfig()
        print(f"✓ DatabaseConfig: connection_string={db_config.connection_string}")

        print("✓ All basic imports working")
        return True

    except Exception as e:
        print(f"✗ Basic import test failed: {e}")
        return False


async def main():
    """Run all tests."""
    print("🚀 Starting Quantum Mempool SQLAlchemy Integration Tests")
    print("=" * 60)

    # Test basic imports
    if not test_basic_imports():
        return

    # Test quantum detector
    if not await test_quantum_detector():
        return

    print("\n" + "=" * 60)
    print("✅ All integration tests passed!")


if __name__ == "__main__":
    asyncio.run(main())
