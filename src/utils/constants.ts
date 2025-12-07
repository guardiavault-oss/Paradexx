/**
 * Application Constants and Configuration
 */

// Application Info
export const APP_INFO = {
  NAME: 'Paradox Wallet',
  VERSION: '1.0.0',
  DESCRIPTION: 'The ultimate crypto wallet with Degen & Regen tribes',
  AUTHOR: 'Paradox Team',
} as const;

// Tribe Configuration
export const TRIBES = {
  DEGEN: {
    name: 'Degen',
    emoji: '🔥',
    primaryColor: '#DC143C',
    secondaryColor: '#8B0000',
    gradient: 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
    description: 'High-risk, high-reward trading',
  },
  REGEN: {
    name: 'Regen',
    emoji: '❄️',
    primaryColor: '#0080FF',
    secondaryColor: '#000080',
    gradient: 'linear-gradient(135deg, #0080FF 0%, #000080 100%)',
    description: 'Secure, long-term wealth building',
  },
} as const;

// Network Configuration
export const NETWORKS = {
  ETHEREUM: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/',
    explorerUrl: 'https://etherscan.io',
    logo: '⟠',
    color: '#627EEA',
  },
  POLYGON: {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    logo: '◆',
    color: '#8247E5',
  },
  ARBITRUM: {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    logo: '🔷',
    color: '#28A0F0',
  },
  OPTIMISM: {
    id: 10,
    name: 'Optimism',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    logo: '🔴',
    color: '#FF0420',
  },
  BASE: {
    id: 8453,
    name: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    logo: '🔵',
    color: '#0052FF',
  },
  BSC: {
    id: 56,
    name: 'BSC',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    logo: '⬣',
    color: '#F3BA2F',
  },
} as const;

// Token Standards
export const TOKEN_STANDARDS = {
  ERC20: 'ERC-20',
  ERC721: 'ERC-721',
  ERC1155: 'ERC-1155',
} as const;

// Transaction Types
export const TX_TYPES = {
  SEND: 'send',
  RECEIVE: 'receive',
  SWAP: 'swap',
  APPROVE: 'approve',
  CONTRACT: 'contract',
  NFT_TRANSFER: 'nft_transfer',
} as const;

// Transaction Status
export const TX_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  // Wallet
  WALLET_ADDRESS: 'wallet_address',
  WALLET_TYPE: 'wallet_type',
  CONNECTED_ACCOUNTS: 'connected_accounts',
  
  // User Preferences
  TRIBE: 'tribe',
  THEME: 'theme',
  LANGUAGE: 'language',
  CURRENCY: 'currency',
  
  // Settings
  NOTIFICATIONS: 'notifications',
  PRIVACY: 'privacy',
  SECURITY: 'security',
  
  // Cache
  TOKEN_PRICES: 'token_prices',
  NFT_METADATA: 'nft_metadata',
  TRANSACTION_HISTORY: 'transaction_history',
  
  // Other
  ONBOARDING_COMPLETE: 'onboarding_complete',
  LAST_VISITED: 'last_visited',
  SESSION_ID: 'session_id',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  WALLET: '/api/wallet',
  TRANSACTIONS: '/api/transactions',
  TOKENS: '/api/tokens',
  NFTS: '/api/nfts',
  PRICE: '/api/price',
  GAS: '/api/gas',
  GUARDIANS: '/api/guardians',
  INHERITANCE: '/api/inheritance',
} as const;

// Time Constants (in milliseconds)
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;

// Cache TTL
export const CACHE_TTL = {
  SHORT: 5 * TIME.MINUTE,
  MEDIUM: 15 * TIME.MINUTE,
  LONG: TIME.HOUR,
  VERY_LONG: TIME.DAY,
} as const;

// Limits
export const LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGE_SIZE: 2 * 1024 * 1024, // 2MB
  MAX_GUARDIANS: 10,
  MAX_BENEFICIARIES: 10,
  MAX_TRANSACTIONS_PER_PAGE: 50,
  MAX_NFTS_PER_PAGE: 20,
  MAX_SEARCH_RESULTS: 100,
} as const;

// Gas Limits
export const GAS_LIMITS = {
  SIMPLE_TRANSFER: 21000,
  TOKEN_TRANSFER: 65000,
  TOKEN_APPROVAL: 50000,
  SWAP: 150000,
  NFT_TRANSFER: 100000,
  CONTRACT_INTERACTION: 200000,
} as const;

// Regen Features
export const REGEN_FEATURES = {
  WALLET_GUARD: {
    name: 'Wallet Guard',
    emoji: '🛡️',
    description: 'Real-time scam detection',
  },
  INHERITANCE: {
    name: 'Inheritance Platform',
    emoji: '🏛️',
    description: 'Pass wealth to loved ones',
  },
  MEV_PROTECTION: {
    name: 'MEV Protection',
    emoji: '⚡',
    description: 'Protection from frontrunning',
  },
  ASSET_VAULT: {
    name: 'Asset Vault',
    emoji: '🔐',
    description: 'Time-locked asset storage',
  },
  GUARDIAN_RECOVERY: {
    name: 'Guardian Recovery',
    emoji: '👥',
    description: 'Social recovery system',
  },
  PORTFOLIO_INSURANCE: {
    name: 'Portfolio Insurance',
    emoji: '🏥',
    description: 'Smart contract coverage',
  },
  TAX_TRACKER: {
    name: 'Tax Tracker',
    emoji: '📊',
    description: 'Automated tax reporting',
  },
  LONG_TERM_STAKING: {
    name: 'Long-term Staking',
    emoji: '💎',
    description: 'Enhanced staking rewards',
  },
} as const;

// Degen Features (example - not fully implemented)
export const DEGEN_FEATURES = {
  LEVERAGE_TRADING: {
    name: 'Leverage Trading',
    emoji: '📈',
    description: 'Up to 100x leverage',
  },
  QUICK_SWAP: {
    name: 'Quick Swap',
    emoji: '⚡',
    description: 'Lightning-fast trades',
  },
  RUGPULL_SCANNER: {
    name: 'Rugpull Scanner',
    emoji: '🔍',
    description: 'Detect risky tokens',
  },
  MEMPOOL_SNIPER: {
    name: 'Mempool Sniper',
    emoji: '🎯',
    description: 'Front-run opportunities',
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  TRANSACTION_REJECTED: 'Transaction was rejected',
  NETWORK_ERROR: 'Network error occurred',
  INVALID_ADDRESS: 'Invalid wallet address',
  INVALID_AMOUNT: 'Invalid amount',
  GAS_TOO_HIGH: 'Gas price is too high',
  SLIPPAGE_TOO_HIGH: 'Slippage tolerance exceeded',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  TRANSACTION_SENT: 'Transaction sent successfully',
  TRANSACTION_CONFIRMED: 'Transaction confirmed',
  SETTINGS_SAVED: 'Settings saved successfully',
  GUARDIAN_ADDED: 'Guardian added successfully',
  BACKUP_CREATED: 'Backup created successfully',
} as const;

// URLs
export const URLS = {
  WEBSITE: 'https://paradoxwallet.io',
  DOCS: 'https://docs.paradoxwallet.io',
  SUPPORT: 'https://support.paradoxwallet.io',
  TWITTER: 'https://twitter.com/paradoxwallet',
  DISCORD: 'https://discord.gg/paradoxwallet',
  GITHUB: 'https://github.com/paradoxwallet',
  TERMS: 'https://paradoxwallet.io/terms',
  PRIVACY: 'https://paradoxwallet.io/privacy',
} as const;

// Feature Flags
export const FEATURES = {
  ENABLE_ANALYTICS: true,
  ENABLE_ERROR_REPORTING: true,
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_CACHE: true,
  ENABLE_DARK_MODE: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_BIOMETRICS: false,
  ENABLE_HARDWARE_WALLET: false,
} as const;

// Validation Rules
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
  MIN_AMOUNT: 0.000001,
  MAX_DECIMALS: 18,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Animation Durations (in ms)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Z-Index Layers
export const Z_INDEX = {
  DROPDOWN: 50,
  MODAL: 70,
  TOAST: 90,
  TOOLTIP: 100,
} as const;

// Breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Helper type for network keys
export type NetworkKey = keyof typeof NETWORKS;

// Helper type for tribe
export type TribeType = 'degen' | 'regen';

// Export all as default for convenience
export default {
  APP_INFO,
  TRIBES,
  NETWORKS,
  TOKEN_STANDARDS,
  TX_TYPES,
  TX_STATUS,
  STORAGE_KEYS,
  API_ENDPOINTS,
  TIME,
  CACHE_TTL,
  LIMITS,
  GAS_LIMITS,
  REGEN_FEATURES,
  DEGEN_FEATURES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  URLS,
  FEATURES,
  VALIDATION,
  PAGINATION,
  ANIMATION,
  Z_INDEX,
  BREAKPOINTS,
};
