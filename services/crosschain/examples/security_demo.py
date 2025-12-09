#!/usr/bin/env python3
"""
Cross-Chain Bridge Security Demo
Demonstrates the advanced security features of the bridge service
"""

import asyncio
from datetime import datetime
from typing import Any

import aiohttp


class BridgeSecurityDemo:
    """Demo class for cross-chain bridge security features"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def make_request(
        self, method: str, endpoint: str, data: dict[str, Any] = None
    ) -> dict[str, Any]:
        """Make HTTP request to the API"""
        url = f"{self.base_url}{endpoint}"

        async with self.session.request(method, url, json=data) as response:
            if response.status == 200:
                return await response.json()
            error_text = await response.text()
            raise Exception(f"API request failed: {response.status} - {error_text}")

    async def demo_security_dashboard(self):
        """Demonstrate security dashboard"""
        print("\n🔍 Security Dashboard Demo")
        print("=" * 50)

        try:
            dashboard = await self.make_request("GET", "/api/v1/security/dashboard")

            print(f"Overall Security Score: {dashboard['overall_security_score']:.2f}")
            print(f"Security Status: {dashboard['security_status']}")
            print(f"Recent Events: {dashboard['recent_events']['total']}")
            print(f"Active Alerts: {dashboard['active_alerts']['total']}")

            print("\nComponent Health:")
            for component, health in dashboard["component_health"].items():
                print(f"  {component}: {health}")

            print("\nRecommendations:")
            for rec in dashboard["recommendations"]:
                print(f"  • {rec}")

        except Exception as e:
            print(f"Error getting security dashboard: {e}")

    async def demo_attestation_monitoring(self):
        """Demonstrate attestation monitoring"""
        print("\n📊 Attestation Monitoring Demo")
        print("=" * 50)

        # Process a sample attestation
        attestation_data = {
            "bridge_address": "0x1234567890123456789012345678901234567890",
            "source_network": "ethereum",
            "target_network": "polygon",
            "transaction_hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            "block_number": 18500000,
            "validator_address": "0x9876543210987654321098765432109876543210",
            "signature": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            "message_hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            "confidence_score": 0.95,
            "metadata": {"validator_reputation": 0.85, "response_time": 1.2},
        }

        try:
            result = await self.make_request(
                "POST", "/api/v1/security/attestations/process", attestation_data
            )

            print(f"Attestation ID: {result['attestation']['id']}")
            print(f"Status: {result['attestation']['status']}")
            print(f"Confidence Score: {result['attestation']['confidence_score']}")
            print(f"Anomalies Detected: {len(result['anomalies'])}")

            if result["anomalies"]:
                print("\nAnomalies:")
                for anomaly in result["anomalies"]:
                    print(f"  • {anomaly['description']} (Severity: {anomaly['severity']})")

            # Get attestation metrics
            metrics = await self.make_request("GET", "/api/v1/security/attestations/metrics")
            print("\nAttestation Metrics:")
            print(f"  Total Attestations: {metrics['total_attestations']}")
            print(f"  Validity Rate: {metrics['validity_rate']:.2%}")
            print(f"  Anomaly Rate: {metrics['anomaly_rate']:.2%}")
            print(f"  Active Validators: {metrics['active_validators']}")

        except Exception as e:
            print(f"Error in attestation monitoring demo: {e}")

    async def demo_proof_of_reserves(self):
        """Demonstrate proof of reserves monitoring"""
        print("\n💰 Proof of Reserves Demo")
        print("=" * 50)

        # Register a sample guardian
        guardian_data = {
            "address": "0x1111111111111111111111111111111111111111",
            "name": "Guardian Alpha",
            "geographic_region": "North America",
            "institutional_type": "crypto_fund",
            "technical_expertise": ["blockchain", "cryptography", "bridge_security"],
            "stake_amount": 1000000.0,
            "metadata": {"experience_years": 5, "reputation_score": 0.9},
        }

        try:
            # Register guardian
            guardian = await self.make_request(
                "POST", "/api/v1/security/guardians/register", guardian_data
            )
            print(f"Registered Guardian: {guardian['name']}")
            print(f"Reputation Score: {guardian['reputation_score']}")
            print(f"Diversity Scores: {guardian['diversity_scores']}")

            # Verify reserves
            reserve_data = {
                "bridge_address": "0x1234567890123456789012345678901234567890",
                "network": "ethereum",
                "total_reserves": 50000000.0,
                "verification_data": {
                    "token_balances": {"USDC": 25000000.0, "USDT": 15000000.0, "ETH": 10000000.0},
                    "verification_method": "on_chain_verification",
                },
            }

            reserve_proof = await self.make_request(
                "POST", "/api/v1/security/reserves/verify", reserve_data
            )
            print("\nReserve Verification:")
            print(f"  Total Reserves: ${reserve_proof['total_reserves']:,.2f}")
            print(f"  Verified Reserves: ${reserve_proof['verified_reserves']:,.2f}")
            print(f"  Status: {reserve_proof['status']}")
            print(
                f"  Guardian Consensus: {reserve_proof['guardian_consensus']}/{reserve_proof['required_consensus']}"
            )
            print(f"  Confidence Score: {reserve_proof['confidence_score']:.2f}")

            # Get quorum diversity
            diversity = await self.make_request(
                "GET",
                "/api/v1/security/quorum/diversity",
                {"bridge_address": "0x1234567890123456789012345678901234567890"},
            )
            print("\nQuorum Diversity:")
            print(f"  Overall Score: {diversity['overall_diversity_score']:.2f}")
            print(f"  Geographic: {diversity['geographic_diversity']:.2f}")
            print(f"  Institutional: {diversity['institutional_diversity']:.2f}")
            print(f"  Technical: {diversity['technical_diversity']:.2f}")
            print(f"  Active Guardians: {diversity['active_guardians']}")

        except Exception as e:
            print(f"Error in proof of reserves demo: {e}")

    async def demo_attack_detection(self):
        """Demonstrate attack detection system"""
        print("\n🛡️ Attack Detection Demo")
        print("=" * 50)

        # Simulate a suspicious transaction
        attack_data = {
            "transaction_data": {
                "from": "0x2222222222222222222222222222222222222222",
                "to": "0x1234567890123456789012345678901234567890",
                "value": 1000000000000000000,  # 1 ETH
                "gas_price": 20000000000,  # 20 gwei
                "nonce": 0,
                "data": "0x1234567890abcdef",
                "timestamp": datetime.utcnow().isoformat(),
            },
            "signature": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            "bridge_address": "0x1234567890123456789012345678901234567890",
            "network": "ethereum",
        }

        try:
            detection_result = await self.make_request(
                "POST", "/api/v1/security/attacks/detect", attack_data
            )

            print("Signature Analysis:")
            print(f"  Type: {detection_result['signature_analysis']['signature_type']}")
            print(f"  Valid: {detection_result['signature_analysis']['is_valid']}")
            print(f"  Forged: {detection_result['signature_analysis']['is_forged']}")
            print(f"  Confidence: {detection_result['signature_analysis']['confidence_score']:.2f}")

            if detection_result["signature_analysis"]["anomalies"]:
                print(f"  Anomalies: {detection_result['signature_analysis']['anomalies']}")

            print(f"\nAttack Detections: {len(detection_result['attack_detections'])}")
            for detection in detection_result["attack_detections"]:
                print(f"  • {detection['description']} (Threat: {detection['threat_level']})")
                print(f"    Actions: {detection['recommended_actions']}")

            # Get attack statistics
            stats = await self.make_request("GET", "/api/v1/security/attacks/statistics")
            print("\nAttack Statistics (24h):")
            print(f"  Total Detections: {stats['total_detections']}")
            print(f"  Critical: {stats['critical_detections']}")
            print(f"  High: {stats['high_detections']}")
            print(f"  Average Confidence: {stats['average_confidence']:.2f}")

        except Exception as e:
            print(f"Error in attack detection demo: {e}")

    async def demo_liveness_monitoring(self):
        """Demonstrate liveness monitoring"""
        print("\n💓 Liveness Monitoring Demo")
        print("=" * 50)

        try:
            # Get network health
            network_health = await self.make_request("GET", "/api/v1/security/liveness/networks")
            print("Network Health:")
            for network, health in network_health.items():
                if isinstance(health, dict):
                    print(f"  {network}: {health['status']} (Score: {health['health_score']:.2f})")

            # Get liveness gaps
            gaps = await self.make_request("GET", "/api/v1/security/liveness/gaps")
            print(f"\nLiveness Gaps: {len(gaps['gaps'])}")
            for gap in gaps["gaps"][:3]:  # Show first 3 gaps
                print(f"  • {gap['description']} (Duration: {gap['duration']:.1f}s)")

            # Get liveness summary
            summary = await self.make_request("GET", "/api/v1/security/liveness/summary")
            print("\nLiveness Summary:")
            print(
                f"  Networks: {summary['networks']['healthy']}/{summary['networks']['total']} healthy"
            )
            print(
                f"  Validators: {summary['validators']['online']}/{summary['validators']['total']} online"
            )
            print(f"  Active Gaps: {summary['liveness_gaps']['active']}")
            print(f"  Overall Health: {summary['overall_health']}")

        except Exception as e:
            print(f"Error in liveness monitoring demo: {e}")

    async def demo_security_events(self):
        """Demonstrate security events and alerts"""
        print("\n🚨 Security Events & Alerts Demo")
        print("=" * 50)

        try:
            # Get recent events
            events = await self.make_request("GET", "/api/v1/security/events")
            print(f"Recent Security Events: {len(events['events'])}")
            for event in events["events"][:3]:  # Show first 3 events
                print(f"  • {event['description']} (Severity: {event['severity']})")
                print(f"    Type: {event['event_type']}, Status: {event['status']}")

            # Get active alerts
            alerts = await self.make_request("GET", "/api/v1/security/alerts")
            print(f"\nActive Alerts: {len(alerts['alerts'])}")
            for alert in alerts["alerts"][:3]:  # Show first 3 alerts
                print(f"  • {alert['title']} (Priority: {alert['priority']})")
                print(f"    Requires Action: {alert['requires_immediate_action']}")
                print(f"    Escalation Level: {alert['escalation_level']}")

        except Exception as e:
            print(f"Error in security events demo: {e}")

    async def run_full_demo(self):
        """Run the complete security demo"""
        print("🔐 Cross-Chain Bridge Security Demo")
        print("=" * 60)
        print("This demo showcases the advanced security features of the")
        print("Cross-Chain Bridge Security Analysis Service.")
        print("=" * 60)

        try:
            # Check if service is running
            health = await self.make_request("GET", "/health")
            print(f"✅ Service Status: {health['status']}")
            print(f"   Version: {health['version']}")
            print(f"   Timestamp: {health['timestamp']}")

            # Run all demos
            await self.demo_security_dashboard()
            await self.demo_attestation_monitoring()
            await self.demo_proof_of_reserves()
            await self.demo_attack_detection()
            await self.demo_liveness_monitoring()
            await self.demo_security_events()

            print("\n🎉 Demo completed successfully!")
            print("\nKey Features Demonstrated:")
            print("  • Real-time attestation monitoring with anomaly detection")
            print("  • Proof of reserves verification with guardian consensus")
            print("  • Advanced attack detection based on historical exploits")
            print("  • Comprehensive liveness monitoring and gap detection")
            print("  • Security event correlation and alerting")
            print("  • Guardian quorum diversity scoring")
            print("  • Signature validation and forgery detection")

        except Exception as e:
            print(f"❌ Demo failed: {e}")
            print("\nMake sure the service is running on http://localhost:8000")
            print("Start the service with: uvicorn src.api.main:app --host 0.0.0.0 --port 8000")


async def main():
    """Main demo function"""
    async with BridgeSecurityDemo() as demo:
        await demo.run_full_demo()


if __name__ == "__main__":
    asyncio.run(main())
