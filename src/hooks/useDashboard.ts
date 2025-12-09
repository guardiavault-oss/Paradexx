/**
 * useDashboard Hook
 * Real API integration for dashboard data
 * Fetches portfolio, watchlist, pending transactions, and positions
 */

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config/api';

export interface TokenBalance {
  symbol: string;
  name?: string;
  address?: string;
  balance: string;
  value: number;
  icon: string;
  change24h: number;
  chartData: number[];
  price?: number;
  decimals?: number;
}

export interface WatchlistItem {
  symbol: string;
  price: number;
  change24h: number;
  starred: boolean;
}

export interface PendingTransaction {
  hash: string;
  action: string;
  status: 'pending' | 'confirming' | 'confirmed' | 'failed';
  timeLeft?: string;
  timestamp?: number;
}

export interface DeFiPosition {
  id?: string;
  protocol: string;
  protocolIcon?: string;
  asset: string;
  amount: number;
  apy: number;
  type: 'lending' | 'liquidity' | 'staking' | 'farming';
  valueUSD?: number;
}

export interface GasPrice {
  slow: number;
  standard: number;
  fast: number;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  triggered: boolean;
}

interface DashboardData {
  tokens: TokenBalance[];
  watchlist: WatchlistItem[];
  pendingTxs: PendingTransaction[];
  positions: DeFiPosition[];
  gasPrice: GasPrice;
  priceAlerts: PriceAlert[];
  totalBalance: number;
  totalChange24h: number;
}

interface UseDashboardResult extends DashboardData {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addToWatchlist: (symbol: string) => Promise<boolean>;
  removeFromWatchlist: (symbol: string) => Promise<boolean>;
  addPriceAlert: (alert: Omit<PriceAlert, 'id' | 'triggered'>) => Promise<boolean>;
  removePriceAlert: (alertId: string) => Promise<boolean>;
}

// Fetch gas prices from Etherscan or backend
async function fetchGasPrice(): Promise<GasPrice> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const etherscanKey = (import.meta as any).env?.VITE_ETHERSCAN_API_KEY;

    if (etherscanKey) {
      const response = await fetch(
        `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${etherscanKey}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === '1' && data.result) {
          return {
            slow: Number.parseInt(data.result.SafeGasPrice),
            standard: Number.parseInt(data.result.ProposeGasPrice),
            fast: Number.parseInt(data.result.FastGasPrice),
          };
        }
      }
    }

    // Try backend API
    const response = await fetch(`${API_URL}/api/gas-price`);
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.error('Error fetching gas price:', err);
  }

  // Default fallback
  return { slow: 15, standard: 20, fast: 30 };
}

// Fetch token balances from backend or blockchain
async function fetchTokenBalances(address: string | null): Promise<TokenBalance[]> {
  try {
    if (!address) {
      // Return default demo data if no address
      return [];
    }

    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    // Try backend API first
    const response = await fetch(`${API_URL}/api/portfolio/tokens?address=${address}`, { headers });

    if (response.ok) {
      const data = await response.json();
      return data.tokens || data || [];
    }

    // Try Etherscan token API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const etherscanKey = (import.meta as any).env?.VITE_ETHERSCAN_API_KEY;
    if (etherscanKey) {
      const ethResponse = await fetch(
        `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${etherscanKey}`
      );

      if (ethResponse.ok) {
        const ethData = await ethResponse.json();
        if (ethData.result && Array.isArray(ethData.result)) {
          // Process token transactions to get balances
          const tokenMap = new Map<string, TokenBalance>();

          // Get unique tokens
          ethData.result.slice(0, 20).forEach((tx: {
            tokenSymbol: string;
            tokenName: string;
            contractAddress: string;
            tokenDecimal: string;
          }) => {
            if (!tokenMap.has(tx.tokenSymbol)) {
              tokenMap.set(tx.tokenSymbol, {
                symbol: tx.tokenSymbol,
                name: tx.tokenName,
                address: tx.contractAddress,
                balance: '0',
                value: 0,
                icon: tx.tokenSymbol.charAt(0),
                change24h: 0,
                chartData: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                decimals: Number.parseInt(tx.tokenDecimal),
              });
            }
          });

          return Array.from(tokenMap.values()).slice(0, 10);
        }
      }
    }

    return [];
  } catch (err) {
    console.error('Error fetching token balances:', err);
    return [];
  }
}

// Fetch watchlist from backend or local storage
async function fetchWatchlist(): Promise<WatchlistItem[]> {
  try {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/api/watchlist`, { headers });

    if (response.ok) {
      const data = await response.json();
      return data.items || data || [];
    }

    // Try local storage
    const stored = localStorage.getItem('watchlist');
    if (stored) {
      return JSON.parse(stored);
    }

    // Default watchlist
    return [
      { symbol: 'ETH', price: 2450, change24h: 2.5, starred: true },
      { symbol: 'BTC', price: 43000, change24h: 1.2, starred: true },
      { symbol: 'SOL', price: 98, change24h: 5.3, starred: true },
    ];
  } catch (err) {
    console.error('Error fetching watchlist:', err);
    return [];
  }
}

// Fetch pending transactions
async function fetchPendingTransactions(address: string | null): Promise<PendingTransaction[]> {
  try {
    if (!address) return [];

    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/api/transactions/pending?address=${address}`, { headers });

    if (response.ok) {
      const data = await response.json();
      return data.transactions || data || [];
    }

    // Check local pending transactions
    const stored = localStorage.getItem('pending_transactions');
    if (stored) {
      const pending = JSON.parse(stored);
      return pending.filter((tx: PendingTransaction) => tx.status === 'pending' || tx.status === 'confirming');
    }

    return [];
  } catch (err) {
    console.error('Error fetching pending transactions:', err);
    return [];
  }
}

// Fetch DeFi positions from backend
async function fetchPositions(address: string | null): Promise<DeFiPosition[]> {
  try {
    if (!address) return [];

    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/api/defi/positions?address=${address}`, { headers });

    if (response.ok) {
      const data = await response.json();
      return data.positions || data || [];
    }

    // Try Zapper API alternative
    const zapperResponse = await fetch(
      `https://api.zapper.xyz/v2/balances?addresses[]=${address}&networks[]=ethereum`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (zapperResponse.ok) {
      const zapperData = await zapperResponse.json();
      // Process Zapper data
      return (zapperData.balances || []).slice(0, 5).map((b: {
        protocol?: string;
        symbol?: string;
        balance?: number;
        type?: string;
      }) => ({
        protocol: b.protocol || 'Unknown',
        asset: b.symbol || 'Unknown',
        amount: b.balance || 0,
        apy: 0,
        type: b.type || 'lending',
      }));
    }

    return [];
  } catch (err) {
    console.error('Error fetching positions:', err);
    return [];
  }
}

// Fetch price alerts
async function fetchPriceAlerts(): Promise<PriceAlert[]> {
  try {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/api/alerts/price`, { headers });

    if (response.ok) {
      const data = await response.json();
      return data.alerts || data || [];
    }

    // Try local storage
    const stored = localStorage.getItem('price_alerts');
    if (stored) {
      return JSON.parse(stored);
    }

    return [];
  } catch (err) {
    console.error('Error fetching price alerts:', err);
    return [];
  }
}

export function useDashboard(address?: string | null): UseDashboardResult {
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [pendingTxs, setPendingTxs] = useState<PendingTransaction[]>([]);
  const [positions, setPositions] = useState<DeFiPosition[]>([]);
  const [gasPrice, setGasPrice] = useState<GasPrice>({ slow: 15, standard: 20, fast: 30 });
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get address from prop or localStorage
  const walletAddress = address || localStorage.getItem('wallet_address') || null;

  // Calculate total balance and change
  const totalBalance = tokens.reduce((sum, t) => sum + t.value, 0);
  const totalChange24h = tokens.length > 0
    ? tokens.reduce((sum, t) => sum + (t.value * t.change24h / 100), 0) / totalBalance * 100
    : 0;

  // Refresh all dashboard data
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [tokensData, watchlistData, pendingData, positionsData, gasData, alertsData] = await Promise.all([
        fetchTokenBalances(walletAddress),
        fetchWatchlist(),
        fetchPendingTransactions(walletAddress),
        fetchPositions(walletAddress),
        fetchGasPrice(),
        fetchPriceAlerts(),
      ]);

      setTokens(tokensData);
      setWatchlist(watchlistData);
      setPendingTxs(pendingData);
      setPositions(positionsData);
      setGasPrice(gasData);
      setPriceAlerts(alertsData);
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Add to watchlist
  const addToWatchlist = useCallback(async (symbol: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/watchlist`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ symbol }),
      });

      if (response.ok) {
        await refresh();
        return true;
      }

      // Add locally
      const newItem: WatchlistItem = { symbol, price: 0, change24h: 0, starred: true };
      setWatchlist(prev => [...prev, newItem]);
      localStorage.setItem('watchlist', JSON.stringify([...watchlist, newItem]));
      return true;
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      return false;
    }
  }, [refresh, watchlist]);

  // Remove from watchlist
  const removeFromWatchlist = useCallback(async (symbol: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/watchlist/${symbol}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        await refresh();
        return true;
      }

      // Remove locally
      const updated = watchlist.filter(w => w.symbol !== symbol);
      setWatchlist(updated);
      localStorage.setItem('watchlist', JSON.stringify(updated));
      return true;
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      return false;
    }
  }, [refresh, watchlist]);

  // Add price alert
  const addPriceAlert = useCallback(async (alert: Omit<PriceAlert, 'id' | 'triggered'>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/alerts/price`, {
        method: 'POST',
        headers,
        body: JSON.stringify(alert),
      });

      if (response.ok) {
        await refresh();
        return true;
      }

      // Add locally
      const newAlert: PriceAlert = {
        ...alert,
        id: `alert-${Date.now()}`,
        triggered: false,
      };
      const updated = [...priceAlerts, newAlert];
      setPriceAlerts(updated);
      localStorage.setItem('price_alerts', JSON.stringify(updated));
      return true;
    } catch (err) {
      console.error('Error adding price alert:', err);
      return false;
    }
  }, [refresh, priceAlerts]);

  // Remove price alert
  const removePriceAlert = useCallback(async (alertId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/alerts/price/${alertId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        await refresh();
        return true;
      }

      // Remove locally
      const updated = priceAlerts.filter(a => a.id !== alertId);
      setPriceAlerts(updated);
      localStorage.setItem('price_alerts', JSON.stringify(updated));
      return true;
    } catch (err) {
      console.error('Error removing price alert:', err);
      return false;
    }
  }, [refresh, priceAlerts]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh gas prices every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const newGas = await fetchGasPrice();
      setGasPrice(newGas);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    tokens,
    watchlist,
    pendingTxs,
    positions,
    gasPrice,
    priceAlerts,
    totalBalance,
    totalChange24h,
    loading,
    error,
    refresh,
    addToWatchlist,
    removeFromWatchlist,
    addPriceAlert,
    removePriceAlert,
  };
}

// Export individual hooks for specific use cases
export function useGasPrice() {
  const [gasPrice, setGasPrice] = useState<GasPrice>({ slow: 15, standard: 20, fast: 30 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const gas = await fetchGasPrice();
      setGasPrice(gas);
      setLoading(false);
    };
    load();

    // Refresh every 30 seconds
    const interval = setInterval(async () => {
      const gas = await fetchGasPrice();
      setGasPrice(gas);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return { gasPrice, loading };
}

export function useWatchlist() {
  const { watchlist, loading, addToWatchlist, removeFromWatchlist, refresh } = useDashboard();
  return { watchlist, loading, add: addToWatchlist, remove: removeFromWatchlist, refresh };
}

export function usePortfolio(address?: string) {
  const { tokens, totalBalance, totalChange24h, loading, refresh } = useDashboard(address);
  return { tokens, totalBalance, totalChange24h, loading, refresh };
}
