/**
 * useYieldOpportunities Hook
 * Real API integration for DeFi yield opportunities
 * Fetches yield farming, staking, and lending opportunities
 */

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config/api';

export interface YieldOpportunity {
  id: string;
  protocol: string;
  protocolIcon?: string;
  chain: string;
  asset: string;
  apy: string;
  apyValue: number;
  tvl: string;
  tvlValue: number;
  riskLevel: 'low' | 'medium' | 'high';
  strategy: string;
  url?: string;
  featured?: boolean;
  rewards?: string[];
}

interface UseYieldOpportunitiesResult {
  opportunities: YieldOpportunity[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// DeFi Llama API for yield data
async function fetchFromDefiLlama(): Promise<YieldOpportunity[]> {
  try {
    const response = await fetch('https://yields.llama.fi/pools');

    if (response.ok) {
      const data = await response.json();

      // Get top 20 pools by TVL from major chains
      const pools = (data.data || [])
        .filter((pool: {
          chain: string;
          tvlUsd: number;
          project: string;
        }) => {
          const supportedChains = ['Ethereum', 'Arbitrum', 'Optimism', 'Polygon', 'BSC', 'Base'];
          return supportedChains.includes(pool.chain) && pool.tvlUsd > 1000000;
        })
        .sort((a: { tvlUsd: number }, b: { tvlUsd: number }) => b.tvlUsd - a.tvlUsd)
        .slice(0, 20);

      return pools.map((pool: {
        pool: string;
        project: string;
        chain: string;
        symbol: string;
        apyBase: number;
        apyReward: number;
        tvlUsd: number;
        rewardTokens: string[];
      }, index: number) => {
        const totalApy = (pool.apyBase || 0) + (pool.apyReward || 0);

        return {
          id: pool.pool || `${index}`,
          protocol: pool.project || 'Unknown',
          chain: pool.chain || 'Ethereum',
          asset: pool.symbol || 'UNKNOWN',
          apy: `${totalApy.toFixed(2)}%`,
          apyValue: totalApy,
          tvl: formatTVL(pool.tvlUsd),
          tvlValue: pool.tvlUsd,
          riskLevel: getRiskLevel(totalApy, pool.tvlUsd),
          strategy: getStrategy(pool.project),
          rewards: pool.rewardTokens || [],
        };
      });
    }
  } catch (err) {
    console.error('Error fetching from DeFi Llama:', err);
  }

  return [];
}

// Format TVL for display
function formatTVL(tvl: number): string {
  if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(2)}B`;
  if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(1)}M`;
  if (tvl >= 1e3) return `$${(tvl / 1e3).toFixed(1)}K`;
  return `$${tvl.toFixed(0)}`;
}

// Determine risk level based on APY and TVL
function getRiskLevel(apy: number, tvl: number): 'low' | 'medium' | 'high' {
  // High TVL and lower APY = safer
  if (tvl > 500_000_000 && apy < 10) return 'low';
  if (tvl > 100_000_000 && apy < 20) return 'low';
  if (tvl > 50_000_000 && apy < 30) return 'medium';
  if (apy > 50) return 'high';
  if (tvl < 10_000_000) return 'high';
  return 'medium';
}

// Map protocol to strategy type
function getStrategy(protocol: string): string {
  const strategyMap: Record<string, string> = {
    'aave': 'Lending',
    'compound': 'Lending',
    'lido': 'ETH Staking',
    'rocket-pool': 'ETH Staking',
    'curve': 'Liquidity Provision',
    'uniswap': 'Liquidity Provision',
    'sushiswap': 'Liquidity Provision',
    'convex': 'Yield Aggregation',
    'yearn': 'Auto-Compounding',
    'beefy': 'Auto-Compounding',
    'gmx': 'Perpetual LP',
    'frax': 'Stablecoin Staking',
  };

  const lowerProtocol = protocol.toLowerCase();
  for (const [key, strategy] of Object.entries(strategyMap)) {
    if (lowerProtocol.includes(key)) return strategy;
  }

  return 'Yield Farming';
}

// Fetch from backend API
async function fetchFromBackend(): Promise<YieldOpportunity[]> {
  try {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/api/yield/opportunities`, { headers });

    if (response.ok) {
      const data = await response.json();
      return data.opportunities || data || [];
    }
  } catch (err) {
    console.error('Error fetching from backend:', err);
  }

  return [];
}

export function useYieldOpportunities(): UseYieldOpportunitiesResult {
  const [opportunities, setOpportunities] = useState<YieldOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try backend first
      let data = await fetchFromBackend();

      // Fallback to DeFi Llama
      if (data.length === 0) {
        data = await fetchFromDefiLlama();
      }

      // Final fallback to default opportunities
      if (data.length === 0) {
        data = getDefaultOpportunities();
      }

      setOpportunities(data);
    } catch (err) {
      console.error('Error fetching yield opportunities:', err);
      setError('Failed to load yield opportunities');
      setOpportunities(getDefaultOpportunities());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Refresh every 5 minutes
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { opportunities, loading, error, refresh };
}

// Default opportunities as fallback
function getDefaultOpportunities(): YieldOpportunity[] {
  return [
    {
      id: '1',
      protocol: 'Aave V3',
      chain: 'Arbitrum',
      asset: 'USDC',
      apy: '4.8%',
      apyValue: 4.8,
      tvl: '$450M',
      tvlValue: 450_000_000,
      riskLevel: 'low',
      strategy: 'Lending',
    },
    {
      id: '2',
      protocol: 'Curve',
      chain: 'Ethereum',
      asset: 'ETH/stETH',
      apy: '6.2%',
      apyValue: 6.2,
      tvl: '$1.2B',
      tvlValue: 1_200_000_000,
      riskLevel: 'low',
      strategy: 'Liquidity Provision',
    },
    {
      id: '3',
      protocol: 'Lido',
      chain: 'Ethereum',
      asset: 'stETH',
      apy: '3.5%',
      apyValue: 3.5,
      tvl: '$14.2B',
      tvlValue: 14_200_000_000,
      riskLevel: 'low',
      strategy: 'ETH Staking',
    },
    {
      id: '4',
      protocol: 'GMX',
      chain: 'Arbitrum',
      asset: 'GLP',
      apy: '14.5%',
      apyValue: 14.5,
      tvl: '$280M',
      tvlValue: 280_000_000,
      riskLevel: 'medium',
      strategy: 'Perpetual LP',
    },
    {
      id: '5',
      protocol: 'Yearn Finance',
      chain: 'Optimism',
      asset: 'USDT',
      apy: '8.9%',
      apyValue: 8.9,
      tvl: '$125M',
      tvlValue: 125_000_000,
      riskLevel: 'medium',
      strategy: 'Auto-Compounding',
    },
    {
      id: '6',
      protocol: 'Beefy',
      chain: 'Polygon',
      asset: 'USDT-USDC LP',
      apy: '22.1%',
      apyValue: 22.1,
      tvl: '$45M',
      tvlValue: 45_000_000,
      riskLevel: 'high',
      strategy: 'LP Farming',
    },
  ];
}

export default useYieldOpportunities;
