// ============================================================================
// APEX SNIPER - Mempool Monitor Service
// Real-time pending transaction monitoring with intelligent filtering
// ============================================================================

import { WebSocket } from 'ws';
import { ethers, JsonRpcProvider, WebSocketProvider, TransactionResponse } from 'ethers';
import EventEmitter from 'eventemitter3';
import {
  PendingTransaction,
  NewPairEvent,
  LiquidityEvent,
  DEX
} from '../types';
import {
  config,
  KNOWN_ROUTERS,
  KNOWN_FACTORIES,
  METHOD_SIGNATURES
} from '../config';
import {
  logger,
  generateId,
  checksumAddress,
  decodeTransactionData,
  isSwapTransaction,
  isAddLiquidityTransaction,
  isRemoveLiquidityTransaction,
  isKnownRouter
} from '../utils';

// ============================================================================
// EVENTS
// ============================================================================

export interface MempoolEvents {
  'pending:transaction': (tx: PendingTransaction) => void;
  'pending:swap': (tx: PendingTransaction) => void;
  'pending:addLiquidity': (tx: PendingTransaction) => void;
  'pending:removeLiquidity': (tx: PendingTransaction) => void;
  'pending:deploy': (tx: PendingTransaction) => void;
  'event:pairCreated': (event: NewPairEvent) => void;
  'event:liquidityAdded': (event: LiquidityEvent) => void;
  'event:liquidityRemoved': (event: LiquidityEvent) => void;
  'status:connected': () => void;
  'status:disconnected': () => void;
  'status:error': (error: Error) => void;
}

// ============================================================================
// MEMPOOL MONITOR
// ============================================================================

export class MempoolMonitor extends EventEmitter<MempoolEvents> {
  private wsProvider: WebSocketProvider | null = null;
  private httpProvider: JsonRpcProvider;
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000;
  private pendingTxCache: Map<string, number> = new Map();
  private cacheCleanupInterval: NodeJS.Timeout | null = null;
  
  // Filters
  private watchedAddresses: Set<string> = new Set();
  private watchedTokens: Set<string> = new Set();
  private excludedAddresses: Set<string> = new Set();
  
  // Stats
  private stats = {
    totalReceived: 0,
    swapsDetected: 0,
    liquidityEvents: 0,
    deploysDetected: 0,
    filteredOut: 0
  };

  constructor() {
    super();
    this.httpProvider = new JsonRpcProvider(config.rpcUrl);
    
    // Pre-populate watched addresses with known routers
    Object.keys(KNOWN_ROUTERS).forEach(addr => {
      this.watchedAddresses.add(addr.toLowerCase());
    });
    
    // Pre-populate watched addresses with known factories
    Object.keys(KNOWN_FACTORIES).forEach(addr => {
      this.watchedAddresses.add(addr.toLowerCase());
    });
  }

  // ==========================================================================
  // CONNECTION MANAGEMENT
  // ==========================================================================

  async start(): Promise<void> {
    logger.info('Starting mempool monitor...');
    
    await this.connect();
    this.startCacheCleanup();
    this.subscribeToEvents();
    
    logger.info('Mempool monitor started successfully');
  }

  async stop(): Promise<void> {
    logger.info('Stopping mempool monitor...');
    
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.wsProvider) {
      await this.wsProvider.destroy();
      this.wsProvider = null;
    }
    
    this.isConnected = false;
    this.emit('status:disconnected');
    
    logger.info('Mempool monitor stopped');
  }

  private async connect(): Promise<void> {
    try {
      // Connect via WebSocket for real-time data
      this.ws = new WebSocket(config.wsRpcUrl);
      
      this.ws.on('open', () => {
        logger.info('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('status:connected');
        
        // Subscribe to pending transactions
        this.subscribeToPendingTransactions();
      });
      
      this.ws.on('message', (data: Buffer) => {
        this.handleMessage(data);
      });
      
      this.ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.emit('status:error', error);
      });
      
      this.ws.on('close', () => {
        logger.warn('WebSocket disconnected');
        this.isConnected = false;
        this.emit('status:disconnected');
        this.attemptReconnect();
      });
      
    } catch (error) {
      logger.error('Failed to connect:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    logger.info(`Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private subscribeToPendingTransactions(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    // Subscribe to newPendingTransactions
    const subscribeMsg = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_subscribe',
      params: ['newPendingTransactions']
    });
    
    this.ws.send(subscribeMsg);
    logger.info('Subscribed to pending transactions');
  }

  private subscribeToEvents(): void {
    // Subscribe to PairCreated events from all known factories
    Object.entries(KNOWN_FACTORIES).forEach(([factory, info]) => {
      this.subscribeToFactoryEvents(factory, info.dex as DEX);
    });
  }

  private subscribeToFactoryEvents(factory: string, dex: DEX): void {
    // PairCreated event signature
    const pairCreatedTopic = ethers.id('PairCreated(address,address,address,uint256)');
    
    const filter = {
      address: factory,
      topics: [pairCreatedTopic]
    };
    
    this.httpProvider.on(filter, (log) => {
      this.handlePairCreatedLog(log, dex);
    });
    
    logger.info(`Subscribed to PairCreated events from ${dex}`);
  }

  // ==========================================================================
  // MESSAGE HANDLING
  // ==========================================================================

  private handleMessage(data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.method === 'eth_subscription') {
        const txHash = message.params?.result;
        if (txHash && typeof txHash === 'string') {
          this.processPendingTransaction(txHash);
        }
      }
    } catch (error) {
      // Ignore parse errors for malformed messages
    }
  }

  private async processPendingTransaction(txHash: string): Promise<void> {
    // Check cache to avoid duplicate processing
    if (this.pendingTxCache.has(txHash)) return;
    this.pendingTxCache.set(txHash, Date.now());
    
    this.stats.totalReceived++;
    
    try {
      // Fetch full transaction details
      const tx = await this.httpProvider.getTransaction(txHash);
      if (!tx) return;
      
      // Quick filter - only process transactions to known addresses
      const to = tx.to?.toLowerCase();
      if (!to) {
        // Contract deployment
        await this.handleDeployTransaction(tx);
        return;
      }
      
      // Check if it's a transaction to a watched address
      if (!this.shouldProcessTransaction(tx)) {
        this.stats.filteredOut++;
        return;
      }
      
      // Build pending transaction object
      const pendingTx = this.buildPendingTransaction(tx);
      
      // Emit general event
      this.emit('pending:transaction', pendingTx);
      
      // Categorize and emit specific events
      if (pendingTx.isAddLiquidity) {
        this.stats.liquidityEvents++;
        this.emit('pending:addLiquidity', pendingTx);
      } else if (pendingTx.isRemoveLiquidity) {
        this.stats.liquidityEvents++;
        this.emit('pending:removeLiquidity', pendingTx);
      } else if (pendingTx.isSwap) {
        this.stats.swapsDetected++;
        this.emit('pending:swap', pendingTx);
      }
      
    } catch (error) {
      // Transaction might have been mined already or dropped
    }
  }

  private shouldProcessTransaction(tx: TransactionResponse): boolean {
    const to = tx.to?.toLowerCase();
    if (!to) return false;
    
    // Check if to address is in excluded list
    if (this.excludedAddresses.has(to)) return false;
    
    // Check if to address is a known router or factory
    if (this.watchedAddresses.has(to)) return true;
    
    // Check if transaction data indicates it's a swap/liquidity operation
    if (isSwapTransaction(tx.data)) return true;
    if (isAddLiquidityTransaction(tx.data)) return true;
    if (isRemoveLiquidityTransaction(tx.data)) return true;
    
    return false;
  }

  private buildPendingTransaction(tx: TransactionResponse): PendingTransaction {
    const decoded = decodeTransactionData(tx.data);
    
    return {
      hash: tx.hash,
      from: checksumAddress(tx.from),
      to: tx.to ? checksumAddress(tx.to) : '',
      value: tx.value,
      gasPrice: tx.gasPrice || 0n,
      maxFeePerGas: tx.maxFeePerGas || undefined,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas || undefined,
      gasLimit: tx.gasLimit,
      nonce: tx.nonce,
      data: tx.data,
      chainId: Number(tx.chainId),
      type: tx.type || 0,
      
      decodedMethod: decoded || undefined,
      
      isSwap: isSwapTransaction(tx.data),
      isDeploy: !tx.to,
      isAddLiquidity: isAddLiquidityTransaction(tx.data),
      isRemoveLiquidity: isRemoveLiquidityTransaction(tx.data),
      isNFTMint: false, // TODO: Implement NFT detection
      
      receivedAt: Date.now(),
      source: 'PUBLIC'
    };
  }

  private async handleDeployTransaction(tx: TransactionResponse): Promise<void> {
    this.stats.deploysDetected++;
    
    const pendingTx: PendingTransaction = {
      hash: tx.hash,
      from: checksumAddress(tx.from),
      to: '',
      value: tx.value,
      gasPrice: tx.gasPrice || 0n,
      maxFeePerGas: tx.maxFeePerGas || undefined,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas || undefined,
      gasLimit: tx.gasLimit,
      nonce: tx.nonce,
      data: tx.data,
      chainId: Number(tx.chainId),
      type: tx.type || 0,
      
      isSwap: false,
      isDeploy: true,
      isAddLiquidity: false,
      isRemoveLiquidity: false,
      isNFTMint: false,
      
      receivedAt: Date.now(),
      source: 'PUBLIC'
    };
    
    this.emit('pending:deploy', pendingTx);
  }

  private async handlePairCreatedLog(log: ethers.Log, dex: DEX): Promise<void> {
    try {
      // Decode PairCreated event
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
        blockNumber: log.blockNumber,
        timestamp: Date.now(),
        deployer: '' // Will be filled from transaction
      };
      
      // Get deployer from transaction
      const tx = await this.httpProvider.getTransaction(log.transactionHash);
      if (tx) {
        event.deployer = checksumAddress(tx.from);
      }
      
      logger.info(`New pair created: ${event.token0}/${event.token1} on ${dex}`);
      this.emit('event:pairCreated', event);
      
    } catch (error) {
      logger.error('Error handling PairCreated log:', error);
    }
  }

  // ==========================================================================
  // FILTER MANAGEMENT
  // ==========================================================================

  addWatchedAddress(address: string): void {
    this.watchedAddresses.add(address.toLowerCase());
  }

  removeWatchedAddress(address: string): void {
    this.watchedAddresses.delete(address.toLowerCase());
  }

  addWatchedToken(address: string): void {
    this.watchedTokens.add(address.toLowerCase());
  }

  removeWatchedToken(address: string): void {
    this.watchedTokens.delete(address.toLowerCase());
  }

  addExcludedAddress(address: string): void {
    this.excludedAddresses.add(address.toLowerCase());
  }

  removeExcludedAddress(address: string): void {
    this.excludedAddresses.delete(address.toLowerCase());
  }

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  private startCacheCleanup(): void {
    // Clean up old cache entries every 30 seconds
    this.cacheCleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = 60000; // 1 minute
      
      for (const [hash, timestamp] of this.pendingTxCache) {
        if (now - timestamp > maxAge) {
          this.pendingTxCache.delete(hash);
        }
      }
    }, 30000);
  }

  // ==========================================================================
  // STATS & STATUS
  // ==========================================================================

  getStats() {
    return { ...this.stats };
  }

  isRunning(): boolean {
    return this.isConnected;
  }

  getWatchedAddresses(): string[] {
    return Array.from(this.watchedAddresses);
  }

  getWatchedTokens(): string[] {
    return Array.from(this.watchedTokens);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const mempoolMonitor = new MempoolMonitor();
