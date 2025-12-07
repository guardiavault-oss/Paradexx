import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  routeMevProtected,
  getMevStatus,
  getMevStats,
  toggleMevProtection,
  getMevGuardStatus,
  analyzeMevExposure,
  getMempoolStats,
  getMempoolTransactions,
  getMempoolThreats,
  getNetworkMempoolStats,
  analyzeMempoolTransaction,
  getMevGuardKpi,
  getRecentProtectedTransactions,
  type MevRouteParams,
  type MevStatus,
  type MevStats,
  type MevGuardStatus,
  type MevAnalysisRequest,
  type MempoolStatsResponse,
} from '../../utils/api-client';
import { useAuth } from '../../contexts/AuthContext';

export const mevKeys = {
  all: ['mev'] as const,
  status: () => [...mevKeys.all, 'status'] as const,
  stats: () => [...mevKeys.all, 'stats'] as const,
  guardStatus: () => [...mevKeys.all, 'guard-status'] as const,
  mempoolStats: () => [...mevKeys.all, 'mempool-stats'] as const,
  mempoolTransactions: (params?: any) => [...mevKeys.all, 'mempool-transactions', params] as const,
  mempoolThreats: (params?: any) => [...mevKeys.all, 'mempool-threats', params] as const,
  networkStats: (network: string) => [...mevKeys.all, 'network-stats', network] as const,
  kpi: () => [...mevKeys.all, 'kpi'] as const,
  protectedTransactions: () => [...mevKeys.all, 'protected-transactions'] as const,
};

export function useMevStatus() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: mevKeys.status(),
    queryFn: () => getMevStatus(session?.access_token || ''),
    enabled: !!session?.access_token,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMevStats() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: mevKeys.stats(),
    queryFn: () => getMevStats(session?.access_token || ''),
    enabled: !!session?.access_token,
  });
}

export function useRouteMevProtected() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: MevRouteParams) =>
      routeMevProtected(params, session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mevKeys.status() });
      queryClient.invalidateQueries({ queryKey: mevKeys.stats() });
    },
  });
}

export function useToggleMevProtection() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (enabled: boolean) =>
      toggleMevProtection(enabled, session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mevKeys.status() });
    },
  });
}

export function useMevGuardStatus() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: mevKeys.guardStatus(),
    queryFn: () => getMevGuardStatus(session?.access_token || ''),
    enabled: !!session?.access_token,
    refetchInterval: 30000,
  });
}

export function useAnalyzeMevExposure() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: (params: MevAnalysisRequest) =>
      analyzeMevExposure(params, session?.access_token || ''),
  });
}

export function useMempoolStats() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: mevKeys.mempoolStats(),
    queryFn: () => getMempoolStats(session?.access_token || ''),
    enabled: !!session?.access_token,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time data
  });
}

export function useMempoolTransactions(params?: {
  network?: string;
  limit?: number;
  offset?: number;
  suspiciousOnly?: boolean;
}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: mevKeys.mempoolTransactions(params),
    queryFn: () => getMempoolTransactions(params || {}, session?.access_token || ''),
    enabled: !!session?.access_token,
    refetchInterval: 15000,
  });
}

export function useMempoolThreats(params?: {
  limit?: number;
  severity?: string;
  network?: string;
}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: mevKeys.mempoolThreats(params),
    queryFn: () => getMempoolThreats(params || {}, session?.access_token || ''),
    enabled: !!session?.access_token,
    refetchInterval: 20000,
  });
}

export function useNetworkMempoolStats(network: string) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: mevKeys.networkStats(network),
    queryFn: () => getNetworkMempoolStats(network, session?.access_token || ''),
    enabled: !!session?.access_token && !!network,
    refetchInterval: 15000,
  });
}

export function useAnalyzeMempoolTransaction() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: ({ txHash, network }: { txHash: string; network: string }) =>
      analyzeMempoolTransaction(txHash, network, session?.access_token || ''),
  });
}

export function useMevGuardKpi() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: mevKeys.kpi(),
    queryFn: () => getMevGuardKpi(session?.access_token || ''),
    enabled: !!session?.access_token,
  });
}

export function useRecentProtectedTransactions(limit: number = 10) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: mevKeys.protectedTransactions(),
    queryFn: () => getRecentProtectedTransactions(limit, session?.access_token || ''),
    enabled: !!session?.access_token,
    refetchInterval: 30000,
  });
}

