// ============================================================================
// APEX SNIPER - Whale Tracker & Copy Trading
// Monitor whale wallets and automatically copy their trades
// ============================================================================

import { ethers, JsonRpcProvider, Contract, WebSocketProvider } from 'ethers';
import EventEmitter from 'eventemitter3';
import axios from 'axios';
import {
  TrackedWallet,
  WhaleTransaction,
  TokenInfo,
  SnipeType,
  DEX,
  ExecutionMethod
} from '../types';
import { config, KNOWN_ROUTERS, METHOD_SIGNATURES } from '../config';
import {
  logger,
  generateId,
  checksumAddress,
  getTokenInfo,
  decodeTransactionData,
  isSwapTransaction,
  formatEther,
  formatUnits
} from '../utils';
import { executionEngine } from './ExecutionEngine';
import { tokenAnalyzer } from './TokenAnalyzer';
import { whaleIntelligence } from './WhaleIntelligence';

// ============================================================================
// EVENTS
// ============================================================================

export interface WhaleTrackerEvents {
  'whale:buy': (tx: WhaleTransaction) => void;
  'whale:sell': (tx: WhaleTransaction) => void;
  'whale:transfer': (tx: WhaleTransaction) => void;
  'copy:executed': (tx: WhaleTransaction, orderId: string) => void;
  'copy:failed': (tx: WhaleTransaction, error: string) => void;
}

// ============================================================================
// WHALE TRACKER SERVICE
// ============================================================================

export class WhaleTracker extends EventEmitter<WhaleTrackerEvents> {
  private provider: JsonRpcProvider;
  private wsProvider: WebSocketProvider | null = null;
  private trackedWallets: Map<string, TrackedWallet> = new Map();
  private recentTransactions: Map<string, WhaleTransaction> = new Map();
  private isRunning: boolean = false;
  
  // Known smart money addresses
  private readonly KNOWN_WHALES: Record<string, string> = {
    '0x5Dd9AA6a8F8e8B99eDE02A119a4A79A6b7F78bFC': 'Whale 1 - DeFi Trader',
    '0x9B8a6a58e1F4B3D4E4f3a7E5D6C8B9A0E2F1C3D4': 'Whale 2 - NFT Collector',
    // Add more known addresses
  };

  constructor() {
    super();
    this.provider = new JsonRpcProvider(config.rpcUrl);
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    logger.info('Starting whale tracker...');
    this.isRunning = true;
    
    // Connect WebSocket for real-time monitoring
    await this.connectWebSocket();
    
    // Start monitoring all tracked wallets
    for (const wallet of this.trackedWallets.values()) {
      if (wallet.enabled) {
        this.startWalletMonitoring(wallet);
      }
    }
    
    logger.info(`Whale tracker started, monitoring ${this.trackedWallets.size} wallets`);
  }

  async stop(): Promise<void> {
    logger.info('Stopping whale tracker...');
    this.isRunning = false;
    
    if (this.wsProvider) {
      await this.wsProvider.destroy();
      this.wsProvider = null;
    }
  }

  private async connectWebSocket(): Promise<void> {
    try {
      this.wsProvider = new WebSocketProvider(config.wsRpcUrl);
      
      // Subscribe to pending transactions
      this.wsProvider.on('pending', async (txHash: string) => {
        await this.processPendingTransaction(txHash);
      });
      
      logger.info('WebSocket connected for whale tracking');
    } catch (error) {
      logger.error('Failed to connect WebSocket:', error);
    }
  }

  // ==========================================================================
  // WALLET MANAGEMENT
  // ==========================================================================

  async addTrackedWallet(
    address: string,
    label: string,
    options: Partial<TrackedWallet> = {}
  ): Promise<TrackedWallet> {
    const normalizedAddress = checksumAddress(address);
    
    const wallet: TrackedWallet = {
      id: generateId(),
      address: normalizedAddress,
      label,
      type: options.type || 'WHALE',
      enabled: true,
      copyTradeEnabled: options.copyTradeEnabled || false,
      copyTradePercentage: options.copyTradePercentage || 10,
      copyTradeDelay: options.copyTradeDelay || 0,
      copyTradeMinAmount: options.copyTradeMinAmount || 0.1,
      copyTradeMaxAmount: options.copyTradeMaxAmount || 1,
      tokenWhitelist: options.tokenWhitelist || [],
      tokenBlacklist: options.tokenBlacklist || [],
      minTransactionValue: options.minTransactionValue || 0,
      profitability: 0,
      winRate: 0,
      totalTrades: 0,
      avgHoldTime: 0,
      notes: options.notes,
      tags: options.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.trackedWallets.set(normalizedAddress.toLowerCase(), wallet);
    
    if (this.isRunning && wallet.enabled) {
      this.startWalletMonitoring(wallet);
    }
    
    logger.info(`Added tracked wallet: ${label} (${normalizedAddress})`);
    return wallet;
  }

  removeTrackedWallet(address: string): boolean {
    const normalizedAddress = address.toLowerCase();
    return this.trackedWallets.delete(normalizedAddress);
  }

  getTrackedWallet(address: string): TrackedWallet | undefined {
    return this.trackedWallets.get(address.toLowerCase());
  }

  getAllTrackedWallets(): TrackedWallet[] {
    return Array.from(this.trackedWallets.values());
  }

  updateTrackedWallet(address: string, updates: Partial<TrackedWallet>): TrackedWallet | null {
    const wallet = this.trackedWallets.get(address.toLowerCase());
    if (!wallet) return null;
    
    Object.assign(wallet, updates, { updatedAt: Date.now() });
    return wallet;
  }

  // ==========================================================================
  // WALLET MONITORING
  // ==========================================================================

  private startWalletMonitoring(wallet: TrackedWallet): void {
    // Listen to Transfer events for the wallet
    const transferFilter = {
      topics: [
        ethers.id('Transfer(address,address,uint256)'),
        null,
        ethers.zeroPadValue(wallet.address, 32)
      ]
    };
    
    this.provider.on(transferFilter, (log) => {
      this.handleIncomingTransfer(wallet, log);
    });
    
    // Listen for outgoing transfers
    const outFilter = {
      topics: [
        ethers.id('Transfer(address,address,uint256)'),
        ethers.zeroPadValue(wallet.address, 32)
      ]
    };
    
    this.provider.on(outFilter, (log) => {
      this.handleOutgoingTransfer(wallet, log);
    });
  }

  private async processPendingTransaction(txHash: string): Promise<void> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) return;
      
      const from = tx.from.toLowerCase();
      const wallet = this.trackedWallets.get(from);
      
      if (!wallet || !wallet.enabled) return;
      
      // Check if it's a swap transaction
      if (!isSwapTransaction(tx.data)) return;
      
      // Parse the swap
      const swapInfo = this.parseSwapTransaction(tx);
      if (!swapInfo) return;
      
      // Check minimum value
      const valueEth = Number(formatEther(tx.value));
      if (valueEth < wallet.minTransactionValue) return;
      
      // Create whale transaction record
      const whaleTx: WhaleTransaction = {
        id: generateId(),
        walletId: wallet.id,
        walletAddress: wallet.address,
        type: swapInfo.isBuy ? 'BUY' : 'SELL',
        token: swapInfo.token,
        tokenInfo: await getTokenInfo(this.provider, swapInfo.token) || {
          address: swapInfo.token,
          name: 'Unknown',
          symbol: '???',
          decimals: 18,
          totalSupply: 0n
        },
        amount: swapInfo.amount,
        valueUSD: valueEth * 2000, // Rough estimate
        price: 0,
        txHash,
        blockNumber: 0, // Pending
        timestamp: Date.now(),
        copyTraded: false
      };
      
      this.recentTransactions.set(txHash, whaleTx);
      
      // Emit event
      if (swapInfo.isBuy) {
        this.emit('whale:buy', whaleTx);
        logger.info(`Whale buy detected: ${wallet.label} buying ${swapInfo.token}`);
        
        // Record transaction in whale intelligence
        whaleIntelligence.recordTransaction(whaleTx);
        
        // Generate copy trade signal
        const signal = whaleIntelligence.generateCopySignal(
          wallet.address,
          swapInfo.token,
          'BUY',
          whaleTx.amount,
          whaleTx.valueUSD
        );
        
        // Execute copy trade if enabled and signal is strong
        if (wallet.copyTradeEnabled || (signal && signal.recommendedAction === 'FOLLOW')) {
          await this.executeCopyTrade(wallet, whaleTx);
        }
      } else {
        this.emit('whale:sell', whaleTx);
        logger.info(`Whale sell detected: ${wallet.label} selling ${swapInfo.token}`);
        
        // Record transaction in whale intelligence
        whaleIntelligence.recordTransaction(whaleTx);
      }
      
    } catch (error) {
      // Transaction might have been mined or dropped
    }
  }

  private parseSwapTransaction(tx: any): {
    isBuy: boolean;
    token: string;
    amount: bigint;
  } | null {
    const decoded = decodeTransactionData(tx.data);
    if (!decoded) return null;
    
    const weth = config.contracts.weth.toLowerCase();
    
    // Parse based on method
    switch (decoded.name) {
      case 'swapExactETHForTokens':
      case 'swapExactETHForTokensSupportingFeeOnTransferTokens': {
        const path = decoded.args.path as string[];
        return {
          isBuy: true,
          token: checksumAddress(path[path.length - 1]),
          amount: BigInt(decoded.args.amountOutMin as string || 0)
        };
      }
      
      case 'swapExactTokensForETH':
      case 'swapExactTokensForETHSupportingFeeOnTransferTokens': {
        const path = decoded.args.path as string[];
        return {
          isBuy: false,
          token: checksumAddress(path[0]),
          amount: BigInt(decoded.args.amountIn as string || 0)
        };
      }
      
      default:
        return null;
    }
  }

  private async handleIncomingTransfer(wallet: TrackedWallet, log: ethers.Log): Promise<void> {
    // Handle incoming token transfers
    const tokenAddress = log.address;
    const tokenInfo = await getTokenInfo(this.provider, tokenAddress);
    
    logger.debug(`Incoming transfer to ${wallet.label}: ${tokenInfo?.symbol || tokenAddress}`);
  }

  private async handleOutgoingTransfer(wallet: TrackedWallet, log: ethers.Log): Promise<void> {
    // Handle outgoing token transfers
    const tokenAddress = log.address;
    const tokenInfo = await getTokenInfo(this.provider, tokenAddress);
    
    logger.debug(`Outgoing transfer from ${wallet.label}: ${tokenInfo?.symbol || tokenAddress}`);
  }

  // ==========================================================================
  // COPY TRADING
  // ==========================================================================

  private async executeCopyTrade(
    wallet: TrackedWallet,
    whaleTx: WhaleTransaction
  ): Promise<void> {
    logger.info(`Executing copy trade for ${wallet.label}'s ${whaleTx.type}`);
    
    // Only copy buys for now
    if (whaleTx.type !== 'BUY') {
      logger.debug('Skipping copy trade - not a buy');
      return;
    }
    
    // Check whitelist/blacklist
    if (wallet.tokenWhitelist.length > 0) {
      if (!wallet.tokenWhitelist.includes(whaleTx.token.toLowerCase())) {
        logger.debug('Skipping copy trade - token not in whitelist');
        return;
      }
    }
    
    if (wallet.tokenBlacklist.includes(whaleTx.token.toLowerCase())) {
      logger.debug('Skipping copy trade - token in blacklist');
      return;
    }
    
    // Safety check
    const safetyCheck = await tokenAnalyzer.quickSafetyCheck(whaleTx.token);
    if (!safetyCheck.safe) {
      logger.warn(`Copy trade aborted - safety check failed: ${safetyCheck.reason}`);
      this.emit('copy:failed', whaleTx, `Safety check: ${safetyCheck.reason}`);
      return;
    }
    
    // Calculate copy amount
    // Use percentage of whale's trade or fixed amount
    const copyAmountEth = Math.min(
      Math.max(wallet.copyTradeMinAmount, wallet.copyTradePercentage / 100),
      wallet.copyTradeMaxAmount
    );
    
    try {
      // Delay if configured
      if (wallet.copyTradeDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, wallet.copyTradeDelay));
      }
      
      // Get first available wallet from execution engine
      const wallets = executionEngine.getWallets();
      if (wallets.length === 0) {
        throw new Error('No wallets available for copy trading');
      }
      
      const order = await executionEngine.buyToken(
        whaleTx.token,
        copyAmountEth.toString(),
        wallets[0].id,
        {
          slippage: 10,
          method: ExecutionMethod.FLASHBOTS,
          safetyCheck: false // Already checked
        }
      );
      
      whaleTx.copyTraded = true;
      whaleTx.copyTradeOrderId = order.id;
      
      this.emit('copy:executed', whaleTx, order.id);
      logger.info(`Copy trade executed: ${order.id}`);
      
      // Update wallet stats
      wallet.totalTrades++;
      wallet.updatedAt = Date.now();
      
    } catch (error) {
      const errorMsg = (error as Error).message;
      logger.error(`Copy trade failed:`, error);
      this.emit('copy:failed', whaleTx, errorMsg);
    }
  }

  // ==========================================================================
  // WALLET ANALYSIS
  // ==========================================================================

  async analyzeWallet(address: string): Promise<{
    totalTransactions: number;
    totalVolume: number;
    tokens: string[];
    profitability: number;
    avgHoldTime: number;
    winRate: number;
  }> {
    const normalizedAddress = checksumAddress(address);
    
    // This would typically query historical data from Etherscan or a database
    // Simplified version here
    
    try {
      // Get transaction count
      const txCount = await this.provider.getTransactionCount(normalizedAddress);
      
      // Get ETH balance as rough indicator
      const balance = await this.provider.getBalance(normalizedAddress);
      
      return {
        totalTransactions: txCount,
        totalVolume: Number(formatEther(balance)) * 2000, // Rough estimate
        tokens: [],
        profitability: 0,
        avgHoldTime: 0,
        winRate: 0
      };
    } catch (error) {
      logger.error(`Failed to analyze wallet ${address}:`, error);
      return {
        totalTransactions: 0,
        totalVolume: 0,
        tokens: [],
        profitability: 0,
        avgHoldTime: 0,
        winRate: 0
      };
    }
  }

  async getTopWhales(limit: number = 10): Promise<TrackedWallet[]> {
    const wallets = this.getAllTrackedWallets();
    
    // Sort by profitability
    return wallets
      .sort((a, b) => b.profitability - a.profitability)
      .slice(0, limit);
  }

  // ==========================================================================
  // TRANSACTION HISTORY
  // ==========================================================================

  getRecentTransactions(walletAddress?: string): WhaleTransaction[] {
    const txs = Array.from(this.recentTransactions.values());
    
    if (walletAddress) {
      return txs.filter(tx => 
        tx.walletAddress.toLowerCase() === walletAddress.toLowerCase()
      );
    }
    
    return txs.sort((a, b) => b.timestamp - a.timestamp);
  }

  getTransaction(txHash: string): WhaleTransaction | undefined {
    return this.recentTransactions.get(txHash);
  }

  // ==========================================================================
  // IMPORT KNOWN WHALES
  // ==========================================================================

  async importKnownWhales(): Promise<void> {
    for (const [address, label] of Object.entries(this.KNOWN_WHALES)) {
      if (!this.trackedWallets.has(address.toLowerCase())) {
        await this.addTrackedWallet(address, label, {
          type: 'SMART_MONEY',
          copyTradeEnabled: false
        });
      }
    }
    
    logger.info(`Imported ${Object.keys(this.KNOWN_WHALES).length} known whale addresses`);
  }

  // ==========================================================================
  // SMART MONEY DISCOVERY
  // ==========================================================================

  async discoverSmartMoney(
    tokenAddress: string,
    minProfit: number = 1000
  ): Promise<string[]> {
    // This would analyze historical trades for a token to find profitable traders
    // Requires indexed historical data - simplified placeholder
    
    logger.info(`Discovering smart money for token ${tokenAddress}`);
    
    // Would query:
    // 1. Early buyers who later sold at profit
    // 2. Consistent profitable traders
    // 3. Wallets that bought before major pumps
    
    return [];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const whaleTracker = new WhaleTracker();
