"""
Simple test to verify the quantum detector integration.
"""

import asyncio
import sys

sys.path.insert(0, "src")


async def main():
    print("🔬 Testing Quantum Detector Integration")

    try:
        from src.database.simple_connection_manager import SimpleDatabaseManager
        from src.detection.quantum_detector import EnterpriseQuantumDetector
        from src.utils.config import AuditConfig, DatabaseConfig, DetectionConfig

        print("✓ All imports successful")

        # Create database manager
        db_config = DatabaseConfig(connection_string="sqlite:///quantum_mempool.db")
        db_manager = SimpleDatabaseManager(db_config)
        print("✓ Database manager created")

        # Test database health
        health = await db_manager.health_check()
        print(f"✓ Database health: {health['status']}")

        # Create detection config
        detection_config = DetectionConfig(
            threshold=100, confidence_threshold=0.75, minimum_transactions=3
        )

        audit_config = AuditConfig()
        detection_config.audit_config = audit_config
        detection_config.metrics_config = {"prometheus_enabled": False}

        # Create quantum detector
        detector = EnterpriseQuantumDetector(detection_config, db_manager)
        print("✓ Quantum detector created")

        # Initialize
        await detector.initialize_detection_engine()
        print("✓ Detection engine initialized")

        # Test with mock transactions
        class MockTx:
            def __init__(self, txid):
                self.txid = txid
                self.fee = 1000
                self.size = 250
                self.timestamp = None
                self.inputs = [{"address": f"addr_{txid}"}]
                self.outputs = [{"address": f"out_{txid}"}]
                self.is_legacy = True
                self.block_hash = None
                self.block_height = None

        transactions = [MockTx(f"tx{i}") for i in range(5)]
        print(f"✓ Created {len(transactions)} mock transactions")

        # Run analysis
        result = await detector.analyze_mass_sweep(transactions)
        confidence = await detector.get_last_confidence_score()

        print("✅ Analysis complete!")
        print(f"   • Quantum attack detected: {result}")
        print(f"   • Confidence score: {confidence:.2%}")

        # Get statistics
        stats = await detector.get_threat_statistics()
        print(f"   • Statistics: {stats}")

        db_manager.close()
        print("✅ Test completed successfully!")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
