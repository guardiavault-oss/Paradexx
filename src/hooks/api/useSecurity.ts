import { useQuery, useMutation } from '@tanstack/react-query';
import {
  simulateTransaction,
  simulateTokenTransfer,
  getGasEstimate,
  getSimulationHistory,
  executeSimulatedTransaction,
  analyzeMEVRisk,
  sendProtectedTransaction,
  checkHoneypot,
  getTokenSafetyScore,
  type SimulationRequest,
} from '../../utils/api-client';
import { useAuth } from '../../contexts/AuthContext';

export const securityKeys = {
  all: ['security'] as const,
  simulation: (params: SimulationRequest) => [...securityKeys.all, 'simulation', params] as const,
  gasEstimate: (params: SimulationRequest) => [...securityKeys.all, 'gas-estimate', params] as const,
  simulationHistory: (address: string) => [...securityKeys.all, 'simulation-history', address] as const,
  tokenSafety: (address: string, chainId: number) => [...securityKeys.all, 'token-safety', address, chainId] as const,
};

export function useSimulateTransaction() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: (params: SimulationRequest) =>
      simulateTransaction(params, session?.access_token || ''),
  });
}

export function useSimulateTokenTransfer() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: (params: {
      from: string;
      to: string;
      tokenAddress: string;
      amount: string;
      chainId?: number;
    }) => simulateTokenTransfer(params, session?.access_token || ''),
  });
}

export function useGasEstimate(params: SimulationRequest) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: securityKeys.gasEstimate(params),
    queryFn: () => getGasEstimate(params, session?.access_token || ''),
    enabled: !!session?.access_token && !!params.from && !!params.to,
  });
}

export function useSimulationHistory(walletAddress: string, limit: number = 10) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: securityKeys.simulationHistory(walletAddress),
    queryFn: () => getSimulationHistory(walletAddress, limit, session?.access_token || ''),
    enabled: !!session?.access_token && !!walletAddress,
  });
}

export function useExecuteSimulatedTransaction() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: (params: {
      simulationId: string;
      signedTx: string;
      useMevProtection?: boolean;
    }) => executeSimulatedTransaction(params, session?.access_token || ''),
  });
}

export function useAnalyzeMEVRisk() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: (params: {
      from: string;
      to: string;
      data: string;
      value: string;
      chainId?: number;
    }) => analyzeMEVRisk(params, session?.access_token || ''),
  });
}

export function useSendProtectedTransaction() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: (params: {
      signedTx: string;
      config?: any;
    }) => sendProtectedTransaction(params, session?.access_token || ''),
  });
}

export function useCheckHoneypot() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: (params: {
      tokenAddress: string;
      chainId?: number;
    }) => checkHoneypot(params, session?.access_token || ''),
  });
}

export function useTokenSafetyScore(tokenAddress: string, chainId: number) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: securityKeys.tokenSafety(tokenAddress, chainId),
    queryFn: () => getTokenSafetyScore(tokenAddress, chainId, session?.access_token || ''),
    enabled: !!session?.access_token && !!tokenAddress && !!chainId,
  });
}

