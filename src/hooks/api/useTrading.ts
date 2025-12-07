import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getSwapQuote,
  buildSwapTransaction,
  getSupportedTokens,
  getLiquiditySources,
  getApprovalTransaction,
  checkTokenAllowance,
} from '../../utils/api-client';
import { useAuth } from '../../contexts/AuthContext';

export const tradingKeys = {
  all: ['trading'] as const,
  swapQuote: (params: any) => [...tradingKeys.all, 'swap-quote', params] as const,
  supportedTokens: (chainId: number) => [...tradingKeys.all, 'supported-tokens', chainId] as const,
  liquiditySources: (chainId: number) => [...tradingKeys.all, 'liquidity-sources', chainId] as const,
  allowance: (params: any) => [...tradingKeys.all, 'allowance', params] as const,
};

export function useSwapQuote(params: {
  fromToken: string;
  toToken: string;
  amount: string;
  chainId?: number;
  slippage?: number;
}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: tradingKeys.swapQuote(params),
    queryFn: () => getSwapQuote(params, session?.access_token || ''),
    enabled: !!session?.access_token && !!params.fromToken && !!params.toToken && !!params.amount,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time quotes
  });
}

export function useBuildSwapTransaction() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: (params: {
      fromToken: string;
      toToken: string;
      amount: string;
      fromAddress: string;
      chainId?: number;
      slippage?: number;
    }) => buildSwapTransaction(params, session?.access_token || ''),
  });
}

export function useSupportedTokens(chainId: number) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: tradingKeys.supportedTokens(chainId),
    queryFn: () => getSupportedTokens(chainId, session?.access_token || ''),
    enabled: !!session?.access_token && !!chainId,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

export function useLiquiditySources(chainId: number) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: tradingKeys.liquiditySources(chainId),
    queryFn: () => getLiquiditySources(chainId, session?.access_token || ''),
    enabled: !!session?.access_token && !!chainId,
  });
}

export function useApprovalTransaction() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: (params: {
      tokenAddress: string;
      amount?: string;
      chainId?: number;
    }) => getApprovalTransaction(params, session?.access_token || ''),
  });
}

export function useTokenAllowance(params: {
  tokenAddress: string;
  walletAddress: string;
  chainId?: number;
}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: tradingKeys.allowance(params),
    queryFn: () => checkTokenAllowance(params, session?.access_token || ''),
    enabled: !!session?.access_token && !!params.tokenAddress && !!params.walletAddress,
  });
}

