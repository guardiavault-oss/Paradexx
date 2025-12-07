// Hook for real-time mempool monitoring
import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../services/logger.service';
import { useWebSocket } from './useWebSocket';
import {
  getMempoolStats,
  getMempoolTransactions,
  getMempoolThreats,
  getNetworkMempoolStats,
  type MempoolStatsResponse,
  type MempoolTransaction,
  type MempoolThreat,
  type NetworkMempoolStats,
} from '@/utils/api-client';
import { useAuth } from '@/contexts/AuthContext';

export interface UseMempoolMonitoringOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  network?: string;
  subscribeToUpdates?: boolean;
}

export function useMempoolMonitoring(options: UseMempoolMonitoringOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 10000,
    network,
    subscribeToUpdates = true,
  } = options;

  const { session } = useAuth();
  const accessToken = session?.accessToken || '';
  const [stats, setStats] = useState<MempoolStatsResponse | null>(null);
  const [transactions, setTransactions] = useState<MempoolTransaction[]>([]);
  const [threats, setThreats] = useState<MempoolThreat[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkMempoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection for real-time updates
  const { connected: wsConnected, sendMessage } = useWebSocket({
    onMessage: useCallback((message: any) => {
      if (message.type === 'mempool_stats_update') {
        if (stats) {
          setStats({
            ...stats,
            unified: message.data,
          });
        }
      } else if (message.type === 'mempool_threat' || message.type === 'sandwich_detected') {
        setThreats(prev => [message.data, ...prev].slice(0, 100));
      }
    }, [stats]),
  });

  const fetchStats = useCallback(async () => {
    try {
      const data = await getMempoolStats(accessToken);
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch mempool stats');
      logger.error('Mempool stats error:', err);
    }
  }, [accessToken]);

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await getMempoolTransactions(
        {
          network,
          limit: 100,
          suspiciousOnly: false,
        },
        accessToken
      );
      setTransactions(data);
    } catch (err: any) {
      logger.error('Mempool transactions error:', err);
    }
  }, [accessToken, network]);

  const fetchThreats = useCallback(async () => {
    try {
      const data = await getMempoolThreats(
        {
          limit: 50,
          network,
        },
        accessToken
      );
      setThreats(data);
    } catch (err: any) {
      logger.error('Mempool threats error:', err);
    }
  }, [accessToken, network]);

  const fetchNetworkStats = useCallback(async () => {
    if (!network) return;
    
    try {
      const data = await getNetworkMempoolStats(network, accessToken);
      setNetworkStats(data);
    } catch (err: any) {
      logger.error('Network stats error:', err);
    }
  }, [accessToken, network]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchTransactions(),
      fetchThreats(),
      fetchNetworkStats(),
    ]);
    setLoading(false);
  }, [fetchStats, fetchTransactions, fetchThreats, fetchNetworkStats]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (subscribeToUpdates && wsConnected) {
      sendMessage({
        type: 'subscribe_mempool',
        data: { network },
      });
    }

    return () => {
      if (wsConnected) {
        sendMessage({
          type: 'unsubscribe_mempool',
        });
      }
    };
  }, [subscribeToUpdates, wsConnected, network, sendMessage]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    fetchAll();

    refreshIntervalRef.current = setInterval(() => {
      fetchAll();
    }, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchAll]);

  const refetch = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    stats,
    transactions,
    threats,
    networkStats,
    loading,
    error,
    refetch,
    wsConnected,
  };
}

