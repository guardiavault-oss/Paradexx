/**
 * Service Configuration - Unified API endpoints for all platform services
 */

// ============================================================
// SERVICE ENDPOINTS
// ============================================================

export const SERVICE_ENDPOINTS = {
    // Main Backend API (Express/TypeScript)
    BACKEND_API: import.meta.env.VITE_API_URL || 'http://localhost:3001',

    // WebSocket connection
    WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',

    // MEV Guard Service (Python/FastAPI)
    MEVGUARD_API: import.meta.env.VITE_MEVGUARD_URL || 'http://localhost:8000',

    // Unified Mempool System (Python/FastAPI)
    MEMPOOL_API: import.meta.env.VITE_MEMPOOL_URL || 'http://localhost:8004',

    // Cross-Chain Bridge Service (Python/FastAPI)
    CROSSCHAIN_API: import.meta.env.VITE_CROSSCHAIN_URL || 'http://localhost:8001',

    // GuardiaVault API (Inheritance Platform)
    GUARDIAVAULT_API: import.meta.env.VITE_GUARDIAVAULT_API_URL || 'http://localhost:3001/api',

    // Degen Services (Sniper Bot, etc.)
    DEGEN_API: import.meta.env.VITE_DEGEN_API_URL || 'http://localhost:3002',
} as const;

// ============================================================
// API ROUTE DEFINITIONS
// ============================================================

export const API_ROUTES = {
    // Authentication
    AUTH: {
        REGISTER: '/api/auth/register',
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        REFRESH: '/api/auth/refresh',
        GOOGLE_OAUTH: '/api/auth/oauth/google',
        VERIFY_EMAIL: '/api/auth/verify-email',
        FORGOT_PASSWORD: '/api/auth/forgot-password',
        RESET_PASSWORD: '/api/auth/reset-password',
        ME: '/api/auth/me',
    },

    // Wallet Management
    WALLET: {
        CREATE: '/api/wallet/create',
        BALANCE: '/api/wallet/balance',
        TRANSACTIONS: '/api/wallet/transactions',
        SEND: '/api/wallet/send',
        ESTIMATE_GAS: '/api/wallet/estimate-gas',
        TOKENS: '/api/wallet/tokens',
        NFTS: '/api/wallet/nfts',
    },

    // Trading & Swaps
    TRADING: {
        ORDERS: '/api/trading/orders',
        ORDERS_OCO: '/api/trading/orders/oco',
        ORDERS_TRAILING: '/api/trading/orders/trailing-stop',
        ORDERS_STATS: '/api/trading/orders/stats',
        DCA: '/api/trading/dca',
        ALERTS: '/api/trading/alerts',
    },

    SWAPS: {
        AGGREGATORS: '/api/swaps/aggregators',
        BUILD_TX: '/api/swaps/build-tx',
        QUOTE: '/api/swaps/quote',
        EXECUTE: '/api/swaps/execute',
    },

    // DeFi
    DEFI: {
        YIELD_VAULTS: '/api/defi/yield-vaults',
        DEPOSITS: '/api/defi/deposits',
        WITHDRAWALS: '/api/defi/withdrawals',
        APY_RATES: '/api/defi/apy-rates',
        POSITIONS: '/api/defi/positions',
    },

    // MEV Protection - Comprehensive endpoints
    MEV_GUARD: {
        // Basic endpoints
        STATUS: '/api/mev/status',
        PROTECT: '/api/mev/route',
        SIMULATE: '/api/mev-guard/simulate',
        FLASHBOTS: '/api/mev-guard/flashbots',
        ANALYTICS: '/api/mev-guard/analytics',
        
        // Protection management
        START: '/api/v1/protection/start',
        STOP: '/api/v1/protection/stop',
        PROTECTION_STATUS: '/api/v1/protection/status',
        
        // Transaction protection
        PROTECT_TX: '/api/v1/transactions/protect',
        
        // Threat detection
        THREATS: '/api/v1/threats',
        THREAT_DETAIL: '/api/v1/threats/:id',
        
        // Statistics
        STATS: '/api/v1/stats',
        DASHBOARD: '/api/v1/dashboard',
        MEV_METRICS: '/api/v1/mev/metrics',
        MEV_HISTORY: '/api/v1/mev/history',
        
        // Network management
        NETWORKS: '/api/v1/networks',
        NETWORK_STATUS: '/api/v1/networks/:network/status',
        
        // Private relay management
        RELAYS: '/api/v1/relays',
        RELAY_TEST: '/api/v1/relays/:relayType/test',
        
        // Order Flow Auction (OFA)
        OFA_AUCTIONS: '/api/v1/ofa/auctions',
        OFA_CREATE: '/api/v1/ofa/create',
        
        // PBS (Proposer-Builder Separation)
        PBS_BUILDERS: '/api/v1/pbs/builders',
        PBS_RELAY_STATUS: '/api/v1/pbs/relay/status',
        
        // Enhanced MEV API
        INTENT_SUBMIT: '/api/v1/intent/submit',
        INTENT_STATUS: '/api/v1/intent/:intentId',
        MEV_DETECT: '/api/v1/mev/detect',
        MEV_STATS: '/api/v1/mev/stats',
        KPI_METRICS: '/api/v1/kpi/metrics',
        ANALYTICS_DASHBOARD: '/api/v1/analytics/dashboard',
        BUILDERS_STATUS: '/api/v1/builders/status',
        RELAYS_STATUS: '/api/v1/relays/status',
        FALLBACK_STATUS: '/api/v1/fallback/status',
        MONITORING_LIVE: '/api/v1/monitoring/live',
        MONITORING_STREAM: '/api/v1/monitoring/stream',
        CONFIG: '/api/v1/config',
        
        // Toggle protection
        TOGGLE: '/api/mev/toggle',
    },

    // Mempool Monitoring - Unified Mempool System
    MEMPOOL: {
        // System endpoints
        ROOT: '/',
        HEALTH: '/health',
        STATUS: '/api/v1/status',
        DASHBOARD: '/api/v1/dashboard',
        
        // Transaction endpoints
        TRANSACTIONS: '/api/v1/transactions',
        TRANSACTION_DETAIL: '/api/v1/transactions/:hash',
        
        // MEV Detection
        MEV_OPPORTUNITIES: '/api/v1/mev/opportunities',
        MEV_STATISTICS: '/api/v1/mev/statistics',
        
        // Threat Intelligence
        THREATS: '/api/v1/threats',
        
        // Networks
        NETWORKS: '/api/v1/networks',
        
        // Analytics
        ANALYTICS_PERFORMANCE: '/api/v1/analytics/performance',
        ANALYTICS_SECURITY: '/api/v1/analytics/security',
        
        // Export
        EXPORT_TRANSACTIONS: '/api/v1/export/transactions',
        
        // WebSocket streams
        WS_TRANSACTIONS: '/api/v1/stream/transactions',
        WS_ALERTS: '/api/v1/stream/alerts',
        WS_DASHBOARD: '/api/v1/stream/dashboard',
    },

    // Inheritance Platform
    INHERITANCE: {
        VAULT: '/api/inheritance/vault',
        BENEFICIARIES: '/api/inheritance/beneficiaries',
        CHECK_IN: '/api/inheritance/check-in',
        ACTIVITY: '/api/inheritance/activity',
        CANCEL_TRIGGER: '/api/inheritance/cancel-trigger',
        VERIFY: '/api/inheritance/verify',
    },

    // Smart Will
    WILL: {
        LIST: '/api/will',
        CREATE: '/api/will',
        GET: '/api/will/:id',
        UPDATE: '/api/will/:id',
        PUBLISH: '/api/will/:id/publish',
        EXECUTE: '/api/will/:id/execute',
        BENEFICIARIES: '/api/will/:id/beneficiaries',
        GUARDIANS: '/api/will/:id/guardians',
    },

    // Guardian System
    GUARDIAN: {
        LIST: '/api/guardians',
        INVITE: '/api/guardians/invite',
        ACCEPT: '/api/guardian-portal/accept',
        STATUS: '/api/guardian-portal/status',
        ATTEST: '/api/guardian-portal/attest',
        REMOVE: '/api/guardians/:id/remove',
    },

    // Recovery
    RECOVERY: {
        INITIATE: '/api/recovery/initiate',
        STATUS: '/api/recovery/status',
        APPROVE: '/api/recovery/approve',
        CANCEL: '/api/recovery/cancel',
    },

    // Cross-Chain Bridge - Comprehensive endpoints
    CROSS_CHAIN: {
        ROUTES: '/api/cross-chain/routes',
        QUOTE: '/api/bridge/quote',
        BRIDGE: '/api/bridge/execute',
        STATUS: '/api/bridge/status/:transactionId',
        SUPPORTED_CHAINS: '/api/bridge/networks',
        SUPPORTED_TOKENS: '/api/bridge/network/:network/tokens',
        NETWORK_STATUS: '/api/bridge/network/:network/status',
        ANALYZE: '/api/bridge/analyze',
        VALIDATE: '/api/bridge/validate',
        SECURITY_CHECK: '/api/bridge/security-check',
        HISTORY: '/api/bridge/history',
        ANALYTICS: '/api/bridge/analytics',
        RECOVER: '/api/bridge/:transactionId/recover',
        CANCEL: '/api/bridge/:transactionId/cancel',
        LIQUIDITY_CHECK: '/api/bridge/liquidity/check',
        FEE: '/api/bridge/fee',
    },

    // Wallet Guard - Comprehensive endpoints
    WALLET_GUARD: {
        HEALTH: '/api/wallet-guard/health',
        STATUS: '/api/wallet-guard/status',
        MONITOR: '/api/wallet-guard/monitor',
        WALLET_STATUS: '/api/wallet-guard/status/:walletAddress',
        PROTECT: '/api/wallet-guard/protect',
        SIMULATE: '/api/wallet-guard/simulate',
        PRESIGN: '/api/wallet-guard/presign',
        PRESIGN_STATUS: '/api/wallet-guard/presign/:signatureId',
        THREATS: '/api/wallet-guard/threats',
        ACTIONS: '/api/wallet-guard/actions',
        ANALYTICS: '/api/wallet-guard/analytics',
    },

    // Sniper Bot
    SNIPER: {
        START: '/api/sniper/start',
        STOP: '/api/sniper/stop',
        STATUS: '/api/sniper/status',
        TARGETS: '/api/sniper/targets',
        HISTORY: '/api/sniper/history',
    },

    // Market Data
    MARKET: {
        PRICES: '/api/market-data/prices',
        TRENDING: '/api/market-data/trending',
        CHART: '/api/market-data/chart',
        TOKEN_INFO: '/api/market-data/token',
    },

    // NFTs
    NFT: {
        COLLECTION: '/api/nft/collection',
        OWNED: '/api/nft/owned',
        METADATA: '/api/nft/metadata',
        TRANSFER: '/api/nft/transfer',
    },

    // Fiat On-Ramp
    FIAT: {
        QUOTE: '/api/fiat/quote',
        PROVIDERS: '/api/fiat/providers',
        MOONPAY: '/api/moonpay',
        ONRAMPER: '/api/onramper',
        CHANGENOW: '/api/changenow',
    },

    // User & Settings
    USER: {
        PROFILE: '/api/user/profile',
        SETTINGS: '/api/settings',
        NOTIFICATIONS: '/api/notifications',
        PREFERENCES: '/api/settings/preferences',
    },

    // Security
    SECURITY: {
        BIOMETRIC: '/api/biometric',
        TWO_FACTOR: '/api/security/2fa',
        SESSIONS: '/api/security/sessions',
        ACTIVITY_LOG: '/api/security/activity',
    },

    // Support
    SUPPORT: {
        TICKETS: '/api/support/tickets',
        HELP: '/api/support/help',
        FAQ: '/api/support/faq',
    },

    // Payments
    PAYMENTS: {
        CHECKOUT: '/api/payments/checkout',
        SUBSCRIPTION: '/api/payments/subscription',
        PREMIUM: '/api/premium',
    },
} as const;

// ============================================================
// CHAIN CONFIGURATION
// ============================================================

export const SUPPORTED_CHAINS = {
    1: {
        id: 1,
        name: 'Ethereum',
        symbol: 'ETH',
        rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/',
        explorerUrl: 'https://etherscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    },
    137: {
        id: 137,
        name: 'Polygon',
        symbol: 'MATIC',
        rpcUrl: 'https://polygon.llamarpc.com',
        explorerUrl: 'https://polygonscan.com',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    },
    56: {
        id: 56,
        name: 'BNB Chain',
        symbol: 'BNB',
        rpcUrl: 'https://bsc-dataseed.binance.org',
        explorerUrl: 'https://bscscan.com',
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    },
    42161: {
        id: 42161,
        name: 'Arbitrum',
        symbol: 'ARB',
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        explorerUrl: 'https://arbiscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    },
    10: {
        id: 10,
        name: 'Optimism',
        symbol: 'OP',
        rpcUrl: 'https://mainnet.optimism.io',
        explorerUrl: 'https://optimistic.etherscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    },
    8453: {
        id: 8453,
        name: 'Base',
        symbol: 'BASE',
        rpcUrl: 'https://mainnet.base.org',
        explorerUrl: 'https://basescan.org',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    },
    43114: {
        id: 43114,
        name: 'Avalanche',
        symbol: 'AVAX',
        rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
        explorerUrl: 'https://snowtrace.io',
        nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
    },
} as const;

// ============================================================
// TOKEN ADDRESSES (Common tokens across chains)
// ============================================================

export const COMMON_TOKENS = {
    // Native token placeholder
    NATIVE: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',

    // Ethereum Mainnet
    1: {
        USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        DAI: '0x6B175474E89094C44Da98b954EescdeBCD380B50',
        WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    },

    // Polygon
    137: {
        USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
        WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    },

    // BNB Chain
    56: {
        USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        USDT: '0x55d398326f99059fF775485246999027B3197955',
        DAI: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
        WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    },
} as const;

// ============================================================
// FEATURE FLAGS
// ============================================================

export const FEATURE_FLAGS = {
    ENABLE_SNIPER_BOT: import.meta.env.VITE_ENABLE_SNIPER_BOT === 'true',
    ENABLE_MEV_PROTECTION: import.meta.env.VITE_ENABLE_MEV_PROTECTION !== 'false',
    ENABLE_CROSS_CHAIN: import.meta.env.VITE_ENABLE_CROSS_CHAIN !== 'false',
    ENABLE_INHERITANCE: import.meta.env.VITE_ENABLE_INHERITANCE !== 'false',
    ENABLE_DEFI: import.meta.env.VITE_ENABLE_DEFI !== 'false',
    ENABLE_NFT: import.meta.env.VITE_ENABLE_NFT !== 'false',
    ENABLE_FIAT_ONRAMP: import.meta.env.VITE_ENABLE_FIAT_ONRAMP !== 'false',
    ENABLE_TRADING_BOTS: import.meta.env.VITE_ENABLE_TRADING_BOTS !== 'false',
    ENABLE_WHALE_TRACKING: import.meta.env.VITE_ENABLE_WHALE_TRACKING !== 'false',
} as const;

export default {
    SERVICE_ENDPOINTS,
    API_ROUTES,
    SUPPORTED_CHAINS,
    COMMON_TOKENS,
    FEATURE_FLAGS,
};
