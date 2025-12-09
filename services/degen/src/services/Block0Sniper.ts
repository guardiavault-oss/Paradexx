// ============================================================================
// APEX SNIPER - Block-0 Sniper Service
// Ultra-fast sniping with pre-signed transactions for block-0 entry
// ============================================================================

import { ethers, Wallet, JsonRpcProvider, Contract, TransactionRequest } from 'ethers';
import EventEmitter from 'eventemitter3';
import {
  SnipeConfig,
  SnipeOrder,
  OrderStatus,
  SnipeType,
  DEX,
  ExecutionMethod,
  NewPairEvent,
  PendingTransaction
} from '../types';
import { config, METHOD_SIGNATURES, KNOWN_FACTORIES } from '../config';
import {
  logger,
  generateId,
  checksumAddress,
  getDeadline,
  estimateGasPrice,
  sleep
} from '../utils';
import { multiRpcProvider } from './MultiRpcProvider';
import { flashbotsExecutor } from './FlashbotsProvider';

// ============================================================================
// TYPES
// ============================================================================

export interface PreSignedTransaction {
  id: string;
  targetToken?: string;
  targetDeployer?: string;
  signedTx: string;
  rawTx: TransactionRequest;
  walletId: string;
  walletAddress: string;
  amountIn: bigint;
  createdAt: number;
  expiresAt: number;
  status: 'READY' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED' | 'EXPIRED';
}

export interface Block0SnipeConfig extends SnipeConfig {
  // Block-0 specific settings
  preSignEnabled: boolean;
  targetDeployer?: string;
  bundleWithLiquidity: boolean;
  frontrunProtection: boolean;
  maxBribeGwei: number;
  submitToBuilders: boolean;
}

export interface Block0Events {
  'presigned:created': (tx: PreSignedTransaction) => void;
  'presigned:executed': (tx: PreSignedTransaction, txHash: string) => void;
  'presigned:failed': (tx: PreSignedTransaction, error: string) => void;
  'liquidity:detected': (event: NewPairEvent) => void;
  'liquidity:sniped': (event: NewPairEvent, order: SnipeOrder) => void;
}

// ============================================================================
// ROUTER ABI
// ============================================================================

const ROUTER_V2_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable',
  'function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)',
  'function WETH() external pure returns (address)'
];

const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function allPairs(uint) external view returns (address pair)',
  'function allPairsLength() external view returns (uint)',
  'event PairCreated(address indexed token0, address indexed token1, address pair, uint)'
];

// ============================================================================
// BLOCK-0 SNIPER SERVICE
// ============================================================================

export class Block0Sniper extends EventEmitter<Block0Events> {
  private provider: JsonRpcProvider;
  private preSignedTxs: Map<string, PreSignedTransaction> = new Map();
  private watchedDeployers: Set<string> = new Set();
  private pendingSnipes: Map<string, Block0SnipeConfig> = new Map();
  private isMonitoring: boolean = false;
  private blockSubscription: any = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.provider = new JsonRpcProvider(config.rpcUrl);
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  async start(): Promise<void> {
    if (this.isMonitoring) return;

    logger.info('Starting Block-0 Sniper...');
    this.isMonitoring = true;

    // Start multi-RPC health monitor
    await multiRpcProvider.startHealthMonitor();

    // Subscribe to new blocks
    await this.subscribeToBlocks();

    // Start cleanup interval
    this.startCleanupInterval();

    logger.info('Block-0 Sniper started');
  }

  async stop(): Promise<void> {
    this.isMonitoring = false;
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    multiRpcProvider.stopHealthMonitor();
    
    logger.info('Block-0 Sniper stopped');
  }

  // ==========================================================================
  // BLOCK SUBSCRIPTION
  // ==========================================================================

  private async subscribeToBlocks(): Promise<void> {
    await multiRpcProvider.subscribeToBlocks(async (blockNumber) => {
      // Check for expired pre-signed transactions
      this.checkExpiredTransactions();

      // Monitor for pair creation in this block
      await this.checkBlockForPairs(blockNumber);
    });
  }

  private async checkBlockForPairs(blockNumber: number): Promise<void> {
    try {
      const block = await this.provider.getBlock(blockNumber, true);
      if (!block || !block.transactions) return;

      // Check each transaction for pair creation
      for (const txHash of block.transactions) {
        if (typeof txHash === 'string') {
          const receipt = await this.provider.getTransactionReceipt(txHash);
          if (!receipt) continue;

          // Look for PairCreated events
          for (const log of receipt.logs) {
            const factoryInfo = KNOWN_FACTORIES[log.address.toLowerCase()];
            if (!factoryInfo) continue;

            const pairCreatedTopic = ethers.id('PairCreated(address,address,address,uint256)');
            if (log.topics[0] === pairCreatedTopic) {
              await this.handlePairCreated(log, factoryInfo.dex as DEX, blockNumber);
            }
          }
        }
      }
    } catch (error) {
      logger.debug(`Error checking block ${blockNumber}:`, error);
    }
  }

  private async handlePairCreated(log: ethers.Log, dex: DEX, blockNumber: number): Promise<void> {
    try {
      const iface = new ethers.Interface([
        'event PairCreated(address indexed token0, address indexed token1, address pair, uint)'
      ]);

      const decoded = iface.parseLog({
        topics: log.topics as string[],
        data: log.data
      });

      if (!decoded) return;

      const event: NewPairEvent = {
        pair: checksumAddress(decoded.args[2]),
        token0: checksumAddress(decoded.args[0]),
        token1: checksumAddress(decoded.args[1]),
        factory: checksumAddress(log.address),
        dex,
        txHash: log.transactionHash,
        blockNumber,
        timestamp: Date.now(),
        deployer: ''
      };

      // Get deployer from transaction
      const tx = await this.provider.getTransaction(log.transactionHash);
      if (tx) {
        event.deployer = checksumAddress(tx.from);
      }

      this.emit('liquidity:detected', event);

      // Check if we have a snipe config for this
      await this.tryExecuteSnipe(event);

    } catch (error) {
      logger.error('Error handling pair created:', error);
    }
  }

  // ==========================================================================
  // PRE-SIGNED TRANSACTIONS
  // ==========================================================================

  async createPreSignedTransaction(
    snipeConfig: Block0SnipeConfig,
    wallet: Wallet
  ): Promise<PreSignedTransaction> {
    logger.info(`Creating pre-signed transaction for ${snipeConfig.targetToken || 'any token'}`);

    const router = new Contract(
      snipeConfig.targetDex === DEX.SUSHISWAP
        ? config.contracts.sushiswapRouter
        : config.contracts.uniswapV2Router,
      ROUTER_V2_ABI,
      this.provider
    );

    // Build the swap transaction
    // Use a placeholder for token if not specified (will be replaced at execution)
    const tokenAddress = snipeConfig.targetToken || ethers.ZeroAddress;
    const path = [config.contracts.weth, tokenAddress];
    
    // Long deadline for pre-signed tx
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    // Build with high gas settings for priority
    const gasPrice = await estimateGasPrice(this.provider, snipeConfig.gasMultiplier);
    const priorityFee = snipeConfig.maxBribeGwei 
      ? ethers.parseUnits(snipeConfig.maxBribeGwei.toString(), 'gwei')
      : gasPrice.maxPriorityFeePerGas;

    // Get nonce
    const nonce = await this.provider.getTransactionCount(wallet.address, 'pending');

    // Encode function call
    const txData = router.interface.encodeFunctionData(
      'swapExactETHForTokensSupportingFeeOnTransferTokens',
      [
        0, // amountOutMin - will accept any amount for speed
        path,
        wallet.address,
        deadline
      ]
    );

    const rawTx: TransactionRequest = {
      to: await router.getAddress(),
      data: txData,
      value: snipeConfig.amountInWei,
      gasLimit: 500000n, // High gas limit for safety
      maxFeePerGas: snipeConfig.maxGasPrice,
      maxPriorityFeePerGas: priorityFee,
      nonce,
      chainId: config.chainId,
      type: 2
    };

    // Sign the transaction
    const signedTx = await wallet.signTransaction(rawTx);

    const preSignedTx: PreSignedTransaction = {
      id: generateId(),
      targetToken: snipeConfig.targetToken,
      targetDeployer: snipeConfig.targetDeployer,
      signedTx,
      rawTx,
      walletId: 'default', // Should be passed in
      walletAddress: wallet.address,
      amountIn: snipeConfig.amountInWei,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000, // 1 hour expiry
      status: 'READY'
    };

    this.preSignedTxs.set(preSignedTx.id, preSignedTx);
    this.emit('presigned:created', preSignedTx);

    logger.info(`Pre-signed transaction created: ${preSignedTx.id}`);
    return preSignedTx;
  }

  async executePreSignedTransaction(
    preSignedTxId: string,
    newTokenAddress?: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const preTx = this.preSignedTxs.get(preSignedTxId);
    if (!preTx) {
      return { success: false, error: 'Pre-signed transaction not found' };
    }

    if (preTx.status !== 'READY') {
      return { success: false, error: `Transaction not ready: ${preTx.status}` };
    }

    if (Date.now() > preTx.expiresAt) {
      preTx.status = 'EXPIRED';
      return { success: false, error: 'Transaction expired' };
    }

    preTx.status = 'SUBMITTED';

    try {
      // If we need to update the token address, we need to re-sign
      if (newTokenAddress && newTokenAddress !== preTx.targetToken) {
        // Re-create the transaction with new token
        const router = new Contract(
          config.contracts.uniswapV2Router,
          ROUTER_V2_ABI,
          this.provider
        );

        const path = [config.contracts.weth, newTokenAddress];
        const deadline = Math.floor(Date.now() / 1000) + 300;

        const txData = router.interface.encodeFunctionData(
          'swapExactETHForTokensSupportingFeeOnTransferTokens',
          [0, path, preTx.walletAddress, deadline]
        );

        // Update the raw tx
        preTx.rawTx.data = txData;
        preTx.targetToken = newTokenAddress;
      }

      // Send the transaction
      const response = await multiRpcProvider.sendTransaction(preTx.signedTx);
      
      // Wait for confirmation
      const receipt = await response.wait(1);
      
      if (receipt && receipt.status === 1) {
        preTx.status = 'CONFIRMED';
        this.emit('presigned:executed', preTx, receipt.hash);
        logger.info(`Pre-signed transaction executed: ${receipt.hash}`);
        return { success: true, txHash: receipt.hash };
      } else {
        throw new Error('Transaction reverted');
      }

    } catch (error) {
      preTx.status = 'FAILED';
      const errorMsg = (error as Error).message;
      this.emit('presigned:failed', preTx, errorMsg);
      logger.error(`Pre-signed transaction failed: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  // ==========================================================================
  // DEPLOYER TRACKING
  // ==========================================================================

  addWatchedDeployer(address: string): void {
    this.watchedDeployers.add(address.toLowerCase());
    logger.info(`Added watched deployer: ${address}`);
  }

  removeWatchedDeployer(address: string): void {
    this.watchedDeployers.delete(address.toLowerCase());
  }

  isWatchedDeployer(address: string): boolean {
    return this.watchedDeployers.has(address.toLowerCase());
  }

  getWatchedDeployers(): string[] {
    return Array.from(this.watchedDeployers);
  }

  // ==========================================================================
  // SNIPE CONFIGURATION
  // ==========================================================================

  addSnipeConfig(snipeConfig: Block0SnipeConfig): void {
    this.pendingSnipes.set(snipeConfig.id, snipeConfig);
    
    // Watch deployer if specified
    if (snipeConfig.targetDeployer) {
      this.addWatchedDeployer(snipeConfig.targetDeployer);
    }

    logger.info(`Added Block-0 snipe config: ${snipeConfig.id}`);
  }

  removeSnipeConfig(configId: string): void {
    this.pendingSnipes.delete(configId);
  }

  // ==========================================================================
  // SNIPE EXECUTION
  // ==========================================================================

  private async tryExecuteSnipe(event: NewPairEvent): Promise<void> {
    // Find matching snipe configs
    for (const [id, snipeConfig] of this.pendingSnipes) {
      if (!snipeConfig.enabled) continue;

      // Check deployer match if specified
      if (snipeConfig.targetDeployer) {
        if (event.deployer.toLowerCase() !== snipeConfig.targetDeployer.toLowerCase()) {
          continue;
        }
      }

      // Check token match if specified
      if (snipeConfig.targetToken) {
        const token0Match = event.token0.toLowerCase() === snipeConfig.targetToken.toLowerCase();
        const token1Match = event.token1.toLowerCase() === snipeConfig.targetToken.toLowerCase();
        if (!token0Match && !token1Match) {
          continue;
        }
      }

      // Determine which token is the target (not WETH)
      const weth = config.contracts.weth.toLowerCase();
      const targetToken = event.token0.toLowerCase() === weth ? event.token1 : event.token0;

      logger.info(`Executing Block-0 snipe for ${targetToken}`);

      // Find pre-signed transaction or create new one
      const preTx = Array.from(this.preSignedTxs.values()).find(
        tx => tx.status === 'READY' && 
        (!tx.targetToken || tx.targetToken.toLowerCase() === targetToken.toLowerCase())
      );

      if (preTx) {
        // Execute pre-signed transaction
        const result = await this.executePreSignedTransaction(preTx.id, targetToken);
        if (result.success) {
          this.emit('liquidity:sniped', event, {
            id: generateId(),
            configId: snipeConfig.id,
            type: SnipeType.LIQUIDITY_LAUNCH,
            status: OrderStatus.CONFIRMED,
            tokenIn: config.contracts.weth,
            tokenOut: targetToken,
            pair: event.pair,
            dex: event.dex,
            amountIn: preTx.amountIn,
            amountOutMin: 0n,
            expectedAmountOut: 0n,
            walletId: preTx.walletId,
            walletAddress: preTx.walletAddress,
            executionMethod: ExecutionMethod.DIRECT,
            txHash: result.txHash,
            blockNumber: event.blockNumber,
            detectedAt: event.timestamp,
            confirmedAt: Date.now(),
            latencyMs: Date.now() - event.timestamp,
            retryCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }
      }

      // Disable the snipe config after execution
      snipeConfig.enabled = false;
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.checkExpiredTransactions();
    }, 60000); // Every minute
  }

  private checkExpiredTransactions(): void {
    const now = Date.now();
    for (const [id, tx] of this.preSignedTxs) {
      if (tx.status === 'READY' && now > tx.expiresAt) {
        tx.status = 'EXPIRED';
        logger.debug(`Pre-signed transaction expired: ${id}`);
      }
    }
  }

  // ==========================================================================
  // STATUS
  // ==========================================================================

  getStatus(): {
    isMonitoring: boolean;
    preSignedTxCount: number;
    watchedDeployersCount: number;
    pendingSnipesCount: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      preSignedTxCount: Array.from(this.preSignedTxs.values()).filter(tx => tx.status === 'READY').length,
      watchedDeployersCount: this.watchedDeployers.size,
      pendingSnipesCount: this.pendingSnipes.size
    };
  }

  getPreSignedTransactions(): PreSignedTransaction[] {
    return Array.from(this.preSignedTxs.values());
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const block0Sniper = new Block0Sniper();
