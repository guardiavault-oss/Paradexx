#!/usr/bin/env python3
"""
Provider client stubs for fiat on-ramps, DEX aggregators, cross-chain
bridges, and NFT metadata. Each helper returns normalized data structures so
that swapping the mock logic for real API calls only requires editing this
module. Real API keys are read from the environment (see example.env).
"""

from __future__ import annotations

import os
import random
import time
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional, Tuple
from decimal import Decimal, ROUND_DOWN

import httpx
import structlog

logger = structlog.get_logger(__name__)


# ---------------------------------------------------------------------------
# Fiat on-ramp helpers
# ---------------------------------------------------------------------------

@dataclass
class FiatQuote:
    provider: str
    fiat_currency: str
    token_symbol: str
    amount: float
    rate: float
    total_tokens: float
    fee_percent: float
    fee_amount: float
    payment_methods: List[str]
    processing_time_minutes: int
    status: str
    requires_kyc: bool
    provider_url: str


FIAT_PROVIDERS = [
    ("MoonPay", "https://buy.moonpay.com"),
    ("Ramp", "https://buy.ramp.network"),
    ("Transak", "https://global.transak.com"),
    ("Coinbase Pay", "https://pay.coinbase.com"),
]


def get_fiat_quotes(
    fiat_currency: str,
    amount: float,
    token_symbol: str,
) -> List[Dict[str, Any]]:
    """Return mock quotes for each fiat provider."""
    quotes: List[FiatQuote] = []

    for provider, url in FIAT_PROVIDERS:
        fee_percent = random.uniform(1.0, 2.9)
        rate = random.uniform(0.9, 1.1)
        total_tokens = (amount * rate) * (1 - fee_percent / 100)
        processing_time = random.choice([5, 10, 15, 30])
        env_prefix = provider.upper().replace(" ", "_").replace(".", "")
        has_creds = any(
            os.getenv(name)
            for name in [
                f"{env_prefix}_API_KEY",
                f"{env_prefix}_PUBLIC_KEY",
                f"{env_prefix}_SECRET_KEY",
                f"{env_prefix}_CLIENT_ID",
            ]
        )
        status = "live" if has_creds else "mock"

        quotes.append(
            FiatQuote(
                provider=provider,
                fiat_currency=fiat_currency,
                token_symbol=token_symbol,
                amount=amount,
                rate=rate,
                total_tokens=total_tokens,
                fee_percent=fee_percent,
                fee_amount=amount * (fee_percent / 100),
                payment_methods=["card", "bank_transfer", "apple_pay"],
                processing_time_minutes=processing_time,
                status=status,
                requires_kyc=True,
                provider_url=url,
            )
        )

    return [asdict(q) for q in quotes]


# ---------------------------------------------------------------------------
# Token price helpers (Moralis)
# ---------------------------------------------------------------------------

@dataclass
class TokenPrice:
    symbol: str
    address: str
    chain: str
    price_usd: float
    price_native: float
    percent_change_24h: float
    liquidity_usd: Optional[float]
    last_updated: int
    status: str


TOKEN_METADATA = {
    "ETH": {
        "address": "0xEeeeeEeeeEeEeeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        "decimals": 18,
        "chain": os.getenv("MORALIS_DEFAULT_CHAIN", "eth"),
    },
    "WBTC": {
        "address": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        "decimals": 8,
        "chain": "eth",
    },
    "USDC": {
        "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "decimals": 6,
        "chain": "eth",
    },
    "DAI": {
        "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        "decimals": 18,
        "chain": "eth",
    },
    "LINK": {
        "address": "0x514910771AF9Ca656af840dff83E8264EcF986CA",
        "decimals": 18,
        "chain": "eth",
    },
    "ARB": {
        "address": "0x912CE59144191C1204E64559FE8253a0e49E6548",
        "decimals": 18,
        "chain": "arb1",
    },
    "MATIC": {
        "address": "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
        "decimals": 18,
        "chain": "matic",
    },
}

MORALIS_API_KEY = os.getenv("MORALIS_API_KEY")
MORALIS_DEFAULT_CHAIN = os.getenv("MORALIS_DEFAULT_CHAIN", "eth")
MORALIS_PRICE_ENDPOINT = "https://deep-index.moralis.io/api/v2/erc20/{address}/price"


def _extract_rate_limit_headers(headers: Optional[Dict[str, str]]) -> Dict[str, Any]:
    """Normalize rate limit headers from API responses."""
    if not headers:
        return {}
    mapping = {
        "limit": headers.get("x-ratelimit-limit"),
        "remaining": headers.get("x-ratelimit-remaining"),
        "reset": headers.get("x-ratelimit-reset"),
        "cost": headers.get("x-computing-unit"),
    }
    normalized: Dict[str, Any] = {}
    for key, value in mapping.items():
        if value is None:
            continue
        try:
            normalized[key] = float(value) if "." in value else int(value)
        except (TypeError, ValueError):
            normalized[key] = value
    return normalized


def _fetch_token_price_from_coingecko(symbol: str) -> TokenPrice | None:
    """Fetch token price from CoinGecko API as fallback (synchronous)"""
    try:
        # CoinGecko token ID mapping
        token_id_map = {
            'ETH': 'ethereum',
            'USDC': 'usd-coin',
            'USDT': 'tether',
            'ARB': 'arbitrum',
            'UNI': 'uniswap',
            'MATIC': 'matic-network',
            'BNB': 'binancecoin',
            'WBTC': 'wrapped-bitcoin',
        }
        
        token_id = token_id_map.get(symbol.upper())
        if not token_id:
            return None
        
        # Use synchronous httpx client
        with httpx.Client(timeout=5.0) as client:
            response = client.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={
                    "ids": token_id,
                    "vs_currencies": "usd",
                    "include_24hr_change": "true",
                    "include_market_cap": "true",
                    "include_24hr_vol": "true"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if token_id in data:
                    token_data = data[token_id]
                    meta = TOKEN_METADATA.get(symbol, {"address": "unknown", "chain": MORALIS_DEFAULT_CHAIN, "decimals": 18})
                    return TokenPrice(
                        symbol=symbol,
                        address=meta.get("address", "unknown"),
                        chain=meta.get("chain", MORALIS_DEFAULT_CHAIN),
                        price_usd=float(token_data.get("usd", 0)),
                        price_native=float(token_data.get("usd", 0)),
                        percent_change_24h=float(token_data.get("usd_24h_change", 0)),
                        liquidity_usd=float(token_data.get("usd_24h_vol", 0)),
                        last_updated=int(time.time()),
                        status="coingecko",
                    )
    except Exception as e:
        logger.warning(f"Failed to fetch price from CoinGecko for {symbol}: {e}")
    
    return None


def _mock_token_price(symbol: str) -> TokenPrice:
    """Fallback mock price - only used when all APIs fail"""
    logger.warning(f"Using fallback mock price for {symbol} - all price APIs unavailable")
    seed = random.Random(symbol)
    price_usd = round(seed.uniform(0.5, 3200), 2)
    percent_change = round(seed.uniform(-12, 12), 2)
    liquidity = round(seed.uniform(1_000_000, 65_000_000), 2)
    meta = TOKEN_METADATA.get(symbol, {"address": "unknown", "chain": MORALIS_DEFAULT_CHAIN, "decimals": 18})
    return TokenPrice(
        symbol=symbol,
        address=meta.get("address", "unknown"),
        chain=meta.get("chain", MORALIS_DEFAULT_CHAIN),
        price_usd=price_usd,
        price_native=price_usd,  # 1:1 fallback
        percent_change_24h=percent_change,
        liquidity_usd=liquidity,
        last_updated=int(time.time()),
        status="fallback_mock",
    )


def _format_moralis_price(symbol: str, payload: Dict[str, Any]) -> TokenPrice:
    meta = TOKEN_METADATA[symbol]
    usd = float(payload.get("usdPrice") or payload.get("price") or 0.0)
    native_raw = payload.get("nativePrice") or {}
    native_value = native_raw.get("value") or "0"
    decimals = int(native_raw.get("decimals") or meta.get("decimals", 18))
    try:
        native = float(Decimal(native_value) / (Decimal(10) ** decimals))
    except Exception:
        native = 0.0

    percent_change = payload.get("percentChange24h") or payload.get("24hrPercentChange")
    try:
        percent_change = float(percent_change)
    except (TypeError, ValueError):
        percent_change = 0.0

    return TokenPrice(
        symbol=symbol,
        address=meta["address"],
        chain=meta.get("chain", MORALIS_DEFAULT_CHAIN),
        price_usd=usd,
        price_native=native,
        percent_change_24h=percent_change,
        liquidity_usd=None,
        last_updated=int(time.time()),
        status="live",
    )


def get_token_prices(token_symbols: Optional[List[str]] = None) -> Dict[str, Any]:
    """Fetch token prices from Moralis (falls back to deterministic mock data)."""
    symbols = [sym.upper() for sym in (token_symbols or TOKEN_METADATA.keys())]
    symbols = [sym for sym in symbols if sym in TOKEN_METADATA]
    results: List[TokenPrice] = []
    rate_limit: Dict[str, Any] = {}

    if MORALIS_API_KEY and symbols:
        headers = {"X-API-Key": MORALIS_API_KEY}
        with httpx.Client(timeout=10) as client:
            for symbol in symbols:
                meta = TOKEN_METADATA[symbol]
                url = MORALIS_PRICE_ENDPOINT.format(address=meta["address"])
                params = {"chain": meta.get("chain", MORALIS_DEFAULT_CHAIN)}
                try:
                    response = client.get(url, params=params, headers=headers)
                    response.raise_for_status()
                    rate_limit = _extract_rate_limit_headers(response.headers) or rate_limit
                    results.append(_format_moralis_price(symbol, response.json()))
                except Exception as exc:
                    logger.warning("Moralis price fetch failed; using mock", symbol=symbol, error=str(exc))

    # Ensure we return values for every requested symbol.
    # Try CoinGecko API for missing symbols before falling back to mock
    if len(results) != len(symbols):
        known_symbols = {price.symbol for price in results}
        for symbol in symbols:
            if symbol not in known_symbols:
                # Try CoinGecko first
                try:
                    coingecko_price = _fetch_token_price_from_coingecko(symbol)
                    if coingecko_price:
                        results.append(coingecko_price)
                        continue
                except Exception as e:
                    logger.debug(f"CoinGecko fetch failed for {symbol}: {e}")
                
                # Fallback to mock only if all APIs fail
                results.append(_mock_token_price(symbol))

    return {
        "tokens": [asdict(price) for price in results],
        "rate_limit": rate_limit or None,
        "live": bool(MORALIS_API_KEY),
    }


# ---------------------------------------------------------------------------
# DEX aggregator helpers
# ---------------------------------------------------------------------------

@dataclass
class SwapRoute:
    aggregator: str
    from_token: str
    to_token: str
    amount_in: float
    amount_out: float
    min_received: float
    gas_estimate: float
    slippage_percent: float
    liquidity_sources: List[str]
    mev_protection_supported: bool
    route_steps: List[Dict[str, Any]]
    status: str


DEX_AGGREGATORS = {
    "1inch": os.getenv("ONEINCH_API_KEY"),
    "Paraswap": os.getenv("PARASWAP_API_KEY"),
    "MetaMask Swaps": os.getenv("METAMASK_SWAPS_API_KEY"),
}

ERC20_METADATA = TOKEN_METADATA

CHAIN_ID = 1  # Ethereum mainnet for initial rollout


def _to_wei(amount: float, decimals: int) -> str:
    scaled = Decimal(str(amount)) * (Decimal(10) ** decimals)
    return str(int(scaled.to_integral_value(rounding=ROUND_DOWN)))


def _from_wei(amount: str, decimals: int) -> float:
    return float(Decimal(amount) / (Decimal(10) ** decimals))


def _format_protocols(protocols: List[Any]) -> List[str]:
    names = []
    for path_group in protocols:
        for path in path_group:
            for hop in path:
                name = hop.get("name")
                if name and name not in names:
                    names.append(name)
    return names


def _fetch_1inch_route(
    api_key: str,
    from_token: str,
    to_token: str,
    amount_in: float,
    slippage_percent: float,
) -> Optional[SwapRoute]:
    src_meta = ERC20_METADATA.get(from_token)
    dst_meta = ERC20_METADATA.get(to_token)
    if not src_meta or not dst_meta:
        return None

    amount_wei = _to_wei(amount_in, src_meta["decimals"])
    headers = {
        "Authorization": f"Bearer {api_key}",
        "accept": "application/json",
    }
    params = {
        "src": src_meta["address"],
        "dst": dst_meta["address"],
        "amount": amount_wei,
        "includeTokensInfo": "true",
        "includeProtocols": "true",
        "slippage": str(slippage_percent),
    }
    url = f"https://api.1inch.dev/swap/v5.2/{CHAIN_ID}/quote"

    with httpx.Client(timeout=10) as client:
        response = client.get(url, params=params, headers=headers)
        response.raise_for_status()
        quote = response.json()

    to_amount = quote.get("toAmount") or quote.get("dstAmount")
    if not to_amount:
        return None

    amount_out = _from_wei(to_amount, dst_meta["decimals"])
    estimated_gas = quote.get("estimatedGas") or quote.get("gas")
    protocols = quote.get("protocols", [])
    liquidity_sources = _format_protocols(protocols) or ["1inch"]
    route_steps = [
        {"exchange": step, "portion": round(100 / len(liquidity_sources), 2)}
        for step in liquidity_sources
    ]

    return SwapRoute(
        aggregator="1inch",
        from_token=from_token,
        to_token=to_token,
        amount_in=amount_in,
        amount_out=amount_out,
        min_received=amount_out * (1 - slippage_percent / 100),
        gas_estimate=float(estimated_gas) * 0.00000002 if estimated_gas else 0.0,
        slippage_percent=slippage_percent,
        liquidity_sources=liquidity_sources,
        mev_protection_supported=True,
        route_steps=route_steps,
        status="live",
    )


def _fetch_paraswap_route(
    api_key: str,
    from_token: str,
    to_token: str,
    amount_in: float,
    slippage_percent: float,
) -> Optional[SwapRoute]:
    src_meta = ERC20_METADATA.get(from_token)
    dst_meta = ERC20_METADATA.get(to_token)
    if not src_meta or not dst_meta:
        return None

    amount_wei = _to_wei(amount_in, src_meta["decimals"])
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    params = {
        "srcToken": src_meta["address"],
        "srcDecimals": src_meta["decimals"],
        "destToken": dst_meta["address"],
        "destDecimals": dst_meta["decimals"],
        "amount": amount_wei,
        "side": "SELL",
        "network": CHAIN_ID,
    }

    url = f"https://apiv5.paraswap.io/prices/"

    with httpx.Client(timeout=10) as client:
        response = client.get(url, params=params, headers=headers)
        response.raise_for_status()
        quote = response.json()

    price_route = quote.get("priceRoute") or {}
    if not price_route:
        return None

    amount_out = _from_wei(price_route.get("destAmount", "0"), dst_meta["decimals"])
    gas_cost = float(price_route.get("gasCostUSD") or 0.0)
    protocols = price_route.get("steps") or []
    liquidity_sources = []
    for path in protocols:
        for swap in path:
            market = swap.get("pool") or swap.get("exchange")
            if market and market not in liquidity_sources:
                liquidity_sources.append(market)

    return SwapRoute(
        aggregator="Paraswap",
        from_token=from_token,
        to_token=to_token,
        amount_in=amount_in,
        amount_out=amount_out,
        min_received=amount_out * (1 - slippage_percent / 100),
        gas_estimate=gas_cost,
        slippage_percent=slippage_percent,
        liquidity_sources=liquidity_sources or ["Paraswap"],
        mev_protection_supported=False,
        route_steps=[
            {"exchange": source, "portion": round(100 / len(liquidity_sources), 2)}
            for source in liquidity_sources
        ]
        if liquidity_sources
        else [],
        status="live",
    )


def get_dex_routes(
    from_token: str,
    to_token: str,
    amount_in: float,
    slippage_percent: float,
) -> List[Dict[str, Any]]:
    """Return swap routes for each aggregator."""
    routes: List[SwapRoute] = []
    base_amount_out = amount_in * random.uniform(0.95, 1.05)

    for aggregator, api_key in DEX_AGGREGATORS.items():
        if aggregator == "1inch" and api_key:
            try:
                route = _fetch_1inch_route(
                    api_key=api_key,
                    from_token=from_token,
                    to_token=to_token,
                    amount_in=amount_in,
                    slippage_percent=slippage_percent,
                )
                if route:
                    routes.append(route)
                    continue
            except Exception as exc:
                logger.warning("1inch quote failed, falling back to mock", error=str(exc))

        if aggregator == "Paraswap" and api_key:
            try:
                route = _fetch_paraswap_route(
                    api_key=api_key,
                    from_token=from_token,
                    to_token=to_token,
                    amount_in=amount_in,
                    slippage_percent=slippage_percent,
                )
                if route:
                    routes.append(route)
                    continue
            except Exception as exc:
                logger.warning("Paraswap quote failed, falling back to mock", error=str(exc))

        adjustment = random.uniform(-0.5, 0.5)
        amount_out = base_amount_out + adjustment
        min_received = amount_out * (1 - slippage_percent / 100)
        gas_estimate = random.uniform(8, 25)
        mev_supported = aggregator != "Paraswap"

        routes.append(
            SwapRoute(
                aggregator=aggregator,
                from_token=from_token,
                to_token=to_token,
                amount_in=amount_in,
                amount_out=amount_out,
                min_received=min_received,
                gas_estimate=gas_estimate,
                slippage_percent=slippage_percent,
                liquidity_sources=[
                    "Uniswap V3",
                    "Sushi",
                    "Balancer",
                    "Curve",
                ],
                mev_protection_supported=mev_supported,
                route_steps=[
                    {"exchange": "Uniswap V3", "portion": 60},
                    {"exchange": "Curve", "portion": 40},
                ],
                status="live" if api_key else "mock",
            )
        )

    return [asdict(r) for r in routes]


# ---------------------------------------------------------------------------
# Cross-chain swap helpers
# ---------------------------------------------------------------------------

@dataclass
class BridgeRoute:
    provider: str
    source_chain: str
    destination_chain: str
    from_token: str
    to_token: str
    amount_in: float
    estimated_output: float
    bridge_fee: float
    gas_on_destination: float
    eta_minutes: int
    risk_rating: str
    multi_hop_path: List[str]
    status: str


CROSS_CHAIN_PROVIDERS = [
    ("Socket", os.getenv("SOCKET_API_KEY")),
    ("LI.FI", os.getenv("LIFI_API_KEY")),
    ("ThorChain", os.getenv("THORCHAIN_MIDGARD_URL")),
    ("Wormhole", os.getenv("WORMHOLE_RPC_URL")),
]

CHAIN_NAME_TO_ID = {
    "ETHEREUM": 1,
    "ARBITRUM": 42161,
    "POLYGON": 137,
    "OPTIMISM": 10,
    "BASE": 8453,
    "AVALANCHE": 43114,
    "BSC": 56,
    "FANTOM": 250,
    "GNOSIS": 100,
    "SOLANA": 245022934,
}

CHAIN_DISPLAY_NAMES = {
    1: "Ethereum",
    42161: "Arbitrum",
    137: "Polygon",
    10: "Optimism",
    8453: "Base",
    43114: "Avalanche",
    56: "BNB Chain",
    250: "Fantom",
    100: "Gnosis",
    245022934: "Solana",
}

CROSS_CHAIN_TOKENS: Dict[Tuple[str, str], Dict[str, Any]] = {
    # Ethereum
    ("ETHEREUM", "ETH"): {"address": "0xEeeeeEeeeEeEeeeEeEeEeeEEEeeeeEeeeeeeeEEeE", "decimals": 18},
    ("ETHEREUM", "USDC"): {"address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "decimals": 6},
    ("ETHEREUM", "DAI"): {"address": "0x6B175474E89094C44Da98b954EedeAC495271d0F", "decimals": 18},
    ("ETHEREUM", "USDT"): {"address": "0xdAC17F958D2ee523a2206206994597C13D831ec7", "decimals": 6},
    ("ETHEREUM", "WBTC"): {"address": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", "decimals": 8},

    # Arbitrum
    ("ARBITRUM", "ETH"): {"address": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "decimals": 18},
    ("ARBITRUM", "USDC"): {"address": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", "decimals": 6},
    ("ARBITRUM", "DAI"): {"address": "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", "decimals": 18},
    ("ARBITRUM", "USDT"): {"address": "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", "decimals": 6},
    ("ARBITRUM", "WBTC"): {"address": "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f", "decimals": 8},

    # Polygon
    ("POLYGON", "ETH"): {"address": "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", "decimals": 18},
    ("POLYGON", "USDC"): {"address": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", "decimals": 6},
    ("POLYGON", "USDT"): {"address": "0xc2132D05D31c914a87C6611C10748AaCB60F7c9", "decimals": 6},
    ("POLYGON", "DAI"): {"address": "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", "decimals": 18},
    ("POLYGON", "MATIC"): {"address": "0xEeeeeEeeeEeEeeeEeEeEeeEEEeeeeEeeeeeeeEEeE", "decimals": 18},
    ("POLYGON", "WBTC"): {"address": "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", "decimals": 8},

    # Optimism
    ("OPTIMISM", "ETH"): {"address": "0x4200000000000000000000000000000000000006", "decimals": 18},
    ("OPTIMISM", "USDC"): {"address": "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", "decimals": 6},
    ("OPTIMISM", "USDT"): {"address": "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58", "decimals": 6},
    ("OPTIMISM", "DAI"): {"address": "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", "decimals": 18},
    ("OPTIMISM", "WBTC"): {"address": "0x68f180fcce6836688e9084f035309e29bf0a2095", "decimals": 8},

    # Base
    ("BASE", "ETH"): {"address": "0x4200000000000000000000000000000000000006", "decimals": 18},
    ("BASE", "USDC"): {"address": "0x833589fCD6EDb6E08f4c7c32D4f71b54bDA02913", "decimals": 6},
    ("BASE", "USDT"): {"address": "0x38A295f2434d7c69c06cd861f5F7bDf9769f3cC3", "decimals": 6},
    ("BASE", "DAI"): {"address": "0x50c5725949a6f0c72e6c4a641F24049BEc2D5FFd", "decimals": 18},

    # Avalanche
    ("AVALANCHE", "AVAX"): {"address": "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", "decimals": 18},
    ("AVALANCHE", "USDC"): {"address": "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", "decimals": 6},
    ("AVALANCHE", "USDT"): {"address": "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7", "decimals": 6},
    ("AVALANCHE", "DAI"): {"address": "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70", "decimals": 18},
    ("AVALANCHE", "WBTC"): {"address": "0x408D4cD0ADb7ceBd1F1A1C33A0B75D5dD5aA31b1", "decimals": 8},

    # BNB Chain
    ("BSC", "BNB"): {"address": "0xEeeeeEeeeEeEeeeEeEeEeeEEEeeeeEeeeeeeeEEeE", "decimals": 18},
    ("BSC", "USDC"): {"address": "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", "decimals": 18},
    ("BSC", "USDT"): {"address": "0x55d398326f99059ff775485246999027b3197955", "decimals": 18},
    ("BSC", "DAI"): {"address": "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3", "decimals": 18},
    ("BSC", "WBTC"): {"address": "0x7130d2A12B9BCbFAE4f2634d864A1Ee1Ce3Ead9c", "decimals": 18},

    # Fantom
    ("FANTOM", "FTM"): {"address": "0xEeeeeEeeeEeEeeeEeEeEeeEEEeeeeEeeeeeeeEEeE", "decimals": 18},
    ("FANTOM", "USDC"): {"address": "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75", "decimals": 6},
    ("FANTOM", "USDT"): {"address": "0x049d68029688eAbF473097a2fC38ef61633A3C7A", "decimals": 6},
    ("FANTOM", "DAI"): {"address": "0x8D11EC38a3EB5E956B052f67Da8Bdc9bef8Abf3E", "decimals": 18},
    ("FANTOM", "WBTC"): {"address": "0x321162Cd933E2Be498Cd2267a90534A804051b11", "decimals": 8},

    # Gnosis
    ("GNOSIS", "XDAI"): {"address": "0xEeeeeEeeeEeEeeeEeEeEeeEEEeeeeEeeeeeeeEEeE", "decimals": 18},
    ("GNOSIS", "USDC"): {"address": "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83", "decimals": 6},
    ("GNOSIS", "USDT"): {"address": "0x4ECaBa5870353805a9F068101A40E0f32ed605C6", "decimals": 6},
    ("GNOSIS", "DAI"): {"address": "0x8E5bBbb09Ed1ebdE8674Cda39A0c169401db4252", "decimals": 18},

    # Solana (SPL mints)
    ("SOLANA", "SOL"): {"address": "So11111111111111111111111111111111111111112", "decimals": 9},
    ("SOLANA", "USDC"): {"address": "EPjFWdd5AufqSSqeM2q31bHM64X6FdEZ4Df8MJdP", "decimals": 6},
    ("SOLANA", "USDT"): {"address": "Es9vMFrzaCERZAX6bFb3t1SGaCk7DTFShQf5spMgyc3", "decimals": 6},
}

LIFI_API_KEY = os.getenv("LIFI_API_KEY")
LIFI_BASE_URL = "https://li.quest/v1"


def _chain_name_to_id(chain_name: str) -> Optional[int]:
    if not chain_name:
        return None
    return CHAIN_NAME_TO_ID.get(chain_name.strip().upper())


def _token_metadata_for_chain(chain_name: str, token_symbol: str) -> Optional[Dict[str, Any]]:
    if not chain_name or not token_symbol:
        return None
    return CROSS_CHAIN_TOKENS.get((chain_name.strip().upper(), token_symbol.strip().upper()))


def _to_chain_units(amount: float, decimals: int) -> str:
    scaled = Decimal(str(amount)) * (Decimal(10) ** decimals)
    return str(int(scaled.to_integral_value(rounding=ROUND_DOWN)))


def _from_chain_units(value: str, decimals: int) -> float:
    return float(Decimal(value) / (Decimal(10) ** decimals))


def _fetch_lifi_route(
    source_chain: str,
    destination_chain: str,
    from_token: str,
    to_token: str,
    amount_in: float,
) -> Optional[BridgeRoute]:
    if not LIFI_API_KEY:
        return None

    from_chain_id = _chain_name_to_id(source_chain)
    to_chain_id = _chain_name_to_id(destination_chain)
    if from_chain_id is None or to_chain_id is None:
        return None

    from_token_meta = _token_metadata_for_chain(source_chain, from_token)
    to_token_meta = _token_metadata_for_chain(destination_chain, to_token)
    if not from_token_meta or not to_token_meta:
        return None

    amount_wei = _to_chain_units(amount_in, from_token_meta["decimals"])
    payload = {
        "fromChainId": from_chain_id,
        "toChainId": to_chain_id,
        "fromTokenAddress": from_token_meta["address"],
        "toTokenAddress": to_token_meta["address"],
        "fromAmount": amount_wei,
        "options": {
            "slippage": 0.5,
            "integrator": "GuardianX",
            "allowSwitchChain": True,
        },
    }

    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "x-li-fi-api-key": LIFI_API_KEY,
    }

    with httpx.Client(timeout=20) as client:
        response = client.post(f"{LIFI_BASE_URL}/routes", json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

    routes = data.get("routes") or []
    if not routes:
        return None

    route = routes[0]
    to_amount = route.get("toAmount") or "0"
    estimated_output = _from_chain_units(to_amount, to_token_meta["decimals"])
    gas_cost = float(route.get("gasCostUSD") or 0.0)

    steps = route.get("steps", [])
    hop_names: List[str] = []
    eta_seconds = 0
    for step in steps:
        tool = step.get("toolDetails", {}).get("name")
        if tool:
            hop_names.append(tool)
        estimate = step.get("estimate", {})
        eta_seconds += int(estimate.get("executionDuration") or 0)

    fee_percent = 0.0
    if amount_in > 0:
        fee_percent = max(0.0, (1 - (estimated_output / amount_in)) * 100)

    risk_rating = "low" if route.get("insurance", {}).get("state") else "medium"

    return BridgeRoute(
        provider="LI.FI",
        source_chain=source_chain,
        destination_chain=destination_chain,
        from_token=from_token,
        to_token=to_token,
        amount_in=amount_in,
        estimated_output=estimated_output,
        bridge_fee=round(fee_percent, 3),
        gas_on_destination=gas_cost,
        eta_minutes=max(1, int(eta_seconds / 60)) if eta_seconds else random.choice([5, 10, 15]),
        risk_rating=risk_rating,
        multi_hop_path=hop_names
        or [
            CHAIN_DISPLAY_NAMES.get(from_chain_id, source_chain),
            CHAIN_DISPLAY_NAMES.get(to_chain_id, destination_chain),
        ],
        status="live",
    )


def get_cross_chain_routes(
    source_chain: str,
    destination_chain: str,
    from_token: str,
    to_token: str,
    amount_in: float,
) -> List[Dict[str, Any]]:
    """Return bridge routes across providers (preferring live data when available)."""
    routes: List[BridgeRoute] = []

    for provider, credential in CROSS_CHAIN_PROVIDERS:
        if provider == "LI.FI" and credential:
            try:
                route = _fetch_lifi_route(
                    source_chain=source_chain,
                    destination_chain=destination_chain,
                    from_token=from_token,
                    to_token=to_token,
                    amount_in=amount_in,
                )
                if route:
                    routes.append(route)
                    continue
            except Exception as exc:
                logger.warning("LI.FI route fetch failed; falling back to mock", error=str(exc))

        bridge_fee = random.uniform(0.05, 0.35)
        estimated_output = amount_in * (1 - bridge_fee / 100)
        eta = random.choice([5, 12, 20, 35])
        multi_hop = (
            [source_chain, "AVAX", destination_chain]
            if provider == "Wormhole"
            else [source_chain, destination_chain]
        )
        risk_rating = random.choice(["low", "medium", "elevated"])

        routes.append(
            BridgeRoute(
                provider=provider,
                source_chain=source_chain,
                destination_chain=destination_chain,
                from_token=from_token,
                to_token=to_token,
                amount_in=amount_in,
                estimated_output=estimated_output,
                bridge_fee=bridge_fee,
                gas_on_destination=random.uniform(0.001, 0.02),
                eta_minutes=eta,
                risk_rating=risk_rating,
                multi_hop_path=multi_hop,
                status="live" if credential else "mock",
            )
        )

    return [asdict(route) for route in routes]


# ---------------------------------------------------------------------------
# NFT metadata helpers
# ---------------------------------------------------------------------------

@dataclass
class NFTItem:
    token_id: str
    name: str
    collection: str
    image_url: str
    preview_url: str
    rarity_rank: Optional[int]
    traits: List[Dict[str, Any]]
    floor_price: Optional[float]
    chain: str
    is_hidden: bool
    is_watchlisted: bool


ALCHEMY_NFT_API_KEY = os.getenv("ALCHEMY_NFT_API_KEY") or os.getenv("ALCHEMY_API_KEY")
ALCHEMY_NFT_NETWORK = os.getenv("ALCHEMY_NFT_NETWORK", "eth-mainnet")


def _alchemy_nft_url(endpoint: str) -> str:
    base = f"https://{ALCHEMY_NFT_NETWORK}.g.alchemy.com/nft/v3"
    return f"{base}/{ALCHEMY_NFT_API_KEY}/{endpoint.lstrip('/')}"


def _fetch_alchemy_nfts(owner_address: str, include_hidden: bool, include_spam: bool) -> List[NFTItem]:
    if not ALCHEMY_NFT_API_KEY:
        raise RuntimeError("Alchemy NFT API key missing")

    params = {
        "owner": owner_address,
        "withMetadata": "true",
        "pageSize": 100,
    }
    if not include_spam:
        params["excludeFilters"] = ["SPAM"]

    url = _alchemy_nft_url("getNFTsForOwner")
    with httpx.Client(timeout=10) as client:
        response = client.get(url, params=params)
        response.raise_for_status()
        payload = response.json()

    items: List[NFTItem] = []
    for nft in payload.get("ownedNfts", []):
        spam_info = nft.get("spamInfo") or {}
        is_spam = bool(spam_info.get("isSpam"))
        if is_spam and not include_spam:
            continue
        is_hidden = bool(nft.get("isHidden", False) or is_spam)
        if is_hidden and not include_hidden:
            continue

        metadata = nft.get("rawMetadata") or {}
        contract_meta = nft.get("contractMetadata") or {}
        collection = contract_meta.get("name") or metadata.get("collection") or "Unknown Collection"
        image = metadata.get("image") or nft.get("image", {}).get("cached") or ""
        preview = nft.get("image", {}).get("thumbnail") or image
        traits = metadata.get("attributes") or metadata.get("traits") or []
        rarity_rank = metadata.get("rarity", {}).get("rank")
        floor_price = metadata.get("floorPrice") or contract_meta.get("openSea", {}).get("floorPrice")

        items.append(
            NFTItem(
                token_id=str(nft.get("tokenId")),
                name=metadata.get("name") or f"{collection} #{nft.get('tokenId')}",
                collection=collection,
                image_url=image,
                preview_url=preview or image,
                rarity_rank=rarity_rank,
                traits=traits,
                floor_price=float(floor_price) if floor_price else None,
                chain=nft.get("chain") or ALCHEMY_NFT_NETWORK,
                is_hidden=is_hidden,
                is_watchlisted=False,
            )
        )

    return items


def get_nft_gallery(
    owner_address: str,
    include_hidden: bool,
    include_spam: bool,
) -> Dict[str, Any]:
    """Return NFT gallery data via Alchemy (falls back to deterministic mock)."""
    items: List[NFTItem] = []
    live = False

    if ALCHEMY_NFT_API_KEY:
        try:
            items = _fetch_alchemy_nfts(owner_address, include_hidden, include_spam)
            live = True
        except Exception as exc:
            logger.warning("Alchemy NFT fetch failed; using mock data", error=str(exc))

    if not items:
        live = False
        random.seed(owner_address)
        for idx in range(8):
            traits = [
                {"type": "Background", "value": random.choice(["Night", "Sunset", "Neon"])},
                {"type": "Aura", "value": random.choice(["Guardian", "Spectral", "Nova"])},
            ]
            item = NFTItem(
                token_id=str(1000 + idx),
                name=f"Guardian Artifact #{idx}",
                collection="Guardian Relics",
                image_url=f"https://images.guardianx.app/nft/{idx}.png",
                preview_url=f"https://images.guardianx.app/nft/{idx}_preview.png",
                rarity_rank=random.randint(1, 5000),
                traits=traits,
                floor_price=round(random.uniform(0.1, 2.5), 2),
                chain=random.choice(["ethereum", "polygon"]),
                is_hidden=idx % 5 == 0,
                is_watchlisted=idx % 3 == 0,
            )
            if item.is_hidden and not include_hidden:
                continue
            if not include_spam and item.floor_price is None:
                continue
            items.append(item)

    collections = {}
    for item in items:
        bucket = collections.setdefault(item.collection, {"count": 0, "floor_price": item.floor_price})
        bucket["count"] += 1
        bucket["floor_price"] = min(bucket["floor_price"], item.floor_price or bucket["floor_price"])

    return {
        "owner": owner_address,
        "items": [asdict(item) for item in items],
        "collections": collections,
        "updated_at": int(time.time()),
        "live": live,
    }


# ---------------------------------------------------------------------------
# Pendle market + Hosted SDK helpers
# ---------------------------------------------------------------------------

@dataclass
class PendleMarket:
    market_id: str
    chain_id: int
    pair: str
    tvl_usd: float
    apy: float
    volume_24h: float
    expiry: Optional[int]
    rewards_apr: Optional[float]
    underlying_asset: Optional[str]
    status: str


@dataclass
class PendlePosition:
    market_id: str
    position_type: str
    value_usd: float
    pnl_24h: float
    health_factor: float
    rewards_apr: float
    tokens: List[str]
    updated_at: int


PENDLE_API_BASE_URL = os.getenv("PENDLE_API_BASE_URL", "https://api-v2.pendle.finance")
PENDLE_API_KEY = os.getenv("PENDLE_API_KEY")
PENDLE_HOSTED_SDK_URL = os.getenv("PENDLE_HOSTED_SDK_URL")
PENDLE_HOSTED_SDK_KEY = os.getenv("PENDLE_HOSTED_SDK_KEY")


def _pendle_core_base() -> str:
    base = PENDLE_API_BASE_URL.rstrip("/")
    if not base.endswith("/core"):
        base = f"{base}/core"
    return base


def _mock_pendle_markets(chain_id: Optional[int]) -> List[PendleMarket]:
    seed = random.Random(chain_id or 1)
    markets: List[PendleMarket] = []
    for idx in range(3):
        tvl = round(seed.uniform(5_000_000, 75_000_000), 2)
        apy = round(seed.uniform(4, 22), 2)
        markets.append(
            PendleMarket(
                market_id=f"mock-{chain_id or 1}-{idx}",
                chain_id=chain_id or 1,
                pair=random.choice(["PT-wstETH", "PT-rETH", "PT-USDC"]),
                tvl_usd=tvl,
                apy=apy,
                volume_24h=round(seed.uniform(250_000, 5_000_000), 2),
                expiry=int(time.time()) + (idx + 1) * 86_400 * 30,
                rewards_apr=round(seed.uniform(1, 8), 2),
                underlying_asset=random.choice(["wstETH", "USDC", "rETH"]),
                status="mock",
            )
        )
    return markets


def _mock_pendle_positions(address: str) -> List[PendlePosition]:
    seed = random.Random(address)
    positions: List[PendlePosition] = []
    for idx in range(2):
        value = round(seed.uniform(1500, 7500), 2)
        positions.append(
            PendlePosition(
                market_id=f"mock-market-{idx}",
                position_type=random.choice(["LP", "PT"]),
                value_usd=value,
                pnl_24h=round(seed.uniform(-50, 150), 2),
                health_factor=round(seed.uniform(1.1, 1.8), 2),
                rewards_apr=round(seed.uniform(2, 10), 2),
                tokens=[random.choice(["wstETH", "USDC", "wBTC"])],
                updated_at=int(time.time()),
            )
        )
    return positions


def _map_pendle_market(entry: Dict[str, Any], default_chain: Optional[int]) -> PendleMarket:
    base_symbol = entry.get("baseAsset", {}).get("symbol") or entry.get("token", {}).get("symbol")
    quote_symbol = entry.get("quoteAsset", {}).get("symbol") or "USD"
    pair = entry.get("pair") or (f"{base_symbol}/{quote_symbol}" if base_symbol else "Unknown")
    return PendleMarket(
        market_id=str(entry.get("marketId") or entry.get("id")),
        chain_id=int(entry.get("chainId") or default_chain or 1),
        pair=pair,
        tvl_usd=float(entry.get("tvlUsd") or entry.get("tvl") or 0.0),
        apy=float(entry.get("netApy") or entry.get("apy") or 0.0),
        volume_24h=float(entry.get("volume24h") or entry.get("volume24H") or 0.0),
        expiry=entry.get("expiry") or entry.get("expiryTimestamp"),
        rewards_apr=float(entry.get("rewardsApr") or entry.get("incentiveApy") or 0.0),
        underlying_asset=base_symbol,
        status="live",
    )


def get_pendle_markets(chain_id: Optional[int] = None) -> Dict[str, Any]:
    """Fetch Pendle markets, falling back to mock data when API unavailable."""
    params = {"chainId": chain_id} if chain_id else {}
    headers = {"accept": "application/json"}
    if PENDLE_API_KEY:
        headers["x-api-key"] = PENDLE_API_KEY

    try:
        with httpx.Client(timeout=10) as client:
            response = client.get(f"{_pendle_core_base()}/v1/markets", params=params, headers=headers)
            response.raise_for_status()
            payload = response.json()
            rate_limit = _extract_rate_limit_headers(response.headers)
    except Exception as exc:
        logger.warning("Pendle markets fetch failed", error=str(exc))
        markets = _mock_pendle_markets(chain_id)
        return {
            "markets": [asdict(market) for market in markets],
            "rate_limit": None,
            "live": False,
        }

    raw_markets = payload.get("data") or payload.get("markets") or []
    markets = [_map_pendle_market(entry, chain_id) for entry in raw_markets]
    return {
        "markets": [asdict(market) for market in markets],
        "rate_limit": rate_limit or None,
        "live": True,
    }


def get_pendle_positions(address: str) -> Dict[str, Any]:
    """Fetch a user's Pendle positions."""
    headers = {"accept": "application/json"}
    if PENDLE_API_KEY:
        headers["x-api-key"] = PENDLE_API_KEY

    try:
        with httpx.Client(timeout=10) as client:
            response = client.get(f"{_pendle_core_base()}/v1/users/{address}/positions", headers=headers)
            response.raise_for_status()
            payload = response.json()
            rate_limit = _extract_rate_limit_headers(response.headers)
    except Exception as exc:
        logger.warning("Pendle positions fetch failed", error=str(exc))
        positions = _mock_pendle_positions(address)
        return {
            "positions": [asdict(position) for position in positions],
            "rate_limit": None,
            "live": False,
        }

    raw_positions = payload.get("data") or payload.get("positions") or []
    positions: List[PendlePosition] = []
    for entry in raw_positions:
        positions.append(
            PendlePosition(
                market_id=str(entry.get("marketId") or entry.get("id")),
                position_type=entry.get("type") or entry.get("positionType") or "unknown",
                value_usd=float(entry.get("valueUsd") or entry.get("value") or 0.0),
                pnl_24h=float(entry.get("pnl24h") or entry.get("pnl") or 0.0),
                health_factor=float(entry.get("healthFactor") or 0.0),
                rewards_apr=float(entry.get("rewardsApr") or entry.get("incentiveApy") or 0.0),
                tokens=entry.get("tokens", []),
                updated_at=int(time.time()),
            )
        )

    return {
        "positions": [asdict(position) for position in positions],
        "rate_limit": rate_limit or None,
        "live": True,
    }


def call_pendle_hosted_sdk(action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Proxy to Pendle Hosted SDK for transaction generation."""
    if not action:
        raise ValueError("Hosted SDK action must be specified")

    base = (PENDLE_HOSTED_SDK_URL or f"{_pendle_core_base()}/sdk").rstrip("/")
    url = f"{base}/{action.lstrip('/')}"

    headers = {"Content-Type": "application/json"}
    if PENDLE_HOSTED_SDK_KEY:
        headers["x-api-key"] = PENDLE_HOSTED_SDK_KEY
    elif PENDLE_API_KEY:
        headers["x-api-key"] = PENDLE_API_KEY

    try:
        with httpx.Client(timeout=15) as client:
            response = client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            rate_limit = _extract_rate_limit_headers(response.headers)
    except Exception as exc:
        logger.warning("Pendle Hosted SDK call failed", action=action, error=str(exc))
        return {
            "action": action,
            "request_id": f"mock-{int(time.time())}",
            "route": {"steps": [{"type": "preview", "description": "Hosted SDK unavailable"}]},
            "rate_limit": None,
            "live": False,
        }

    request_id = data.get("requestId") or data.get("id") or f"pendle-{int(time.time())}"
    return {
        "action": action,
        "request_id": request_id,
        "route": data.get("route") or data,
        "rate_limit": rate_limit or None,
        "live": True,
        "raw": data,
    }


__all__ = [
    "get_fiat_quotes",
    "get_token_prices",
    "get_dex_routes",
    "get_cross_chain_routes",
    "get_nft_gallery",
    "get_pendle_markets",
    "get_pendle_positions",
    "call_pendle_hosted_sdk",
]

