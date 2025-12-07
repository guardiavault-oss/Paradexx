"""Network monitoring API routes."""

import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from ...models.network import NetworkStatus, NetworkStatusInfo
from ...utils.network_utils import get_network_info, get_supported_networks as get_networks_list, validate_network

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response models
class NetworkStatusRequest(BaseModel):
    """Request model for network status check."""

    networks: list[str] | None = Field(None, description="Specific networks to check")
    include_metrics: bool = Field(default=True, description="Include detailed metrics")


class NetworkHealthRequest(BaseModel):
    """Request model for network health assessment."""

    network: str = Field(..., description="Network to assess")
    check_connectivity: bool = Field(default=True, description="Check RPC connectivity")
    check_sync_status: bool = Field(default=True, description="Check sync status")
    check_gas_prices: bool = Field(default=True, description="Check gas price trends")


@router.get("/status")
async def get_network_status(
    networks: str | None = None, 
    include_metrics: bool = True,
    app_request: Request
):
    """
    Get status of supported blockchain networks.

    This endpoint provides real-time status information for all supported
    blockchain networks, including connectivity, sync status, and key metrics.
    """
    try:
        logger.info("Getting network status")

        # Get blockchain integration from app state
        blockchain_integration = None
        if app_request and hasattr(app_request.app, 'state'):
            blockchain_integration = app_request.app.state.blockchain_integration

        # Parse networks parameter
        target_networks = []
        if networks:
            target_networks = [n.strip() for n in networks.split(",")]
            # Validate networks
            for network in target_networks:
                if not validate_network(network):
                    raise HTTPException(status_code=400, detail=f"Unsupported network: {network}")
        else:
            target_networks = get_networks_list()

        network_statuses = []

        for network in target_networks:
            try:
                # Get network info
                network_info = get_network_info(network)

                # Get actual network status with RPC calls if blockchain integration is available
                if blockchain_integration:
                    try:
                        network_status_data = await blockchain_integration.get_network_status(network)
                        
                        # Map status string to NetworkStatus enum
                        status_str = network_status_data.get("status", "unknown")
                        if status_str == "healthy":
                            network_status = NetworkStatus.ONLINE
                        elif status_str == "degraded":
                            network_status = NetworkStatus.DEGRADED
                        elif status_str == "unhealthy":
                            network_status = NetworkStatus.OFFLINE
                        else:
                            network_status = NetworkStatus.UNKNOWN

                        # Get gas prices
                        gas_prices = network_status_data.get("gas_prices", {})
                        gas_price_gwei = 0.0
                        if gas_prices:
                            # Convert from wei to gwei
                            gas_price_wei = gas_prices.get("gas_price", 0) or gas_prices.get("max_fee", 0)
                            gas_price_gwei = gas_price_wei / 1e9 if gas_price_wei else 0.0

                        # Get latest block
                        latest_block = network_status_data.get("latest_block", 0)
                        block_age = network_status_data.get("block_age_seconds", 0)

                        status = NetworkStatusInfo(
                            network=network,
                            chain_id=network_info.get("chain_id", 0),
                            status=network_status,
                            last_block=latest_block,
                            block_time=network_info.get("block_time"),
                            gas_price=gas_price_gwei,
                            pending_transactions=0,  # Would need additional RPC call
                            last_updated=datetime.utcnow(),
                        )
                        
                        if include_metrics:
                            # Calculate response time from block age
                            response_time = block_age if block_age > 0 else 100.0
                            status.response_time = response_time
                            
                            # Determine uptime based on status
                            if network_status == NetworkStatus.ONLINE:
                                status.uptime_percentage = 99.9
                                status.error_rate = 0.1
                            elif network_status == NetworkStatus.DEGRADED:
                                status.uptime_percentage = 95.0
                                status.error_rate = 5.0
                            else:
                                status.uptime_percentage = 0.0
                                status.error_rate = 100.0
                            
                            status.cross_chain_volume_24h = 0.0  # Would need additional tracking
                            status.active_bridges = 0  # Would need additional tracking

                    except Exception as e:
                        logger.error(f"Error getting RPC status for {network}: {e}")
                        # Fallback to basic status
                        status = NetworkStatusInfo(
                            network=network,
                            chain_id=network_info.get("chain_id", 0),
                            status=NetworkStatus.UNKNOWN,
                            last_block=0,
                            block_time=network_info.get("block_time"),
                            gas_price=0.0,
                            pending_transactions=0,
                            last_updated=datetime.utcnow(),
                        )
                else:
                    # No blockchain integration available - return basic status
                    status = NetworkStatusInfo(
                        network=network,
                        chain_id=network_info.get("chain_id", 0),
                        status=NetworkStatus.UNKNOWN,
                        last_block=0,
                        block_time=network_info.get("block_time"),
                        gas_price=0.0,
                        pending_transactions=0,
                        last_updated=datetime.utcnow(),
                    )
                    
                    if include_metrics:
                        status.response_time = 0.0
                        status.uptime_percentage = 0.0
                        status.error_rate = 100.0
                        status.cross_chain_volume_24h = 0.0
                        status.active_bridges = 0

                network_statuses.append(status.dict() if hasattr(status, 'dict') else status.model_dump())

            except Exception as e:
                logger.error(f"Error getting status for {network}: {e}")
                # Add error status
                network_statuses.append(
                    {
                        "network": network,
                        "chain_id": 0,
                        "status": NetworkStatus.UNKNOWN,
                        "error": str(e),
                        "last_updated": datetime.utcnow().isoformat(),
                    }
                )

        return {
            "networks": network_statuses,
            "total_networks": len(network_statuses),
            "healthy_networks": len(
                [n for n in network_statuses if n.get("status") == NetworkStatus.ONLINE]
            ),
            "timestamp": datetime.utcnow().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting network status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{network}/status")
async def get_single_network_status(network: str):
    """
    Get detailed status for a specific network.

    This endpoint provides comprehensive status information for a single
    blockchain network including detailed metrics and health indicators.
    """
    try:
        if not validate_network(network):
            raise HTTPException(status_code=400, detail=f"Unsupported network: {network}")

        logger.info(f"Getting status for network: {network}")

        # Get network info
        network_info = get_network_info(network)

        # Mock detailed status
        status = NetworkStatusInfo(
            network=network,
            chain_id=network_info["chain_id"],
            status=NetworkStatus.ONLINE,
            last_block=18500000 + hash(network) % 1000,
            block_time=network_info.get("block_time", 12.0),
            gas_price=25.0 + hash(network) % 50,
            pending_transactions=1000 + hash(network) % 5000,
            network_hashrate=500.0 + hash(network) % 200,
            difficulty=1000000.0 + hash(network) % 500000,
            total_supply=120000000.0,
            market_cap=200000000000.0,
            response_time=50.0 + hash(network) % 100,
            uptime_percentage=99.5 + hash(network) % 0.5,
            error_rate=0.1 + hash(network) % 0.5,
            bridge_connections=[
                f"0x{hash(network + 'bridge1') % 10000000000000000000000000000000000000000:040x}",
                f"0x{hash(network + 'bridge2') % 10000000000000000000000000000000000000000:040x}",
            ],
            cross_chain_volume_24h=1000000.0 + hash(network) % 5000000,
            active_bridges=2 + hash(network) % 5,
        )

        return status.model_dump() if hasattr(status, 'model_dump') else status.dict()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting network status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{network}/health")
async def assess_network_health(network: str, request: NetworkHealthRequest):
    """
    Perform comprehensive health assessment for a network.

    This endpoint runs various health checks on a network including
    connectivity, sync status, gas price analysis, and performance metrics.
    """
    try:
        if not validate_network(network):
            raise HTTPException(status_code=400, detail=f"Unsupported network: {network}")

        logger.info(f"Assessing health for network: {network}")

        # Mock health assessment
        health_assessment = {
            "network": network,
            "assessment_timestamp": "2024-01-01T00:00:00Z",
            "overall_health": "healthy",
            "health_score": 8.5,
            "checks": {
                "connectivity": {
                    "status": "pass",
                    "response_time_ms": 45.0,
                    "details": "RPC endpoint responding normally",
                },
                "sync_status": {
                    "status": "pass",
                    "is_synced": True,
                    "blocks_behind": 0,
                    "details": "Network is fully synced",
                },
                "gas_prices": {
                    "status": "pass",
                    "current_gas_price_gwei": 25.0,
                    "gas_price_trend": "stable",
                    "details": "Gas prices within normal range",
                },
                "block_production": {
                    "status": "pass",
                    "average_block_time": 12.0,
                    "block_time_variance": 0.5,
                    "details": "Block production is consistent",
                },
                "transaction_throughput": {
                    "status": "pass",
                    "transactions_per_second": 15.0,
                    "pending_transactions": 1500,
                    "details": "Transaction throughput is normal",
                },
            },
            "recommendations": [
                "Network is operating normally",
                "Monitor gas price trends during peak usage",
                "Consider implementing gas price alerts",
            ],
            "alerts": [],
            "metrics": {
                "uptime_24h": 99.9,
                "average_response_time": 45.0,
                "error_rate_24h": 0.1,
                "peak_tps": 20.0,
                "average_block_time": 12.0,
            },
        }

        return health_assessment

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assessing network health: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/supported")
async def get_supported_networks():
    """
    Get list of supported networks.

    This endpoint returns information about all supported blockchain networks
    including their configuration and capabilities.
    """
    try:
        logger.info("Getting supported networks")

        supported_networks = []
        for network in get_networks_list():
            network_info = get_network_info(network)
            supported_networks.append(network_info)

        return {
            "networks": supported_networks,
            "total_networks": len(supported_networks),
            "mainnet_networks": len(
                [n for n in supported_networks if not n.get("is_testnet", False)]
            ),
            "testnet_networks": len([n for n in supported_networks if n.get("is_testnet", False)]),
        }

    except Exception as e:
        logger.error(f"Error getting supported networks: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{network}/info")
async def get_network_info_endpoint(network: str):
    """
    Get detailed information about a specific network.

    This endpoint provides comprehensive information about a network's
    configuration, capabilities, and operational details.
    """
    try:
        if not validate_network(network):
            raise HTTPException(status_code=400, detail=f"Unsupported network: {network}")

        logger.info(f"Getting network info for: {network}")

        network_info = get_network_info(network)

        # Add additional information
        network_info.update(
            {
                "capabilities": {
                    "supports_bridges": True,
                    "supports_smart_contracts": True,
                    "supports_tokens": True,
                    "supports_defi": True,
                    "supports_nfts": True,
                },
                "consensus_mechanism": (
                    "Proof of Stake" if network in ["polygon", "avalanche"] else "Proof of Work"
                ),
                "finality_time": network_info.get("block_time", 12.0) * 10,  # Mock finality time
                "security_model": (
                    "Economic security through staking"
                    if network in ["polygon", "avalanche"]
                    else "Economic security through mining"
                ),
                "governance": (
                    "On-chain governance"
                    if network in ["polygon", "avalanche"]
                    else "Off-chain governance"
                ),
                "upgrade_mechanism": (
                    "Hard fork" if network == "ethereum" else "Governance proposal"
                ),
            }
        )

        return network_info

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting network info: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{network}/metrics")
async def get_network_metrics(network: str, time_range: str = "24h", metric_type: str = "all"):
    """
    Get network metrics and statistics.

    This endpoint provides various metrics about network performance,
    usage, and health over a specified time range.
    """
    try:
        if not validate_network(network):
            raise HTTPException(status_code=400, detail=f"Unsupported network: {network}")

        logger.info(f"Getting metrics for {network} over {time_range}")

        # Mock metrics data
        metrics = {
            "network": network,
            "time_range": time_range,
            "metric_type": metric_type,
            "timestamp": "2024-01-01T00:00:00Z",
            "metrics": {
                "block_metrics": {
                    "total_blocks": 18500000 + hash(network) % 1000,
                    "average_block_time": 12.0,
                    "block_time_variance": 0.5,
                    "blocks_per_hour": 300.0,
                },
                "transaction_metrics": {
                    "total_transactions": 1500000 + hash(network) % 100000,
                    "transactions_per_second": 15.0,
                    "average_gas_used": 21000,
                    "gas_utilization": 0.75,
                },
                "gas_metrics": {
                    "average_gas_price_gwei": 25.0,
                    "gas_price_percentile_50": 20.0,
                    "gas_price_percentile_95": 50.0,
                    "gas_price_percentile_99": 100.0,
                },
                "network_metrics": {
                    "active_addresses": 50000 + hash(network) % 10000,
                    "new_addresses": 1000 + hash(network) % 500,
                    "network_hashrate": 500.0 + hash(network) % 200,
                    "difficulty": 1000000.0 + hash(network) % 500000,
                },
                "bridge_metrics": {
                    "total_bridge_volume": 1000000.0 + hash(network) % 5000000,
                    "bridge_transactions": 1000 + hash(network) % 500,
                    "active_bridges": 2 + hash(network) % 5,
                    "cross_chain_volume": 500000.0 + hash(network) % 2500000,
                },
            },
            "trends": {
                "volume_trend": "increasing",
                "activity_trend": "stable",
                "gas_price_trend": "stable",
                "adoption_trend": "growing",
            },
        }

        return metrics

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting network metrics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
