/**
 * React Hook for Bridge Security Service
 * Provides easy access to bridge security analysis and monitoring
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { bridgeSecurityService, SecurityScore, BridgeAnalysis, ComprehensiveScanResult, SecurityAlert } from '../services/bridgeSecurityService';

export interface UseBridgeSecurityOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  onError?: (error: Error) => void;
}

export interface BridgeSecurityState {
  securityScore: SecurityScore | null;
  bridgeAnalysis: BridgeAnalysis | null;
  scanResult: ComprehensiveScanResult | null;
  alerts: SecurityAlert[];
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

/**
 * Hook for getting bridge security score
 */
export function useBridgeSecurityScore(
  bridgeAddress: string | null,
  network: string | null,
  options: UseBridgeSecurityOptions = {}
) {
  const [state, setState] = useState<BridgeSecurityState>({
    securityScore: null,
    bridgeAnalysis: null,
    scanResult: null,
    alerts: [],
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSecurityScore = useCallback(async () => {
    if (!bridgeAddress || !network) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const score = await bridgeSecurityService.getSecurityScore(bridgeAddress, network);
      setState(prev => ({
        ...prev,
        securityScore: score,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch security score');
      setState(prev => ({
        ...prev,
        loading: false,
        error: err,
      }));
      options.onError?.(err);
    }
  }, [bridgeAddress, network, options]);

  const fetchAnalysis = useCallback(async (
    sourceNetwork: string,
    targetNetwork: string,
    analysisDepth: 'basic' | 'comprehensive' | 'deep' = 'comprehensive'
  ) => {
    if (!bridgeAddress) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const analysis = await bridgeSecurityService.analyzeBridge(
        bridgeAddress,
        sourceNetwork,
        targetNetwork,
        analysisDepth
      );
      setState(prev => ({
        ...prev,
        bridgeAnalysis: analysis,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch bridge analysis');
      setState(prev => ({
        ...prev,
        loading: false,
        error: err,
      }));
      options.onError?.(err);
    }
  }, [bridgeAddress, options]);

  const fetchComprehensiveScan = useCallback(async (
    transactionData?: any[],
    scanOptions?: {
      include_attack_analysis?: boolean;
      include_signature_analysis?: boolean;
      include_attestation_analysis?: boolean;
      include_quorum_analysis?: boolean;
      deep_scan?: boolean;
    }
  ) => {
    if (!bridgeAddress || !network) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const scan = await bridgeSecurityService.comprehensiveSecurityScan(
        bridgeAddress,
        network,
        transactionData,
        scanOptions
      );
      setState(prev => ({
        ...prev,
        scanResult: scan,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to perform security scan');
      setState(prev => ({
        ...prev,
        loading: false,
        error: err,
      }));
      options.onError?.(err);
    }
  }, [bridgeAddress, network, options]);

  const fetchAlerts = useCallback(async () => {
    try {
      const { alerts } = await bridgeSecurityService.getSecurityAlerts();
      setState(prev => ({
        ...prev,
        alerts: alerts.filter(alert => 
          !bridgeAddress || alert.affected_bridge?.toLowerCase() === bridgeAddress.toLowerCase()
        ),
      }));
    } catch (error) {
      console.error('Failed to fetch security alerts:', error);
    }
  }, [bridgeAddress]);

  // Initial fetch
  useEffect(() => {
    if (bridgeAddress && network) {
      fetchSecurityScore();
      fetchAlerts();
    }
  }, [bridgeAddress, network, fetchSecurityScore, fetchAlerts]);

  // Auto-refresh
  useEffect(() => {
    if (options.autoRefresh && bridgeAddress && network) {
      const interval = options.refreshInterval || 60000; // Default 1 minute
      intervalRef.current = setInterval(() => {
        fetchSecurityScore();
        fetchAlerts();
      }, interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [options.autoRefresh, options.refreshInterval, bridgeAddress, network, fetchSecurityScore, fetchAlerts]);

  const refresh = useCallback(() => {
    if (bridgeAddress && network) {
      fetchSecurityScore();
      fetchAlerts();
    }
  }, [bridgeAddress, network, fetchSecurityScore, fetchAlerts]);

  const clearCache = useCallback(() => {
    if (bridgeAddress && network) {
      bridgeSecurityService.clearCacheForBridge(bridgeAddress, network);
    }
  }, [bridgeAddress, network]);

  return {
    ...state,
    fetchSecurityScore,
    fetchAnalysis,
    fetchComprehensiveScan,
    fetchAlerts,
    refresh,
    clearCache,
  };
}

/**
 * Hook for checking if a bridge is safe to use
 */
export function useBridgeSafetyCheck(
  bridgeAddress: string | null,
  network: string | null
) {
  const { securityScore, loading, error } = useBridgeSecurityScore(bridgeAddress, network);

  const isSafe = securityScore 
    ? securityScore.overall_score >= 7.0 && securityScore.risk_level !== 'CRITICAL' && securityScore.risk_level !== 'HIGH'
    : null;

  const shouldBlock = securityScore
    ? securityScore.overall_score < 4.0 || securityScore.risk_level === 'CRITICAL'
    : false;

  const warningLevel = securityScore
    ? securityScore.overall_score < 6.0 || securityScore.risk_level === 'HIGH'
      ? 'high'
      : securityScore.overall_score < 7.0 || securityScore.risk_level === 'MEDIUM'
      ? 'medium'
      : 'low'
    : null;

  return {
    isSafe,
    shouldBlock,
    warningLevel,
    securityScore,
    loading,
    error,
  };
}

/**
 * Hook for real-time security alerts
 */
export function useSecurityAlerts(bridgeAddress?: string | null) {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { alerts: fetchedAlerts } = await bridgeSecurityService.getSecurityAlerts();
      const filtered = bridgeAddress
        ? fetchedAlerts.filter(alert => 
            alert.affected_bridge?.toLowerCase() === bridgeAddress.toLowerCase()
          )
        : fetchedAlerts;
      setAlerts(filtered);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch alerts');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [bridgeAddress]);

  useEffect(() => {
    fetchAlerts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    refresh: fetchAlerts,
    criticalAlerts: alerts.filter(a => a.severity === 'critical'),
    unacknowledgedAlerts: alerts.filter(a => !a.acknowledged),
  };
}

