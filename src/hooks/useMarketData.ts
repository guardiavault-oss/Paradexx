/**
 * useMarketData - Hook for fetching market data, prices, and trending tokens
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';

// @ts-ignore - Vite env types
import { API_URL } from '../config/api';

// Use centralized API configuration
const API_BASE = API_URL;

export interface TokenPrice {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    change7d?: number;
    volume24h?: number;
    marketCap?: number;
    sparkline?: number[];
    icon?: string;
}

export interface TrendingToken {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    volume24h: number;
    rank: number;
    icon?: string;
}

export interface MarketStats {
    totalMarketCap: number;
    totalVolume24h: number;
    btcDominance: number;
    ethDominance: number;
    fearGreedIndex: number;
    marketCapChange24h: number;
}

async function fetchTokenPrices(symbols: string[]): Promise<Record<string, TokenPrice>> {
    try {
        const response = await fetch(`${API_BASE}/api/market-data/prices?symbols=${symbols.join(',')}`);
        const data = await response.json();
        return data.prices || {};
    } catch (error) {
        console.error('Failed to fetch token prices:', error);
        return {};
    }
}

async function fetchTrendingTokens(): Promise<TrendingToken[]> {
    try {
        const response = await fetch(`${API_BASE}/api/market-data/trending`);
        const data = await response.json();
        return data.tokens || [];
    } catch (error) {
        console.error('Failed to fetch trending tokens:', error);
        return [];
    }
}

async function fetchMarketStats(): Promise<MarketStats | null> {
    try {
        const response = await fetch(`${API_BASE}/api/market-data/stats`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch market stats:', error);
        return null;
    }
}

async function fetchTokenChart(symbol: string, period: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<number[]> {
    try {
        const response = await fetch(`${API_BASE}/api/market-data/chart?symbol=${symbol}&period=${period}`);
        const data = await response.json();
        return data.prices || [];
    } catch (error) {
        console.error('Failed to fetch chart data:', error);
        return [];
    }
}

export function useTokenPrices(symbols: string[]) {
    const queryClient = useQueryClient();

    const pricesQuery = useQuery({
        queryKey: ['prices', symbols.join(',')],
        queryFn: () => fetchTokenPrices(symbols),
        enabled: symbols.length > 0,
        refetchInterval: 30000,
        staleTime: 15000,
    });

    return {
        prices: pricesQuery.data ?? {},
        isLoading: pricesQuery.isLoading,
        error: pricesQuery.error,
        refetch: () => queryClient.invalidateQueries({ queryKey: ['prices'] }),
    };
}

export function useTrendingTokens() {
    const trendingQuery = useQuery({
        queryKey: ['trending'],
        queryFn: fetchTrendingTokens,
        refetchInterval: 60000,
        staleTime: 30000,
    });

    return {
        trending: trendingQuery.data ?? [],
        isLoading: trendingQuery.isLoading,
        error: trendingQuery.error,
    };
}

export function useMarketStats() {
    const statsQuery = useQuery({
        queryKey: ['marketStats'],
        queryFn: fetchMarketStats,
        refetchInterval: 60000,
        staleTime: 30000,
    });

    return {
        stats: statsQuery.data,
        isLoading: statsQuery.isLoading,
        error: statsQuery.error,
    };
}

export function useTokenChart(symbol: string, period: '1h' | '24h' | '7d' | '30d' = '24h') {
    const chartQuery = useQuery({
        queryKey: ['chart', symbol, period],
        queryFn: () => fetchTokenChart(symbol, period),
        enabled: !!symbol,
        refetchInterval: period === '1h' ? 30000 : 60000,
        staleTime: period === '1h' ? 15000 : 30000,
    });

    return {
        chartData: chartQuery.data ?? [],
        isLoading: chartQuery.isLoading,
        error: chartQuery.error,
    };
}

// Combined hook for all market data
export function useMarketData() {
    const defaultSymbols = ['ETH', 'BTC', 'SOL', 'MATIC', 'ARB', 'OP', 'USDC', 'USDT'];

    const { prices, isLoading: pricesLoading } = useTokenPrices(defaultSymbols);
    const { trending, isLoading: trendingLoading } = useTrendingTokens();
    const { stats, isLoading: statsLoading } = useMarketStats();

    return {
        prices,
        trending,
        stats,
        isLoading: pricesLoading || trendingLoading || statsLoading,
    };
}

export default useMarketData;
