/**
 * WalletDataContext - Centralized wallet data management
 * Provides real-time wallet data to all components via React Query and WebSocket
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';

// Types
export interface Token {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    balance: string;
    balanceUSD: number;
    price: number;
    priceChange24h: number;
    icon?: string;
    chainId: number;
}

export interface Transaction {
    id: string;
    hash: string;
    type: 'send' | 'receive' | 'swap' | 'approve' | 'stake' | 'unstake' | 'bridge';
    status: 'pending' | 'confirmed' | 'failed';
    from: string;
    to: string;
    value: string;
    valueUSD: number;
    token: string;
    tokenSymbol: string;
    gasUsed?: string;
    gasFee?: string;
    timestamp: number;
    chainId: number;
    blockNumber?: number;
}

export interface NFT {
    id: string;
    tokenId: string;
    contract: string;
    name: string;
    description?: string;
    image: string;
    collection: string;
    chainId: number;
    floorPrice?: number;
}

export interface WalletData {
    address: string;
    chainId: number;
    totalBalanceUSD: number;
    totalChange24h: number;
    totalChangePercent24h: number;
    tokens: Token[];
    nfts: NFT[];
    transactions: Transaction[];
    isConnected: boolean;
}

export interface GasPrice {
    slow: { gwei: number; estimatedTime: string };
    standard: { gwei: number; estimatedTime: string };
    fast: { gwei: number; estimatedTime: string };
    baseFee: number;
}

interface WalletDataContextValue {
    walletData: WalletData | null;
    isLoading: boolean;
    error: Error | null;
    gasPrice: GasPrice | null;
    refetchAll: () => void;
    refetchTokens: () => void;
    refetchTransactions: () => void;
    refetchNFTs: () => void;
}

const WalletDataContext = createContext<WalletDataContextValue | null>(null);

// API Functions
async function fetchWalletOverview(address: string, chainId: number): Promise<{
    totalBalanceUSD: number;
    totalChange24h: number;
    totalChangePercent24h: number;
}> {
    try {
        const response = await apiClient.get(`/wallet/overview?address=${address}&chainId=${chainId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch wallet overview:', error);
        // Return default values on error
        return {
            totalBalanceUSD: 0,
            totalChange24h: 0,
            totalChangePercent24h: 0,
        };
    }
}

async function fetchTokenBalances(address: string, chainId: number): Promise<Token[]> {
    try {
        const response = await apiClient.get(`/wallet/tokens?address=${address}&chainId=${chainId}`);
        return response.data.tokens || [];
    } catch (error) {
        console.error('Failed to fetch token balances:', error);
        return [];
    }
}

async function fetchTransactions(address: string, chainId: number, limit = 50): Promise<Transaction[]> {
    try {
        const response = await apiClient.get(`/wallet/transactions?address=${address}&chainId=${chainId}&limit=${limit}`);
        return response.data.transactions || [];
    } catch (error) {
        console.error('Failed to fetch transactions:', error);
        return [];
    }
}

async function fetchNFTs(address: string, chainId: number): Promise<NFT[]> {
    try {
        const response = await apiClient.get(`/wallet/nfts?address=${address}&chainId=${chainId}`);
        return response.data.nfts || [];
    } catch (error) {
        console.error('Failed to fetch NFTs:', error);
        return [];
    }
}

async function fetchGasPrice(chainId: number): Promise<GasPrice> {
    try {
        const response = await apiClient.get(`/gas/price?chainId=${chainId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch gas price:', error);
        return {
            slow: { gwei: 10, estimatedTime: '~10 min' },
            standard: { gwei: 15, estimatedTime: '~3 min' },
            fast: { gwei: 25, estimatedTime: '~30 sec' },
            baseFee: 12,
        };
    }
}

// Provider Component
export function WalletDataProvider({
    children,
    address,
    chainId = 1,
}: {
    children: ReactNode;
    address?: string;
    chainId?: number;
}) {
    const queryClient = useQueryClient();
    const isConnected = !!address;

    // Fetch wallet overview
    const overviewQuery = useQuery({
        queryKey: ['wallet', 'overview', address, chainId],
        queryFn: () => fetchWalletOverview(address!, chainId),
        enabled: isConnected,
        refetchInterval: 60000, // Refetch every minute
        staleTime: 30000,
    });

    // Fetch token balances
    const tokensQuery = useQuery({
        queryKey: ['wallet', 'tokens', address, chainId],
        queryFn: () => fetchTokenBalances(address!, chainId),
        enabled: isConnected,
        refetchInterval: 30000, // Refetch every 30 seconds
        staleTime: 15000,
    });

    // Fetch transactions
    const transactionsQuery = useQuery({
        queryKey: ['wallet', 'transactions', address, chainId],
        queryFn: () => fetchTransactions(address!, chainId),
        enabled: isConnected,
        refetchInterval: 15000, // Refetch every 15 seconds
        staleTime: 10000,
    });

    // Fetch NFTs
    const nftsQuery = useQuery({
        queryKey: ['wallet', 'nfts', address, chainId],
        queryFn: () => fetchNFTs(address!, chainId),
        enabled: isConnected,
        refetchInterval: 120000, // Refetch every 2 minutes
        staleTime: 60000,
    });

    // Fetch gas prices
    const gasPriceQuery = useQuery({
        queryKey: ['gas', 'price', chainId],
        queryFn: () => fetchGasPrice(chainId),
        refetchInterval: 15000, // Refetch every 15 seconds
        staleTime: 10000,
    });

    // Combine all data
    const walletData: WalletData | null = isConnected && address ? {
        address,
        chainId,
        totalBalanceUSD: overviewQuery.data?.totalBalanceUSD ?? 0,
        totalChange24h: overviewQuery.data?.totalChange24h ?? 0,
        totalChangePercent24h: overviewQuery.data?.totalChangePercent24h ?? 0,
        tokens: tokensQuery.data ?? [],
        nfts: nftsQuery.data ?? [],
        transactions: transactionsQuery.data ?? [],
        isConnected: true,
    } : null;

    const isLoading = overviewQuery.isLoading || tokensQuery.isLoading || transactionsQuery.isLoading;
    const error = overviewQuery.error || tokensQuery.error || transactionsQuery.error;

    // Refetch functions
    const refetchAll = () => {
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        queryClient.invalidateQueries({ queryKey: ['gas'] });
    };

    const refetchTokens = () => {
        queryClient.invalidateQueries({ queryKey: ['wallet', 'tokens'] });
    };

    const refetchTransactions = () => {
        queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
    };

    const refetchNFTs = () => {
        queryClient.invalidateQueries({ queryKey: ['wallet', 'nfts'] });
    };

    const value: WalletDataContextValue = {
        walletData,
        isLoading,
        error: error as Error | null,
        gasPrice: gasPriceQuery.data ?? null,
        refetchAll,
        refetchTokens,
        refetchTransactions,
        refetchNFTs,
    };

    return (
        <WalletDataContext.Provider value={value}>
            {children}
        </WalletDataContext.Provider>
    );
}

// Hook to use wallet data
export function useWalletData() {
    const context = useContext(WalletDataContext);
    if (!context) {
        throw new Error('useWalletData must be used within a WalletDataProvider');
    }
    return context;
}

// Additional utility hooks
export function useTokenBalance(symbol: string) {
    const { walletData } = useWalletData();
    return walletData?.tokens.find(t => t.symbol.toLowerCase() === symbol.toLowerCase());
}

export function useRecentTransactions(limit = 10) {
    const { walletData } = useWalletData();
    return walletData?.transactions.slice(0, limit) ?? [];
}

export function useTotalBalance() {
    const { walletData } = useWalletData();
    return {
        totalUSD: walletData?.totalBalanceUSD ?? 0,
        change24h: walletData?.totalChange24h ?? 0,
        changePercent24h: walletData?.totalChangePercent24h ?? 0,
    };
}
