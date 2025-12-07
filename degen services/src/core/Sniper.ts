// ============================================================================
// APEX SNIPER - Main Sniper Orchestrator
// Coordinates all services for automated sniping
// ============================================================================

import EventEmitter from 'eventemitter3';
import {
  SnipeConfig,
  SnipeOrder,
  SnipeType,
  OrderStatus,
  DEX,
  ExecutionMethod,
  NewPairEvent,
  PendingTransaction,
  Position,
  RiskLevel,
  SniperEvent,
  SniperEventType,
  SniperStats
} from '../types';
import { config } from '../config';
import { logger, generateId, checksumAddress, sleep } from '../utils';
import { mempoolMonitor } from '../services/MempoolMonitor';
import { executionEngine } from '../services/ExecutionEngine';
import { tokenAnalyzer } from '../services/TokenAnalyzer';
import { whaleTracker } from '../services/WhaleTracker';

// ============================================================================
// EVENTS
// ============================================================================

export interface SniperOrchestratorEvents {
  'snipe:detected': (event: NewPairEvent | PendingTransaction) => void;
  'snipe:executing': (config: SnipeConfig) => void;
  'snipe:success': (order: SnipeOrder) => void;
  'snipe:failed': (order: SnipeOrder, error: string) => void;
  'event': (event: SniperEvent) => void;
  'stats:updated': (stats: SniperStats) => void;
}

// ============================================================================
// SNIPER ORCHESTRATOR
// ============================================================================

export class SniperOrchestrator extends EventEmitter<SniperOrchestratorEvents> {
  private isRunning: boolean = false;
  private activeConfigs: Map<string, SnipeConfig> = new Map();
  private pendingSnipes: Map<string, SnipeConfig> = new Map();
  private executedSnipes: Set<string> = new Set();
  private stats: SniperStats;

  constructor() {
    super();
    this.stats = this.initializeStats();
    this.setupEventHandlers();
  }

  private initializeStats(): SniperStats {
    return {
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      winRate: 0,
      totalPnL: 0,
      realizedPnL: 0,
      unrealizedPnL: 0,
      bestTrade: 0,
      worstTrade: 0,
      avgPnLPerTrade: 0,
      totalGasSpent: 0n,
      avgGasPerTrade: 0n,
      avgLatencyMs: 0,
      fastestSnipeMs: Infinity,
      bySnipeType: {
        [SnipeType.LIQUIDITY_LAUNCH]: { total: 0, successful: 0, failed: 0, totalPnL: 0 },
        [SnipeType.TOKEN_LAUNCH]: { total: 0, successful: 0, failed: 0, totalPnL: 0 },
        [SnipeType.LIMIT_ORDER]: { total: 0, successful: 0, failed: 0, totalPnL: 0 },
        [SnipeType.NFT_MINT]: { total: 0, successful: 0, failed: 0, totalPnL: 0 },
        [SnipeType.COPY_TRADE]: { total: 0, successful: 0, failed: 0, totalPnL: 0 },
        [SnipeType.WHALE_FOLLOW]: { total: 0, successful: 0, failed: 0, totalPnL: 0 }
      },
      dailyStats: []
    };
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Sniper is already running');
      return;
    }

    logger.info('Starting Apex Sniper...');
    this.isRunning = true;

    try {
      // Start all services
      await mempoolMonitor.start();
      await executionEngine.startPositionMonitor();
      
      if (config.features.whaleTrackingEnabled) {
        await whaleTracker.start();
        await whaleTracker.importKnownWhales();
      }

      this.emitEvent({
        id: generateId(),
        type: SniperEventType.SYSTEM_START,
        severity: 'INFO',
        title: 'Sniper Started',
        message: 'Apex Sniper is now running and monitoring the mempool',
        timestamp: Date.now()
      });

      logger.info('Apex Sniper started successfully');
    } catch (error) {
      this.isRunning = false;
      logger.error('Failed to start sniper:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    logger.info('Stopping Apex Sniper...');

    await mempoolMonitor.stop();
    await whaleTracker.stop();

    this.isRunning = false;

    this.emitEvent({
      id: generateId(),
      type: SniperEventType.SYSTEM_STOP,
      severity: 'INFO',
      title: 'Sniper Stopped',
      message: 'Apex Sniper has been stopped',
      timestamp: Date.now()
    });

    logger.info('Apex Sniper stopped');
  }

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  private setupEventHandlers(): void {
    // New pair created - potential liquidity launch snipe
    mempoolMonitor.on('event:pairCreated', async (event: NewPairEvent) => {
      await this.handleNewPair(event);
    });

    // Pending add liquidity - potential front-run opportunity
    mempoolMonitor.on('pending:addLiquidity', async (tx: PendingTransaction) => {
      await this.handlePendingLiquidity(tx);
    });

    // Order events from execution engine
    executionEngine.on('order:confirmed', (order: SnipeOrder) => {
      this.handleOrderConfirmed(order);
    });

    executionEngine.on('order:failed', (order: SnipeOrder, error: string) => {
      this.handleOrderFailed(order, error);
    });

    // Whale events
    whaleTracker.on('whale:buy', async (tx) => {
      await this.handleWhaleBuy(tx);
    });

    whaleTracker.on('copy:executed', (tx, orderId) => {
      this.emitEvent({
        id: generateId(),
        type: SniperEventType.COPY_TRADE_EXECUTED,
        severity: 'INFO',
        title: 'Copy Trade Executed',
        message: `Copied whale trade for ${tx.tokenInfo.symbol}`,
        data: { txHash: tx.txHash, orderId },
        timestamp: Date.now()
      });
    });
  }

  // ==========================================================================
  // SNIPE HANDLERS
  // ==========================================================================

  private async handleNewPair(event: NewPairEvent): Promise<void> {
    logger.info(`New pair detected: ${event.token0}/${event.token1}`);

    // Check if we have an active config for this token
    for (const [id, cfg] of this.activeConfigs) {
      if (cfg.type !== SnipeType.LIQUIDITY_LAUNCH) continue;
      if (!cfg.enabled) continue;

      // Check if this pair matches our target
      const targetToken = cfg.targetToken?.toLowerCase();
      if (targetToken) {
        if (event.token0.toLowerCase() !== targetToken && 
            event.token1.toLowerCase() !== targetToken) {
          continue;
        }
      }

      // Determine which token is the target (not WETH)
      const weth = config.contracts.weth.toLowerCase();
      const token = event.token0.toLowerCase() === weth 
        ? event.token1 
        : event.token0;

      // Run safety analysis
      if (cfg.safetyCheckEnabled) {
        const analysis = await tokenAnalyzer.analyzeToken(token, event.pair);
        
        if (analysis.riskLevel === RiskLevel.HONEYPOT || 
            analysis.riskLevel === RiskLevel.CRITICAL) {
          logger.warn(`Skipping ${token} - risk level: ${analysis.riskLevel}`);
          
          this.emitEvent({
            id: generateId(),
            type: SniperEventType.HONEYPOT_DETECTED,
            severity: 'WARNING',
            title: 'Honeypot Detected',
            message: `Token ${token} flagged as ${analysis.riskLevel}`,
            data: { token, riskLevel: analysis.riskLevel, score: analysis.score },
            timestamp: Date.now()
          });
          
          continue;
        }

        if (analysis.honeypotTest.buyTax > cfg.maxBuyTax ||
            analysis.honeypotTest.sellTax > cfg.maxSellTax) {
          logger.warn(`Skipping ${token} - tax too high`);
          continue;
        }
      }

      // Execute snipe
      this.emit('snipe:detected', event);
      await this.executeSnipe({
        ...cfg,
        targetToken: checksumAddress(token),
        targetPair: event.pair
      });
    }

    // Also check for any "snipe all new pairs" configs
    await this.handleAutoSnipeNewPair(event);
  }

  private async handleAutoSnipeNewPair(event: NewPairEvent): Promise<void> {
    // Find configs that are set to auto-snipe new pairs
    for (const [id, cfg] of this.activeConfigs) {
      if (cfg.type !== SnipeType.TOKEN_LAUNCH) continue;
      if (!cfg.enabled) continue;
      if (cfg.targetToken) continue; // Has specific target, skip

      const weth = config.contracts.weth.toLowerCase();
      const token = event.token0.toLowerCase() === weth 
        ? event.token1 
        : event.token0;

      // Skip if already sniped
      if (this.executedSnipes.has(token.toLowerCase())) continue;

      // Safety check
      if (cfg.safetyCheckEnabled) {
        const safetyCheck = await tokenAnalyzer.quickSafetyCheck(token);
        if (!safetyCheck.safe) continue;
      }

      this.executedSnipes.add(token.toLowerCase());
      
      await this.executeSnipe({
        ...cfg,
        targetToken: checksumAddress(token),
        targetPair: event.pair
      });
    }
  }

  private async handlePendingLiquidity(tx: PendingTransaction): Promise<void> {
    // This is for front-running liquidity adds
    // More aggressive strategy - use with caution
    
    if (!tx.decodedMethod) return;

    logger.debug(`Pending liquidity add from ${tx.from}`);

    // Could implement front-running logic here
    // For now, just log it
  }

  private async handleWhaleBuy(tx: any): Promise<void> {
    this.emitEvent({
      id: generateId(),
      type: SniperEventType.WHALE_BUY,
      severity: 'INFO',
      title: 'Whale Buy Detected',
      message: `${tx.walletAddress.slice(0, 8)}... bought ${tx.tokenInfo.symbol}`,
      data: { 
        wallet: tx.walletAddress,
        token: tx.token,
        value: tx.valueUSD
      },
      timestamp: Date.now()
    });
  }

  private handleOrderConfirmed(order: SnipeOrder): void {
    this.stats.totalTrades++;
    this.stats.successfulTrades++;
    this.stats.bySnipeType[order.type].total++;
    this.stats.bySnipeType[order.type].successful++;
    
    if (order.latencyMs && order.latencyMs < this.stats.fastestSnipeMs) {
      this.stats.fastestSnipeMs = order.latencyMs;
    }
    
    if (order.gasUsed) {
      this.stats.totalGasSpent += order.gasUsed * (order.effectiveGasPrice || 0n);
    }
    
    this.updateWinRate();
    this.emit('snipe:success', order);
    this.emit('stats:updated', this.stats);

    this.emitEvent({
      id: generateId(),
      type: SniperEventType.SNIPE_SUCCESS,
      severity: 'INFO',
      title: 'Snipe Successful',
      message: `Successfully sniped ${order.tokenOut}`,
      data: { 
        orderId: order.id,
        txHash: order.txHash,
        latencyMs: order.latencyMs
      },
      timestamp: Date.now()
    });
  }

  private handleOrderFailed(order: SnipeOrder, error: string): void {
    this.stats.totalTrades++;
    this.stats.failedTrades++;
    this.stats.bySnipeType[order.type].total++;
    this.stats.bySnipeType[order.type].failed++;
    
    this.updateWinRate();
    this.emit('snipe:failed', order, error);
    this.emit('stats:updated', this.stats);

    this.emitEvent({
      id: generateId(),
      type: SniperEventType.SNIPE_FAILED,
      severity: 'WARNING',
      title: 'Snipe Failed',
      message: `Failed to snipe ${order.tokenOut}: ${error}`,
      data: { orderId: order.id, error },
      timestamp: Date.now()
    });
  }

  private updateWinRate(): void {
    if (this.stats.totalTrades > 0) {
      this.stats.winRate = (this.stats.successfulTrades / this.stats.totalTrades) * 100;
    }
  }

  // ==========================================================================
  // SNIPE EXECUTION
  // ==========================================================================

  private async executeSnipe(snipeConfig: SnipeConfig): Promise<void> {
    logger.info(`Executing snipe for ${snipeConfig.targetToken}`);
    
    this.emit('snipe:executing', snipeConfig);
    
    this.emitEvent({
      id: generateId(),
      type: SniperEventType.SNIPE_EXECUTING,
      severity: 'INFO',
      title: 'Snipe Executing',
      message: `Executing snipe for ${snipeConfig.targetToken}`,
      data: { configId: snipeConfig.id },
      timestamp: Date.now()
    });

    try {
      // Apply block delay if configured
      if (snipeConfig.blockDelay > 0) {
        logger.info(`Waiting ${snipeConfig.blockDelay} blocks...`);
        await this.waitBlocks(snipeConfig.blockDelay);
      }

      await executionEngine.executeSnipe(snipeConfig);
    } catch (error) {
      logger.error(`Snipe execution failed:`, error);
    }
  }

  private async waitBlocks(blocks: number): Promise<void> {
    const provider = mempoolMonitor['httpProvider'];
    const startBlock = await provider.getBlockNumber();
    
    while (true) {
      const currentBlock = await provider.getBlockNumber();
      if (currentBlock - startBlock >= blocks) break;
      await sleep(1000);
    }
  }

  // ==========================================================================
  // CONFIG MANAGEMENT
  // ==========================================================================

  addSnipeConfig(snipeConfig: SnipeConfig): void {
    this.activeConfigs.set(snipeConfig.id, snipeConfig);
    logger.info(`Added snipe config: ${snipeConfig.id} (${snipeConfig.type})`);
  }

  removeSnipeConfig(configId: string): boolean {
    const deleted = this.activeConfigs.delete(configId);
    if (deleted) {
      logger.info(`Removed snipe config: ${configId}`);
    }
    return deleted;
  }

  getSnipeConfig(configId: string): SnipeConfig | undefined {
    return this.activeConfigs.get(configId);
  }

  getAllConfigs(): SnipeConfig[] {
    return Array.from(this.activeConfigs.values());
  }

  updateSnipeConfig(configId: string, updates: Partial<SnipeConfig>): SnipeConfig | null {
    const existing = this.activeConfigs.get(configId);
    if (!existing) return null;

    const updated = { ...existing, ...updates, updatedAt: Date.now() };
    this.activeConfigs.set(configId, updated);
    return updated;
  }

  enableConfig(configId: string): boolean {
    const cfg = this.activeConfigs.get(configId);
    if (cfg) {
      cfg.enabled = true;
      return true;
    }
    return false;
  }

  disableConfig(configId: string): boolean {
    const cfg = this.activeConfigs.get(configId);
    if (cfg) {
      cfg.enabled = false;
      return true;
    }
    return false;
  }

  // ==========================================================================
  // QUICK SNIPE METHODS
  // ==========================================================================

  async snipeLiquidityLaunch(
    tokenAddress: string,
    amountEth: string,
    walletIds: string[],
    options: Partial<SnipeConfig> = {}
  ): Promise<string> {
    const snipeConfig: SnipeConfig = {
      id: generateId(),
      type: SnipeType.LIQUIDITY_LAUNCH,
      enabled: true,
      targetToken: checksumAddress(tokenAddress),
      targetDex: options.targetDex || DEX.UNISWAP_V2,
      executionMethod: options.executionMethod || ExecutionMethod.FLASHBOTS,
      walletIds,
      amountInWei: BigInt(Math.floor(parseFloat(amountEth) * 1e18)),
      amountType: 'FIXED',
      blockDelay: options.blockDelay || 0,
      maxBlocks: options.maxBlocks || 5,
      gasMultiplier: options.gasMultiplier || 1.5,
      maxGasPrice: options.maxGasPrice || BigInt(150e9),
      priorityFee: options.priorityFee || BigInt(5e9),
      minLiquidity: options.minLiquidity || 1000,
      maxBuyTax: options.maxBuyTax || 10,
      maxSellTax: options.maxSellTax || 15,
      safetyCheckEnabled: options.safetyCheckEnabled ?? true,
      antiRugEnabled: options.antiRugEnabled ?? true,
      autoSellEnabled: options.autoSellEnabled ?? false,
      takeProfitPercentages: options.takeProfitPercentages || [50, 100, 200],
      stopLossPercentage: options.stopLossPercentage || 30,
      trailingStopEnabled: options.trailingStopEnabled || false,
      trailingStopPercentage: options.trailingStopPercentage || 20,
      slippagePercent: options.slippagePercent || 10,
      deadline: options.deadline || 300,
      retries: options.retries || 2,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.addSnipeConfig(snipeConfig);
    return snipeConfig.id;
  }

  async snipeNow(
    tokenAddress: string,
    amountEth: string,
    walletId: string,
    options: {
      slippage?: number;
      method?: ExecutionMethod;
      safetyCheck?: boolean;
    } = {}
  ): Promise<SnipeOrder> {
    return executionEngine.buyToken(
      tokenAddress,
      amountEth,
      walletId,
      {
        slippage: options.slippage || 10,
        method: options.method || ExecutionMethod.FLASHBOTS,
        safetyCheck: options.safetyCheck ?? true
      }
    );
  }

  // ==========================================================================
  // STATS & STATUS
  // ==========================================================================

  getStats(): SniperStats {
    return { ...this.stats };
  }

  getStatus(): {
    running: boolean;
    mempoolConnected: boolean;
    activeConfigs: number;
    openPositions: number;
    pendingOrders: number;
  } {
    return {
      running: this.isRunning,
      mempoolConnected: mempoolMonitor.isRunning(),
      activeConfigs: this.activeConfigs.size,
      openPositions: executionEngine.getOpenPositions().length,
      pendingOrders: executionEngine.getPendingOrders().length
    };
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private emitEvent(event: SniperEvent): void {
    this.emit('event', event);
    
    // Log based on severity
    switch (event.severity) {
      case 'CRITICAL':
        logger.error(`[${event.type}] ${event.message}`);
        break;
      case 'WARNING':
        logger.warn(`[${event.type}] ${event.message}`);
        break;
      default:
        logger.info(`[${event.type}] ${event.message}`);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const sniper = new SniperOrchestrator();
