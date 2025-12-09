#!/usr/bin/env python3
"""
Integration example showing how to integrate the Unified Mempool System
with external applications and services.
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import Any

import aiohttp

# Add the src directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


class MempoolIntegrationClient:
    """Client for integrating with the Unified Mempool System"""

    def __init__(self, base_url: str = "http://localhost:8000", api_key: str = None):
        self.base_url = base_url
        self.api_key = api_key
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def _get_headers(self) -> dict[str, str]:
        """Get request headers with authentication"""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def get_system_status(self) -> dict[str, Any]:
        """Get system status"""
        async with self.session.get(
            f"{self.base_url}/api/v1/status", headers=self._get_headers()
        ) as response:
            return await response.json()

    async def get_transactions(
        self, network: str = None, suspicious_only: bool = False, limit: int = 100
    ) -> dict[str, Any]:
        """Get transactions with filtering"""
        params = {}
        if network:
            params["network"] = network
        if suspicious_only:
            params["suspicious_only"] = "true"
        if limit:
            params["limit"] = limit

        async with self.session.get(
            f"{self.base_url}/api/v1/transactions", headers=self._get_headers(), params=params
        ) as response:
            return await response.json()

    async def get_mev_opportunities(
        self, network: str = None, opportunity_type: str = None
    ) -> dict[str, Any]:
        """Get MEV opportunities"""
        params = {}
        if network:
            params["network"] = network
        if opportunity_type:
            params["opportunity_type"] = opportunity_type

        async with self.session.get(
            f"{self.base_url}/api/v1/mev/opportunities", headers=self._get_headers(), params=params
        ) as response:
            return await response.json()

    async def get_threats(self, severity: str = None, network: str = None) -> dict[str, Any]:
        """Get threat intelligence"""
        params = {}
        if severity:
            params["severity"] = severity
        if network:
            params["network"] = network

        async with self.session.get(
            f"{self.base_url}/api/v1/threats", headers=self._get_headers(), params=params
        ) as response:
            return await response.json()

    async def stream_transactions(self, callback):
        """Stream real-time transactions"""
        async with self.session.get(
            f"{self.base_url}/api/v1/stream/transactions", headers=self._get_headers()
        ) as response:
            async for line in response.content:
                if line:
                    try:
                        data = json.loads(line.decode("utf-8"))
                        await callback(data)
                    except json.JSONDecodeError:
                        continue

    async def stream_alerts(self, callback):
        """Stream real-time alerts"""
        async with self.session.get(
            f"{self.base_url}/api/v1/stream/alerts", headers=self._get_headers()
        ) as response:
            async for line in response.content:
                if line:
                    try:
                        data = json.loads(line.decode("utf-8"))
                        await callback(data)
                    except json.JSONDecodeError:
                        continue


class TradingBot:
    """Example trading bot that uses mempool data"""

    def __init__(self, mempool_client: MempoolIntegrationClient):
        self.mempool_client = mempool_client
        self.running = False
        self.alert_count = 0

    async def start(self):
        """Start the trading bot"""
        print("🤖 Starting trading bot...")
        self.running = True

        # Start monitoring tasks
        tasks = [
            asyncio.create_task(self.monitor_transactions()),
            asyncio.create_task(self.monitor_alerts()),
            asyncio.create_task(self.analyze_mev_opportunities()),
        ]

        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            print("\n🛑 Stopping trading bot...")
            self.running = False

    async def monitor_transactions(self):
        """Monitor transactions for trading opportunities"""
        while self.running:
            try:
                # Get recent transactions
                data = await self.mempool_client.get_transactions(
                    network="ethereum", suspicious_only=True, limit=50
                )

                transactions = data.get("transactions", [])
                for tx in transactions:
                    await self.analyze_transaction(tx)

                await asyncio.sleep(5)  # Check every 5 seconds

            except Exception as e:
                print(f"❌ Error monitoring transactions: {e}")
                await asyncio.sleep(10)

    async def monitor_alerts(self):
        """Monitor security alerts"""

        async def alert_callback(alert_data):
            self.alert_count += 1
            alert = alert_data.get("data", {})
            print(f"🚨 Alert #{self.alert_count}: {alert.get('message', 'Unknown alert')}")

            # Take action based on alert type
            if alert.get("type") == "mev_attack":
                await self.handle_mev_attack(alert)
            elif alert.get("severity") == "critical":
                await self.handle_critical_alert(alert)

        try:
            await self.mempool_client.stream_alerts(alert_callback)
        except Exception as e:
            print(f"❌ Error monitoring alerts: {e}")

    async def analyze_mev_opportunities(self):
        """Analyze MEV opportunities"""
        while self.running:
            try:
                opportunities = await self.mempool_client.get_mev_opportunities(
                    network="ethereum", opportunity_type="arbitrage"
                )

                for opp in opportunities.get("opportunities", []):
                    await self.evaluate_opportunity(opp)

                await asyncio.sleep(10)  # Check every 10 seconds

            except Exception as e:
                print(f"❌ Error analyzing MEV opportunities: {e}")
                await asyncio.sleep(15)

    async def analyze_transaction(self, tx: dict[str, Any]):
        """Analyze a transaction for trading opportunities"""
        # Example analysis logic
        risk_score = tx.get("risk_score", 0)
        value = float(tx.get("value", 0))

        if risk_score > 0.8 and value > 10:  # High risk, high value
            print(f"⚠️  High-risk transaction detected: {tx.get('hash', 'Unknown')}")
            print(f"   Value: {value} ETH, Risk Score: {risk_score}")

    async def evaluate_opportunity(self, opp: dict[str, Any]):
        """Evaluate an MEV opportunity"""
        profit_estimate = float(opp.get("profit_estimate", "0").split()[0])
        confidence = opp.get("confidence", 0)

        if profit_estimate > 0.1 and confidence > 0.8:  # Profitable and confident
            print(f"💰 MEV Opportunity: {opp.get('type', 'Unknown')}")
            print(f"   Profit Estimate: {profit_estimate} ETH")
            print(f"   Confidence: {confidence}")
            print(f"   Target TX: {opp.get('target_transaction', 'Unknown')}")

    async def handle_mev_attack(self, alert: dict[str, Any]):
        """Handle MEV attack alert"""
        print(f"🛡️  MEV Attack detected: {alert.get('message', 'Unknown')}")
        # Implement protection logic here

    async def handle_critical_alert(self, alert: dict[str, Any]):
        """Handle critical alert"""
        print(f"🚨 CRITICAL ALERT: {alert.get('message', 'Unknown')}")
        # Implement emergency response logic here


class SecurityMonitor:
    """Example security monitoring system"""

    def __init__(self, mempool_client: MempoolIntegrationClient):
        self.mempool_client = mempool_client
        self.threat_database = {}

    async def start_monitoring(self):
        """Start security monitoring"""
        print("🔒 Starting security monitoring...")

        # Monitor threats
        while True:
            try:
                threats = await self.mempool_client.get_threats(severity="high")

                for threat in threats.get("threats", []):
                    await self.process_threat(threat)

                await asyncio.sleep(30)  # Check every 30 seconds

            except Exception as e:
                print(f"❌ Error monitoring threats: {e}")
                await asyncio.sleep(60)

    async def process_threat(self, threat: dict[str, Any]):
        """Process a threat"""
        threat_id = threat.get("id")
        threat_type = threat.get("type")
        address = threat.get("address")

        if threat_id not in self.threat_database:
            self.threat_database[threat_id] = threat
            print(f"🆕 New threat detected: {threat_type}")
            print(f"   Address: {address}")
            print(f"   Description: {threat.get('description', 'No description')}")

            # Take action based on threat type
            if threat_type == "malicious_contract":
                await self.block_contract(address)
            elif threat_type == "honeypot":
                await self.alert_users(address)

    async def block_contract(self, address: str):
        """Block a malicious contract"""
        print(f"🚫 Blocking malicious contract: {address}")
        # Implement blocking logic here

    async def alert_users(self, address: str):
        """Alert users about honeypot"""
        print(f"⚠️  Alerting users about honeypot: {address}")
        # Implement user alerting logic here


async def main():
    """Main integration example"""
    print("🎯 Unified Mempool System Integration Example")
    print("=" * 50)

    # Initialize client
    async with MempoolIntegrationClient() as client:
        # Check system status
        print("\n1. Checking system status...")
        status = await client.get_system_status()
        print(f"   Status: {status.get('status', 'Unknown')}")
        print(f"   Networks: {len(status.get('networks', {}))}")

        # Get recent transactions
        print("\n2. Getting recent transactions...")
        transactions = await client.get_transactions(limit=10)
        print(f"   Found {len(transactions.get('transactions', []))} transactions")

        # Get MEV opportunities
        print("\n3. Getting MEV opportunities...")
        opportunities = await client.get_mev_opportunities()
        print(f"   Found {len(opportunities.get('opportunities', []))} opportunities")

        # Get threats
        print("\n4. Getting threat intelligence...")
        threats = await client.get_threats(severity="high")
        print(f"   Found {len(threats.get('threats', []))} high-severity threats")

        # Start trading bot (simulated)
        print("\n5. Starting trading bot simulation...")
        bot = TradingBot(client)

        # Start security monitor (simulated)
        print("\n6. Starting security monitor simulation...")
        monitor = SecurityMonitor(client)

        # Run for a short time to demonstrate
        try:
            await asyncio.wait_for(bot.start(), timeout=30)
        except asyncio.TimeoutError:
            print("\n⏰ Demo completed (30 seconds)")

        print("\n✅ Integration example completed!")


if __name__ == "__main__":
    asyncio.run(main())
