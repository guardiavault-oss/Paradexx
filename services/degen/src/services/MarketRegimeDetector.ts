// ============================================================================
// APEX SNIPER - Market Regime Detector
// AI-powered market regime detection for adaptive trading strategies
// ============================================================================

import EventEmitter from 'eventemitter3';
import { ethers, JsonRpcProvider } from 'ethers';
import NodeCache from 'node-cache';
import { config } from '../config';
import { logger, formatEther } from '../utils';

// ============================================================================
// TYPES
// ============================================================================

export enum MarketRegime {
  TRENDING_UP = 'TRENDING_UP',
  TRENDING_DOWN = 'TRENDING_DOWN',
  RANGING = 'RANGING',
  VOLATILE = 'VOLATILE',
  ACCUMULATION = 'ACCUMULATION',
  DISTRIBUTION = 'DISTRIBUTION',
  CAPITULATION = 'CAPITULATION',
  EUPHORIA = 'EUPHORIA'
}

export interface RegimeAnalysis {
  currentRegime: MarketRegime;
  confidence: number;
  subRegime?: string;
  
  // Trend indicators
  trendStrength: number;         // -100 to 100
  trendDirection: 'up' | 'down' | 'neutral';
  trendDuration: number;         // blocks/hours
  
  // Volatility indicators
  volatility: number;            // 0-100
  volatilityChange: number;      // % change from baseline
  impliedVolatility: number;
  
  // Volume indicators
  volumeProfile: 'increasing' | 'decreasing' | 'stable';
  volumeSpike: boolean;
  relativeVolume: number;        // vs average
  
  // Momentum indicators
  momentum: number;              // -100 to 100
  momentumAccelerating: boolean;
  rsi: number;
  
  // Market breadth (for broader market)
  buyPressure: number;           // 0-100
  sellPressure: number;          // 0-100
  newPairsLaunched: number;      // 24h
  rugsPulled: number;            // 24h
  
  // Sentiment
  fearGreedIndex: number;        // 0-100
  socialSentiment: number;       // -1 to 1
  
  // Recommended actions
  recommendedAction: TradingRecommendation;
  
  timestamp: number;
}

export interface TradingRecommendation {
  action: 'aggressive' | 'normal' | 'cautious' | 'defensive' | 'paused';
  positionSizeMultiplier: number;
  maxPositions: number;
  preferredStrategies: string[];
  avoidStrategies: string[];
  stopLossMultiplier: number;
  takeProfitMultiplier: number;
  notes: string[];
}

export interface MarketData {
  timestamp: number;
  ethPrice: number;
  gasPrice: bigint;
  newPairs24h: number;
  totalVolume24h: number;
  avgBuyTax: number;
  avgSellTax: number;
}

// ============================================================================
// EVENTS
// ============================================================================

export interface RegimeDetectorEvents {
  'regime:changed': (oldRegime: MarketRegime, newRegime: MarketRegime, analysis: RegimeAnalysis) => void;
  'regime:updated': (analysis: RegimeAnalysis) => void;
  'volatility:spike': (current: number, threshold: number) => void;
  'opportunity:detected': (opportunity: MarketOpportunity) => void;
}

export interface MarketOpportunity {
  type: 'dip_buy' | 'breakout' | 'momentum' | 'reversal';
  confidence: number;
  message: string;
  suggestedAction: string;
  timestamp: number;
}

// ============================================================================
// MARKET REGIME DETECTOR
// ============================================================================

export class MarketRegimeDetector extends EventEmitter<RegimeDetectorEvents> {
  private provider: JsonRpcProvider;
  private cache: NodeCache;
  
  // Historical data
  private priceHistory: { timestamp: number; price: number }[] = [];
  private volumeHistory: { timestamp: number; volume: number }[] = [];
  private gasHistory: { timestamp: number; gas: bigint }[] = [];
  
  // Current state
  private currentRegime: MarketRegime = MarketRegime.RANGING;
  private regimeStartTime: number = Date.now();
  private lastAnalysis: RegimeAnalysis | null = null;
  
  // Moving averages for regime detection
  private shortMA: number[] = [];  // 5 periods
  private longMA: number[] = [];   // 20 periods
  
  // Update interval
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.provider = new JsonRpcProvider(config.rpcUrl);
    this.cache = new NodeCache({ stdTTL: 60, checkperiod: 30 });
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  async start(): Promise<void> {
    logger.info('[RegimeDetector] Starting market regime detection...');
    
    // Initial data fetch
    await this.fetchInitialData();
    
    // Start periodic analysis
    this.updateInterval = setInterval(async () => {
      await this.updateMarketData();
      const analysis = this.analyzeRegime();
      this.checkRegimeChange(analysis);
      this.detectOpportunities(analysis);
    }, 60000); // Every minute
    
    // Initial analysis
    const analysis = this.analyzeRegime();
    this.emit('regime:updated', analysis);
    
    logger.info(`[RegimeDetector] Started - Current regime: ${this.currentRegime}`);
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    logger.info('[RegimeDetector] Stopped');
  }

  // ==========================================================================
  // DATA COLLECTION
  // ==========================================================================

  private async fetchInitialData(): Promise<void> {
    // Fetch historical ETH price data from real API
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=1&interval=minute',
        { signal: AbortSignal.timeout(10000) }
      );
      const data = await response.json() as { prices?: Array<[number, number]> };
      
      if (data.prices && Array.isArray(data.prices)) {
        // Use last 100 data points
        const prices = data.prices.slice(-100);
        for (const [timestamp, price] of prices) {
          this.priceHistory.push({ timestamp, price });
        }
        logger.info(`[RegimeDetector] Loaded ${prices.length} historical price points`);
      }
    } catch (error) {
      logger.warn('[RegimeDetector] Failed to fetch historical prices, will build from live data');
      // Start with current price and build history over time
      const ethPrice = await this.fetchEthPrice();
      this.priceHistory.push({ timestamp: Date.now(), price: ethPrice });
    }
    
    // Fetch current gas
    const gasPrice = await this.fetchGasPrice();
    this.gasHistory.push({ timestamp: Date.now(), gas: gasPrice });
    
    // Update moving averages
    this.updateMovingAverages();
    
    logger.debug('[RegimeDetector] Initial data fetched');
  }

  private async updateMarketData(): Promise<void> {
    const now = Date.now();
    
    // Update ETH price
    const ethPrice = await this.fetchEthPrice();
    this.priceHistory.push({ timestamp: now, price: ethPrice });
    
    // Update gas price
    const gasPrice = await this.fetchGasPrice();
    this.gasHistory.push({ timestamp: now, gas: gasPrice });
    
    // Keep last 24 hours of data
    const cutoff = now - 24 * 60 * 60 * 1000;
    this.priceHistory = this.priceHistory.filter(p => p.timestamp > cutoff);
    this.gasHistory = this.gasHistory.filter(g => g.timestamp > cutoff);
    
    // Update moving averages
    this.updateMovingAverages();
  }

  private async fetchEthPrice(): Promise<number> {
    // Check cache first
    const cached = this.cache.get<number>('ethPrice');
    if (cached) return cached;

    // Try CoinGecko API
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        { signal: AbortSignal.timeout(5000) }
      );
      const data = await response.json() as { ethereum?: { usd?: number } };
      
      if (data.ethereum?.usd) {
        const price = data.ethereum.usd;
        this.cache.set('ethPrice', price, 30); // Cache for 30 seconds
        return price;
      }
    } catch (error) {
      logger.debug('[RegimeDetector] CoinGecko price fetch failed');
    }

    // Fallback: Try DexScreener
    try {
      const response = await fetch(
        'https://api.dexscreener.com/latest/dex/tokens/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        { signal: AbortSignal.timeout(5000) }
      );
      const data = await response.json() as { pairs?: Array<{ priceUsd?: string }> };
      
      if (data.pairs?.[0]?.priceUsd) {
        const price = parseFloat(data.pairs[0].priceUsd);
        this.cache.set('ethPrice', price, 30);
        return price;
      }
    } catch (error) {
      logger.debug('[RegimeDetector] DexScreener price fetch failed');
    }

    // Fallback: Try Chainlink oracle
    try {
      const chainlinkEthUsd = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';
      const chainlinkABI = ['function latestAnswer() view returns (int256)'];
      const oracle = new ethers.Contract(chainlinkEthUsd, chainlinkABI, this.provider);
      const answer = await oracle.latestAnswer();
      const price = Number(answer) / 1e8;
      this.cache.set('ethPrice', price, 30);
      return price;
    } catch (error) {
      logger.debug('[RegimeDetector] Chainlink price fetch failed');
    }

    // Use last known price or return 0 to indicate failure
    const lastPrice = this.priceHistory.length > 0 
      ? this.priceHistory[this.priceHistory.length - 1].price 
      : 0;
    
    if (lastPrice > 0) return lastPrice;
    
    logger.error('[RegimeDetector] All price sources failed');
    return 0;
  }

  private async fetchGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || 30000000000n;
    } catch {
      return 30000000000n;
    }
  }

  private updateMovingAverages(): void {
    const prices = this.priceHistory.map(p => p.price);
    
    // Short MA (5 periods)
    if (prices.length >= 5) {
      const shortSum = prices.slice(-5).reduce((a, b) => a + b, 0);
      this.shortMA.push(shortSum / 5);
      if (this.shortMA.length > 100) this.shortMA.shift();
    }
    
    // Long MA (20 periods)
    if (prices.length >= 20) {
      const longSum = prices.slice(-20).reduce((a, b) => a + b, 0);
      this.longMA.push(longSum / 20);
      if (this.longMA.length > 100) this.longMA.shift();
    }
  }

  // ==========================================================================
  // REGIME ANALYSIS
  // ==========================================================================

  analyzeRegime(): RegimeAnalysis {
    const prices = this.priceHistory.map(p => p.price);
    const volumes = this.volumeHistory.map(v => v.volume);
    
    // Calculate indicators
    const trendAnalysis = this.analyzeTrend(prices);
    const volatilityAnalysis = this.analyzeVolatility(prices);
    const momentumAnalysis = this.analyzeMomentum(prices);
    const volumeAnalysis = this.analyzeVolume(volumes);
    
    // Determine regime
    const { regime, confidence } = this.classifyRegime(
      trendAnalysis,
      volatilityAnalysis,
      momentumAnalysis,
      volumeAnalysis
    );
    
    // Generate trading recommendation
    const recommendation = this.generateRecommendation(
      regime,
      trendAnalysis,
      volatilityAnalysis,
      momentumAnalysis
    );
    
    // Calculate buy/sell pressure from price movements
    const recentPrices = prices.slice(-20);
    let buyPressure = 50;
    let sellPressure = 50;
    
    if (recentPrices.length >= 2) {
      let upMoves = 0;
      let downMoves = 0;
      for (let i = 1; i < recentPrices.length; i++) {
        if (recentPrices[i] > recentPrices[i - 1]) upMoves++;
        else if (recentPrices[i] < recentPrices[i - 1]) downMoves++;
      }
      const total = upMoves + downMoves;
      if (total > 0) {
        buyPressure = (upMoves / total) * 100;
        sellPressure = (downMoves / total) * 100;
      }
    }
    
    const analysis: RegimeAnalysis = {
      currentRegime: regime,
      confidence,
      
      trendStrength: trendAnalysis.strength,
      trendDirection: trendAnalysis.direction,
      trendDuration: Math.floor((Date.now() - this.regimeStartTime) / 3600000),
      
      volatility: volatilityAnalysis.current,
      volatilityChange: volatilityAnalysis.changePercent,
      impliedVolatility: volatilityAnalysis.implied,
      
      volumeProfile: volumeAnalysis.profile,
      volumeSpike: volumeAnalysis.isSpike,
      relativeVolume: volumeAnalysis.relative,
      
      momentum: momentumAnalysis.value,
      momentumAccelerating: momentumAnalysis.accelerating,
      rsi: momentumAnalysis.rsi,
      
      buyPressure,
      sellPressure,
      newPairsLaunched: 0, // Will be updated by on-chain scanner integration
      rugsPulled: 0,       // Will be updated by safety analysis
      
      fearGreedIndex: this.calculateFearGreedIndex(volatilityAnalysis, momentumAnalysis),
      socialSentiment: 0,  // Will be updated by social scanner integration
      
      recommendedAction: recommendation,
      timestamp: Date.now()
    };
    
    this.lastAnalysis = analysis;
    this.emit('regime:updated', analysis);
    
    return analysis;
  }

  private analyzeTrend(prices: number[]): {
    strength: number;
    direction: 'up' | 'down' | 'neutral';
    duration: number;
  } {
    if (prices.length < 20) {
      return { strength: 0, direction: 'neutral', duration: 0 };
    }
    
    // Simple trend detection using MA crossover
    const shortMA = this.shortMA[this.shortMA.length - 1] || 0;
    const longMA = this.longMA[this.longMA.length - 1] || 0;
    
    if (longMA === 0) {
      return { strength: 0, direction: 'neutral', duration: 0 };
    }
    
    const maDiff = ((shortMA - longMA) / longMA) * 100;
    
    // Calculate trend strength using linear regression slope
    const recentPrices = prices.slice(-20);
    const slope = this.calculateSlope(recentPrices);
    const strength = Math.min(100, Math.abs(slope * 1000));
    
    let direction: 'up' | 'down' | 'neutral' = 'neutral';
    if (maDiff > 1 && slope > 0) direction = 'up';
    else if (maDiff < -1 && slope < 0) direction = 'down';
    
    return {
      strength: direction === 'up' ? strength : -strength,
      direction,
      duration: this.shortMA.length
    };
  }

  private analyzeVolatility(prices: number[]): {
    current: number;
    changePercent: number;
    implied: number;
    baseline: number;
  } {
    if (prices.length < 10) {
      return { current: 20, changePercent: 0, implied: 25, baseline: 20 };
    }
    
    // Calculate standard deviation of returns
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    // Annualize (assuming minute data)
    const annualized = stdDev * Math.sqrt(525600) * 100;
    const current = Math.min(100, annualized);
    
    // Calculate baseline from older data
    const baseline = prices.length >= 100 
      ? this.calculateHistoricalVolatility(prices.slice(0, 50))
      : 20;
    
    const changePercent = baseline > 0 
      ? ((current - baseline) / baseline) * 100 
      : 0;
    
    return {
      current,
      changePercent,
      implied: current * 1.2, // Rough approximation
      baseline
    };
  }

  private analyzeVolume(volumes: number[]): {
    profile: 'increasing' | 'decreasing' | 'stable';
    isSpike: boolean;
    relative: number;
  } {
    if (volumes.length < 5) {
      return { profile: 'stable', isSpike: false, relative: 1 };
    }
    
    const recent = volumes.slice(-5);
    const older = volumes.slice(-20, -5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 
      ? older.reduce((a, b) => a + b, 0) / older.length 
      : recentAvg;
    
    const relative = olderAvg > 0 ? recentAvg / olderAvg : 1;
    const isSpike = relative > 2;
    
    let profile: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (relative > 1.2) profile = 'increasing';
    else if (relative < 0.8) profile = 'decreasing';
    
    return { profile, isSpike, relative };
  }

  private analyzeMomentum(prices: number[]): {
    value: number;
    accelerating: boolean;
    rsi: number;
  } {
    if (prices.length < 14) {
      return { value: 0, accelerating: false, rsi: 50 };
    }
    
    // Calculate RSI
    const rsi = this.calculateRSI(prices, 14);
    
    // Calculate momentum as rate of change
    const recent = prices.slice(-5);
    const older = prices.slice(-10, -5);
    
    const recentChange = (recent[recent.length - 1] - recent[0]) / recent[0];
    const olderChange = older.length >= 5 
      ? (older[older.length - 1] - older[0]) / older[0] 
      : 0;
    
    const momentum = recentChange * 100;
    const accelerating = Math.abs(recentChange) > Math.abs(olderChange);
    
    return {
      value: Math.max(-100, Math.min(100, momentum)),
      accelerating,
      rsi
    };
  }

  private classifyRegime(
    trend: { strength: number; direction: string },
    volatility: { current: number; changePercent: number },
    momentum: { value: number; rsi: number },
    volume: { profile: string; isSpike: boolean }
  ): { regime: MarketRegime; confidence: number } {
    let regime = MarketRegime.RANGING;
    let confidence = 0.5;
    
    // High volatility regimes
    if (volatility.current > 50) {
      if (momentum.value < -30 && momentum.rsi < 30) {
        regime = MarketRegime.CAPITULATION;
        confidence = Math.min(0.9, volatility.current / 100 + 0.3);
      } else if (momentum.value > 30 && momentum.rsi > 70) {
        regime = MarketRegime.EUPHORIA;
        confidence = Math.min(0.9, volatility.current / 100 + 0.3);
      } else {
        regime = MarketRegime.VOLATILE;
        confidence = Math.min(0.85, volatility.current / 100 + 0.2);
      }
    }
    // Trending regimes
    else if (Math.abs(trend.strength) > 30) {
      if (trend.direction === 'up') {
        regime = MarketRegime.TRENDING_UP;
        confidence = Math.min(0.9, Math.abs(trend.strength) / 100 + 0.3);
      } else {
        regime = MarketRegime.TRENDING_DOWN;
        confidence = Math.min(0.9, Math.abs(trend.strength) / 100 + 0.3);
      }
    }
    // Accumulation/Distribution
    else if (volume.isSpike && volatility.current < 30) {
      if (momentum.value > 10) {
        regime = MarketRegime.ACCUMULATION;
        confidence = 0.7;
      } else if (momentum.value < -10) {
        regime = MarketRegime.DISTRIBUTION;
        confidence = 0.7;
      }
    }
    // Default to ranging
    else {
      regime = MarketRegime.RANGING;
      confidence = 0.6;
    }
    
    return { regime, confidence };
  }

  // ==========================================================================
  // RECOMMENDATIONS
  // ==========================================================================

  private generateRecommendation(
    regime: MarketRegime,
    trend: { strength: number; direction: string },
    volatility: { current: number },
    momentum: { value: number; rsi: number }
  ): TradingRecommendation {
    switch (regime) {
      case MarketRegime.TRENDING_UP:
        return {
          action: 'aggressive',
          positionSizeMultiplier: 1.2,
          maxPositions: 10,
          preferredStrategies: ['momentum', 'breakout', 'trend_following'],
          avoidStrategies: ['mean_reversion', 'short_selling'],
          stopLossMultiplier: 1.5,
          takeProfitMultiplier: 2,
          notes: ['Ride the trend', 'Use trailing stops', 'Look for pullback entries']
        };
        
      case MarketRegime.TRENDING_DOWN:
        return {
          action: 'cautious',
          positionSizeMultiplier: 0.5,
          maxPositions: 3,
          preferredStrategies: ['quick_scalp', 'bounce_play'],
          avoidStrategies: ['long_term_hold', 'high_risk'],
          stopLossMultiplier: 0.8,
          takeProfitMultiplier: 0.5,
          notes: ['Take profits quickly', 'Smaller positions', 'Wait for reversal confirmation']
        };
        
      case MarketRegime.VOLATILE:
        return {
          action: 'defensive',
          positionSizeMultiplier: 0.3,
          maxPositions: 2,
          preferredStrategies: ['high_liquidity', 'established_tokens'],
          avoidStrategies: ['new_launches', 'low_liquidity'],
          stopLossMultiplier: 0.5,
          takeProfitMultiplier: 0.75,
          notes: ['Reduce exposure', 'Widen stops', 'Be patient for setups']
        };
        
      case MarketRegime.CAPITULATION:
        return {
          action: 'paused',
          positionSizeMultiplier: 0.1,
          maxPositions: 1,
          preferredStrategies: ['blue_chip', 'established'],
          avoidStrategies: ['all_new_positions'],
          stopLossMultiplier: 0.5,
          takeProfitMultiplier: 0.5,
          notes: ['Wait for stabilization', 'Preserve capital', 'Look for reversal signs']
        };
        
      case MarketRegime.EUPHORIA:
        return {
          action: 'cautious',
          positionSizeMultiplier: 0.7,
          maxPositions: 5,
          preferredStrategies: ['take_profits', 'trailing_stop'],
          avoidStrategies: ['fomo', 'new_positions'],
          stopLossMultiplier: 1.0,
          takeProfitMultiplier: 1.2,
          notes: ['Take profits on existing', 'Tighten stops', 'Reduce new exposure']
        };
        
      case MarketRegime.ACCUMULATION:
        return {
          action: 'normal',
          positionSizeMultiplier: 1.0,
          maxPositions: 8,
          preferredStrategies: ['value_buying', 'dip_buying'],
          avoidStrategies: ['momentum'],
          stopLossMultiplier: 1.0,
          takeProfitMultiplier: 1.5,
          notes: ['Good entry opportunity', 'Build positions gradually', 'Watch for breakout']
        };
        
      case MarketRegime.DISTRIBUTION:
        return {
          action: 'cautious',
          positionSizeMultiplier: 0.5,
          maxPositions: 4,
          preferredStrategies: ['quick_trades', 'take_profits'],
          avoidStrategies: ['long_term', 'accumulation'],
          stopLossMultiplier: 0.7,
          takeProfitMultiplier: 0.8,
          notes: ['Smart money selling', 'Lock in profits', 'Reduce exposure']
        };
        
      case MarketRegime.RANGING:
      default:
        return {
          action: 'normal',
          positionSizeMultiplier: 1.0,
          maxPositions: 6,
          preferredStrategies: ['range_trading', 'support_resistance'],
          avoidStrategies: ['trend_following'],
          stopLossMultiplier: 1.0,
          takeProfitMultiplier: 1.0,
          notes: ['Trade the range', 'Use limit orders', 'Wait for breakout']
        };
    }
  }

  // ==========================================================================
  // OPPORTUNITY DETECTION
  // ==========================================================================

  private checkRegimeChange(analysis: RegimeAnalysis): void {
    if (analysis.currentRegime !== this.currentRegime) {
      const oldRegime = this.currentRegime;
      this.currentRegime = analysis.currentRegime;
      this.regimeStartTime = Date.now();
      
      this.emit('regime:changed', oldRegime, analysis.currentRegime, analysis);
      
      logger.info(`[RegimeDetector] Regime changed: ${oldRegime} -> ${analysis.currentRegime}`);
    }
  }

  private detectOpportunities(analysis: RegimeAnalysis): void {
    // Dip buy opportunity
    if (
      analysis.momentum < -30 &&
      analysis.rsi < 30 &&
      analysis.currentRegime !== MarketRegime.CAPITULATION &&
      analysis.volatilityChange < 50
    ) {
      this.emit('opportunity:detected', {
        type: 'dip_buy',
        confidence: 0.7,
        message: 'Oversold conditions detected',
        suggestedAction: 'Consider accumulating quality tokens',
        timestamp: Date.now()
      });
    }
    
    // Breakout opportunity
    if (
      analysis.momentum > 20 &&
      analysis.momentumAccelerating &&
      analysis.volumeSpike &&
      analysis.currentRegime === MarketRegime.ACCUMULATION
    ) {
      this.emit('opportunity:detected', {
        type: 'breakout',
        confidence: 0.75,
        message: 'Potential breakout forming',
        suggestedAction: 'Watch for confirmation and entry',
        timestamp: Date.now()
      });
    }
    
    // Volatility spike warning
    if (analysis.volatilityChange > 100) {
      this.emit('volatility:spike', analysis.volatility, 50);
    }
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private calculateSlope(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }
    
    return denominator !== 0 ? numerator / denominator : 0;
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    const changes: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    
    const recentChanges = changes.slice(-period);
    const gains = recentChanges.filter(c => c > 0);
    const losses = recentChanges.filter(c => c < 0).map(l => Math.abs(l));
    
    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateHistoricalVolatility(prices: number[]): number {
    if (prices.length < 2) return 20;
    
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(525600) * 100;
  }

  private calculateFearGreedIndex(
    volatility: { current: number },
    momentum: { value: number; rsi: number }
  ): number {
    // Simplified fear/greed calculation
    // 0 = Extreme Fear, 100 = Extreme Greed
    
    let index = 50;
    
    // Momentum contribution
    index += momentum.value * 0.3;
    
    // RSI contribution
    index += (momentum.rsi - 50) * 0.3;
    
    // Volatility contribution (high vol = more fear)
    index -= (volatility.current - 30) * 0.4;
    
    return Math.max(0, Math.min(100, index));
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  getCurrentRegime(): MarketRegime {
    return this.currentRegime;
  }

  getLastAnalysis(): RegimeAnalysis | null {
    return this.lastAnalysis;
  }

  getRecommendation(): TradingRecommendation | null {
    return this.lastAnalysis?.recommendedAction || null;
  }

  forceAnalysis(): RegimeAnalysis {
    return this.analyzeRegime();
  }

  // Update volume data from external sources (e.g., mempool monitor, execution engine)
  updateVolumeData(volume: number): void {
    this.volumeHistory.push({ timestamp: Date.now(), volume });
    if (this.volumeHistory.length > 1440) {
      this.volumeHistory.shift();
    }
  }

  // Update social sentiment from social scanner
  updateSocialSentiment(sentiment: number): void {
    if (this.lastAnalysis) {
      this.lastAnalysis.socialSentiment = sentiment;
    }
  }

  // Update new pairs count from on-chain scanner
  updateNewPairsCount(count: number): void {
    if (this.lastAnalysis) {
      this.lastAnalysis.newPairsLaunched = count;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const marketRegimeDetector = new MarketRegimeDetector();
