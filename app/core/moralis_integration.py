#!/usr/bin/env python3
"""
Moralis API Integration for GuardianX
Enhances on-chain data capabilities for autonomous wallet intelligence
"""

import json
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, timedelta

import httpx
import structlog
from config.settings import Settings

logger = structlog.get_logger(__name__)


@dataclass
class WalletTransaction:
    """Moralis transaction data structure"""
    hash: str
    block_number: int
    timestamp: datetime
    from_address: str
    to_address: Optional[str]
    value: str
    gas: str
    gas_price: str
    gas_used: Optional[str]
    input: str
    nonce: int
    transaction_index: int
    receipt_status: Optional[str]
    logs: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class TokenBalance:
    """Token balance information"""
    token_address: str
    name: str
    symbol: str
    decimals: int
    balance: str
    balance_formatted: str
    usd_value: Optional[float] = None
    logo: Optional[str] = None
    verified_contract: bool = False


@dataclass
class WalletNFT:
    """NFT information"""
    token_address: str
    token_id: str
    owner_of: str
    amount: str
    name: Optional[str]
    symbol: Optional[str]
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class WalletProfile:
    """Complete wallet profile from Moralis"""
    address: str
    network: str
    native_balance: str
    native_balance_formatted: str
    usd_balance: float
    token_balances: List[TokenBalance]
    nfts: List[WalletNFT]
    transaction_count: int
    first_transaction_date: Optional[datetime]
    last_transaction_date: Optional[datetime]


class MoralisAPI:
    """
    Moralis API client for GuardianX integration
    Provides comprehensive on-chain data for wallet intelligence
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Moralis API client"""
        settings = Settings()
        self.api_key = api_key or settings.moralis_api_key
        self.base_url = "https://deep-index.moralis.io/api/v2.2"
        self.headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # Rate limiting
        self.rate_limit_delay = 0.2  # 200ms between requests
        self.last_request_time = 0
        
        # Supported networks mapping
        self.networks = {
            "ethereum": "eth", 
            "polygon": "polygon",
            "bsc": "bsc",
            "arbitrum": "arbitrum", 
            "optimism": "optimism",
            "avalanche": "avalanche",
            "base": "base",
            "polygon_zkevm": "polygon-zkevm"
        }
        
        logger.info("Moralis API client initialized", api_key_present=bool(self.api_key))
    
    async def _make_request(
        self, 
        endpoint: str, 
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make rate-limited API request to Moralis"""
        # Rate limiting
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.rate_limit_delay:
            await asyncio.sleep(self.rate_limit_delay - time_since_last)
        
        self.last_request_time = time.time()
        
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/{endpoint}"
                response = await client.get(
                    url,
                    headers=self.headers,
                    params=params or {},
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
                
        except httpx.HTTPStatusError as e:
            logger.error(
                "Moralis API HTTP error",
                status_code=e.response.status_code,
                endpoint=endpoint,
                error=str(e)
            )
            raise
        except httpx.RequestError as e:
            logger.error(
                "Moralis API request error",
                endpoint=endpoint,
                error=str(e)
            )
            raise
        except Exception as e:
            logger.error(
                "Moralis API unexpected error",
                endpoint=endpoint,
                error=str(e)
            )
            raise
    
    def _map_network(self, network: str) -> str:
        """Map internal network name to Moralis chain identifier"""
        return self.networks.get(network, network)
    
    async def get_wallet_transactions(
        self,
        address: str,
        network: str = "ethereum",
        limit: int = 100,
        cursor: Optional[str] = None,
        from_block: Optional[int] = None,
        to_block: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get wallet transaction history
        
        Args:
            address: Wallet address
            network: Blockchain network
            limit: Number of transactions to fetch (max 100)
            cursor: Pagination cursor
            from_block: Start block number
            to_block: End block number
            
        Returns:
            Transaction data and pagination info
        """
        chain = self._map_network(network)
        endpoint = f"{address}"
        
        params = {
            "chain": chain,
            "limit": min(limit, 100),
            "order": "DESC"  # Latest first
        }
        
        if cursor:
            params["cursor"] = cursor
        if from_block:
            params["from_block"] = from_block
        if to_block:
            params["to_block"] = to_block
        
        return await self._make_request(endpoint, params)
    
    async def get_wallet_token_balances(
        self,
        address: str,
        network: str = "ethereum",
        exclude_spam: bool = True
    ) -> List[TokenBalance]:
        """
        Get all token balances for a wallet
        
        Args:
            address: Wallet address
            network: Blockchain network
            exclude_spam: Filter out spam tokens
            
        Returns:
            List of TokenBalance objects
        """
        chain = self._map_network(network)
        endpoint = f"{address}/erc20"
        
        params = {
            "chain": chain,
            "exclude_spam": exclude_spam
        }
        
        response = await self._make_request(endpoint, params)
        
        # Handle response format - Moralis might return list or dict
        if isinstance(response, list):
            # Direct list of tokens
            token_list = response
        else:
            # Dict with result key
            token_list = response.get("result", [])
        
        balances = []
        for token_data in token_list:
            balance = TokenBalance(
                token_address=token_data.get("token_address", ""),
                name=token_data.get("name", ""),
                symbol=token_data.get("symbol", ""),
                decimals=int(token_data.get("decimals", 0)),
                balance=token_data.get("balance", "0"),
                balance_formatted=token_data.get("balance_formatted", "0"),
                logo=token_data.get("logo"),
                verified_contract=token_data.get("verified_contract", False)
            )
            balances.append(balance)
        
        return balances
    
    async def get_wallet_nfts(
        self,
        address: str,
        network: str = "ethereum",
        limit: int = 100,
        cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get NFTs owned by wallet
        
        Args:
            address: Wallet address
            network: Blockchain network
            limit: Number of NFTs to fetch
            cursor: Pagination cursor
            
        Returns:
            NFT data and pagination info
        """
        chain = self._map_network(network)
        endpoint = f"{address}/nft"
        
        params = {
            "chain": chain,
            "limit": min(limit, 100),
            "format": "decimal"
        }
        
        if cursor:
            params["cursor"] = cursor
        
        return await self._make_request(endpoint, params)
    
    async def get_native_balance(
        self,
        address: str,
        network: str = "ethereum"
    ) -> Dict[str, Any]:
        """
        Get native token balance (ETH, MATIC, etc.)
        
        Args:
            address: Wallet address
            network: Blockchain network
            
        Returns:
            Native balance data
        """
        chain = self._map_network(network)
        endpoint = f"{address}/balance"
        
        params = {"chain": chain}
        return await self._make_request(endpoint, params)
    
    async def get_token_price(
        self,
        address: str,
        network: str = "ethereum"
    ) -> Dict[str, Any]:
        """
        Get token price information
        
        Args:
            address: Token contract address
            network: Blockchain network
            
        Returns:
            Token price data
        """
        chain = self._map_network(network)
        endpoint = f"erc20/{address}/price"
        
        params = {"chain": chain}
        return await self._make_request(endpoint, params)
    
    async def get_wallet_portfolio(
        self,
        address: str,
        network: str = "ethereum"
    ) -> WalletProfile:
        """
        Get comprehensive wallet portfolio
        
        Args:
            address: Wallet address
            network: Blockchain network
            
        Returns:
            Complete WalletProfile object
        """
        # Get native balance
        native_data = await self.get_native_balance(address, network)
        
        # Get token balances
        token_balances = await self.get_wallet_token_balances(
            address, network
        )
        
        # Get recent transactions for stats
        tx_data = await self.get_wallet_transactions(
            address, network, limit=1
        )
        
        # Calculate USD balance (simplified)
        usd_balance = 0.0
        try:
            # Add native token value if available
            native_balance_wei = native_data.get("balance", "0")
            # Convert from wei to ETH (18 decimals)
            native_balance_formatted = float(native_balance_wei) / (10**18)
            # Note: Would need price data for accurate USD conversion
            usd_balance += native_balance_formatted * 2000  # Rough ETH estimate
            
            # Add token values
            for token in token_balances:
                if token.usd_value:
                    usd_balance += token.usd_value
        except (ValueError, TypeError):
            pass
        
        return WalletProfile(
            address=address,
            network=network,
            native_balance=native_data.get("balance", "0"),
            native_balance_formatted=str(
                float(native_data.get("balance", "0")) / (10**18)
            ),
            usd_balance=usd_balance,
            token_balances=token_balances,
            nfts=[],  # Would need separate NFT call
            transaction_count=len(tx_data.get("result", [])),
            first_transaction_date=None,  # Would need full history analysis
            last_transaction_date=None
        )
    
    async def analyze_wallet_behavior(
        self,
        address: str,
        network: str = "ethereum",
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Analyze wallet behavior patterns over time
        
        Args:
            address: Wallet address
            network: Blockchain network
            days: Number of days to analyze
            
        Returns:
            Behavioral analysis data
        """
        # Get transactions for the specified period
        transactions_data = await self.get_wallet_transactions(
            address, network, limit=100
        )
        
        transactions = transactions_data.get("result", [])
        
        # Analyze patterns
        analysis = {
            "address": address,
            "network": network,
            "analysis_period_days": days,
            "total_transactions": len(transactions),
            "transaction_patterns": {},
            "value_patterns": {},
            "timing_patterns": {},
            "counterparty_analysis": {},
            "risk_indicators": []
        }
        
        if not transactions:
            return analysis
        
        # Transaction value analysis
        values = []
        gas_prices = []
        timestamps = []
        counterparties = {}
        
        for tx in transactions:
            # Value analysis
            try:
                value = float(tx.get("value", "0"))
                values.append(value)
            except (ValueError, TypeError):
                pass
            
            # Gas analysis
            try:
                gas_price = float(tx.get("gas_price", "0"))
                gas_prices.append(gas_price)
            except (ValueError, TypeError):
                pass
            
            # Timing analysis
            timestamp = tx.get("block_timestamp")
            if timestamp:
                timestamps.append(timestamp)
            
            # Counterparty analysis
            to_addr = tx.get("to_address")
            if to_addr:
                counterparties[to_addr] = counterparties.get(
                    to_addr, 0
                ) + 1
        
        # Calculate patterns
        if values:
            import numpy as np
            analysis["value_patterns"] = {
                "average_value": float(np.mean(values)),
                "median_value": float(np.median(values)),
                "max_value": float(np.max(values)),
                "min_value": float(np.min(values)),
                "std_deviation": float(np.std(values))
            }
        
        if gas_prices:
            analysis["transaction_patterns"]["average_gas_price"] = float(
                np.mean(gas_prices)
            )
        
        # Top counterparties
        analysis["counterparty_analysis"]["top_recipients"] = dict(
            sorted(
                counterparties.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10]
        )
        
        # Risk indicators
        risk_indicators = []
        
        # High value transactions
        if values:
            high_value_threshold = np.mean(values) + 3 * np.std(values)
            high_value_count = sum(1 for v in values if v > high_value_threshold)
            if high_value_count > 0:
                risk_indicators.append(
                    f"Found {high_value_count} unusually high value transactions"
                )
        
        # Frequent interactions with same address
        for addr, count in counterparties.items():
            if count > 10:  # More than 10 interactions
                risk_indicators.append(
                    f"Frequent interactions with {addr[:8]}... ({count} times)"
                )
        
        analysis["risk_indicators"] = risk_indicators
        
        return analysis


# Global instance
_moralis_api: Optional[MoralisAPI] = None


def get_moralis_api() -> MoralisAPI:
    """Get or create global Moralis API instance"""
    global _moralis_api
    if _moralis_api is None:
        _moralis_api = MoralisAPI()
    return _moralis_api


# Import asyncio at the top if not already imported
import asyncio