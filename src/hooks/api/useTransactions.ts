import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTransactions,
  getTransactionDetails,
  getTransactionStats,
  addTransactionNote,
  addTransactionTag,
  exportTransactions,
  type TransactionFilters,
  type TransactionRecord,
} from '../../utils/api-client';
import { useAuth } from '../../contexts/AuthContext';

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (filters?: TransactionFilters) => [...transactionKeys.all, 'list', filters] as const,
  detail: (txId: string) => [...transactionKeys.all, 'detail', txId] as const,
  stats: () => [...transactionKeys.all, 'stats'] as const,
};

export function useTransactions(filters?: TransactionFilters) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => getTransactions(filters || {}, session?.access_token || ''),
    enabled: !!session?.access_token,
  });
}

export function useTransactionDetails(txId: string) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: transactionKeys.detail(txId),
    queryFn: () => getTransactionDetails(txId, session?.access_token || ''),
    enabled: !!session?.access_token && !!txId,
  });
}

export function useTransactionStats() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: transactionKeys.stats(),
    queryFn: () => getTransactionStats(session?.access_token || ''),
    enabled: !!session?.access_token,
  });
}

export function useAddTransactionNote() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ txId, note }: { txId: string; note: string }) =>
      addTransactionNote(txId, note, session?.access_token || ''),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(variables.txId) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.list() });
    },
  });
}

export function useAddTransactionTag() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ txId, tag }: { txId: string; tag: string }) =>
      addTransactionTag(txId, tag, session?.access_token || ''),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(variables.txId) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.list() });
    },
  });
}

export function useExportTransactions() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: (params: {
      format: 'csv' | 'json' | 'pdf';
      filters?: TransactionFilters;
      includeInternal?: boolean;
    }) => exportTransactions(params, session?.access_token || ''),
  });
}

