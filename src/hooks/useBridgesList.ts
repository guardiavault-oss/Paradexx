/**
 * useBridgesList Hook
 * Provides a list of popular bridges with security data from API
 */

import { useState, useEffect, useCallback } from 'react';
import { bridgeSecurityService, type SecurityScore } from '../services/bridgeSecurityService';
import { API_URL } from '../config/api';

export interface Bridge {
  id: string;
  name: string;
  address: string;
  securityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  fees: number;
  avgTime: string;
  isAudited: boolean;
  recentIssues: string[];
  totalVolume: string;
  supported: string[];
  status: 'active' | 'inactive' | 'compromised' | 'maintenance';
  lastAudit?: string;
  validators: number;
  anomalyDetected?: boolean;
}

export interface SecurityAlert {
  id: string;
  bridgeId: string;
  bridgeName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  message: string;
  timestamp: number;
  resolved: boolean;
}

interface UseBridgesListResult {
  bridges: Bridge[];
  alerts: SecurityAlert[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getBridgeScore: (bridgeAddress: string) => Promise<SecurityScore | null>;
}

// Well-known bridges with base data
const KNOWN_BRIDGES: Omit<Bridge, 'securityScore' | 'riskLevel'>[] = [
  {
    id: '1',
    name: 'Stargate Finance',
    address: '0x8731d54E9D02c286767d56ac03e8037C07e01e98',
    fees: 0.05,
    avgTime: '5 min',
    isAudited: true,
    recentIssues: [],
    totalVolume: '$2.4B',
    supported: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'BSC', 'Avalanche'],
    status: 'active',
    lastAudit: '2024-02-15',
    validators: 15,
  },
  {
    id: '2',
    name: 'Synapse Protocol',
    address: '0x2796317b0fF8538F253012862c06787Adfb8cEb6',
    fees: 0.04,
    avgTime: '4 min',
    isAudited: true,
    recentIssues: [],
    totalVolume: '$1.8B',
    supported: ['Ethereum', 'Polygon', 'BSC', 'Avalanche', 'Fantom'],
    status: 'active',
    lastAudit: '2024-01-20',
    validators: 12,
  },
  {
    id: '3',
    name: 'Across Protocol',
    address: '0x4D9079Bb4165aeb4084c526a32695dCfd2F77381',
    fees: 0.03,
    avgTime: '3 min',
    isAudited: true,
    recentIssues: [],
    totalVolume: '$1.2B',
    supported: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base'],
    status: 'active',
    lastAudit: '2024-03-01',
    validators: 18,
  },
  {
    id: '4',
    name: 'Hop Protocol',
    address: '0xb8901acB165ed027E32754E0FFe830802919727f',
    fees: 0.06,
    avgTime: '6 min',
    isAudited: true,
    recentIssues: [],
    totalVolume: '$980M',
    supported: ['Ethereum', 'Polygon', 'Optimism', 'Arbitrum', 'Gnosis'],
    status: 'active',
    lastAudit: '2024-02-01',
    validators: 10,
  },
  {
    id: '5',
    name: 'Wormhole',
    address: '0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B',
    fees: 0.035,
    avgTime: '8 min',
    isAudited: true,
    recentIssues: [],
    totalVolume: '$3.5B',
    supported: ['Ethereum', 'Solana', 'BSC', 'Polygon', 'Avalanche', 'Fantom'],
    status: 'active',
    lastAudit: '2024-01-15',
    validators: 19,
  },
  {
    id: '6',
    name: 'Celer cBridge',
    address: '0x5427FEFA711Eff984124bFBB1AB6fbf5E3DA1820',
    fees: 0.04,
    avgTime: '5 min',
    isAudited: true,
    recentIssues: [],
    totalVolume: '$1.1B',
    supported: ['Ethereum', 'BSC', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche'],
    status: 'active',
    lastAudit: '2024-02-10',
    validators: 21,
  },
];

// Convert security score to risk level
function scoreToRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 8) return 'low';
  if (score >= 6) return 'medium';
  if (score >= 4) return 'high';
  return 'critical';
}

export function useBridgesList(): UseBridgesListResult {
  const [bridges, setBridges] = useState<Bridge[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get security score for a specific bridge
  const getBridgeScore = useCallback(async (bridgeAddress: string): Promise<SecurityScore | null> => {
    try {
      const score = await bridgeSecurityService.getSecurityScore(bridgeAddress, 'ethereum');
      return score;
    } catch (err) {
      console.warn('Failed to get bridge score:', err);
      return null;
    }
  }, []);

  // Fetch bridge list with security scores
  const fetchBridges = useCallback(async () => {
    try {
      // Try to fetch from API first
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/bridge/list`, { headers });

      if (response.ok) {
        const data = await response.json();
        if (data.bridges && Array.isArray(data.bridges)) {
          setBridges(data.bridges);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch bridges from API:', err);
    }

    // Fallback: Use known bridges and fetch security scores
    try {
      const bridgesWithScores: Bridge[] = await Promise.all(
        KNOWN_BRIDGES.map(async (bridge) => {
          try {
            const score = await bridgeSecurityService.getSecurityScore(bridge.address, 'ethereum');
            return {
              ...bridge,
              securityScore: score.overall_score,
              riskLevel: score.risk_level.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
              recentIssues: score.vulnerability_alerts || [],
              anomalyDetected: score.anomaly_detected,
              status: score.anomaly_detected ? 'compromised' as const : bridge.status,
            };
          } catch {
            // Use default values if API fails
            return {
              ...bridge,
              securityScore: 7.5, // Default medium-high score
              riskLevel: 'medium' as const,
            };
          }
        })
      );

      setBridges(bridgesWithScores);
    } catch (err) {
      // If all fails, use known bridges with default scores
      setBridges(
        KNOWN_BRIDGES.map(bridge => ({
          ...bridge,
          securityScore: 7.5,
          riskLevel: 'medium' as const,
        }))
      );
    }
  }, []);

  // Fetch security alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const { alerts: apiAlerts } = await bridgeSecurityService.getSecurityAlerts();

      // Map API alerts to component format
      const mappedAlerts: SecurityAlert[] = apiAlerts.map((alert, index) => ({
        id: alert.alert_id || `alert-${index}`,
        bridgeId: alert.affected_bridge || '',
        bridgeName: alert.bridge_name || 'Unknown Bridge',
        severity: alert.severity.toLowerCase() as 'critical' | 'high' | 'medium' | 'low',
        type: alert.alert_type,
        message: alert.description,
        timestamp: new Date(alert.timestamp).getTime(),
        resolved: alert.acknowledged || false,
      }));

      setAlerts(mappedAlerts);
    } catch (err) {
      console.warn('Failed to fetch security alerts:', err);
      // Don't fail completely, just log warning
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([fetchBridges(), fetchAlerts()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bridge data');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [fetchBridges, fetchAlerts]);

  // Refresh function
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([fetchBridges(), fetchAlerts()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [fetchBridges, fetchAlerts]);

  return {
    bridges,
    alerts,
    loading,
    error,
    refresh,
    getBridgeScore,
  };
}

export default useBridgesList;
