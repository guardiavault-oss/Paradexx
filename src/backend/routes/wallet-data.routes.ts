/**
 * Wallet Data Routes - Real wallet data for the frontend
 * Integrates with Covalent, 1inch, and blockchain providers for live data
 */

import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import { logger } from '../services/logger.service';
import axios from 'axios';

const router = Router();

// API Keys
const COVALENT_API_KEY = process.env.COVALENT_API_KEY || '';
const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY || '';

// Covalent chain IDs mapping
const COVALENT_CHAIN_MAP: Record<number, string> = {
    1: 'eth-mainnet',
    137: 'matic-mainnet',
    42161: 'arbitrum-mainnet',
    10: 'optimism-mainnet',
    8453: 'base-mainnet',
    56: 'bsc-mainnet',
    43114: 'avalanche-mainnet',
};

// RPC endpoints by chain
const RPC_URLS: Record<number, string> = {
    1: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    137: process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
    42161: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    10: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    8453: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    11155111: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
};

// Common token addresses by chain
const COMMON_TOKENS: Record<number, Array<{ symbol: string; address: string; decimals: number; name: string }>> = {
    1: [
        { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, name: 'Tether USD' },
        { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, name: 'USD Coin' },
        { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, name: 'Wrapped Ether' },
        { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, name: 'Wrapped BTC' },
        { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EescdeCB5BE3d08', decimals: 18, name: 'Dai Stablecoin' },
        { symbol: 'LINK', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, name: 'Chainlink' },
        { symbol: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, name: 'Uniswap' },
    ],
    137: [
        { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6, name: 'Tether USD' },
        { symbol: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6, name: 'USD Coin' },
        { symbol: 'WETH', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18, name: 'Wrapped Ether' },
        { symbol: 'WMATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18, name: 'Wrapped Matic' },
    ],
    42161: [
        { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6, name: 'Tether USD' },
        { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6, name: 'USD Coin' },
        { symbol: 'WETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18, name: 'Wrapped Ether' },
        { symbol: 'ARB', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18, name: 'Arbitrum' },
    ],
};

// Simple ERC20 ABI for balance checks
const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)',
];

// Cache for price data
const priceCache: Map<string, { price: number; change24h: number; timestamp: number }> = new Map();
const PRICE_CACHE_TTL = 60000; // 1 minute

// Fetch token prices from CoinGecko or similar
async function getTokenPrices(symbols: string[]): Promise<Record<string, { price: number; change24h: number }>> {
    const result: Record<string, { price: number; change24h: number }> = {};
    const now = Date.now();
    const symbolsToFetch: string[] = [];

    // Check cache first
    for (const symbol of symbols) {
        const cached = priceCache.get(symbol.toLowerCase());
        if (cached && now - cached.timestamp < PRICE_CACHE_TTL) {
            result[symbol] = { price: cached.price, change24h: cached.change24h };
        } else {
            symbolsToFetch.push(symbol);
        }
    }

    if (symbolsToFetch.length === 0) {
        return result;
    }

    try {
        // Map symbols to CoinGecko IDs
        const symbolToId: Record<string, string> = {
            'ETH': 'ethereum',
            'WETH': 'ethereum',
            'BTC': 'bitcoin',
            'WBTC': 'wrapped-bitcoin',
            'USDT': 'tether',
            'USDC': 'usd-coin',
            'DAI': 'dai',
            'LINK': 'chainlink',
            'UNI': 'uniswap',
            'MATIC': 'matic-network',
            'WMATIC': 'matic-network',
            'ARB': 'arbitrum',
            'OP': 'optimism',
        };

        const ids = symbolsToFetch
            .map(s => symbolToId[s.toUpperCase()])
            .filter(Boolean)
            .join(',');

        if (ids) {
            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
                { headers: { 'Accept': 'application/json' } }
            );

            if (response.ok) {
                const data = await response.json() as Record<string, { usd?: number; usd_24h_change?: number }>;

                for (const symbol of symbolsToFetch) {
                    const id = symbolToId[symbol.toUpperCase()];
                    if (id && data[id]) {
                        const price = data[id].usd || 0;
                        const change24h = data[id].usd_24h_change || 0;
                        result[symbol] = { price, change24h };
                        priceCache.set(symbol.toLowerCase(), { price, change24h, timestamp: now });
                    }
                }
            }
        }
    } catch (error) {
        logger.error('[WalletData] Failed to fetch prices:', error);
    }

    // Fill in missing prices with 0
    for (const symbol of symbolsToFetch) {
        if (!result[symbol]) {
            result[symbol] = { price: 0, change24h: 0 };
        }
    }

    return result;
}

// Covalent API - Get token balances for a wallet
async function getCovalentTokenBalances(address: string, chainId: number): Promise<any[]> {
    const chainName = COVALENT_CHAIN_MAP[chainId];
    if (!chainName || !COVALENT_API_KEY) {
        logger.warn('[Covalent] No chain mapping or API key');
        return [];
    }

    try {
        const response = await axios.get(
            `https://api.covalenthq.com/v1/${chainName}/address/${address}/balances_v2/`,
            {
                headers: {
                    'Authorization': `Basic ${Buffer.from(COVALENT_API_KEY + ':').toString('base64')}`,
                },
                params: {
                    'quote-currency': 'USD',
                    'no-spam': true,
                },
            }
        );

        if (response.data?.data?.items) {
            return response.data.data.items.filter((item: any) =>
                item.balance && parseFloat(item.balance) > 0
            );
        }
        return [];
    } catch (error: any) {
        logger.error('[Covalent] Failed to fetch balances:', error.response?.data || error.message);
        return [];
    }
}

// Covalent API - Get transaction history
async function getCovalentTransactions(address: string, chainId: number, limit = 50): Promise<any[]> {
    const chainName = COVALENT_CHAIN_MAP[chainId];
    if (!chainName || !COVALENT_API_KEY) {
        return [];
    }

    try {
        const response = await axios.get(
            `https://api.covalenthq.com/v1/${chainName}/address/${address}/transactions_v3/`,
            {
                headers: {
                    'Authorization': `Basic ${Buffer.from(COVALENT_API_KEY + ':').toString('base64')}`,
                },
                params: {
                    'quote-currency': 'USD',
                    'page-size': limit,
                },
            }
        );

        if (response.data?.data?.items) {
            return response.data.data.items;
        }
        return [];
    } catch (error: any) {
        logger.error('[Covalent] Failed to fetch transactions:', error.response?.data || error.message);
        return [];
    }
}

// 1inch API - Get token prices
async function get1inchPrices(tokenAddresses: string[], chainId: number): Promise<Record<string, number>> {
    if (!ONEINCH_API_KEY) return {};

    try {
        const response = await axios.get(
            `https://api.1inch.dev/price/v1.1/${chainId}`,
            {
                headers: {
                    'Authorization': `Bearer ${ONEINCH_API_KEY}`,
                },
                params: {
                    currency: 'USD',
                },
            }
        );

        return response.data || {};
    } catch (error: any) {
        logger.error('[1inch] Failed to fetch prices:', error.response?.data || error.message);
        return {};
    }
}

// GET /api/wallet/overview - Get wallet balance overview
router.get('/overview', async (req: Request, res: Response) => {
    try {
        const { address, chainId = '1' } = req.query;

        if (!address || typeof address !== 'string') {
            return res.status(400).json({ error: 'Address is required' });
        }

        const chain = parseInt(chainId as string, 10);
        const rpcUrl = RPC_URLS[chain] || RPC_URLS[1];
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // Get native balance
        const nativeBalance = await provider.getBalance(address);
        const nativeBalanceEth = parseFloat(ethers.formatEther(nativeBalance));

        // Get token balances and prices
        const tokens = COMMON_TOKENS[chain] || COMMON_TOKENS[1];
        const prices = await getTokenPrices(['ETH', ...tokens.map(t => t.symbol)]);

        let totalBalanceUSD = nativeBalanceEth * (prices['ETH']?.price || 0);
        let totalChange24h = 0;

        // Calculate total from tokens
        for (const token of tokens) {
            try {
                const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
                const balance = await contract.balanceOf(address);
                const balanceFormatted = parseFloat(ethers.formatUnits(balance, token.decimals));
                const price = prices[token.symbol]?.price || 0;
                totalBalanceUSD += balanceFormatted * price;
            } catch (error) {
                // Token might not exist on this chain or address has no balance
            }
        }

        // Calculate 24h change
        const ethChange = prices['ETH']?.change24h || 0;
        totalChange24h = totalBalanceUSD * (ethChange / 100);
        const totalChangePercent24h = ethChange;

        res.json({
            totalBalanceUSD,
            totalChange24h,
            totalChangePercent24h,
        });
    } catch (error: any) {
        logger.error('[WalletData] Overview error:', error);
        res.status(500).json({ error: 'Failed to fetch wallet overview' });
    }
});

// GET /api/wallet/tokens - Get token balances
router.get('/tokens', async (req: Request, res: Response) => {
    try {
        const { address, chainId = '1' } = req.query;

        if (!address || typeof address !== 'string') {
            return res.status(400).json({ error: 'Address is required' });
        }

        const chain = parseInt(chainId as string, 10);
        const tokens: any[] = [];

        // Try Covalent first (more comprehensive)
        const covalentTokens = await getCovalentTokenBalances(address, chain);

        if (covalentTokens.length > 0) {
            // Get symbols for price lookup
            const symbols = covalentTokens.map((t: any) => t.contract_ticker_symbol).filter(Boolean);
            const prices = await getTokenPrices(symbols);

            for (const item of covalentTokens) {
                const balance = parseFloat(item.balance) / Math.pow(10, item.contract_decimals || 18);
                const symbol = item.contract_ticker_symbol || 'UNKNOWN';
                const price = item.quote_rate || prices[symbol]?.price || 0;
                const change24h = item.quote_rate_24h
                    ? ((price - item.quote_rate_24h) / item.quote_rate_24h) * 100
                    : prices[symbol]?.change24h || 0;

                tokens.push({
                    symbol,
                    name: item.contract_name || symbol,
                    address: item.contract_address,
                    decimals: item.contract_decimals || 18,
                    balance: balance.toString(),
                    balanceUSD: item.quote || balance * price,
                    price,
                    priceChange24h: change24h,
                    icon: item.logo_url || `/icons/${symbol.toLowerCase()}.svg`,
                    chainId: chain,
                    verified: !item.is_spam,
                });
            }

            logger.info(`[Covalent] Fetched ${tokens.length} tokens for ${address}`);
        } else {
            // Fallback to RPC method
            logger.info('[WalletData] Falling back to RPC method');
            const rpcUrl = RPC_URLS[chain] || RPC_URLS[1];
            const provider = new ethers.JsonRpcProvider(rpcUrl);

            const tokensToCheck = COMMON_TOKENS[chain] || COMMON_TOKENS[1];
            const symbolList = ['ETH', ...tokensToCheck.map(t => t.symbol)];
            const prices = await getTokenPrices(symbolList);

            // Add native balance
            const nativeBalance = await provider.getBalance(address);
            const nativeBalanceEth = parseFloat(ethers.formatEther(nativeBalance));
            const ethPrice = prices['ETH']?.price || 0;
            const ethChange = prices['ETH']?.change24h || 0;

            if (nativeBalanceEth > 0) {
                tokens.push({
                    symbol: chain === 137 ? 'MATIC' : 'ETH',
                    name: chain === 137 ? 'Polygon' : 'Ethereum',
                    address: '0x0000000000000000000000000000000000000000',
                    decimals: 18,
                    balance: nativeBalanceEth.toString(),
                    balanceUSD: nativeBalanceEth * ethPrice,
                    price: ethPrice,
                    priceChange24h: ethChange,
                    icon: chain === 137 ? '/icons/matic.svg' : '/icons/eth.svg',
                    chainId: chain,
                });
            }

            // Check ERC20 token balances
            for (const token of tokensToCheck) {
                try {
                    const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
                    const balance = await contract.balanceOf(address);
                    const balanceFormatted = parseFloat(ethers.formatUnits(balance, token.decimals));

                    if (balanceFormatted > 0) {
                        const price = prices[token.symbol]?.price || 0;
                        const change = prices[token.symbol]?.change24h || 0;

                        tokens.push({
                            symbol: token.symbol,
                            name: token.name,
                            address: token.address,
                            decimals: token.decimals,
                            balance: balanceFormatted.toString(),
                            balanceUSD: balanceFormatted * price,
                            price,
                            priceChange24h: change,
                            icon: `/icons/${token.symbol.toLowerCase()}.svg`,
                            chainId: chain,
                        });
                    }
                } catch (error) {
                    // Token check failed, skip it
                }
            }
        }

        // Sort by USD value
        tokens.sort((a, b) => b.balanceUSD - a.balanceUSD);

        res.json({ tokens, source: covalentTokens.length > 0 ? 'covalent' : 'rpc' });
    } catch (error: any) {
        logger.error('[WalletData] Tokens error:', error);
        res.status(500).json({ error: 'Failed to fetch token balances' });
    }
});

// GET /api/wallet/transactions - Get transaction history
router.get('/transactions', async (req: Request, res: Response) => {
    try {
        const { address, chainId = '1', limit = '50' } = req.query;

        if (!address || typeof address !== 'string') {
            return res.status(400).json({ error: 'Address is required' });
        }

        const chain = parseInt(chainId as string, 10);
        const txLimit = parseInt(limit as string, 10);
        let transactions: any[] = [];
        let source = 'none';

        // Try Covalent first
        const covalentTxs = await getCovalentTransactions(address, chain, txLimit);

        if (covalentTxs.length > 0) {
            source = 'covalent';
            for (const tx of covalentTxs) {
                const isReceive = tx.to_address?.toLowerCase() === address.toLowerCase();
                const value = tx.value ? parseFloat(tx.value) / 1e18 : 0;

                transactions.push({
                    id: tx.tx_hash,
                    hash: tx.tx_hash,
                    type: tx.log_events?.length > 0 ? 'contract' : (isReceive ? 'receive' : 'send'),
                    status: tx.successful ? 'confirmed' : 'failed',
                    from: tx.from_address,
                    to: tx.to_address,
                    value: value.toString(),
                    valueUSD: tx.value_quote || 0,
                    token: chain === 137 ? 'MATIC' : 'ETH',
                    tokenSymbol: chain === 137 ? 'MATIC' : 'ETH',
                    gasUsed: tx.gas_spent?.toString() || '0',
                    gasFee: tx.gas_quote?.toString() || '0',
                    gasCostUSD: tx.gas_quote || 0,
                    timestamp: new Date(tx.block_signed_at).getTime(),
                    chainId: chain,
                    blockNumber: tx.block_height,
                });
            }
            logger.info(`[Covalent] Fetched ${transactions.length} transactions for ${address}`);
        } else {
            // Fallback to Etherscan/Polygonscan
            source = 'explorer';
            const explorerApis: Record<number, string> = {
                1: `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY || ''}`,
                137: `https://api.polygonscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${process.env.POLYGONSCAN_API_KEY || ''}`,
                42161: `https://api.arbiscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${process.env.ARBISCAN_API_KEY || ''}`,
            };

            const apiUrl = explorerApis[chain];

            if (apiUrl) {
                try {
                    const response = await fetch(apiUrl);
                    const data = await response.json() as { status: string; result: any[] };

                    if (data.status === '1' && Array.isArray(data.result)) {
                        const txs = data.result.slice(0, txLimit);

                        for (const tx of txs) {
                            const isReceive = tx.to.toLowerCase() === address.toLowerCase();
                            const value = parseFloat(ethers.formatEther(tx.value));

                            transactions.push({
                                id: tx.hash,
                                hash: tx.hash,
                                type: isReceive ? 'receive' : 'send',
                                status: tx.txreceipt_status === '1' ? 'confirmed' : 'failed',
                                from: tx.from,
                                to: tx.to,
                                value: value.toString(),
                                valueUSD: 0,
                                token: 'ETH',
                                tokenSymbol: chain === 137 ? 'MATIC' : 'ETH',
                                gasUsed: tx.gasUsed,
                                gasFee: ethers.formatEther(BigInt(tx.gasUsed) * BigInt(tx.gasPrice)),
                                timestamp: parseInt(tx.timeStamp, 10) * 1000,
                                chainId: chain,
                                blockNumber: parseInt(tx.blockNumber, 10),
                            });
                        }
                    }
                } catch (error) {
                    logger.error('[WalletData] Explorer API error:', error);
                }
            }
        }

        res.json({ transactions, source });
    } catch (error: any) {
        logger.error('[WalletData] Transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// GET /api/wallet/nfts - Get NFTs
router.get('/nfts', async (req: Request, res: Response) => {
    try {
        const { address, chainId = '1' } = req.query;

        if (!address || typeof address !== 'string') {
            return res.status(400).json({ error: 'Address is required' });
        }

        // For NFTs, we'd typically use Alchemy, Moralis, or OpenSea API
        // For now, return empty array - implement with actual NFT provider
        const nfts: any[] = [];

        res.json({ nfts });
    } catch (error: any) {
        logger.error('[WalletData] NFTs error:', error);
        res.status(500).json({ error: 'Failed to fetch NFTs' });
    }
});

export default router;
