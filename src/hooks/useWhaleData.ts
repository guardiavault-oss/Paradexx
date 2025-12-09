/**
 * useWhaleData - Hook for fetching whale tracking data
 * Connects to the whale-tracker.service.ts backend
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../services/logger.service';

const API_URL = import.meta.env?.VITE_API_URL || 'https://paradexx-production.up.railway.app';

// Types matching whale-tracker.service.ts
export interface WhaleWallet {
  address: string;
  label: string;
  category: 'dex_trader' | 'vc' | 'institution' | 'influencer' | 'smart_money' | 'unknown';
  profitability: number;
  winRate: number;
  avgHoldTime: number;
  totalVolume: string;
  lastActive: Date;
  tags: string[];
  following: boolean;
}

export interface WhaleTransaction {
  id: string;
  whaleAddress: string;
  whaleLabel: string;
  type: 'buy' | 'sell' | 'transfer' | 'swap' | 'liquidity';
  tokenSymbol: string;
  tokenName: string;
  amount: string;
  valueUsd: string;
  chainId: number;
  txHash: string;
  timestamp: Date;
}

export interface WhaleAlert {
  id: string;
  type: 'large_buy' | 'large_sell' | 'new_position' | 'exit_position' | 'accumulation' | 'distribution';
  severity: 'low' | 'medium' | 'high' | 'critical';
  whale: Partial<WhaleWallet>;
  transaction?: WhaleTransaction;
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  message: string;
  actionable: boolean;
  suggestedAction?: string;
  createdAt: Date;
}

export interface WhaleStats {
  totalTracked: number;
  alertsToday: number;
  bullishSignals: number;
  bearishSignals: number;
}

interface UseWhaleDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // ms
  chainId?: number;
  limit?: number;
}

interface UseWhaleDataReturn {
  whales: WhaleWallet[];
  alerts: WhaleAlert[];
  recentTransactions: WhaleTransaction[];
  stats: WhaleStats;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  followWhale: (address: string) => Promise<boolean>;
  unfollowWhale: (address: string) => Promise<boolean>;
}

export function useWhaleData(options: UseWhaleDataOptions = {}): UseWhaleDataReturn {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    chainId = 1,
    limit = 50,
  } = options;

  const [whales, setWhales] = useState<WhaleWallet[]>([]);
  const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<WhaleTransaction[]>([]);
  const [stats, setStats] = useState<WhaleStats>({
    totalTracked: 0,
    alertsToday: 0,
    bullishSignals: 0,
    bearishSignals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchWhaleData = useCallback(async () => {
    try {
      const [whalesRes, alertsRes, txRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/whale-tracker/whales?chainId=${chainId}&limit=${limit}`),
        fetch(`${API_URL}/api/whale-tracker/alerts?hours=24&chainId=${chainId}&limit=${limit}`),
        fetch(`${API_URL}/api/whale-tracker/transactions?chainId=${chainId}&limit=${limit}`),
      ]);

      if (!mountedRef.current) return;

      // Process whales response
      if (whalesRes.status === 'fulfilled' && whalesRes.value.ok) {
        const data = await whalesRes.value.json();
        setWhales(data.whales || []);
        setStats(prev => ({ ...prev, totalTracked: data.whales?.length || 0 }));
      }

      // Process alerts response
      if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
        const data = await alertsRes.value.json();
        const alertList = (data.alerts || []).map((a: WhaleAlert) => ({
          ...a,
          createdAt: new Date(a.createdAt),
        }));
        setAlerts(alertList);
        
        // Calculate stats
        const bullish = alertList.filter((a: WhaleAlert) => a.signal === 'bullish').length;
        const bearish = alertList.filter((a: WhaleAlert) => a.signal === 'bearish').length;
        setStats(prev => ({
          ...prev,
          alertsToday: alertList.length,
          bullishSignals: bullish,
          bearishSignals: bearish,
        }));
      }

      // Process transactions response
      if (txRes.status === 'fulfilled' && txRes.value.ok) {
        const data = await txRes.value.json();
        const txList = (data.transactions || []).map((tx: WhaleTransaction) => ({
          ...tx,
          timestamp: new Date(tx.timestamp),
        }));
        setRecentTransactions(txList);
      }

      setError(null);
    } catch (err) {
      if (mountedRef.current) {
        logger.error('Failed to fetch whale data:', err);
        setError('Failed to load whale data');
        
        // Set fallback data for UI display
        if (whales.length === 0) {
          setFallbackData();
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [chainId, limit, whales.length]);

  // Fallback data when API is unavailable
  const setFallbackData = () => {
    const knownWhales: WhaleWallet[] = [
      {
        address: '0x28c6c06298d514db089934071355e5743bf21d60',
        label: 'Binance 14',
        category: 'institution',
        profitability: 0,
        winRate: 0,
        avgHoldTime: 0,
        totalVolume: '$0',
        lastActive: new Date(),
        tags: ['exchange', 'cex'],
        following: false,
      },
      {
        address: '0x0716a17fbaee714f1e6ab0f9d59edbc5f09815c0',
        label: 'Jump Trading',
        category: 'vc',
        profitability: 0,
        winRate: 0,
        avgHoldTime: 0,
        totalVolume: '$0',
        lastActive: new Date(),
        tags: ['market-maker', 'vc'],
        following: false,
      },
      {
        address: '0x9aa99c23f67c81701c772b106b4f83f6e858dd2a',
        label: 'Wintermute',
        category: 'smart_money',
        profitability: 0,
        winRate: 0,
        avgHoldTime: 0,
        totalVolume: '$0',
        lastActive: new Date(),
        tags: ['market-maker', 'defi'],
        following: false,
      },
    ];
    
    setWhales(knownWhales);
    setStats({
      totalTracked: knownWhales.length,
      alertsToday: 0,
      bullishSignals: 0,
      bearishSignals: 0,
    });
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchWhaleData();
  }, [fetchWhaleData]);

  const followWhale = useCallback(async (address: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/whale-tracker/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      
      if (response.ok) {
        setWhales(prev => 
          prev.map(w => 
            w.address.toLowerCase() === address.toLowerCase() 
              ? { ...w, following: true } 
              : w
          )
        );
        return true;
      }
      return false;
    } catch (err) {
      logger.error('Failed to follow whale:', err);
      return false;
    }
  }, []);

  const unfollowWhale = useCallback(async (address: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/whale-tracker/unfollow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      
      if (response.ok) {
        setWhales(prev => 
          prev.map(w => 
            w.address.toLowerCase() === address.toLowerCase() 
              ? { ...w, following: false } 
              : w
          )
        );
        return true;
      }
      return false;
    } catch (err) {
      logger.error('Failed to unfollow whale:', err);
      return false;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchWhaleData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchWhaleData]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(fetchWhaleData, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchWhaleData]);

  return {
    whales,
    alerts,
    recentTransactions,
    stats,
    loading,
    error,
    refresh,
    followWhale,
    unfollowWhale,
  };
}

// Simple hook for whale alerts only
export function useWhaleAlerts(hours = 24, chainId = 1) {
  const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/whale-tracker/alerts?hours=${hours}&chainId=${chainId}`
        );
        if (response.ok) {
          const data = await response.json();
          setAlerts(data.alerts || []);
        }
      } catch (err) {
        logger.error('Failed to fetch whale alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [hours, chainId]);

  return { alerts, loading };
}

// Hook for known whale wallets
export function useKnownWhales(chainId = 1) {
  const [whales, setWhales] = useState<WhaleWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKnownWhales = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/api/whale-tracker/known-whales?chainId=${chainId}`
        );
        if (response.ok) {
          const data = await response.json();
          setWhales(data.whales || []);
        } else {
          setError('Failed to fetch known whales');
        }
      } catch (err) {
        logger.error('Failed to fetch known whales:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchKnownWhales();
  }, [chainId]);

  return { whales, loading, error };
}

// Hook for whale statistics
export function useWhaleStats(chainId = 1) {
  const [stats, setStats] = useState<WhaleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/api/whale-tracker/stats?chainId=${chainId}`
        );
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats || null);
        } else {
          setError('Failed to fetch whale stats');
        }
      } catch (err) {
        logger.error('Failed to fetch whale stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [chainId]);

  return { stats, loading, error };
}
