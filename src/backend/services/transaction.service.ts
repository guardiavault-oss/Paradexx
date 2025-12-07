// Transaction Service - Send, swap, and transaction management

import { ethers } from 'ethers';
import { logger } from '../services/logger.service';
import { walletService } from './wallet.service';
import { mevProtection } from './mev-protection.service';
import { gasOptimizer } from './gas-optimization.service';
import { mevProtectionApi, ProtectionLevel } from './mev-protection-api.service';
import { getChainId } from './chain-config.service';

// Uniswap V3 Router ABI (minimal)
const UNISWAP_ROUTER_ABI = [
  'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
];

// DEX Router addresses
const DEX_ROUTERS: Record<string, Record<string, string>> = {
  ethereum: {
    uniswap: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3
    sushiswap: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    '1inch': '0x1111111254EEB25477B68fb85Ed929f73A960582',
  },
  polygon: {
    quickswap: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
    sushiswap: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
  },
  bsc: {
    pancakeswap: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  },
};

interface SendTransactionParams {
  from: string;
  to: string;
  amount: string;
  token?: string; // If undefined, send native token
  privateKey: string;
  chain: string;
  chainId?: number; // Chain ID for MEV protection
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  mevProtection?: boolean;
  protectionLevel?: ProtectionLevel; // MEV protection level
  slippageTolerance?: number; // Slippage tolerance percentage
}

interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  expectedOutput: string;
  minOutput: string;
  priceImpact: number;
  router: string;
  dex: string;
  gasEstimate: string;
}

class TransactionService {
  /**
   * Send native token or ERC20 transaction with optional MEV protection
   */
  async sendTransaction(params: SendTransactionParams): Promise<string> {
    try {
      const provider = (walletService as any).getProvider(params.chain);
      const wallet = new ethers.Wallet(params.privateKey, provider);

      let tx: any;

      if (params.token) {
        // ERC20 transfer
        tx = await this.sendERC20(wallet, params);
      } else {
        // Native token transfer
        tx = await this.sendNative(wallet, params);
      }

      // If MEV protection is enabled, protect the transaction
      if (params.mevProtection && tx.hash) {
        try {
          // Get chain ID if not provided
          const chainId = params.chainId || getChainId(params.chain);

          if (!chainId) {
            logger.warn(`[MEV Protection] Unknown chain: ${params.chain}, skipping protection`);
          } else {
            logger.info(`[MEV Protection] Protecting transaction: ${tx.hash} on chain ${chainId}`);

            await mevProtectionApi.protectTransaction(
              tx.hash,
              chainId,
              {
                protectionLevel: params.protectionLevel || 'high',
                slippageTolerance: params.slippageTolerance,
                privateMempool: true,
                gasLimit: params.gasLimit ? parseInt(params.gasLimit) : undefined,
                maxGasPrice: params.maxFeePerGas ? (typeof params.maxFeePerGas === 'string' ? parseInt(params.maxFeePerGas) : params.maxFeePerGas) : undefined,
              }
            );

            logger.info(`[MEV Protection] Transaction ${tx.hash} protected successfully`);
          }
        } catch (mevError) {
          // Log error but don't fail the transaction
          logger.warn(`[MEV Protection] Failed to protect transaction ${tx.hash}:`, mevError);
        }
      }

      logger.info('Transaction sent:', tx.hash);
      return tx.hash;
    } catch (error: any) {
      logger.error('Send transaction error:', error);
      throw new Error(error.message || 'Transaction failed');
    }
  }

  /**
   * Send native token (ETH, MATIC, BNB, etc.)
   */
  private async sendNative(wallet: ethers.Wallet, params: SendTransactionParams) {
    try {
      // Get gas estimates
      const gasEstimate = await gasOptimizer.getCurrentGas();

      const tx = await wallet.sendTransaction({
        to: params.to,
        value: ethers.parseEther(params.amount),
        maxFeePerGas: params.maxFeePerGas || gasEstimate.standard.maxFeePerGas,
        maxPriorityFeePerGas: params.maxPriorityFeePerGas || gasEstimate.standard.maxPriorityFeePerGas,
        gasLimit: params.gasLimit || 21000,
      });

      // Don't wait for confirmation here - return immediately
      // Caller can wait if needed
      return tx;
    } catch (error) {
      logger.error('Send native error:', error);
      throw error;
    }
  }

  /**
   * Send ERC20 token
   */
  private async sendERC20(wallet: ethers.Wallet, params: SendTransactionParams) {
    try {
      const ERC20_ABI = ['function transfer(address to, uint256 amount) returns (bool)'];
      const contract = new ethers.Contract(params.token!, ERC20_ABI, wallet);

      // Get token decimals
      const decimalsAbi = ['function decimals() view returns (uint8)'];
      const tokenContract = new ethers.Contract(params.token!, decimalsAbi, wallet);
      const decimals = await tokenContract.decimals();

      // Parse amount with correct decimals
      const amount = ethers.parseUnits(params.amount, decimals);

      // Get gas estimate
      const gasEstimate = await gasOptimizer.getCurrentGas();

      const tx = await contract.transfer(params.to, amount, {
        maxFeePerGas: params.maxFeePerGas || gasEstimate.standard.maxFeePerGas,
        maxPriorityFeePerGas: params.maxPriorityFeePerGas || gasEstimate.standard.maxPriorityFeePerGas,
        gasLimit: params.gasLimit || 100000,
      });

      // Don't wait for confirmation here - return immediately
      // Caller can wait if needed
      return tx;
    } catch (error) {
      logger.error('Send ERC20 error:', error);
      throw error;
    }
  }

  /**
   * Get swap quote from multiple DEXes
   */
  async getSwapQuote(params: {
    fromToken: string;
    toToken: string;
    amount: string;
    chain: string;
  }): Promise<SwapQuote> {
    try {
      // TODO: Implement actual DEX aggregation
      // For now, return mock quote from Uniswap
      const router = DEX_ROUTERS[params.chain]?.uniswap || DEX_ROUTERS.ethereum.uniswap;

      // Calculate mock output (98% of input, simulating 2% slippage)
      const expectedOutput = (parseFloat(params.amount) * 0.98).toString();
      const minOutput = (parseFloat(expectedOutput) * 0.99).toString();

      return {
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.amount,
        expectedOutput,
        minOutput,
        priceImpact: 2.0,
        router,
        dex: 'Uniswap V3',
        gasEstimate: '150000',
      };
    } catch (error) {
      logger.error('Get swap quote error:', error);
      throw new Error('Failed to get swap quote');
    }
  }

  /**
   * Execute token swap
   */
  async executeSwap(params: {
    wallet: string;
    privateKey: string;
    quote: SwapQuote;
    slippage: number;
  }): Promise<string> {
    try {
      // TODO: Implement actual swap execution
      // This is a simplified version

      // 1. Approve token spending
      // 2. Execute swap on DEX
      // 3. Return transaction hash

      return '0x' + 'a'.repeat(64); // Mock transaction hash
    } catch (error: any) {
      logger.error('Execute swap error:', error);
      throw new Error(error.message || 'Swap execution failed');
    }
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: string, chain: string) {
    try {
      const provider = (walletService as any).getProvider(chain);
      const tx = await provider.getTransaction(hash);
      const receipt = await provider.getTransactionReceipt(hash);

      return {
        hash: tx?.hash,
        from: tx?.from,
        to: tx?.to,
        value: tx?.value ? ethers.formatEther(tx.value) : '0',
        gasUsed: receipt?.gasUsed?.toString(),
        gasPrice: tx?.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') : '0',
        status: receipt?.status === 1 ? 'confirmed' : 'failed',
        blockNumber: receipt?.blockNumber,
        timestamp: tx?.timestamp || Date.now(),
      };
    } catch (error) {
      logger.error('Get transaction error:', error);
      throw new Error('Failed to get transaction');
    }
  }

  /**
   * Cancel pending transaction (by sending 0 ETH to self with higher gas)
   */
  async cancelTransaction(params: {
    wallet: string;
    privateKey: string;
    nonce: number;
    chain: string;
  }): Promise<string> {
    try {
      const provider = (walletService as any).getProvider(params.chain);
      const wallet = new ethers.Wallet(params.privateKey, provider);

      // Get current pending transaction gas price
      const feeData = await provider.getFeeData();
      const higherMaxFee = feeData.maxFeePerGas! * BigInt(110) / BigInt(100); // 10% higher
      const higherPriorityFee = feeData.maxPriorityFeePerGas! * BigInt(110) / BigInt(100);

      // Send 0 ETH to self with same nonce but higher gas
      const tx = await wallet.sendTransaction({
        to: params.wallet,
        value: 0,
        nonce: params.nonce,
        maxFeePerGas: higherMaxFee,
        maxPriorityFeePerGas: higherPriorityFee,
      });

      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      logger.error('Cancel transaction error:', error);
      throw new Error(error.message || 'Failed to cancel transaction');
    }
  }

  /**
   * Speed up pending transaction (send same tx with higher gas)
   */
  async speedUpTransaction(params: {
    originalTx: any;
    privateKey: string;
    chain: string;
  }): Promise<string> {
    try {
      const provider = (walletService as any).getProvider(params.chain);
      const wallet = new ethers.Wallet(params.privateKey, provider);

      // Get current fee data
      const feeData = await provider.getFeeData();
      const higherMaxFee = feeData.maxFeePerGas! * BigInt(120) / BigInt(100); // 20% higher
      const higherPriorityFee = feeData.maxPriorityFeePerGas! * BigInt(120) / BigInt(100);

      // Send same transaction with higher gas
      const tx = await wallet.sendTransaction({
        to: params.originalTx.to,
        value: params.originalTx.value,
        data: params.originalTx.data,
        nonce: params.originalTx.nonce,
        maxFeePerGas: higherMaxFee,
        maxPriorityFeePerGas: higherPriorityFee,
      });

      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      logger.error('Speed up transaction error:', error);
      throw new Error(error.message || 'Failed to speed up transaction');
    }
  }

  /**
   * Batch multiple transactions
   */
  async batchTransactions(params: {
    transactions: Array<{ to: string; value: string; data?: string }>;
    wallet: string;
    privateKey: string;
    chain: string;
  }): Promise<string[]> {
    try {
      const provider = (walletService as any).getProvider(params.chain);
      const wallet = new ethers.Wallet(params.privateKey, provider);

      const txHashes: string[] = [];

      // Get starting nonce
      let nonce = await provider.getTransactionCount(params.wallet);

      // Send all transactions
      for (const txParams of params.transactions) {
        const tx = await wallet.sendTransaction({
          to: txParams.to,
          value: ethers.parseEther(txParams.value),
          data: txParams.data,
          nonce: nonce++,
        });

        txHashes.push(tx.hash);
      }

      return txHashes;
    } catch (error: any) {
      logger.error('Batch transactions error:', error);
      throw new Error(error.message || 'Batch transaction failed');
    }
  }
}

export const transactionService = new TransactionService();
