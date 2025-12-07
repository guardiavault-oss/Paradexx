// ============================================================================
// APEX SNIPER - Meme Hunter Engine
// Main aggregator that coordinates social scanning, on-chain analysis, 
// AI scoring, and alert generation for meme token discovery
// ============================================================================

import EventEmitter from 'eventemitter3';
import NodeCache from 'node-cache';
import {
  MemeHunterConfig,
  MemeHunterToken,
  MemeHunterAlert,
  MemeHunterStats,
  MemeScore,
  MemeAlertTier,
  SocialSignals,
  OnChainSignals,
  SocialMention,
  SmartWallet,
  DEX,
  NewPairEvent
} from '../types';
import { config as appConfig } from '../config';
import { logger, generateId, checksumAddress } from '../utils';
import { SocialScanner, createSocialScanner } from './SocialScanner';
import { OnChainScanner, createOnChainScanner } from './OnChainScanner';
import { AIScoringEngine, createScoringEngine } from './AIScoringEngine';
import { tokenAnalyzer } from './TokenAnalyzer';
import { executionEngine } from './ExecutionEngine';

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: MemeHunterConfig = {
  enabled: true,
  
  // Social monitoring
  socialEnabled: true,
  twitterEnabled: true,
  redditEnabled: true,
  telegramEnabled: false,
  discordEnabled: false,
  
  // On-chain monitoring
  onChainEnabled: true,
  minLiquidityUSD: 5000,
  maxContractAge: 168, // 7 days in hours
  
  // Scoring thresholds
  minScoreForAlert: 60,
  minConfidence: 0.5,
  
  // Alert tiers
  instantAlertThreshold: 95,
  fastAlertThreshold: 80,
  researchAlertThreshold: 60,
  
  // Auto-buy settings
  autoBuyEnabled: false,
  autoBuyMinScore: 90,
  autoBuyAmount: '0.1',
  autoBuyWalletId: undefined,
  
  // Filters
  tokenBlacklist: [],
  deployerBlacklist: [],
  minSocialMentions: 3,
  maxSellTax: 15,
  maxBuyTax: 10,
  requireLPLock: false,
  requireVerified: false,
  
  // Rate limiting
  maxAlertsPerHour: 20,
  cooldownBetweenAlerts: 60000 // 1 minute
};

// ============================================================================
// EVENTS
// ============================================================================

export interface MemeHunterEvents {
  'token:discovered': (token: MemeHunterToken) => void;
  'token:updated': (token: MemeHunterToken) => void;
  'alert:created': (alert: MemeHunterAlert) => void;
  'autoBuy:triggered': (alert: MemeHunterAlert, orderId: string) => void;
  'autoBuy:failed': (alert: MemeHunterAlert, error: string) => void;
  'stats:updated': (stats: MemeHunterStats) => void;
}

// ============================================================================
// MEME HUNTER ENGINE
// ============================================================================

export class MemeHunterEngine extends EventEmitter<MemeHunterEvents> {
  private config: MemeHunterConfig;
  private isRunning: boolean = false;
  
  // Core services
  private socialScanner: SocialScanner;
  private onChainScanner: OnChainScanner;
  private scoringEngine: AIScoringEngine;
  
  // Data stores
  private discoveredTokens: Map<string, MemeHunterToken> = new Map();
  private alerts: Map<string, MemeHunterAlert> = new Map();
  private alertHistory: MemeHunterAlert[] = [];
  
  // Rate limiting
  private alertCounts: { hour: number; lastReset: number } = { hour: 0, lastReset: Date.now() };
  private lastAlertTime: Map<string, number> = new Map();
  
  // Stats
  private stats: MemeHunterStats;
  
  // Update interval
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(customConfig?: Partial<MemeHunterConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
    
    // Initialize services
    this.socialScanner = createSocialScanner(this.config);
    this.onChainScanner = createOnChainScanner(this.config);
    this.scoringEngine = createScoringEngine(this.config);
    
    // Initialize stats
    this.stats = this.initializeStats();
    
    // Set up event handlers
    this.setupEventHandlers();
  }

  private initializeStats(): MemeHunterStats {
    return {
      totalTokensScanned: 0,
      totalAlertsSent: 0,
      alertsByTier: { instant: 0, fast: 0, research: 0 },
      tokensAutoBought: 0,
      profitableAlerts: 0,
      unprofitableAlerts: 0,
      avgPnLPerAlert: 0,
      bestPerformingToken: null,
      socialMentionsTracked: 0,
      influencersMonitored: 0,
      newPairsAnalyzed: 0,
      smartWalletsTracked: 0,
      lastUpdated: Date.now()
    };
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('[MemeHunter] Already running');
      return;
    }

    logger.info('╔════════════════════════════════════════╗');
    logger.info('║       MEME HUNTER ENGINE - Starting    ║');
    logger.info('╚════════════════════════════════════════╝');

    this.isRunning = true;

    try {
      // Start social scanner
      if (this.config.socialEnabled) {
        await this.socialScanner.start();
        logger.info('[MemeHunter] ✓ Social Scanner started');
      }

      // Start on-chain scanner
      if (this.config.onChainEnabled) {
        await this.onChainScanner.start();
        logger.info('[MemeHunter] ✓ On-Chain Scanner started');
      }

      // Start periodic token updates
      this.startPeriodicUpdates();
      logger.info('[MemeHunter] ✓ Periodic updates started');

      logger.info('╔════════════════════════════════════════╗');
      logger.info('║    MEME HUNTER ENGINE - Ready! 🎯      ║');
      logger.info('║                                        ║');
      logger.info('║    Hunting for the next 100x gem...    ║');
      logger.info('╚════════════════════════════════════════╝');

    } catch (error) {
      logger.error('[MemeHunter] Failed to start:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    logger.info('[MemeHunter] Stopping Meme Hunter Engine...');
    
    this.isRunning = false;

    // Stop periodic updates
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Stop services
    await this.socialScanner.stop();
    await this.onChainScanner.stop();

    logger.info('[MemeHunter] Meme Hunter Engine stopped');
  }

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  private setupEventHandlers(): void {
    // Social Scanner events
    this.socialScanner.on('mention:detected', (mention) => {
      this.handleSocialMention(mention);
    });

    this.socialScanner.on('spike:detected', (address, spike) => {
      logger.info(`[MemeHunter] Social spike for ${address}: ${spike.toFixed(0)}%`);
      this.processToken(address, 'SOCIAL');
    });

    this.socialScanner.on('influencer:mentioned', (mention, tier) => {
      logger.info(`[MemeHunter] ${tier} influencer mentioned ${mention.contractAddress}`);
      if (mention.contractAddress) {
        this.processToken(mention.contractAddress, 'SOCIAL');
      }
    });

    // On-Chain Scanner events
    this.onChainScanner.on('pair:created', (event) => {
      this.handleNewPair(event);
    });

    this.onChainScanner.on('smartMoney:buy', (wallet, token, amount) => {
      logger.info(`[MemeHunter] Smart money ${wallet.label} bought ${token}`);
      this.processToken(token, 'WHALE');
    });

    this.onChainScanner.on('holder:spike', (token, count, growth) => {
      logger.info(`[MemeHunter] Holder spike for ${token}: ${growth.toFixed(0)}%`);
      this.processToken(token, 'ONCHAIN');
    });

    this.onChainScanner.on('volume:spike', (token, volume, growth) => {
      logger.info(`[MemeHunter] Volume spike for ${token}: ${growth.toFixed(0)}%`);
      this.processToken(token, 'ONCHAIN');
    });

    // Scoring Engine events
    this.scoringEngine.on('tier:upgraded', (address, oldTier, newTier) => {
      const token = this.discoveredTokens.get(address.toLowerCase());
      if (token) {
        this.checkAndCreateAlert(token);
      }
    });
  }

  // ==========================================================================
  // TOKEN PROCESSING
  // ==========================================================================

  private async handleSocialMention(mention: SocialMention): Promise<void> {
    this.stats.socialMentionsTracked++;
    
    if (!mention.contractAddress) return;
    
    // Check if this token has enough mentions
    const signals = this.socialScanner.getSocialSignals(mention.contractAddress);
    
    if (signals.mentionCount >= this.config.minSocialMentions) {
      await this.processToken(mention.contractAddress, 'SOCIAL');
    }
  }

  private async handleNewPair(event: NewPairEvent): Promise<void> {
    this.stats.newPairsAnalyzed++;
    
    // Determine which token is the new one (not WETH)
    const weth = appConfig.contracts.weth;
    const newToken = event.token0.toLowerCase() === weth.toLowerCase() 
      ? event.token1 
      : event.token0;
    
    // Check if deployer is blacklisted
    if (this.config.deployerBlacklist.includes(event.deployer.toLowerCase())) {
      logger.debug(`[MemeHunter] Skipping token from blacklisted deployer: ${event.deployer}`);
      return;
    }
    
    await this.processToken(newToken, 'ONCHAIN', event);
  }

  private async processToken(
    tokenAddress: string,
    source: 'SOCIAL' | 'ONCHAIN' | 'WHALE' | 'DEPLOYER',
    pairEvent?: NewPairEvent
  ): Promise<void> {
    const address = tokenAddress.toLowerCase();
    
    // Check blacklist
    if (this.config.tokenBlacklist.includes(address)) {
      logger.debug(`[MemeHunter] Skipping blacklisted token: ${tokenAddress}`);
      return;
    }
    
    this.stats.totalTokensScanned++;
    
    try {
      // Get social signals
      const socialSignals = this.socialScanner.getSocialSignals(tokenAddress);
      
      // Get on-chain signals
      let onChainSignals = this.onChainScanner.getCachedSignals(tokenAddress);
      if (!onChainSignals) {
        onChainSignals = await this.onChainScanner.getOnChainSignals(
          tokenAddress,
          pairEvent?.pair
        );
      }
      
      // Apply filters
      if (!this.passesFilters(onChainSignals)) {
        return;
      }
      
      // Calculate score
      const score = this.scoringEngine.calculateScore(
        tokenAddress,
        socialSignals,
        onChainSignals
      );
      
      // Create or update token
      const token = await this.createOrUpdateToken(
        tokenAddress,
        socialSignals,
        onChainSignals,
        score,
        source,
        pairEvent
      );
      
      // Check if alert should be created
      this.checkAndCreateAlert(token);
      
    } catch (error) {
      logger.error(`[MemeHunter] Error processing token ${tokenAddress}:`, error);
    }
  }

  private passesFilters(signals: OnChainSignals): boolean {
    // Minimum liquidity check
    if (signals.liquidityUSD < this.config.minLiquidityUSD) {
      return false;
    }
    
    // Tax checks
    if (signals.buyTax > this.config.maxBuyTax) {
      return false;
    }
    if (signals.sellTax > this.config.maxSellTax) {
      return false;
    }
    
    // LP lock check
    if (this.config.requireLPLock && !signals.lpLocked) {
      return false;
    }
    
    // Verification check
    if (this.config.requireVerified && !signals.isVerified) {
      return false;
    }
    
    // Honeypot check
    if (signals.hasHoneypot) {
      return false;
    }
    
    // Contract age check
    if (signals.contractAge > this.config.maxContractAge) {
      return false;
    }
    
    return true;
  }

  private async createOrUpdateToken(
    tokenAddress: string,
    socialSignals: SocialSignals,
    onChainSignals: OnChainSignals,
    score: MemeScore,
    source: 'SOCIAL' | 'ONCHAIN' | 'WHALE' | 'DEPLOYER',
    pairEvent?: NewPairEvent
  ): Promise<MemeHunterToken> {
    const address = tokenAddress.toLowerCase();
    
    // Get existing token or create new
    const existingToken = this.discoveredTokens.get(address);
    const isNew = !existingToken;
    
    // Get token info for name/symbol
    const tokenInfo = await tokenAnalyzer.analyzeToken(tokenAddress);
    
    let token: MemeHunterToken;
    
    if (isNew) {
      token = {
        address: checksumAddress(tokenAddress),
        name: 'Unknown',
        symbol: 'UNKNOWN',
        pairAddress: pairEvent?.pair || '',
        dex: pairEvent?.dex || DEX.UNISWAP_V2,
        socialSignals,
        onChainSignals,
        memeScore: score,
        discoveredAt: Date.now(),
        discoverySource: source,
        dextoolsUrl: `https://www.dextools.io/app/ether/pair-explorer/${pairEvent?.pair || tokenAddress}`,
        dexscreenerUrl: `https://dexscreener.com/ethereum/${pairEvent?.pair || tokenAddress}`,
        isActive: true,
        lastUpdated: Date.now()
      };
      
      this.discoveredTokens.set(address, token);
      this.emit('token:discovered', token);
      
      logger.info(`[MemeHunter] New token discovered: ${token.symbol} (${tokenAddress})`);
    } else {
      // Update existing token
      token = existingToken;
      token.socialSignals = socialSignals;
      token.onChainSignals = onChainSignals;
      token.memeScore = score;
      token.lastUpdated = Date.now();
      
      this.emit('token:updated', token);
    }
    
    return token;
  }

  // ==========================================================================
  // ALERT SYSTEM
  // ==========================================================================

  private checkAndCreateAlert(token: MemeHunterToken): void {
    const score = token.memeScore;
    
    // Check if score meets threshold
    if (score.score < this.config.minScoreForAlert) {
      return;
    }
    
    if (score.confidence < this.config.minConfidence) {
      return;
    }
    
    // Check rate limiting
    if (!this.canSendAlert(token.address)) {
      return;
    }
    
    // Create alert
    const alert = this.createAlert(token);
    
    // Store alert
    this.alerts.set(alert.id, alert);
    this.alertHistory.push(alert);
    
    // Update stats
    this.updateAlertStats(alert);
    
    // Emit alert
    this.emit('alert:created', alert);
    
    logger.info(`[MemeHunter] 🚨 ALERT: ${token.symbol} | Score: ${score.score} | Tier: ${score.tier}`);
    
    // Check for auto-buy
    if (this.config.autoBuyEnabled && score.score >= this.config.autoBuyMinScore) {
      this.executeAutoBuy(alert);
    }
  }

  private canSendAlert(tokenAddress: string): boolean {
    const address = tokenAddress.toLowerCase();
    const now = Date.now();
    
    // Reset hourly count if needed
    if (now - this.alertCounts.lastReset > 3600000) {
      this.alertCounts = { hour: 0, lastReset: now };
    }
    
    // Check hourly limit
    if (this.alertCounts.hour >= this.config.maxAlertsPerHour) {
      return false;
    }
    
    // Check cooldown for this token
    const lastAlert = this.lastAlertTime.get(address);
    if (lastAlert && now - lastAlert < this.config.cooldownBetweenAlerts) {
      return false;
    }
    
    return true;
  }

  private createAlert(token: MemeHunterToken): MemeHunterAlert {
    const score = token.memeScore;
    
    // Build alert message
    const topSignals = score.topSignals.map(s => s.name);
    
    let title = '';
    let message = '';
    
    switch (score.tier) {
      case MemeAlertTier.INSTANT:
        title = `🔥 INSTANT ALERT: ${token.symbol}`;
        message = `High-confidence opportunity detected! Score: ${score.score}/100`;
        break;
      case MemeAlertTier.FAST:
        title = `⚡ FAST ALERT: ${token.symbol}`;
        message = `Strong signals detected. Score: ${score.score}/100`;
        break;
      case MemeAlertTier.RESEARCH:
        title = `📊 RESEARCH: ${token.symbol}`;
        message = `Worth watching. Score: ${score.score}/100`;
        break;
    }
    
    const alert: MemeHunterAlert = {
      id: generateId(),
      token,
      tier: score.tier,
      score: score.score,
      confidence: score.confidence,
      title,
      message,
      topSignals,
      autoBuyTriggered: false,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000 // 1 hour TTL
    };
    
    // Update rate limiting
    this.alertCounts.hour++;
    this.lastAlertTime.set(token.address.toLowerCase(), Date.now());
    
    return alert;
  }

  private updateAlertStats(alert: MemeHunterAlert): void {
    this.stats.totalAlertsSent++;
    
    switch (alert.tier) {
      case MemeAlertTier.INSTANT:
        this.stats.alertsByTier.instant++;
        break;
      case MemeAlertTier.FAST:
        this.stats.alertsByTier.fast++;
        break;
      case MemeAlertTier.RESEARCH:
        this.stats.alertsByTier.research++;
        break;
    }
    
    this.stats.lastUpdated = Date.now();
    this.emit('stats:updated', this.stats);
  }

  // ==========================================================================
  // AUTO-BUY
  // ==========================================================================

  private async executeAutoBuy(alert: MemeHunterAlert): Promise<void> {
    if (!this.config.autoBuyEnabled) return;
    if (!this.config.autoBuyWalletId) {
      logger.warn('[MemeHunter] Auto-buy enabled but no wallet configured');
      return;
    }
    
    logger.info(`[MemeHunter] Executing auto-buy for ${alert.token.symbol}`);
    
    try {
      // Run safety check first
      const safetyCheck = await tokenAnalyzer.quickSafetyCheck(alert.token.address);
      if (!safetyCheck.safe) {
        logger.warn(`[MemeHunter] Auto-buy aborted - safety check failed: ${safetyCheck.reason}`);
        this.emit('autoBuy:failed', alert, safetyCheck.reason || 'Safety check failed');
        return;
      }
      
      // Execute buy
      const order = await executionEngine.buyToken(
        alert.token.address,
        this.config.autoBuyAmount,
        this.config.autoBuyWalletId,
        {
          slippage: 15,
          safetyCheck: false // Already checked
        }
      );
      
      alert.autoBuyTriggered = true;
      alert.autoBuyOrderId = order.id;
      
      this.stats.tokensAutoBought++;
      
      this.emit('autoBuy:triggered', alert, order.id);
      
      logger.info(`[MemeHunter] Auto-buy executed: ${order.id}`);
      
    } catch (error) {
      const errorMsg = (error as Error).message;
      logger.error(`[MemeHunter] Auto-buy failed:`, error);
      this.emit('autoBuy:failed', alert, errorMsg);
    }
  }

  // ==========================================================================
  // PERIODIC UPDATES
  // ==========================================================================

  private startPeriodicUpdates(): void {
    // Update token scores every 2 minutes
    this.updateInterval = setInterval(() => {
      if (!this.isRunning) return;
      this.updateAllTokens();
    }, 120000);
    
    // Clean up expired alerts
    setInterval(() => {
      this.cleanupExpiredAlerts();
    }, 60000);
  }

  private async updateAllTokens(): Promise<void> {
    for (const [address, token] of this.discoveredTokens) {
      if (!token.isActive) continue;
      
      try {
        // Refresh signals and score
        const socialSignals = this.socialScanner.getSocialSignals(address);
        const onChainSignals = await this.onChainScanner.getOnChainSignals(address, token.pairAddress);
        const score = this.scoringEngine.calculateScore(address, socialSignals, onChainSignals);
        
        token.socialSignals = socialSignals;
        token.onChainSignals = onChainSignals;
        token.memeScore = score;
        token.lastUpdated = Date.now();
        
        this.emit('token:updated', token);
        
        // Check if should alert again (for tier upgrades)
        if (score.tier === MemeAlertTier.INSTANT) {
          this.checkAndCreateAlert(token);
        }
        
      } catch (error) {
        logger.debug(`[MemeHunter] Failed to update token ${address}`);
      }
    }
  }

  private cleanupExpiredAlerts(): void {
    const now = Date.now();
    
    for (const [id, alert] of this.alerts) {
      if (alert.expiresAt < now) {
        this.alerts.delete(id);
      }
    }
    
    // Keep only last 1000 alerts in history
    while (this.alertHistory.length > 1000) {
      this.alertHistory.shift();
    }
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  getConfig(): MemeHunterConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<MemeHunterConfig>): void {
    this.config = { ...this.config, ...updates };
    logger.info('[MemeHunter] Configuration updated');
  }

  getDiscoveredTokens(): MemeHunterToken[] {
    return Array.from(this.discoveredTokens.values())
      .sort((a, b) => b.memeScore.score - a.memeScore.score);
  }

  getToken(address: string): MemeHunterToken | undefined {
    return this.discoveredTokens.get(address.toLowerCase());
  }

  getActiveAlerts(): MemeHunterAlert[] {
    const now = Date.now();
    return Array.from(this.alerts.values())
      .filter(a => a.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getAlertHistory(limit: number = 100): MemeHunterAlert[] {
    return this.alertHistory.slice(-limit).reverse();
  }

  getStats(): MemeHunterStats {
    // Update live stats
    this.stats.smartWalletsTracked = this.onChainScanner.getSmartWallets().length;
    
    const socialStats = this.socialScanner.getStats();
    this.stats.socialMentionsTracked = socialStats.totalMentions;
    
    return { ...this.stats };
  }

  getTrendingTokens(limit: number = 10): MemeHunterToken[] {
    return this.getDiscoveredTokens()
      .filter(t => t.memeScore.score >= 50)
      .slice(0, limit);
  }

  getTopByTier(tier: MemeAlertTier, limit: number = 10): MemeHunterToken[] {
    return this.getDiscoveredTokens()
      .filter(t => t.memeScore.tier === tier)
      .slice(0, limit);
  }

  // Manually trigger analysis of a token
  async analyzeToken(tokenAddress: string): Promise<MemeHunterToken | null> {
    try {
      await this.processToken(tokenAddress, 'SOCIAL');
      return this.getToken(tokenAddress) || null;
    } catch (error) {
      logger.error(`[MemeHunter] Failed to analyze token ${tokenAddress}:`, error);
      return null;
    }
  }

  // Add to blacklist
  blacklistToken(address: string): void {
    const normalized = address.toLowerCase();
    if (!this.config.tokenBlacklist.includes(normalized)) {
      this.config.tokenBlacklist.push(normalized);
      
      // Remove from discovered tokens
      this.discoveredTokens.delete(normalized);
      
      logger.info(`[MemeHunter] Token blacklisted: ${address}`);
    }
  }

  blacklistDeployer(address: string): void {
    const normalized = address.toLowerCase();
    if (!this.config.deployerBlacklist.includes(normalized)) {
      this.config.deployerBlacklist.push(normalized);
      logger.info(`[MemeHunter] Deployer blacklisted: ${address}`);
    }
  }

  // Add smart wallet to tracking
  addSmartWallet(wallet: SmartWallet): void {
    this.onChainScanner.addSmartWallet(wallet);
  }

  getSmartWallets(): SmartWallet[] {
    return this.onChainScanner.getSmartWallets();
  }

  // Get social mentions
  getRecentMentions(tokenAddress?: string): SocialMention[] {
    return this.socialScanner.getRecentMentions(tokenAddress);
  }

  // Status
  isActive(): boolean {
    return this.isRunning;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const memeHunter = new MemeHunterEngine();

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createMemeHunter(config?: Partial<MemeHunterConfig>): MemeHunterEngine {
  return new MemeHunterEngine(config);
}
