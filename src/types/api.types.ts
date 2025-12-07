// Core API Types for Paradex Backend Integration

// Base Types
export interface BaseResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> extends BaseResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// User & Auth Types
export interface User {
    id: string;
    email: string;
    username: string;
    avatar?: string;
    tribe: 'degen' | 'regen';
    degenPercent: number;
    regenPercent: number;
    isVerified: boolean;
    isPremium: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    username: string;
    password: string;
    tribe: 'degen' | 'regen';
}

export interface AuthResponse extends BaseResponse<{
    user: User;
    tokens: AuthTokens;
}> { }

// Wallet Types
export interface Wallet {
    id: string;
    address: string;
    userId: string;
    type: 'EOA' | 'SMART' | 'MULTISIG';
    chainId: number;
    isActive: boolean;
    balance: string;
    usdBalance: number;
    createdAt: string;
}

export interface Transaction {
    id: string;
    hash: string;
    from: string;
    to: string;
    value: string;
    gasUsed: string;
    gasPrice: string;
    status: 'pending' | 'confirmed' | 'failed';
    type: 'send' | 'receive' | 'swap' | 'contract';
    timestamp: string;
    blockNumber?: number;
    swapDetails?: {
        fromToken: string;
        toToken: string;
        fromAmount: string;
        toAmount: string;
        dex: string;
    };
}

export interface Portfolio {
    totalValueUSD: number;
    totalValueETH: number;
    assets: PortfolioAsset[];
    pnl24h: number;
    pnl7d: number;
    pnl30d: number;
}

export interface PortfolioAsset {
    symbol: string;
    name: string;
    contractAddress: string;
    balance: string;
    usdValue: number;
    priceChange24h: number;
    allocation: number;
}

// Trading Types
export interface TradingPair {
    symbol: string;
    baseToken: string;
    quoteToken: string;
    currentPrice: number;
    priceChange24h: number;
    volume24h: number;
    liquidity: number;
}

export interface TradeOrder {
    id: string;
    userId: string;
    type: 'buy' | 'sell';
    orderType: 'market' | 'limit';
    pair: string;
    amount: string;
    price?: string;
    status: 'pending' | 'filled' | 'cancelled';
    createdAt: string;
    filledAt?: string;
}

export interface SwapParams {
    fromToken: string;
    toToken: string;
    amount: string;
    slippage: number;
    recipient?: string;
}

export interface SwapQuote {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    priceImpact: number;
    gasEstimate: string;
    route: string[];
    dex: string;
}

// DeFi Types
export interface DeFiPosition {
    id: string;
    protocol: string;
    type: 'staking' | 'lending' | 'liquidity' | 'yield';
    assets: string[];
    valueUSD: number;
    apy: number;
    isActive: boolean;
    createdAt: string;
}

export interface YieldOpportunity {
    protocol: string;
    type: 'staking' | 'lending' | 'liquidity';
    asset: string;
    apy: number;
    tvl: number;
    risk: 'low' | 'medium' | 'high';
    minAmount: number;
}

// MEV & Security Types
export interface MEVProtection {
    isActive: boolean;
    protectionLevel: 'basic' | 'advanced' | 'maximum';
    privateMempool: boolean;
    sandwichProtection: boolean;
    frontRunningProtection: boolean;
}

export interface SecurityAlert {
    id: string;
    type: 'suspicious_activity' | 'unusual_spending' | 'phishing_attempt' | 'malicious_contract';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    isRead: boolean;
}

// Guardian Recovery Types
export interface Guardian {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone?: string;
    isConfirmed: boolean;
    addedAt: string;
}

export interface RecoveryRequest {
    id: string;
    userId: string;
    threshold: number;
    approvals: number;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    createdAt: string;
    expiresAt: string;
}

// Notification Types
export interface Notification {
    id: string;
    userId: string;
    type: 'transaction' | 'security' | 'price' | 'social' | 'system';
    title: string;
    message: string;
    isRead: boolean;
    data?: any;
    createdAt: string;
}

// Market Data Types
export interface TokenPrice {
    symbol: string;
    price: number;
    change24h: number;
    volume24h: number;
    marketCap: number;
}

export interface MarketStats {
    totalMarketCap: number;
    totalVolume24h: number;
    btcDominance: number;
    ethDominance: number;
    fearGreedIndex: number;
}

// DegenX Tools Types
export interface SniperConfig {
    isActive: boolean;
    targetTokens: string[];
    maxGasPrice: string;
    minLiquidity: number;
    autoSell: boolean;
}

export interface WhaleTracker {
    trackedWallets: string[];
    alerts: boolean;
    minTransactionAmount: string;
}

export interface MemeHunter {
    isActive: boolean;
    scoreThreshold: number;
    autoBuy: boolean;
    maxPositionSize: number;
}

// Settings Types
export interface UserSettings {
    notifications: {
        email: boolean;
        push: boolean;
        transactions: boolean;
        priceAlerts: boolean;
        security: boolean;
    };
    privacy: {
        showBalance: boolean;
        showTransactions: boolean;
        dataSharing: boolean;
    };
    trading: {
        defaultSlippage: number;
        confirmLargeTrades: boolean;
        gasPriceMode: 'slow' | 'standard' | 'fast';
    };
    appearance: {
        theme: 'dark' | 'light' | 'auto';
        currency: 'USD' | 'EUR' | 'ETH';
        language: string;
    };
}

// WebSocket Message Types
export interface WebSocketMessage {
    type: 'transaction' | 'price_update' | 'security_alert' | 'notification' | 'trade_executed';
    data: any;
    timestamp: string;
}

export interface TransactionUpdate extends WebSocketMessage {
    type: 'transaction';
    data: Transaction;
}

export interface PriceUpdate extends WebSocketMessage {
    type: 'price_update';
    data: {
        symbol: string;
        price: number;
        change24h: number;
    };
}

// Error Types
export interface ApiError {
    code: string;
    message: string;
    details?: any;
}

export interface ValidationError extends ApiError {
    field: string;
    value: any;
}

// Request/Response Types for specific endpoints
export interface CreateWalletRequest {
    type: 'EOA' | 'SMART';
    chainId: number;
}

export interface SendTransactionRequest {
    to: string;
    value: string;
    data?: string;
    gasLimit?: string;
}

export interface ApproveTokenRequest {
    token: string;
    spender: string;
    amount: string;
}

export interface SetGuardiansRequest {
    guardians: Array<{
        name: string;
        email: string;
        phone?: string;
    }>;
    threshold: number;
}

export interface UpdateSettingsRequest {
    settings: Partial<UserSettings>;
}
