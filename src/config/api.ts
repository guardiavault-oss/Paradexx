/**
 * Centralized API Configuration
 *
 * All API endpoints and base URLs are defined here for consistency
 * across the application. Import from this file instead of defining
 * API_URL in individual components.
 */

// Base URLs
export const API_URL = import.meta.env?.VITE_API_URL || 'https://paradexx-production.up.railway.app';
export const WS_URL = API_URL.replace('https:', 'wss:').replace('http:', 'ws:');
export const GUARDIAVAULT_API_URL = import.meta.env?.VITE_GUARDIAVAULT_API_URL || 'http://localhost:5000/api';
export const SCARLETTE_API_URL = import.meta.env?.VITE_SCARLETTE_API_URL || `${API_URL}/api/scarlette`;

// Chain-specific RPC URLs
export const RPC_URLS: Record<number, string> = {
  1: import.meta.env?.VITE_ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
  11155111: import.meta.env?.VITE_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo',
  137: import.meta.env?.VITE_POLYGON_RPC_URL || 'https://polygon-mainnet.g.alchemy.com/v2/demo',
  42161: import.meta.env?.VITE_ARBITRUM_RPC_URL || 'https://arb-mainnet.g.alchemy.com/v2/demo',
  8453: import.meta.env?.VITE_BASE_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/demo',
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: `${API_URL}/api/auth/login`,
    register: `${API_URL}/api/auth/register`,
    logout: `${API_URL}/api/auth/logout`,
    refresh: `${API_URL}/api/auth/refresh`,
    verify: `${API_URL}/api/auth/verify`,
    me: `${API_URL}/api/auth/me`,
  },

  // User
  user: {
    profile: `${API_URL}/api/user/profile`,
    preferences: `${API_URL}/api/user/preferences`,
    notificationPreferences: `${API_URL}/api/user/notification-preferences`,
    subscription: `${API_URL}/api/user/subscription`,
  },

  // Wallet
  wallet: {
    balance: (address: string) => `${API_URL}/api/wallet/${address}/balance`,
    transactions: (address: string) => `${API_URL}/api/wallet/${address}/transactions`,
    tokens: (address: string) => `${API_URL}/api/wallet/${address}/tokens`,
    nfts: (address: string) => `${API_URL}/api/wallet/${address}/nfts`,
  },

  // Portfolio
  portfolio: {
    summary: (address: string) => `${API_URL}/api/portfolio/${address}`,
    performance: (address: string, timeframe: string) =>
      `${API_URL}/api/portfolio/${address}/performance?timeframe=${timeframe}`,
    risk: (address: string) => `${API_URL}/api/portfolio/${address}/risk`,
    history: (address: string, timeframe: string) =>
      `${API_URL}/api/portfolio/${address}/history?timeframe=${timeframe}`,
  },

  // Swap
  swap: {
    quote: `${API_URL}/api/swap/quote`,
    execute: `${API_URL}/api/swap/execute`,
    history: `${API_URL}/api/swap/history`,
    fees: `${API_URL}/api/swap/fees`,
  },

  // Security
  security: {
    checks: `${API_URL}/api/security/checks`,
    approvals: `${API_URL}/api/security/approvals`,
    dapps: `${API_URL}/api/security/dapps`,
    scan: `${API_URL}/api/security/scan`,
    revokeApproval: (approvalId: string) => `${API_URL}/api/security/approvals/${approvalId}/revoke`,
    disconnectDapp: (dappId: string) => `${API_URL}/api/security/dapps/${dappId}/disconnect`,
  },

  // Whale Tracker
  whaleTracker: {
    whales: `${API_URL}/api/whale-tracker/whales`,
    alerts: `${API_URL}/api/whale-tracker/alerts`,
    transactions: `${API_URL}/api/whale-tracker/transactions`,
    knownWhales: `${API_URL}/api/whale-tracker/known-whales`,
    stats: `${API_URL}/api/whale-tracker/stats`,
    follow: `${API_URL}/api/whale-tracker/follow`,
    unfollow: `${API_URL}/api/whale-tracker/unfollow`,
  },

  // Notifications
  notifications: {
    list: `${API_URL}/api/notifications`,
    markRead: (id: string) => `${API_URL}/api/notifications/${id}/read`,
    markAllRead: `${API_URL}/api/notifications/read-all`,
    delete: (id: string) => `${API_URL}/api/notifications/${id}`,
    clear: `${API_URL}/api/notifications/clear`,
  },

  // Guardian / Inheritance
  guardian: {
    notify: `${API_URL}/api/guardian/notify`,
    vaults: `${API_URL}/api/guardian/vaults`,
    create: `${API_URL}/api/guardian/create`,
    verify: `${API_URL}/api/guardian/verify`,
  },

  // Premium / Subscriptions
  premium: {
    features: `${API_URL}/api/premium/features`,
    lifetimePass: `${API_URL}/api/premium/lifetime-pass`,
    unlocked: `${API_URL}/api/premium/unlocked`,
    checkout: `${API_URL}/api/premium/checkout`,
  },

  // Transactions
  transactions: {
    simulate: `${API_URL}/api/transactions/simulate`,
    history: `${API_URL}/api/transactions/history`,
    pending: `${API_URL}/api/transactions/pending`,
  },

  // Airdrop
  airdrop: {
    active: `${API_URL}/api/airdrop/active`,
    claim: `${API_URL}/api/airdrop/claim`,
    eligibility: `${API_URL}/api/airdrop/eligibility`,
  },

  // WalletConnect
  walletConnect: {
    sessions: `${API_URL}/api/walletconnect/sessions`,
    connect: `${API_URL}/api/walletconnect/connect`,
    disconnect: `${API_URL}/api/walletconnect/disconnect`,
  },

  // Yield
  yield: {
    opportunities: `${API_URL}/api/yield/opportunities`,
    vaults: `${API_URL}/api/yield/vaults`,
    deposit: `${API_URL}/api/yield/deposit`,
    withdraw: `${API_URL}/api/yield/withdraw`,
  },

  // Dashboard Stats
  dashboard: {
    stats: `${API_URL}/api/dashboard/stats`,
    activity: `${API_URL}/api/dashboard/activity`,
  },
} as const;

// WebSocket endpoints
export const WS_ENDPOINTS = {
  notifications: `${WS_URL}/ws/notifications`,
  prices: `${WS_URL}/ws/prices`,
  transactions: `${WS_URL}/ws/transactions`,
  whaleAlerts: `${WS_URL}/ws/whale-alerts`,
} as const;

// External APIs
export const EXTERNAL_APIS = {
  coingecko: 'https://api.coingecko.com/api/v3',
  etherscan: 'https://api.etherscan.io/api',
  polygonscan: 'https://api.polygonscan.com/api',
  arbiscan: 'https://api.arbiscan.io/api',
  basescan: 'https://api.basescan.org/api',
} as const;

// Block explorers
export const BLOCK_EXPLORERS: Record<number, { name: string; url: string }> = {
  1: { name: 'Etherscan', url: 'https://etherscan.io' },
  11155111: { name: 'Sepolia Etherscan', url: 'https://sepolia.etherscan.io' },
  137: { name: 'Polygonscan', url: 'https://polygonscan.com' },
  42161: { name: 'Arbiscan', url: 'https://arbiscan.io' },
  8453: { name: 'BaseScan', url: 'https://basescan.org' },
  43114: { name: 'Snowtrace', url: 'https://snowtrace.io' },
};

// Get transaction URL
export function getTransactionUrl(chainId: number, txHash: string): string {
  const explorer = BLOCK_EXPLORERS[chainId] || BLOCK_EXPLORERS[1];
  return `${explorer.url}/tx/${txHash}`;
}

// Get address URL
export function getAddressUrl(chainId: number, address: string): string {
  const explorer = BLOCK_EXPLORERS[chainId] || BLOCK_EXPLORERS[1];
  return `${explorer.url}/address/${address}`;
}

// Get WebSocket URL - converts API URL to WebSocket URL
export function getWsUrl(baseUrl: string = API_URL): string {
  return baseUrl.replace('https:', 'wss:').replace('http:', 'ws:');
}

// Get API URL with optional path
export function getApiUrl(path: string = ''): string {
  return `${API_URL}${path}`;
}

// Get auth headers with token
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default {
  API_URL,
  WS_URL,
  API_ENDPOINTS,
  WS_ENDPOINTS,
  EXTERNAL_APIS,
  BLOCK_EXPLORERS,
  RPC_URLS,
  getTransactionUrl,
  getAddressUrl,
  getWsUrl,
  getApiUrl,
  getAuthHeaders,
};
