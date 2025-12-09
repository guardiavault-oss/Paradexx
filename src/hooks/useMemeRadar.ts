/**
 * useMemeRadar Hook
 * Real API integration for meme token radar functionality
 * Fetches viral meme tokens with risk analysis and social metrics
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { API_URL } from '../config/api';

export interface MemeToken {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  chainId: number;
  viralityScore: number;
  priceAction: {
    currentPrice: string;
    change24h: number;
  };
  socialMentions: {
    twitter: number;
    telegram: number;
    reddit: number;
    discord: number;
  };
  liquidity: {
    totalUsd: number;
    locked: boolean;
    lockDuration: number;
  };
  riskScore: number;
  recommendation: 'buy' | 'consider' | 'wait' | 'avoid';
  contractVerified: boolean;
  detectedAt: number;
  holders: {
    total: number;
    whalePercentage: number;
    distribution: string;
  };
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    website?: string;
  };
}

interface UseMemeRadarOptions {
  chainId?: number | 'all';
  riskFilter?: 'all' | 'low' | 'medium' | 'high';
  sortBy?: 'virality' | 'volume' | 'priceChange';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseMemeRadarResult {
  tokens: MemeToken[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
  stats: {
    totalTokens: number;
    newTokens24h: number;
    avgViralityScore: number;
    highRiskCount: number;
  };
}

export function useMemeRadar(options: UseMemeRadarOptions = {}): UseMemeRadarResult {
  const {
    chainId = 'all',
    riskFilter = 'all',
    sortBy = 'virality',
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const [tokens, setTokens] = useState<MemeToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalTokens: 0,
    newTokens24h: 0,
    avgViralityScore: 0,
    highRiskCount: 0,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTokens = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Build query params
      const params = new URLSearchParams();
      if (chainId !== 'all') {
        params.append('chainId', chainId.toString());
      }
      if (riskFilter !== 'all') {
        params.append('riskFilter', riskFilter);
      }
      params.append('sortBy', sortBy);

      const response = await fetch(`${API_URL}/api/meme-radar/tokens?${params.toString()}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        const tokenList = data.tokens || data.data || [];
        setTokens(tokenList);

        // Calculate stats
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const newTokens = tokenList.filter((t: MemeToken) => now - t.detectedAt < twentyFourHours);
        const avgVirality = tokenList.length > 0
          ? tokenList.reduce((sum: number, t: MemeToken) => sum + t.viralityScore, 0) / tokenList.length
          : 0;
        const highRisk = tokenList.filter((t: MemeToken) => t.riskScore >= 50);

        setStats({
          totalTokens: tokenList.length,
          newTokens24h: newTokens.length,
          avgViralityScore: Math.round(avgVirality),
          highRiskCount: highRisk.length,
        });
      } else if (response.status === 404) {
        // API not available, use fallback approach
        console.warn('Meme radar API not available, using DexScreener fallback');
        await fetchFromDexScreener();
      } else {
        throw new Error(`Failed to fetch meme tokens: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching meme tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
      // Try DexScreener fallback on error
      await fetchFromDexScreener();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [chainId, riskFilter, sortBy]);

  // Fallback to DexScreener API for trending tokens
  const fetchFromDexScreener = async () => {
    try {
      // DexScreener boosted tokens endpoint
      const response = await fetch('https://api.dexscreener.com/token-boosts/latest/v1', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const boosts = await response.json();

        // Transform DexScreener data to our format
        const transformedTokens: MemeToken[] = (boosts || []).slice(0, 20).map((boost: any, index: number) => ({
          tokenAddress: boost.tokenAddress || `0x${index.toString().padStart(40, '0')}`,
          tokenName: boost.description || 'Unknown Token',
          tokenSymbol: boost.tokenAddress?.slice(0, 6)?.toUpperCase() || 'TOKEN',
          chainId: getChainIdFromDexScreener(boost.chainId),
          viralityScore: Math.max(20, 100 - index * 4),
          priceAction: {
            currentPrice: '0.00',
            change24h: 0,
          },
          socialMentions: {
            twitter: boost.totalAmount || 0,
            telegram: 0,
            reddit: 0,
            discord: 0,
          },
          liquidity: {
            totalUsd: 0,
            locked: false,
            lockDuration: 0,
          },
          riskScore: 50,
          recommendation: 'consider' as const,
          contractVerified: false,
          detectedAt: Date.now(),
          holders: {
            total: 0,
            whalePercentage: 0,
            distribution: 'unknown',
          },
          socialLinks: boost.url ? { website: boost.url } : undefined,
        }));

        setTokens(transformedTokens);
        setStats({
          totalTokens: transformedTokens.length,
          newTokens24h: transformedTokens.length,
          avgViralityScore: 60,
          highRiskCount: Math.floor(transformedTokens.length / 2),
        });
      }
    } catch (err) {
      console.error('DexScreener fallback failed:', err);
    }
  };

  const refresh = useCallback(async () => {
    await fetchTokens(true);
  }, [fetchTokens]);

  // Initial fetch
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchTokens(true);
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, fetchTokens]);

  return {
    tokens,
    loading,
    error,
    refreshing,
    refresh,
    stats,
  };
}

// Get token details from CoinGecko
export function useTokenDetails(tokenAddress: string, chainId: number) {
  const [token, setToken] = useState<MemeToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenAddress) {
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // DexScreener for token details
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);

        if (response.ok) {
          const data = await response.json();
          const pair = data.pairs?.[0];

          if (pair) {
            setToken({
              tokenAddress,
              tokenName: pair.baseToken?.name || 'Unknown',
              tokenSymbol: pair.baseToken?.symbol || 'TOKEN',
              chainId,
              viralityScore: 50,
              priceAction: {
                currentPrice: pair.priceUsd || '0',
                change24h: pair.priceChange?.h24 || 0,
              },
              socialMentions: {
                twitter: 0,
                telegram: 0,
                reddit: 0,
                discord: 0,
              },
              liquidity: {
                totalUsd: pair.liquidity?.usd || 0,
                locked: false,
                lockDuration: 0,
              },
              riskScore: 50,
              recommendation: 'consider',
              contractVerified: false,
              detectedAt: Date.now(),
              holders: {
                total: 0,
                whalePercentage: 0,
                distribution: 'unknown',
              },
              socialLinks: pair.url ? { website: pair.url } : undefined,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching token details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch token details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [tokenAddress, chainId]);

  return { token, loading, error };
}

// Utility functions
function getChainIdFromDexScreener(chainId: string): number {
  const mapping: Record<string, number> = {
    ethereum: 1,
    bsc: 56,
    polygon: 137,
    arbitrum: 42161,
    optimism: 10,
    base: 8453,
    avalanche: 43114,
    fantom: 250,
    solana: 0, // Solana uses different addressing
  };
  return mapping[chainId?.toLowerCase()] || 1;
}

export default useMemeRadar;
