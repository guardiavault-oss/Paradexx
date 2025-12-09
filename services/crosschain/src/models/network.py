"""Network-related data models."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class NetworkType(str, Enum):
    """Types of blockchain networks."""

    MAINNET = "mainnet"
    TESTNET = "testnet"
    LAYER_2 = "layer_2"
    SIDECHAIN = "sidechain"
    PRIVATE = "private"


class NetworkStatus(str, Enum):
    """Network status indicators."""

    ONLINE = "online"
    OFFLINE = "offline"
    DEGRADED = "degraded"
    MAINTENANCE = "maintenance"
    UNKNOWN = "unknown"


class Network(BaseModel):
    """Blockchain network model."""

    name: str = Field(..., description="Network name")
    chain_id: int = Field(..., description="Chain ID")
    type: NetworkType = Field(..., description="Network type")
    rpc_url: str = Field(..., description="RPC endpoint URL")
    explorer_url: str | None = Field(None, description="Block explorer URL")
    native_token: str = Field(..., description="Native token symbol")
    block_time: float | None = Field(None, description="Average block time in seconds")
    gas_limit: int | None = Field(None, description="Block gas limit")
    is_testnet: bool = Field(default=False, description="Whether this is a testnet")
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())


class NetworkStatusInfo(BaseModel):
    """Network status information."""

    network: str = Field(..., description="Network name")
    chain_id: int = Field(..., description="Chain ID")
    status: NetworkStatus = Field(..., description="Current network status")
    last_block: int | None = Field(None, description="Latest block number")
    block_time: float | None = Field(None, description="Current block time")
    gas_price: float | None = Field(None, description="Current gas price in Gwei")
    pending_transactions: int | None = Field(None, description="Number of pending transactions")
    network_hashrate: float | None = Field(None, description="Network hashrate")
    difficulty: float | None = Field(None, description="Current difficulty")
    total_supply: float | None = Field(None, description="Total token supply")
    market_cap: float | None = Field(None, description="Market capitalization")
    last_updated: datetime = Field(default_factory=lambda: datetime.now())

    # Health metrics
    response_time: float | None = Field(None, description="RPC response time in ms")
    uptime_percentage: float | None = Field(None, description="Network uptime percentage")
    error_rate: float | None = Field(None, description="Error rate percentage")

    # Cross-chain specific metrics
    bridge_connections: list[str] = Field(
        default_factory=list, description="Connected bridge addresses"
    )
    cross_chain_volume_24h: float | None = Field(None, description="24h cross-chain volume")
    active_bridges: int | None = Field(None, description="Number of active bridges")
