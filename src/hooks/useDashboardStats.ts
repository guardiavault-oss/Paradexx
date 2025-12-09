/**
 * useDashboardStats Hook
 * Combines portfolio, security, degen data for Dashboard component
 */

import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from './useDashboard';
import { useSecurityScore } from './useSecurityCenter';
import { useDegenData } from './useDegenData';
import { API_URL } from '../config/api';

export interface DashboardStats {
  portfolioValue: number;
  dailyPnL: number;
  dailyPnLPercent: number;
  degenScore: number;
  securityScore: number;
  monthlyYield: number;
  averageAPY: number;
  totalDeposited: number;
  activePools: number;
}

interface UseDashboardStatsResult {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Fetch yield/staking data from backend
async function fetchYieldStats(): Promise<{ monthlyYield: number; averageAPY: number; totalDeposited: number; activePools: number }> {
  try {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/api/defi/yield-stats`, { headers });

    if (response.ok) {
      const data = await response.json();
      return {
        monthlyYield: data.monthlyYield ?? data.monthly_yield ?? 0,
        averageAPY: data.averageAPY ?? data.average_apy ?? data.avgApy ?? 0,
        totalDeposited: data.totalDeposited ?? data.total_deposited ?? 0,
        activePools: data.activePools ?? data.active_pools ?? 0,
      };
    }

    // Try alternative endpoint
    const positionsResponse = await fetch(`${API_URL}/api/defi/positions`, { headers });
    if (positionsResponse.ok) {
      const positions = await positionsResponse.json();
      const positionsList = positions.positions || positions || [];

      if (positionsList.length > 0) {
        const totalAPY = positionsList.reduce((sum: number, p: { apy?: number }) => sum + (p.apy || 0), 0);
        const avgAPY = totalAPY / positionsList.length;
        const totalValue = positionsList.reduce((sum: number, p: { valueUSD?: number; amount?: number }) =>
          sum + (p.valueUSD || p.amount || 0), 0);

        return {
          monthlyYield: totalValue * (avgAPY / 100) / 12, // Estimate monthly yield
          averageAPY: avgAPY,
          totalDeposited: totalValue,
          activePools: positionsList.length,
        };
      }
    }
  } catch (err) {
    console.error('Error fetching yield stats:', err);
  }

  return {
    monthlyYield: 0,
    averageAPY: 0,
    totalDeposited: 0,
    activePools: 0,
  };
}

// Calculate PnL from token changes
function calculateDailyPnL(tokens: Array<{ value: number; change24h: number }>): { amount: number; percent: number } {
  if (!tokens.length) return { amount: 0, percent: 0 };

  const totalValue = tokens.reduce((sum, t) => sum + t.value, 0);
  const pnlAmount = tokens.reduce((sum, t) => sum + (t.value * t.change24h / 100), 0);
  const pnlPercent = totalValue > 0 ? (pnlAmount / totalValue) * 100 : 0;

  return {
    amount: pnlAmount,
    percent: pnlPercent,
  };
}

export function useDashboardStats(walletAddress?: string): UseDashboardStatsResult {
  const [yieldStats, setYieldStats] = useState({
    monthlyYield: 0,
    averageAPY: 0,
    totalDeposited: 0,
    activePools: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use existing hooks
  const dashboard = useDashboard(walletAddress);
  const security = useSecurityScore();
  const degen = useDegenData();

  // Fetch yield stats separately
  const fetchYield = useCallback(async () => {
    const stats = await fetchYieldStats();
    setYieldStats(stats);
  }, []);

  // Combined loading state
  const combinedLoading = dashboard.loading || security.loading || degen.isLoading || loading;

  // Combined error
  const combinedError = dashboard.error || degen.error || error;

  // Calculate stats from all sources
  const stats: DashboardStats = {
    portfolioValue: dashboard.totalBalance || 0,
    dailyPnL: calculateDailyPnL(dashboard.tokens).amount,
    dailyPnLPercent: calculateDailyPnL(dashboard.tokens).percent,
    degenScore: degen.stats?.degenScore || 0,
    securityScore: security.score || 0,
    monthlyYield: yieldStats.monthlyYield,
    averageAPY: yieldStats.averageAPY,
    totalDeposited: yieldStats.totalDeposited,
    activePools: yieldStats.activePools,
  };

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await fetchYield();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch yield stats');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchYield]);

  // Combined refresh function
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        dashboard.refresh(),
        security.refresh(),
        degen.refresh(),
        fetchYield(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh stats');
    } finally {
      setLoading(false);
    }
  }, [dashboard, security, degen, fetchYield]);

  return {
    stats,
    loading: combinedLoading,
    error: combinedError,
    refresh,
  };
}

// Export individual stat hooks for granular use
export function usePortfolioValue(address?: string) {
  const { stats, loading, refresh } = useDashboardStats(address);
  return {
    value: stats.portfolioValue,
    change: stats.dailyPnL,
    changePercent: stats.dailyPnLPercent,
    loading,
    refresh,
  };
}

export function useYieldStats() {
  const { stats, loading, refresh } = useDashboardStats();
  return {
    monthlyYield: stats.monthlyYield,
    averageAPY: stats.averageAPY,
    totalDeposited: stats.totalDeposited,
    activePools: stats.activePools,
    loading,
    refresh,
  };
}

export default useDashboardStats;
