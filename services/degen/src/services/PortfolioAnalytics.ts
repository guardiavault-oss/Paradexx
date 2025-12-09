// ============================================================================
// APEX SNIPER - Portfolio Analytics Service
// Comprehensive portfolio tracking, risk metrics, and performance analysis
// ============================================================================

import EventEmitter from 'eventemitter3';
import NodeCache from 'node-cache';
import { ethers, JsonRpcProvider } from 'ethers';
import {
  Position,
  PositionStatus,
  SniperStats,
  DailyStats
} from '../types';
import { config } from '../config';
import { logger, formatEther, formatUnits } from '../utils';
import { executionEngine } from './ExecutionEngine';

// ============================================================================
// TYPES
// ============================================================================

export interface PortfolioMetrics {
  // Value metrics
  totalValueUSD: number;
  totalCostBasis: number;
  totalPnL: number;
  totalPnLPercent: number;
  realizedPnL: number;
  unrealizedPnL: number;
  
  // Performance metrics
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  currentDrawdown: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  
  // Risk metrics
  volatility: number;
  beta: number;
  valueAtRisk: number;
  expectedShortfall: number;
  
  // Trade metrics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgHoldingPeriod: number;
  avgTradeSize: number;
  
  // Time-based returns
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  allTimeReturn: number;
  
  // Timestamp
  calculatedAt: number;
}

export interface RiskAlert {
  id: string;
  type: RiskAlertType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  position?: Position;
  metrics?: Partial<PortfolioMetrics>;
  timestamp: number;
}

export enum RiskAlertType {
  DRAWDOWN_WARNING = 'DRAWDOWN_WARNING',
  DRAWDOWN_CRITICAL = 'DRAWDOWN_CRITICAL',
  POSITION_SIZE_WARNING = 'POSITION_SIZE_WARNING',
  CONCENTRATION_WARNING = 'CONCENTRATION_WARNING',
  VOLATILITY_SPIKE = 'VOLATILITY_SPIKE',
  CORRELATION_WARNING = 'CORRELATION_WARNING',
  LOSS_LIMIT_APPROACHING = 'LOSS_LIMIT_APPROACHING',
  LOSS_LIMIT_HIT = 'LOSS_LIMIT_HIT'
}

export interface PortfolioConfig {
  // Risk limits
  maxDrawdownPercent: number;
  maxPositionSizePercent: number;
  maxConcentrationPercent: number;
  dailyLossLimitPercent: number;
  
  // Position sizing
  defaultPositionSize: number;
  kellyFractionMultiplier: number;
  
  // Alerts
  drawdownWarningThreshold: number;
  drawdownCriticalThreshold: number;
  
  // Calculation periods
  volatilityWindow: number;
  varConfidence: number;
}

// ============================================================================
// EVENTS
// ============================================================================

export interface PortfolioAnalyticsEvents {
  'metrics:updated': (metrics: PortfolioMetrics) => void;
  'risk:alert': (alert: RiskAlert) => void;
  'drawdown:warning': (drawdown: number) => void;
  'drawdown:critical': (drawdown: number) => void;
  'circuit:breaker': (reason: string) => void;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: PortfolioConfig = {
  maxDrawdownPercent: 20,
  maxPositionSizePercent: 10,
  maxConcentrationPercent: 25,
  dailyLossLimitPercent: 5,
  defaultPositionSize: 0.1, // ETH
  kellyFractionMultiplier: 0.25, // Quarter Kelly
  drawdownWarningThreshold: 10,
  drawdownCriticalThreshold: 15,
  volatilityWindow: 30, // days
  varConfidence: 0.95
};

// ============================================================================
// PORTFOLIO ANALYTICS SERVICE
// ============================================================================

export class PortfolioAnalyticsService extends EventEmitter<PortfolioAnalyticsEvents> {
  private provider: JsonRpcProvider;
  private config: PortfolioConfig;
  private metricsCache: NodeCache;
  
  // Historical data
  private dailyReturns: number[] = [];
  private equityCurve: { timestamp: number; value: number }[] = [];
  private peakEquity: number = 0;
  private tradeHistory: { pnl: number; timestamp: number; isWin: boolean }[] = [];
  
  // Risk state
  private circuitBreakerActive: boolean = false;
  private dailyPnL: number = 0;
  private dailyStartValue: number = 0;
  private lastDayReset: number = 0;
  
  // Update interval
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(customConfig?: Partial<PortfolioConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
    this.provider = new JsonRpcProvider(config.rpcUrl);
    this.metricsCache = new NodeCache({ stdTTL: 60, checkperiod: 30 });
    
    // Initialize
    this.lastDayReset = this.getStartOfDay();
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  start(): void {
    logger.info('[PortfolioAnalytics] Starting portfolio analytics service...');
    
    // Initial calculation
    this.calculateMetrics();
    
    // Start periodic updates
    this.updateInterval = setInterval(() => {
      this.calculateMetrics();
      this.checkRiskLimits();
      this.checkDailyReset();
    }, 30000); // Every 30 seconds
    
    logger.info('[PortfolioAnalytics] Portfolio analytics service started');
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    logger.info('[PortfolioAnalytics] Portfolio analytics service stopped');
  }

  // ==========================================================================
  // METRICS CALCULATION
  // ==========================================================================

  calculateMetrics(): PortfolioMetrics {
    const positions = executionEngine.getPositions();
    const openPositions = positions.filter(p => p.status === PositionStatus.OPEN);
    const closedPositions = positions.filter(p => p.status !== PositionStatus.OPEN);
    
    // Calculate value metrics
    const totalValueUSD = this.calculateTotalValue(openPositions);
    const totalCostBasis = this.calculateCostBasis(openPositions);
    const unrealizedPnL = openPositions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
    const realizedPnL = closedPositions.reduce((sum, p) => sum + p.realizedPnL, 0);
    const totalPnL = realizedPnL + unrealizedPnL;
    const totalPnLPercent = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;
    
    // Update equity curve
    this.updateEquityCurve(totalValueUSD);
    
    // Calculate performance metrics
    const tradeMetrics = this.calculateTradeMetrics(closedPositions);
    const riskMetrics = this.calculateRiskMetrics();
    const timeBasedReturns = this.calculateTimeBasedReturns();
    
    const metrics: PortfolioMetrics = {
      totalValueUSD,
      totalCostBasis,
      totalPnL,
      totalPnLPercent,
      realizedPnL,
      unrealizedPnL,
      
      sharpeRatio: riskMetrics.sharpeRatio,
      sortinoRatio: riskMetrics.sortinoRatio,
      maxDrawdown: riskMetrics.maxDrawdown,
      currentDrawdown: riskMetrics.currentDrawdown,
      winRate: tradeMetrics.winRate,
      profitFactor: tradeMetrics.profitFactor,
      avgWin: tradeMetrics.avgWin,
      avgLoss: tradeMetrics.avgLoss,
      largestWin: tradeMetrics.largestWin,
      largestLoss: tradeMetrics.largestLoss,
      
      volatility: riskMetrics.volatility,
      beta: riskMetrics.beta,
      valueAtRisk: riskMetrics.valueAtRisk,
      expectedShortfall: riskMetrics.expectedShortfall,
      
      totalTrades: tradeMetrics.totalTrades,
      winningTrades: tradeMetrics.winningTrades,
      losingTrades: tradeMetrics.losingTrades,
      avgHoldingPeriod: tradeMetrics.avgHoldingPeriod,
      avgTradeSize: tradeMetrics.avgTradeSize,
      
      dailyReturn: timeBasedReturns.daily,
      weeklyReturn: timeBasedReturns.weekly,
      monthlyReturn: timeBasedReturns.monthly,
      allTimeReturn: totalPnLPercent,
      
      calculatedAt: Date.now()
    };
    
    this.metricsCache.set('current', metrics);
    this.emit('metrics:updated', metrics);
    
    return metrics;
  }

  private calculateTotalValue(positions: Position[]): number {
    return positions.reduce((sum, p) => sum + p.currentValueUSD, 0);
  }

  private calculateCostBasis(positions: Position[]): number {
    return positions.reduce((sum, p) => sum + Number(formatEther(p.entryAmountIn)) * 2000, 0);
  }

  private updateEquityCurve(value: number): void {
    const now = Date.now();
    this.equityCurve.push({ timestamp: now, value });
    
    // Keep last 30 days
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    this.equityCurve = this.equityCurve.filter(p => p.timestamp > thirtyDaysAgo);
    
    // Update peak
    if (value > this.peakEquity) {
      this.peakEquity = value;
    }
  }

  private calculateTradeMetrics(closedPositions: Position[]): {
    winRate: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    avgHoldingPeriod: number;
    avgTradeSize: number;
  } {
    if (closedPositions.length === 0) {
      return {
        winRate: 0, profitFactor: 0, avgWin: 0, avgLoss: 0,
        largestWin: 0, largestLoss: 0, totalTrades: 0,
        winningTrades: 0, losingTrades: 0, avgHoldingPeriod: 0, avgTradeSize: 0
      };
    }
    
    const winners = closedPositions.filter(p => p.realizedPnL > 0);
    const losers = closedPositions.filter(p => p.realizedPnL < 0);
    
    const totalWins = winners.reduce((sum, p) => sum + p.realizedPnL, 0);
    const totalLosses = Math.abs(losers.reduce((sum, p) => sum + p.realizedPnL, 0));
    
    const holdingPeriods = closedPositions
      .filter(p => p.exits.length > 0)
      .map(p => {
        const lastExit = p.exits[p.exits.length - 1];
        return lastExit.timestamp - p.entryTimestamp;
      });
    
    const avgHoldingPeriod = holdingPeriods.length > 0
      ? holdingPeriods.reduce((a, b) => a + b, 0) / holdingPeriods.length / 3600000 // hours
      : 0;
    
    return {
      winRate: closedPositions.length > 0 ? (winners.length / closedPositions.length) * 100 : 0,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
      avgWin: winners.length > 0 ? totalWins / winners.length : 0,
      avgLoss: losers.length > 0 ? totalLosses / losers.length : 0,
      largestWin: winners.length > 0 ? Math.max(...winners.map(p => p.realizedPnL)) : 0,
      largestLoss: losers.length > 0 ? Math.min(...losers.map(p => p.realizedPnL)) : 0,
      totalTrades: closedPositions.length,
      winningTrades: winners.length,
      losingTrades: losers.length,
      avgHoldingPeriod,
      avgTradeSize: closedPositions.reduce((sum, p) => sum + Number(formatEther(p.entryAmountIn)), 0) / closedPositions.length
    };
  }

  private calculateRiskMetrics(): {
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    currentDrawdown: number;
    volatility: number;
    beta: number;
    valueAtRisk: number;
    expectedShortfall: number;
  } {
    // Calculate current drawdown
    const currentValue = this.equityCurve.length > 0 
      ? this.equityCurve[this.equityCurve.length - 1].value 
      : 0;
    const currentDrawdown = this.peakEquity > 0 
      ? ((this.peakEquity - currentValue) / this.peakEquity) * 100 
      : 0;
    
    // Calculate max drawdown from equity curve
    let maxDrawdown = 0;
    let peak = 0;
    for (const point of this.equityCurve) {
      if (point.value > peak) peak = point.value;
      const drawdown = peak > 0 ? ((peak - point.value) / peak) * 100 : 0;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    
    // Calculate volatility (standard deviation of returns)
    const volatility = this.calculateVolatility();
    
    // Calculate Sharpe ratio (assuming risk-free rate of 5%)
    const avgReturn = this.dailyReturns.length > 0 
      ? this.dailyReturns.reduce((a, b) => a + b, 0) / this.dailyReturns.length 
      : 0;
    const riskFreeRate = 0.05 / 365; // Daily risk-free rate
    const sharpeRatio = volatility > 0 
      ? ((avgReturn - riskFreeRate) / volatility) * Math.sqrt(365) 
      : 0;
    
    // Calculate Sortino ratio (using downside deviation)
    const negativeReturns = this.dailyReturns.filter(r => r < 0);
    const downsideDeviation = negativeReturns.length > 0
      ? Math.sqrt(negativeReturns.reduce((sum, r) => sum + r * r, 0) / negativeReturns.length)
      : 0;
    const sortinoRatio = downsideDeviation > 0 
      ? ((avgReturn - riskFreeRate) / downsideDeviation) * Math.sqrt(365) 
      : 0;
    
    // Calculate Value at Risk (VaR)
    const sortedReturns = [...this.dailyReturns].sort((a, b) => a - b);
    const varIndex = Math.floor((1 - this.config.varConfidence) * sortedReturns.length);
    const valueAtRisk = sortedReturns.length > 0 
      ? Math.abs(sortedReturns[varIndex] || 0) * 100 
      : 0;
    
    // Calculate Expected Shortfall (CVaR)
    const tailReturns = sortedReturns.slice(0, varIndex + 1);
    const expectedShortfall = tailReturns.length > 0
      ? Math.abs(tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length) * 100
      : 0;
    
    return {
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      currentDrawdown,
      volatility: volatility * 100, // Convert to percentage
      beta: 1, // Would need market data to calculate
      valueAtRisk,
      expectedShortfall
    };
  }

  private calculateVolatility(): number {
    if (this.dailyReturns.length < 2) return 0;
    
    const mean = this.dailyReturns.reduce((a, b) => a + b, 0) / this.dailyReturns.length;
    const squaredDiffs = this.dailyReturns.map(r => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (this.dailyReturns.length - 1);
    
    return Math.sqrt(variance);
  }

  private calculateTimeBasedReturns(): {
    daily: number;
    weekly: number;
    monthly: number;
  } {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
    
    const current = this.equityCurve.length > 0 
      ? this.equityCurve[this.equityCurve.length - 1].value 
      : 0;
    
    const findValueAt = (timestamp: number) => {
      const point = this.equityCurve.find(p => p.timestamp >= timestamp);
      return point?.value || current;
    };
    
    const dayAgoValue = findValueAt(dayAgo);
    const weekAgoValue = findValueAt(weekAgo);
    const monthAgoValue = findValueAt(monthAgo);
    
    return {
      daily: dayAgoValue > 0 ? ((current - dayAgoValue) / dayAgoValue) * 100 : 0,
      weekly: weekAgoValue > 0 ? ((current - weekAgoValue) / weekAgoValue) * 100 : 0,
      monthly: monthAgoValue > 0 ? ((current - monthAgoValue) / monthAgoValue) * 100 : 0
    };
  }

  // ==========================================================================
  // RISK MANAGEMENT
  // ==========================================================================

  private checkRiskLimits(): void {
    const metrics = this.getMetrics();
    if (!metrics) return;
    
    // Check drawdown
    if (metrics.currentDrawdown >= this.config.drawdownCriticalThreshold) {
      this.emitRiskAlert({
        type: RiskAlertType.DRAWDOWN_CRITICAL,
        severity: 'CRITICAL',
        title: 'Critical Drawdown',
        message: `Portfolio drawdown at ${metrics.currentDrawdown.toFixed(1)}% - exceeds critical threshold`,
        metrics: { currentDrawdown: metrics.currentDrawdown }
      });
      this.emit('drawdown:critical', metrics.currentDrawdown);
    } else if (metrics.currentDrawdown >= this.config.drawdownWarningThreshold) {
      this.emitRiskAlert({
        type: RiskAlertType.DRAWDOWN_WARNING,
        severity: 'WARNING',
        title: 'Drawdown Warning',
        message: `Portfolio drawdown at ${metrics.currentDrawdown.toFixed(1)}% - approaching limit`,
        metrics: { currentDrawdown: metrics.currentDrawdown }
      });
      this.emit('drawdown:warning', metrics.currentDrawdown);
    }
    
    // Check daily loss limit
    const currentValue = this.calculateTotalValue(
      executionEngine.getOpenPositions()
    );
    const dailyReturn = this.dailyStartValue > 0 
      ? ((currentValue - this.dailyStartValue) / this.dailyStartValue) * 100 
      : 0;
    
    if (dailyReturn <= -this.config.dailyLossLimitPercent) {
      this.emitRiskAlert({
        type: RiskAlertType.LOSS_LIMIT_HIT,
        severity: 'CRITICAL',
        title: 'Daily Loss Limit Hit',
        message: `Daily loss of ${Math.abs(dailyReturn).toFixed(1)}% exceeded limit`,
        metrics: { dailyReturn }
      });
      this.activateCircuitBreaker('Daily loss limit exceeded');
    } else if (dailyReturn <= -(this.config.dailyLossLimitPercent * 0.8)) {
      this.emitRiskAlert({
        type: RiskAlertType.LOSS_LIMIT_APPROACHING,
        severity: 'WARNING',
        title: 'Approaching Daily Loss Limit',
        message: `Daily loss at ${Math.abs(dailyReturn).toFixed(1)}% - approaching ${this.config.dailyLossLimitPercent}% limit`,
        metrics: { dailyReturn }
      });
    }
    
    // Check concentration
    this.checkConcentration();
    
    // Check volatility spike
    if (metrics.volatility > 50) {
      this.emitRiskAlert({
        type: RiskAlertType.VOLATILITY_SPIKE,
        severity: 'WARNING',
        title: 'High Volatility Detected',
        message: `Portfolio volatility at ${metrics.volatility.toFixed(1)}% - consider reducing exposure`,
        metrics: { volatility: metrics.volatility }
      });
    }
  }

  private checkConcentration(): void {
    const positions = executionEngine.getOpenPositions();
    const totalValue = this.calculateTotalValue(positions);
    
    if (totalValue === 0) return;
    
    for (const position of positions) {
      const concentration = (position.currentValueUSD / totalValue) * 100;
      
      if (concentration > this.config.maxConcentrationPercent) {
        this.emitRiskAlert({
          type: RiskAlertType.CONCENTRATION_WARNING,
          severity: 'WARNING',
          title: 'Concentration Risk',
          message: `${position.tokenInfo.symbol} represents ${concentration.toFixed(1)}% of portfolio`,
          position
        });
      }
    }
  }

  private checkDailyReset(): void {
    const startOfDay = this.getStartOfDay();
    if (startOfDay > this.lastDayReset) {
      this.lastDayReset = startOfDay;
      this.dailyStartValue = this.calculateTotalValue(
        executionEngine.getOpenPositions()
      );
      this.circuitBreakerActive = false;
      logger.info('[PortfolioAnalytics] Daily metrics reset');
    }
  }

  private getStartOfDay(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }

  private activateCircuitBreaker(reason: string): void {
    if (this.circuitBreakerActive) return;
    
    this.circuitBreakerActive = true;
    this.emit('circuit:breaker', reason);
    logger.warn(`[PortfolioAnalytics] Circuit breaker activated: ${reason}`);
  }

  private emitRiskAlert(alert: Omit<RiskAlert, 'id' | 'timestamp'>): void {
    const fullAlert: RiskAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...alert,
      timestamp: Date.now()
    };
    this.emit('risk:alert', fullAlert);
  }

  // ==========================================================================
  // POSITION SIZING
  // ==========================================================================

  /**
   * Calculate optimal position size using Kelly Criterion
   */
  calculateOptimalPositionSize(
    winProbability: number,
    avgWinMultiple: number,
    avgLossMultiple: number = 1,
    portfolioValue: number
  ): number {
    // Kelly formula: f* = (p * b - q) / b
    // where p = win probability, q = loss probability (1-p), b = win/loss ratio
    const p = winProbability;
    const q = 1 - p;
    const b = avgWinMultiple / avgLossMultiple;
    
    let kellyFraction = (p * b - q) / b;
    
    // Apply fractional Kelly (more conservative)
    kellyFraction *= this.config.kellyFractionMultiplier;
    
    // Cap at max position size
    kellyFraction = Math.min(kellyFraction, this.config.maxPositionSizePercent / 100);
    
    // Ensure positive
    kellyFraction = Math.max(0, kellyFraction);
    
    return portfolioValue * kellyFraction;
  }

  /**
   * Adjust position size based on current volatility
   */
  adjustForVolatility(baseSize: number, targetVol: number = 15): number {
    const currentVol = this.getMetrics()?.volatility || 15;
    const adjustment = targetVol / Math.max(currentVol, 1);
    return baseSize * Math.min(adjustment, 2); // Cap at 2x
  }

  /**
   * Check if new position would exceed risk limits
   */
  canOpenPosition(sizeETH: number, token: string): { allowed: boolean; reason?: string } {
    if (this.circuitBreakerActive) {
      return { allowed: false, reason: 'Circuit breaker active' };
    }
    
    const positions = executionEngine.getOpenPositions();
    const totalValue = this.calculateTotalValue(positions);
    const newPositionValue = sizeETH * 2000; // Approximate USD value
    
    // Check position size limit
    const positionPercent = totalValue > 0 
      ? (newPositionValue / totalValue) * 100 
      : 100;
    
    if (positionPercent > this.config.maxPositionSizePercent) {
      return { 
        allowed: false, 
        reason: `Position size ${positionPercent.toFixed(1)}% exceeds ${this.config.maxPositionSizePercent}% limit` 
      };
    }
    
    // Check if already have this token
    const existingPosition = positions.find(
      p => p.token.toLowerCase() === token.toLowerCase()
    );
    
    if (existingPosition) {
      const combinedValue = existingPosition.currentValueUSD + newPositionValue;
      const combinedPercent = (combinedValue / (totalValue + newPositionValue)) * 100;
      
      if (combinedPercent > this.config.maxConcentrationPercent) {
        return { 
          allowed: false, 
          reason: `Combined concentration ${combinedPercent.toFixed(1)}% exceeds ${this.config.maxConcentrationPercent}% limit` 
        };
      }
    }
    
    return { allowed: true };
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  getMetrics(): PortfolioMetrics | undefined {
    return this.metricsCache.get<PortfolioMetrics>('current');
  }

  getEquityCurve(): { timestamp: number; value: number }[] {
    return [...this.equityCurve];
  }

  getDailyReturns(): number[] {
    return [...this.dailyReturns];
  }

  isCircuitBreakerActive(): boolean {
    return this.circuitBreakerActive;
  }

  resetCircuitBreaker(): void {
    this.circuitBreakerActive = false;
    logger.info('[PortfolioAnalytics] Circuit breaker manually reset');
  }

  getConfig(): PortfolioConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<PortfolioConfig>): void {
    this.config = { ...this.config, ...updates };
    logger.info('[PortfolioAnalytics] Configuration updated');
  }

  // Record completed trade for tracking
  recordTrade(pnl: number, isWin: boolean): void {
    this.tradeHistory.push({
      pnl,
      timestamp: Date.now(),
      isWin
    });
    
    // Keep last 1000 trades
    if (this.tradeHistory.length > 1000) {
      this.tradeHistory.shift();
    }
  }

  // Record daily return
  recordDailyReturn(returnPercent: number): void {
    this.dailyReturns.push(returnPercent / 100);
    
    // Keep last volatility window days
    const maxDays = this.config.volatilityWindow;
    if (this.dailyReturns.length > maxDays) {
      this.dailyReturns.shift();
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const portfolioAnalytics = new PortfolioAnalyticsService();
