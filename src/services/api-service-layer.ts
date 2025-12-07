/**
 * API Service Layer
 * Provides type-safe service methods using the enhanced API client
 * Organized by feature domain
 */

import { api } from './enhanced-api-client';
import { API_ROUTES } from './config';
import {
    BaseResponse,
    User,
    AuthTokens,
    LoginCredentials,
    RegisterData,
    Wallet,
    Transaction,
    Portfolio,
    CreateWalletRequest,
    SendTransactionRequest,
    PaginatedResponse,
    TradingPair,
    SwapQuote,
    SwapParams,
    Notification,
    SecurityAlert,
    UserSettings,
} from '../types/api.types';

// ============================================================
// AUTHENTICATION SERVICE
// ============================================================

export const authService = {
    /**
     * Register new user
     */
    register: async (data: RegisterData): Promise<BaseResponse<{ user: User; tokens: AuthTokens }>> => {
        return api.post(API_ROUTES.AUTH.REGISTER, data);
    },

    /**
     * Login user
     */
    login: async (credentials: LoginCredentials): Promise<BaseResponse<{ user: User; tokens: AuthTokens }>> => {
        const response = await api.post<{ user: User; tokens: AuthTokens }>(API_ROUTES.AUTH.LOGIN, credentials);
        if (response.success && response.data) {
            const { tokens } = response.data;
            if (tokens) {
                api.setAuthTokens(tokens.accessToken, tokens.refreshToken);
            }
        }
        return response;
    },

    /**
     * Logout user
     */
    logout: async (): Promise<BaseResponse> => {
        const response = await api.post(API_ROUTES.AUTH.LOGOUT);
        api.clearAuthTokens();
        return response;
    },

    /**
     * Get current user
     */
    getCurrentUser: async (): Promise<BaseResponse<User>> => {
        return api.get(API_ROUTES.AUTH.ME);
    },

    /**
     * Refresh auth token
     */
    refreshToken: async (refreshToken: string): Promise<BaseResponse<AuthTokens>> => {
        const response = await api.post(API_ROUTES.AUTH.REFRESH, { refreshToken });
        if (response.success && response.data) {
            api.setAuthTokens(response.data.accessToken, response.data.refreshToken);
        }
        return response;
    },

    /**
     * Verify email
     */
    verifyEmail: async (token: string): Promise<BaseResponse> => {
        return api.post(API_ROUTES.AUTH.VERIFY_EMAIL, { token });
    },

    /**
     * Request password reset
     */
    forgotPassword: async (email: string): Promise<BaseResponse> => {
        return api.post(API_ROUTES.AUTH.FORGOT_PASSWORD, { email });
    },

    /**
     * Reset password
     */
    resetPassword: async (token: string, newPassword: string): Promise<BaseResponse> => {
        return api.post(API_ROUTES.AUTH.RESET_PASSWORD, { token, newPassword });
    },
};

// ============================================================
// WALLET SERVICE
// ============================================================

export const walletService = {
    /**
     * Get all wallets
     */
    getWallets: async (): Promise<BaseResponse<Wallet[]>> => {
        return api.get(API_ROUTES.WALLET.BALANCE);
    },

    /**
     * Create new wallet
     */
    createWallet: async (request: CreateWalletRequest): Promise<BaseResponse<Wallet>> => {
        return api.post(API_ROUTES.WALLET.CREATE, request);
    },

    /**
     * Get wallet balance
     */
    getBalance: async (address: string): Promise<BaseResponse<{ balance: string; usdBalance: number }>> => {
        return api.get(`${API_ROUTES.WALLET.BALANCE}/${address}`);
    },

    /**
     * Get transactions
     */
    getTransactions: async (
        address: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedResponse<Transaction>> => {
        return api.get(API_ROUTES.WALLET.TRANSACTIONS, {
            params: { address, page, limit },
        });
    },

    /**
     * Send transaction
     */
    sendTransaction: async (
        address: string,
        request: SendTransactionRequest
    ): Promise<BaseResponse<{ hash: string }>> => {
        return api.post(`${API_ROUTES.WALLET.SEND}/${address}`, request);
    },

    /**
     * Get tokens
     */
    getTokens: async (address: string): Promise<BaseResponse<any[]>> => {
        return api.get(`${API_ROUTES.WALLET.TOKENS}/${address}`);
    },

    /**
     * Get NFTs
     */
    getNFTs: async (address: string): Promise<BaseResponse<any[]>> => {
        return api.get(`${API_ROUTES.WALLET.NFTS}/${address}`);
    },

    /**
     * Estimate gas
     */
    estimateGas: async (request: SendTransactionRequest): Promise<BaseResponse<{ gasLimit: string; gasPrice: string }>> => {
        return api.post(API_ROUTES.WALLET.ESTIMATE_GAS, request);
    },
};

// ============================================================
// TRADING SERVICE
// ============================================================

export const tradingService = {
    /**
     * Get trading pairs
     */
    getTradingPairs: async (): Promise<BaseResponse<TradingPair[]>> => {
        return api.get('/api/trading/pairs');
    },

    /**
     * Get swap quote
     */
    getSwapQuote: async (params: {
        fromToken: string;
        toToken: string;
        amount: string;
        slippage?: number;
        chainId?: number;
    }): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.SWAPS.QUOTE, {
            fromToken: params.fromToken,
            toToken: params.toToken,
            amount: params.amount,
            slippage: params.slippage || 0.5,
            chainId: params.chainId || 1,
        });
    },

    /**
     * Execute swap
     */
    executeSwap: async (params: {
        fromToken: string;
        toToken: string;
        amount: string;
        slippage?: number;
        chainId?: number;
        recipient?: string;
    }): Promise<BaseResponse<{ hash: string }>> => {
        return api.post(API_ROUTES.SWAPS.EXECUTE, {
            fromToken: params.fromToken,
            toToken: params.toToken,
            amount: params.amount,
            slippage: params.slippage || 0.5,
            chainId: params.chainId || 1,
            recipient: params.recipient,
        });
    },

    /**
     * Get orders
     */
    getOrders: async (page: number = 1, limit: number = 20): Promise<PaginatedResponse<any>> => {
        return api.get(API_ROUTES.TRADING.ORDERS, {
            params: { page, limit },
        });
    },

    /**
     * Create order
     */
    createOrder: async (order: any): Promise<BaseResponse<any>> => {
        return api.post(API_ROUTES.TRADING.ORDERS, order);
    },

    /**
     * Cancel order
     */
    cancelOrder: async (orderId: string): Promise<BaseResponse> => {
        return api.delete(`${API_ROUTES.TRADING.ORDERS}/${orderId}`);
    },
};

// ============================================================
// FIAT/BUY SERVICE
// ============================================================

export const fiatService = {
    /**
     * Get fiat providers
     */
    getProviders: async (): Promise<BaseResponse<unknown[]>> => {
        return api.get(API_ROUTES.FIAT.PROVIDERS);
    },

    /**
     * Get buy quote
     */
    getQuote: async (params: {
        provider?: string;
        cryptoCurrency: string;
        fiatCurrency: string;
        fiatAmount: number;
    }): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.FIAT.QUOTE, params);
    },

    /**
     * Get buy URL (opens provider widget)
     */
    getBuyUrl: async (params: {
        provider: string;
        walletAddress: string;
        cryptoCurrency: string;
        fiatCurrency?: string;
        fiatAmount?: number;
    }): Promise<BaseResponse<{ url: string; provider: string }>> => {
        return api.post('/api/fiat/buy-url', params);
    },
};

// ============================================================
// MEV PROTECTION SERVICE - Comprehensive Integration
// ============================================================

export const mevService = {
    /**
     * Get MEV protection status
     */
    getStatus: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.STATUS, { service: 'mevguard' });
    },

    /**
     * Route transaction through MEV protection (private mempool)
     */
    routeTransaction: async (transaction: {
        transaction: Record<string, unknown>;
        chain_id: number;
        protection_level?: string;
    }): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.MEV_GUARD.PROTECT, transaction, { service: 'mevguard' });
    },

    /**
     * Protect transaction
     */
    protectTransaction: async (txHash: string): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.MEV_GUARD.PROTECT_TX, { transaction_hash: txHash }, { service: 'mevguard' });
    },

    /**
     * Simulate transaction
     */
    simulateTransaction: async (transaction: unknown): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.MEV_GUARD.SIMULATE, transaction, { service: 'mevguard' });
    },

    /**
     * Get analytics
     */
    getAnalytics: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.ANALYTICS, { service: 'mevguard' });
    },

    /**
     * Start MEV protection for networks
     */
    startProtection: async (networks: string[], protectionLevel: string = 'high'): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.MEV_GUARD.START, { networks, protection_level: protectionLevel }, { service: 'mevguard' });
    },

    /**
     * Stop MEV protection
     */
    stopProtection: async (networks?: string[]): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.MEV_GUARD.STOP, { networks: networks || null }, { service: 'mevguard' });
    },

    /**
     * Get protection status
     */
    getProtectionStatus: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.PROTECTION_STATUS, { service: 'mevguard' });
    },

    /**
     * Get threats
     */
    getThreats: async (params?: {
        network?: string;
        severity?: string;
        threat_type?: string;
        limit?: number;
        offset?: number;
    }): Promise<BaseResponse<unknown>> => {
        const queryParams = new URLSearchParams();
        if (params?.network) queryParams.append('network', params.network);
        if (params?.severity) queryParams.append('severity', params.severity);
        if (params?.threat_type) queryParams.append('threat_type', params.threat_type);
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.offset) queryParams.append('offset', params.offset.toString());
        const url = `${API_ROUTES.MEV_GUARD.THREATS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return api.get(url, { service: 'mevguard' });
    },

    /**
     * Get threat details
     */
    getThreatDetails: async (threatId: string): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.THREAT_DETAIL.replace(':id', threatId), { service: 'mevguard' });
    },

    /**
     * Get statistics
     */
    getStats: async (network?: string, timeframe: string = '24h'): Promise<BaseResponse<unknown>> => {
        const queryParams = new URLSearchParams();
        if (network) queryParams.append('network', network);
        queryParams.append('timeframe', timeframe);
        const url = `${API_ROUTES.MEV_GUARD.STATS}?${queryParams.toString()}`;
        return api.get(url, { service: 'mevguard' });
    },

    /**
     * Get dashboard data
     */
    getDashboard: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.DASHBOARD, { service: 'mevguard' });
    },

    /**
     * Get MEV metrics
     */
    getMEVMetrics: async (timePeriod: string = '1h'): Promise<BaseResponse<unknown>> => {
        return api.get(`${API_ROUTES.MEV_GUARD.MEV_METRICS}?time_period=${timePeriod}`, { service: 'mevguard' });
    },

    /**
     * Get MEV history
     */
    getMEVHistory: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.MEV_HISTORY, { service: 'mevguard' });
    },

    /**
     * Get supported networks
     */
    getNetworks: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.NETWORKS, { service: 'mevguard' });
    },

    /**
     * Get network status
     */
    getNetworkStatus: async (network: string): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.NETWORK_STATUS.replace(':network', network), { service: 'mevguard' });
    },

    /**
     * Get relays
     */
    getRelays: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.RELAYS, { service: 'mevguard' });
    },

    /**
     * Test relay
     */
    testRelay: async (relayType: string): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.MEV_GUARD.RELAY_TEST.replace(':relayType', relayType), {}, { service: 'mevguard' });
    },

    /**
     * Get OFA auctions
     */
    getOFAAuctions: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.OFA_AUCTIONS, { service: 'mevguard' });
    },

    /**
     * Create OFA auction
     */
    createOFAAuction: async (auction: unknown): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.MEV_GUARD.OFA_CREATE, auction, { service: 'mevguard' });
    },

    /**
     * Get PBS builders
     */
    getPBSBuilders: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.PBS_BUILDERS, { service: 'mevguard' });
    },

    /**
     * Get PBS relay status
     */
    getPBSRelayStatus: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.PBS_RELAY_STATUS, { service: 'mevguard' });
    },

    /**
     * Submit intent
     */
    submitIntent: async (intent: unknown): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.MEV_GUARD.INTENT_SUBMIT, intent, { service: 'mevguard' });
    },

    /**
     * Get intent status
     */
    getIntentStatus: async (intentId: string): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.INTENT_STATUS.replace(':intentId', intentId), { service: 'mevguard' });
    },

    /**
     * Detect MEV
     */
    detectMEV: async (transactionData: unknown): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.MEV_GUARD.MEV_DETECT, transactionData, { service: 'mevguard' });
    },

    /**
     * Get MEV stats
     */
    getMEVStats: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.MEV_STATS, { service: 'mevguard' });
    },

    /**
     * Get KPI metrics
     */
    getKPIMetrics: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.KPI_METRICS, { service: 'mevguard' });
    },

    /**
     * Get analytics dashboard
     */
    getAnalyticsDashboard: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.ANALYTICS_DASHBOARD, { service: 'mevguard' });
    },

    /**
     * Get builders status
     */
    getBuildersStatus: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.BUILDERS_STATUS, { service: 'mevguard' });
    },

    /**
     * Get relays status
     */
    getRelaysStatus: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.RELAYS_STATUS, { service: 'mevguard' });
    },

    /**
     * Get fallback status
     */
    getFallbackStatus: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.FALLBACK_STATUS, { service: 'mevguard' });
    },

    /**
     * Get live monitoring
     */
    getLiveMonitoring: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.MONITORING_LIVE, { service: 'mevguard' });
    },

    /**
     * Get config
     */
    getConfig: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEV_GUARD.CONFIG, { service: 'mevguard' });
    },

    /**
     * Toggle MEV protection
     */
    toggleProtection: async (enabled: boolean): Promise<BaseResponse<unknown>> => {
        return api.post(`${API_ROUTES.MEV_GUARD.TOGGLE}?enabled=${enabled}`, {}, { service: 'mevguard' });
    },
};

// ============================================================
// MEMPOOL MONITORING SERVICE - Unified Mempool System
// ============================================================

export const mempoolService = {
    /**
     * Get system status
     */
    getStatus: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEMPOOL.STATUS, { service: 'mempool' });
    },

    /**
     * Get dashboard data
     */
    getDashboard: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEMPOOL.DASHBOARD, { service: 'mempool' });
    },

    /**
     * Get transactions with filtering
     */
    getTransactions: async (params?: {
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
    }): Promise<BaseResponse<unknown>> => {
        const queryParams = new URLSearchParams();
        if (params?.network) queryParams.append('network', params.network);
        if (params?.suspicious_only) queryParams.append('suspicious_only', 'true');
        if (params?.min_value) queryParams.append('min_value', params.min_value.toString());
        if (params?.max_value) queryParams.append('max_value', params.max_value.toString());
        if (params?.min_gas_price) queryParams.append('min_gas_price', params.min_gas_price.toString());
        if (params?.max_gas_price) queryParams.append('max_gas_price', params.max_gas_price.toString());
        if (params?.from_address) queryParams.append('from_address', params.from_address);
        if (params?.to_address) queryParams.append('to_address', params.to_address);
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.offset) queryParams.append('offset', params.offset.toString());
        const url = `${API_ROUTES.MEMPOOL.TRANSACTIONS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return api.get(url, { service: 'mempool' });
    },

    /**
     * Get transaction details
     */
    getTransactionDetails: async (txHash: string): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEMPOOL.TRANSACTION_DETAIL.replace(':hash', txHash), { service: 'mempool' });
    },

    /**
     * Get MEV opportunities
     */
    getMEVOpportunities: async (params?: {
        network?: string;
        mev_type?: string;
        min_profit?: number;
        min_confidence?: number;
        limit?: number;
    }): Promise<BaseResponse<unknown>> => {
        const queryParams = new URLSearchParams();
        if (params?.network) queryParams.append('network', params.network);
        if (params?.mev_type) queryParams.append('mev_type', params.mev_type);
        if (params?.min_profit) queryParams.append('min_profit', params.min_profit.toString());
        if (params?.min_confidence) queryParams.append('min_confidence', params.min_confidence.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        const url = `${API_ROUTES.MEMPOOL.MEV_OPPORTUNITIES}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return api.get(url, { service: 'mempool' });
    },

    /**
     * Get MEV statistics
     */
    getMEVStatistics: async (timeframe: string = '1h'): Promise<BaseResponse<unknown>> => {
        return api.get(`${API_ROUTES.MEMPOOL.MEV_STATISTICS}?timeframe=${timeframe}`, { service: 'mempool' });
    },

    /**
     * Get threats
     */
    getThreats: async (params?: {
        severity?: string;
        network?: string;
        source?: string;
        limit?: number;
    }): Promise<BaseResponse<unknown>> => {
        const queryParams = new URLSearchParams();
        if (params?.severity) queryParams.append('severity', params.severity);
        if (params?.network) queryParams.append('network', params.network);
        if (params?.source) queryParams.append('source', params.source);
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        const url = `${API_ROUTES.MEMPOOL.THREATS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return api.get(url, { service: 'mempool' });
    },

    /**
     * Get networks
     */
    getNetworks: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEMPOOL.NETWORKS, { service: 'mempool' });
    },

    /**
     * Get performance analytics
     */
    getPerformanceAnalytics: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEMPOOL.ANALYTICS_PERFORMANCE, { service: 'mempool' });
    },

    /**
     * Get security analytics
     */
    getSecurityAnalytics: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.MEMPOOL.ANALYTICS_SECURITY, { service: 'mempool' });
    },

    /**
     * Export transactions
     */
    exportTransactions: async (params?: {
        format?: string;
        timeframe?: string;
        network?: string;
    }): Promise<BaseResponse<unknown>> => {
        const queryParams = new URLSearchParams();
        if (params?.format) queryParams.append('format', params.format);
        if (params?.timeframe) queryParams.append('timeframe', params.timeframe);
        if (params?.network) queryParams.append('network', params.network);
        const url = `${API_ROUTES.MEMPOOL.EXPORT_TRANSACTIONS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return api.get(url, { service: 'mempool' });
    },
};

// ============================================================
// CROSS-CHAIN BRIDGE SERVICE
// ============================================================

export const bridgeService = {
    /**
     * Get supported chains
     */
    getSupportedChains: async (): Promise<BaseResponse<unknown[]>> => {
        return api.get(API_ROUTES.CROSS_CHAIN.SUPPORTED_CHAINS, { service: 'crosschain' });
    },

    /**
     * Get supported tokens for a network
     */
    getSupportedTokens: async (network: string): Promise<BaseResponse<unknown[]>> => {
        return api.get(API_ROUTES.CROSS_CHAIN.SUPPORTED_TOKENS.replace(':network', network), { service: 'crosschain' });
    },

    /**
     * Get network status
     */
    getNetworkStatus: async (network: string): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.CROSS_CHAIN.NETWORK_STATUS.replace(':network', network), { service: 'crosschain' });
    },

    /**
     * Get cross-chain routes
     */
    getRoutes: async (params: {
        source_chain: string;
        destination_chain: string;
        from_token: string;
        to_token: string;
        amount_in: number;
    }): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.CROSS_CHAIN.ROUTES, params, { service: 'crosschain' });
    },

    /**
     * Get bridge quote
     */
    getQuote: async (params: {
        from_network: string;
        to_network: string;
        amount: number;
        asset: string;
    }): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.CROSS_CHAIN.QUOTE, params, { service: 'crosschain' });
    },

    /**
     * Execute bridge
     */
    executeBridge: async (params: {
        from_network: string;
        to_network: string;
        amount: number;
        recipient: string;
        asset: string;
        bridge_address?: string;
    }): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.CROSS_CHAIN.BRIDGE, params, { service: 'crosschain' });
    },

    /**
     * Get bridge status
     */
    getBridgeStatus: async (transactionId: string): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.CROSS_CHAIN.STATUS.replace(':transactionId', transactionId), { service: 'crosschain' });
    },

    /**
     * Analyze bridge
     */
    analyzeBridge: async (params: {
        bridge_address: string;
        source_network: string;
        target_network: string;
        analysis_depth?: string;
    }): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.CROSS_CHAIN.ANALYZE, params, { service: 'crosschain' });
    },

    /**
     * Validate transaction
     */
    validateTransaction: async (params: {
        tx_hash: string;
        network: string;
        bridge_address?: string;
    }): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.CROSS_CHAIN.VALIDATE, params, { service: 'crosschain' });
    },

    /**
     * Check bridge security
     */
    checkSecurity: async (bridgeAddress: string, network: string): Promise<BaseResponse<unknown>> => {
        return api.post(`${API_ROUTES.CROSS_CHAIN.SECURITY_CHECK}?bridge_address=${bridgeAddress}&network=${network}`, {}, { service: 'crosschain' });
    },

    /**
     * Get bridge history
     */
    getHistory: async (params?: {
        limit?: number;
        offset?: number;
        status?: string;
        from_network?: string;
        to_network?: string;
        asset?: string;
        start_date?: string;
        end_date?: string;
    }): Promise<BaseResponse<unknown>> => {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.offset) queryParams.append('offset', params.offset.toString());
        if (params?.status) queryParams.append('status', params.status);
        if (params?.from_network) queryParams.append('from_network', params.from_network);
        if (params?.to_network) queryParams.append('to_network', params.to_network);
        if (params?.asset) queryParams.append('asset', params.asset);
        if (params?.start_date) queryParams.append('start_date', params.start_date);
        if (params?.end_date) queryParams.append('end_date', params.end_date);
        const url = `${API_ROUTES.CROSS_CHAIN.HISTORY}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return api.get(url, { service: 'crosschain' });
    },

    /**
     * Get bridge analytics
     */
    getAnalytics: async (params?: {
        start_date?: string;
        end_date?: string;
        network?: string;
    }): Promise<BaseResponse<unknown>> => {
        const queryParams = new URLSearchParams();
        if (params?.start_date) queryParams.append('start_date', params.start_date);
        if (params?.end_date) queryParams.append('end_date', params.end_date);
        if (params?.network) queryParams.append('network', params.network);
        const url = `${API_ROUTES.CROSS_CHAIN.ANALYTICS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return api.get(url, { service: 'crosschain' });
    },

    /**
     * Recover bridge transaction
     */
    recoverTransaction: async (transactionId: string, action: string): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.CROSS_CHAIN.RECOVER.replace(':transactionId', transactionId), { action }, { service: 'crosschain' });
    },

    /**
     * Cancel bridge transaction
     */
    cancelTransaction: async (transactionId: string): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.CROSS_CHAIN.CANCEL.replace(':transactionId', transactionId), {}, { service: 'crosschain' });
    },

    /**
     * Check liquidity
     */
    checkLiquidity: async (params: {
        network: string;
        token: string;
        amount: string;
    }): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.CROSS_CHAIN.LIQUIDITY_CHECK, params, { service: 'crosschain' });
    },

    /**
     * Estimate bridge fee
     */
    estimateFee: async (params: {
        from_network: string;
        to_network: string;
        asset: string;
        amount: number;
    }): Promise<BaseResponse<unknown>> => {
        const queryParams = new URLSearchParams();
        queryParams.append('from_network', params.from_network);
        queryParams.append('to_network', params.to_network);
        queryParams.append('asset', params.asset);
        queryParams.append('amount', params.amount.toString());
        return api.get(`${API_ROUTES.CROSS_CHAIN.FEE}?${queryParams.toString()}`, { service: 'crosschain' });
    },
};

// ============================================================
// WALLET GUARD SERVICE - Comprehensive Integration
// ============================================================

export const walletGuardService = {
    /**
     * Health check
     */
    healthCheck: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.WALLET_GUARD.HEALTH, { service: 'backend' });
    },

    /**
     * Get service status
     */
    getStatus: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.WALLET_GUARD.STATUS, { service: 'backend' });
    },

    /**
     * Start monitoring wallet
     */
    startMonitoring: async (params: {
        wallet_address: string;
        network?: string;
        alert_channels?: string[];
        protection_level?: string;
    }): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.WALLET_GUARD.MONITOR, params, { service: 'backend' });
    },

    /**
     * Get wallet status
     */
    getWalletStatus: async (walletAddress: string, network?: string): Promise<BaseResponse<unknown>> => {
        const url = API_ROUTES.WALLET_GUARD.WALLET_STATUS.replace(':walletAddress', walletAddress);
        const queryParams = network ? `?network=${network}` : '';
        return api.get(`${url}${queryParams}`, { service: 'backend' });
    },

    /**
     * Apply protection action
     */
    applyProtection: async (params: {
        wallet_address: string;
        action_type: string;
        network?: string;
        metadata?: Record<string, unknown>;
    }): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.WALLET_GUARD.PROTECT, params, { service: 'backend' });
    },

    /**
     * Simulate transaction
     */
    simulateTransaction: async (params: {
        wallet_address: string;
        transaction: Record<string, unknown>;
        network?: string;
        simulation_depth?: number;
    }): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.WALLET_GUARD.SIMULATE, params, { service: 'backend' });
    },

    /**
     * Pre-sign transaction
     */
    presignTransaction: async (params: {
        transaction: Record<string, unknown>;
        wallet_address: string;
        required_signers?: number;
        mpc_enabled?: boolean;
    }): Promise<BaseResponse<unknown>> => {
        return api.post(API_ROUTES.WALLET_GUARD.PRESIGN, params, { service: 'backend' });
    },

    /**
     * Get presign status
     */
    getPresignStatus: async (signatureId: string): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.WALLET_GUARD.PRESIGN_STATUS.replace(':signatureId', signatureId), { service: 'backend' });
    },

    /**
     * Get threats
     */
    getThreats: async (params?: {
        limit?: number;
        hours?: number;
    }): Promise<BaseResponse<unknown>> => {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.hours) queryParams.append('hours', params.hours.toString());
        const url = `${API_ROUTES.WALLET_GUARD.THREATS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return api.get(url, { service: 'backend' });
    },

    /**
     * Get protection actions
     */
    getActions: async (limit: number = 25): Promise<BaseResponse<unknown>> => {
        return api.get(`${API_ROUTES.WALLET_GUARD.ACTIONS}?limit=${limit}`, { service: 'backend' });
    },

    /**
     * Get analytics
     */
    getAnalytics: async (): Promise<BaseResponse<unknown>> => {
        return api.get(API_ROUTES.WALLET_GUARD.ANALYTICS, { service: 'backend' });
    },
};

// ============================================================
// NOTIFICATION SERVICE
// ============================================================

export const notificationService = {
    /**
     * Get notifications
     */
    getNotifications: async (page: number = 1, limit: number = 20): Promise<PaginatedResponse<Notification>> => {
        return api.get(API_ROUTES.USER.NOTIFICATIONS, {
            params: { page, limit },
        });
    },

    /**
     * Mark notification as read
     */
    markAsRead: async (notificationId: string): Promise<BaseResponse> => {
        return api.put(`${API_ROUTES.USER.NOTIFICATIONS}/${notificationId}/read`);
    },

    /**
     * Mark all as read
     */
    markAllAsRead: async (): Promise<BaseResponse> => {
        return api.put(`${API_ROUTES.USER.NOTIFICATIONS}/read-all`);
    },

    /**
     * Delete notification
     */
    deleteNotification: async (notificationId: string): Promise<BaseResponse> => {
        return api.delete(`${API_ROUTES.USER.NOTIFICATIONS}/${notificationId}`);
    },
};

// ============================================================
// SECURITY SERVICE
// ============================================================

export const securityService = {
    /**
     * Get security alerts
     */
    getAlerts: async (): Promise<BaseResponse<SecurityAlert[]>> => {
        return api.get(API_ROUTES.SECURITY.ACTIVITY_LOG);
    },

    /**
     * Get activity log
     */
    getActivityLog: async (page: number = 1, limit: number = 20): Promise<PaginatedResponse<any>> => {
        return api.get(API_ROUTES.SECURITY.ACTIVITY_LOG, {
            params: { page, limit },
        });
    },

    /**
     * Get active sessions
     */
    getSessions: async (): Promise<BaseResponse<any[]>> => {
        return api.get(API_ROUTES.SECURITY.SESSIONS);
    },

    /**
     * Revoke session
     */
    revokeSession: async (sessionId: string): Promise<BaseResponse> => {
        return api.delete(`${API_ROUTES.SECURITY.SESSIONS}/${sessionId}`);
    },
};

// ============================================================
// SETTINGS SERVICE
// ============================================================

export const settingsService = {
    /**
     * Get user settings
     */
    getSettings: async (): Promise<BaseResponse<UserSettings>> => {
        return api.get(API_ROUTES.USER.SETTINGS);
    },

    /**
     * Update settings
     */
    updateSettings: async (settings: Partial<UserSettings>): Promise<BaseResponse<UserSettings>> => {
        return api.put(API_ROUTES.USER.SETTINGS, settings);
    },

    /**
     * Get user profile
     */
    getProfile: async (): Promise<BaseResponse<User>> => {
        return api.get(API_ROUTES.USER.PROFILE);
    },

    /**
     * Update profile
     */
    updateProfile: async (profile: Partial<User>): Promise<BaseResponse<User>> => {
        return api.put(API_ROUTES.USER.PROFILE, profile);
    },
};

// ============================================================
// MARKET DATA SERVICE
// ============================================================

export const marketDataService = {
    /**
     * Get token prices
     */
    getTokenPrices: async (symbols: string[]): Promise<BaseResponse<any[]>> => {
        return api.get(API_ROUTES.MARKET.PRICES, {
            params: { symbols: symbols.join(',') },
        });
    },

    /**
     * Get trending tokens
     */
    getTrending: async (): Promise<BaseResponse<any[]>> => {
        return api.get(API_ROUTES.MARKET.TRENDING);
    },

    /**
     * Get price chart
     */
    getChart: async (symbol: string, timeframe: string = '24h'): Promise<BaseResponse<any[]>> => {
        return api.get(API_ROUTES.MARKET.CHART, {
            params: { symbol, timeframe },
        });
    },

    /**
     * Get token info
     */
    getTokenInfo: async (symbol: string): Promise<BaseResponse<any>> => {
        return api.get(`${API_ROUTES.MARKET.TOKEN_INFO}/${symbol}`);
    },
};

// ============================================================
// HEALTH MONITORING
// ============================================================

export const healthService = {
    /**
     * Check service health
     */
    checkHealth: async (service: string) => {
        return api.checkHealth(service);
    },

    /**
     * Get all service health status
     */
    getAllHealthStatus: () => {
        return api.getHealthStatus();
    },
};

// ============================================================
// EXPORT ALL SERVICES
// ============================================================

export const apiServices = {
    auth: authService,
    wallet: walletService,
    trading: tradingService,
    fiat: fiatService,
    mev: mevService,
    mempool: mempoolService,
    bridge: bridgeService,
    walletGuard: walletGuardService,
    notification: notificationService,
    security: securityService,
    settings: settingsService,
    marketData: marketDataService,
    health: healthService,
};

export default apiServices;

