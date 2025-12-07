/**
 * useSwap - Hook for fetching swap quotes and executing swaps
 * Uses 1inch, ParaSwap, and ChangeNOW APIs via backend
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

// @ts-ignore - Vite env types
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3001';

export interface SwapToken {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    balance?: number;
    price?: number;
    icon?: string;
}

export interface SwapQuote {
    fromToken: SwapToken;
    toToken: SwapToken;
    fromAmount: string;
    toAmount: string;
    exchangeRate: number;
    priceImpact: number;
    estimatedGas?: string;
    estimatedGasUSD?: number;
    protocols: string[];
    slippage: number;
    source: '1inch' | 'paraswap' | 'changenow';
}

export interface SwapResult {
    hash: string;
    status: 'pending' | 'success' | 'failed';
    fromAmount: string;
    toAmount: string;
}

async function fetchSwapQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    chainId: number,
    slippage: number = 1
): Promise<SwapQuote | null> {
    try {
        const response = await fetch(
            `${API_BASE}/api/swaps/quote?` +
            `fromToken=${encodeURIComponent(fromToken)}&toToken=${encodeURIComponent(toToken)}` +
            `&amount=${amount}&chainId=${chainId}&slippage=${slippage}`
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch quote');
        }

        const data = await response.json();
        return data.quote;
    } catch (error) {
        console.error('Failed to fetch swap quote:', error);
        return null;
    }
}

async function fetchTokenList(chainId: number): Promise<SwapToken[]> {
    try {
        const response = await fetch(`${API_BASE}/api/swaps/tokens?chainId=${chainId}`);
        if (!response.ok) throw new Error('Failed to fetch tokens');

        const data = await response.json();
        return data.tokens || [];
    } catch (error) {
        console.error('Failed to fetch token list:', error);
        return getDefaultTokens(chainId);
    }
}

function getDefaultTokens(chainId: number): SwapToken[] {
    // Fallback tokens if API fails
    const baseTokens: SwapToken[] = [
        { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, icon: '⟠' },
        { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, icon: '💵' },
        { symbol: 'USDT', name: 'Tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, icon: '💵' },
        { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, icon: '₿' },
        { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EescdeCB5BE3d08', decimals: 18, icon: '🟡' },
        { symbol: 'LINK', name: 'Chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, icon: '🔗' },
        { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, icon: '🦄' },
    ];
    return baseTokens;
}

async function executeSwap(
    quote: SwapQuote,
    walletAddress: string,
    chainId: number
): Promise<SwapResult> {
    try {
        const response = await fetch(`${API_BASE}/api/swaps/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quote,
                walletAddress,
                chainId,
            }),
        });

        if (!response.ok) {
            throw new Error('Swap execution failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Swap execution error:', error);
        throw error;
    }
}

export function useSwap(walletAddress: string | undefined, chainId: number = 1) {
    const queryClient = useQueryClient();
    const [quote, setQuote] = useState<SwapQuote | null>(null);
    const [isQuoting, setIsQuoting] = useState(false);

    // Fetch available tokens
    const tokensQuery = useQuery({
        queryKey: ['swapTokens', chainId],
        queryFn: () => fetchTokenList(chainId),
        staleTime: 300000, // 5 minutes
    });

    // Get quote
    const getQuote = useCallback(async (
        fromToken: string,
        toToken: string,
        amount: string,
        slippage: number = 1
    ) => {
        if (!amount || parseFloat(amount) <= 0) {
            setQuote(null);
            return null;
        }

        setIsQuoting(true);
        try {
            const newQuote = await fetchSwapQuote(fromToken, toToken, amount, chainId, slippage);
            setQuote(newQuote);
            return newQuote;
        } finally {
            setIsQuoting(false);
        }
    }, [chainId]);

    // Execute swap mutation
    const swapMutation = useMutation({
        mutationFn: (params: { quote: SwapQuote }) =>
            executeSwap(params.quote, walletAddress!, chainId),
        onSuccess: () => {
            // Invalidate token balances after swap
            queryClient.invalidateQueries({ queryKey: ['tokens'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            setQuote(null);
        },
    });

    return {
        tokens: tokensQuery.data ?? [],
        isLoadingTokens: tokensQuery.isLoading,
        quote,
        isQuoting,
        getQuote,
        executeSwap: (quote: SwapQuote) => swapMutation.mutateAsync({ quote }),
        isSwapping: swapMutation.isPending,
        swapError: swapMutation.error,
    };
}

export default useSwap;
