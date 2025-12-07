import { useState, useEffect, useCallback } from 'react';
import { logger } from '../services/logger.service';

const API_BASE = '/api/degenx';

export interface DegenStats {
  totalTokensAnalyzed: number;
  rugChecksPassed: number;
  avgGuardianScore: number;
  degenScore?: number;
  winRate?: number;
  tradesCount?: number;
  rank?: number;
  level?: string;
  badges?: string[];
}

export interface DegenPnL {
  totalInvested: string;
  currentValue: string;
  realizedPnL: string;
  unrealizedPnL: string;
  totalPnL: string;
  pnlPercentage: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface Position {
  id: string;
  symbol: string;
  name: string;
  value: number;
  change: number;
  icon?: string;
  time?: string;
}

export interface Alert {
  id: string;
  type: 'whale' | 'rug' | 'signal' | 'meme';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  time: string;
  tokenSymbol?: string;
  valueUsd?: string;
}

export interface UseDegenDataReturn {
  stats: DegenStats | null;
  pnl: DegenPnL | null;
  positions: Position[];
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

async function fetchJson<T>(url: string): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return { data: null, error: 'Authentication required' };
      }
      return { data: null, error: `API error: ${response.status}` };
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    logger.warn(`[useDegenData] Fetch failed for ${url}:`, error);
    return { data: null, error: error instanceof Error ? error.message : 'Network error' };
  }
}

export function useDegenData(): UseDegenDataReturn {
  const [stats, setStats] = useState<DegenStats | null>(null);
  const [pnl, setPnl] = useState<DegenPnL | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statsResult, pnlResult, degenScoreResult, whaleAlertsResult] = await Promise.all([
        fetchJson<{ enabled: boolean; stats: DegenStats }>(`${API_BASE}`),
        fetchJson<DegenPnL>(`${API_BASE}/analytics/pnl`),
        fetchJson<{ score: number; level: string; rank: number; badges: string[]; stats: { tradesCount: number; winRate: number } }>(
          `${API_BASE}/analytics/degen-score`
        ),
        fetchJson<any[]>(`${API_BASE}/whale-alerts/recent?limit=10`),
      ]);

      let hasAnyData = false;

      if (statsResult.data) {
        hasAnyData = true;
        const baseStats = statsResult.data.stats || {
          totalTokensAnalyzed: 0,
          rugChecksPassed: 0,
          avgGuardianScore: 0,
        };
        
        if (degenScoreResult.data) {
          setStats({
            ...baseStats,
            degenScore: degenScoreResult.data.score,
            level: degenScoreResult.data.level,
            rank: degenScoreResult.data.rank,
            badges: degenScoreResult.data.badges,
            tradesCount: degenScoreResult.data.stats?.tradesCount,
            winRate: degenScoreResult.data.stats?.winRate,
          });
        } else {
          setStats(baseStats);
        }
      }

      if (pnlResult.data) {
        hasAnyData = true;
        setPnl(pnlResult.data);
      }

      if (whaleAlertsResult.data && Array.isArray(whaleAlertsResult.data)) {
        hasAnyData = true;
        const formattedAlerts: Alert[] = whaleAlertsResult.data.map((alert: any, index: number) => ({
          id: alert.id || `whale-${index}`,
          type: 'whale' as const,
          title: `${alert.whaleName || 'Whale'} ${alert.action || 'trade'}`,
          description: alert.amount && alert.tokenSymbol 
            ? `${alert.amount} ${alert.tokenSymbol}${alert.valueUsd ? ` ($${alert.valueUsd})` : ''}`
            : 'Whale activity detected',
          severity: alert.significance === 'massive' ? 'critical' : 
                    alert.significance === 'major' ? 'high' : 
                    alert.significance === 'notable' ? 'medium' : 'low',
          time: alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Just now',
          tokenSymbol: alert.tokenSymbol,
          valueUsd: alert.valueUsd,
        }));
        setAlerts(formattedAlerts);
      }

      setPositions([]);

      if (!hasAnyData) {
        const errorMessages = [
          statsResult.error,
          pnlResult.error,
          degenScoreResult.error,
        ].filter(Boolean);
        
        if (errorMessages.length > 0) {
          setError(errorMessages[0] || 'Failed to fetch data');
        }
      }

    } catch (err) {
      logger.error('[useDegenData] Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    stats,
    pnl,
    positions,
    alerts,
    isLoading,
    error,
    refresh,
  };
}
