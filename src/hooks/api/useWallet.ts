import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWalletBalance,
  getTransactionHistory,
  getTokenBalances,
  getNFTs,
  getPortfolio,
  type WalletBalance,
  type Transaction,
  type TokenBalance,
  type NFT,
  type Portfolio,
} from '../../utils/api-client';
import { useAuth } from '../../contexts/AuthContext';

export const walletKeys = {
  all: ['wallet'] as const,
  balance: (address: string, chain: string) => [...walletKeys.all, 'balance', address, chain] as const,
  transactions: (address: string, network: string) => [...walletKeys.all, 'transactions', address, network] as const,
  tokens: (address: string, chain: string) => [...walletKeys.all, 'tokens', address, chain] as const,
  nfts: (address: string, chain: string) => [...walletKeys.all, 'nfts', address, chain] as const,
  portfolio: (address: string, chainId: number) => [...walletKeys.all, 'portfolio', address, chainId] as const,
};

export function useWalletBalance(
  address: string,
  chain: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base',
  options?: { enabled?: boolean }
) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: walletKeys.balance(address, chain),
    queryFn: () => getWalletBalance(address, chain, session?.access_token || ''),
    enabled: (options?.enabled ?? true) && !!session?.access_token && !!address,
  });
}

export function useTransactionHistory(
  address: string,
  network: 'mainnet' | 'polygon' | 'arbitrum' | 'optimism' | 'base',
  options?: { enabled?: boolean }
) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: walletKeys.transactions(address, network),
    queryFn: () => getTransactionHistory(address, network, session?.access_token || ''),
    enabled: (options?.enabled ?? true) && !!session?.access_token && !!address,
  });
}

export function useTokenBalances(
  address: string,
  chain: 'eth' | 'polygon' | 'arbitrum' | 'optimism' | 'base',
  options?: { enabled?: boolean }
) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: walletKeys.tokens(address, chain),
    queryFn: () => getTokenBalances(address, chain, session?.access_token || ''),
    enabled: (options?.enabled ?? true) && !!session?.access_token && !!address,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useNFTs(
  address: string,
  chain: 'eth' | 'polygon' | 'arbitrum' | 'optimism' | 'base',
  options?: { enabled?: boolean }
) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: walletKeys.nfts(address, chain),
    queryFn: () => getNFTs(address, chain, session?.access_token || ''),
    enabled: (options?.enabled ?? true) && !!session?.access_token && !!address,
  });
}

export function usePortfolio(
  address: string,
  chainId: number,
  options?: { enabled?: boolean }
) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: walletKeys.portfolio(address, chainId),
    queryFn: () => getPortfolio(address, chainId, session?.access_token || ''),
    enabled: (options?.enabled ?? true) && !!session?.access_token && !!address,
    refetchInterval: 60000, // Refetch every minute
  });
}

