// ============================================================================
// APEX SNIPER - Enhanced Whale Intelligence
// Advanced whale wallet analysis, clustering, and copy trading intelligence
// ============================================================================

import EventEmitter from 'eventemitter3';
import { ethers, JsonRpcProvider, Contract } from 'ethers';
import NodeCache from 'node-cache';
import { TrackedWallet, WhaleTransaction, TokenInfo } from '../types';
import { config } from '../config';
import { logger, checksumAddress, formatEther, generateId } from '../utils';

// ============================================================================
// TYPES
// ============================================================================

export interface WalletProfile {
  address: string;
  label: string;
  type: 'WHALE' | 'SMART_MONEY' | 'INFLUENCER' | 'INSIDER' | 'MARKET_MAKER' | 'SNIPER' | 'UNKNOWN';
  
  // Performance metrics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  avgROI: number;
  avgHoldTime: number;          // hours
  
  // Trading style
  tradingStyle: TradingStyle;
  preferredTokenTypes: string[];
  avgPositionSize: number;
  maxPositionSize: number;
  
  // Network
  relatedWallets: WalletRelation[];
  clusterIds: string[];
  
  // Reputation
  reputationScore: number;      // 0-100
  trustLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  isVerified: boolean;
  
  // Activity
  firstSeen: number;
  lastActive: number;
  activityScore: number;        // How active recently
  
  // Historical trades
  recentTrades: CompletedTrade[];
  bestTrade: CompletedTrade | null;
  worstTrade: CompletedTrade | null;
}

export interface TradingStyle {
  category: 'MOMENTUM' | 'VALUE' | 'SCALPER' | 'HOLDER' | 'MIXED';
  avgEntryTiming: 'EARLY' | 'MID' | 'LATE';
  prefersDips: boolean;
  prefersNewLaunches: boolean;
  usesStopLoss: boolean;
  takesProfitEarly: boolean;
}

export interface WalletRelation {
  address: string;
  label?: string;
  relationType: 'FUNDING' | 'COORDINATION' | 'SIMILAR_TRADES' | 'SAME_ENTITY';
  confidence: number;
  evidence: string;
}

export interface WalletCluster {
  id: string;
  name: string;
  wallets: string[];
  type: 'COORDINATED' | 'FAMILY' | 'DAO' | 'MARKET_MAKER' | 'UNKNOWN';
  combinedStats: {
    totalTrades: number;
    winRate: number;
    avgROI: number;
  };
  discoveredAt: number;
}

export interface CompletedTrade {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  entryTxHash: string;
  exitTxHash?: string;
  entryPrice: number;
  exitPrice?: number;
  entryAmount: bigint;
  exitAmount?: bigint;
  pnl: number;
  pnlPercent: number;
  holdTime: number;             // seconds
  entryTimestamp: number;
  exitTimestamp?: number;
  status: 'OPEN' | 'CLOSED' | 'LIQUIDATED';
}

export interface CopyTradeSignal {
  id: string;
  walletAddress: string;
  walletLabel: string;
  walletReputation: number;
  
  // Trade info
  tokenAddress: string;
  tokenSymbol: string;
  action: 'BUY' | 'SELL';
  amount: bigint;
  valueUSD: number;
  
  // Signal strength
  signalStrength: 'STRONG' | 'MODERATE' | 'WEAK';
  confidence: number;
  
  // Context
  isFirstBuy: boolean;
  isAccumulating: boolean;
  positionSize: number;         // % of wallet value
  otherWhalesBuying: number;
  
  // Recommendation
  recommendedAction: 'FOLLOW' | 'WATCH' | 'IGNORE';
  suggestedAmount: number;      // ETH
  maxDelay: number;             // blocks to follow within
  
  timestamp: number;
}

export interface CoordinatedActivity {
  id: string;
  type: 'COORDINATED_BUY' | 'COORDINATED_SELL' | 'PUMP_PATTERN' | 'DUMP_PATTERN';
  tokenAddress: string;
  tokenSymbol: string;
  participatingWallets: string[];
  totalValue: number;
  timeWindow: number;           // seconds
  confidence: number;
  isWarning: boolean;
  message: string;
  timestamp: number;
}

// ============================================================================
// EVENTS
// ============================================================================

export interface WhaleIntelligenceEvents {
  'profile:updated': (profile: WalletProfile) => void;
  'cluster:discovered': (cluster: WalletCluster) => void;
  'copySignal:generated': (signal: CopyTradeSignal) => void;
  'coordination:detected': (activity: CoordinatedActivity) => void;
  'whale:newPosition': (wallet: string, token: string, amount: bigint) => void;
  'whale:exitPosition': (wallet: string, token: string, pnl: number) => void;
}

// ============================================================================
// WHALE INTELLIGENCE SERVICE
// ============================================================================

export class WhaleIntelligenceService extends EventEmitter<WhaleIntelligenceEvents> {
  private provider: JsonRpcProvider;
  private cache: NodeCache;
  
  // Data stores
  private walletProfiles: Map<string, WalletProfile> = new Map();
  private walletClusters: Map<string, WalletCluster> = new Map();
  private pendingTrades: Map<string, Map<string, CompletedTrade>> = new Map(); // wallet -> token -> trade
  private recentTransactions: WhaleTransaction[] = [];
  
  // Coordination detection
  private recentBuys: Map<string, { wallet: string; timestamp: number; amount: bigint }[]> = new Map();
  private recentSells: Map<string, { wallet: string; timestamp: number; amount: bigint }[]> = new Map();
  
  // Monitoring
  private isRunning: boolean = false;
  private analysisInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.provider = new JsonRpcProvider(config.rpcUrl);
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  start(): void {
    if (this.isRunning) return;
    
    logger.info('[WhaleIntel] Starting whale intelligence service...');
    this.isRunning = true;
    
    // Periodic analysis
    this.analysisInterval = setInterval(() => {
      this.analyzeCoordinatedActivity();
      this.updateWalletScores();
      this.cleanupOldData();
    }, 60000); // Every minute
    
    logger.info('[WhaleIntel] Whale intelligence service started');
  }

  stop(): void {
    this.isRunning = false;
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    
    logger.info('[WhaleIntel] Whale intelligence service stopped');
  }

  // ==========================================================================
  // WALLET PROFILING
  // ==========================================================================

  async analyzeWallet(address: string): Promise<WalletProfile> {
    const normalized = address.toLowerCase();
    
    // Check cache
    const existing = this.walletProfiles.get(normalized);
    if (existing && Date.now() - existing.lastActive < 300000) {
      return existing;
    }
    
    logger.info(`[WhaleIntel] Analyzing wallet: ${address}`);
    
    // Build profile from on-chain data
    const profile = await this.buildWalletProfile(normalized);
    
    // Find related wallets
    profile.relatedWallets = await this.findRelatedWallets(normalized);
    
    // Calculate reputation
    profile.reputationScore = this.calculateReputation(profile);
    profile.trustLevel = this.assessTrustLevel(profile);
    
    this.walletProfiles.set(normalized, profile);
    this.emit('profile:updated', profile);
    
    return profile;
  }

  private async buildWalletProfile(address: string): Promise<WalletProfile> {
    const existing = this.walletProfiles.get(address);
    
    // Get historical trades from our records or start fresh
    const recentTrades = existing?.recentTrades || [];
    
    // Calculate trading style
    const tradingStyle = this.analyzeTradingStyle(recentTrades);
    
    // Calculate performance metrics
    const winningTrades = recentTrades.filter(t => t.pnl > 0).length;
    const losingTrades = recentTrades.filter(t => t.pnl < 0).length;
    const totalPnL = recentTrades.reduce((sum, t) => sum + t.pnl, 0);
    const avgROI = recentTrades.length > 0
      ? recentTrades.reduce((sum, t) => sum + t.pnlPercent, 0) / recentTrades.length
      : 0;
    const avgHoldTime = recentTrades.length > 0
      ? recentTrades.reduce((sum, t) => sum + t.holdTime, 0) / recentTrades.length / 3600
      : 0;
    
    return {
      address: checksumAddress(address),
      label: existing?.label || `Wallet ${address.slice(0, 8)}`,
      type: existing?.type || 'UNKNOWN',
      
      totalTrades: recentTrades.length,
      winningTrades,
      losingTrades,
      winRate: recentTrades.length > 0 ? (winningTrades / recentTrades.length) * 100 : 0,
      totalPnL,
      avgROI,
      avgHoldTime,
      
      tradingStyle,
      preferredTokenTypes: this.analyzePreferredTokens(recentTrades),
      avgPositionSize: this.calculateAvgPosition(recentTrades),
      maxPositionSize: this.calculateMaxPosition(recentTrades),
      
      relatedWallets: existing?.relatedWallets || [],
      clusterIds: existing?.clusterIds || [],
      
      reputationScore: existing?.reputationScore || 50,
      trustLevel: existing?.trustLevel || 'UNKNOWN',
      isVerified: existing?.isVerified || false,
      
      firstSeen: existing?.firstSeen || Date.now(),
      lastActive: Date.now(),
      activityScore: this.calculateActivityScore(recentTrades),
      
      recentTrades: recentTrades.slice(-50),
      bestTrade: this.findBestTrade(recentTrades),
      worstTrade: this.findWorstTrade(recentTrades)
    };
  }

  private analyzeTradingStyle(trades: CompletedTrade[]): TradingStyle {
    if (trades.length === 0) {
      return {
        category: 'MIXED',
        avgEntryTiming: 'MID',
        prefersDips: false,
        prefersNewLaunches: false,
        usesStopLoss: false,
        takesProfitEarly: false
      };
    }
    
    // Analyze hold times
    const avgHoldTime = trades.reduce((sum, t) => sum + t.holdTime, 0) / trades.length;
    const isScalper = avgHoldTime < 3600; // Less than 1 hour
    const isHolder = avgHoldTime > 86400; // More than 1 day
    
    // Analyze profit taking
    const profitableTrades = trades.filter(t => t.pnl > 0);
    const avgProfitPercent = profitableTrades.length > 0
      ? profitableTrades.reduce((sum, t) => sum + t.pnlPercent, 0) / profitableTrades.length
      : 0;
    const takesProfitEarly = avgProfitPercent < 30;
    
    // Analyze stop losses
    const lossTrades = trades.filter(t => t.pnl < 0);
    const avgLossPercent = lossTrades.length > 0
      ? Math.abs(lossTrades.reduce((sum, t) => sum + t.pnlPercent, 0) / lossTrades.length)
      : 0;
    const usesStopLoss = avgLossPercent < 25;
    
    let category: TradingStyle['category'];
    if (isScalper) category = 'SCALPER';
    else if (isHolder) category = 'HOLDER';
    else if (avgProfitPercent > 50) category = 'MOMENTUM';
    else category = 'MIXED';
    
    return {
      category,
      avgEntryTiming: 'MID', // Would need more data
      prefersDips: false,    // Would need price context
      prefersNewLaunches: false, // Would need token age data
      usesStopLoss,
      takesProfitEarly
    };
  }

  private analyzePreferredTokens(trades: CompletedTrade[]): string[] {
    // Count token occurrences
    const tokenCounts = new Map<string, number>();
    for (const trade of trades) {
      const count = tokenCounts.get(trade.tokenSymbol) || 0;
      tokenCounts.set(trade.tokenSymbol, count + 1);
    }
    
    // Sort by frequency
    return Array.from(tokenCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symbol]) => symbol);
  }

  private calculateAvgPosition(trades: CompletedTrade[]): number {
    if (trades.length === 0) return 0;
    // Would calculate in ETH - placeholder
    return 0.5;
  }

  private calculateMaxPosition(trades: CompletedTrade[]): number {
    if (trades.length === 0) return 0;
    return 2;
  }

  private calculateActivityScore(trades: CompletedTrade[]): number {
    const now = Date.now();
    const dayAgo = now - 86400000;
    const weekAgo = now - 604800000;
    
    const tradesDay = trades.filter(t => t.entryTimestamp > dayAgo).length;
    const tradesWeek = trades.filter(t => t.entryTimestamp > weekAgo).length;
    
    return Math.min(100, tradesDay * 20 + tradesWeek * 5);
  }

  private findBestTrade(trades: CompletedTrade[]): CompletedTrade | null {
    if (trades.length === 0) return null;
    return trades.reduce((best, t) => t.pnl > (best?.pnl || -Infinity) ? t : best, trades[0]);
  }

  private findWorstTrade(trades: CompletedTrade[]): CompletedTrade | null {
    if (trades.length === 0) return null;
    return trades.reduce((worst, t) => t.pnl < (worst?.pnl || Infinity) ? t : worst, trades[0]);
  }

  // ==========================================================================
  // WALLET RELATIONSHIPS & CLUSTERING
  // ==========================================================================

  private async findRelatedWallets(address: string): Promise<WalletRelation[]> {
    const relations: WalletRelation[] = [];
    
    // Check funding sources (would query on-chain)
    // Check similar trading patterns
    // Check coordination patterns
    
    // For demo, check if we have any clusters with this wallet
    for (const cluster of this.walletClusters.values()) {
      if (cluster.wallets.includes(address)) {
        for (const other of cluster.wallets) {
          if (other !== address) {
            relations.push({
              address: other,
              relationType: 'COORDINATION',
              confidence: 0.8,
              evidence: `Same cluster: ${cluster.name}`
            });
          }
        }
      }
    }
    
    return relations;
  }

  discoverCluster(wallets: string[], type: WalletCluster['type'], name?: string): WalletCluster {
    const cluster: WalletCluster = {
      id: generateId(),
      name: name || `Cluster ${wallets[0].slice(0, 8)}`,
      wallets: wallets.map(w => w.toLowerCase()),
      type,
      combinedStats: this.calculateClusterStats(wallets),
      discoveredAt: Date.now()
    };
    
    this.walletClusters.set(cluster.id, cluster);
    
    // Update wallet profiles with cluster membership
    for (const wallet of wallets) {
      const profile = this.walletProfiles.get(wallet.toLowerCase());
      if (profile) {
        if (!profile.clusterIds.includes(cluster.id)) {
          profile.clusterIds.push(cluster.id);
        }
      }
    }
    
    this.emit('cluster:discovered', cluster);
    logger.info(`[WhaleIntel] Discovered wallet cluster: ${cluster.name} with ${wallets.length} wallets`);
    
    return cluster;
  }

  private calculateClusterStats(wallets: string[]): WalletCluster['combinedStats'] {
    let totalTrades = 0;
    let totalWins = 0;
    let totalROI = 0;
    let count = 0;
    
    for (const wallet of wallets) {
      const profile = this.walletProfiles.get(wallet.toLowerCase());
      if (profile) {
        totalTrades += profile.totalTrades;
        totalWins += profile.winningTrades;
        totalROI += profile.avgROI;
        count++;
      }
    }
    
    return {
      totalTrades,
      winRate: totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0,
      avgROI: count > 0 ? totalROI / count : 0
    };
  }

  // ==========================================================================
  // COPY TRADE SIGNALS
  // ==========================================================================

  generateCopySignal(
    walletAddress: string,
    tokenAddress: string,
    action: 'BUY' | 'SELL',
    amount: bigint,
    valueUSD: number
  ): CopyTradeSignal | null {
    const profile = this.walletProfiles.get(walletAddress.toLowerCase());
    
    if (!profile || profile.reputationScore < 50) {
      return null;
    }
    
    // Check if other whales are also buying
    const recentBuysForToken = this.recentBuys.get(tokenAddress.toLowerCase()) || [];
    const otherWhalesBuying = recentBuysForToken.filter(
      b => b.wallet !== walletAddress.toLowerCase() && 
           Date.now() - b.timestamp < 300000 // Last 5 minutes
    ).length;
    
    // Calculate signal strength
    let strength: CopyTradeSignal['signalStrength'];
    let confidence = 0.5;
    
    if (profile.reputationScore >= 80 && profile.winRate >= 60) {
      strength = 'STRONG';
      confidence = 0.8;
    } else if (profile.reputationScore >= 60 && profile.winRate >= 50) {
      strength = 'MODERATE';
      confidence = 0.6;
    } else {
      strength = 'WEAK';
      confidence = 0.4;
    }
    
    // Adjust for other whale activity
    if (otherWhalesBuying >= 2) {
      confidence = Math.min(0.95, confidence + 0.15);
    }
    
    // Determine recommended action
    let recommendedAction: CopyTradeSignal['recommendedAction'];
    let suggestedAmount: number;
    
    if (strength === 'STRONG' && action === 'BUY') {
      recommendedAction = 'FOLLOW';
      suggestedAmount = 0.5;
    } else if (strength === 'MODERATE' && action === 'BUY') {
      recommendedAction = 'WATCH';
      suggestedAmount = 0.2;
    } else {
      recommendedAction = 'IGNORE';
      suggestedAmount = 0;
    }
    
    // Check if first buy for this wallet
    const walletTrades = this.pendingTrades.get(walletAddress.toLowerCase());
    const isFirstBuy = !walletTrades?.has(tokenAddress.toLowerCase());
    
    // Check accumulation
    const previousBuys = recentBuysForToken.filter(
      b => b.wallet === walletAddress.toLowerCase()
    ).length;
    const isAccumulating = previousBuys > 0;
    
    const signal: CopyTradeSignal = {
      id: generateId(),
      walletAddress: checksumAddress(walletAddress),
      walletLabel: profile.label,
      walletReputation: profile.reputationScore,
      
      tokenAddress: checksumAddress(tokenAddress),
      tokenSymbol: 'UNKNOWN', // Would fetch
      action,
      amount,
      valueUSD,
      
      signalStrength: strength,
      confidence,
      
      isFirstBuy,
      isAccumulating,
      positionSize: 0, // Would calculate
      otherWhalesBuying,
      
      recommendedAction,
      suggestedAmount,
      maxDelay: strength === 'STRONG' ? 3 : 10,
      
      timestamp: Date.now()
    };
    
    this.emit('copySignal:generated', signal);
    
    return signal;
  }

  // ==========================================================================
  // COORDINATION DETECTION
  // ==========================================================================

  recordTransaction(tx: WhaleTransaction): void {
    this.recentTransactions.push(tx);
    
    // Track for coordination detection
    const token = tx.token.toLowerCase();
    
    if (tx.type === 'BUY') {
      if (!this.recentBuys.has(token)) {
        this.recentBuys.set(token, []);
      }
      this.recentBuys.get(token)!.push({
        wallet: tx.walletAddress.toLowerCase(),
        timestamp: tx.timestamp,
        amount: tx.amount
      });
    } else if (tx.type === 'SELL') {
      if (!this.recentSells.has(token)) {
        this.recentSells.set(token, []);
      }
      this.recentSells.get(token)!.push({
        wallet: tx.walletAddress.toLowerCase(),
        timestamp: tx.timestamp,
        amount: tx.amount
      });
    }
    
    // Check for coordination
    this.checkCoordination(token);
  }

  private checkCoordination(tokenAddress: string): void {
    const buys = this.recentBuys.get(tokenAddress) || [];
    const sells = this.recentSells.get(tokenAddress) || [];
    
    const now = Date.now();
    const timeWindow = 300000; // 5 minutes
    
    // Recent buys
    const recentBuys = buys.filter(b => now - b.timestamp < timeWindow);
    const recentSells = sells.filter(s => now - s.timestamp < timeWindow);
    
    // Check for coordinated buying
    if (recentBuys.length >= 3) {
      const uniqueWallets = new Set(recentBuys.map(b => b.wallet));
      
      if (uniqueWallets.size >= 3) {
        const totalValue = recentBuys.reduce(
          (sum, b) => sum + Number(formatEther(b.amount)) * 2000,
          0
        );
        
        const activity: CoordinatedActivity = {
          id: generateId(),
          type: 'COORDINATED_BUY',
          tokenAddress,
          tokenSymbol: 'UNKNOWN',
          participatingWallets: Array.from(uniqueWallets),
          totalValue,
          timeWindow: timeWindow / 1000,
          confidence: Math.min(0.9, 0.5 + uniqueWallets.size * 0.1),
          isWarning: false,
          message: `${uniqueWallets.size} whales buying within ${timeWindow / 60000} minutes`,
          timestamp: now
        };
        
        this.emit('coordination:detected', activity);
        logger.info(`[WhaleIntel] Coordinated buying detected: ${activity.message}`);
      }
    }
    
    // Check for coordinated selling (potential dump)
    if (recentSells.length >= 3) {
      const uniqueWallets = new Set(recentSells.map(s => s.wallet));
      
      if (uniqueWallets.size >= 3) {
        const totalValue = recentSells.reduce(
          (sum, s) => sum + Number(formatEther(s.amount)) * 2000,
          0
        );
        
        const activity: CoordinatedActivity = {
          id: generateId(),
          type: 'COORDINATED_SELL',
          tokenAddress,
          tokenSymbol: 'UNKNOWN',
          participatingWallets: Array.from(uniqueWallets),
          totalValue,
          timeWindow: timeWindow / 1000,
          confidence: Math.min(0.9, 0.5 + uniqueWallets.size * 0.1),
          isWarning: true,
          message: `⚠️ ${uniqueWallets.size} whales selling within ${timeWindow / 60000} minutes`,
          timestamp: now
        };
        
        this.emit('coordination:detected', activity);
        logger.warn(`[WhaleIntel] Coordinated selling detected: ${activity.message}`);
      }
    }
  }

  private analyzeCoordinatedActivity(): void {
    // Clean up old data
    const now = Date.now();
    const cutoff = now - 600000; // 10 minutes
    
    for (const [token, buys] of this.recentBuys) {
      const filtered = buys.filter(b => b.timestamp > cutoff);
      if (filtered.length === 0) {
        this.recentBuys.delete(token);
      } else {
        this.recentBuys.set(token, filtered);
      }
    }
    
    for (const [token, sells] of this.recentSells) {
      const filtered = sells.filter(s => s.timestamp > cutoff);
      if (filtered.length === 0) {
        this.recentSells.delete(token);
      } else {
        this.recentSells.set(token, filtered);
      }
    }
  }

  // ==========================================================================
  // REPUTATION & TRUST
  // ==========================================================================

  private calculateReputation(profile: WalletProfile): number {
    let score = 50; // Base score
    
    // Win rate contribution (max 20)
    score += Math.min(20, (profile.winRate - 50) * 0.4);
    
    // Trade count contribution (max 15)
    score += Math.min(15, profile.totalTrades * 0.3);
    
    // ROI contribution (max 15)
    score += Math.min(15, profile.avgROI * 0.1);
    
    // Cluster membership (established wallets)
    if (profile.clusterIds.length > 0) {
      score += 5;
    }
    
    // Activity score (max 10)
    score += Math.min(10, profile.activityScore * 0.1);
    
    // Penalties
    if (profile.totalTrades < 5) score -= 10;
    if (profile.winRate < 30) score -= 20;
    if (profile.avgROI < -20) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }

  private assessTrustLevel(profile: WalletProfile): WalletProfile['trustLevel'] {
    if (profile.isVerified) return 'HIGH';
    if (profile.reputationScore >= 80) return 'HIGH';
    if (profile.reputationScore >= 60) return 'MEDIUM';
    if (profile.reputationScore >= 40) return 'LOW';
    return 'UNKNOWN';
  }

  private updateWalletScores(): void {
    for (const [address, profile] of this.walletProfiles) {
      profile.reputationScore = this.calculateReputation(profile);
      profile.trustLevel = this.assessTrustLevel(profile);
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  private cleanupOldData(): void {
    const now = Date.now();
    const hourAgo = now - 3600000;
    
    // Clean up old transactions
    this.recentTransactions = this.recentTransactions.filter(
      tx => tx.timestamp > hourAgo
    );
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  getWalletProfile(address: string): WalletProfile | undefined {
    return this.walletProfiles.get(address.toLowerCase());
  }

  getAllProfiles(): WalletProfile[] {
    return Array.from(this.walletProfiles.values());
  }

  getTopPerformers(limit: number = 10): WalletProfile[] {
    return this.getAllProfiles()
      .sort((a, b) => b.reputationScore - a.reputationScore)
      .slice(0, limit);
  }

  getClusters(): WalletCluster[] {
    return Array.from(this.walletClusters.values());
  }

  getCluster(id: string): WalletCluster | undefined {
    return this.walletClusters.get(id);
  }

  getRecentTransactions(limit: number = 50): WhaleTransaction[] {
    return this.recentTransactions.slice(-limit).reverse();
  }

  setWalletLabel(address: string, label: string): void {
    const profile = this.walletProfiles.get(address.toLowerCase());
    if (profile) {
      profile.label = label;
    }
  }

  setWalletType(address: string, type: WalletProfile['type']): void {
    const profile = this.walletProfiles.get(address.toLowerCase());
    if (profile) {
      profile.type = type;
    }
  }

  verifyWallet(address: string): void {
    const profile = this.walletProfiles.get(address.toLowerCase());
    if (profile) {
      profile.isVerified = true;
      profile.trustLevel = 'HIGH';
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const whaleIntelligence = new WhaleIntelligenceService();
