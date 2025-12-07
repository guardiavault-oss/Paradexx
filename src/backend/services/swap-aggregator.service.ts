/**
 * Swap Aggregator Service - Best Price DEX Aggregation
 * 
 * Aggregates quotes from multiple DEXs to find best price:
 * - 0x Protocol
 * - 1inch
 * - Paraswap
 * - Kyber Network
 * - OpenOcean
 */

import { EventEmitter } from 'events';
import { logger } from '../services/logger.service';
import axios from 'axios';
import { ethers } from 'ethers';
import { walletService } from './wallet.service';
import { seedlessWalletService } from './seedless-wallet.service';
import { prisma } from '../config/database';

// API Keys
const ZEROX_API_KEY = process.env.ZEROX_API_KEY || '';
const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY || '';
const PARASWAP_API_KEY = process.env.PARASWAP_API_KEY || '';

// API Endpoints
const ZEROX_API = 'https://api.0x.org';
const ONEINCH_API = 'https://api.1inch.dev/swap/v6.0';
const PARASWAP_API = 'https://apiv5.paraswap.io';
const OPENOCEAN_API = 'https://open-api.openocean.finance/v3';

// Supported chains
const CHAIN_IDS: Record<string, number> = {
    ethereum: 1,
    polygon: 137,
    bsc: 56,
    arbitrum: 42161,
    optimism: 10,
    base: 8453,
    avalanche: 43114,
};

export interface Token {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
}

export interface SwapQuote {
    source: string;
    fromToken: Token;
    toToken: Token;
    fromAmount: string;
    toAmount: string;
    price: string;
    priceImpact: number;
    estimatedGas: string;
    gasCostUSD: string;
    route: SwapRoute[];
    data?: string; // Transaction data
    to?: string;   // Contract address
    value?: string; // ETH value
}

export interface SwapRoute {
    protocol: string;
    fromToken: string;
    toToken: string;
    percentage: number;
}

export interface SwapResult {
    success: boolean;
    transactionHash?: string;
    fromAmount: string;
    toAmount: string;
    effectivePrice: string;
    gasCost: string;
    source: string;
    error?: string;
}

class SwapAggregatorService extends EventEmitter {
    private tokenCache: Map<string, Map<string, Token>> = new Map();

    /**
     * Get quotes from all DEX aggregators
     */
    async getQuotes(
        chainId: number,
        fromToken: string,
        toToken: string,
        amount: string,
        userAddress: string,
        slippage: number = 0.5
    ): Promise<SwapQuote[]> {
        const quotes: SwapQuote[] = [];

        // Fetch from all sources in parallel
        const [zeroXQuote, oneInchQuote, paraswapQuote, openOceanQuote] = await Promise.allSettled([
            this.get0xQuote(chainId, fromToken, toToken, amount, userAddress, slippage),
            this.get1inchQuote(chainId, fromToken, toToken, amount, userAddress, slippage),
            this.getParaswapQuote(chainId, fromToken, toToken, amount, userAddress, slippage),
            this.getOpenOceanQuote(chainId, fromToken, toToken, amount, userAddress, slippage),
        ]);

        if (zeroXQuote.status === 'fulfilled' && zeroXQuote.value) {
            quotes.push(zeroXQuote.value);
        }
        if (oneInchQuote.status === 'fulfilled' && oneInchQuote.value) {
            quotes.push(oneInchQuote.value);
        }
        if (paraswapQuote.status === 'fulfilled' && paraswapQuote.value) {
            quotes.push(paraswapQuote.value);
        }
        if (openOceanQuote.status === 'fulfilled' && openOceanQuote.value) {
            quotes.push(openOceanQuote.value);
        }

        // Sort by best output amount
        quotes.sort((a, b) => {
            const aAmount = parseFloat(a.toAmount);
            const bAmount = parseFloat(b.toAmount);
            return bAmount - aAmount;
        });

        return quotes;
    }

    /**
     * Get best quote (highest output)
     */
    async getBestQuote(
        chainId: number,
        fromToken: string,
        toToken: string,
        amount: string,
        userAddress: string,
        slippage: number = 0.5
    ): Promise<SwapQuote | null> {
        const quotes = await this.getQuotes(chainId, fromToken, toToken, amount, userAddress, slippage);
        return quotes[0] || null;
    }

    /**
     * Execute swap using best quote
     */
    async executeSwap(
        userId: string,
        chainId: number,
        fromToken: string,
        toToken: string,
        amount: string,
        slippage: number = 0.5,
        sessionToken?: string
    ): Promise<SwapResult> {
        try {
            // Get user's wallet
            const wallet = await prisma.wallet.findFirst({
                where: { userId },
            });

            if (!wallet) {
                throw new Error('No wallet found');
            }

            // Get best quote with transaction data
            const quote = await this.getBestQuote(
                chainId,
                fromToken,
                toToken,
                amount,
                wallet.address,
                slippage
            );

            if (!quote || !quote.data || !quote.to) {
                throw new Error('No valid quote available');
            }

            // Check if token approval is needed (for ERC20 tokens)
            const isNativeToken = fromToken.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

            if (!isNativeToken) {
                await this.ensureTokenApproval(
                    userId,
                    chainId,
                    fromToken,
                    quote.to,
                    amount,
                    sessionToken
                );
            }

            // Execute the swap transaction
            let txHash: string;

            if (sessionToken) {
                // Use seedless wallet for transaction
                const result = await seedlessWalletService.signTransaction(userId, sessionToken, {
                    to: quote.to,
                    data: quote.data,
                    value: quote.value || '0',
                    gasLimit: quote.estimatedGas,
                });

                if (!result.success || !result.transactionHash) {
                    throw new Error(result.error || 'Transaction failed');
                }

                txHash = result.transactionHash;
            } else {
                throw new Error('Session token required for swap execution');
            }

            // Record the swap
            await this.recordSwap(userId, {
                chainId,
                fromToken,
                toToken,
                fromAmount: amount,
                toAmount: quote.toAmount,
                txHash,
                source: quote.source,
            });

            this.emit('swap_executed', {
                userId,
                txHash,
                fromToken,
                toToken,
                amount,
            });

            return {
                success: true,
                transactionHash: txHash,
                fromAmount: amount,
                toAmount: quote.toAmount,
                effectivePrice: quote.price,
                gasCost: quote.gasCostUSD,
                source: quote.source,
            };
        } catch (error: any) {
            logger.error('[SwapAggregator] Swap failed:', error);
            return {
                success: false,
                fromAmount: amount,
                toAmount: '0',
                effectivePrice: '0',
                gasCost: '0',
                source: 'none',
                error: error.message,
            };
        }
    }

    /**
     * Get quote from 0x Protocol
     */
    private async get0xQuote(
        chainId: number,
        fromToken: string,
        toToken: string,
        amount: string,
        userAddress: string,
        slippage: number
    ): Promise<SwapQuote | null> {
        try {
            const chainName = this.getChainName(chainId);
            const response = await axios.get(`${ZEROX_API}/${chainName}/swap/v1/quote`, {
                params: {
                    sellToken: fromToken,
                    buyToken: toToken,
                    sellAmount: amount,
                    takerAddress: userAddress,
                    slippagePercentage: slippage / 100,
                },
                headers: ZEROX_API_KEY ? { '0x-api-key': ZEROX_API_KEY } : {},
            });

            const data = response.data;

            return {
                source: '0x',
                fromToken: await this.getTokenInfo(chainId, fromToken),
                toToken: await this.getTokenInfo(chainId, toToken),
                fromAmount: data.sellAmount,
                toAmount: data.buyAmount,
                price: data.price,
                priceImpact: parseFloat(data.estimatedPriceImpact || '0'),
                estimatedGas: data.estimatedGas,
                gasCostUSD: data.estimatedGasUsd || '0',
                route: data.sources?.map((s: any) => ({
                    protocol: s.name,
                    fromToken,
                    toToken,
                    percentage: parseFloat(s.proportion) * 100,
                })) || [],
                data: data.data,
                to: data.to,
                value: data.value,
            };
        } catch (error) {
            logger.error('[0x] Quote failed:', error);
            return null;
        }
    }

    /**
     * Get quote from 1inch
     */
    private async get1inchQuote(
        chainId: number,
        fromToken: string,
        toToken: string,
        amount: string,
        userAddress: string,
        slippage: number
    ): Promise<SwapQuote | null> {
        try {
            const response = await axios.get(`${ONEINCH_API}/${chainId}/swap`, {
                params: {
                    src: fromToken,
                    dst: toToken,
                    amount,
                    from: userAddress,
                    slippage,
                    disableEstimate: false,
                },
                headers: ONEINCH_API_KEY ? { 'Authorization': `Bearer ${ONEINCH_API_KEY}` } : {},
            });

            const data = response.data;

            return {
                source: '1inch',
                fromToken: await this.getTokenInfo(chainId, fromToken),
                toToken: await this.getTokenInfo(chainId, toToken),
                fromAmount: data.fromAmount,
                toAmount: data.toAmount,
                price: (parseFloat(data.toAmount) / parseFloat(data.fromAmount)).toString(),
                priceImpact: 0, // 1inch doesn't return this directly
                estimatedGas: data.tx?.gas || '0',
                gasCostUSD: '0',
                route: data.protocols?.[0]?.map((step: any) => ({
                    protocol: step[0]?.name || 'Unknown',
                    fromToken: step[0]?.fromTokenAddress || fromToken,
                    toToken: step[0]?.toTokenAddress || toToken,
                    percentage: step[0]?.part || 100,
                })) || [],
                data: data.tx?.data,
                to: data.tx?.to,
                value: data.tx?.value,
            };
        } catch (error) {
            logger.error('[1inch] Quote failed:', error);
            return null;
        }
    }

    /**
     * Get quote from Paraswap
     */
    private async getParaswapQuote(
        chainId: number,
        fromToken: string,
        toToken: string,
        amount: string,
        userAddress: string,
        slippage: number
    ): Promise<SwapQuote | null> {
        try {
            // Get price route
            const priceResponse = await axios.get(`${PARASWAP_API}/prices`, {
                params: {
                    srcToken: fromToken,
                    destToken: toToken,
                    amount,
                    srcDecimals: 18,
                    destDecimals: 18,
                    network: chainId,
                },
            });

            const priceData = priceResponse.data.priceRoute;

            // Build transaction
            const txResponse = await axios.post(`${PARASWAP_API}/transactions/${chainId}`, {
                srcToken: fromToken,
                destToken: toToken,
                srcAmount: amount,
                destAmount: priceData.destAmount,
                priceRoute: priceData,
                userAddress,
                slippage: slippage * 100, // Paraswap uses basis points
            });

            const txData = txResponse.data;

            return {
                source: 'Paraswap',
                fromToken: await this.getTokenInfo(chainId, fromToken),
                toToken: await this.getTokenInfo(chainId, toToken),
                fromAmount: amount,
                toAmount: priceData.destAmount,
                price: (parseFloat(priceData.destAmount) / parseFloat(amount)).toString(),
                priceImpact: parseFloat(priceData.priceImpact || '0'),
                estimatedGas: priceData.gasCost || '0',
                gasCostUSD: priceData.gasCostUSD || '0',
                route: priceData.bestRoute?.map((r: any) => ({
                    protocol: r.exchange,
                    fromToken: r.srcToken,
                    toToken: r.destToken,
                    percentage: parseFloat(r.percent),
                })) || [],
                data: txData.data,
                to: txData.to,
                value: txData.value,
            };
        } catch (error) {
            logger.error('[Paraswap] Quote failed:', error);
            return null;
        }
    }

    /**
     * Get quote from OpenOcean
     */
    private async getOpenOceanQuote(
        chainId: number,
        fromToken: string,
        toToken: string,
        amount: string,
        userAddress: string,
        slippage: number
    ): Promise<SwapQuote | null> {
        try {
            const chainName = this.getOpenOceanChainName(chainId);
            const response = await axios.get(`${OPENOCEAN_API}/${chainName}/swap_quote`, {
                params: {
                    inTokenAddress: fromToken,
                    outTokenAddress: toToken,
                    amount: ethers.formatUnits(amount, 18), // OpenOcean expects human readable
                    gasPrice: 5,
                    slippage,
                    account: userAddress,
                },
            });

            const data = response.data.data;

            return {
                source: 'OpenOcean',
                fromToken: await this.getTokenInfo(chainId, fromToken),
                toToken: await this.getTokenInfo(chainId, toToken),
                fromAmount: amount,
                toAmount: ethers.parseUnits(data.outAmount, 18).toString(),
                price: data.price,
                priceImpact: parseFloat(data.priceImpact || '0'),
                estimatedGas: data.estimatedGas || '0',
                gasCostUSD: '0',
                route: [{
                    protocol: 'OpenOcean',
                    fromToken,
                    toToken,
                    percentage: 100,
                }],
                data: data.data,
                to: data.to,
                value: data.value,
            };
        } catch (error) {
            logger.error('[OpenOcean] Quote failed:', error);
            return null;
        }
    }

    /**
     * Ensure token approval for spender
     */
    private async ensureTokenApproval(
        userId: string,
        chainId: number,
        tokenAddress: string,
        spenderAddress: string,
        amount: string,
        sessionToken?: string
    ): Promise<void> {
        // Check current allowance
        const provider = this.getProvider(chainId);
        const tokenContract = new ethers.Contract(
            tokenAddress,
            ['function allowance(address,address) view returns (uint256)'],
            provider
        );

        const wallet = await prisma.wallet.findFirst({ where: { userId } });
        if (!wallet) throw new Error('Wallet not found');

        const currentAllowance = await tokenContract.allowance(wallet.address, spenderAddress);

        if (currentAllowance >= BigInt(amount)) {
            return; // Already approved
        }

        // Need to approve - create approval transaction
        const approvalData = new ethers.Interface([
            'function approve(address spender, uint256 amount)',
        ]).encodeFunctionData('approve', [spenderAddress, ethers.MaxUint256]);

        if (sessionToken) {
            await seedlessWalletService.signTransaction(userId, sessionToken, {
                to: tokenAddress,
                data: approvalData,
                value: '0',
            });
        }
    }

    /**
     * Get token info
     */
    private async getTokenInfo(chainId: number, address: string): Promise<Token> {
        // Check cache
        const chainCache = this.tokenCache.get(chainId.toString()) || new Map();
        if (chainCache.has(address.toLowerCase())) {
            return chainCache.get(address.toLowerCase())!;
        }

        // Native token
        if (address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
            const nativeToken: Token = {
                address,
                symbol: this.getNativeSymbol(chainId),
                name: this.getNativeName(chainId),
                decimals: 18,
            };
            chainCache.set(address.toLowerCase(), nativeToken);
            this.tokenCache.set(chainId.toString(), chainCache);
            return nativeToken;
        }

        // Fetch from chain
        try {
            const provider = this.getProvider(chainId);
            const contract = new ethers.Contract(
                address,
                [
                    'function symbol() view returns (string)',
                    'function name() view returns (string)',
                    'function decimals() view returns (uint8)',
                ],
                provider
            );

            const [symbol, name, decimals] = await Promise.all([
                contract.symbol(),
                contract.name(),
                contract.decimals(),
            ]);

            const token: Token = { address, symbol, name, decimals };
            chainCache.set(address.toLowerCase(), token);
            this.tokenCache.set(chainId.toString(), chainCache);
            return token;
        } catch {
            return { address, symbol: 'UNKNOWN', name: 'Unknown Token', decimals: 18 };
        }
    }

    /**
     * Record swap in database
     */
    private async recordSwap(userId: string, swap: {
        chainId: number;
        fromToken: string;
        toToken: string;
        fromAmount: string;
        toAmount: string;
        txHash: string;
        source: string;
    }): Promise<void> {
        await (prisma.transaction as any).create({
            data: {
                userId,
                type: 'swap',
                hash: swap.txHash,
                chain: String(swap.chainId),
                status: 'pending',
                value: swap.fromAmount,
                metadata: JSON.stringify({
                    source: swap.source,
                    fromToken: swap.fromToken,
                    toToken: swap.toToken,
                    toAmount: swap.toAmount,
                }),
            },
        });
    }

    /**
     * Get RPC provider for chain
     */
    private getProvider(chainId: number): ethers.JsonRpcProvider {
        const rpcUrls: Record<number, string> = {
            1: process.env.ETH_RPC_URL || 'https://eth.llamarpc.com',
            137: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
            56: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
            42161: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
            10: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
            8453: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
            43114: process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
        };

        return new ethers.JsonRpcProvider(rpcUrls[chainId] || rpcUrls[1]);
    }

    private getChainName(chainId: number): string {
        const names: Record<number, string> = {
            1: 'ethereum',
            137: 'polygon',
            56: 'bsc',
            42161: 'arbitrum',
            10: 'optimism',
            8453: 'base',
            43114: 'avalanche',
        };
        return names[chainId] || 'ethereum';
    }

    private getOpenOceanChainName(chainId: number): string {
        const names: Record<number, string> = {
            1: 'eth',
            137: 'polygon',
            56: 'bsc',
            42161: 'arbitrum',
            10: 'optimism',
            8453: 'base',
            43114: 'avax',
        };
        return names[chainId] || 'eth';
    }

    private getNativeSymbol(chainId: number): string {
        const symbols: Record<number, string> = {
            1: 'ETH', 137: 'MATIC', 56: 'BNB', 42161: 'ETH', 10: 'ETH', 8453: 'ETH', 43114: 'AVAX',
        };
        return symbols[chainId] || 'ETH';
    }

    private getNativeName(chainId: number): string {
        const names: Record<number, string> = {
            1: 'Ethereum', 137: 'Polygon', 56: 'BNB', 42161: 'Ethereum', 10: 'Ethereum', 8453: 'Ethereum', 43114: 'Avalanche',
        };
        return names[chainId] || 'Ethereum';
    }

    /**
     * Get supported tokens for a chain
     */
    async getSupportedTokens(chainId: number): Promise<Token[]> {
        try {
            const response = await axios.get(`${ONEINCH_API}/${chainId}/tokens`);
            return Object.values(response.data.tokens);
        } catch {
            return [];
        }
    }
}

export const swapAggregatorService = new SwapAggregatorService();
