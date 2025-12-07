// Wallet Service - Blockchain wallet operations with ethers.js (PRODUCTION)

import { ethers } from 'ethers';
import { logger } from '../services/logger.service';
import crypto, { CipherGCM, DecipherGCM } from 'crypto';
import axios from 'axios';

// API Configuration
const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Log API status on load
if (MORALIS_API_KEY) {
  logger.info('✅ Moralis API configured for token discovery');
} else {
  logger.warn('⚠️ MORALIS_API_KEY not set - token discovery limited');
}

if (ETHERSCAN_API_KEY) {
  logger.info('✅ Etherscan API configured for transaction history');
} else {
  logger.warn('⚠️ ETHERSCAN_API_KEY not set - transaction history limited');
}

// Chain configuration
const CHAIN_CONFIG: Record<string, any> = {
  ethereum: {
    rpc: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    chainId: 1,
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  },
  polygon: {
    rpc: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    chainId: 137,
    nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
  },
  bsc: {
    rpc: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    chainId: 56,
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  },
  arbitrum: {
    rpc: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  },
  optimism: {
    rpc: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    chainId: 10,
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  },
  base: {
    rpc: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    chainId: 8453,
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  },
};

// ERC20 ABI (minimal)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

class WalletService {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();
  private ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || 'your-32-byte-secret-key-change-this-in-production!!';

  /**
   * Get provider for chain
   */
  private getProvider(chain: string): ethers.JsonRpcProvider {
    if (!this.providers.has(chain)) {
      const config = CHAIN_CONFIG[chain];
      if (!config) {
        throw new Error(`Unsupported chain: ${chain}`);
      }
      this.providers.set(chain, new ethers.JsonRpcProvider(config.rpc));
    }
    return this.providers.get(chain)!;
  }

  /**
   * Create new wallet (generate mnemonic)
   */
  async createWallet(chain: string = 'ethereum') {
    try {
      // Generate random mnemonic (12 words)
      const wallet = ethers.Wallet.createRandom();

      return {
        address: wallet.address,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase,
      };
    } catch (error) {
      logger.error('Create wallet error:', error);
      throw new Error('Failed to create wallet');
    }
  }

  /**
   * Import wallet from private key
   */
  async importWallet(privateKey: string, chain: string = 'ethereum') {
    try {
      const wallet = new ethers.Wallet(privateKey);

      return {
        address: wallet.address,
        publicKey: wallet.signingKey.publicKey,
        privateKey: wallet.privateKey,
      };
    } catch (error) {
      logger.error('Import wallet error:', error);
      throw new Error('Invalid private key');
    }
  }

  /**
   * Restore wallet from mnemonic
   */
  async restoreWallet(mnemonic: string, derivationPath?: string) {
    try {
      const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, derivationPath);
      
      return {
        address: hdNode.address,
        publicKey: hdNode.publicKey,
        privateKey: hdNode.privateKey,
        mnemonic: hdNode.mnemonic?.phrase,
      };
    } catch (error) {
      logger.error('Restore wallet error:', error);
      throw new Error('Invalid mnemonic');
    }
  }

  /**
   * Encrypt private key
   */
  encryptPrivateKey(privateKey: string, userId: string): string {
    try {
      // Generate IV
      const iv = crypto.randomBytes(16);

      // Create cipher with GCM mode
      const cipher = crypto.createCipheriv(
        this.ENCRYPTION_ALGORITHM,
        Buffer.from(this.ENCRYPTION_KEY),
        iv
      ) as CipherGCM;

      // Encrypt
      let encrypted = cipher.update(privateKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine: iv + authTag + encrypted
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      logger.error('Encrypt error:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt private key
   */
  decryptPrivateKey(encryptedData: string, userId: string): string {
    try {
      // Split components
      const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

      // Convert to buffers
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Create decipher with GCM mode
      const decipher = crypto.createDecipheriv(
        this.ENCRYPTION_ALGORITHM,
        Buffer.from(this.ENCRYPTION_KEY),
        iv
      ) as DecipherGCM;

      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Decrypt error:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Get native token balance
   */
  async getBalance(address: string, chain: string): Promise<string> {
    try {
      const provider = this.getProvider(chain);
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error('Get balance error:', error);
      throw new Error('Failed to get balance');
    }
  }

  /**
   * Get balance in USD using CoinGecko API
   */
  async getBalanceUSD(balance: string, chain: string): Promise<number> {
    try {
      // Map chain names to CoinGecko IDs
      const coinGeckoIds: Record<string, string> = {
        ethereum: 'ethereum',
        polygon: 'matic-network',
        bsc: 'binancecoin',
        arbitrum: 'ethereum',
        optimism: 'ethereum',
        base: 'ethereum',
      };

      const coinId = coinGeckoIds[chain];
      if (!coinId) {
        logger.warn(`No CoinGecko ID for chain: ${chain}`);
        return 0;
      }

      // Fetch live price from CoinGecko
      const response = await axios.get(
        `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd`
      );
      
      const price = response.data[coinId]?.usd || 0;
      return Number.parseFloat(balance) * price;
    } catch (error) {
      logger.error('Get balance USD error:', error);
      return 0;
    }
  }

  /**
   * Get ERC20 token balance
   */
  async getTokenBalance(
    walletAddress: string,
    tokenAddress: string,
    chain: string
  ): Promise<{ balance: string; decimals: number; symbol: string; name: string }> {
    try {
      const provider = this.getProvider(chain);
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      const [balance, decimals, symbol, name] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.decimals(),
        contract.symbol(),
        contract.name(),
      ]);

      return {
        balance: ethers.formatUnits(balance, decimals),
        decimals,
        symbol,
        name,
      };
    } catch (error) {
      logger.error('Get token balance error:', error);
      throw new Error('Failed to get token balance');
    }
  }

  /**
   * Get all ERC20 tokens for wallet using Moralis API
   */
  async getTokens(address: string, chain: string): Promise<any[]> {
    try {
      if (!MORALIS_API_KEY) {
        logger.warn('Moralis API key not configured - cannot fetch tokens');
        return [];
      }

      // Map chain names to Moralis chain IDs
      const moralisChains: Record<string, string> = {
        ethereum: 'eth',
        polygon: 'polygon',
        bsc: 'bsc',
        arbitrum: 'arbitrum',
        optimism: 'optimism',
        base: 'base',
      };

      const moralisChain = moralisChains[chain] || 'eth';

      // Fetch token balances from Moralis
      const response = await axios.get(
        `https://deep-index.moralis.io/api/v2.2/${address}/erc20`,
        {
          headers: {
            'X-API-Key': MORALIS_API_KEY,
          },
          params: {
            chain: moralisChain,
          },
        }
      );

      // Transform Moralis response to our format
      const tokens = response.data.map((token: any) => ({
        address: token.token_address,
        symbol: token.symbol,
        name: token.name,
        balance: (Number(token.balance) / Math.pow(10, token.decimals)).toFixed(6),
        decimals: token.decimals,
        priceUSD: token.usd_price || 0,
        valueUSD: token.usd_value || 0,
        logo: token.logo || null,
        verified: token.verified_contract || false,
      }));

      return tokens;
    } catch (error) {
      logger.error('Get tokens error:', error);
      return []; // Return empty array on error instead of throwing
    }
  }

  /**
   * Get transaction history using Etherscan API
   */
  async getTransactions(address: string, chain: string): Promise<any[]> {
    try {
      if (!ETHERSCAN_API_KEY) {
        logger.warn('Etherscan API key not configured - cannot fetch transactions');
        return [];
      }

      // Map chain names to block explorer APIs
      const explorers: Record<string, string> = {
        ethereum: 'https://api.etherscan.io/api',
        polygon: 'https://api.polygonscan.com/api',
        bsc: 'https://api.bscscan.com/api',
        arbitrum: 'https://api.arbiscan.io/api',
        optimism: 'https://api-optimistic.etherscan.io/api',
        base: 'https://api.basescan.org/api',
      };

      const explorerApi = explorers[chain];
      if (!explorerApi) {
        logger.warn(`No explorer API for chain: ${chain}`);
        return [];
      }

      // Fetch transactions from block explorer
      const response = await axios.get(explorerApi, {
        params: {
          module: 'account',
          action: 'txlist',
          address: address,
          startblock: 0,
          endblock: 99999999,
          page: 1,
          offset: 50, // Limit to 50 most recent
          sort: 'desc',
          apikey: ETHERSCAN_API_KEY,
        },
      });

      if (response.data.status !== '1') {
        logger.warn(`Explorer API error: ${response.data.message}`);
        return [];
      }

      // Transform response to our format
      const transactions = response.data.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: (Number(tx.value) / 1e18).toFixed(6),
        type: tx.from.toLowerCase() === address.toLowerCase() ? 'send' : 'receive',
        status: tx.isError === '0' ? 'confirmed' : 'failed',
        timestamp: new Date(Number(tx.timeStamp) * 1000),
        gasUsed: tx.gasUsed,
        gasPriceGwei: (Number(tx.gasPrice) / 1e9).toFixed(2),
        blockNumber: tx.blockNumber,
        nonce: tx.nonce,
      }));

      return transactions;
    } catch (error) {
      logger.error('Get transactions error:', error);
      return []; // Return empty array on error instead of throwing
    }
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(params: {
    from: string;
    to: string;
    value?: string;
    data?: string;
    chain: string;
  }): Promise<{ gasLimit: string; maxFeePerGas: string; maxPriorityFeePerGas: string }> {
    try {
      const provider = this.getProvider(params.chain);

      // Estimate gas limit
      const gasLimit = await provider.estimateGas({
        from: params.from,
        to: params.to,
        value: params.value ? ethers.parseEther(params.value) : 0,
        data: params.data,
      });

      // Get current fee data
      const feeData = await provider.getFeeData();

      return {
        gasLimit: gasLimit.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString() || '0',
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || '0',
      };
    } catch (error) {
      logger.error('Estimate gas error:', error);
      throw new Error('Failed to estimate gas');
    }
  }

  /**
   * Sign message
   */
  async signMessage(privateKey: string, message: string): Promise<string> {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const signature = await wallet.signMessage(message);
      return signature;
    } catch (error) {
      logger.error('Sign message error:', error);
      throw new Error('Failed to sign message');
    }
  }

  /**
   * Verify signature
   */
  verifySignature(message: string, signature: string): string {
    try {
      const address = ethers.verifyMessage(message, signature);
      return address;
    } catch (error) {
      logger.error('Verify signature error:', error);
      throw new Error('Invalid signature');
    }
  }

  /**
   * Sign typed data (EIP-712)
   */
  async signTypedData(
    privateKey: string,
    domain: any,
    types: any,
    value: any
  ): Promise<string> {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const signature = await wallet.signTypedData(domain, types, value);
      return signature;
    } catch (error) {
      logger.error('Sign typed data error:', error);
      throw new Error('Failed to sign typed data');
    }
  }
}

export const walletService = new WalletService();
