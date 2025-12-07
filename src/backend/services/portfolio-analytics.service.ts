/**
 * Portfolio Analytics Service - Advanced Portfolio Insights
 * 
 * Features:
 * - Real-time portfolio tracking
 * - PnL calculations
 * - Risk metrics
 * - Asset allocation
 * - Performance comparison
 * - Tax reporting data
 */

import { EventEmitter } from 'events';

interface TokenHolding {
    address: string;
    symbol: string;
    name: string;
    balance: string;
    decimals: number;
    price: number;
    value: number;
    change24h: number;
    change7d: number;
    allocation: number;
    avgCost?: number;
    pnl?: number;
    pnlPercent?: number;
}

interface PortfolioSnapshot {
    timestamp: Date;
    totalValue: number;
    tokens: TokenHolding[];
    chainId: number;
}

interface PerformanceMetrics {
    totalValue: number;
    totalCost: number;
    totalPnl: number;
    totalPnlPercent: number;
    dayChange: number;
    dayChangePercent: number;
    weekChange: number;
    weekChangePercent: number;
    monthChange: number;
    monthChangePercent: number;
    allTimeHigh: number;
    allTimeLow: number;
    sharpeRatio?: number;
    volatility?: number;
}

interface RiskMetrics {
    diversificationScore: number; // 0-100
    concentrationRisk: 'low' | 'medium' | 'high';
    largestPosition: { symbol: string; percentage: number };
    stablecoinRatio: number;
    defiExposure: number;
    memeExposure: number;
    riskLevel: 'conservative' | 'moderate' | 'aggressive';
    suggestions: string[];
}

interface AssetAllocation {
    byType: {
        type: string;
        value: number;
        percentage: number;
    }[];
    byChain: {
        chainId: number;
        chainName: string;
        value: number;
        percentage: number;
    }[];
    bySector: {
        sector: string;
        value: number;
        percentage: number;
    }[];
}

interface TaxReport {
    year: number;
    totalGains: number;
    totalLosses: number;
    netGains: number;
    shortTermGains: number;
    longTermGains: number;
    transactions: {
        date: Date;
        type: 'buy' | 'sell' | 'swap';
        asset: string;
        amount: string;
        costBasis: number;
        proceeds: number;
        gain: number;
        holdingPeriod: 'short' | 'long';
    }[];
}

interface ComparisonBenchmark {
    name: string;
    symbol: string;
    performance: number;
    vs_portfolio: number; // outperform/underperform
}

class PortfolioAnalyticsService extends EventEmitter {
    private portfolioCache: Map<string, PortfolioSnapshot[]> = new Map();
    private performanceCache: Map<string, PerformanceMetrics> = new Map();

    async getPortfolio(
        walletAddress: string,
        chainId?: number
    ): Promise<PortfolioSnapshot> {
        // Mock portfolio data
        const tokens: TokenHolding[] = [
            {
                address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                symbol: 'ETH',
                name: 'Ethereum',
                balance: '5.5',
                decimals: 18,
                price: 2450,
                value: 13475,
                change24h: 2.5,
                change7d: 8.3,
                allocation: 45,
                avgCost: 2100,
                pnl: 1925,
                pnlPercent: 16.7,
            },
            {
                address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                symbol: 'USDC',
                name: 'USD Coin',
                balance: '5000',
                decimals: 6,
                price: 1,
                value: 5000,
                change24h: 0,
                change7d: 0,
                allocation: 16.7,
            },
            {
                address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
                symbol: 'WBTC',
                name: 'Wrapped Bitcoin',
                balance: '0.15',
                decimals: 8,
                price: 67000,
                value: 10050,
                change24h: 1.2,
                change7d: 5.5,
                allocation: 33.5,
                avgCost: 62000,
                pnl: 750,
                pnlPercent: 8.1,
            },
            {
                address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
                symbol: 'PEPE',
                name: 'Pepe',
                balance: '100000000',
                decimals: 18,
                price: 0.000015,
                value: 1500,
                change24h: -5.2,
                change7d: 45.3,
                allocation: 5,
                avgCost: 800,
                pnl: 700,
                pnlPercent: 87.5,
            },
        ];

        const totalValue = tokens.reduce((sum, t) => sum + t.value, 0);

        // Recalculate allocations
        tokens.forEach(t => {
            t.allocation = (t.value / totalValue) * 100;
        });

        return {
            timestamp: new Date(),
            totalValue,
            tokens,
            chainId: chainId || 1,
        };
    }

    async getPerformance(
        walletAddress: string,
        timeframe: '24h' | '7d' | '30d' | '90d' | '1y' | 'all' = '30d'
    ): Promise<PerformanceMetrics> {
        const portfolio = await this.getPortfolio(walletAddress);

        // Mock performance metrics
        const totalCost = portfolio.tokens.reduce((sum, t) => {
            return sum + (t.avgCost ? parseFloat(t.balance) * t.avgCost : t.value);
        }, 0);

        const totalPnl = portfolio.totalValue - totalCost;
        const totalPnlPercent = (totalPnl / totalCost) * 100;

        return {
            totalValue: portfolio.totalValue,
            totalCost,
            totalPnl,
            totalPnlPercent,
            dayChange: portfolio.totalValue * 0.025,
            dayChangePercent: 2.5,
            weekChange: portfolio.totalValue * 0.08,
            weekChangePercent: 8.0,
            monthChange: portfolio.totalValue * 0.15,
            monthChangePercent: 15.0,
            allTimeHigh: portfolio.totalValue * 1.2,
            allTimeLow: portfolio.totalValue * 0.4,
            sharpeRatio: 1.8,
            volatility: 0.35,
        };
    }

    async getRiskMetrics(walletAddress: string): Promise<RiskMetrics> {
        const portfolio = await this.getPortfolio(walletAddress);

        // Calculate metrics
        const stableTokens = ['USDC', 'USDT', 'DAI', 'FRAX'];
        const memeTokens = ['PEPE', 'DOGE', 'SHIB', 'FLOKI'];

        const stablecoinValue = portfolio.tokens
            .filter(t => stableTokens.includes(t.symbol))
            .reduce((sum, t) => sum + t.value, 0);

        const memeValue = portfolio.tokens
            .filter(t => memeTokens.includes(t.symbol))
            .reduce((sum, t) => sum + t.value, 0);

        const largestPosition = portfolio.tokens.reduce(
            (max, t) => t.allocation > max.percentage ? { symbol: t.symbol, percentage: t.allocation } : max,
            { symbol: '', percentage: 0 }
        );

        // Diversification score based on number of assets and concentration
        const numAssets = portfolio.tokens.length;
        const concentrationPenalty = largestPosition.percentage > 50 ? 30 : largestPosition.percentage > 30 ? 15 : 0;
        const diversificationScore = Math.min(100, numAssets * 10 + 30 - concentrationPenalty);

        const suggestions: string[] = [];
        if (stablecoinValue / portfolio.totalValue < 0.1) {
            suggestions.push('Consider increasing stablecoin allocation for risk management');
        }
        if (largestPosition.percentage > 40) {
            suggestions.push(`High concentration in ${largestPosition.symbol} - consider rebalancing`);
        }
        if (memeValue / portfolio.totalValue > 0.2) {
            suggestions.push('High meme token exposure - high risk of volatility');
        }

        return {
            diversificationScore,
            concentrationRisk: largestPosition.percentage > 50 ? 'high' : largestPosition.percentage > 30 ? 'medium' : 'low',
            largestPosition,
            stablecoinRatio: stablecoinValue / portfolio.totalValue,
            defiExposure: 0.35, // Mock
            memeExposure: memeValue / portfolio.totalValue,
            riskLevel: diversificationScore > 70 ? 'conservative' : diversificationScore > 40 ? 'moderate' : 'aggressive',
            suggestions,
        };
    }

    async getAssetAllocation(walletAddress: string): Promise<AssetAllocation> {
        const portfolio = await this.getPortfolio(walletAddress);

        // Categorize tokens
        const typeMap: Record<string, string> = {
            'ETH': 'Layer 1',
            'WBTC': 'Layer 1',
            'USDC': 'Stablecoin',
            'USDT': 'Stablecoin',
            'DAI': 'Stablecoin',
            'PEPE': 'Meme',
            'UNI': 'DeFi',
            'AAVE': 'DeFi',
            'ARB': 'Layer 2',
            'OP': 'Layer 2',
        };

        const byType: Record<string, number> = {};
        portfolio.tokens.forEach(t => {
            const type = typeMap[t.symbol] || 'Other';
            byType[type] = (byType[type] || 0) + t.value;
        });

        return {
            byType: Object.entries(byType).map(([type, value]) => ({
                type,
                value,
                percentage: (value / portfolio.totalValue) * 100,
            })),
            byChain: [
                { chainId: 1, chainName: 'Ethereum', value: portfolio.totalValue * 0.7, percentage: 70 },
                { chainId: 42161, chainName: 'Arbitrum', value: portfolio.totalValue * 0.2, percentage: 20 },
                { chainId: 137, chainName: 'Polygon', value: portfolio.totalValue * 0.1, percentage: 10 },
            ],
            bySector: [
                { sector: 'Infrastructure', value: portfolio.totalValue * 0.5, percentage: 50 },
                { sector: 'DeFi', value: portfolio.totalValue * 0.25, percentage: 25 },
                { sector: 'Stablecoins', value: portfolio.totalValue * 0.15, percentage: 15 },
                { sector: 'Speculative', value: portfolio.totalValue * 0.1, percentage: 10 },
            ],
        };
    }

    async compareToBenchmarks(walletAddress: string): Promise<ComparisonBenchmark[]> {
        const performance = await this.getPerformance(walletAddress, '30d');

        return [
            {
                name: 'Bitcoin',
                symbol: 'BTC',
                performance: 12.5,
                vs_portfolio: performance.monthChangePercent - 12.5,
            },
            {
                name: 'Ethereum',
                symbol: 'ETH',
                performance: 18.3,
                vs_portfolio: performance.monthChangePercent - 18.3,
            },
            {
                name: 'S&P 500',
                symbol: 'SPY',
                performance: 3.2,
                vs_portfolio: performance.monthChangePercent - 3.2,
            },
            {
                name: 'DeFi Index',
                symbol: 'DPI',
                performance: 22.5,
                vs_portfolio: performance.monthChangePercent - 22.5,
            },
        ];
    }

    async generateTaxReport(
        walletAddress: string,
        year: number
    ): Promise<TaxReport> {
        // Mock tax report
        return {
            year,
            totalGains: 5420,
            totalLosses: 1230,
            netGains: 4190,
            shortTermGains: 2890,
            longTermGains: 1300,
            transactions: [
                {
                    date: new Date(`${year}-03-15`),
                    type: 'sell',
                    asset: 'ETH',
                    amount: '2.0',
                    costBasis: 3200,
                    proceeds: 4800,
                    gain: 1600,
                    holdingPeriod: 'short',
                },
                {
                    date: new Date(`${year}-06-20`),
                    type: 'swap',
                    asset: 'USDC → ETH',
                    amount: '5000',
                    costBasis: 5000,
                    proceeds: 5850,
                    gain: 850,
                    holdingPeriod: 'short',
                },
            ],
        };
    }

    async getHistoricalValue(
        walletAddress: string,
        timeframe: '7d' | '30d' | '90d' | '1y'
    ): Promise<{ date: Date; value: number }[]> {
        const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[timeframe];
        const portfolio = await this.getPortfolio(walletAddress);

        // Generate mock historical data
        const data: { date: Date; value: number }[] = [];
        let currentValue = portfolio.totalValue;

        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            // Add some variance
            const variance = (Math.random() - 0.5) * 0.05;
            currentValue = currentValue * (1 + variance);

            data.push({ date, value: currentValue });
        }

        return data;
    }
}

export const portfolioAnalyticsService = new PortfolioAnalyticsService();
export {
    PortfolioAnalyticsService,
    TokenHolding,
    PortfolioSnapshot,
    PerformanceMetrics,
    RiskMetrics,
    AssetAllocation,
    TaxReport,
};
