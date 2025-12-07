#!/usr/bin/env python3
"""
Advanced Blockchain Integration Module
Real-time blockchain monitoring with multiple RPC providers and failover
"""

import asyncio
import time
from dataclasses import dataclass
from enum import Enum
from typing import Any

import structlog
from eth_utils import to_checksum_address
from web3 import Web3

# For web3.py v5.x (older version compatibility)
try:
    from web3.middleware import geth_poa_middleware
except ImportError:
    # For web3.py v6+
    try:
        from web3.middleware import ExtraDataToPOAMiddleware as geth_poa_middleware
    except ImportError:
        # Fallback for very old versions
        geth_poa_middleware = None

from config.settings import settings

logger = structlog.get_logger(__name__)


class ConnectionStatus(Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    CONNECTING = "connecting"


@dataclass
class BlockData:
    number: int
    hash: str
    timestamp: int
    transactions: list[dict[str, Any]]
    gas_used: int
    gas_limit: int
    base_fee_per_gas: int | None = None


@dataclass
class TransactionData:
    hash: str
    from_address: str
    to_address: str
    value: int
    gas: int
    gas_price: int
    nonce: int
    block_number: int | None = None
    status: str | None = None
    gas_used: int | None = None


@dataclass
class MempoolTransaction:
    hash: str
    from_address: str
    to_address: str
    value: int
    gas: int
    gas_price: int
    nonce: int
    timestamp: float
    pending: bool = True


class BlockchainProvider:
    """Advanced blockchain provider with failover and load balancing"""

    def __init__(self, network: str, rpc_urls: list[str]):
        self.network = network
        self.rpc_urls = rpc_urls
        self.current_provider_index = 0
        self.web3_instances: list[Web3] = []
        self.connection_status: dict[str, ConnectionStatus] = {}
        self.last_successful_request = {}
        self.request_counts = {}
        self.error_counts = {}

        # Initialize Web3 instances
        self._initialize_web3_instances()

        # Health monitoring will be started when needed
        self._monitoring_task = None

    def _initialize_web3_instances(self):
        """Initialize Web3 instances for all RPC URLs"""
        for i, rpc_url in enumerate(self.rpc_urls):
            try:
                w3 = Web3(
                    Web3.HTTPProvider(
                        rpc_url,
                        request_kwargs={
                            "timeout": settings.request_timeout,
                            "headers": {"User-Agent": f"WalletGuard/{settings.service_version}"},
                        },
                    )
                )

                # Add PoA middleware for networks that need it
                if self.network in ["bsc", "polygon", "avalanche"]:
                    w3.middleware_onion.inject(geth_poa_middleware, layer=0)

                self.web3_instances.append(w3)
                self.connection_status[rpc_url] = ConnectionStatus.DISCONNECTED
                self.last_successful_request[rpc_url] = 0
                self.request_counts[rpc_url] = 0
                self.error_counts[rpc_url] = 0

                logger.info(
                    f"Initialized Web3 instance for {self.network}", rpc_url=rpc_url, index=i
                )

            except Exception as e:
                logger.error(
                    "Failed to initialize Web3 instance",
                    network=self.network,
                    rpc_url=rpc_url,
                    error=str(e),
                )
                self.connection_status[rpc_url] = ConnectionStatus.ERROR

    def start_monitoring(self):
        """Start health monitoring (call this when event loop is running)"""
        if self._monitoring_task is None:
            try:
                self._monitoring_task = asyncio.create_task(self._monitor_connections())
            except RuntimeError:
                # No event loop running, monitoring will start later
                pass

    async def _monitor_connections(self):
        """Monitor connection health and switch providers if needed"""
        while True:
            try:
                await self._check_all_connections()
                await asyncio.sleep(30)  # Check every 30 seconds
            except Exception as e:
                logger.error("Error in connection monitoring", network=self.network, error=str(e))
                await asyncio.sleep(60)

    async def _check_all_connections(self):
        """Check all provider connections"""
        tasks = []
        for i, w3 in enumerate(self.web3_instances):
            task = self._check_connection(i, w3)
            tasks.append(task)

        await asyncio.gather(*tasks, return_exceptions=True)

    async def _check_connection(self, index: int, w3: Web3):
        """Check individual connection health"""
        rpc_url = self.rpc_urls[index]

        try:
            # Test connection with a simple call
            latest_block = w3.eth.block_number

            if latest_block > 0:
                self.connection_status[rpc_url] = ConnectionStatus.CONNECTED
                self.last_successful_request[rpc_url] = time.time()
                logger.debug(
                    "Connection healthy", network=self.network, rpc_url=rpc_url, block=latest_block
                )
            else:
                self.connection_status[rpc_url] = ConnectionStatus.ERROR
                self.error_counts[rpc_url] += 1

        except Exception as e:
            self.connection_status[rpc_url] = ConnectionStatus.ERROR
            self.error_counts[rpc_url] += 1
            logger.warning(
                "Connection check failed", network=self.network, rpc_url=rpc_url, error=str(e)
            )

    def get_best_provider(self) -> tuple[Web3, int]:
        """Get the best available provider based on health and performance"""
        # Find healthy providers
        healthy_providers = []
        for i, rpc_url in enumerate(self.rpc_urls):
            if (
                self.connection_status[rpc_url] == ConnectionStatus.CONNECTED
                and self.error_counts[rpc_url] < 5
            ):
                healthy_providers.append((i, rpc_url))

        if not healthy_providers:
            # Fallback to first provider if none are healthy
            logger.warning("No healthy providers found, using first provider", network=self.network)
            return self.web3_instances[0], 0

        # Sort by error count and request success rate
        healthy_providers.sort(key=lambda x: (self.error_counts[x[1]], -self.request_counts[x[1]]))

        best_index, best_rpc_url = healthy_providers[0]
        return self.web3_instances[best_index], best_index

    async def get_latest_block(self) -> BlockData:
        """Get the latest block data"""
        w3, provider_index = self.get_best_provider()
        rpc_url = self.rpc_urls[provider_index]

        try:
            latest_block_number = w3.eth.block_number
            block = w3.eth.get_block(latest_block_number, full_transactions=True)

            # Update request counts
            self.request_counts[rpc_url] += 1

            return BlockData(
                number=block.number,
                hash=block.hash.hex(),
                timestamp=block.timestamp,
                transactions=[dict(tx) for tx in block.transactions],
                gas_used=block.gasUsed,
                gas_limit=block.gasLimit,
                base_fee_per_gas=getattr(block, "baseFeePerGas", None),
            )

        except Exception as e:
            self.error_counts[rpc_url] += 1
            logger.error(
                "Failed to get latest block", network=self.network, rpc_url=rpc_url, error=str(e)
            )
            raise

    async def get_block(self, block_number: int) -> BlockData:
        """Get specific block data"""
        w3, provider_index = self.get_best_provider()
        rpc_url = self.rpc_urls[provider_index]

        try:
            block = w3.eth.get_block(block_number, full_transactions=True)

            # Update request counts
            self.request_counts[rpc_url] += 1

            return BlockData(
                number=block.number,
                hash=block.hash.hex(),
                timestamp=block.timestamp,
                transactions=[dict(tx) for tx in block.transactions],
                gas_used=block.gasUsed,
                gas_limit=block.gasLimit,
                base_fee_per_gas=getattr(block, "baseFeePerGas", None),
            )

        except Exception as e:
            self.error_counts[rpc_url] += 1
            logger.error(
                f"Failed to get block {block_number}",
                network=self.network,
                rpc_url=rpc_url,
                error=str(e),
            )
            raise

    async def get_transaction(self, tx_hash: str) -> TransactionData:
        """Get transaction data"""
        w3, provider_index = self.get_best_provider()
        rpc_url = self.rpc_urls[provider_index]

        try:
            tx = w3.eth.get_transaction(tx_hash)
            tx_receipt = w3.eth.get_transaction_receipt(tx_hash)

            # Update request counts
            self.request_counts[rpc_url] += 1

            return TransactionData(
                hash=tx.hash.hex(),
                from_address=tx["from"],
                to_address=tx.to,
                value=tx.value,
                gas=tx.gas,
                gas_price=tx.gasPrice,
                nonce=tx.nonce,
                block_number=tx_receipt.blockNumber,
                status=tx_receipt.status,
                gas_used=tx_receipt.gasUsed,
            )

        except Exception as e:
            self.error_counts[rpc_url] += 1
            logger.error(
                f"Failed to get transaction {tx_hash}",
                network=self.network,
                rpc_url=rpc_url,
                error=str(e),
            )
            raise

    async def get_balance(self, address: str) -> int:
        """Get wallet balance"""
        w3, provider_index = self.get_best_provider()
        rpc_url = self.rpc_urls[provider_index]

        try:
            balance = w3.eth.get_balance(to_checksum_address(address))

            # Update request counts
            self.request_counts[rpc_url] += 1

            return balance

        except Exception as e:
            self.error_counts[rpc_url] += 1
            logger.error(
                f"Failed to get balance for {address}",
                network=self.network,
                rpc_url=rpc_url,
                error=str(e),
            )
            raise

    async def get_transaction_count(self, address: str) -> int:
        """Get transaction count (nonce)"""
        w3, provider_index = self.get_best_provider()
        rpc_url = self.rpc_urls[provider_index]

        try:
            tx_count = w3.eth.get_transaction_count(to_checksum_address(address))

            # Update request counts
            self.request_counts[rpc_url] += 1

            return tx_count

        except Exception as e:
            self.error_counts[rpc_url] += 1
            logger.error(
                f"Failed to get transaction count for {address}",
                network=self.network,
                rpc_url=rpc_url,
                error=str(e),
            )
            raise

    async def get_code(self, address: str) -> bytes:
        """Get contract code"""
        w3, provider_index = self.get_best_provider()
        rpc_url = self.rpc_urls[provider_index]

        try:
            code = w3.eth.get_code(to_checksum_address(address))

            # Update request counts
            self.request_counts[rpc_url] += 1

            return code

        except Exception as e:
            self.error_counts[rpc_url] += 1
            logger.error(
                f"Failed to get code for {address}",
                network=self.network,
                rpc_url=rpc_url,
                error=str(e),
            )
            raise

    def get_connection_stats(self) -> dict[str, Any]:
        """Get connection statistics"""
        return {
            "network": self.network,
            "total_providers": len(self.rpc_urls),
            "healthy_providers": sum(
                1
                for status in self.connection_status.values()
                if status == ConnectionStatus.CONNECTED
            ),
            "connection_status": {
                url: status.value for url, status in self.connection_status.items()
            },
            "request_counts": self.request_counts.copy(),
            "error_counts": self.error_counts.copy(),
            "last_successful_request": self.last_successful_request.copy(),
        }


class BlockchainManager:
    """Manages multiple blockchain networks"""

    def __init__(self):
        self.providers: dict[str, BlockchainProvider] = {}
        self.mempool_monitors: dict[str, MempoolMonitor] = {}
        self.block_monitors: dict[str, BlockMonitor] = {}

        # Initialize providers for all supported networks
        self._initialize_providers()

        # Monitoring will be started when needed
        self._monitoring_started = False

    def _initialize_providers(self):
        """Initialize blockchain providers for all supported networks"""
        for network in settings.get_supported_networks():
            rpc_urls = settings.blockchain_rpc_urls.get(network, [])
            if rpc_urls:
                self.providers[network] = BlockchainProvider(network, rpc_urls)
                logger.info(
                    "Initialized blockchain provider", network=network, rpc_count=len(rpc_urls)
                )

    async def start_monitoring(self):
        """Start monitoring tasks for all networks"""
        if self._monitoring_started:
            return

        self._monitoring_started = True

        # Start provider monitoring
        for provider in self.providers.values():
            provider.start_monitoring()

        # Start other monitoring tasks
        await self._start_monitoring()

    async def _start_monitoring(self):
        """Start monitoring tasks for all networks"""
        if settings.enable_mempool_monitoring:
            for network in self.providers.keys():
                self.mempool_monitors[network] = MempoolMonitor(network, self.providers[network])
                await self.mempool_monitors[network].start()

        for network in self.providers.keys():
            self.block_monitors[network] = BlockMonitor(network, self.providers[network])
            await self.block_monitors[network].start()

    def get_provider(self, network: str) -> BlockchainProvider | None:
        """Get blockchain provider for specific network"""
        return self.providers.get(network)

    async def get_balance(self, address: str, network: str) -> int:
        """Get balance across multiple networks"""
        provider = self.get_provider(network)
        if not provider:
            raise ValueError(f"Unsupported network: {network}")

        return await provider.get_balance(address)

    async def get_transaction_count(self, address: str, network: str) -> int:
        """Get transaction count across multiple networks"""
        provider = self.get_provider(network)
        if not provider:
            raise ValueError(f"Unsupported network: {network}")

        return await provider.get_transaction_count(address)

    async def get_code(self, address: str, network: str) -> bytes:
        """Get contract code across multiple networks"""
        provider = self.get_provider(network)
        if not provider:
            raise ValueError(f"Unsupported network: {network}")

        return await provider.get_code(address)

    def get_all_stats(self) -> dict[str, Any]:
        """Get statistics for all networks"""
        stats = {}
        for network, provider in self.providers.items():
            stats[network] = provider.get_connection_stats()

        return stats


class MempoolMonitor:
    """Monitor mempool for pending transactions"""

    def __init__(self, network: str, provider: BlockchainProvider):
        self.network = network
        self.provider = provider
        self.pending_transactions: dict[str, MempoolTransaction] = {}
        self.callbacks: list[callable] = []
        self.running = False

    async def start(self):
        """Start mempool monitoring"""
        self.running = True
        asyncio.create_task(self._monitor_mempool())
        logger.info("Started mempool monitoring", network=self.network)

    async def stop(self):
        """Stop mempool monitoring"""
        self.running = False
        logger.info("Stopped mempool monitoring", network=self.network)

    async def _monitor_mempool(self):
        """Monitor mempool for new transactions"""
        while self.running:
            try:
                # This is a simplified implementation
                # In production, you'd use WebSocket connections or specialized services
                # like BlockNative or Alchemy's pending transaction streams

                # For now, we'll monitor recent blocks for new transactions
                latest_block = await self.provider.get_latest_block()

                # Check for new transactions
                for tx_data in latest_block.transactions:
                    tx_hash = tx_data.get("hash", "")
                    if tx_hash and tx_hash not in self.pending_transactions:
                        await self._process_new_transaction(tx_data)

                await asyncio.sleep(settings.mempool_scan_interval)

            except Exception as e:
                logger.error("Error in mempool monitoring", network=self.network, error=str(e))
                await asyncio.sleep(60)

    async def _process_new_transaction(self, tx_data: dict[str, Any]):
        """Process new transaction from mempool"""
        try:
            mempool_tx = MempoolTransaction(
                hash=tx_data.get("hash", ""),
                from_address=tx_data.get("from", ""),
                to_address=tx_data.get("to", ""),
                value=tx_data.get("value", 0),
                gas=tx_data.get("gas", 0),
                gas_price=tx_data.get("gasPrice", 0),
                nonce=tx_data.get("nonce", 0),
                timestamp=time.time(),
            )

            self.pending_transactions[mempool_tx.hash] = mempool_tx

            # Notify callbacks
            for callback in self.callbacks:
                try:
                    await callback(mempool_tx, self.network)
                except Exception as e:
                    logger.error("Error in mempool callback", network=self.network, error=str(e))

            logger.debug(
                "Processed new mempool transaction", network=self.network, tx_hash=mempool_tx.hash
            )

        except Exception as e:
            logger.error("Error processing mempool transaction", network=self.network, error=str(e))

    def add_callback(self, callback: callable):
        """Add callback for new mempool transactions"""
        self.callbacks.append(callback)

    def remove_callback(self, callback: callable):
        """Remove callback"""
        if callback in self.callbacks:
            self.callbacks.remove(callback)


class BlockMonitor:
    """Monitor new blocks and transactions"""

    def __init__(self, network: str, provider: BlockchainProvider):
        self.network = network
        self.provider = provider
        self.last_block_number = 0
        self.callbacks: list[callable] = []
        self.running = False

    async def start(self):
        """Start block monitoring"""
        self.running = True

        # Get current block number
        latest_block = await self.provider.get_latest_block()
        self.last_block_number = latest_block.number

        asyncio.create_task(self._monitor_blocks())
        logger.info(
            "Started block monitoring", network=self.network, start_block=self.last_block_number
        )

    async def stop(self):
        """Stop block monitoring"""
        self.running = False
        logger.info("Stopped block monitoring", network=self.network)

    async def _monitor_blocks(self):
        """Monitor for new blocks"""
        while self.running:
            try:
                latest_block = await self.provider.get_latest_block()

                if latest_block.number > self.last_block_number:
                    # New blocks detected
                    for block_num in range(self.last_block_number + 1, latest_block.number + 1):
                        try:
                            block = await self.provider.get_block(block_num)
                            await self._process_new_block(block)
                        except Exception as e:
                            logger.error(
                                f"Error processing block {block_num}",
                                network=self.network,
                                error=str(e),
                            )

                    self.last_block_number = latest_block.number

                await asyncio.sleep(settings.block_scan_interval)

            except Exception as e:
                logger.error("Error in block monitoring", network=self.network, error=str(e))
                await asyncio.sleep(60)

    async def _process_new_block(self, block: BlockData):
        """Process new block"""
        try:
            # Notify callbacks
            for callback in self.callbacks:
                try:
                    await callback(block, self.network)
                except Exception as e:
                    logger.error("Error in block callback", network=self.network, error=str(e))

            logger.debug(
                "Processed new block",
                network=self.network,
                block_number=block.number,
                tx_count=len(block.transactions),
            )

        except Exception as e:
            logger.error("Error processing block", network=self.network, error=str(e))

    def add_callback(self, callback: callable):
        """Add callback for new blocks"""
        self.callbacks.append(callback)

    def remove_callback(self, callback: callable):
        """Remove callback"""
        if callback in self.callbacks:
            self.callbacks.remove(callback)


# Global blockchain manager instance
blockchain_manager = BlockchainManager()
