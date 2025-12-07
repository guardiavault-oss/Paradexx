/**
 * React Hook for Bridge Service
 * Provides easy access to bridge service functionality
 */

import { useState, useCallback } from 'react';
import { bridgeService, BridgeAnalysis, SecurityScore, NetworkStatus, ComprehensiveScanResult } from '../services/bridgeService';

export interface UseBridgeServiceReturn {
  // State
  isLoading: boolean;
  error: string | null;
  
  // Bridge Analysis
  analyzeBridge: (bridgeAddress: string, sourceNetwork: string, targetNetwork: string, analysisDepth?: 'basic' | 'comprehensive' | 'deep') => Promise<BridgeAnalysis | null>;
  getSecurityScore: (bridgeAddress: string, network: string, scoringCriteria?: string[]) => Promise<SecurityScore | null>;
  
  // Security
  comprehensiveScan: (bridgeAddress: string, network: string, transactionData?: any[], scanOptions?: Record<string, any>) => Promise<ComprehensiveScanResult | null>;
  detectAnomalies: (bridgeAddress: string, network: string, timeRange?: string) => Promise<any>;
  
  // Network
  getNetworkStatus: (network?: string) => Promise<NetworkStatus | null>;
  getSupportedNetworks: () => Promise<string[]>;
  
  // Transaction
  validateTransaction: (txHash: string, network: string) => Promise<any>;
  getTransactionStatus: (txHash: string) => Promise<any>;
  
  // Utilities
  clearError: () => void;
}

export function useBridgeService(): UseBridgeServiceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleRequest = useCallback(async <T,>(
    requestFn: () => Promise<T>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await requestFn();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('[useBridgeService] Error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeBridge = useCallback(async (
    bridgeAddress: string,
    sourceNetwork: string,
    targetNetwork: string,
    analysisDepth: 'basic' | 'comprehensive' | 'deep' = 'comprehensive'
  ) => {
    return handleRequest(() =>
      bridgeService.analyzeBridge({
        bridge_address: bridgeAddress,
        source_network: sourceNetwork,
        target_network: targetNetwork,
        analysis_depth: analysisDepth,
      })
    );
  }, [handleRequest]);

  const getSecurityScore = useCallback(async (
    bridgeAddress: string,
    network: string,
    scoringCriteria?: string[]
  ) => {
    return handleRequest(() =>
      bridgeService.getSecurityScore({
        bridge_address: bridgeAddress,
        network,
        scoring_criteria: scoringCriteria,
      })
    );
  }, [handleRequest]);

  const comprehensiveScan = useCallback(async (
    bridgeAddress: string,
    network: string,
    transactionData?: any[],
    scanOptions?: Record<string, any>
  ) => {
    return handleRequest(() =>
      bridgeService.comprehensiveScan(bridgeAddress, network, transactionData, scanOptions)
    );
  }, [handleRequest]);

  const detectAnomalies = useCallback(async (
    bridgeAddress: string,
    network: string,
    timeRange: string = '24h'
  ) => {
    return handleRequest(() =>
      bridgeService.detectAttestationAnomalies(bridgeAddress, network, timeRange)
    );
  }, [handleRequest]);

  const getNetworkStatus = useCallback(async (network?: string) => {
    return handleRequest(() => bridgeService.getNetworkStatus(network));
  }, [handleRequest]);

  const getSupportedNetworks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const networks = await bridgeService.getSupportedNetworks();
      return networks;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('[useBridgeService] Error getting supported networks:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateTransaction = useCallback(async (txHash: string, network: string) => {
    return handleRequest(() => bridgeService.validateTransaction(txHash, network));
  }, [handleRequest]);

  const getTransactionStatus = useCallback(async (txHash: string) => {
    return handleRequest(() => bridgeService.getTransactionStatus(txHash));
  }, [handleRequest]);

  return {
    isLoading,
    error,
    analyzeBridge,
    getSecurityScore,
    comprehensiveScan,
    detectAnomalies,
    getNetworkStatus,
    getSupportedNetworks,
    validateTransaction,
    getTransactionStatus,
    clearError,
  };
}

