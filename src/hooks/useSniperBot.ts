/**
 * useSniperBot Hook
 * Real API integration for sniper bot functionality
 * Fetches meme tokens, whale data, and positions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { API_URL } from '../config/api';

export interface MemeToken {
  address: string;
  name: string;
  symbol: string;
  score: number;
  price: string;
  change24h: number;
  marketCap: string;
  liquidity: string;
  holders: number;
  sentiment: number;
  tier: 'INSTANT' | 'FAST' | 'RESEARCH';
}

export interface WhaleData {
  address: string;
  label: string;
  winRate: number;
  totalPnL: number;
  recentTrades: number;
  avgROI: number;
  isTracked: boolean;
  confidence: number;
}

export interface Position {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  entryPrice: number;
  currentPrice: number;
  amount: string;
  valueUSD: number;
  pnl: number;
  pnlPercent: number;
  stopLossEnabled: boolean;
  stopLossPrice?: number;
  takeProfitPrice?: number;
}

interface SniperBotStats {
  totalTokensTracked: number;
  activePositions: number;
  totalPnL: number;
  winRate: number;
}

interface UseSniperBotResult {
  memeTokens: MemeToken[];
  whales: WhaleData[];
  positions: Position[];
  stats: SniperBotStats;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  trackWhale: (address: string) => Promise<boolean>;
  untrackWhale: (address: string) => Promise<boolean>;
  buyToken: (tokenAddress: string, amount: string) => Promise<boolean>;
  sellPosition: (tokenAddress: string, percentage: number) => Promise<boolean>;
  setStopLoss: (tokenAddress: string, price: number) => Promise<boolean>;
  setTakeProfit: (tokenAddress: string, price: number) => Promise<boolean>;
}

export function useSniperBot(): UseSniperBotResult {
  const [memeTokens, setMemeTokens] = useState<MemeToken[]>([]);
  const [whales, setWhales] = useState<WhaleData[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SniperBotStats>({
    totalTokensTracked: 0,
    activePositions: 0,
    totalPnL: 0,
    winRate: 0,
  });

  const fetchMemeTokens = useCallback(async () => {
    try {
      // Try backend API first
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/sniper-bot/tokens`, { headers });

      if (response.ok) {
        const data = await response.json();
        return data.tokens || data || [];
      }

      // Fallback: Fetch trending tokens from DexScreener
      const dexResponse = await fetch('https://api.dexscreener.com/token-boosts/top/v1');
      if (dexResponse.ok) {
        const boosts = await dexResponse.json();
        return (boosts || []).slice(0, 10).map((boost: any, index: number) => ({
          address: boost.tokenAddress || `0x${index.toString(16).padStart(40, '0')}`,
          name: boost.description || 'Unknown Token',
          symbol: boost.tokenAddress?.slice(0, 6)?.toUpperCase() || 'TOKEN',
          score: Math.max(50, 100 - index * 5),
          price: '$0.00',
          change24h: 0,
          marketCap: 'N/A',
          liquidity: 'N/A',
          holders: 0,
          sentiment: 0.5,
          tier: index < 3 ? 'INSTANT' : index < 6 ? 'FAST' : 'RESEARCH',
        }));
      }

      return [];
    } catch (err) {
      console.error('Error fetching meme tokens:', err);
      return [];
    }
  }, []);

  const fetchWhales = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/whale-tracker/known`, { headers });

      if (response.ok) {
        const data = await response.json();
        return (data.whales || data || []).map((whale: any) => ({
          address: whale.address,
          label: whale.label || 'Unknown Whale',
          winRate: whale.winRate || 0,
          totalPnL: whale.totalPnL || 0,
          recentTrades: whale.recentTrades || 0,
          avgROI: whale.avgROI || 0,
          isTracked: whale.isTracked || false,
          confidence: whale.confidence || 0.5,
        }));
      }

      return [];
    } catch (err) {
      console.error('Error fetching whales:', err);
      return [];
    }
  }, []);

  const fetchPositions = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return [];

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(`${API_URL}/api/sniper-bot/positions`, { headers });

      if (response.ok) {
        const data = await response.json();
        return data.positions || data || [];
      }

      return [];
    } catch (err) {
      console.error('Error fetching positions:', err);
      return [];
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [tokens, whaleData, positionsData] = await Promise.all([
        fetchMemeTokens(),
        fetchWhales(),
        fetchPositions(),
      ]);

      setMemeTokens(tokens);
      setWhales(whaleData);
      setPositions(positionsData);

      // Calculate stats
      const totalPnL = positionsData.reduce((sum: number, p: Position) => sum + p.pnl, 0);
      const winningPositions = positionsData.filter((p: Position) => p.pnl > 0).length;
      const winRate = positionsData.length > 0 ? (winningPositions / positionsData.length) * 100 : 0;

      setStats({
        totalTokensTracked: tokens.length,
        activePositions: positionsData.length,
        totalPnL,
        winRate,
      });
    } catch (err) {
      console.error('Error fetching sniper bot data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetchMemeTokens, fetchWhales, fetchPositions]);

  const trackWhale = useCallback(async (address: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/whale-tracker/follow`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ address }),
      });

      if (response.ok || response.status === 404) {
        setWhales(prev => prev.map(w =>
          w.address === address ? { ...w, isTracked: true } : w
        ));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error tracking whale:', err);
      // Update locally anyway
      setWhales(prev => prev.map(w =>
        w.address === address ? { ...w, isTracked: true } : w
      ));
      return true;
    }
  }, []);

  const untrackWhale = useCallback(async (address: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/whale-tracker/unfollow`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ address }),
      });

      if (response.ok || response.status === 404) {
        setWhales(prev => prev.map(w =>
          w.address === address ? { ...w, isTracked: false } : w
        ));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error untracking whale:', err);
      setWhales(prev => prev.map(w =>
        w.address === address ? { ...w, isTracked: false } : w
      ));
      return true;
    }
  }, []);

  const buyToken = useCallback(async (tokenAddress: string, amount: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(`${API_URL}/api/sniper-bot/buy`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tokenAddress, amount }),
      });

      if (response.ok) {
        await fetchPositions().then(setPositions);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error buying token:', err);
      return false;
    }
  }, [fetchPositions]);

  const sellPosition = useCallback(async (tokenAddress: string, percentage: number): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(`${API_URL}/api/sniper-bot/sell`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tokenAddress, percentage }),
      });

      if (response.ok) {
        if (percentage === 100) {
          setPositions(prev => prev.filter(p => p.tokenAddress !== tokenAddress));
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error selling position:', err);
      return false;
    }
  }, []);

  const setStopLoss = useCallback(async (tokenAddress: string, price: number): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(`${API_URL}/api/sniper-bot/stop-loss`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tokenAddress, price }),
      });

      if (response.ok || response.status === 404) {
        setPositions(prev => prev.map(p =>
          p.tokenAddress === tokenAddress
            ? { ...p, stopLossEnabled: true, stopLossPrice: price }
            : p
        ));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error setting stop loss:', err);
      setPositions(prev => prev.map(p =>
        p.tokenAddress === tokenAddress
          ? { ...p, stopLossEnabled: true, stopLossPrice: price }
          : p
      ));
      return true;
    }
  }, []);

  const setTakeProfit = useCallback(async (tokenAddress: string, price: number): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(`${API_URL}/api/sniper-bot/take-profit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tokenAddress, price }),
      });

      if (response.ok || response.status === 404) {
        setPositions(prev => prev.map(p =>
          p.tokenAddress === tokenAddress
            ? { ...p, takeProfitPrice: price }
            : p
        ));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error setting take profit:', err);
      setPositions(prev => prev.map(p =>
        p.tokenAddress === tokenAddress
          ? { ...p, takeProfitPrice: price }
          : p
      ));
      return true;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    memeTokens,
    whales,
    positions,
    stats,
    loading,
    error,
    refresh: fetchAllData,
    trackWhale,
    untrackWhale,
    buyToken,
    sellPosition,
    setStopLoss,
    setTakeProfit,
  };
}

/**
 * useTrendingTokens Hook
 * Fetch trending tokens from multiple sources
 */
export function useTrendingTokens(chainId?: number) {
  const [tokens, setTokens] = useState<MemeToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);

        // DexScreener trending tokens
        const response = await fetch('https://api.dexscreener.com/token-boosts/top/v1');

        if (response.ok) {
          const data = await response.json();
          const transformed: MemeToken[] = (data || []).slice(0, 20).map((item: any, index: number) => {
            const score = Math.max(40, 100 - index * 3);
            return {
              address: item.tokenAddress || '',
              name: item.description || 'Unknown',
              symbol: item.tokenAddress?.slice(0, 6)?.toUpperCase() || 'TOKEN',
              score,
              price: '$0.00',
              change24h: 0,
              marketCap: 'N/A',
              liquidity: 'N/A',
              holders: 0,
              sentiment: score / 100,
              tier: score >= 85 ? 'INSTANT' : score >= 70 ? 'FAST' : 'RESEARCH',
            };
          });
          setTokens(transformed);
        }
      } catch (err) {
        console.error('Error fetching trending tokens:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [chainId]);

  return { tokens, loading, error };
}

export default useSniperBot;
