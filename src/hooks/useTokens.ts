/**
 * useTokens - Hook for fetching and managing token balances
 * Updated to use enhanced API client
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiServices } from '../services';

export interface TokenBalance {
    id: string;
    symbol: string;
    name: string;
    address: string;
    balance: string;
    decimals: number;
    price?: number;
    value?: number;
    priceChange24h?: number;
    verified?: boolean;
    isScam?: boolean;
    favorite?: boolean;
    icon?: string;
}

async function fetchTokenBalances(address: string, chainId: number): Promise<TokenBalance[]> {
    try {
        const response = await apiServices.wallet.getTokens(address);

        if (!response.success || !response.data) {
            return [];
        }

        return (response.data || []).map((token: {
            address?: string;
            id?: string;
            symbol: string;
            name?: string;
            balance?: string;
            decimals?: number;
            price?: number;
            usdValue?: number;
            balanceUSD?: number;
            priceChange24h?: number;
            change24h?: number;
            verified?: boolean;
            isScam?: boolean;
            favorite?: boolean;
        }, index: number) => ({
            id: token.address || token.id || `${index}`,
            symbol: token.symbol,
            name: token.name || token.symbol,
            address: token.address || token.contractAddress,
            balance: token.balance || '0',
            decimals: token.decimals || 18,
            price: token.price,
            value: token.usdValue || token.balanceUSD,
            priceChange24h: token.priceChange24h || token.change24h,
            verified: token.verified || false,
            isScam: token.isScam || false,
            favorite: token.favorite || false,
            icon: getTokenIcon(token.symbol),
        }));
    } catch (error) {
        console.error('Failed to fetch token balances:', error);
        return [];
    }
}

function getTokenIcon(symbol: string): string {
    const icons: Record<string, string> = {
        ETH: '🔷',
        WETH: '🔷',
        BTC: '🟠',
        WBTC: '🟠',
        USDC: '💵',
        USDT: '💵',
        DAI: '🟡',
        SOL: '🟣',
        MATIC: '🟣',
        ARB: '🔵',
        OP: '🔴',
        LINK: '🔗',
        UNI: '🦄',
        AAVE: '👻',
        MKR: '🏛️',
        SNX: '⚡',
        CRV: '🔄',
        COMP: '🏦',
    };
    return icons[symbol.toUpperCase()] || '🪙';
}

export function useTokens(address: string | undefined, chainId: number = 1) {
    const queryClient = useQueryClient();

    const tokensQuery = useQuery({
        queryKey: ['tokens', address, chainId],
        queryFn: () => fetchTokenBalances(address!, chainId),
        enabled: !!address,
        refetchInterval: 30000,
        staleTime: 15000,
    });

    const refetch = () => {
        queryClient.invalidateQueries({ queryKey: ['tokens', address, chainId] });
    };

    return {
        tokens: tokensQuery.data ?? [],
        isLoading: tokensQuery.isLoading,
        isRefreshing: tokensQuery.isFetching,
        error: tokensQuery.error,
        refetch,
    };
}

export default useTokens;
