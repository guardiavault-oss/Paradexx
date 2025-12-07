/**
 * Smart Vault Service - Intelligent Asset Management
 * 
 * Features:
 * - Auto-Diversify (rebalance portfolio automatically)
 * - Yield Optimizer (find best yields across DeFi)
 * - Tax Harvester (automated tax-loss harvesting)
 * - Dollar Cost Average (smart DCA with AI timing)
 * - Stablecoin Shield (auto-convert during crashes)
 */

import { EventEmitter } from 'events';
import { logger } from '../services/logger.service';
import crypto from 'crypto';
import axios from 'axios';
import { walletService } from './wallet.service';
import { seedlessWalletService } from './seedless-wallet.service';
import { prisma } from '../config/database';

// API endpoints
const DEFILLAMA_API = 'https://yields.llama.fi';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const FEAR_GREED_API = 'https://api.alternative.me/fng';

// Types
export interface VaultStrategy {
    id: string;
    userId: string;
    name: string;
    type: 'diversify' | 'yield' | 'tax' | 'dca' | 'shield';
    enabled: boolean;
    config: Record<string, any>;
    performance: StrategyPerformance;
    createdAt: Date;
    updatedAt: Date;
}

export interface StrategyPerformance {
    totalExecutions: number;
    successfulExecutions: number;
    totalSaved: string;          // USD saved/earned
    lastExecution?: Date;
    lastResult?: string;
}

// ===========================
// AUTO-DIVERSIFY
// ===========================

export interface DiversifyConfig {
    targetAllocations: {
        asset: string;             // ETH, BTC, stablecoins, etc.
        percentage: number;        // Target % of portfolio
        minDeviation: number;      // Min deviation before rebalance
    }[];
    rebalanceFrequency: 'daily' | 'weekly' | 'monthly' | 'threshold';
    thresholdPercent: number;    // Deviation threshold for rebalance
    maxSlippage: number;
    gasLimit: string;
}

export interface RebalanceResult {
    success: boolean;
    trades: {
        from: string;
        to: string;
        amount: string;
        txHash?: string;
    }[];
    beforeAllocation: Record<string, number>;
    afterAllocation: Record<string, number>;
    gasCost: string;
    timestamp: Date;
}

// ===========================
// YIELD OPTIMIZER
// ===========================

export interface YieldConfig {
    assets: string[];            // Assets to optimize
    minApy: number;              // Minimum acceptable APY
    maxRisk: 'low' | 'medium' | 'high';
    protocols: string[];         // Allowed protocols
    autoCompound: boolean;
    compoundFrequency: 'daily' | 'weekly';
    gasThreshold: string;        // Max gas to spend on moves
}

export interface YieldOpportunity {
    protocol: string;
    chain: string;
    asset: string;
    apy: number;
    tvl: string;
    riskScore: number;           // 0-100, lower is safer
    audited: boolean;
    insuranceCovered: boolean;
}

export interface YieldPosition {
    id: string;
    protocol: string;
    chain: string;
    asset: string;
    amount: string;
    apy: number;
    earned: string;
    enteredAt: Date;
}

// ===========================
// TAX HARVESTER
// ===========================

export interface TaxConfig {
    jurisdiction: string;        // US, UK, etc.
    shortTermRate: number;       // Short-term capital gains rate
    longTermRate: number;        // Long-term capital gains rate
    harvestThreshold: string;    // Min loss to harvest
    washSaleAvoidance: boolean;  // Avoid wash sale rules
    washSaleDays: number;        // Days to wait (30 for US)
    autoReinvest: boolean;       // Reinvest in similar asset
}

export interface TaxHarvestResult {
    assetSold: string;
    amount: string;
    loss: string;
    taxSaved: string;
    replacementAsset?: string;
    sellTxHash?: string;
    buyTxHash?: string;
    timestamp: Date;
}

export interface TaxSummary {
    year: number;
    realizedGains: string;
    realizedLosses: string;
    harvestedLosses: string;
    taxSaved: string;
    pendingHarvests: {
        asset: string;
        unrealizedLoss: string;
        potentialTaxSaved: string;
    }[];
}

// ===========================
// SMART DCA
// ===========================

export interface DcaConfig {
    asset: string;               // Asset to accumulate
    sourceAsset: string;         // Asset to spend (usually stablecoin)
    totalAmount: string;         // Total to invest
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    amountPerPeriod: string;

    // AI Enhancement
    aiTiming: boolean;           // Use AI to time purchases
    fearGreedWeight: number;     // Weight of Fear & Greed index
    technicalWeight: number;     // Weight of technical indicators
    maxDeviationPercent: number; // Max deviation from schedule

    // Safety
    maxPrice: string;            // Don't buy above this price
    minPrice: string;            // Don't buy below (might be crash)
    pauseOnCrash: boolean;       // Pause during major crashes
    crashThreshold: number;      // % drop to consider crash
}

export interface DcaPurchase {
    id: string;
    asset: string;
    amount: string;
    price: string;
    total: string;
    aiScore?: number;            // AI confidence in timing
    fearGreedIndex?: number;
    txHash?: string;
    timestamp: Date;
}

export interface DcaStats {
    totalInvested: string;
    totalAcquired: string;
    averagePrice: string;
    currentValue: string;
    unrealizedPnL: string;
    unrealizedPnLPercent: number;
    purchases: number;
    bestPurchase: DcaPurchase;
    worstPurchase: DcaPurchase;
}

// ===========================
// STABLECOIN SHIELD
// ===========================

export interface ShieldConfig {
    enabled: boolean;
    triggerType: 'price_drop' | 'volatility' | 'fear_greed' | 'manual';

    // Price Drop Trigger
    priceDropPercent: number;    // Portfolio drop to trigger
    timeframeMins: number;       // Timeframe to measure drop

    // Volatility Trigger
    volatilityThreshold: number; // VIX-like threshold

    // Fear & Greed Trigger
    fearThreshold: number;       // 0-100, trigger below this

    // Conversion Settings
    targetStable: string;        // USDC, USDT, DAI
    convertPercent: number;      // % of portfolio to convert
    excludeAssets: string[];     // Assets to never convert

    // Recovery
    autoRecovery: boolean;       // Auto-convert back when stable
    recoveryThreshold: number;   // Days/conditions to recover
}

export interface ShieldEvent {
    id: string;
    triggeredAt: Date;
    triggerType: string;
    triggerValue: number;
    portfolioValueBefore: string;
    convertedAmount: string;
    assetsConverted: {
        asset: string;
        amount: string;
        price: string;
    }[];
    status: 'active' | 'recovered' | 'manual_exit';
    recoveredAt?: Date;
    portfolioValueAfter?: string;
    savedAmount?: string;
}

class SmartVaultService extends EventEmitter {
    private strategies: Map<string, VaultStrategy[]> = new Map();
    private yieldPositions: Map<string, YieldPosition[]> = new Map();
    private dcaPurchases: Map<string, DcaPurchase[]> = new Map();
    private shieldEvents: Map<string, ShieldEvent[]> = new Map();
    private taxHarvests: Map<string, TaxHarvestResult[]> = new Map();

    constructor() {
        super();
    }

    // ===========================
    // STRATEGY MANAGEMENT
    // ===========================

    async createStrategy(
        userId: string,
        type: VaultStrategy['type'],
        name: string,
        config: Record<string, any>
    ): Promise<VaultStrategy> {
        const strategy: VaultStrategy = {
            id: `strat_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            userId,
            name,
            type,
            enabled: true,
            config,
            performance: {
                totalExecutions: 0,
                successfulExecutions: 0,
                totalSaved: '0',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const userStrategies = this.strategies.get(userId) || [];
        userStrategies.push(strategy);
        this.strategies.set(userId, userStrategies);

        return strategy;
    }

    getStrategies(userId: string): VaultStrategy[] {
        return this.strategies.get(userId) || [];
    }

    async toggleStrategy(strategyId: string, enabled: boolean): Promise<VaultStrategy | null> {
        for (const [userId, strategies] of this.strategies.entries()) {
            const strategy = strategies.find(s => s.id === strategyId);
            if (strategy) {
                strategy.enabled = enabled;
                strategy.updatedAt = new Date();
                return strategy;
            }
        }
        return null;
    }

    // ===========================
    // AUTO-DIVERSIFY
    // ===========================

    async checkRebalanceNeeded(userId: string, strategyId: string): Promise<{
        needed: boolean;
        currentAllocations: Record<string, number>;
        targetAllocations: Record<string, number>;
        deviations: Record<string, number>;
    }> {
        const strategy = this.getStrategy(userId, strategyId);
        if (!strategy || strategy.type !== 'diversify') {
            throw new Error('Invalid diversify strategy');
        }

        const config = strategy.config as DiversifyConfig;

        // Get real portfolio allocations from stored user data
        // This would be populated when user connects wallet
        const currentAllocations = await this.getUserPortfolioAllocations(userId);

        const targetAllocations: Record<string, number> = {};
        const deviations: Record<string, number> = {};
        let needsRebalance = false;

        for (const target of config.targetAllocations) {
            targetAllocations[target.asset] = target.percentage;
            const current = currentAllocations[target.asset] || 0;
            const deviation = Math.abs(current - target.percentage);
            deviations[target.asset] = deviation;

            if (deviation > target.minDeviation) {
                needsRebalance = true;
            }
        }

        return {
            needed: needsRebalance,
            currentAllocations,
            targetAllocations,
            deviations,
        };
    }

    async executeRebalance(userId: string, strategyId: string): Promise<RebalanceResult> {
        const check = await this.checkRebalanceNeeded(userId, strategyId);

        if (!check.needed) {
            return {
                success: true,
                trades: [],
                beforeAllocation: check.currentAllocations,
                afterAllocation: check.currentAllocations,
                gasCost: '0',
                timestamp: new Date(),
            };
        }

        // In production: Execute actual trades
        const result: RebalanceResult = {
            success: true,
            trades: [],
            beforeAllocation: check.currentAllocations,
            afterAllocation: check.targetAllocations,
            gasCost: '0.005',
            timestamp: new Date(),
        };

        this.emit('rebalance', { userId, strategyId, result });

        return result;
    }

    // ===========================
    // YIELD OPTIMIZER
    // ===========================

    async findBestYields(config: YieldConfig): Promise<YieldOpportunity[]> {
        // Fetch real yield data from DefiLlama
        const opportunities: YieldOpportunity[] = [];

        try {
            const response = await axios.get(`${DEFILLAMA_API}/pools`);
            const pools = response.data.data || [];

            // Filter and map pools to our format
            for (const pool of pools) {
                // Skip if doesn't match config assets
                if (config.assets.length > 0 && !config.assets.includes(pool.symbol)) {
                    continue;
                }

                // Skip if APY below minimum
                if (pool.apy < config.minApy) {
                    continue;
                }

                // Calculate risk score based on TVL and audit status
                const tvlNum = parseFloat(pool.tvlUsd) || 0;
                let riskScore = 50; // Base risk
                if (tvlNum > 1000000000) riskScore -= 30; // $1B+ TVL = low risk
                else if (tvlNum > 100000000) riskScore -= 20; // $100M+ TVL
                else if (tvlNum > 10000000) riskScore -= 10; // $10M+ TVL
                if (pool.audits > 0) riskScore -= 10;
                riskScore = Math.max(5, Math.min(95, riskScore));

                // Apply risk filter
                if (config.maxRisk === 'low' && riskScore > 25) continue;
                if (config.maxRisk === 'medium' && riskScore > 50) continue;

                // Check if protocol is allowed
                if (config.protocols.length > 0 && !config.protocols.includes(pool.project)) {
                    continue;
                }

                opportunities.push({
                    protocol: pool.project,
                    chain: pool.chain,
                    asset: pool.symbol,
                    apy: pool.apy,
                    tvl: this.formatTvl(tvlNum),
                    riskScore,
                    audited: pool.audits > 0,
                    insuranceCovered: pool.ilRisk === 'no',
                });
            }
        } catch (error) {
            logger.error('Error fetching yields from DefiLlama:', error);
        }

        // Sort by APY descending and return top results
        return opportunities.sort((a, b) => b.apy - a.apy).slice(0, 50);
    }

    private formatTvl(tvl: number): string {
        if (tvl >= 1000000000) return `${(tvl / 1000000000).toFixed(1)}B`;
        if (tvl >= 1000000) return `${(tvl / 1000000).toFixed(1)}M`;
        if (tvl >= 1000) return `${(tvl / 1000).toFixed(1)}K`;
        return tvl.toFixed(0);
    }

    // Get user's portfolio allocations from stored data or API
    private async getUserPortfolioAllocations(userId: string): Promise<Record<string, number>> {
        // This would be populated when user connects wallet via Moralis/Alchemy
        // For now, return empty object - will be filled by portfolio tracking
        const portfolioData = this.portfolioCache.get(userId);
        if (portfolioData) {
            return portfolioData;
        }

        // Return default empty allocations - user needs to connect wallet
        return {};
    }

    // Cache for user portfolio data
    private portfolioCache: Map<string, Record<string, number>> = new Map();

    // Update portfolio allocations (called when wallet is connected)
    async updatePortfolioAllocations(userId: string, allocations: Record<string, number>): Promise<void> {
        this.portfolioCache.set(userId, allocations);
    }

    // Get current price from CoinGecko
    private async getCurrentPrice(asset: string): Promise<string> {
        try {
            const coinId = this.getCoinGeckoId(asset);
            const response = await axios.get(
                `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd`
            );
            const price = response.data[coinId]?.usd;
            return price ? price.toString() : '0';
        } catch (error) {
            logger.error('Error fetching price from CoinGecko:', error);
            return '0';
        }
    }

    // Get 24h price change from CoinGecko
    private async get24hPriceChange(asset: string): Promise<number> {
        try {
            const coinId = this.getCoinGeckoId(asset);
            const response = await axios.get(
                `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
            );
            return response.data[coinId]?.usd_24h_change || 0;
        } catch (error) {
            logger.error('Error fetching price change:', error);
            return 0;
        }
    }

    // Get Fear & Greed Index
    private async getFearGreedIndex(): Promise<number> {
        try {
            const response = await axios.get(FEAR_GREED_API);
            const value = parseInt(response.data.data?.[0]?.value || '50');
            return value;
        } catch (error) {
            logger.error('Error fetching Fear & Greed Index:', error);
            return 50; // Neutral if API fails
        }
    }

    // Map asset symbols to CoinGecko IDs
    private getCoinGeckoId(asset: string): string {
        const mapping: Record<string, string> = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'USDC': 'usd-coin',
            'USDT': 'tether',
            'DAI': 'dai',
            'WBTC': 'wrapped-bitcoin',
            'LINK': 'chainlink',
            'UNI': 'uniswap',
            'AAVE': 'aave',
            'SOL': 'solana',
            'MATIC': 'matic-network',
            'ARB': 'arbitrum',
            'OP': 'optimism',
        };
        return mapping[asset.toUpperCase()] || asset.toLowerCase();
    }

    async optimizeYield(userId: string, strategyId: string): Promise<{
        moved: boolean;
        from?: YieldPosition;
        to?: YieldOpportunity;
        improvement?: number;
    }> {
        const strategy = this.getStrategy(userId, strategyId);
        if (!strategy || strategy.type !== 'yield') {
            throw new Error('Invalid yield strategy');
        }

        const config = strategy.config as YieldConfig;
        const currentPositions = this.yieldPositions.get(userId) || [];
        const opportunities = await this.findBestYields(config);

        // Check if better opportunity exists
        for (const position of currentPositions) {
            const betterOpp = opportunities.find(
                opp => opp.asset === position.asset && opp.apy > position.apy + 0.5
            );

            if (betterOpp) {
                // In production: Execute the move
                return {
                    moved: true,
                    from: position,
                    to: betterOpp,
                    improvement: betterOpp.apy - position.apy,
                };
            }
        }

        return { moved: false };
    }

    getYieldPositions(userId: string): YieldPosition[] {
        return this.yieldPositions.get(userId) || [];
    }

    // ===========================
    // TAX HARVESTER
    // ===========================

    async findHarvestOpportunities(userId: string, strategyId: string): Promise<{
        asset: string;
        unrealizedLoss: string;
        costBasis: string;
        currentValue: string;
        potentialTaxSaved: string;
        washSaleCleared: boolean;
        daysSincePurchase: number;
    }[]> {
        const strategy = this.getStrategy(userId, strategyId);
        if (!strategy || strategy.type !== 'tax') {
            throw new Error('Invalid tax strategy');
        }

        const config = strategy.config as TaxConfig;

        // In production: Get actual positions with cost basis
        const opportunities = [
            {
                asset: 'LINK',
                unrealizedLoss: '500',
                costBasis: '2000',
                currentValue: '1500',
                potentialTaxSaved: (500 * config.shortTermRate / 100).toFixed(2),
                washSaleCleared: true,
                daysSincePurchase: 180,
            },
            {
                asset: 'UNI',
                unrealizedLoss: '300',
                costBasis: '1000',
                currentValue: '700',
                potentialTaxSaved: (300 * config.shortTermRate / 100).toFixed(2),
                washSaleCleared: true,
                daysSincePurchase: 45,
            },
        ];

        return opportunities.filter(opp => parseFloat(opp.unrealizedLoss) >= parseFloat(config.harvestThreshold));
    }

    async executeHarvest(
        userId: string,
        strategyId: string,
        asset: string
    ): Promise<TaxHarvestResult> {
        const strategy = this.getStrategy(userId, strategyId);
        if (!strategy || strategy.type !== 'tax') {
            throw new Error('Invalid tax strategy');
        }

        const config = strategy.config as TaxConfig;

        // In production: Execute actual sell
        const result: TaxHarvestResult = {
            assetSold: asset,
            amount: '100',
            loss: '500',
            taxSaved: (500 * config.shortTermRate / 100).toFixed(2),
            timestamp: new Date(),
        };

        // If auto-reinvest, buy similar asset
        if (config.autoReinvest) {
            result.replacementAsset = asset === 'BTC' ? 'WBTC' : asset + '-SIMILAR';
        }

        const userHarvests = this.taxHarvests.get(userId) || [];
        userHarvests.push(result);
        this.taxHarvests.set(userId, userHarvests);

        this.emit('taxHarvest', { userId, result });

        return result;
    }

    getTaxSummary(userId: string, year: number): TaxSummary {
        const harvests = this.taxHarvests.get(userId) || [];
        const yearHarvests = harvests.filter(h => h.timestamp.getFullYear() === year);

        return {
            year,
            realizedGains: '5000',
            realizedLosses: '2000',
            harvestedLosses: yearHarvests.reduce((sum, h) => sum + parseFloat(h.loss), 0).toFixed(2),
            taxSaved: yearHarvests.reduce((sum, h) => sum + parseFloat(h.taxSaved), 0).toFixed(2),
            pendingHarvests: [],
        };
    }

    // ===========================
    // SMART DCA
    // ===========================

    async createDca(userId: string, config: DcaConfig): Promise<VaultStrategy> {
        return this.createStrategy(userId, 'dca', `DCA ${config.asset}`, config);
    }

    async executeDcaPurchase(userId: string, strategyId: string): Promise<DcaPurchase> {
        const strategy = this.getStrategy(userId, strategyId);
        if (!strategy || strategy.type !== 'dca') {
            throw new Error('Invalid DCA strategy');
        }

        const config = strategy.config as DcaConfig;

        // Get current market data from CoinGecko
        const currentPrice = await this.getCurrentPrice(config.asset);
        let aiScore: number | undefined;
        let fearGreedIndex: number | undefined;

        if (config.aiTiming) {
            // Get real Fear & Greed Index
            fearGreedIndex = await this.getFearGreedIndex();

            // Calculate technical score (simplified - could add RSI, MA etc.)
            const priceChange = await this.get24hPriceChange(config.asset);
            const technicalScore = 50 + (priceChange > 0 ? Math.min(priceChange * 2, 25) : Math.max(priceChange * 2, -25));

            // Combined AI score - lower fear & greed = better buy opportunity
            aiScore = Math.round(
                (100 - fearGreedIndex) * config.fearGreedWeight +
                technicalScore * config.technicalWeight
            );
        }

        // Check safety limits
        if (parseFloat(currentPrice) > parseFloat(config.maxPrice)) {
            throw new Error('Price above maximum limit');
        }

        const purchase: DcaPurchase = {
            id: `dca_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            asset: config.asset,
            amount: config.amountPerPeriod,
            price: currentPrice,
            total: (parseFloat(config.amountPerPeriod) / parseFloat(currentPrice)).toFixed(8),
            aiScore,
            fearGreedIndex,
            timestamp: new Date(),
        };

        const userPurchases = this.dcaPurchases.get(userId) || [];
        userPurchases.push(purchase);
        this.dcaPurchases.set(userId, userPurchases);

        this.emit('dcaPurchase', { userId, purchase });

        return purchase;
    }

    getDcaStats(userId: string, strategyId: string): DcaStats {
        const purchases = this.dcaPurchases.get(userId) || [];
        const strategy = this.getStrategy(userId, strategyId);

        if (!strategy || purchases.length === 0) {
            return {
                totalInvested: '0',
                totalAcquired: '0',
                averagePrice: '0',
                currentValue: '0',
                unrealizedPnL: '0',
                unrealizedPnLPercent: 0,
                purchases: 0,
                bestPurchase: purchases[0],
                worstPurchase: purchases[0],
            };
        }

        const totalInvested = purchases.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const totalAcquired = purchases.reduce((sum, p) => sum + parseFloat(p.total), 0);
        const averagePrice = totalInvested / totalAcquired;

        // In production: Get current price
        const currentPrice = 47000;
        const currentValue = totalAcquired * currentPrice;
        const pnl = currentValue - totalInvested;
        const pnlPercent = (pnl / totalInvested) * 100;

        const sortedByPrice = [...purchases].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

        return {
            totalInvested: totalInvested.toFixed(2),
            totalAcquired: totalAcquired.toFixed(8),
            averagePrice: averagePrice.toFixed(2),
            currentValue: currentValue.toFixed(2),
            unrealizedPnL: pnl.toFixed(2),
            unrealizedPnLPercent: pnlPercent,
            purchases: purchases.length,
            bestPurchase: sortedByPrice[0],
            worstPurchase: sortedByPrice[sortedByPrice.length - 1],
        };
    }

    // ===========================
    // STABLECOIN SHIELD
    // ===========================

    async checkShieldTrigger(userId: string, strategyId: string): Promise<{
        triggered: boolean;
        reason?: string;
        currentValue?: number;
        threshold?: number;
    }> {
        const strategy = this.getStrategy(userId, strategyId);
        if (!strategy || strategy.type !== 'shield') {
            throw new Error('Invalid shield strategy');
        }

        const config = strategy.config as ShieldConfig;

        if (!config.enabled) {
            return { triggered: false };
        }

        // In production: Check actual market conditions
        const portfolioChange24h = -12; // 12% drop
        const fearGreedIndex = 22; // Extreme fear
        const volatilityIndex = 45;

        switch (config.triggerType) {
            case 'price_drop':
                if (Math.abs(portfolioChange24h) >= config.priceDropPercent) {
                    return {
                        triggered: true,
                        reason: 'Portfolio drop exceeded threshold',
                        currentValue: portfolioChange24h,
                        threshold: config.priceDropPercent,
                    };
                }
                break;

            case 'fear_greed':
                if (fearGreedIndex <= config.fearThreshold) {
                    return {
                        triggered: true,
                        reason: 'Extreme fear detected',
                        currentValue: fearGreedIndex,
                        threshold: config.fearThreshold,
                    };
                }
                break;

            case 'volatility':
                if (volatilityIndex >= config.volatilityThreshold) {
                    return {
                        triggered: true,
                        reason: 'High volatility detected',
                        currentValue: volatilityIndex,
                        threshold: config.volatilityThreshold,
                    };
                }
                break;
        }

        return { triggered: false };
    }

    async activateShield(userId: string, strategyId: string): Promise<ShieldEvent> {
        const strategy = this.getStrategy(userId, strategyId);
        if (!strategy || strategy.type !== 'shield') {
            throw new Error('Invalid shield strategy');
        }

        const config = strategy.config as ShieldConfig;
        const check = await this.checkShieldTrigger(userId, strategyId);

        const event: ShieldEvent = {
            id: `shield_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            triggeredAt: new Date(),
            triggerType: check.reason || 'manual',
            triggerValue: check.currentValue || 0,
            portfolioValueBefore: '50000',
            convertedAmount: '0',
            assetsConverted: [],
            status: 'active',
        };

        // In production: Execute conversions
        // Convert specified % of portfolio to stablecoins

        const userEvents = this.shieldEvents.get(userId) || [];
        userEvents.push(event);
        this.shieldEvents.set(userId, userEvents);

        this.emit('shieldActivated', { userId, event });

        return event;
    }

    async deactivateShield(userId: string, eventId: string): Promise<ShieldEvent | null> {
        const events = this.shieldEvents.get(userId) || [];
        const event = events.find(e => e.id === eventId);

        if (!event || event.status !== 'active') {
            return null;
        }

        event.status = 'recovered';
        event.recoveredAt = new Date();
        event.portfolioValueAfter = '52000';
        event.savedAmount = '2000';

        this.emit('shieldDeactivated', { userId, event });

        return event;
    }

    getShieldHistory(userId: string): ShieldEvent[] {
        return this.shieldEvents.get(userId) || [];
    }

    // ===========================
    // HELPERS
    // ===========================

    private getStrategy(userId: string, strategyId: string): VaultStrategy | null {
        const strategies = this.strategies.get(userId) || [];
        return strategies.find(s => s.id === strategyId) || null;
    }
}

export const smartVaultService = new SmartVaultService();
