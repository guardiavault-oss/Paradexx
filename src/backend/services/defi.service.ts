// DeFi Service - 1inch, DEX aggregation, swap routing

import axios from 'axios';
import { logger } from '../services/logger.service';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ONEINCH_API = 'https://api.1inch.dev';
const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY;
const DEV_MODE = !ONEINCH_API_KEY;

if (!ONEINCH_API_KEY) {
  logger.warn('⚠️  ONEINCH_API_KEY not set. Trading/swap features will use mock data (dev mode).');
}

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  estimatedGas: string;
  protocols: Protocol[];
  dex: string;
  priceImpact: number;
  slippage: number;
}

export interface Protocol {
  name: string;
  part: number;
  fromTokenAddress: string;
  toTokenAddress: string;
}

export interface SwapTransaction {
  from: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
}

export class OneInchService {
  private chainId: number;
  private apiKey: string;
  private isDevMode: boolean;

  constructor(chainId: number = 1) {
    this.chainId = chainId;
    this.apiKey = process.env.ONEINCH_API_KEY || ONEINCH_API_KEY || '';
    this.isDevMode = !this.apiKey;
    
    if (this.isDevMode) {
      logger.warn(`[1inch] Running in dev mode for chainId ${chainId}`);
    }
  }

  // Generate mock quote for dev mode
  private getMockQuote(fromToken: string, toToken: string, amount: string): SwapQuote {
    const mockToAmount = (BigInt(amount) * BigInt(99) / BigInt(100)).toString();
    return {
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: mockToAmount,
      estimatedGas: '250000',
      protocols: [{ name: 'Uniswap V3', part: 100, fromTokenAddress: fromToken, toTokenAddress: toToken }],
      dex: 'Uniswap V3',
      priceImpact: 0.5,
      slippage: 1,
    };
  }

  // Get swap quote
  async getQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    slippage: number = 1
  ): Promise<SwapQuote> {
    // Return mock data in dev mode
    if (this.isDevMode) {
      logger.info('[1inch-dev] Returning mock quote');
      return this.getMockQuote(fromToken, toToken, amount);
    }

    try {
      const response = await axios.get(
        `${ONEINCH_API}/swap/v5.2/${this.chainId}/quote`,
        {
          params: {
            src: fromToken,
            dst: toToken,
            amount: amount,
            includeProtocols: true,
            includeGas: true,
          },
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const data = response.data;

      return {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: data.toAmount,
        estimatedGas: data.estimatedGas,
        protocols: data.protocols[0] || [],
        dex: this.getPrimaryDex(data.protocols),
        priceImpact: this.calculatePriceImpact(amount, data.toAmount),
        slippage,
      };
    } catch (error: any) {
      logger.error('1inch quote error:', error.response?.data || error.message);
      throw new Error('Failed to get swap quote');
    }
  }

  // Build swap transaction
  async buildSwap(
    fromToken: string,
    toToken: string,
    amount: string,
    fromAddress: string,
    slippage: number = 1,
    disableEstimate: boolean = false
  ): Promise<SwapTransaction> {
    // Return mock transaction in dev mode
    if (this.isDevMode) {
      logger.info('[1inch-dev] Returning mock swap transaction');
      return {
        from: fromAddress,
        to: '0x1111111254EEB25477B68fb85Ed929f73A960582',
        data: '0x',
        value: fromToken === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? amount : '0',
        gas: '250000',
        gasPrice: '20000000000',
      };
    }

    try {
      const response = await axios.get(
        `${ONEINCH_API}/swap/v5.2/${this.chainId}/swap`,
        {
          params: {
            src: fromToken,
            dst: toToken,
            amount: amount,
            from: fromAddress,
            slippage: slippage,
            disableEstimate: disableEstimate,
            allowPartialFill: false,
          },
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const tx = response.data.tx;

      return {
        from: tx.from,
        to: tx.to,
        data: tx.data,
        value: tx.value,
        gas: tx.gas,
        gasPrice: tx.gasPrice,
      };
    } catch (error: any) {
      logger.error('1inch swap error:', error.response?.data || error.message);
      throw new Error('Failed to build swap transaction');
    }
  }

  // Get supported tokens
  async getSupportedTokens(): Promise<Record<string, any>> {
    // Return mock tokens in dev mode
    if (this.isDevMode) {
      logger.info('[1inch-dev] Returning mock tokens');
      return {
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE': { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        '0xdAC17F958D2ee523a2206206994597C13D831ec7': { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
        '0x6B175474E89094C44Da98b954EesecdDAD3A9436': { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
      };
    }

    try {
      const response = await axios.get(
        `${ONEINCH_API}/swap/v5.2/${this.chainId}/tokens`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.tokens;
    } catch (error) {
      logger.error('1inch tokens error:', error);
      throw new Error('Failed to get supported tokens');
    }
  }

  // Get liquidity sources (DEXs)
  async getLiquiditySources(): Promise<string[]> {
    try {
      const response = await axios.get(
        `${ONEINCH_API}/swap/v5.2/${this.chainId}/liquidity-sources`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.protocols.map((p: any) => p.id);
    } catch (error) {
      logger.error('1inch liquidity sources error:', error);
      throw new Error('Failed to get liquidity sources');
    }
  }

  // Approve token for spending
  async getApproveTransaction(
    tokenAddress: string,
    amount?: string
  ): Promise<{ to: string; data: string }> {
    try {
      const response = await axios.get(
        `${ONEINCH_API}/swap/v5.2/${this.chainId}/approve/transaction`,
        {
          params: {
            tokenAddress,
            amount: amount || ethers.MaxUint256.toString(),
          },
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return {
        to: response.data.to,
        data: response.data.data,
      };
    } catch (error) {
      logger.error('1inch approve error:', error);
      throw new Error('Failed to get approve transaction');
    }
  }

  // Check allowance
  async checkAllowance(
    tokenAddress: string,
    walletAddress: string
  ): Promise<string> {
    try {
      const response = await axios.get(
        `${ONEINCH_API}/swap/v5.2/${this.chainId}/approve/allowance`,
        {
          params: {
            tokenAddress,
            walletAddress,
          },
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.allowance;
    } catch (error) {
      logger.error('1inch allowance error:', error);
      throw new Error('Failed to check allowance');
    }
  }

  // Helper: Get primary DEX from protocols
  private getPrimaryDex(protocols: any[][]): string {
    if (!protocols || protocols.length === 0) return 'Unknown';

    const firstProtocol = protocols[0];
    if (!firstProtocol || firstProtocol.length === 0) return 'Unknown';

    return firstProtocol[0][0]?.name || 'Unknown';
  }

  // Get spender address for approvals
  async getSpenderAddress(): Promise<string> {
    try {
      const response = await axios.get(
        `${ONEINCH_API}/swap/v5.2/${this.chainId}/approve/spender`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.address;
    } catch (error) {
      logger.error('1inch spender error:', error);
      throw new Error('Failed to get spender address');
    }
  }

  // Helper: Calculate price impact
  private calculatePriceImpact(fromAmount: string, toAmount: string): number {
    // Simplified calculation - in production use proper oracle prices
    return 0.5; // 0.5% default
  }
}

// Multi-chain DEX aggregator
export class DexAggregator {
  private oneInch: Map<number, OneInchService> = new Map();

  constructor() {
    // Initialize for multiple chains
    this.oneInch.set(1, new OneInchService(1)); // Ethereum
    this.oneInch.set(137, new OneInchService(137)); // Polygon
    this.oneInch.set(56, new OneInchService(56)); // BSC
    this.oneInch.set(42161, new OneInchService(42161)); // Arbitrum
    this.oneInch.set(10, new OneInchService(10)); // Optimism
  }

  // Get best swap route across all DEXs
  async getBestRoute(
    chainId: number,
    fromToken: string,
    toToken: string,
    amount: string
  ): Promise<SwapQuote> {
    const service = this.oneInch.get(chainId);
    if (!service) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    return service.getQuote(fromToken, toToken, amount);
  }

  // Compare routes from multiple aggregators
  async compareRoutes(
    chainId: number,
    fromToken: string,
    toToken: string,
    amount: string
  ): Promise<SwapQuote[]> {
    // In production, query multiple aggregators (1inch, 0x, ParaSwap, etc.)
    const service = this.oneInch.get(chainId);
    if (!service) return [];

    const quote = await service.getQuote(fromToken, toToken, amount);
    return [quote];
  }
}

// Token price service (multi-source)
export class TokenPriceService {
  // Get token price from multiple sources
  async getPrice(tokenAddress: string, chainId: number = 1): Promise<number> {
    try {
      // Try 1inch first
      const oneInch = new OneInchService(chainId);
      const quote = await oneInch.getQuote(
        tokenAddress,
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
        ethers.parseEther('1').toString()
      );

      const ethPrice = await this.getEthPrice();
      const tokenPrice = (parseFloat(quote.toAmount) / 1e18) * ethPrice;

      return tokenPrice;
    } catch (error) {
      logger.error('Token price error:', error);
      return 0;
    }
  }

  // Get ETH price in USD
  async getEthPrice(): Promise<number> {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price',
        {
          params: {
            ids: 'ethereum',
            vs_currencies: 'usd',
          },
        }
      );

      return response.data.ethereum.usd;
    } catch (error) {
      logger.error('ETH price error:', error);
      return 2000; // Fallback
    }
  }

  // Get multiple token prices
  async getPrices(
    tokens: Array<{ address: string; chainId: number }>
  ): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};

    await Promise.all(
      tokens.map(async (token) => {
        const price = await this.getPrice(token.address, token.chainId);
        prices[token.address] = price;
      })
    );

    return prices;
  }
}

// Export instances
export const dexAggregator = new DexAggregator();
export const tokenPriceService = new TokenPriceService();
