import { apiClient, ApiResponse } from './api-client';
import {
    TradingPair,
    TradeOrder,
    SwapParams,
    SwapQuote,
    PaginatedResponse,
} from '../types/api.types';

// Trading service functions
export const tradingService = {
    // Get all trading pairs
    getTradingPairs: async (): Promise<ApiResponse<TradingPair[]>> => {
        const response = await apiClient.get<ApiResponse<TradingPair[]>>('/api/trading/pairs');
        return response.data;
    },

    // Get specific trading pair
    getTradingPair: async (symbol: string): Promise<ApiResponse<TradingPair>> => {
        const response = await apiClient.get<ApiResponse<TradingPair>>(`/api/trading/pairs/${symbol}`);
        return response.data;
    },

    // Get swap quote
    getSwapQuote: async (params: SwapParams): Promise<ApiResponse<SwapQuote>> => {
        const response = await apiClient.post<ApiResponse<SwapQuote>>('/api/trading/quote', params);
        return response.data;
    },

    // Execute swap
    executeSwap: async (params: SwapParams): Promise<ApiResponse<{ hash: string; txId: string }>> => {
        const response = await apiClient.post<ApiResponse<{ hash: string; txId: string }>>(
            '/api/trading/swap',
            params
        );
        return response.data;
    },

    // Get user orders
    getOrders: async (
        status?: 'pending' | 'filled' | 'cancelled',
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedResponse<TradeOrder>> => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (status) {
            params.append('status', status);
        }

        const response = await apiClient.get<PaginatedResponse<TradeOrder>>(
            `/api/trading/orders?${params}`
        );
        return response.data;
    },

    // Get specific order
    getOrder: async (orderId: string): Promise<ApiResponse<TradeOrder>> => {
        const response = await apiClient.get<ApiResponse<TradeOrder>>(`/api/trading/orders/${orderId}`);
        return response.data;
    },

    // Create limit order
    createLimitOrder: async (order: {
        pair: string;
        type: 'buy' | 'sell';
        amount: string;
        price: string;
    }): Promise<ApiResponse<TradeOrder>> => {
        const response = await apiClient.post<ApiResponse<TradeOrder>>('/api/trading/orders/limit', order);
        return response.data;
    },

    // Create market order
    createMarketOrder: async (order: {
        pair: string;
        type: 'buy' | 'sell';
        amount: string;
    }): Promise<ApiResponse<TradeOrder>> => {
        const response = await apiClient.post<ApiResponse<TradeOrder>>('/api/trading/orders/market', order);
        return response.data;
    },

    // Cancel order
    cancelOrder: async (orderId: string): Promise<ApiResponse> => {
        const response = await apiClient.delete<ApiResponse>(`/api/trading/orders/${orderId}`);
        return response.data;
    },

    // Cancel all orders
    cancelAllOrders: async (pair?: string): Promise<ApiResponse<{ cancelledCount: number }>> => {
        const params = pair ? `?pair=${pair}` : '';
        const response = await apiClient.delete<ApiResponse<{ cancelledCount: number }>>(
            `/api/trading/orders${params}`
        );
        return response.data;
    },

    // Get trading history
    getTradingHistory: async (
        page: number = 1,
        limit: number = 50,
        startDate?: string,
        endDate?: string
    ): Promise<PaginatedResponse<TradeOrder>> => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await apiClient.get<PaginatedResponse<TradeOrder>>(
            `/api/trading/history?${params}`
        );
        return response.data;
    },

    // Get trading statistics
    getTradingStats: async (): Promise<ApiResponse<{
        totalTrades: number;
        successfulTrades: number;
        totalVolume: number;
        totalProfit: number;
        winRate: number;
        averageProfit: number;
    }>> => {
        const response = await apiClient.get<ApiResponse<{
            totalTrades: number;
            successfulTrades: number;
            totalVolume: number;
            totalProfit: number;
            winRate: number;
            averageProfit: number;
        }>>('/api/trading/stats');
        return response.data;
    },

    // Get order book
    getOrderBook: async (symbol: string, limit: number = 20): Promise<ApiResponse<{
        bids: Array<{ price: string; amount: string; total: string }>;
        asks: Array<{ price: string; amount: string; total: string }>;
    }>> => {
        const response = await apiClient.get<ApiResponse<{
            bids: Array<{ price: string; amount: string; total: string }>;
            asks: Array<{ price: string; amount: string; total: string }>;
        }>>(`/api/trading/orderbook/${symbol}?limit=${limit}`);
        return response.data;
    },

    // Get recent trades
    getRecentTrades: async (symbol: string, limit: number = 20): Promise<ApiResponse<Array<{
        id: string;
        price: string;
        amount: string;
        total: string;
        type: 'buy' | 'sell';
        timestamp: string;
    }>>> => {
        const response = await apiClient.get<ApiResponse<Array<{
            id: string;
            price: string;
            amount: string;
            total: string;
            type: 'buy' | 'sell';
            timestamp: string;
        }>>>(`/api/trading/recent/${symbol}?limit=${limit}`);
        return response.data;
    },

    // Get price chart data
    getPriceChart: async (
        symbol: string,
        interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d',
        limit: number = 100
    ): Promise<ApiResponse<Array<{
        timestamp: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>>> => {
        const response = await apiClient.get<ApiResponse<Array<{
            timestamp: string;
            open: number;
            high: number;
            low: number;
            close: number;
            volume: number;
        }>>>(`/api/trading/chart/${symbol}?interval=${interval}&limit=${limit}`);
        return response.data;
    },

    // Get trading fees
    getTradingFees: async (): Promise<ApiResponse<{
        makerFee: number;
        takerFee: number;
        volume24h: number;
        feeTier: string;
    }>> => {
        const response = await apiClient.get<ApiResponse<{
            makerFee: number;
            takerFee: number;
            volume24h: number;
            feeTier: string;
        }>>('/api/trading/fees');
        return response.data;
    },

    // Set trading preferences
    setTradingPreferences: async (preferences: {
        defaultSlippage?: number;
        confirmLargeTrades?: boolean;
        gasPriceMode?: 'slow' | 'standard' | 'fast';
        autoApproveSmallAmounts?: boolean;
    }): Promise<ApiResponse> => {
        const response = await apiClient.put<ApiResponse>('/api/trading/preferences', preferences);
        return response.data;
    },

    // Get trading preferences
    getTradingPreferences: async (): Promise<ApiResponse<{
        defaultSlippage: number;
        confirmLargeTrades: boolean;
        gasPriceMode: 'slow' | 'standard' | 'fast';
        autoApproveSmallAmounts: boolean;
    }>> => {
        const response = await apiClient.get<ApiResponse<{
            defaultSlippage: number;
            confirmLargeTrades: boolean;
            gasPriceMode: 'slow' | 'standard' | 'fast';
            autoApproveSmallAmounts: boolean;
        }>>('/api/trading/preferences');
        return response.data;
    },
};
