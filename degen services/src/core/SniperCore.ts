// ============================================================================
// APEX SNIPER - Core Orchestrator
// Main controller that coordinates all sniper services
// ============================================================================

import EventEmitter from 'eventemitter3';
import {
  SnipeConfig,
  SnipeOrder,
  SnipeType,
  OrderStatus,
  Position,
  NewPairEvent,
  PendingTransaction,
  TokenSafetyAnalysis,
  RiskLevel,
  DEX,
  ExecutionMethod,
  SniperEvent,
  SniperEventType,
  SniperStats
} from '../types';
import { config } from '../config';
import { logger, generateId, checksumAddress } from '../utils';
import { mempoolMonitor, MempoolEvents } from '../services/MempoolMonitor';
import { tokenAnalyzer } from '../services/TokenAnalyzer';
import { executionEngine, ExecutionEvents } from '../services/ExecutionEngine';
import { whaleTracker, WhaleTrackerEvents } from '../services/WhaleTracker';
import { multiRpcProvider } from '../services/MultiRpcProvider';
import { block0Sniper } from '../services/Block0Sniper';
import { gasOptimizer } from '../services/GasOptimizer';
import { deployerTracker } from '../services/DeployerTracker';
import { memeHunter } from '../services/MemeHunter';
import { portfolioAnalytics } from '../services/PortfolioAnalytics';
import { marketRegimeDetector } from '../services/MarketRegimeDetector';
import { telegramService } from '../services/TelegramNotificationService';
import { arbitrageDetector } from '../services/ArbitrageDetector';
import { whaleIntelligence } from '../services/WhaleIntelligence';

// ============================================================================
// EVENTS
// ============================================================================

export interface SniperCoreEvents {
  'snipe:detected': (event: NewPairEvent | PendingTransaction) => void;
  'snipe:analyzing': (token: string) => void;
  'snipe:executing': (config: SnipeConfig) => void;
  'snipe:success': (order: SnipeOrder) => void;
  'snipe:failed': (order: SnipeOrder, error: string) => void;
  'alert': (event: SniperEvent) => void;
  'stats:updated': (stats: SniperStats) => void;
}

// ============================================================================
// SNIPER CORE
// ============================================================================

export class SniperCore extends EventEmitter<SniperCoreEvents> {
  private isRunning: boolean = false;
  private snipeConfigs: Map<string, SnipeConfig> = new Map();
  private autoSnipeEnabled: boolean = false;
  private stats: SniperStats;
  
  // Queues
  private pendingSnipes: Map<string, NewPairEvent> = new Map();
  private processingTokens: Set<string> = new Set();

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
      logger.warn('Sniper core already running');
      return;
    }

    logger.info('╔════════════════════════════════════════╗');
    logger.info('║       APEX SNIPER - Starting...        ║');
    logger.info('╚════════════════════════════════════════╝');

    try {
      // Start Multi-RPC provider for high availability
      await multiRpcProvider.startHealthMonitor();
      logger.info('✓ Multi-RPC provider started');

      // Start gas optimizer for competitive gas pricing
      await gasOptimizer.start();
      logger.info('✓ Gas optimizer started');

      // Start mempool monitor
      await mempoolMonitor.start();
      logger.info('✓ Mempool monitor started');

      // Start Block-0 sniper for ultra-fast sniping
      await block0Sniper.start();
      logger.info('✓ Block-0 sniper started');

      // Start deployer tracker
      await deployerTracker.start();
      logger.info('✓ Deployer tracker started');

      // Start execution engine position monitor
      await executionEngine.startPositionMonitor();
      logger.info('✓ Position monitor started');

      // Start whale tracker if enabled
      if (config.features.whaleTrackingEnabled) {
        await whaleTracker.start();
        await whaleTracker.importKnownWhales();
        logger.info('✓ Whale tracker started');
      }

      // Start Meme Hunter Engine
      await memeHunter.start();
      logger.info('✓ Meme Hunter Engine started');

      // Start Portfolio Analytics
      portfolioAnalytics.start();
      logger.info('✓ Portfolio Analytics started');

      // Start Market Regime Detector
      await marketRegimeDetector.start();
      logger.info('✓ Market Regime Detector started');

      // Start Arbitrage Detector
      await arbitrageDetector.start();
      logger.info('✓ Arbitrage Detector started');

      // Start Whale Intelligence
      whaleIntelligence.start();
      logger.info('✓ Whale Intelligence started');

      // Start Telegram Service
      await telegramService.start();
      logger.info('✓ Telegram Notification Service started');

      this.isRunning = true;

      // Setup enhanced event handlers
      this.setupEnhancedEventHandlers();

      this.emitAlert({
        type: SniperEventType.SYSTEM_START,
        severity: 'INFO',
        title: 'System Started',
        message: 'Apex Sniper is now running with enhanced capabilities'
      });

      logger.info('╔════════════════════════════════════════╗');
      logger.info('║     APEX SNIPER - Ready to Hunt!       ║');
      logger.info('║   Block-0 Sniping: ENABLED             ║');
      logger.info('║   Multi-RPC: ACTIVE                    ║');
      logger.info('║   Gas Optimizer: RUNNING               ║');
      logger.info('║   Meme Hunter: ACTIVE 🎯               ║');
      logger.info('║   Portfolio Analytics: ACTIVE 📊       ║');
      logger.info('║   Market Regime: DETECTING 🔍          ║');
      logger.info('║   Arbitrage Detector: SCANNING 💰      ║');
      logger.info('║   Whale Intelligence: PROFILING 🐋     ║');
      logger.info('╚════════════════════════════════════════╝');

    } catch (error) {
      logger.error('Failed to start sniper core:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    logger.info('Stopping sniper core...');

    await mempoolMonitor.stop();
    await whaleTracker.stop();
    await block0Sniper.stop();
    await deployerTracker.stop();
    await memeHunter.stop();
    await telegramService.stop();
    portfolioAnalytics.stop();
    marketRegimeDetector.stop();
    arbitrageDetector.stop();
    whaleIntelligence.stop();
    gasOptimizer.stop();
    multiRpcProvider.stopHealthMonitor();

    this.isRunning = false;

    this.emitAlert({
      type: SniperEventType.SYSTEM_STOP,
      severity: 'INFO',
      title: 'System Stopped',
      message: 'Apex Sniper has been stopped'
    });

    logger.info('Sniper core stopped');
  }

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  private setupEventHandlers(): void {
    // Mempool events
    mempoolMonitor.on('event:pairCreated', (event) => this.handleNewPair(event));
    mempoolMonitor.on('pending:addLiquidity', (tx) => this.handlePendingLiquidity(tx));

    // Execution events
    executionEngine.on('order:confirmed', (order) => this.handleOrderConfirmed(order));
    executionEngine.on('order:failed', (order, error) => this.handleOrderFailed(order, error));
    executionEngine.on('position:opened', (position) => this.handlePositionOpened(position));
    executionEngine.on('position:closed', (position) => this.handlePositionClosed(position));

    // Whale events
    whaleTracker.on('whale:buy', (tx) => this.handleWhaleBuy(tx));
    whaleTracker.on('copy:executed', (tx, orderId) => this.handleCopyExecuted(tx, orderId));
  }

  private setupEnhancedEventHandlers(): void {
    // Block-0 sniper events
    block0Sniper.on('liquidity:detected', (event) => {
      logger.info(`[Block-0] Liquidity detected: ${event.pair}`);
      this.emit('snipe:detected', event);
    });

    block0Sniper.on('liquidity:sniped', (event, order) => {
      logger.info(`[Block-0] Snipe executed: ${order.txHash}`);
      this.handleOrderConfirmed(order);
    });

    block0Sniper.on('presigned:executed', (tx, txHash) => {
      logger.info(`[Block-0] Pre-signed tx executed: ${txHash}`);
    });

    // Deployer tracker events
    deployerTracker.on('deployer:newDeployment', (event) => {
      if (event.isToken) {
        logger.info(`[Deployer] New token deployed: ${event.tokenInfo?.symbol || event.contractAddress}`);
      }
    });

    deployerTracker.on('deployer:tokenLaunch', (deployer, token) => {
      logger.info(`[Deployer] Token launched by ${deployer.label}: ${token.symbol}`);
      this.emitAlert({
        type: SniperEventType.SNIPE_DETECTED,
        severity: 'INFO',
        title: 'Token Launch Detected',
        message: `${deployer.label} launched ${token.symbol}`,
        data: { deployer: deployer.address, token: token.address }
      });
    });

    // Multi-RPC events
    multiRpcProvider.on('rpc:switched', (from, to) => {
      logger.info(`[RPC] Switched from ${from} to ${to}`);
    });

    multiRpcProvider.on('rpc:unhealthy', (endpoint) => {
      logger.warn(`[RPC] Endpoint unhealthy: ${endpoint.name}`);
    });

    // Arbitrage events
    arbitrageDetector.on('opportunity:found', (opportunity) => {
      logger.info(`[Arbitrage] Opportunity: ${opportunity.tokenSymbol} ${opportunity.priceDifferencePercent.toFixed(2)}% - $${opportunity.netProfitUSD.toFixed(2)} profit`);
      this.emitAlert({
        type: SniperEventType.WHALE_ACTIVITY,
        severity: 'INFO',
        title: 'Arbitrage Opportunity',
        message: `${opportunity.tokenSymbol}: ${opportunity.priceDifferencePercent.toFixed(2)}% price difference (${opportunity.buyDex} → ${opportunity.sellDex})`,
        data: opportunity
      });
    });

    // Market regime events
    marketRegimeDetector.on('regime:changed', (oldRegime, newRegime, analysis) => {
      logger.info(`[Market] Regime changed: ${oldRegime} → ${newRegime}`);
      this.emitAlert({
        type: SniperEventType.SYSTEM_START,
        severity: 'INFO',
        title: 'Market Regime Changed',
        message: `Market entered ${newRegime} regime. Recommended action: ${analysis.recommendedAction.action}`,
        data: { oldRegime, newRegime, analysis }
      });
    });

    marketRegimeDetector.on('opportunity:detected', (opportunity) => {
      logger.info(`[Market] ${opportunity.type} opportunity detected`);
      this.emitAlert({
        type: SniperEventType.SNIPE_DETECTED,
        severity: 'INFO',
        title: 'Market Opportunity',
        message: opportunity.message,
        data: opportunity
      });
    });

    // Whale intelligence events
    whaleIntelligence.on('copySignal:generated', (signal) => {
      if (signal.recommendedAction === 'FOLLOW') {
        logger.info(`[WhaleIntel] Copy signal: ${signal.walletLabel} ${signal.action} ${signal.tokenSymbol}`);
        this.emitAlert({
          type: SniperEventType.WHALE_ACTIVITY,
          severity: 'WARNING',
          title: 'Strong Copy Trade Signal',
          message: `${signal.walletLabel} (${signal.walletReputation}/100) is ${signal.action}ing ${signal.tokenSymbol}`,
          data: signal
        });
      }
    });

    whaleIntelligence.on('coordination:detected', (activity) => {
      logger.warn(`[WhaleIntel] Coordinated activity: ${activity.message}`);
      this.emitAlert({
        type: SniperEventType.WHALE_ACTIVITY,
        severity: activity.isWarning ? 'WARNING' : 'INFO',
        title: 'Coordinated Whale Activity',
        message: activity.message,
        data: activity
      });
    });

    // Portfolio analytics events
    portfolioAnalytics.on('risk:alert', (alert) => {
      logger.warn(`[Portfolio] Risk alert: ${alert.title}`);
      this.emitAlert({
        type: SniperEventType.RISK_WARNING,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        data: alert
      });
    });

    portfolioAnalytics.on('circuit:breaker', (reason) => {
      logger.error(`[Portfolio] Circuit breaker activated: ${reason}`);
      this.emitAlert({
        type: SniperEventType.RISK_WARNING,
        severity: 'CRITICAL',
        title: 'Circuit Breaker Activated',
        message: `Trading paused: ${reason}`,
        data: { reason }
      });
    });
  }

  private async handleNewPair(event: NewPairEvent): Promise<void> {
    logger.info(`New pair detected: ${event.token0}/${event.token1} on ${event.dex}`);
    
    this.emit('snipe:detected', event);

    // Find WETH pair
    const weth = config.contracts.weth.toLowerCase();
    let targetToken: string;
    
    if (event.token0.toLowerCase() === weth) {
      targetToken = event.token1;
    } else if (event.token1.toLowerCase() === weth) {
      targetToken = event.token0;
    } else {
      logger.debug('Pair does not contain WETH, skipping');
      return;
    }

    // Check if we should auto-snipe
    if (this.autoSnipeEnabled) {
      await this.processNewToken(targetToken, event.pair, event.dex, event);
    } else {
      // Queue for manual review
      this.pendingSnipes.set(event.pair, event);
    }
  }

  private async handlePendingLiquidity(tx: PendingTransaction): Promise<void> {
    // Handle pending add liquidity transaction
    // This allows us to snipe BEFORE liquidity is added (frontrun)
    logger.debug(`Pending liquidity detected: ${tx.hash}`);
    
    // Parse liquidity params from tx data
    // This is advanced - would decode the addLiquidity call
  }

  private handleOrderConfirmed(order: SnipeOrder): void {
    this.stats.totalTrades++;
    this.stats.successfulTrades++;
    this.stats.bySnipeType[order.type].total++;
    this.stats.bySnipeType[order.type].successful++;

    if (order.latencyMs) {
      this.stats.fastestSnipeMs = Math.min(this.stats.fastestSnipeMs, order.latencyMs);
      this.stats.avgLatencyMs = 
        (this.stats.avgLatencyMs * (this.stats.totalTrades - 1) + order.latencyMs) / 
        this.stats.totalTrades;
    }

    this.updateWinRate();
    this.emit('snipe:success', order);
    this.emit('stats:updated', this.stats);

    this.emitAlert({
      type: SniperEventType.SNIPE_SUCCESS,
      severity: 'INFO',
      title: 'Snipe Successful',
      message: `Order ${order.id} confirmed in block ${order.blockNumber}`,
      data: { orderId: order.id, txHash: order.txHash }
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

    this.emitAlert({
      type: SniperEventType.SNIPE_FAILED,
      severity: 'WARNING',
      title: 'Snipe Failed',
      message: `Order ${order.id} failed: ${error}`,
      data: { orderId: order.id, error }
    });
  }

  private handlePositionOpened(position: Position): void {
    logger.info(`Position opened: ${position.tokenInfo.symbol}`);
  }

  private handlePositionClosed(position: Position): void {
    this.stats.realizedPnL += position.realizedPnL;
    
    if (position.realizedPnL > this.stats.bestTrade) {
      this.stats.bestTrade = position.realizedPnL;
    }
    if (position.realizedPnL < this.stats.worstTrade) {
      this.stats.worstTrade = position.realizedPnL;
    }

    this.emit('stats:updated', this.stats);
  }

  private handleWhaleBuy(tx: any): void {
    this.emitAlert({
      type: SniperEventType.WHALE_BUY,
      severity: 'INFO',
      title: 'Whale Buy Detected',
      message: `${tx.walletAddress} bought ${tx.tokenInfo?.symbol || tx.token}`,
      data: tx
    });
  }

  private handleCopyExecuted(tx: any, orderId: string): void {
    this.emitAlert({
      type: SniperEventType.COPY_TRADE_EXECUTED,
      severity: 'INFO',
      title: 'Copy Trade Executed',
      message: `Copied whale trade: ${orderId}`,
      data: { whaleTx: tx, orderId }
    });
  }

  private updateWinRate(): void {
    this.stats.winRate = this.stats.totalTrades > 0
      ? (this.stats.successfulTrades / this.stats.totalTrades) * 100
      : 0;
  }

  // ==========================================================================
  // TOKEN PROCESSING
  // ==========================================================================

  private async processNewToken(
    tokenAddress: string,
    pairAddress: string,
    dex: DEX,
    event: NewPairEvent
  ): Promise<void> {
    // Prevent duplicate processing
    if (this.processingTokens.has(tokenAddress)) {
      return;
    }
    this.processingTokens.add(tokenAddress);

    try {
      this.emit('snipe:analyzing', tokenAddress);
      
      // Run safety analysis
      const analysis = await tokenAnalyzer.analyzeToken(tokenAddress, pairAddress);
      
      // Check if safe to snipe
      if (analysis.riskLevel === RiskLevel.HONEYPOT) {
        this.emitAlert({
          type: SniperEventType.HONEYPOT_DETECTED,
          severity: 'CRITICAL',
          title: 'Honeypot Detected',
          message: `Token ${tokenAddress} is a honeypot`,
          data: { token: tokenAddress, analysis }
        });
        return;
      }

      if (analysis.riskLevel === RiskLevel.CRITICAL) {
        logger.warn(`Token ${tokenAddress} has critical risk, skipping`);
        return;
      }

      // Find matching snipe config or use default
      const snipeConfig = this.findMatchingConfig(tokenAddress, dex) || 
                          this.createDefaultConfig(tokenAddress, pairAddress, dex);

      // Execute snipe
      this.emit('snipe:executing', snipeConfig);
      await executionEngine.executeSnipe(snipeConfig);

    } catch (error) {
      logger.error(`Error processing token ${tokenAddress}:`, error);
    } finally {
      this.processingTokens.delete(tokenAddress);
    }
  }

  private findMatchingConfig(tokenAddress: string, dex: DEX): SnipeConfig | null {
    for (const config of this.snipeConfigs.values()) {
      if (config.enabled && config.targetDex === dex) {
        if (!config.targetToken || config.targetToken === tokenAddress) {
          return config;
        }
      }
    }
    return null;
  }

  private createDefaultConfig(
    tokenAddress: string,
    pairAddress: string,
    dex: DEX
  ): SnipeConfig {
    const wallets = executionEngine.getWallets();
    
    return {
      id: generateId(),
      type: SnipeType.LIQUIDITY_LAUNCH,
      enabled: true,
      targetToken: checksumAddress(tokenAddress),
      targetPair: checksumAddress(pairAddress),
      targetDex: dex,
      executionMethod: ExecutionMethod.FLASHBOTS,
      walletIds: wallets.slice(0, 1).map(w => w.id),
      amountInWei: BigInt(config.defaultSlippage) * BigInt(1e16), // 0.05 ETH default
      amountType: 'FIXED',
      blockDelay: 0,
      maxBlocks: 3,
      gasMultiplier: config.defaultGasMultiplier,
      maxGasPrice: config.maxGasPrice,
      priorityFee: 2000000000n, // 2 gwei
      minLiquidity: 5000,
      maxBuyTax: 10,
      maxSellTax: 15,
      safetyCheckEnabled: true,
      antiRugEnabled: config.features.antiRugEnabled,
      autoSellEnabled: config.features.autoSellEnabled,
      takeProfitPercentages: [50, 100, 200],
      stopLossPercentage: 30,
      trailingStopEnabled: true,
      trailingStopPercentage: 20,
      slippagePercent: config.defaultSlippage,
      deadline: config.defaultDeadline,
      retries: 2,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  // ==========================================================================
  // SNIPE CONFIGURATION
  // ==========================================================================

  addSnipeConfig(configData: Partial<SnipeConfig>): SnipeConfig {
    const snipeConfig: SnipeConfig = {
      id: configData.id || generateId(),
      type: configData.type || SnipeType.LIMIT_ORDER,
      enabled: configData.enabled ?? true,
      targetToken: configData.targetToken,
      targetPair: configData.targetPair,
      targetDex: configData.targetDex || DEX.UNISWAP_V2,
      executionMethod: configData.executionMethod || ExecutionMethod.FLASHBOTS,
      walletIds: configData.walletIds || [],
      amountInWei: configData.amountInWei || 0n,
      amountType: configData.amountType || 'FIXED',
      blockDelay: configData.blockDelay || 0,
      maxBlocks: configData.maxBlocks || 5,
      gasMultiplier: configData.gasMultiplier || 1.2,
      maxGasPrice: configData.maxGasPrice || config.maxGasPrice,
      priorityFee: configData.priorityFee || 2000000000n,
      minLiquidity: configData.minLiquidity || 5000,
      maxBuyTax: configData.maxBuyTax || 10,
      maxSellTax: configData.maxSellTax || 15,
      safetyCheckEnabled: configData.safetyCheckEnabled ?? true,
      antiRugEnabled: configData.antiRugEnabled ?? true,
      autoSellEnabled: configData.autoSellEnabled ?? false,
      takeProfitPercentages: configData.takeProfitPercentages || [],
      stopLossPercentage: configData.stopLossPercentage || 0,
      trailingStopEnabled: configData.trailingStopEnabled || false,
      trailingStopPercentage: configData.trailingStopPercentage || 0,
      slippagePercent: configData.slippagePercent || 5,
      deadline: configData.deadline || 300,
      retries: configData.retries || 2,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.snipeConfigs.set(snipeConfig.id, snipeConfig);
    logger.info(`Snipe config added: ${snipeConfig.id}`);
    
    return snipeConfig;
  }

  updateSnipeConfig(id: string, updates: Partial<SnipeConfig>): SnipeConfig | null {
    const existing = this.snipeConfigs.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, updatedAt: Date.now() };
    this.snipeConfigs.set(id, updated);
    
    return updated;
  }

  removeSnipeConfig(id: string): boolean {
    return this.snipeConfigs.delete(id);
  }

  getSnipeConfig(id: string): SnipeConfig | undefined {
    return this.snipeConfigs.get(id);
  }

  getAllSnipeConfigs(): SnipeConfig[] {
    return Array.from(this.snipeConfigs.values());
  }

  // ==========================================================================
  // AUTO SNIPE CONTROL
  // ==========================================================================

  enableAutoSnipe(): void {
    this.autoSnipeEnabled = true;
    logger.info('Auto-snipe enabled');
  }

  disableAutoSnipe(): void {
    this.autoSnipeEnabled = false;
    logger.info('Auto-snipe disabled');
  }

  isAutoSnipeEnabled(): boolean {
    return this.autoSnipeEnabled;
  }

  // ==========================================================================
  // MANUAL SNIPE
  // ==========================================================================

  async manualSnipe(
    tokenAddress: string,
    amountEth: string,
    walletId: string,
    options: {
      slippage?: number;
      dex?: DEX;
      method?: ExecutionMethod;
      safetyCheck?: boolean;
      autoSell?: boolean;
      takeProfit?: number[];
      stopLoss?: number;
    } = {}
  ): Promise<SnipeOrder> {
    return executionEngine.buyToken(tokenAddress, amountEth, walletId, options);
  }

  async manualSell(
    tokenAddress: string,
    amountOrPercent: string | number,
    walletId: string,
    options: {
      slippage?: number;
      isPercent?: boolean;
    } = {}
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    return executionEngine.sellToken(tokenAddress, amountOrPercent, walletId, options);
  }

  // ==========================================================================
  // PENDING SNIPES
  // ==========================================================================

  getPendingSnipes(): NewPairEvent[] {
    return Array.from(this.pendingSnipes.values());
  }

  approvePendingSnipe(pairAddress: string): void {
    const event = this.pendingSnipes.get(pairAddress);
    if (event) {
      this.pendingSnipes.delete(pairAddress);
      
      const weth = config.contracts.weth.toLowerCase();
      const targetToken = event.token0.toLowerCase() === weth ? event.token1 : event.token0;
      
      this.processNewToken(targetToken, pairAddress, event.dex, event);
    }
  }

  rejectPendingSnipe(pairAddress: string): void {
    this.pendingSnipes.delete(pairAddress);
  }

  // ==========================================================================
  // STATISTICS & STATUS
  // ==========================================================================

  getStats(): SniperStats {
    return { ...this.stats };
  }

  getStatus(): {
    running: boolean;
    autoSnipe: boolean;
    mempoolConnected: boolean;
    pendingSnipes: number;
    openPositions: number;
    trackedWallets: number;
  } {
    return {
      running: this.isRunning,
      autoSnipe: this.autoSnipeEnabled,
      mempoolConnected: mempoolMonitor.isRunning(),
      pendingSnipes: this.pendingSnipes.size,
      openPositions: executionEngine.getOpenPositions().length,
      trackedWallets: whaleTracker.getAllTrackedWallets().length
    };
  }

  // ==========================================================================
  // ALERTS
  // ==========================================================================

  private emitAlert(partial: Omit<SniperEvent, 'id' | 'timestamp'>): void {
    const event: SniperEvent = {
      id: generateId(),
      ...partial,
      timestamp: Date.now()
    };
    this.emit('alert', event);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const sniperCore = new SniperCore();
