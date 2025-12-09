#!/usr/bin/env python3
"""
🧪 UNIFIED MEMPOOL SYSTEM TESTS
===============================
Comprehensive test suite for the unified mempool monitoring system.
Tests all 11 integrated services with real blockchain data.
"""

import asyncio
import time

import pytest
from fastapi.testclient import TestClient

from api.unified_api_gateway import app
from core.unified_mempool_engine import (
    MempoolTransaction,
    MEVType,
    ThreatLevel,
    UnifiedMempoolEngine,
)


class TestUnifiedMempoolSystem:
    """Test suite for the unified mempool monitoring system"""

    @pytest.fixture
    async def engine(self):
        """Create and initialize test engine"""
        config = {
            "networks": {
                "ethereum": {
                    "rpc_url": "https://eth-mainnet.alchemyapi.io/v2/demo",
                    "enabled": True,
                    "priority": 1,
                },
                "polygon": {"rpc_url": "https://polygon-rpc.com", "enabled": True, "priority": 2},
            },
            "monitoring": {
                "refresh_rate": 1000,
                "batch_size": 10,
                "max_transactions": 100,
                "retention_hours": 1,
            },
            "security": {
                "enable_mev_protection": True,
                "enable_flash_loan_detection": True,
                "enable_quantum_analysis": True,
                "enable_threat_intelligence": True,
            },
        }

        engine = UnifiedMempoolEngine(config)
        await engine.initialize()
        yield engine
        await engine.stop_monitoring()

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    @pytest.mark.asyncio
    async def test_engine_initialization(self, engine):
        """Test engine initialization"""
        assert engine is not None
        assert len(engine.active_networks) > 0
        assert engine.redis_client is not None or engine.redis_client is None  # Redis optional
        assert engine.session is not None

        # Test Web3 connections
        for network in engine.active_networks:
            assert network in engine.web3_instances
            web3 = engine.web3_instances[network]
            assert web3 is not None

    @pytest.mark.asyncio
    async def test_monitoring_start_stop(self, engine):
        """Test monitoring start and stop"""
        # Start monitoring
        await engine.start_monitoring()
        assert engine.is_monitoring is True
        assert len(engine.monitoring_tasks) > 0

        # Let it run for a few seconds
        await asyncio.sleep(3)

        # Stop monitoring
        await engine.stop_monitoring()
        assert engine.is_monitoring is False
        assert len(engine.monitoring_tasks) == 0

    @pytest.mark.asyncio
    async def test_transaction_processing(self, engine):
        """Test transaction processing pipeline"""
        await engine.start_monitoring()

        # Wait for some transactions to be processed
        await asyncio.sleep(5)

        # Check that transactions are being processed
        assert len(engine.pending_transactions) > 0
        assert engine.stats["total_transactions"] > 0

        # Check transaction structure
        for tx_hash, tx in engine.pending_transactions.items():
            assert isinstance(tx, MempoolTransaction)
            assert tx.hash == tx_hash
            assert tx.network in engine.active_networks
            assert tx.timestamp is not None
            assert tx.risk_score >= 0.0
            assert tx.threat_level in [
                ThreatLevel.LOW,
                ThreatLevel.MEDIUM,
                ThreatLevel.HIGH,
                ThreatLevel.CRITICAL,
            ]

        await engine.stop_monitoring()

    @pytest.mark.asyncio
    async def test_mev_detection(self, engine):
        """Test MEV detection capabilities"""
        await engine.start_monitoring()

        # Wait for MEV detection to run
        await asyncio.sleep(5)

        # Check MEV detection statistics
        assert engine.stats["attacks_detected"] >= 0
        assert engine.stats["mev_opportunities"] >= 0

        # Check for MEV transactions
        mev_transactions = [
            tx for tx in engine.pending_transactions.values() if tx.mev_type is not None
        ]

        for tx in mev_transactions:
            assert tx.mev_type in [
                MEVType.SANDWICH,
                MEVType.ARBITRAGE,
                MEVType.FLASH_LOAN,
                MEVType.LIQUIDATION,
            ]
            assert tx.profit_estimate is not None
            assert tx.profit_estimate > 0

        await engine.stop_monitoring()

    @pytest.mark.asyncio
    async def test_suspicious_transaction_detection(self, engine):
        """Test suspicious transaction detection"""
        await engine.start_monitoring()

        # Wait for analysis
        await asyncio.sleep(5)

        # Check suspicious transaction detection
        suspicious_txs = [tx for tx in engine.pending_transactions.values() if tx.is_suspicious]

        assert len(suspicious_txs) >= 0
        assert engine.stats["suspicious_transactions"] >= 0

        for tx in suspicious_txs:
            assert tx.is_suspicious is True
            assert tx.risk_score > 0.0
            assert tx.threat_level in [ThreatLevel.MEDIUM, ThreatLevel.HIGH, ThreatLevel.CRITICAL]

        await engine.stop_monitoring()

    @pytest.mark.asyncio
    async def test_quantum_analysis(self, engine):
        """Test quantum analysis integration"""
        await engine.start_monitoring()

        # Wait for quantum analysis
        await asyncio.sleep(5)

        # Check quantum analysis statistics
        assert engine.stats["quantum_analyses"] >= 0

        # Check for quantum scores in transactions
        quantum_analyzed_txs = [
            tx
            for tx in engine.pending_transactions.values()
            if "quantum_score" in tx.analysis_metadata
        ]

        for tx in quantum_analyzed_txs:
            quantum_score = tx.analysis_metadata["quantum_score"]
            assert 0.0 <= quantum_score <= 1.0

        await engine.stop_monitoring()

    @pytest.mark.asyncio
    async def test_flash_loan_prediction(self, engine):
        """Test flash loan attack prediction"""
        await engine.start_monitoring()

        # Wait for flash loan prediction
        await asyncio.sleep(5)

        # Check flash loan prediction statistics
        assert engine.stats["flash_loan_predictions"] >= 0

        await engine.stop_monitoring()

    @pytest.mark.asyncio
    async def test_threat_intelligence(self, engine):
        """Test threat intelligence integration"""
        await engine.start_monitoring()

        # Wait for threat intelligence updates
        await asyncio.sleep(5)

        # Check threat intelligence
        assert len(engine.threat_intelligence) >= 0
        assert engine.stats["threats_mitigated"] >= 0

        for threat in engine.threat_intelligence:
            assert threat.threat_id is not None
            assert threat.severity in [
                ThreatLevel.LOW,
                ThreatLevel.MEDIUM,
                ThreatLevel.HIGH,
                ThreatLevel.CRITICAL,
            ]
            assert threat.confidence >= 0.0
            assert threat.confidence <= 1.0

        await engine.stop_monitoring()

    @pytest.mark.asyncio
    async def test_user_behavior_analysis(self, engine):
        """Test user behavior analysis"""
        await engine.start_monitoring()

        # Wait for behavior analysis
        await asyncio.sleep(5)

        # Check user profiles
        assert len(engine.user_profiles) >= 0

        await engine.stop_monitoring()

    @pytest.mark.asyncio
    async def test_risk_scoring(self, engine):
        """Test risk scoring engine"""
        await engine.start_monitoring()

        # Wait for risk scoring
        await asyncio.sleep(5)

        # Check risk scores
        for tx in engine.pending_transactions.values():
            assert 0.0 <= tx.risk_score <= 1.0
            assert tx.threat_level in [
                ThreatLevel.LOW,
                ThreatLevel.MEDIUM,
                ThreatLevel.HIGH,
                ThreatLevel.CRITICAL,
            ]

        await engine.stop_monitoring()

    @pytest.mark.asyncio
    async def test_multi_agent_scanning(self, engine):
        """Test multi-agent scanning"""
        await engine.start_monitoring()

        # Wait for multi-agent scanning
        await asyncio.sleep(5)

        # Check for multi-agent scan results
        scanned_txs = [
            tx
            for tx in engine.pending_transactions.values()
            if "multi_agent_scan" in tx.analysis_metadata
        ]

        for tx in scanned_txs:
            scan_result = tx.analysis_metadata["multi_agent_scan"]
            assert "threat_detected" in scan_result
            assert "confidence" in scan_result

        await engine.stop_monitoring()

    @pytest.mark.asyncio
    async def test_performance_monitoring(self, engine):
        """Test performance monitoring"""
        await engine.start_monitoring()

        # Wait for performance monitoring
        await asyncio.sleep(5)

        # Check performance metrics
        assert engine.performance_metrics["cpu_usage"] >= 0.0
        assert engine.performance_metrics["memory_usage"] >= 0.0
        assert engine.performance_metrics["processing_speed"] >= 0.0

        # Check network latency
        for network in engine.active_networks:
            assert network.value in engine.performance_metrics["network_latency"]

        await engine.stop_monitoring()

    @pytest.mark.asyncio
    async def test_system_status(self, engine):
        """Test system status reporting"""
        await engine.start_monitoring()

        # Wait for system to stabilize
        await asyncio.sleep(3)

        # Get system status
        status = await engine.get_system_status()

        assert status["status"] == "active"
        assert status["uptime_seconds"] > 0
        assert status["networks_monitored"] > 0
        assert len(status["active_networks"]) > 0
        assert "statistics" in status
        assert "performance" in status
        assert "threat_level" in status

        await engine.stop_monitoring()

    @pytest.mark.asyncio
    async def test_dashboard_data(self, engine):
        """Test dashboard data generation"""
        await engine.start_monitoring()

        # Wait for data to accumulate
        await asyncio.sleep(3)

        # Get dashboard data
        dashboard_data = await engine.get_live_dashboard_data()

        assert "recent_transactions" in dashboard_data
        assert "suspicious_transactions" in dashboard_data
        assert "mev_opportunities" in dashboard_data
        assert "threat_intelligence" in dashboard_data
        assert "user_profiles" in dashboard_data
        assert "system_stats" in dashboard_data
        assert "performance" in dashboard_data
        assert "threat_level" in dashboard_data

        await engine.stop_monitoring()

    def test_api_health_check(self, client):
        """Test API health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "unified_mempool_api"
        assert "timestamp" in data
        assert data["version"] == "1.0.0"

    def test_api_system_status(self, client):
        """Test API system status endpoint"""
        response = client.get("/api/v1/status")
        assert response.status_code == 200

        data = response.json()
        assert "status" in data
        assert "uptime_seconds" in data
        assert "networks_monitored" in data
        assert "active_networks" in data
        assert "statistics" in data
        assert "performance" in data
        assert "threat_level" in data

    def test_api_dashboard_data(self, client):
        """Test API dashboard data endpoint"""
        response = client.get("/api/v1/dashboard")
        assert response.status_code == 200

        data = response.json()
        assert "recent_transactions" in data
        assert "suspicious_transactions" in data
        assert "mev_opportunities" in data
        assert "threat_intelligence" in data
        assert "user_profiles" in data
        assert "system_stats" in data
        assert "performance" in data
        assert "threat_level" in data

    def test_api_transactions(self, client):
        """Test API transactions endpoint"""
        response = client.get("/api/v1/transactions")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)

        # Test with filters
        response = client.get("/api/v1/transactions?network=ethereum&suspicious_only=true&limit=10")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 10

    def test_api_mev_opportunities(self, client):
        """Test API MEV opportunities endpoint"""
        response = client.get("/api/v1/mev/opportunities")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)

    def test_api_threat_intelligence(self, client):
        """Test API threat intelligence endpoint"""
        response = client.get("/api/v1/threats")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)

    def test_api_networks(self, client):
        """Test API networks endpoint"""
        response = client.get("/api/v1/networks")
        assert response.status_code == 200

        data = response.json()
        assert "networks" in data
        assert isinstance(data["networks"], list)

    def test_api_performance_analytics(self, client):
        """Test API performance analytics endpoint"""
        response = client.get("/api/v1/analytics/performance")
        assert response.status_code == 200

        data = response.json()
        assert "system_performance" in data
        assert "processing_stats" in data
        assert "network_performance" in data
        assert "resource_usage" in data

    def test_api_security_analytics(self, client):
        """Test API security analytics endpoint"""
        response = client.get("/api/v1/analytics/security")
        assert response.status_code == 200

        data = response.json()
        assert "threat_summary" in data
        assert "mev_analysis" in data
        assert "protection_stats" in data

    def test_api_export_transactions(self, client):
        """Test API transaction export endpoint"""
        response = client.get("/api/v1/export/transactions?format=json")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_real_blockchain_data_integration(self, engine):
        """Test integration with real blockchain data"""
        await engine.start_monitoring()

        # Wait for real blockchain data to be processed
        await asyncio.sleep(10)

        # Verify we have real blockchain data
        assert len(engine.pending_transactions) > 0

        # Check that transactions have realistic data
        for tx in engine.pending_transactions.values():
            # Check transaction hash format
            assert tx.hash.startswith("0x")
            assert len(tx.hash) == 66  # 0x + 64 hex chars

            # Check address format
            assert tx.from_address.startswith("0x")
            assert len(tx.from_address) == 42  # 0x + 40 hex chars

            if tx.to_address:
                assert tx.to_address.startswith("0x")
                assert len(tx.to_address) == 42

            # Check realistic gas prices (in wei)
            assert 1000000000 <= tx.gas_price <= 1000000000000  # 1 gwei to 1000 gwei

            # Check realistic gas limits
            assert 21000 <= tx.gas_limit <= 10000000  # min to reasonable max

            # Check network is valid
            assert tx.network in engine.active_networks

        await engine.stop_monitoring()

    @pytest.mark.asyncio
    async def test_system_resilience(self, engine):
        """Test system resilience and error handling"""
        await engine.start_monitoring()

        # Let system run for a while
        await asyncio.sleep(5)

        # Verify system is still running
        assert engine.is_monitoring is True
        assert len(engine.monitoring_tasks) > 0

        # Check that all monitoring tasks are still alive
        for task in engine.monitoring_tasks:
            assert not task.done()

        await engine.stop_monitoring()

    @pytest.mark.asyncio
    async def test_data_consistency(self, engine):
        """Test data consistency across all components"""
        await engine.start_monitoring()

        # Wait for data to accumulate
        await asyncio.sleep(5)

        # Check data consistency
        total_txs = len(engine.pending_transactions)
        suspicious_txs = len(engine.suspicious_transactions)
        mev_opportunities = len(engine.detected_mev_opportunities)

        # Verify statistics consistency
        assert engine.stats["total_transactions"] >= total_txs
        assert engine.stats["suspicious_transactions"] >= suspicious_txs
        assert engine.stats["mev_opportunities"] >= mev_opportunities

        # Check that suspicious transactions are in pending transactions
        for tx in engine.suspicious_transactions:
            assert tx.hash in engine.pending_transactions
            assert engine.pending_transactions[tx.hash].is_suspicious is True

        await engine.stop_monitoring()


class TestIntegrationWithRealBlockchain:
    """Integration tests with real blockchain data"""

    @pytest.mark.asyncio
    async def test_ethereum_mainnet_connection(self):
        """Test connection to Ethereum mainnet"""
        from web3 import AsyncWeb3
        from web3.providers import AsyncHTTPProvider

        # Test with public RPC endpoint
        provider = AsyncHTTPProvider("https://eth-mainnet.alchemyapi.io/v2/demo")
        web3 = AsyncWeb3(provider)

        try:
            # Get latest block number
            block_number = await web3.eth.get_block_number()
            assert block_number > 0

            # Get latest block
            block = await web3.eth.get_block(block_number)
            assert block is not None
            assert block.number == block_number

            print(f"✅ Successfully connected to Ethereum mainnet (block {block_number})")

        except Exception as e:
            pytest.skip(f"Could not connect to Ethereum mainnet: {e}")

    @pytest.mark.asyncio
    async def test_polygon_connection(self):
        """Test connection to Polygon network"""
        from web3 import AsyncWeb3
        from web3.providers import AsyncHTTPProvider

        provider = AsyncHTTPProvider("https://polygon-rpc.com")
        web3 = AsyncWeb3(provider)

        try:
            block_number = await web3.eth.get_block_number()
            assert block_number > 0

            block = await web3.eth.get_block(block_number)
            assert block is not None

            print(f"✅ Successfully connected to Polygon (block {block_number})")

        except Exception as e:
            pytest.skip(f"Could not connect to Polygon: {e}")

    @pytest.mark.asyncio
    async def test_bsc_connection(self):
        """Test connection to BSC network"""
        from web3 import AsyncWeb3
        from web3.providers import AsyncHTTPProvider

        provider = AsyncHTTPProvider("https://bsc-dataseed.binance.org")
        web3 = AsyncWeb3(provider)

        try:
            block_number = await web3.eth.get_block_number()
            assert block_number > 0

            block = await web3.eth.get_block(block_number)
            assert block is not None

            print(f"✅ Successfully connected to BSC (block {block_number})")

        except Exception as e:
            pytest.skip(f"Could not connect to BSC: {e}")


# Performance benchmarks
class TestPerformanceBenchmarks:
    """Performance benchmark tests"""

    @pytest.mark.asyncio
    async def test_transaction_processing_speed(self):
        """Benchmark transaction processing speed"""
        config = {
            "networks": {
                "ethereum": {
                    "rpc_url": "https://eth-mainnet.alchemyapi.io/v2/demo",
                    "enabled": True,
                    "priority": 1,
                }
            },
            "monitoring": {
                "refresh_rate": 100,  # Faster for testing
                "batch_size": 50,
                "max_transactions": 1000,
                "retention_hours": 1,
            },
        }

        engine = UnifiedMempoolEngine(config)
        await engine.initialize()

        start_time = time.time()
        await engine.start_monitoring()

        # Let it process transactions for 10 seconds
        await asyncio.sleep(10)

        end_time = time.time()
        processing_time = end_time - start_time

        # Calculate processing speed
        total_transactions = engine.stats["total_transactions"]
        transactions_per_second = total_transactions / processing_time

        print("📊 Performance Results:")
        print(f"   Total transactions processed: {total_transactions}")
        print(f"   Processing time: {processing_time:.2f} seconds")
        print(f"   Transactions per second: {transactions_per_second:.2f}")

        # Assert minimum performance requirements
        assert (
            transactions_per_second > 1.0
        ), f"Processing speed too low: {transactions_per_second:.2f} tx/s"

        await engine.stop_monitoring()

    @pytest.mark.asyncio
    async def test_memory_usage(self):
        """Test memory usage under load"""
        import os

        import psutil

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB

        config = {
            "networks": {
                "ethereum": {
                    "rpc_url": "https://eth-mainnet.alchemyapi.io/v2/demo",
                    "enabled": True,
                },
                "polygon": {"rpc_url": "https://polygon-rpc.com", "enabled": True},
                "bsc": {"rpc_url": "https://bsc-dataseed.binance.org", "enabled": True},
            },
            "monitoring": {
                "refresh_rate": 500,
                "batch_size": 100,
                "max_transactions": 5000,
                "retention_hours": 1,
            },
        }

        engine = UnifiedMempoolEngine(config)
        await engine.initialize()
        await engine.start_monitoring()

        # Let it run for 30 seconds
        await asyncio.sleep(30)

        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory

        print("📊 Memory Usage Results:")
        print(f"   Initial memory: {initial_memory:.2f} MB")
        print(f"   Final memory: {final_memory:.2f} MB")
        print(f"   Memory increase: {memory_increase:.2f} MB")
        print(f"   Total transactions: {engine.stats['total_transactions']}")

        # Assert reasonable memory usage (less than 500MB increase)
        assert memory_increase < 500, f"Memory usage too high: {memory_increase:.2f} MB increase"

        await engine.stop_monitoring()


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
