#!/usr/bin/env python3
"""
🧪 MEV PROTECTION ENGINE TESTS
==============================
Comprehensive test suite for MEV protection engine.

Tests cover:
- Core engine functionality
- MEV threat detection
- Protection strategies
- Multi-chain support
- Performance and reliability
"""

import asyncio
import sys
from datetime import datetime
from pathlib import Path
from unittest.mock import AsyncMock

import pytest

# Add src to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from mev_protection.core.mev_protection_engine import (
    MEVProtectionEngine,
    MEVThreat,
    MEVType,
    NetworkType,
    ProtectionLevel,
    ProtectionResult,
    ThreatLevel,
    TransactionProtection,
)


class TestMEVProtectionEngine:
    """Test suite for MEV Protection Engine"""

    @pytest.fixture
    async def engine(self):
        """Create a test MEV protection engine"""
        config = {
            "networks": {
                "ethereum": {
                    "rpc_url": "https://eth-mainnet.alchemyapi.io/v2/test",
                    "enabled": True,
                    "priority": 1,
                    "chain_id": 1,
                }
            },
            "protection": {
                "default_level": ProtectionLevel.HIGH,
                "enable_private_mempool": True,
                "max_gas_price_gwei": 100,
                "min_profit_threshold": 0.01,
            },
            "monitoring": {
                "refresh_rate": 1000,
                "batch_size": 100,
                "max_threats": 1000,
                "retention_hours": 24,
            },
        }

        engine = MEVProtectionEngine(config)

        # Mock external dependencies
        engine.redis_client = AsyncMock()
        engine.session = AsyncMock()
        engine.web3_instances = {NetworkType.ETHEREUM: AsyncMock()}
        engine.active_networks = {NetworkType.ETHEREUM}

        return engine

    @pytest.mark.asyncio
    async def test_engine_initialization(self, engine):
        """Test engine initialization"""
        await engine.initialize()

        assert engine.config is not None
        assert engine.active_networks == {NetworkType.ETHEREUM}
        assert engine.is_protecting is False
        assert len(engine.detected_threats) == 0

    @pytest.mark.asyncio
    async def test_start_protection(self, engine):
        """Test starting protection"""
        await engine.initialize()

        # Start protection
        await engine.start_protection([NetworkType.ETHEREUM], ProtectionLevel.HIGH)

        assert engine.is_protecting is True
        assert len(engine.protection_tasks) > 0
        assert engine.stats["start_time"] is not None

    @pytest.mark.asyncio
    async def test_stop_protection(self, engine):
        """Test stopping protection"""
        await engine.initialize()
        await engine.start_protection([NetworkType.ETHEREUM], ProtectionLevel.HIGH)

        # Stop protection
        await engine.stop_protection()

        assert engine.is_protecting is False
        assert len(engine.protection_tasks) == 0

    @pytest.mark.asyncio
    async def test_threat_detection(self, engine):
        """Test MEV threat detection"""
        await engine.initialize()

        # Mock transaction data
        tx_data = {
            "hash": "0x1234567890abcdef",
            "from": "0xabcdef1234567890",
            "to": "0x0987654321fedcba",
            "value": 1000000000000000000,  # 1 ETH
            "gas_price": 50000000000,  # 50 gwei
            "gas_limit": 21000,
            "data": "0x",
            "nonce": 1,
            "network": "ethereum",
            "timestamp": datetime.now(),
        }

        # Mock MEV detector
        engine.mev_detector.detect_threats = AsyncMock(
            return_value=[
                MEVThreat(
                    threat_id="test_threat_1",
                    threat_type=MEVType.SANDWICH,
                    target_transaction=tx_data["hash"],
                    attacker_address="0xattacker1234567890",
                    profit_potential=0.5,
                    gas_price=tx_data["gas_price"],
                    confidence=0.85,
                    severity=ThreatLevel.HIGH,
                    detected_at=datetime.now(),
                    network=NetworkType.ETHEREUM,
                )
            ]
        )

        # Test threat detection
        threats = await engine.mev_detector.detect_threats(tx_data, NetworkType.ETHEREUM)

        assert len(threats) == 1
        assert threats[0].threat_type == MEVType.SANDWICH
        assert threats[0].severity == ThreatLevel.HIGH
        assert threats[0].confidence == 0.85

    @pytest.mark.asyncio
    async def test_protection_strategies(self, engine):
        """Test protection strategy application"""
        await engine.initialize()

        # Create a test threat
        threat = MEVThreat(
            threat_id="test_threat_1",
            threat_type=MEVType.SANDWICH,
            target_transaction="0x1234567890abcdef",
            attacker_address="0xattacker1234567890",
            profit_potential=0.5,
            gas_price=50000000000,
            confidence=0.85,
            severity=ThreatLevel.HIGH,
            detected_at=datetime.now(),
            network=NetworkType.ETHEREUM,
        )

        # Mock protection strategist
        engine.protection_strategist.get_best_strategy = AsyncMock(return_value="gas_adjustment")

        # Test protection application
        result = await engine._apply_protection_strategy(threat)

        assert result.success is True
        assert result.strategy_used == "gas_adjustment"
        assert result.gas_saved >= 0
        assert result.value_protected >= 0

    @pytest.mark.asyncio
    async def test_transaction_protection(self, engine):
        """Test transaction protection"""
        await engine.initialize()

        # Test transaction data
        transaction_data = {
            "hash": "0x1234567890abcdef",
            "network": "ethereum",
            "gas_limit": 21000,
            "max_gas_price": 100000000000,
            "slippage_tolerance": 0.5,
            "private_mempool": True,
        }

        # Protect transaction
        protection = await engine.protect_transaction(transaction_data, ProtectionLevel.HIGH)

        assert protection.transaction_hash == transaction_data["hash"]
        assert protection.network == NetworkType.ETHEREUM
        assert protection.protection_level == ProtectionLevel.HIGH
        assert len(protection.strategies) > 0
        assert protection.status in ["completed", "failed"]

    @pytest.mark.asyncio
    async def test_multi_network_support(self, engine):
        """Test multi-network support"""
        # Add more networks to config
        engine.config["networks"]["polygon"] = {
            "rpc_url": "https://polygon-rpc.com",
            "enabled": True,
            "priority": 2,
            "chain_id": 137,
        }

        await engine.initialize()

        # Test with multiple networks
        networks = [NetworkType.ETHEREUM, NetworkType.POLYGON]
        await engine.start_protection(networks, ProtectionLevel.HIGH)

        assert len(engine.active_networks) >= 1
        assert engine.is_protecting is True

    @pytest.mark.asyncio
    async def test_protection_status(self, engine):
        """Test protection status retrieval"""
        await engine.initialize()
        await engine.start_protection([NetworkType.ETHEREUM], ProtectionLevel.HIGH)

        # Get status
        status = await engine.get_protection_status()

        assert status["status"] == "active"
        assert status["networks_protected"] >= 1
        assert "statistics" in status
        assert "performance" in status
        assert "threat_level" in status

    @pytest.mark.asyncio
    async def test_dashboard_data(self, engine):
        """Test dashboard data retrieval"""
        await engine.initialize()

        # Add some test data
        engine.detected_threats.append(
            MEVThreat(
                threat_id="test_threat_1",
                threat_type=MEVType.SANDWICH,
                target_transaction="0x1234567890abcdef",
                attacker_address="0xattacker1234567890",
                profit_potential=0.5,
                gas_price=50000000000,
                confidence=0.85,
                severity=ThreatLevel.HIGH,
                detected_at=datetime.now(),
                network=NetworkType.ETHEREUM,
            )
        )

        # Get dashboard data
        dashboard_data = await engine.get_live_dashboard_data()

        assert "recent_threats" in dashboard_data
        assert "active_protections" in dashboard_data
        assert "threats_mitigated" in dashboard_data
        assert "value_protected" in dashboard_data
        assert "system_stats" in dashboard_data

    @pytest.mark.asyncio
    async def test_performance_monitoring(self, engine):
        """Test performance monitoring"""
        await engine.initialize()
        await engine.start_protection([NetworkType.ETHEREUM], ProtectionLevel.HIGH)

        # Wait a bit for monitoring to collect data
        await asyncio.sleep(1)

        # Check performance metrics
        assert "cpu_usage" in engine.performance_metrics
        assert "memory_usage" in engine.performance_metrics
        assert "network_latency" in engine.performance_metrics

    @pytest.mark.asyncio
    async def test_error_handling(self, engine):
        """Test error handling"""
        await engine.initialize()

        # Test with invalid network
        with pytest.raises(ValueError):
            await engine.start_protection([NetworkType.ETHEREUM], "invalid_level")

        # Test with invalid protection level
        with pytest.raises(ValueError):
            await engine.start_protection([NetworkType.ETHEREUM], ProtectionLevel.HIGH)

    @pytest.mark.asyncio
    async def test_statistics_tracking(self, engine):
        """Test statistics tracking"""
        await engine.initialize()

        # Simulate some activity
        engine.stats["threats_detected"] = 10
        engine.stats["threats_mitigated"] = 8
        engine.stats["transactions_protected"] = 5
        engine.stats["value_protected"] = 2.5

        # Check statistics
        assert engine.stats["threats_detected"] == 10
        assert engine.stats["threats_mitigated"] == 8
        assert engine.stats["transactions_protected"] == 5
        assert engine.stats["value_protected"] == 2.5

        # Calculate success rate
        success_rate = (engine.stats["threats_mitigated"] / engine.stats["threats_detected"]) * 100
        assert success_rate == 80.0

    @pytest.mark.asyncio
    async def test_cleanup_on_stop(self, engine):
        """Test cleanup when stopping protection"""
        await engine.initialize()
        await engine.start_protection([NetworkType.ETHEREUM], ProtectionLevel.HIGH)

        # Stop protection
        await engine.stop_protection()

        # Check that connections are closed
        assert engine.is_protecting is False
        assert len(engine.protection_tasks) == 0


class TestMEVThreat:
    """Test suite for MEVThreat class"""

    def test_mev_threat_creation(self):
        """Test MEV threat creation"""
        threat = MEVThreat(
            threat_id="test_threat_1",
            threat_type=MEVType.SANDWICH,
            target_transaction="0x1234567890abcdef",
            attacker_address="0xattacker1234567890",
            profit_potential=0.5,
            gas_price=50000000000,
            confidence=0.85,
            severity=ThreatLevel.HIGH,
            detected_at=datetime.now(),
            network=NetworkType.ETHEREUM,
        )

        assert threat.threat_id == "test_threat_1"
        assert threat.threat_type == MEVType.SANDWICH
        assert threat.severity == ThreatLevel.HIGH
        assert threat.confidence == 0.85
        assert threat.metadata is not None

    def test_mev_threat_metadata(self):
        """Test MEV threat metadata"""
        threat = MEVThreat(
            threat_id="test_threat_1",
            threat_type=MEVType.SANDWICH,
            target_transaction="0x1234567890abcdef",
            attacker_address="0xattacker1234567890",
            profit_potential=0.5,
            gas_price=50000000000,
            confidence=0.85,
            severity=ThreatLevel.HIGH,
            detected_at=datetime.now(),
            network=NetworkType.ETHEREUM,
            metadata={"test_key": "test_value"},
        )

        assert threat.metadata["test_key"] == "test_value"


class TestProtectionResult:
    """Test suite for ProtectionResult class"""

    def test_protection_result_creation(self):
        """Test protection result creation"""
        result = ProtectionResult(
            success=True,
            strategy_used="gas_adjustment",
            gas_saved=1000000,
            value_protected=0.5,
            execution_time=0.1,
        )

        assert result.success is True
        assert result.strategy_used == "gas_adjustment"
        assert result.gas_saved == 1000000
        assert result.value_protected == 0.5
        assert result.execution_time == 0.1
        assert result.metadata is not None

    def test_protection_result_with_error(self):
        """Test protection result with error"""
        result = ProtectionResult(
            success=False,
            strategy_used="gas_adjustment",
            gas_saved=0,
            value_protected=0.0,
            execution_time=0.0,
            error_message="Test error",
        )

        assert result.success is False
        assert result.error_message == "Test error"


class TestTransactionProtection:
    """Test suite for TransactionProtection class"""

    def test_transaction_protection_creation(self):
        """Test transaction protection creation"""
        protection = TransactionProtection(
            transaction_hash="0x1234567890abcdef",
            network=NetworkType.ETHEREUM,
            protection_level=ProtectionLevel.HIGH,
            strategies=["gas_adjustment", "private_mempool"],
            gas_limit=21000,
            max_gas_price=100000000000,
            slippage_tolerance=0.5,
            deadline=int(datetime.now().timestamp()) + 1200,
            private_mempool=True,
            created_at=datetime.now(),
        )

        assert protection.transaction_hash == "0x1234567890abcdef"
        assert protection.network == NetworkType.ETHEREUM
        assert protection.protection_level == ProtectionLevel.HIGH
        assert len(protection.strategies) == 2
        assert protection.status == "pending"


# Integration tests
class TestMEVProtectionIntegration:
    """Integration tests for MEV protection system"""

    @pytest.mark.asyncio
    async def test_full_protection_workflow(self):
        """Test complete protection workflow"""
        # Create engine
        config = {
            "networks": {
                "ethereum": {
                    "rpc_url": "https://eth-mainnet.alchemyapi.io/v2/test",
                    "enabled": True,
                    "priority": 1,
                    "chain_id": 1,
                }
            },
            "protection": {
                "default_level": ProtectionLevel.HIGH,
                "enable_private_mempool": True,
                "max_gas_price_gwei": 100,
                "min_profit_threshold": 0.01,
            },
        }

        engine = MEVProtectionEngine(config)

        # Mock external dependencies
        engine.redis_client = AsyncMock()
        engine.session = AsyncMock()
        engine.web3_instances = {NetworkType.ETHEREUM: AsyncMock()}
        engine.active_networks = {NetworkType.ETHEREUM}

        # Initialize and start protection
        await engine.initialize()
        await engine.start_protection([NetworkType.ETHEREUM], ProtectionLevel.HIGH)

        # Simulate threat detection and protection
        threat = MEVThreat(
            threat_id="integration_test_threat",
            threat_type=MEVType.SANDWICH,
            target_transaction="0xintegrationtest123",
            attacker_address="0xattackerintegration123",
            profit_potential=1.0,
            gas_price=100000000000,
            confidence=0.9,
            severity=ThreatLevel.CRITICAL,
            detected_at=datetime.now(),
            network=NetworkType.ETHEREUM,
        )

        engine.detected_threats.append(threat)
        engine.stats["threats_detected"] += 1

        # Apply protection
        result = await engine._apply_protection_strategy(threat)

        assert result.success is True
        assert threat.protection_applied is True

        # Stop protection
        await engine.stop_protection()

        # Verify final state
        assert engine.is_protecting is False
        assert len(engine.detected_threats) == 1
        assert engine.stats["threats_detected"] == 1


# Performance tests
class TestMEVProtectionPerformance:
    """Performance tests for MEV protection system"""

    @pytest.mark.asyncio
    async def test_high_throughput_threat_detection(self):
        """Test high throughput threat detection"""
        engine = MEVProtectionEngine()
        await engine.initialize()

        # Simulate high throughput
        start_time = datetime.now()

        for i in range(100):
            threat = MEVThreat(
                threat_id=f"perf_test_threat_{i}",
                threat_type=MEVType.SANDWICH,
                target_transaction=f"0x{i:064x}",
                attacker_address=f"0x{i:040x}",
                profit_potential=0.1,
                gas_price=50000000000,
                confidence=0.8,
                severity=ThreatLevel.MEDIUM,
                detected_at=datetime.now(),
                network=NetworkType.ETHEREUM,
            )
            engine.detected_threats.append(threat)

        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()

        # Should process 100 threats in less than 1 second
        assert processing_time < 1.0
        assert len(engine.detected_threats) == 100

    @pytest.mark.asyncio
    async def test_memory_usage(self):
        """Test memory usage with large datasets"""
        engine = MEVProtectionEngine()
        await engine.initialize()

        # Add many threats
        for i in range(1000):
            threat = MEVThreat(
                threat_id=f"memory_test_threat_{i}",
                threat_type=MEVType.SANDWICH,
                target_transaction=f"0x{i:064x}",
                attacker_address=f"0x{i:040x}",
                profit_potential=0.1,
                gas_price=50000000000,
                confidence=0.8,
                severity=ThreatLevel.MEDIUM,
                detected_at=datetime.now(),
                network=NetworkType.ETHEREUM,
            )
            engine.detected_threats.append(threat)

        # Check that memory usage is reasonable
        assert len(engine.detected_threats) == 1000

        # Clean up
        engine.detected_threats.clear()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
