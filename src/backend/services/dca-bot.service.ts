/**
 * DCA Bot Service - Dollar Cost Averaging Automation
 * 
 * Features:
 * - Automated recurring purchases
 * - Multiple frequency options (hourly, daily, weekly, monthly)
 * - Smart timing (buy during dips)
 * - Portfolio-weighted DCA
 * - Performance tracking
 */

import { EventEmitter } from 'events';

type DCAFrequency = 'hourly' | 'every_4h' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
type DCAStatus = 'active' | 'paused' | 'completed' | 'cancelled';

interface DCAStrategyConfig {
    type: 'fixed' | 'smart_dip' | 'value_average';
    dipThreshold?: number; // For smart_dip - % below moving average to trigger
    targetValue?: number; // For value_average - target portfolio value per period
}

interface DCAPlan {
    id: string;
    userId: string;
    chainId: number;
    tokenAddress: string;
    tokenSymbol: string;
    sourceToken: string; // Usually stablecoin
    amountPerPurchase: string;
    frequency: DCAFrequency;
    strategy: DCAStrategyConfig;
    totalBudget?: string; // Optional max budget
    startDate: Date;
    endDate?: Date;
    status: DCAStatus;
    nextPurchaseAt: Date;
    purchases: DCAPurchase[];
    createdAt: Date;
    updatedAt: Date;
}

interface DCAPurchase {
    id: string;
    planId: string;
    amount: string;
    tokenAmount: string;
    price: string;
    txHash?: string;
    timestamp: Date;
    status: 'pending' | 'completed' | 'failed';
    error?: string;
}

interface DCAStats {
    totalInvested: string;
    totalTokens: string;
    averageCost: string;
    currentValue: string;
    pnl: string;
    pnlPercent: number;
    purchases: number;
    nextPurchase?: Date;
}

const FREQUENCY_MS: Record<DCAFrequency, number> = {
    hourly: 60 * 60 * 1000,
    every_4h: 4 * 60 * 60 * 1000,
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    biweekly: 14 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
};

class DCABotService extends EventEmitter {
    private plans: Map<string, DCAPlan> = new Map();
    private checkInterval: NodeJS.Timeout | null = null;

    constructor() {
        super();
        this.startMonitoring();
    }

    private startMonitoring() {
        // Check plans every minute
        this.checkInterval = setInterval(() => this.checkPlans(), 60000);
    }

    async createPlan(params: {
        userId: string;
        chainId: number;
        tokenAddress: string;
        tokenSymbol: string;
        sourceToken?: string;
        amountPerPurchase: string;
        frequency: DCAFrequency;
        strategy?: DCAStrategyConfig;
        totalBudget?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<DCAPlan> {
        const id = `dca_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();

        const plan: DCAPlan = {
            id,
            userId: params.userId,
            chainId: params.chainId,
            tokenAddress: params.tokenAddress,
            tokenSymbol: params.tokenSymbol,
            sourceToken: params.sourceToken || 'USDC',
            amountPerPurchase: params.amountPerPurchase,
            frequency: params.frequency,
            strategy: params.strategy || { type: 'fixed' },
            totalBudget: params.totalBudget,
            startDate: params.startDate || now,
            endDate: params.endDate,
            status: 'active',
            nextPurchaseAt: this.calculateNextPurchase(params.startDate || now, params.frequency),
            purchases: [],
            createdAt: now,
            updatedAt: now,
        };

        this.plans.set(id, plan);
        this.emit('planCreated', plan);

        return plan;
    }

    private calculateNextPurchase(from: Date, frequency: DCAFrequency): Date {
        const interval = FREQUENCY_MS[frequency];
        return new Date(from.getTime() + interval);
    }

    private async checkPlans() {
        const now = new Date();

        for (const [id, plan] of this.plans) {
            if (plan.status !== 'active') continue;

            // Check if plan has ended
            if (plan.endDate && now > plan.endDate) {
                plan.status = 'completed';
                this.emit('planCompleted', plan);
                continue;
            }

            // Check if it's time to purchase
            if (now >= plan.nextPurchaseAt) {
                await this.executePurchase(plan);
            }
        }
    }

    private async executePurchase(plan: DCAPlan) {
        const purchase: DCAPurchase = {
            id: `purchase_${Date.now()}`,
            planId: plan.id,
            amount: plan.amountPerPurchase,
            tokenAmount: '0',
            price: '0',
            timestamp: new Date(),
            status: 'pending',
        };

        try {
            // Check strategy
            if (plan.strategy.type === 'smart_dip') {
                const shouldBuy = await this.checkDipCondition(plan);
                if (!shouldBuy) {
                    // Skip this purchase, reschedule
                    plan.nextPurchaseAt = this.calculateNextPurchase(new Date(), plan.frequency);
                    return;
                }
            }

            // Get current price
            const price = await this.getTokenPrice(plan.tokenAddress, plan.chainId);
            const tokenAmount = (parseFloat(plan.amountPerPurchase) / parseFloat(price)).toFixed(6);

            purchase.price = price;
            purchase.tokenAmount = tokenAmount;
            purchase.status = 'completed';
            purchase.txHash = `0x${Math.random().toString(16).substr(2, 64)}`; // Mock tx

            plan.purchases.push(purchase);
            plan.nextPurchaseAt = this.calculateNextPurchase(new Date(), plan.frequency);
            plan.updatedAt = new Date();

            // Check total budget
            if (plan.totalBudget) {
                const totalSpent = plan.purchases.reduce(
                    (sum, p) => sum + parseFloat(p.amount), 0
                );
                if (totalSpent >= parseFloat(plan.totalBudget)) {
                    plan.status = 'completed';
                    this.emit('planCompleted', plan);
                }
            }

            this.emit('purchaseCompleted', { plan, purchase });
        } catch (error: any) {
            purchase.status = 'failed';
            purchase.error = error.message;
            plan.purchases.push(purchase);
            this.emit('purchaseFailed', { plan, purchase, error });
        }
    }

    private async checkDipCondition(plan: DCAPlan): Promise<boolean> {
        // Check if current price is below moving average
        const currentPrice = await this.getTokenPrice(plan.tokenAddress, plan.chainId);
        const threshold = plan.strategy.dipThreshold || 5;

        // Mock: 50% chance of detecting a dip
        return Math.random() > 0.5;
    }

    private async getTokenPrice(tokenAddress: string, chainId: number): Promise<string> {
        // Mock price - in production would fetch from DEX/API
        return (1000 + Math.random() * 200).toFixed(2);
    }

    pausePlan(planId: string, userId: string): boolean {
        const plan = this.plans.get(planId);
        if (!plan || plan.userId !== userId || plan.status !== 'active') return false;

        plan.status = 'paused';
        plan.updatedAt = new Date();
        this.emit('planPaused', plan);
        return true;
    }

    resumePlan(planId: string, userId: string): boolean {
        const plan = this.plans.get(planId);
        if (!plan || plan.userId !== userId || plan.status !== 'paused') return false;

        plan.status = 'active';
        plan.nextPurchaseAt = this.calculateNextPurchase(new Date(), plan.frequency);
        plan.updatedAt = new Date();
        this.emit('planResumed', plan);
        return true;
    }

    cancelPlan(planId: string, userId: string): boolean {
        const plan = this.plans.get(planId);
        if (!plan || plan.userId !== userId) return false;

        plan.status = 'cancelled';
        plan.updatedAt = new Date();
        this.emit('planCancelled', plan);
        return true;
    }

    getPlans(userId: string, status?: DCAStatus): DCAPlan[] {
        let plans = Array.from(this.plans.values())
            .filter(p => p.userId === userId);

        if (status) {
            plans = plans.filter(p => p.status === status);
        }

        return plans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    getPlanStats(planId: string): DCAStats | null {
        const plan = this.plans.get(planId);
        if (!plan) return null;

        const completedPurchases = plan.purchases.filter(p => p.status === 'completed');

        if (completedPurchases.length === 0) {
            return {
                totalInvested: '$0',
                totalTokens: '0',
                averageCost: '$0',
                currentValue: '$0',
                pnl: '$0',
                pnlPercent: 0,
                purchases: 0,
                nextPurchase: plan.status === 'active' ? plan.nextPurchaseAt : undefined,
            };
        }

        const totalInvested = completedPurchases.reduce(
            (sum, p) => sum + parseFloat(p.amount), 0
        );
        const totalTokens = completedPurchases.reduce(
            (sum, p) => sum + parseFloat(p.tokenAmount), 0
        );
        const averageCost = totalInvested / totalTokens;

        // Mock current price
        const currentPrice = 1150; // Would fetch actual
        const currentValue = totalTokens * currentPrice;
        const pnl = currentValue - totalInvested;
        const pnlPercent = (pnl / totalInvested) * 100;

        return {
            totalInvested: `$${totalInvested.toFixed(2)}`,
            totalTokens: totalTokens.toFixed(6),
            averageCost: `$${averageCost.toFixed(2)}`,
            currentValue: `$${currentValue.toFixed(2)}`,
            pnl: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
            pnlPercent,
            purchases: completedPurchases.length,
            nextPurchase: plan.status === 'active' ? plan.nextPurchaseAt : undefined,
        };
    }

    // Quick DCA presets
    async createQuickPlan(
        userId: string,
        chainId: number,
        preset: 'btc_weekly' | 'eth_daily' | 'portfolio_balanced'
    ): Promise<DCAPlan> {
        const presets = {
            btc_weekly: {
                tokenAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
                tokenSymbol: 'WBTC',
                amountPerPurchase: '50',
                frequency: 'weekly' as DCAFrequency,
            },
            eth_daily: {
                tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
                tokenSymbol: 'ETH',
                amountPerPurchase: '25',
                frequency: 'daily' as DCAFrequency,
            },
            portfolio_balanced: {
                tokenAddress: '0x0000000000000000000000000000000000000000', // Multiple
                tokenSymbol: 'BALANCED',
                amountPerPurchase: '100',
                frequency: 'weekly' as DCAFrequency,
            },
        };

        const preset_config = presets[preset];
        return this.createPlan({
            userId,
            chainId,
            ...preset_config,
        });
    }

    destroy() {
        if (this.checkInterval) clearInterval(this.checkInterval);
    }
}

export const dcaBotService = new DCABotService();
export { DCABotService, DCAPlan, DCAPurchase, DCAStats, DCAFrequency };
