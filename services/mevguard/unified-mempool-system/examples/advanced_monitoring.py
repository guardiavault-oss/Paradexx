#!/usr/bin/env python3
"""
Advanced monitoring example for the Unified Mempool Monitoring System
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import Any

# Add the src directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from unified_mempool.core.unified_mempool_engine import UnifiedMempoolEngine


class AdvancedMempoolMonitor:
    """Advanced monitoring class with custom analysis"""

    def __init__(self):
        self.engine = UnifiedMempoolEngine()
        self.monitoring_data = []
        self.alert_thresholds = {
            "high_gas_price": 50,  # gwei
            "suspicious_volume": 1000,  # ETH
            "mev_attacks": 1,  # any MEV attack
        }

    async def initialize(self):
        """Initialize the monitoring system"""
        await self.engine.initialize()
        print("✅ Advanced monitoring system initialized")

    async def monitor_transactions(self, duration: int = 60):
        """Monitor transactions for specified duration"""
        print(f"🔍 Monitoring transactions for {duration} seconds...")

        start_time = asyncio.get_event_loop().time()

        while (asyncio.get_event_loop().time() - start_time) < duration:
            try:
                # Get current system status
                status = await self.engine.get_system_status()

                # Analyze the data
                analysis = self.analyze_data(status)

                # Check for alerts
                alerts = self.check_alerts(analysis)

                # Store monitoring data
                self.monitoring_data.append(
                    {
                        "timestamp": asyncio.get_event_loop().time(),
                        "status": status,
                        "analysis": analysis,
                        "alerts": alerts,
                    }
                )

                # Print status
                self.print_status(status, analysis, alerts)

                # Wait before next check
                await asyncio.sleep(5)

            except Exception as e:
                print(f"❌ Error during monitoring: {e}")
                await asyncio.sleep(5)

    def analyze_data(self, status: dict[str, Any]) -> dict[str, Any]:
        """Analyze the current system status"""
        analysis = {
            "total_transactions": status.get("transactions_processed", 0),
            "active_networks": len(status.get("networks", {})),
            "mev_attacks_detected": status.get("mev_attacks", 0),
            "average_gas_price": self.calculate_average_gas_price(status),
            "risk_level": self.calculate_risk_level(status),
        }

        return analysis

    def calculate_average_gas_price(self, status: dict[str, Any]) -> float:
        """Calculate average gas price across networks"""
        networks = status.get("networks", {})
        if not networks:
            return 0.0

        total_gas = sum(network.get("gas_price", 0) for network in networks.values())
        return total_gas / len(networks) if networks else 0.0

    def calculate_risk_level(self, status: dict[str, Any]) -> str:
        """Calculate overall risk level"""
        mev_attacks = status.get("mev_attacks", 0)
        suspicious_txs = status.get("suspicious_transactions", 0)

        if mev_attacks > 5 or suspicious_txs > 100:
            return "HIGH"
        if mev_attacks > 2 or suspicious_txs > 50:
            return "MEDIUM"
        return "LOW"

    def check_alerts(self, analysis: dict[str, Any]) -> list:
        """Check for alert conditions"""
        alerts = []

        # Check gas price alert
        if analysis["average_gas_price"] > self.alert_thresholds["high_gas_price"]:
            alerts.append(
                {
                    "type": "HIGH_GAS_PRICE",
                    "message": f"High gas price detected: {analysis['average_gas_price']:.2f} gwei",
                    "severity": "WARNING",
                }
            )

        # Check MEV attack alert
        if analysis["mev_attacks_detected"] >= self.alert_thresholds["mev_attacks"]:
            alerts.append(
                {
                    "type": "MEV_ATTACK",
                    "message": f"MEV attack detected: {analysis['mev_attacks_detected']} attacks",
                    "severity": "CRITICAL",
                }
            )

        # Check risk level alert
        if analysis["risk_level"] == "HIGH":
            alerts.append(
                {
                    "type": "HIGH_RISK",
                    "message": "High risk level detected in the mempool",
                    "severity": "CRITICAL",
                }
            )

        return alerts

    def print_status(self, status: dict[str, Any], analysis: dict[str, Any], alerts: list):
        """Print current monitoring status"""
        print("\n📊 Status Update:")
        print(f"   Transactions: {analysis['total_transactions']}")
        print(f"   Networks: {analysis['active_networks']}")
        print(f"   Gas Price: {analysis['average_gas_price']:.2f} gwei")
        print(f"   Risk Level: {analysis['risk_level']}")
        print(f"   MEV Attacks: {analysis['mev_attacks_detected']}")

        if alerts:
            print(f"   🚨 Alerts: {len(alerts)}")
            for alert in alerts:
                print(f"      - {alert['severity']}: {alert['message']}")
        else:
            print("   ✅ No alerts")

    async def generate_report(self):
        """Generate a monitoring report"""
        print("\n📋 Generating monitoring report...")

        if not self.monitoring_data:
            print("❌ No monitoring data available")
            return

        # Calculate summary statistics
        total_measurements = len(self.monitoring_data)
        total_transactions = sum(
            data["analysis"]["total_transactions"] for data in self.monitoring_data
        )
        total_alerts = sum(len(data["alerts"]) for data in self.monitoring_data)

        # Find peak activity
        peak_transactions = max(
            data["analysis"]["total_transactions"] for data in self.monitoring_data
        )
        peak_gas_price = max(data["analysis"]["average_gas_price"] for data in self.monitoring_data)

        # Generate report
        report = {
            "monitoring_duration": total_measurements * 5,  # 5 seconds per measurement
            "total_measurements": total_measurements,
            "total_transactions_processed": total_transactions,
            "total_alerts_generated": total_alerts,
            "peak_transaction_volume": peak_transactions,
            "peak_gas_price": peak_gas_price,
            "average_transactions_per_measurement": (
                total_transactions / total_measurements if total_measurements > 0 else 0
            ),
            "alert_rate": total_alerts / total_measurements if total_measurements > 0 else 0,
        }

        # Print report
        print("\n📊 Monitoring Report:")
        print("=" * 40)
        for key, value in report.items():
            if isinstance(value, float):
                print(f"{key.replace('_', ' ').title()}: {value:.2f}")
            else:
                print(f"{key.replace('_', ' ').title()}: {value}")

        # Save report to file
        report_file = Path("monitoring_report.json")
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)
        print(f"\n💾 Report saved to: {report_file}")

    async def shutdown(self):
        """Shutdown the monitoring system"""
        await self.engine.shutdown()
        print("🛑 Advanced monitoring system shutdown")


async def main():
    """Main function"""
    print("🎯 Advanced Mempool Monitoring Example")
    print("=" * 50)

    monitor = AdvancedMempoolMonitor()

    try:
        # Initialize
        await monitor.initialize()

        # Monitor for 2 minutes
        await monitor.monitor_transactions(duration=120)

        # Generate report
        await monitor.generate_report()

    except KeyboardInterrupt:
        print("\n🛑 Monitoring stopped by user")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await monitor.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
