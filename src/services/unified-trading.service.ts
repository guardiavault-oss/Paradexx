/**
 * Unified Trading Service - Complete trading functionality
 * Connects to backend APIs for real trading operations
 */

import { apiClient, ApiResponse } from './api-client';
import { SERVICE_ENDPOINTS, API_ROUTES, SUPPORTED_CHAINS } from './config';

// ============================================================
// TYPES
// ============================================================

export interface Token {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
    balance?: string;
    balanceUSD?: number;
}

export interface SwapQuote {
    aggregator: string;
    name: string;
    toAmount: string;
    estimatedGas?: string;
    gasCostUSD?: string;
    priceImpact?: number;
    route?: SwapRoute[];
}

export interface SwapRoute {
    protocol: string;
    fromToken: string;
    toToken: string;
    percentage?: number;
}

export interface SwapParams {
    fromToken: string;
    toToken: string;
    amount: string;
    chainId?: number;
    userAddress: string;
    slippage?: number;
}

export interface LimitOrder {
    id: string;
    userId: string;
    chainId: number;
    type: 'buy' | 'sell';
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    triggerPrice: string;
    limitPrice?: string;
    status: 'pending' | 'executed' | 'cancelled' | 'expired';
    createdAt: string;
    executedAt?: string;
}

export interface DCAplan {
    id: string;
    userId: string;
    chainId: number;
    tokenAddress: string;
    tokenSymbol: string;
    sourceToken: string;
    amountPerPurchase: string;
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    strategy: 'fixed' | 'value_averaging' | 'dip_buying';
    totalBudget?: string;
    totalPurchased: string;
    purchaseCount: number;
    averagePrice: string;
    status: 'active' | 'paused' | 'completed' | 'cancelled';
    nextPurchase?: string;
}

export interface TradeHistory {
    id: string;
    type: 'swap' | 'limit' | 'dca' | 'sniper';
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    price: string;
    transactionHash: string;
    status: 'success' | 'failed' | 'pending';
    timestamp: string;
    gasCost?: string;
}

// ============================================================
// UNIFIED TRADING SERVICE
// ============================================================

class UnifiedTradingService {
    // ========== SWAP OPERATIONS ==========

    /**
     * Get swap quotes from all DEX aggregators
     */
    async getSwapQuotes(params: SwapParams): Promise<SwapQuote[]> {
        try {
            const response = await apiClient.post<ApiResponse<{ quotes: SwapQuote[]; bestQuote: SwapQuote }>>(
                API_ROUTES.SWAPS.AGGREGATORS,
                {
                    fromToken: params.fromToken,
                    toToken: params.toToken,
                    amount: params.amount,
                    chainId: params.chainId || 1,
                    userAddress: params.userAddress,
                    slippage: params.slippage || 1,
                }
            );
            return response.data.data?.quotes || [];
        } catch (error: any) {
            console.error('Error getting swap quotes:', error);
            throw new Error(error.response?.data?.error || 'Failed to get swap quotes');
        }
    }

    /**
     * Get best swap quote
     */
    async getBestQuote(params: SwapParams): Promise<SwapQuote | null> {
        const quotes = await this.getSwapQuotes(params);
        return quotes[0] || null;
    }

    /**
     * Build swap transaction
     */
    async buildSwapTransaction(params: {
        aggregator: string;
        fromToken: string;
        toToken: string;
        amount: string;
        chainId: number;
        userAddress: string;
        slippage?: number;
    }): Promise<{ to: string; data: string; value: string; gasLimit: string }> {
        try {
            const response = await apiClient.post<ApiResponse<{ transaction: any }>>(
                API_ROUTES.SWAPS.BUILD_TX,
                params
            );
            return response.data.data?.transaction;
        } catch (error: any) {
            console.error('Error building swap transaction:', error);
            throw new Error(error.response?.data?.error || 'Failed to build swap transaction');
        }
    }

    /**
     * Execute swap with MEV protection
     */
    async executeSwap(params: SwapParams & { useMEVProtection?: boolean }): Promise<{
        hash: string;
        status: string;
        fromAmount: string;
        toAmount: string;
    }> {
        try {
            // First get the best quote
            const quote = await this.getBestQuote(params);
            if (!quote) {
                throw new Error('No quotes available');
            }

            // Build transaction
            const tx = await this.buildSwapTransaction({
                aggregator: quote.aggregator,
                fromToken: params.fromToken,
                toToken: params.toToken,
                amount: params.amount,
                chainId: params.chainId || 1,
                userAddress: params.userAddress,
                slippage: params.slippage,
            });

            // If MEV protection enabled, route through Flashbots
            if (params.useMEVProtection) {
                const response = await apiClient.post<ApiResponse<any>>(
                    API_ROUTES.MEV_GUARD.PROTECT,
                    {
                        transaction: tx,
                        chainId: params.chainId || 1,
                    }
                );
                return response.data.data;
            }

            // Execute directly via wallet service
            const response = await apiClient.post<ApiResponse<any>>(
                '/api/wallet/send-transaction',
                {
                    ...tx,
                    chainId: params.chainId || 1,
                }
            );
            return response.data.data;
        } catch (error: any) {
            console.error('Error executing swap:', error);
            throw new Error(error.response?.data?.error || 'Failed to execute swap');
        }
    }

    // ========== LIMIT ORDERS ==========

    /**
     * Create limit order
     */
    async createLimitOrder(params: {
        chainId: number;
        type: 'buy' | 'sell';
        tokenIn: string;
        tokenOut: string;
        amountIn: string;
        triggerPrice: string;
        limitPrice?: string;
        slippage?: number;
        expiresIn?: number;
    }): Promise<LimitOrder> {
        try {
            const response = await apiClient.post<ApiResponse<{ order: LimitOrder }>>(
                API_ROUTES.TRADING.ORDERS,
                params
            );
            return response.data.data!.order;
        } catch (error: any) {
            console.error('Error creating limit order:', error);
            throw new Error(error.response?.data?.error || 'Failed to create limit order');
        }
    }

    /**
     * Create OCO (One-Cancels-Other) order
     */
    async createOCOOrder(params: {
        chainId: number;
        tokenIn: string;
        tokenOut: string;
        amountIn: string;
        takeProfitPrice: string;
        stopLossPrice: string;
        slippage?: number;
    }): Promise<LimitOrder[]> {
        try {
            const response = await apiClient.post<ApiResponse<{ orders: LimitOrder[] }>>(
                API_ROUTES.TRADING.ORDERS_OCO,
                params
            );
            return response.data.data!.orders;
        } catch (error: any) {
            console.error('Error creating OCO order:', error);
            throw new Error(error.response?.data?.error || 'Failed to create OCO order');
        }
    }

    /**
     * Create trailing stop order
     */
    async createTrailingStop(params: {
        chainId: number;
        tokenIn: string;
        tokenOut: string;
        amountIn: string;
        trailingPercent: number;
        slippage?: number;
    }): Promise<LimitOrder> {
        try {
            const response = await apiClient.post<ApiResponse<{ order: LimitOrder }>>(
                API_ROUTES.TRADING.ORDERS_TRAILING,
                params
            );
            return response.data.data!.order;
        } catch (error: any) {
            console.error('Error creating trailing stop:', error);
            throw new Error(error.response?.data?.error || 'Failed to create trailing stop');
        }
    }

    /**
     * Get user's limit orders
     */
    async getLimitOrders(status?: 'pending' | 'executed' | 'cancelled'): Promise<LimitOrder[]> {
        try {
            const params = status ? `?status=${status}` : '';
            const response = await apiClient.get<ApiResponse<{ orders: LimitOrder[] }>>(
                `${API_ROUTES.TRADING.ORDERS}${params}`
            );
            return response.data.data?.orders || [];
        } catch (error: any) {
            console.error('Error getting limit orders:', error);
            return [];
        }
    }

    /**
     * Cancel limit order
     */
    async cancelLimitOrder(orderId: string): Promise<boolean> {
        try {
            await apiClient.delete(`${API_ROUTES.TRADING.ORDERS}/${orderId}`);
            return true;
        } catch (error: any) {
            console.error('Error cancelling order:', error);
            return false;
        }
    }

    // ========== DCA (Dollar Cost Averaging) ==========

    /**
     * Create DCA plan
     */
    async createDCAPlan(params: {
        chainId: number;
        tokenAddress: string;
        tokenSymbol: string;
        sourceToken?: string;
        amountPerPurchase: string;
        frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
        strategy?: 'fixed' | 'value_averaging' | 'dip_buying';
        totalBudget?: string;
        endDate?: string;
    }): Promise<DCAplan> {
        try {
            const response = await apiClient.post<ApiResponse<{ plan: DCAplan }>>(
                API_ROUTES.TRADING.DCA,
                params
            );
            return response.data.data!.plan;
        } catch (error: any) {
            console.error('Error creating DCA plan:', error);
            throw new Error(error.response?.data?.error || 'Failed to create DCA plan');
        }
    }

    /**
     * Get user's DCA plans
     */
    async getDCAPlans(status?: 'active' | 'paused' | 'completed' | 'cancelled'): Promise<DCAplan[]> {
        try {
            const params = status ? `?status=${status}` : '';
            const response = await apiClient.get<ApiResponse<{ plans: DCAplan[] }>>(
                `${API_ROUTES.TRADING.DCA}${params}`
            );
            return response.data.data?.plans || [];
        } catch (error: any) {
            console.error('Error getting DCA plans:', error);
            return [];
        }
    }

    /**
     * Pause DCA plan
     */
    async pauseDCAPlan(planId: string): Promise<boolean> {
        try {
            await apiClient.post(`${API_ROUTES.TRADING.DCA}/${planId}/pause`);
            return true;
        } catch (error: any) {
            console.error('Error pausing DCA plan:', error);
            return false;
        }
    }

    /**
     * Resume DCA plan
     */
    async resumeDCAPlan(planId: string): Promise<boolean> {
        try {
            await apiClient.post(`${API_ROUTES.TRADING.DCA}/${planId}/resume`);
            return true;
        } catch (error: any) {
            console.error('Error resuming DCA plan:', error);
            return false;
        }
    }

    /**
     * Cancel DCA plan
     */
    async cancelDCAPlan(planId: string): Promise<boolean> {
        try {
            await apiClient.delete(`${API_ROUTES.TRADING.DCA}/${planId}`);
            return true;
        } catch (error: any) {
            console.error('Error cancelling DCA plan:', error);
            return false;
        }
    }

    // ========== PRICE ALERTS ==========

    /**
     * Create price alert
     */
    async createPriceAlert(params: {
        tokenAddress: string;
        tokenSymbol: string;
        targetPrice: number;
        direction: 'above' | 'below';
    }): Promise<any> {
        try {
            const response = await apiClient.post<ApiResponse<{ alert: any }>>(
                API_ROUTES.TRADING.ALERTS,
                params
            );
            return response.data.data?.alert;
        } catch (error: any) {
            console.error('Error creating price alert:', error);
            throw new Error(error.response?.data?.error || 'Failed to create price alert');
        }
    }

    /**
     * Get user's price alerts
     */
    async getPriceAlerts(): Promise<any[]> {
        try {
            const response = await apiClient.get<ApiResponse<{ alerts: any[] }>>(
                API_ROUTES.TRADING.ALERTS
            );
            return response.data.data?.alerts || [];
        } catch (error: any) {
            console.error('Error getting price alerts:', error);
            return [];
        }
    }

    /**
     * Delete price alert
     */
    async deletePriceAlert(alertId: string): Promise<boolean> {
        try {
            await apiClient.delete(`${API_ROUTES.TRADING.ALERTS}/${alertId}`);
            return true;
        } catch (error: any) {
            console.error('Error deleting price alert:', error);
            return false;
        }
    }

    // ========== TRADE HISTORY ==========

    /**
     * Get trading history
     */
    async getTradeHistory(params?: {
        type?: 'swap' | 'limit' | 'dca' | 'sniper';
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<{ trades: TradeHistory[]; total: number; page: number }> {
        try {
            const searchParams = new URLSearchParams();
            if (params?.type) searchParams.append('type', params.type);
            if (params?.startDate) searchParams.append('startDate', params.startDate);
            if (params?.endDate) searchParams.append('endDate', params.endDate);
            if (params?.page) searchParams.append('page', params.page.toString());
            if (params?.limit) searchParams.append('limit', params.limit.toString());

            const response = await apiClient.get<ApiResponse<{ trades: TradeHistory[]; total: number; page: number }>>(
                `/api/trading/history?${searchParams}`
            );
            return response.data.data || { trades: [], total: 0, page: 1 };
        } catch (error: any) {
            console.error('Error getting trade history:', error);
            return { trades: [], total: 0, page: 1 };
        }
    }

    // ========== TRADING STATS ==========

    /**
     * Get trading statistics
     */
    async getTradingStats(): Promise<{
        totalTrades: number;
        totalVolume: number;
        totalProfit: number;
        winRate: number;
        averageTradeSize: number;
        bestTrade: TradeHistory | null;
        worstTrade: TradeHistory | null;
    }> {
        try {
            const response = await apiClient.get<ApiResponse<any>>(API_ROUTES.TRADING.ORDERS_STATS);
            return response.data.data;
        } catch (error: any) {
            console.error('Error getting trading stats:', error);
            return {
                totalTrades: 0,
                totalVolume: 0,
                totalProfit: 0,
                winRate: 0,
                averageTradeSize: 0,
                bestTrade: null,
                worstTrade: null,
            };
        }
    }

    // ========== MARKET DATA ==========

    /**
     * Get token price
     */
    async getTokenPrice(tokenAddress: string, chainId: number = 1): Promise<{
        price: number;
        change24h: number;
        volume24h: number;
        marketCap: number;
    }> {
        try {
            const response = await apiClient.get<ApiResponse<any>>(
                `${API_ROUTES.MARKET.TOKEN_INFO}/${tokenAddress}?chainId=${chainId}`
            );
            return response.data.data;
        } catch (error: any) {
            console.error('Error getting token price:', error);
            return { price: 0, change24h: 0, volume24h: 0, marketCap: 0 };
        }
    }

    /**
     * Get trending tokens
     */
    async getTrendingTokens(chainId: number = 1): Promise<Token[]> {
        try {
            const response = await apiClient.get<ApiResponse<{ tokens: Token[] }>>(
                `${API_ROUTES.MARKET.TRENDING}?chainId=${chainId}`
            );
            return response.data.data?.tokens || [];
        } catch (error: any) {
            console.error('Error getting trending tokens:', error);
            return [];
        }
    }

    /**
     * Get price chart data
     */
    async getPriceChart(params: {
        tokenAddress: string;
        chainId?: number;
        interval: '1h' | '4h' | '1d' | '1w' | '1m';
        limit?: number;
    }): Promise<Array<{ timestamp: number; open: number; high: number; low: number; close: number; volume: number }>> {
        try {
            const response = await apiClient.get<ApiResponse<any>>(
                `${API_ROUTES.MARKET.CHART}/${params.tokenAddress}?chainId=${params.chainId || 1}&interval=${params.interval}&limit=${params.limit || 100}`
            );
            return response.data.data?.candles || [];
        } catch (error: any) {
            console.error('Error getting price chart:', error);
            return [];
        }
    }
}

// Export singleton instance
export const unifiedTradingService = new UnifiedTradingService();

export default unifiedTradingService;
