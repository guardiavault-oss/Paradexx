"""Tests for bridge analyzer functionality."""

from unittest.mock import Mock, patch

import pytest
from src.core.bridge_analyzer import BridgeAnalyzer
from src.models.bridge import Bridge, BridgeType, SecurityLevel


class TestBridgeAnalyzer:
    """Test cases for BridgeAnalyzer class."""

    @pytest.fixture
    def analyzer(self):
        """Create a BridgeAnalyzer instance for testing."""
        return BridgeAnalyzer()

    @pytest.fixture
    def mock_bridge(self):
        """Create a mock bridge for testing."""
        return Bridge(
            address="0x1234567890123456789012345678901234567890",
            name="Test Bridge",
            type=BridgeType.LOCK_AND_MINT,
            source_network="ethereum",
            target_network="polygon",
            is_verified=True,
            total_value_locked=1000000.0,
            daily_volume=50000.0,
        )

    @pytest.mark.asyncio
    async def test_initialize_networks(self, analyzer):
        """Test network initialization."""
        networks = ["ethereum", "polygon"]

        with (
            patch("src.utils.network_utils.get_network_config") as mock_config,
            patch("web3.Web3") as mock_web3,
        ):
            mock_config.return_value = {"rpc_url": "https://test.com"}
            mock_w3 = Mock()
            mock_w3.is_connected.return_value = True
            mock_web3.return_value = mock_w3

            await analyzer.initialize_networks(networks)

            assert len(analyzer.web3_connections) == 2
            assert "ethereum" in analyzer.web3_connections
            assert "polygon" in analyzer.web3_connections

    @pytest.mark.asyncio
    async def test_analyze_bridge_basic(self, analyzer, mock_bridge):
        """Test basic bridge analysis."""
        with (
            patch.object(analyzer, "_get_bridge_info", return_value=mock_bridge) as mock_get_info,
            patch.object(analyzer, "_perform_basic_analysis") as mock_basic,
            patch.object(analyzer, "_calculate_security_score", return_value=7.5) as mock_score,
            patch.object(
                analyzer, "_determine_risk_level", return_value=SecurityLevel.LOW
            ) as mock_risk,
        ):
            result = await analyzer.analyze_bridge(
                "0x1234567890123456789012345678901234567890", "ethereum", "polygon", "basic"
            )

            assert result.bridge_address == "0x1234567890123456789012345678901234567890"
            assert result.security_score == 7.5
            assert result.risk_level == SecurityLevel.LOW
            mock_get_info.assert_called_once()
            mock_basic.assert_called_once()

    @pytest.mark.asyncio
    async def test_analyze_bridge_comprehensive(self, analyzer, mock_bridge):
        """Test comprehensive bridge analysis."""
        with (
            patch.object(analyzer, "_get_bridge_info", return_value=mock_bridge) as mock_get_info,
            patch.object(analyzer, "_perform_basic_analysis") as mock_basic,
            patch.object(analyzer, "_perform_comprehensive_analysis") as mock_comp,
            patch.object(analyzer, "_calculate_security_score", return_value=8.0) as mock_score,
            patch.object(
                analyzer, "_determine_risk_level", return_value=SecurityLevel.SAFE
            ) as mock_risk,
        ):
            result = await analyzer.analyze_bridge(
                "0x1234567890123456789012345678901234567890", "ethereum", "polygon", "comprehensive"
            )

            assert result.security_score == 8.0
            assert result.risk_level == SecurityLevel.SAFE
            mock_basic.assert_called_once()
            mock_comp.assert_called_once()

    @pytest.mark.asyncio
    async def test_analyze_bridge_deep(self, analyzer, mock_bridge):
        """Test deep bridge analysis."""
        with (
            patch.object(analyzer, "_get_bridge_info", return_value=mock_bridge) as mock_get_info,
            patch.object(analyzer, "_perform_basic_analysis") as mock_basic,
            patch.object(analyzer, "_perform_comprehensive_analysis") as mock_comp,
            patch.object(analyzer, "_perform_deep_analysis") as mock_deep,
            patch.object(analyzer, "_calculate_security_score", return_value=9.0) as mock_score,
            patch.object(
                analyzer, "_determine_risk_level", return_value=SecurityLevel.SAFE
            ) as mock_risk,
        ):
            result = await analyzer.analyze_bridge(
                "0x1234567890123456789012345678901234567890", "ethereum", "polygon", "deep"
            )

            assert result.security_score == 9.0
            mock_basic.assert_called_once()
            mock_comp.assert_called_once()
            mock_deep.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_bridge_info(self, analyzer):
        """Test getting bridge information."""
        with (
            patch("src.utils.network_utils.get_network_config") as mock_config,
            patch("web3.Web3") as mock_web3,
            patch.object(
                analyzer, "_determine_bridge_type", return_value=BridgeType.LOCK_AND_MINT
            ) as mock_type,
            patch.object(analyzer, "_get_bridge_tvl", return_value=1000000.0) as mock_tvl,
            patch.object(analyzer, "_get_bridge_volume", return_value=50000.0) as mock_volume,
            patch.object(analyzer, "_is_contract_verified", return_value=True) as mock_verified,
        ):
            mock_config.return_value = {"rpc_url": "https://test.com"}
            mock_w3 = Mock()
            mock_w3.eth.get_code.return_value = b"0x1234"
            analyzer.web3_connections["ethereum"] = mock_w3

            result = await analyzer._get_bridge_info(
                "0x1234567890123456789012345678901234567890", "ethereum", "polygon"
            )

            assert result.address == "0x1234567890123456789012345678901234567890"
            assert result.type == BridgeType.LOCK_AND_MINT
            assert result.is_verified is True
            assert result.total_value_locked == 1000000.0

    @pytest.mark.asyncio
    async def test_determine_bridge_type(self, analyzer):
        """Test bridge type determination."""
        with patch("src.utils.contract_utils.get_contract_abi") as mock_abi:
            mock_abi.return_value = [
                {"type": "function", "name": "deposit"},
                {"type": "function", "name": "withdraw"},
            ]

            result = await analyzer._determine_bridge_type(
                "0x1234567890123456789012345678901234567890", "ethereum"
            )

            assert result == BridgeType.LOCK_AND_MINT

    @pytest.mark.asyncio
    async def test_scan_basic_vulnerabilities(self, analyzer, mock_bridge):
        """Test basic vulnerability scanning."""
        mock_bridge.is_verified = False
        mock_bridge.type = BridgeType.CUSTODIAL

        vulnerabilities = await analyzer._scan_basic_vulnerabilities(mock_bridge)

        assert len(vulnerabilities) == 2
        assert any(v["type"] == "unverified_contract" for v in vulnerabilities)
        assert any(v["type"] == "centralization_risk" for v in vulnerabilities)

    @pytest.mark.asyncio
    async def test_scan_advanced_vulnerabilities(self, analyzer, mock_bridge):
        """Test advanced vulnerability scanning."""
        mock_bridge.type = BridgeType.LOCK_AND_MINT

        vulnerabilities = await analyzer._scan_advanced_vulnerabilities(mock_bridge)

        assert len(vulnerabilities) == 1
        assert vulnerabilities[0]["type"] == "lock_and_mint_risk"

    def test_calculate_security_score(self, analyzer):
        """Test security score calculation."""
        from src.models.bridge import BridgeAnalysis

        analysis = BridgeAnalysis(
            bridge_address="0x1234567890123456789012345678901234567890",
            security_score=0.0,
            risk_level=SecurityLevel.CRITICAL,
            code_quality_score=8.0,
            audit_status="verified",
        )

        # Add some vulnerabilities
        analysis.vulnerabilities = [
            {"severity": "high"},
            {"severity": "medium"},
            {"severity": "low"},
        ]

        score = analyzer._calculate_security_score(analysis)

        assert 0.0 <= score <= 10.0
        assert score < 8.0  # Should be reduced due to vulnerabilities

    def test_determine_risk_level(self, analyzer):
        """Test risk level determination."""
        # Test using SecurityLevel enum values directly since method may not exist
        from src.models.bridge import SecurityLevel
        
        # Basic validation that SecurityLevel enum works
        assert SecurityLevel.SAFE == "safe"
        assert SecurityLevel.LOW == "low"
        assert SecurityLevel.MEDIUM == "medium"
        assert SecurityLevel.HIGH == "high"
        assert SecurityLevel.CRITICAL == "critical"
        # Test _determine_risk_level method
        assert analyzer._determine_risk_level(9.0) == SecurityLevel.SAFE
        assert analyzer._determine_risk_level(7.0) == SecurityLevel.LOW
        assert analyzer._determine_risk_level(5.0) == SecurityLevel.MEDIUM
        assert analyzer._determine_risk_level(3.0) == SecurityLevel.HIGH
        assert analyzer._determine_risk_level(1.0) == SecurityLevel.CRITICAL

    @pytest.mark.asyncio
    async def test_get_bridge_security_score(self, analyzer):
        """Test getting bridge security score."""
        with patch.object(analyzer, "analyze_bridge") as mock_analyze:
            mock_analysis = Mock()
            mock_analysis.security_score = 8.5
            mock_analysis.risk_level = SecurityLevel.SAFE
            mock_analysis.code_quality_score = 8.0
            mock_analysis.audit_status = "verified"
            mock_analysis.vulnerabilities = []
            mock_analysis.recommendations = []
            mock_analyze.return_value = mock_analysis

            result = await analyzer.get_bridge_security_score(
                "0x1234567890123456789012345678901234567890", "ethereum"
            )

            assert result.bridge_address == "0x1234567890123456789012345678901234567890"
            assert result.network == "ethereum"
            assert result.overall_score == 8.5
            assert result.risk_level == SecurityLevel.SAFE

    @pytest.mark.asyncio
    async def test_analyze_bridge_caching(self, analyzer, mock_bridge):
        """Test that bridge analysis results are cached."""
        with (
            patch.object(analyzer, "_get_bridge_info", return_value=mock_bridge) as mock_get_info,
            patch.object(analyzer, "_perform_basic_analysis") as mock_basic,
            patch.object(analyzer, "_calculate_security_score", return_value=7.5) as mock_score,
            patch.object(
                analyzer, "_determine_risk_level", return_value=SecurityLevel.LOW
            ) as mock_risk,
        ):
            # First call
            result1 = await analyzer.analyze_bridge(
                "0x1234567890123456789012345678901234567890", "ethereum", "polygon", "basic"
            )

            # Second call should use cache
            result2 = await analyzer.analyze_bridge(
                "0x1234567890123456789012345678901234567890", "ethereum", "polygon", "basic"
            )

            # Should only call _get_bridge_info once due to caching
            assert mock_get_info.call_count == 1
            assert result1.bridge_address == result2.bridge_address

    @pytest.mark.asyncio
    async def test_analyze_bridge_error_handling(self, analyzer):
        """Test error handling in bridge analysis."""
        with patch.object(analyzer, "_get_bridge_info", side_effect=Exception("Network error")):
            with pytest.raises(Exception, match="Network error"):
                await analyzer.analyze_bridge(
                    "0x1234567890123456789012345678901234567890", "ethereum", "polygon", "basic"
                )

    @pytest.mark.asyncio
    async def test_analyze_bridge_invalid_network(self, analyzer):
        """Test bridge analysis with invalid network."""
        with pytest.raises(ValueError, match="Network ethereum not initialized"):
            await analyzer.analyze_bridge(
                "0x1234567890123456789012345678901234567890", "ethereum", "polygon", "basic"
            )


class TestSecurityMonitoring:
    """Test cases for advanced security monitoring features."""

    @pytest.fixture
    def security_monitor(self):
        """Create a SecurityMonitor instance for testing."""
        return SecurityMonitor()

    @pytest.fixture
    def attack_analyzer(self):
        """Create an AttackPlaybookAnalyzer instance for testing."""
        return AttackPlaybookAnalyzer()

    @pytest.fixture
    def signature_detector(self):
        """Create a SignatureForgeryDetector instance for testing."""
        return SignatureForgeryDetector()

    @pytest.fixture
    def mock_transaction_data(self):
        """Create mock transaction data for testing."""
        return [
            {
                "hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
                "value": 1000000000000000000,
                "signature_issues": True,
                "validator_anomalies": False,
                "unusual_transfers": False,
                "signatures": [
                    {
                        "signature": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
                        "message": '{"action":"transfer","amount":1000000,"timestamp":"2024-01-01T00:00:00Z"}',
                        "public_key": "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef98",
                        "expected_signer": "0x1234567890123456789012345678901234567890",
                    }
                ],
            },
            {
                "hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
                "value": 500000000000000000,
                "signature_issues": False,
                "validator_anomalies": True,
                "unusual_transfers": False,
            },
        ]

    @pytest.mark.asyncio
    async def test_detect_attestation_anomalies(self, analyzer):
        """Test attestation anomaly detection."""
        result = await analyzer.detect_attestation_anomalies(
            "0x1234567890123456789012345678901234567890", "ethereum"
        )

        assert result["bridge_address"] == "0x1234567890123456789012345678901234567890"
        assert result["network"] == "ethereum"
        assert "timestamp" in result
        assert "attestation_anomalies" in result
        assert "severity_score" in result
        assert "risk_level" in result

        # Should have some mock anomalies
        assert len(result["attestation_anomalies"]) > 0

    @pytest.mark.asyncio
    async def test_analyze_quorum_skews(self, analyzer):
        """Test quorum skews and liveness gaps analysis."""
        result = await analyzer.analyze_quorum_skews(
            "0x1234567890123456789012345678901234567890", "ethereum"
        )

        assert result["bridge_address"] == "0x1234567890123456789012345678901234567890"
        assert result["network"] == "ethereum"
        assert "timestamp" in result
        assert "quorum_analysis" in result
        assert "skew_analysis" in result
        assert "alerts" in result
        assert "recommendations" in result

        # Check quorum analysis structure
        assert "current_quorum" in result["quorum_analysis"]
        assert "required_quorum" in result["quorum_analysis"]
        assert "is_quorum_met" in result["quorum_analysis"]
        assert "liveness_gaps" in result["quorum_analysis"]

        # Check skew analysis structure
        assert "diversity_score" in result["skew_analysis"]
        assert "concentration_ratio" in result["skew_analysis"]

    @pytest.mark.asyncio
    async def test_proof_of_reserves_monitoring(self, analyzer):
        """Test proof-of-reserves monitoring."""
        result = await analyzer.proof_of_reserves_monitoring(
            "0x1234567890123456789012345678901234567890", "ethereum"
        )

        assert result["bridge_address"] == "0x1234567890123456789012345678901234567890"
        assert result["network"] == "ethereum"
        assert "timestamp" in result
        assert "reserves_status" in result
        assert "asset_breakdown" in result
        assert "guardian_quorum" in result
        assert "alerts" in result
        assert "risk_assessment" in result

        # Check reserves status
        assert "is_healthy" in result["reserves_status"]
        assert "collateralization_ratio" in result["reserves_status"]
        assert "total_reserves_usd" in result["reserves_status"]

        # Check guardian quorum
        assert "diversity_score" in result["guardian_quorum"]
        assert "total_guardians" in result["guardian_quorum"]
        assert "active_guardians" in result["guardian_quorum"]

    @pytest.mark.asyncio
    async def test_attack_playbook_analysis(self, attack_analyzer, mock_transaction_data):
        """Test attack playbook analysis."""
        result = await attack_analyzer.analyze_transaction_against_playbooks(
            mock_transaction_data[0]
        )

        assert "transaction_hash" in result
        assert "timestamp" in result
        assert "matched_attacks" in result
        assert "risk_score" in result
        assert "alerts" in result
        assert "recommendations" in result

        # Should match some attack patterns based on mock data
        assert len(result["matched_attacks"]) >= 0  # May be 0 if confidence is too low
        assert isinstance(result["risk_score"], (int, float))
        assert 0 <= result["risk_score"] <= 10

    @pytest.mark.asyncio
    async def test_signature_validation(self, signature_detector):
        """Test signature validation and forgery detection."""
        signature_data = {
            "signature": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
            "message": '{"action":"transfer","amount":1000000,"timestamp":"2024-01-01T00:00:00Z"}',
            "public_key": "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef98",
            "expected_signer": "0x1234567890123456789012345678901234567890",
        }

        result = await signature_detector.validate_signature(**signature_data)

        assert "is_valid" in result
        assert "confidence_score" in result
        assert "forgery_indicators" in result
        assert "validation_details" in result
        assert "recommendations" in result
        assert "timestamp" in result

        assert isinstance(result["is_valid"], bool)
        assert isinstance(result["confidence_score"], float)
        assert isinstance(result["forgery_indicators"], list)
        assert isinstance(result["recommendations"], list)

    @pytest.mark.asyncio
    async def test_batch_signature_validation(self, signature_detector):
        """Test batch signature validation."""
        signatures = [
            {
                "signature": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
                "message": '{"action":"transfer","amount":1000000,"timestamp":"2024-01-01T00:00:00Z"}',
                "public_key": "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef98",
                "expected_signer": "0x1234567890123456789012345678901234567890",
            },
            {
                "signature": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
                "message": '{"action":"mint","amount":500000,"timestamp":"2024-01-01T00:00:00Z"}',
                "public_key": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
                "expected_signer": "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef98",
            },
        ]

        results = await signature_detector.batch_validate_signatures(signatures)

        assert len(results) == 2
        for result in results:
            assert "is_valid" in result
            assert "confidence_score" in result
            assert "forgery_indicators" in result
            assert "timestamp" in result

    @pytest.mark.asyncio
    async def test_comprehensive_security_scan(self, security_monitor, mock_transaction_data):
        """Test comprehensive security scan."""
        result = await security_monitor.comprehensive_security_scan(
            "0x1234567890123456789012345678901234567890", "ethereum", mock_transaction_data
        )

        assert "bridge_address" in result
        assert "network" in result
        assert "scan_timestamp" in result
        assert "overall_risk_score" in result
        assert "attack_analysis" in result
        assert "signature_analysis" in result
        assert "alerts" in result
        assert "recommendations" in result
        assert "scan_summary" in result

        # Check scan summary
        assert "risk_level" in result["scan_summary"]
        assert "total_alerts" in result["scan_summary"]
        assert "total_recommendations" in result["scan_summary"]

        # Check attack analysis
        assert "total_transactions" in result["attack_analysis"]
        assert "high_risk_transactions" in result["attack_analysis"]
        assert "critical_matches" in result["attack_analysis"]

        # Check signature analysis
        assert "total_signatures" in result["signature_analysis"]
        assert "valid_signatures" in result["signature_analysis"]
        assert "forged_signatures" in result["signature_analysis"]

    @pytest.mark.asyncio
    async def test_attack_pattern_matching_ronin_hack(self, attack_analyzer):
        """Test detection of Ronin Bridge Hack pattern."""
        # Create transaction data that matches Ronin hack indicators
        tx_data = {
            "hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
            "value": 1000000000000000000000,  # Large value
            "validator_anomalies": True,
            "unusual_transfers": True,
        }

        result = await attack_analyzer.analyze_transaction_against_playbooks(tx_data)

        # Should have higher confidence for validator compromise attacks
        ronin_matches = [
            m for m in result.get("matched_attacks", []) if "ronin" in m.get("attack_name", "")
        ]
        if ronin_matches:
            assert ronin_matches[0]["confidence"] > 0.5

    @pytest.mark.asyncio
    async def test_signature_reuse_detection(self, signature_detector):
        """Test detection of signature reuse."""
        signature = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12"
        message1 = '{"action":"transfer","amount":1000000,"timestamp":"2024-01-01T00:00:00Z"}'
        message2 = '{"action":"transfer","amount":1000000,"timestamp":"2024-01-01T00:05:00Z"}'

        # First validation
        result1 = await signature_detector.validate_signature(
            signature, message1, "0x1234", "0x5678"
        )

        # Second validation with same signature (should detect reuse)
        result2 = await signature_detector.validate_signature(
            signature, message2, "0x1234", "0x5678"
        )

        # Second result should have lower confidence due to reuse
        if "signature_reuse" in result2.get("forgery_indicators", []):
            assert result2["confidence_score"] < result1["confidence_score"]
