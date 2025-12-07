// Moralis Service - Blockchain data, NFTs, token balances, transactions

import axios from 'axios';
import { logger } from '../services/logger.service';

const MORALIS_API = 'https://deep-index.moralis.io/api/v2';
const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

export interface TokenBalance {
  token_address: string;
  name: string;
  symbol: string;
  logo?: string;
  thumbnail?: string;
  decimals: number;
  balance: string;
  possible_spam: boolean;
  verified_contract: boolean;
  usd_price?: number;
  usd_value?: number;
  native_token?: boolean;
}

export interface NFT {
  token_address: string;
  token_id: string;
  amount: string;
  owner_of: string;
  token_hash: string;
  block_number: string;
  block_number_minted: string;
  contract_type: string;
  name: string;
  symbol: string;
  token_uri?: string;
  metadata?: string;
  normalized_metadata?: NFTMetadata;
  verified_collection: boolean;
  possible_spam: boolean;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface Transaction {
  hash: string;
  nonce: string;
  transaction_index: string;
  from_address: string;
  to_address: string;
  value: string;
  gas: string;
  gas_price: string;
  input: string;
  receipt_cumulative_gas_used: string;
  receipt_gas_used: string;
  receipt_status: string;
  block_timestamp: string;
  block_number: string;
  block_hash: string;
}

export interface TokenPrice {
  tokenAddress: string;
  symbol: string;
  name: string;
  usdPrice: number;
  exchangeName: string;
  exchangeAddress: string;
  priceChange24h: number;
}

export class MoralisService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = MORALIS_API_KEY!;
    this.baseUrl = MORALIS_API;
  }

  // Get native balance (ETH, MATIC, etc.)
  async getNativeBalance(
    address: string,
    chainId: number = 1
  ): Promise<{ balance: string; balanceFormatted: string }> {
    try {
      const chain = this.getChainHex(chainId);
      const response = await axios.get(`${this.baseUrl}/${address}/balance`, {
        params: { chain },
        headers: { 'X-API-Key': this.apiKey },
      });

      return {
        balance: response.data.balance,
        balanceFormatted: (parseFloat(response.data.balance) / 1e18).toFixed(4),
      };
    } catch (error: any) {
      logger.error('Moralis native balance error:', error.response?.data || error.message);
      throw new Error('Failed to get native balance');
    }
  }

  // Get ERC-20 token balances
  async getTokenBalances(
    address: string,
    chainId: number = 1
  ): Promise<TokenBalance[]> {
    try {
      const chain = this.getChainHex(chainId);
      const response = await axios.get(`${this.baseUrl}/${address}/erc20`, {
        params: { chain },
        headers: { 'X-API-Key': this.apiKey },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Moralis token balances error:', error.response?.data || error.message);
      throw new Error('Failed to get token balances');
    }
  }

  // Get NFTs owned by address
  async getNFTs(
    address: string,
    chainId: number = 1,
    limit: number = 100
  ): Promise<NFT[]> {
    try {
      const chain = this.getChainHex(chainId);
      const response = await axios.get(`${this.baseUrl}/${address}/nft`, {
        params: {
          chain,
          limit,
          normalizeMetadata: true,
        },
        headers: { 'X-API-Key': this.apiKey },
      });

      return response.data.result || [];
    } catch (error: any) {
      logger.error('Moralis NFTs error:', error.response?.data || error.message);
      throw new Error('Failed to get NFTs');
    }
  }

  // Get NFT metadata
  async getNFTMetadata(
    tokenAddress: string,
    tokenId: string,
    chainId: number = 1
  ): Promise<NFT> {
    try {
      const chain = this.getChainHex(chainId);
      const response = await axios.get(
        `${this.baseUrl}/nft/${tokenAddress}/${tokenId}`,
        {
          params: {
            chain,
            normalizeMetadata: true,
          },
          headers: { 'X-API-Key': this.apiKey },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Moralis NFT metadata error:', error.response?.data || error.message);
      throw new Error('Failed to get NFT metadata');
    }
  }

  // Get wallet transactions
  async getTransactions(
    address: string,
    chainId: number = 1,
    limit: number = 100
  ): Promise<Transaction[]> {
    try {
      const chain = this.getChainHex(chainId);
      const response = await axios.get(`${this.baseUrl}/${address}`, {
        params: {
          chain,
          limit,
        },
        headers: { 'X-API-Key': this.apiKey },
      });

      return response.data.result || [];
    } catch (error: any) {
      logger.error('Moralis transactions error:', error.response?.data || error.message);
      throw new Error('Failed to get transactions');
    }
  }

  // Get token price
  async getTokenPrice(
    tokenAddress: string,
    chainId: number = 1
  ): Promise<TokenPrice> {
    try {
      const chain = this.getChainHex(chainId);
      const response = await axios.get(
        `${this.baseUrl}/erc20/${tokenAddress}/price`,
        {
          params: { chain },
          headers: { 'X-API-Key': this.apiKey },
        }
      );

      return {
        tokenAddress,
        symbol: response.data.symbol,
        name: response.data.name,
        usdPrice: response.data.usdPrice,
        exchangeName: response.data.exchangeName,
        exchangeAddress: response.data.exchangeAddress,
        priceChange24h: response.data['24hrPercentChange'] || 0,
      };
    } catch (error: any) {
      logger.error('Moralis token price error:', error.response?.data || error.message);
      throw new Error('Failed to get token price');
    }
  }

  // Get multiple token prices
  async getMultipleTokenPrices(
    tokens: Array<{ address: string; chainId: number }>
  ): Promise<Map<string, TokenPrice>> {
    const prices = new Map<string, TokenPrice>();

    await Promise.all(
      tokens.map(async (token) => {
        try {
          const price = await this.getTokenPrice(token.address, token.chainId);
          prices.set(token.address.toLowerCase(), price);
        } catch (error) {
          logger.error(`Failed to get price for ${token.address}:`, error);
        }
      })
    );

    return prices;
  }

  // Get token metadata
  async getTokenMetadata(
    tokenAddress: string,
    chainId: number = 1
  ): Promise<any> {
    try {
      const chain = this.getChainHex(chainId);
      const response = await axios.get(
        `${this.baseUrl}/erc20/metadata`,
        {
          params: {
            chain,
            addresses: [tokenAddress],
          },
          headers: { 'X-API-Key': this.apiKey },
        }
      );

      return response.data[0];
    } catch (error: any) {
      logger.error('Moralis token metadata error:', error.response?.data || error.message);
      throw new Error('Failed to get token metadata');
    }
  }

  // Get NFT transfers
  async getNFTTransfers(
    address: string,
    chainId: number = 1,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const chain = this.getChainHex(chainId);
      const response = await axios.get(`${this.baseUrl}/${address}/nft/transfers`, {
        params: {
          chain,
          limit,
        },
        headers: { 'X-API-Key': this.apiKey },
      });

      return response.data.result || [];
    } catch (error: any) {
      logger.error('Moralis NFT transfers error:', error.response?.data || error.message);
      throw new Error('Failed to get NFT transfers');
    }
  }

  // Get ERC-20 transfers
  async getERC20Transfers(
    address: string,
    chainId: number = 1,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const chain = this.getChainHex(chainId);
      const response = await axios.get(`${this.baseUrl}/${address}/erc20/transfers`, {
        params: {
          chain,
          limit,
        },
        headers: { 'X-API-Key': this.apiKey },
      });

      return response.data.result || [];
    } catch (error: any) {
      logger.error('Moralis ERC20 transfers error:', error.response?.data || error.message);
      throw new Error('Failed to get ERC-20 transfers');
    }
  }

  // Get wallet portfolio
  async getWalletPortfolio(
    address: string,
    chainId: number = 1
  ): Promise<{
    native: { balance: string; usdValue: number };
    tokens: TokenBalance[];
    totalUsdValue: number;
  }> {
    try {
      const [native, tokens] = await Promise.all([
        this.getNativeBalance(address, chainId),
        this.getTokenBalances(address, chainId),
      ]);

      // Calculate total USD value
      let totalUsdValue = 0;
      tokens.forEach((token) => {
        if (token.usd_value) {
          totalUsdValue += token.usd_value;
        }
      });

      return {
        native: {
          balance: native.balanceFormatted,
          usdValue: 0, // TODO: Get native token price
        },
        tokens,
        totalUsdValue,
      };
    } catch (error) {
      logger.error('Moralis portfolio error:', error);
      throw new Error('Failed to get wallet portfolio');
    }
  }

  // Resolve ENS name
  async resolveENS(ensName: string): Promise<string | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/resolve/${ensName}`, {
        headers: { 'X-API-Key': this.apiKey },
      });

      return response.data.address;
    } catch (error) {
      logger.error('Moralis ENS resolve error:', error);
      return null;
    }
  }

  // Reverse resolve ENS (address to name)
  async reverseResolveENS(address: string): Promise<string | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/resolve/${address}/reverse`, {
        headers: { 'X-API-Key': this.apiKey },
      });

      return response.data.name;
    } catch (error) {
      logger.error('Moralis ENS reverse resolve error:', error);
      return null;
    }
  }

  // Helper: Convert chainId to Moralis chain format
  private getChainHex(chainId: number): string {
    const chains: Record<number, string> = {
      1: '0x1', // Ethereum
      5: '0x5', // Goerli
      11155111: '0xaa36a7', // Sepolia
      137: '0x89', // Polygon
      80001: '0x13881', // Mumbai
      56: '0x38', // BSC
      97: '0x61', // BSC Testnet
      43114: '0xa86a', // Avalanche
      43113: '0xa869', // Avalanche Fuji
      250: '0xfa', // Fantom
      42161: '0xa4b1', // Arbitrum
      421613: '0x66eed', // Arbitrum Goerli
      10: '0xa', // Optimism
      420: '0x1a4', // Optimism Goerli
    };

    return chains[chainId] || '0x1';
  }
}

// Export instance
export const moralis = new MoralisService();
