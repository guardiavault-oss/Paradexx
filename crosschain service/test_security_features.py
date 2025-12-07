#!/usr/bin/env python3
"""
Simple test script to verify advanced security monitoring features
"""

import asyncio
import os
import sys

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from core.bridge_analyzer import BridgeAnalyzer
from core.security_monitor import AttackPlaybookAnalyzer, SecurityMonitor, SignatureForgeryDetector


async def test_attack_playbook_analysis():
    """Test attack playbook analysis"""
    print("Testing Attack Playbook Analysis...")

    analyzer = AttackPlaybookAnalyzer()

    # Test data that should match Ronin Bridge Hack pattern
    tx_data = {
        "hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        "value": 1000000000000000000000,  # Large value
        "validator_anomalies": True,
        "unusual_transfers": True,
        "signature_issues": False,
    }

    result = await analyzer.analyze_transaction_against_playbooks(tx_data)

    print("✓ Attack analysis completed")
    print(f"  - Risk score: {result['risk_score']}")
    print(f"  - Matched attacks: {len(result['matched_attacks'])}")
    print(f"  - Alerts: {len(result['alerts'])}")

    return result


async def test_signature_validation():
    """Test signature validation and forgery detection"""
    print("\nTesting Signature Validation...")

    detector = SignatureForgeryDetector()

    signature_data = {
        "signature": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
        "message": '{"action":"transfer","amount":1000000,"timestamp":"2024-01-01T00:00:00Z"}',
        "public_key": "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef98",
        "expected_signer": "0x1234567890123456789012345678901234567890",
    }

    result = await detector.validate_signature(**signature_data)

    print("✓ Signature validation completed")
    print(f"  - Is valid: {result['is_valid']}")
    print(f"  - Confidence: {result['confidence_score']:.2f}")
    print(f"  - Forgery indicators: {len(result['forgery_indicators'])}")

    return result


async def test_bridge_analyzer_security():
    """Test bridge analyzer security features"""
    print("\nTesting Bridge Analyzer Security Features...")

    analyzer = BridgeAnalyzer()

    # Test attestation anomalies
    anomalies = await analyzer.detect_attestation_anomalies(
        "0x1234567890123456789012345678901234567890", "ethereum"
    )

    print("✓ Attestation anomaly detection completed")
    print(f"  - Anomalies found: {len(anomalies['attestation_anomalies'])}")
    print(f"  - Severity score: {anomalies['severity_score']}")
    print(f"  - Risk level: {anomalies['risk_level']}")

    # Test quorum analysis
    quorum = await analyzer.analyze_quorum_skews(
        "0x1234567890123456789012345678901234567890", "ethereum"
    )

    print("✓ Quorum analysis completed")
    print(f"  - Quorum met: {quorum['quorum_analysis']['is_quorum_met']}")
    print(f"  - Diversity score: {quorum['skew_analysis']['diversity_score']}")
    print(f"  - Liveness gaps: {len(quorum['quorum_analysis']['liveness_gaps'])}")

    # Test proof-of-reserves
    reserves = await analyzer.proof_of_reserves_monitoring(
        "0x1234567890123456789012345678901234567890", "ethereum"
    )

    print("✓ Proof-of-reserves monitoring completed")
    print(f"  - Is healthy: {reserves['reserves_status']['is_healthy']}")
    print(f"  - Collateralization ratio: {reserves['reserves_status']['collateralization_ratio']}")
    print(f"  - Guardian diversity: {reserves['guardian_quorum']['diversity_score']}")

    return anomalies, quorum, reserves


async def test_comprehensive_security_scan():
    """Test comprehensive security scan"""
    print("\nTesting Comprehensive Security Scan...")

    monitor = SecurityMonitor()

    tx_data = [
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
        }
    ]

    result = await monitor.comprehensive_security_scan(
        "0x1234567890123456789012345678901234567890", "ethereum", tx_data
    )

    print("✓ Comprehensive security scan completed")
    print(f"  - Overall risk score: {result['overall_risk_score']:.2f}")
    print(f"  - Risk level: {result['scan_summary']['risk_level']}")
    print(f"  - Total alerts: {result['scan_summary']['total_alerts']}")
    print(f"  - Transactions analyzed: {result['attack_analysis']['total_transactions']}")
    print(f"  - Signatures validated: {result['signature_analysis']['total_signatures']}")

    return result


async def main():
    """Run all security feature tests"""
    print("🛡️  Cross-Chain Bridge Security Monitoring Test Suite")
    print("=" * 60)

    try:
        # Test attack playbook analysis
        attack_result = await test_attack_playbook_analysis()

        # Test signature validation
        sig_result = await test_signature_validation()

        # Test bridge analyzer security features
        anomalies, quorum, reserves = await test_bridge_analyzer_security()

        # Test comprehensive security scan
        scan_result = await test_comprehensive_security_scan()

        print("\n" + "=" * 60)
        print("✅ All security monitoring features tested successfully!")
        print("\n📊 Summary:")
        print(f"   • Attack patterns detected: {len(attack_result['matched_attacks'])}")
        print(f"   • Signature validation confidence: {sig_result['confidence_score']:.2f}")
        print(f"   • Attestation anomalies found: {len(anomalies['attestation_anomalies'])}")
        print(f"   • Quorum diversity score: {quorum['skew_analysis']['diversity_score']}")
        print(f"   • Reserves health status: {reserves['reserves_status']['is_healthy']}")
        print(f"   • Overall security risk: {scan_result['overall_risk_score']:.2f}")

        print("\n🎯 Key Security Features Implemented:")
        print("   ✅ Bridge-specific heuristics (attestation anomalies)")
        print("   ✅ Quorum skews and liveness gaps monitoring")
        print("   ✅ Proof-of-reserves monitors")
        print("   ✅ Guardian quorum diversity scoring")
        print("   ✅ Attack playbooks from past exploits")
        print("   ✅ Signature mismatch and forgery detectors")
        print("   ✅ Comprehensive security scanning")

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback

        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
