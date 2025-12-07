import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBridgeChains,
  getBridgeQuote,
  buildBridgeTransaction,
} from '../../utils/api-client';
import { useAuth } from '../../contexts/AuthContext';

export const bridgeKeys = {
  all: ['bridge'] as const,
  chains: () => [...bridgeKeys.all, 'chains'] as const,
  quote: (params: any) => [...bridgeKeys.all, 'quote', params] as const,
};

export function useBridgeChains() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: bridgeKeys.chains(),
    queryFn: () => getBridgeChains(session?.access_token || ''),
    enabled: !!session?.access_token,
  });
}

export function useBridgeQuote(params: {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  amount: string;
  recipient?: string;
}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: bridgeKeys.quote(params),
    queryFn: () => getBridgeQuote(params, session?.access_token || ''),
    enabled: !!session?.access_token && !!params.fromChain && !!params.toChain && !!params.amount,
  });
}

export function useBuildBridgeTransaction() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: (params: {
      bridgeId: string;
      fromChain: number;
      toChain: number;
      fromToken: string;
      toToken: string;
      amount: string;
      recipient?: string;
    }) => buildBridgeTransaction(params, session?.access_token || ''),
  });
}

