"""Network utility functions."""

import logging
from typing import Any

logger = logging.getLogger(__name__)

# Supported networks configuration
SUPPORTED_NETWORKS = {
    "ethereum": {
        "chain_id": 1,
        "name": "Ethereum Mainnet",
        "rpc_url": "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",
        "explorer_url": "https://etherscan.io",
        "native_token": "ETH",
        "block_time": 12.0,
        "gas_limit": 30000000,
        "is_testnet": False,
    },
    "polygon": {
        "chain_id": 137,
        "name": "Polygon Mainnet",
        "rpc_url": "https://polygon-rpc.com",
        "explorer_url": "https://polygonscan.com",
        "native_token": "MATIC",
        "block_time": 2.0,
        "gas_limit": 30000000,
        "is_testnet": False,
    },
    "bsc": {
        "chain_id": 56,
        "name": "Binance Smart Chain",
        "rpc_url": "https://bsc-dataseed.binance.org",
        "explorer_url": "https://bscscan.com",
        "native_token": "BNB",
        "block_time": 3.0,
        "gas_limit": 30000000,
        "is_testnet": False,
    },
    "avalanche": {
        "chain_id": 43114,
        "name": "Avalanche C-Chain",
        "rpc_url": "https://api.avax.network/ext/bc/C/rpc",
        "explorer_url": "https://snowtrace.io",
        "native_token": "AVAX",
        "block_time": 2.0,
        "gas_limit": 8000000,
        "is_testnet": False,
    },
    "arbitrum": {
        "chain_id": 42161,
        "name": "Arbitrum One",
        "rpc_url": "https://arb1.arbitrum.io/rpc",
        "explorer_url": "https://arbiscan.io",
        "native_token": "ETH",
        "block_time": 0.25,
        "gas_limit": 100000000,
        "is_testnet": False,
    },
    "optimism": {
        "chain_id": 10,
        "name": "Optimism",
        "rpc_url": "https://mainnet.optimism.io",
        "explorer_url": "https://optimistic.etherscan.io",
        "native_token": "ETH",
        "block_time": 2.0,
        "gas_limit": 30000000,
        "is_testnet": False,
    },
    # Testnets
    "goerli": {
        "chain_id": 5,
        "name": "Goerli Testnet",
        "rpc_url": "https://goerli.infura.io/v3/YOUR_PROJECT_ID",
        "explorer_url": "https://goerli.etherscan.io",
        "native_token": "ETH",
        "block_time": 12.0,
        "gas_limit": 30000000,
        "is_testnet": True,
    },
    "mumbai": {
        "chain_id": 80001,
        "name": "Polygon Mumbai",
        "rpc_url": "https://rpc-mumbai.maticvigil.com",
        "explorer_url": "https://mumbai.polygonscan.com",
        "native_token": "MATIC",
        "block_time": 2.0,
        "gas_limit": 30000000,
        "is_testnet": True,
    },
}


def get_network_config(network: str) -> dict[str, Any]:
    """Get configuration for a specific network."""
    if network not in SUPPORTED_NETWORKS:
        raise ValueError(f"Unsupported network: {network}")

    return SUPPORTED_NETWORKS[network].copy()


def get_supported_networks() -> list[str]:
    """Get list of supported networks."""
    return list(SUPPORTED_NETWORKS.keys())


def get_mainnet_networks() -> list[str]:
    """Get list of mainnet networks only."""
    return [
        network
        for network, config in SUPPORTED_NETWORKS.items()
        if not config.get("is_testnet", False)
    ]


def get_testnet_networks() -> list[str]:
    """Get list of testnet networks only."""
    return [
        network for network, config in SUPPORTED_NETWORKS.items() if config.get("is_testnet", False)
    ]


def is_testnet(network: str) -> bool:
    """Check if a network is a testnet."""
    config = get_network_config(network)
    return config.get("is_testnet", False)


def get_chain_id(network: str) -> int:
    """Get chain ID for a network."""
    config = get_network_config(network)
    return config["chain_id"]


def get_explorer_url(network: str) -> str | None:
    """Get block explorer URL for a network."""
    config = get_network_config(network)
    return config.get("explorer_url")


def get_native_token(network: str) -> str:
    """Get native token symbol for a network."""
    config = get_network_config(network)
    return config["native_token"]


def get_block_time(network: str) -> float | None:
    """Get average block time for a network."""
    config = get_network_config(network)
    return config.get("block_time")


def get_gas_limit(network: str) -> int | None:
    """Get block gas limit for a network."""
    config = get_network_config(network)
    return config.get("gas_limit")


def validate_network(network: str) -> bool:
    """Validate if a network is supported."""
    return network in SUPPORTED_NETWORKS


def get_network_info(network: str) -> dict[str, Any]:
    """Get comprehensive network information."""
    if not validate_network(network):
        raise ValueError(f"Unsupported network: {network}")

    config = get_network_config(network)

    return {
        "name": config["name"],
        "chain_id": config["chain_id"],
        "network": network,
        "is_testnet": config.get("is_testnet", False),
        "native_token": config["native_token"],
        "block_time": config.get("block_time"),
        "gas_limit": config.get("gas_limit"),
        "explorer_url": config.get("explorer_url"),
        "rpc_url": config["rpc_url"],
    }
