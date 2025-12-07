"""Container tests for Mempool Monitoring Service"""

import asyncio
import json

import httpx
import pytest


class TestMempoolContainer:
    """Test actual mempool service container functionality"""

    BASE_URL = "http://localhost:8005"

    @pytest.fixture
    async def client(self):
        """Create async HTTP client"""
        async with httpx.AsyncClient(base_url=self.BASE_URL, timeout=30.0) as client:
            yield client

    @pytest.mark.asyncio
    async def test_mempool_pending_transactions(self, client):
        """Test pending transaction monitoring"""
        response = await client.get("/pending")
        assert response.status_code == 200

        data = response.json()
        assert "transactions" in data
        assert "count" in data
        assert "total_value" in data
        assert isinstance(data["transactions"], list)

    @pytest.mark.asyncio
    async def test_mempool_analysis(self, client):
        """Test mempool analysis capabilities"""
        # Request mempool analysis
        response = await client.post(
            "/analyze",
            json={
                "depth": 100,
                "include_gas_analysis": True,
                "include_mev_opportunities": True,
            },
        )
        assert response.status_code == 200

        analysis = response.json()
        assert "gas_price_distribution" in analysis
        assert "transaction_types" in analysis
        assert "mev_opportunities" in analysis
        assert "network_congestion" in analysis

    @pytest.mark.asyncio
    async def test_mempool_priority_detection(self, client):
        """Test priority transaction detection"""
        response = await client.get("/priority?min_gas_price=100")
        assert response.status_code == 200

        priority_txs = response.json()
        assert "high_priority" in priority_txs
        assert "medium_priority" in priority_txs
        assert "total_count" in priority_txs

        # All high priority should have high gas price
        for tx in priority_txs.get("high_priority", []):
            assert float(tx.get("gas_price", 0)) >= 100

    @pytest.mark.asyncio
    async def test_mempool_websocket_stream(self, client):
        """Test real-time mempool streaming"""
        import websockets

        ws_url = "ws://localhost:8005/ws/mempool"

        try:
            async with websockets.connect(ws_url) as websocket:
                # Subscribe to mempool updates
                await websocket.send(
                    json.dumps(
                        {
                            "action": "subscribe",
                            "filters": {
                                "min_value": 0.1,
                                "include_token_transfers": True,
                            },
                        }
                    )
                )

                # Wait for mempool updates
                message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                assert message is not None

                data = json.loads(message)
                assert "type" in data
                assert data["type"] in [
                    "new_transaction",
                    "transaction_update",
                    "transaction_removed",
                ]

        except asyncio.TimeoutError:
            pytest.skip("No mempool updates in timeout period")

    @pytest.mark.asyncio
    async def test_mempool_filtering(self, client):
        """Test mempool filtering capabilities"""
        # Test various filters
        filters = {
            "from_address": "0x1234567890abcdef",
            "to_address": None,
            "min_value": 1.0,
            "max_value": 100.0,
            "token_addresses": ["0xUSDC", "0xDAI"],
            "exclude_failed": True,
        }

        response = await client.post("/pending/filter", json=filters)
        assert response.status_code == 200

        filtered = response.json()
        assert "transactions" in filtered
        assert "applied_filters" in filtered
        assert filtered["applied_filters"]["min_value"] == 1.0

    @pytest.mark.asyncio
    async def test_mempool_statistics(self, client):
        """Test mempool statistics endpoint"""
        response = await client.get("/stats?window=5m")
        assert response.status_code == 200

        stats = response.json()
        assert "avg_gas_price" in stats
        assert "median_gas_price" in stats
        assert "transaction_rate" in stats
        assert "avg_wait_time" in stats
        assert "gas_price_trend" in stats
        assert stats["window"] == "5m"
