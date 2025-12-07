/**
 * React Query hooks for API calls
 * Provides caching, refetching, and error handling
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiServices } from '../services/api-service-layer';
import {
    BaseResponse,
    PaginatedResponse,
    SwapParams,
    Transaction,
    Wallet,
    TradingPair,
    SwapQuote,
    SendTransactionRequest,
    Notification,
    UserSettings,
} from '../types/api.types';

// ============================================================
// QUERY KEYS
// ============================================================

export const queryKeys = {
    // Auth
    auth: {
        currentUser: ['auth', 'currentUser'] as const,
    },
    // Wallet
    wallet: {
        all: ['wallet'] as const,
        list: () => [...queryKeys.wallet.all, 'list'] as const,
        detail: (id: string) => [...queryKeys.wallet.all, 'detail', id] as const,
        balance: (address: string) => [...queryKeys.wallet.all, 'balance', address] as const,
        transactions: (address: string, page?: number) =>
            [...queryKeys.wallet.all, 'transactions', address, page] as const,
        tokens: (address: string) => [...queryKeys.wallet.all, 'tokens', address] as const,
        nfts: (address: string) => [...queryKeys.wallet.all, 'nfts', address] as const,
    },
    // Trading
    trading: {
        pairs: ['trading', 'pairs'] as const,
        orders: (page?: number) => ['trading', 'orders', page] as const,
        quote: (params: SwapParams) => ['trading', 'quote', params] as const,
    },
    // MEV
    mev: {
        status: ['mev', 'status'] as const,
        analytics: ['mev', 'analytics'] as const,
        protectionStatus: ['mev', 'protectionStatus'] as const,
        threats: (params?: unknown) => ['mev', 'threats', params] as const,
        stats: (network?: string, timeframe?: string) => ['mev', 'stats', network, timeframe] as const,
        dashboard: ['mev', 'dashboard'] as const,
        networks: ['mev', 'networks'] as const,
        relays: ['mev', 'relays'] as const,
        ofaAuctions: ['mev', 'ofaAuctions'] as const,
        pbsBuilders: ['mev', 'pbsBuilders'] as const,
        kpiMetrics: ['mev', 'kpiMetrics'] as const,
        liveMonitoring: ['mev', 'liveMonitoring'] as const,
    },
    // Mempool
    mempool: {
        status: ['mempool', 'status'] as const,
        dashboard: ['mempool', 'dashboard'] as const,
        transactions: (params?: unknown) => ['mempool', 'transactions', params] as const,
        transactionDetail: (hash: string) => ['mempool', 'transaction', hash] as const,
        mevOpportunities: (params?: unknown) => ['mempool', 'mevOpportunities', params] as const,
        mevStatistics: (timeframe?: string) => ['mempool', 'mevStatistics', timeframe] as const,
        threats: (params?: unknown) => ['mempool', 'threats', params] as const,
        networks: ['mempool', 'networks'] as const,
        performanceAnalytics: ['mempool', 'performanceAnalytics'] as const,
        securityAnalytics: ['mempool', 'securityAnalytics'] as const,
    },
    // Bridge
    bridge: {
        chains: ['bridge', 'chains'] as const,
        tokens: (network: string) => ['bridge', 'tokens', network] as const,
        status: (transactionId: string) => ['bridge', 'status', transactionId] as const,
        networkStatus: (network: string) => ['bridge', 'networkStatus', network] as const,
        routes: (params?: unknown) => ['bridge', 'routes', params] as const,
        quote: (params?: unknown) => ['bridge', 'quote', params] as const,
        history: (params?: unknown) => ['bridge', 'history', params] as const,
        analytics: (params?: unknown) => ['bridge', 'analytics', params] as const,
    },
    // Wallet Guard
    walletGuard: {
        status: ['walletGuard', 'status'] as const,
        walletStatus: (address: string) => ['walletGuard', 'walletStatus', address] as const,
        threats: (params?: unknown) => ['walletGuard', 'threats', params] as const,
        actions: (limit?: number) => ['walletGuard', 'actions', limit] as const,
        analytics: ['walletGuard', 'analytics'] as const,
    },
    // Notifications
    notifications: {
        all: (page?: number) => ['notifications', page] as const,
    },
    // Security
    security: {
        alerts: ['security', 'alerts'] as const,
        activity: (page?: number) => ['security', 'activity', page] as const,
        sessions: ['security', 'sessions'] as const,
    },
    // Settings
    settings: {
        all: ['settings'] as const,
        profile: ['settings', 'profile'] as const,
    },
    // Market Data
    market: {
        prices: (symbols: string[]) => ['market', 'prices', symbols] as const,
        trending: ['market', 'trending'] as const,
        chart: (symbol: string, timeframe: string) => ['market', 'chart', symbol, timeframe] as const,
        tokenInfo: (symbol: string) => ['market', 'token', symbol] as const,
    },
};

// ============================================================
// AUTH HOOKS
// ============================================================

export const useCurrentUser = (options?: Omit<UseQueryOptions<BaseResponse<User>>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: queryKeys.auth.currentUser,
        queryFn: () => apiServices.auth.getCurrentUser(),
        ...options,
    });
};

// ============================================================
// WALLET HOOKS
// ============================================================

export const useWallets = (options?: Omit<UseQueryOptions<BaseResponse<Wallet[]>>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: queryKeys.wallet.list(),
        queryFn: () => apiServices.wallet.getWallets(),
        ...options,
    });
};

export const useWalletBalance = (
    address: string,
    options?: Omit<UseQueryOptions<BaseResponse<any>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.wallet.balance(address),
        queryFn: () => apiServices.wallet.getBalance(address),
        enabled: !!address,
        refetchInterval: 30000, // Refetch every 30 seconds
        ...options,
    });
};

export const useWalletTransactions = (
    address: string,
    page: number = 1,
    limit: number = 20,
    options?: Omit<UseQueryOptions<PaginatedResponse<Transaction>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.wallet.transactions(address, page),
        queryFn: () => apiServices.wallet.getTransactions(address, page, limit),
        enabled: !!address,
        ...options,
    });
};

export const useWalletTokens = (
    address: string,
    options?: Omit<UseQueryOptions<BaseResponse<unknown[]>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.wallet.tokens(address),
        queryFn: () => apiServices.wallet.getTokens(address),
        enabled: !!address,
        refetchInterval: 60000, // Refetch every minute
        ...options,
    });
};

export const useSendTransaction = (
    options?: Omit<UseMutationOptions<BaseResponse<{ hash: string }>, Error, { address: string; request: SendTransactionRequest }>, 'mutationFn'>
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ address, request }) => apiServices.wallet.sendTransaction(address, request),
        onSuccess: (data, variables) => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance(variables.address) });
            queryClient.invalidateQueries({ queryKey: queryKeys.wallet.transactions(variables.address) });
        },
        ...options,
    });
};

// ============================================================
// TRADING HOOKS
// ============================================================

export const useTradingPairs = (options?: Omit<UseQueryOptions<BaseResponse<TradingPair[]>>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: queryKeys.trading.pairs,
        queryFn: () => apiServices.trading.getTradingPairs(),
        refetchInterval: 30000, // Refetch every 30 seconds
        ...options,
    });
};

export const useSwapQuote = (
    params: SwapParams,
    options?: Omit<UseQueryOptions<BaseResponse<SwapQuote>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.trading.quote(params),
        queryFn: () => apiServices.trading.getSwapQuote(params),
        enabled: !!params.fromToken && !!params.toToken && !!params.amount,
        staleTime: 10000, // Consider data fresh for 10 seconds
        ...options,
    });
};

export const useExecuteSwap = (
    options?: Omit<UseMutationOptions<BaseResponse<{ hash: string }>, Error, SwapParams>, 'mutationFn'>
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params) => apiServices.trading.executeSwap(params),
        onSuccess: () => {
            // Invalidate wallet data after swap
            queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
        },
        ...options,
    });
};

// ============================================================
// MEV HOOKS
// ============================================================

export const useMEVStatus = (options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: queryKeys.mev.status,
        queryFn: () => apiServices.mev.getStatus(),
        refetchInterval: 60000, // Refetch every minute
        ...options,
    });
};

export const useMEVAnalytics = (options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: queryKeys.mev.analytics,
        queryFn: () => apiServices.mev.getAnalytics(),
        ...options,
    });
};

export const useMEVProtectionStatus = (options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: queryKeys.mev.protectionStatus,
        queryFn: () => apiServices.mev.getProtectionStatus(),
        refetchInterval: 30000, // Refetch every 30 seconds
        ...options,
    });
};

export const useMEVThreats = (
    params?: { network?: string; severity?: string; threat_type?: string; limit?: number; offset?: number },
    options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.mev.threats(params),
        queryFn: () => apiServices.mev.getThreats(params),
        refetchInterval: 60000, // Refetch every minute
        ...options,
    });
};

export const useMEVStats = (
    network?: string,
    timeframe: string = '24h',
    options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.mev.stats(network, timeframe),
        queryFn: () => apiServices.mev.getStats(network, timeframe),
        refetchInterval: 60000,
        ...options,
    });
};

export const useMEVDashboard = (options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: queryKeys.mev.dashboard,
        queryFn: () => apiServices.mev.getDashboard(),
        refetchInterval: 10000, // Refetch every 10 seconds for live dashboard
        ...options,
    });
};

export const useMEVNetworks = (options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: queryKeys.mev.networks,
        queryFn: () => apiServices.mev.getNetworks(),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        ...options,
    });
};

export const useMEVRelays = (options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: queryKeys.mev.relays,
        queryFn: () => apiServices.mev.getRelays(),
        refetchInterval: 30000,
        ...options,
    });
};

export const useMEVKPIMetrics = (options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: queryKeys.mev.kpiMetrics,
        queryFn: () => apiServices.mev.getKPIMetrics(),
        refetchInterval: 60000,
        ...options,
    });
};

export const useMEVLiveMonitoring = (options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: queryKeys.mev.liveMonitoring,
        queryFn: () => apiServices.mev.getLiveMonitoring(),
        refetchInterval: 5000, // Refetch every 5 seconds for live monitoring
        ...options,
    });
};

export const useStartMEVProtection = (
    options?: Omit<UseMutationOptions<BaseResponse<unknown>, Error, { networks: string[]; protectionLevel?: string }>, 'mutationFn'>
) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ networks, protectionLevel }) => apiServices.mev.startProtection(networks, protectionLevel),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.mev.protectionStatus });
        },
        ...options,
    });
};

export const useStopMEVProtection = (
    options?: Omit<UseMutationOptions<BaseResponse<unknown>, Error, { networks?: string[] }>, 'mutationFn'>
) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ networks }) => apiServices.mev.stopProtection(networks),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.mev.protectionStatus });
        },
        ...options,
    });
};

export const useToggleMEVProtection = (
    options?: Omit<UseMutationOptions<BaseResponse<unknown>, Error, boolean>, 'mutationFn'>
) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (enabled) => apiServices.mev.toggleProtection(enabled),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.mev.protectionStatus });
        },
        ...options,
    });
};

// ============================================================
// BRIDGE HOOKS
// ============================================================

export const useBridgeChains = (options?: Omit<UseQueryOptions<BaseResponse<unknown[]>>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: queryKeys.bridge.chains,
        queryFn: () => apiServices.bridge.getSupportedChains(),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        ...options,
    });
};

export const useBridgeTokens = (
    network: string,
    options?: Omit<UseQueryOptions<BaseResponse<unknown[]>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.bridge.tokens(network),
        queryFn: () => apiServices.bridge.getSupportedTokens(network),
        enabled: !!network,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
};

export const useBridgeStatus = (
    transactionId: string,
    options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.bridge.status(transactionId),
        queryFn: () => apiServices.bridge.getBridgeStatus(transactionId),
        enabled: !!transactionId,
        refetchInterval: 10000, // Refetch every 10 seconds for status updates
        ...options,
    });
};

// ============================================================
// NOTIFICATION HOOKS
// ============================================================

export const useNotifications = (
    page: number = 1,
    limit: number = 20,
    options?: Omit<UseQueryOptions<PaginatedResponse<Notification>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.notifications.all(page),
        queryFn: () => apiServices.notification.getNotifications(page, limit),
        refetchInterval: 30000, // Refetch every 30 seconds
        ...options,
    });
};

// ============================================================
// MARKET DATA HOOKS
// ============================================================

export const useTokenPrices = (
    symbols: string[],
    options?: Omit<UseQueryOptions<BaseResponse<unknown[]>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.market.prices(symbols),
        queryFn: () => apiServices.marketData.getTokenPrices(symbols),
        enabled: symbols.length > 0,
        refetchInterval: 10000, // Refetch every 10 seconds for price updates
        ...options,
    });
};

export const useTrendingTokens = (options?: Omit<UseQueryOptions<BaseResponse<unknown[]>>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: queryKeys.market.trending,
        queryFn: () => apiServices.marketData.getTrending(),
        refetchInterval: 60000, // Refetch every minute
        ...options,
    });
};

export const usePriceChart = (
    symbol: string,
    timeframe: string = '24h',
    options?: Omit<UseQueryOptions<BaseResponse<unknown[]>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.market.chart(symbol, timeframe),
        queryFn: () => apiServices.marketData.getChart(symbol, timeframe),
        enabled: !!symbol,
        ...options,
    });
};

// ============================================================
// MEMPOOL MONITORING HOOKS
// ============================================================

export const useMempoolStatus = (options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: queryKeys.mempool.status,
        queryFn: () => apiServices.mempool.getStatus(),
        refetchInterval: 30000,
        ...options,
    });
};

export const useMempoolDashboard = (options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: queryKeys.mempool.dashboard,
        queryFn: () => apiServices.mempool.getDashboard(),
        refetchInterval: 10000, // Refetch every 10 seconds for live dashboard
        ...options,
    });
};

export const useMempoolTransactions = (
    params?: {
        network?: string;
        suspicious_only?: boolean;
        min_value?: number;
        max_value?: number;
        min_gas_price?: number;
        max_gas_price?: number;
        from_address?: string;
        to_address?: string;
        limit?: number;
        offset?: number;
    },
    options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.mempool.transactions(params),
        queryFn: () => apiServices.mempool.getTransactions(params),
        refetchInterval: 15000, // Refetch every 15 seconds
        ...options,
    });
};

export const useMempoolTransactionDetails = (
    txHash: string,
    options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.mempool.transactionDetail(txHash),
        queryFn: () => apiServices.mempool.getTransactionDetails(txHash),
        enabled: !!txHash,
        ...options,
    });
};

export const useMempoolMEVOpportunities = (
    params?: { network?: string; mev_type?: string; min_profit?: number; min_confidence?: number; limit?: number },
    options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.mempool.mevOpportunities(params),
        queryFn: () => apiServices.mempool.getMEVOpportunities(params),
        refetchInterval: 20000, // Refetch every 20 seconds
        ...options,
    });
};

export const useMempoolMEVStatistics = (
    timeframe: string = '1h',
    options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.mempool.mevStatistics(timeframe),
        queryFn: () => apiServices.mempool.getMEVStatistics(timeframe),
        refetchInterval: 60000,
        ...options,
    });
};

export const useMempoolThreats = (
    params?: { severity?: string; network?: string; source?: string; limit?: number },
    options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.mempool.threats(params),
        queryFn: () => apiServices.mempool.getThreats(params),
        refetchInterval: 30000,
        ...options,
    });
};

export const useMempoolNetworks = (options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: queryKeys.mempool.networks,
        queryFn: () => apiServices.mempool.getNetworks(),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        ...options,
    });
};

export const useMempoolPerformanceAnalytics = (
    options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.mempool.performanceAnalytics,
        queryFn: () => apiServices.mempool.getPerformanceAnalytics(),
        refetchInterval: 60000,
        ...options,
    });
};

export const useMempoolSecurityAnalytics = (
    options?: Omit<UseQueryOptions<BaseResponse<unknown>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.mempool.securityAnalytics,
        queryFn: () => apiServices.mempool.getSecurityAnalytics(),
        refetchInterval: 60000,
        ...options,
    });
};

// ============================================================
// SETTINGS HOOKS
// ============================================================

export const useSettings = (options?: Omit<UseQueryOptions<BaseResponse<UserSettings>>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: queryKeys.settings.all,
        queryFn: () => apiServices.settings.getSettings(),
        ...options,
    });
};

export const useUpdateSettings = (
    options?: Omit<UseMutationOptions<BaseResponse<UserSettings>, Error, Partial<UserSettings>>, 'mutationFn'>
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (settings) => apiServices.settings.updateSettings(settings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
        },
        ...options,
    });
};


