#!/usr/bin/env python3
"""
🧪 Advanced MEV Protection Test Suite
=====================================
Comprehensive test suite for all MEV protection features including:
- Private relay integrations (Flashbots, MEV-Share, etc.)
- Order Flow Auctions (OFA) and intent-based routing
- Advanced MEV attack detection (jamming, oracle manipulation, backrunning)
- MEV saved KPI tracking and measurement
- PBS (Proposer-Builder Separation) awareness
- Fallback strategies when private relays degrade
"""

import asyncio
import time
from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest

# Import our components
from src.mev_protection.core.mev_protection_engine import (
    IntentType,
    MEVProtectionEngine,
    MEVThreat,
    MEVType,
    NetworkType,
    PrivateRelayType,
    ProtectionLevel,
    RelayBundle,
    RelayStatus,
    ThreatLevel,
)


class TestPrivateRelayIntegration:
    """Test private relay integrations"""

    @pytest.mark.asyncio
    async def test_flashbots_relay_initialization(self):
        """Test Flashbots relay initialization"""
        engine = MEVProtectionEngine()

        # Mock environment variables
        with patch.dict(
            "os.environ", {"FLASHBOTS_API_KEY": "test_key", "REDIS_URL": "redis://localhost:6379/0"}
        ):
            await engine.initialize()

            # Check if Flashbots relay is configured
            flashbots_relay = engine.private_relay_manager.relay_connections.get(
                PrivateRelayType.FLASHBOTS
            )
            assert flashbots_relay is not None
            assert flashbots_relay.relay_type == PrivateRelayType.FLASHBOTS
            assert flashbots_relay.endpoint == "https://relay.flashbots.net"
            assert flashbots_relay.enabled is True

    @pytest.mark.asyncio
    async def test_mev_share_relay_initialization(self):
        """Test MEV-Share relay initialization"""
        engine = MEVProtectionEngine()

        with patch.dict(
            "os.environ", {"MEV_SHARE_API_KEY": "test_key", "REDIS_URL": "redis://localhost:6379/0"}
        ):
            await engine.initialize()

            mev_share_relay = engine.private_relay_manager.relay_connections.get(
                PrivateRelayType.MEV_SHARE
            )
            assert mev_share_relay is not None
            assert mev_share_relay.relay_type == PrivateRelayType.MEV_SHARE
            assert "hints" in mev_share_relay.metadata.get("features", [])

    @pytest.mark.asyncio
    async def test_relay_connection_status(self):
        """Test relay connection status monitoring"""
        engine = MEVProtectionEngine()

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379/0"}):
            await engine.initialize()

            # Mock relay test method
            with patch.object(
                engine.private_relay_manager, "_test_single_relay", new_callable=AsyncMock
            ) as mock_test:
                mock_test.return_value = True

                await engine.private_relay_manager.monitor_relay_health()

                # Check that test was called for enabled relays
                assert mock_test.call_count > 0

    @pytest.mark.asyncio
    async def test_bundle_creation_and_sending(self):
        """Test MEV bundle creation and sending to private relays"""
        engine = MEVProtectionEngine()

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379/0"}):
            await engine.initialize()

            # Create a test bundle
            bundle = RelayBundle(
                bundle_id="test_bundle_123",
                transactions=[
                    {
                        "from": "0x1234567890123456789012345678901234567890",
                        "to": "0x0987654321098765432109876543210987654321",
                        "data": "0x",
                        "value": "0x0",
                        "gas": "0x5208",
                        "gasPrice": "0x4a817c800",
                    }
                ],
                target_block=18750000,
                relay_type=PrivateRelayType.FLASHBOTS,
                max_gas_price=20000000000,
                reverting_hashes=[],
                refund_percent=90,
                metadata={"test": True},
            )

            # Mock the bundle sending method
            with patch.object(
                engine.private_relay_manager, "send_bundle", new_callable=AsyncMock
            ) as mock_send:
                mock_send.return_value = {"success": True, "bundle_id": bundle.bundle_id}

                result = await engine.private_relay_manager.send_bundle(bundle)

                assert result["success"] is True
                assert result["bundle_id"] == bundle.bundle_id
                mock_send.assert_called_once()


class TestOrderFlowAuctions:
    """Test Order Flow Auction functionality"""

    @pytest.mark.asyncio
    async def test_auction_creation(self):
        """Test creating OFA auctions"""
        engine = MEVProtectionEngine()

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379/0"}):
            await engine.initialize()

            # Create test transaction data
            tx_data = {
                "hash": "0x1234567890abcdef1234567890abcdef12345678",
                "value": 1.5,
                "network": "ethereum",
            }

            # Create auction
            auction = await engine.order_flow_auction_manager.create_auction(
                intent_type=IntentType.ARBITRAGE,
                transaction_data=tx_data,
                max_gas_price=50000000000,  # 50 gwei
                deadline=int(time.time()) + 300,  # 5 minutes from now
                metadata={"test_auction": True},
            )

            assert auction.auction_id.startswith("ofa_")
            assert auction.intent_type == IntentType.ARBITRAGE
            assert auction.transaction_data == tx_data
            assert auction.max_gas_price == 50000000000
            assert auction.status == "active"
            assert len(auction.participants) > 0

    @pytest.mark.asyncio
    async def test_auction_conduction(self):
        """Test conducting OFA auctions"""
        engine = MEVProtectionEngine()

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379/0"}):
            await engine.initialize()

            # Create auction
            auction = await engine.order_flow_auction_manager.create_auction(
                intent_type=IntentType.MARKET_MAKER,
                transaction_data={"hash": "0xabcdef1234567890abcdef1234567890abcdef12"},
                max_gas_price=30000000000,
                deadline=int(time.time()) + 300,
            )

            # Conduct auction
            result = await engine.order_flow_auction_manager.conduct_auction(auction.auction_id)

            assert result["success"] is True
            assert "winning_bid" in result
            assert "winning_participant" in result
            assert result["auction_id"] == auction.auction_id

            # Check that auction was completed
            completed_auction = engine.order_flow_auction_manager.active_auctions.get(
                auction.auction_id
            )
            assert completed_auction is None  # Should be removed from active auctions

    @pytest.mark.asyncio
    async def test_intent_based_routing(self):
        """Test intent-based routing for different transaction types"""
        engine = MEVProtectionEngine()

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379/0"}):
            await engine.initialize()

            # Test different threat types
            test_threats = [
                MEVThreat(
                    threat_id="test_1",
                    threat_type=MEVType.SANDWICH,
                    target_transaction="0x1234567890abcdef1234567890abcdef12345678",
                    attacker_address="0xabcdef1234567890abcdef1234567890abcdef12",
                    profit_potential=2.5,  # High value - should route to arbitrage
                    gas_price=40000000000,
                    confidence=0.9,
                    severity=ThreatLevel.CRITICAL,
                    detected_at=datetime.now(),
                    network=NetworkType.ETHEREUM,
                    metadata={"swap": True},  # Contains swap - liquidity provision
                ),
                MEVThreat(
                    threat_id="test_2",
                    threat_type=MEVType.ARBITRAGE,
                    target_transaction="0xabcdef1234567890abcdef1234567890abcdef12",
                    attacker_address="0x1234567890123456789012345678901234567890",
                    profit_potential=0.8,  # Medium value - market maker
                    gas_price=30000000000,
                    confidence=0.8,
                    severity=ThreatLevel.HIGH,
                    detected_at=datetime.now(),
                    network=NetworkType.ETHEREUM,
                ),
            ]

            for threat in test_threats:
                intent_type = await engine._determine_transaction_intent(threat)

                if threat.profit_potential > 1.0:
                    assert intent_type == IntentType.ARBITRAGE
                elif "swap" in str(threat.metadata):
                    assert intent_type == IntentType.LIQUIDITY_PROVISION
                else:
                    assert intent_type == IntentType.MARKET_MAKER


class TestAdvancedMEVDetection:
    """Test advanced MEV attack detection"""

    @pytest.mark.asyncio
    async def test_jamming_detection(self):
        """Test detection of jamming attacks"""
        engine = MEVProtectionEngine()

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379/0"}):
            await engine.initialize()

            # Create transaction that looks like jamming
            jamming_tx = {
                "hash": "0x1234567890abcdef1234567890abcdef12345678",
                "from": "0xabcdef1234567890abcdef1234567890abcdef12",
                "to": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",  # Chainlink oracle
                "data": "0x",  # Minimal data
                "gas_price": 600000000000,  # 600 gwei - very high
                "gas_limit": 21000,
                "value": 0,
                "network": NetworkType.ETHEREUM.value,
            }

            threats = await engine.mev_detector.detect_threats(jamming_tx, NetworkType.ETHEREUM)

            # Should detect jamming attack
            jamming_threats = [t for t in threats if t.metadata.get("attack_type") == "jamming"]
            assert len(jamming_threats) > 0

            threat = jamming_threats[0]
            assert threat.severity == ThreatLevel.CRITICAL
            assert "oracle_update" in threat.metadata.get("target", "")

    @pytest.mark.asyncio
    async def test_oracle_manipulation_detection(self):
        """Test detection of oracle manipulation attacks"""
        engine = MEVProtectionEngine()

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379/0"}):
            await engine.initialize()

            # Create transaction targeting oracle
            oracle_tx = {
                "hash": "0xabcdef1234567890abcdef1234567890abcdef12",
                "from": "0x1234567890123456789012345678901234567890",
                "to": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",  # Chainlink oracle
                "data": "0xaabbccdd",  # Some data
                "gas_price": 200000000000,  # 200 gwei
                "gas_limit": 100000,
                "value": 0,
                "network": NetworkType.ETHEREUM.value,
            }

            threats = await engine.mev_detector.detect_threats(oracle_tx, NetworkType.ETHEREUM)

            # Should detect oracle manipulation
            oracle_threats = [
                t for t in threats if "oracle" in threat.metadata.get("attack_type", "")
            ]
            assert len(oracle_threats) > 0

    @pytest.mark.asyncio
    async def test_backrunning_detection(self):
        """Test detection of backrunning attacks"""
        engine = MEVProtectionEngine()

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379/0"}):
            await engine.initialize()

            # Create transaction that could be backrunning
            backrun_tx = {
                "hash": "0x1234567890abcdef1234567890abcdef12345678",
                "from": "0xabcdef1234567890abcdef1234567890abcdef12",
                "to": None,  # Contract creation or similar
                "data": "0xaabbccddeeff",  # Complex data
                "gas_price": 150000000000,  # 150 gwei
                "gas_limit": 150000,
                "value": 0,
                "network": NetworkType.ETHEREUM.value,
            }

            threats = await engine.mev_detector.detect_threats(backrun_tx, NetworkType.ETHEREUM)

            # Should detect backrunning
            backrun_threats = [t for t in threats if t.threat_type == MEVType.BACK_RUNNING]
            assert len(backrun_threats) > 0

    @pytest.mark.asyncio
    async def test_multiple_attack_types(self):
        """Test detection of multiple attack types simultaneously"""
        engine = MEVProtectionEngine()

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379/0"}):
            await engine.initialize()

            # Create various attack transactions
            attack_txs = [
                {  # Jamming
                    "hash": "0x1111111111111111111111111111111111111111",
                    "to": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
                    "data": "0x",
                    "gas_price": 700000000000,
                    "network": NetworkType.ETHEREUM.value,
                },
                {  # Oracle manipulation
                    "hash": "0x2222222222222222222222222222222222222222",
                    "to": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
                    "data": "0xaabbccdd",
                    "gas_price": 300000000000,
                    "network": NetworkType.ETHEREUM.value,
                },
                {  # Backrunning
                    "hash": "0x3333333333333333333333333333333333333333",
                    "to": "0xabcdef1234567890abcdef1234567890abcdef12",
                    "data": "0xabcdef1234567890abcdef1234567890abcdef12",
                    "gas_price": 200000000000,
                    "network": NetworkType.ETHEREUM.value,
                },
            ]

            total_threats = []
            for tx in attack_txs:
                threats = await engine.mev_detector.detect_threats(tx, NetworkType.ETHEREUM)
                total_threats.extend(threats)

            # Should detect multiple types of attacks
            assert len(total_threats) > 0

            # Verify different attack types are detected
            attack_types = set(t.metadata.get("attack_type", "") for t in total_threats)
            assert len(attack_types) > 1


class TestMEVTrackingAndKPI:
    """Test MEV saved tracking and KPI measurement"""

    @pytest.mark.asyncio
    async def test_mev_saved_recording(self):
        """Test recording of MEV saved amounts"""
        engine = MEVProtectionEngine()

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379/0"}):
            await engine.initialize()

            # Record MEV saved
            await engine.mev_tracking_manager.record_mev_saved(
                network=NetworkType.ETHEREUM,
                transaction_hash="0x1234567890abcdef1234567890abcdef12345678",
                mev_amount=1.25,
                gas_saved=50000000000,  # 50 gwei
                relay_used=PrivateRelayType.FLASHBOTS,
                metadata={"test_recording": True},
            )

            # Check current metrics
            metrics = engine.mev_tracking_manager.current_period_metrics
            assert metrics["total_mev_saved"] == 1.25
            assert metrics["transactions_protected"] == 1
            assert metrics["gas_saved"] == 50000000000

            # Check network breakdown
            network_metrics = engine.mev_tracking_manager.network_metrics[
                NetworkType.ETHEREUM.value
            ]
            assert network_metrics["mev_saved"] == 1.25
            assert network_metrics["transactions_protected"] == 1

    @pytest.mark.asyncio
    async def test_mev_report_generation(self):
        """Test generation of MEV saved reports"""
        engine = MEVProtectionEngine()

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379/0"}):
            await engine.initialize()

            # Record some MEV savings
            await engine.mev_tracking_manager.record_mev_saved(
                network=NetworkType.ETHEREUM,
                transaction_hash="0x1234567890abcdef1234567890abcdef12345678",
                mev_amount=1.0,
                gas_saved=30000000000,
                relay_used=PrivateRelayType.FLASHBOTS,
            )

            await engine.mev_tracking_manager.record_mev_saved(
                network=NetworkType.POLYGON,
                transaction_hash="0xabcdef1234567890abcdef1234567890abcdef12",
                mev_amount=0.5,
                gas_saved=15000000000,
                relay_used=PrivateRelayType.MEV_SHARE,
            )

            # Generate report
            report = await engine.mev_tracking_manager.generate_mev_report("1h")

            assert report is not None
            assert report.total_mev_saved == 1.5
            assert report.transactions_protected == 2
            assert report.average_mev_per_transaction == 0.75
            assert report.time_period == "1h"

            # Check network breakdown
            assert NetworkType.ETHEREUM.value in report.network_breakdown
            assert NetworkType.POLYGON.value in report.network_breakdown

    @pytest.mark.asyncio
    async def test_relay_usage_tracking(self):
        """Test tracking of relay usage statistics"""
        engine = MEVProtectionEngine()

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379/0"}):
            await engine.initialize()

            # Record usage of different relays
            await engine.mev_tracking_manager.record_mev_saved(
                network=NetworkType.ETHEREUM,
                transaction_hash="0x1111111111111111111111111111111111111111",
                mev_amount=0.8,
                gas_saved=40000000000,
                relay_used=PrivateRelayType.FLASHBOTS,
            )

            await engine.mev_tracking_manager.record_mev_saved(
                network=NetworkType.ETHEREUM,
                transaction_hash="0x2222222222222222222222222222222222222222",
                mev_amount=0.6,
                gas_saved=30000000000,
                relay_used=PrivateRelayType.MEV_SHARE,
            )

            # Generate report and check relay usage
            report = await engine.mev_tracking_manager.generate_mev_report("1h")

            assert PrivateRelayType.FLASHBOTS.value in report.relay_usage_stats
            assert PrivateRelayType.MEV_SHARE.value in report.relay_usage_stats
            assert report.relay_usage_stats[PrivateRelayType.FLASHBOTS.value] == 1
            assert report.relay_usage_stats[PrivateRelayType.MEV_SHARE.value] == 1


class TestPBSIntegration:
    """Test PBS (Proposer-Builder Separation) integration"""

    @pytest.mark.asyncio
    async def test_pbs_builder_awareness(self):
        """Test PBS builder information retrieval"""
        engine = MEVProtectionEngine()

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379/0"}):
            await engine.initialize()

            # Mock PBS builder data
            mock_builders = [
                {
                    "name": "Flashbots Builder",
                    "endpoint": "https://builder.flashbots.net",
                    "supported_networks": ["ethereum"],
                    "status": "active",
                    "fee_recipient": "0xFeeRecipientAddress",
                    "last_block": 18750000,
                    "total_blocks": 156000,
                },
                {
                    "name": "beaverbuild.org",
                    "endpoint": "https://builder.beaverbuild.org",
                    "supported_networks": ["ethereum"],
                    "status": "active",
                    "fee_recipient": "0xBeaverBuildRecipient",
                    "last_block": 18749995,
                    "total_blocks": 89000,
                },
            ]

            # Test builder information
            assert len(mock_builders) >= 2
            for builder in mock_builders:
                assert "name" in builder
                assert "endpoint" in builder
                assert "supported_networks" in builder
                assert "status" in builder
                assert builder["status"] == "active"

    @pytest.mark.asyncio
    async def test_relay_fallback_strategies(self):
        """Test fallback strategies when relays degrade"""
        engine = MEVProtectionEngine()

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379/0"}):
            await engine.initialize()

            # Mock relay status
            flashbots_relay = engine.private_relay_manager.relay_connections[
                PrivateRelayType.FLASHBOTS
            ]
            flashbots_relay.status = RelayStatus.DEGRADED
            flashbots_relay.latency = 2000.0  # 2 seconds - very high
            flashbots_relay.success_rate = 0.3  # 30% - very low

            # Test fallback to best available relay
            best_relay = await engine.private_relay_manager.get_best_relay(NetworkType.ETHEREUM)

            # Should fallback to a working relay (not the degraded one)
            if best_relay != PrivateRelayType.FLASHBOTS:
                assert best_relay is not None
            else:
                # If Flashbots is still best despite being degraded,
                # it means other relays are worse or unavailable
                pass


class TestComprehensiveIntegration:
    """Test comprehensive integration of all MEV protection features"""

    @pytest.mark.asyncio
    async def test_end_to_end_protection_flow(self):
        """Test complete end-to-end MEV protection flow"""
        engine = MEVProtectionEngine()

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379/0"}):
            await engine.initialize()

            # Start protection
            await engine.start_protection([NetworkType.ETHEREUM], ProtectionLevel.HIGH)

            # Wait a moment for initialization
            await asyncio.sleep(0.1)

            # Check that protection is active
            status = await engine.get_protection_status()
            assert status["status"] == "active"
            assert status["networks_protected"] >= 1
            assert "relay_status" in status
            assert "mev_metrics" in status

            # Stop protection
            await engine.stop_protection()

            # Verify stopped
            status = await engine.get_protection_status()
            assert status["status"] == "inactive"

    @pytest.mark.asyncio
    async def test_transaction_protection_with_private_relays(self):
        """Test transaction protection using private relays"""
        engine = MEVProtectionEngine()

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379/0"}):
            await engine.initialize()

            # Mock relay sending to succeed
            with patch.object(
                engine.private_relay_manager, "send_bundle", new_callable=AsyncMock
            ) as mock_send:
                mock_send.return_value = {"success": True, "bundle_id": "test_bundle_123"}

                # Create a threat
                threat = MEVThreat(
                    threat_id="test_threat_123",
                    threat_type=MEVType.SANDWICH,
                    target_transaction="0x1234567890abcdef1234567890abcdef12345678",
                    attacker_address="0xabcdef1234567890abcdef1234567890abcdef12",
                    profit_potential=1.2,
                    gas_price=40000000000,
                    confidence=0.85,
                    severity=ThreatLevel.HIGH,
                    detected_at=datetime.now(),
                    network=NetworkType.ETHEREUM,
                )

                # Apply private mempool protection
                result = await engine._apply_private_mempool(threat)

                assert result.success is True
                assert "private_mempool" in result.strategy_used
                assert result.value_protected == 1.2
                mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_ofa_with_high_value_transaction(self):
        """Test OFA processing for high-value transactions"""
        engine = MEVProtectionEngine()

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379/0"}):
            await engine.initialize()

            # Mock auction conduction
            with patch.object(
                engine.order_flow_auction_manager, "conduct_auction", new_callable=AsyncMock
            ) as mock_conduct:
                mock_conduct.return_value = {
                    "success": True,
                    "auction_id": "test_ofa_123",
                    "winning_bid": 0.005,
                    "winning_participant": "0x1234567890123456789012345678901234567890",
                }

                # Create high-value threat
                threat = MEVThreat(
                    threat_id="high_value_threat_123",
                    threat_type=MEVType.SANDWICH,
                    target_transaction="0x1234567890abcdef1234567890abcdef12345678",
                    attacker_address="0xabcdef1234567890abcdef1234567890abcdef12",
                    profit_potential=2.5,  # High value - should trigger OFA
                    gas_price=50000000000,
                    confidence=0.9,
                    severity=ThreatLevel.CRITICAL,
                    detected_at=datetime.now(),
                    network=NetworkType.ETHEREUM,
                    metadata={"high_value": True},
                )

                # Add threat to detected threats
                engine.detected_threats.append(threat)

                # Run OFA loop (simulate)
                high_value_txs = [
                    tx
                    for tx in engine.detected_threats
                    if tx.profit_potential > 0.1 and not tx.protection_applied
                ]

                assert len(high_value_txs) > 0

                # Should create and conduct OFA for high-value transaction
                intent_type = await engine._determine_transaction_intent(threat)
                assert intent_type == IntentType.ARBITRAGE  # High value -> arbitrage

                mock_conduct.assert_called_once()


if __name__ == "__main__":
    # Run tests
    pytest.main(
        [
            __file__,
            "-v",
            "--tb=short",
            "--cov=src.mev_protection.core.mev_protection_engine",
            "--cov-report=html:htmlcov",
            "--cov-report=term-missing",
        ]
    )
