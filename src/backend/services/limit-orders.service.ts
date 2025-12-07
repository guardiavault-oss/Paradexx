/**
 * Limit Orders Service - On-chain Limit Orders
 * 
 * Features:
 * - Create limit buy/sell orders
 * - Stop-loss orders
 * - Take-profit orders
 * - Trailing stop orders
 * - OCO (One-Cancels-Other) orders
 * - Time-based order expiration
 */

import { EventEmitter } from 'events';
import { logger } from '../services/logger.service';
import { ethers } from 'ethers';

type OrderType = 'limit_buy' | 'limit_sell' | 'stop_loss' | 'take_profit' | 'trailing_stop';
type OrderStatus = 'pending' | 'active' | 'executed' | 'cancelled' | 'expired' | 'failed';

interface LimitOrder {
    id: string;
    userId: string;
    chainId: number;
    type: OrderType;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    triggerPrice: string;
    limitPrice?: string; // For limit orders, price to execute at
    trailingPercent?: number; // For trailing stops
    currentTrailPrice?: string;
    slippage: number;
    expiresAt?: Date;
    createdAt: Date;
    status: OrderStatus;
    executedAt?: Date;
    executedPrice?: string;
    executedAmount?: string;
    txHash?: string;
    error?: string;
    ocoLinkedOrderId?: string; // For OCO orders
}

interface OrderBook {
    chainId: number;
    tokenPair: string;
    buyOrders: LimitOrder[];
    sellOrders: LimitOrder[];
    lastUpdate: Date;
}

interface PriceAlert {
    id: string;
    userId: string;
    tokenAddress: string;
    tokenSymbol: string;
    targetPrice: string;
    direction: 'above' | 'below';
    active: boolean;
    triggeredAt?: Date;
}

class LimitOrdersService extends EventEmitter {
    private orders: Map<string, LimitOrder> = new Map();
    private priceAlerts: Map<string, PriceAlert> = new Map();
    private priceCache: Map<string, { price: string; timestamp: Date }> = new Map();
    private monitorInterval: NodeJS.Timeout | null = null;

    constructor() {
        super();
        this.startMonitoring();
    }

    private startMonitoring() {
        // Check orders every 5 seconds
        this.monitorInterval = setInterval(() => this.checkOrders(), 5000);
    }

    async createLimitOrder(params: {
        userId: string;
        chainId: number;
        type: OrderType;
        tokenIn: string;
        tokenOut: string;
        amountIn: string;
        triggerPrice: string;
        limitPrice?: string;
        trailingPercent?: number;
        slippage?: number;
        expiresIn?: number; // hours
    }): Promise<LimitOrder> {
        const id = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const order: LimitOrder = {
            id,
            userId: params.userId,
            chainId: params.chainId,
            type: params.type,
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            amountIn: params.amountIn,
            triggerPrice: params.triggerPrice,
            limitPrice: params.limitPrice,
            trailingPercent: params.trailingPercent,
            slippage: params.slippage || 1,
            expiresAt: params.expiresIn
                ? new Date(Date.now() + params.expiresIn * 60 * 60 * 1000)
                : undefined,
            createdAt: new Date(),
            status: 'active',
        };

        this.orders.set(id, order);
        this.emit('orderCreated', order);

        return order;
    }

    async createOCOOrder(params: {
        userId: string;
        chainId: number;
        tokenIn: string;
        tokenOut: string;
        amountIn: string;
        takeProfitPrice: string;
        stopLossPrice: string;
        slippage?: number;
    }): Promise<{ takeProfit: LimitOrder; stopLoss: LimitOrder }> {
        // Create take-profit order
        const takeProfit = await this.createLimitOrder({
            userId: params.userId,
            chainId: params.chainId,
            type: 'take_profit',
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            amountIn: params.amountIn,
            triggerPrice: params.takeProfitPrice,
            slippage: params.slippage,
        });

        // Create stop-loss order
        const stopLoss = await this.createLimitOrder({
            userId: params.userId,
            chainId: params.chainId,
            type: 'stop_loss',
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            amountIn: params.amountIn,
            triggerPrice: params.stopLossPrice,
            slippage: params.slippage,
        });

        // Link them
        takeProfit.ocoLinkedOrderId = stopLoss.id;
        stopLoss.ocoLinkedOrderId = takeProfit.id;

        return { takeProfit, stopLoss };
    }

    async createTrailingStop(params: {
        userId: string;
        chainId: number;
        tokenIn: string;
        tokenOut: string;
        amountIn: string;
        trailingPercent: number; // e.g., 5 for 5%
        slippage?: number;
    }): Promise<LimitOrder> {
        // Get current price
        const currentPrice = await this.getTokenPrice(params.tokenIn, params.chainId);

        // Calculate initial trail price (current price - trailing%)
        const trailPrice = (parseFloat(currentPrice) * (1 - params.trailingPercent / 100)).toString();

        const order = await this.createLimitOrder({
            userId: params.userId,
            chainId: params.chainId,
            type: 'trailing_stop',
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            amountIn: params.amountIn,
            triggerPrice: trailPrice,
            trailingPercent: params.trailingPercent,
            slippage: params.slippage,
        });

        order.currentTrailPrice = trailPrice;

        return order;
    }

    private async getTokenPrice(tokenAddress: string, chainId: number): Promise<string> {
        const cacheKey = `${chainId}-${tokenAddress}`;
        const cached = this.priceCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp.getTime() < 10000) {
            return cached.price;
        }

        // Mock price - in production would fetch from DEX/API
        const mockPrice = (1000 + Math.random() * 100).toFixed(2);
        this.priceCache.set(cacheKey, { price: mockPrice, timestamp: new Date() });

        return mockPrice;
    }

    private async checkOrders() {
        const now = new Date();

        for (const [id, order] of this.orders) {
            if (order.status !== 'active') continue;

            // Check expiration
            if (order.expiresAt && now > order.expiresAt) {
                order.status = 'expired';
                this.emit('orderExpired', order);
                continue;
            }

            try {
                const currentPrice = await this.getTokenPrice(order.tokenIn, order.chainId);
                const triggerPrice = parseFloat(order.triggerPrice);
                const price = parseFloat(currentPrice);

                let shouldExecute = false;

                switch (order.type) {
                    case 'limit_buy':
                        // Execute when price drops to or below trigger
                        shouldExecute = price <= triggerPrice;
                        break;

                    case 'limit_sell':
                    case 'take_profit':
                        // Execute when price rises to or above trigger
                        shouldExecute = price >= triggerPrice;
                        break;

                    case 'stop_loss':
                        // Execute when price drops to or below trigger
                        shouldExecute = price <= triggerPrice;
                        break;

                    case 'trailing_stop':
                        // Update trail price if price moves up
                        const newTrailPrice = price * (1 - (order.trailingPercent || 5) / 100);
                        if (newTrailPrice > parseFloat(order.currentTrailPrice || '0')) {
                            order.currentTrailPrice = newTrailPrice.toString();
                            order.triggerPrice = newTrailPrice.toString();
                        }
                        // Execute if price drops to trail price
                        shouldExecute = price <= parseFloat(order.currentTrailPrice || '0');
                        break;
                }

                if (shouldExecute) {
                    await this.executeOrder(order, currentPrice);
                }
            } catch (error: any) {
                logger.error(`Error checking order ${id}:`, error);
            }
        }
    }

    private async executeOrder(order: LimitOrder, executionPrice: string) {
        order.status = 'executed';
        order.executedAt = new Date();
        order.executedPrice = executionPrice;
        order.executedAmount = order.amountIn; // Simplified

        // Cancel linked OCO order
        if (order.ocoLinkedOrderId) {
            const linkedOrder = this.orders.get(order.ocoLinkedOrderId);
            if (linkedOrder && linkedOrder.status === 'active') {
                linkedOrder.status = 'cancelled';
                this.emit('orderCancelled', linkedOrder);
            }
        }

        this.emit('orderExecuted', order);

        // In production, would actually execute the swap here
        logger.info(`Order ${order.id} executed at price ${executionPrice}`);
    }

    cancelOrder(orderId: string, userId: string): boolean {
        const order = this.orders.get(orderId);
        if (!order || order.userId !== userId || order.status !== 'active') {
            return false;
        }

        order.status = 'cancelled';

        // Cancel linked OCO order too
        if (order.ocoLinkedOrderId) {
            const linkedOrder = this.orders.get(order.ocoLinkedOrderId);
            if (linkedOrder && linkedOrder.status === 'active') {
                linkedOrder.status = 'cancelled';
            }
        }

        this.emit('orderCancelled', order);
        return true;
    }

    getOrders(userId: string, status?: OrderStatus): LimitOrder[] {
        let orders = Array.from(this.orders.values())
            .filter(o => o.userId === userId);

        if (status) {
            orders = orders.filter(o => o.status === status);
        }

        return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    getOrder(orderId: string): LimitOrder | undefined {
        return this.orders.get(orderId);
    }

    // Price Alerts
    async createPriceAlert(params: {
        userId: string;
        tokenAddress: string;
        tokenSymbol: string;
        targetPrice: string;
        direction: 'above' | 'below';
    }): Promise<PriceAlert> {
        const id = `alert_${Date.now()}`;

        const alert: PriceAlert = {
            id,
            userId: params.userId,
            tokenAddress: params.tokenAddress,
            tokenSymbol: params.tokenSymbol,
            targetPrice: params.targetPrice,
            direction: params.direction,
            active: true,
        };

        this.priceAlerts.set(id, alert);
        return alert;
    }

    getPriceAlerts(userId: string): PriceAlert[] {
        return Array.from(this.priceAlerts.values())
            .filter(a => a.userId === userId);
    }

    deletePriceAlert(alertId: string): boolean {
        return this.priceAlerts.delete(alertId);
    }

    getOrderStats(userId: string): {
        totalOrders: number;
        activeOrders: number;
        executedOrders: number;
        successRate: number;
        totalVolume: string;
    } {
        const userOrders = Array.from(this.orders.values())
            .filter(o => o.userId === userId);

        const executed = userOrders.filter(o => o.status === 'executed');
        const failed = userOrders.filter(o => o.status === 'failed');

        return {
            totalOrders: userOrders.length,
            activeOrders: userOrders.filter(o => o.status === 'active').length,
            executedOrders: executed.length,
            successRate: executed.length / Math.max(executed.length + failed.length, 1) * 100,
            totalVolume: '$0', // Would calculate actual volume
        };
    }

    destroy() {
        if (this.monitorInterval) clearInterval(this.monitorInterval);
    }
}

export const limitOrdersService = new LimitOrdersService();
export { LimitOrdersService, LimitOrder, OrderType, OrderStatus, PriceAlert };
