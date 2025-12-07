/**
 * useTransactions - Hook for fetching transaction history
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';

// @ts-ignore - Vite env types
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3001';

export interface Transaction {
    hash: string;
    type: 'send' | 'receive' | 'swap' | 'approve' | 'contract';
    status: 'pending' | 'confirming' | 'success' | 'failed';
    from: string;
    to: string;
    value: string;
    token: string;
    valueUSD?: number;
    gasUsed?: string;
    gasPrice?: string;
    gasCostUSD?: number;
    timestamp: number;
    confirmations?: number;
    blockNumber?: number;
    error?: string;
    swapDetails?: {
        fromToken: string;
        fromAmount: string;
        toToken: string;
        toAmount: string;
    };
}

interface FetchOptions {
    type?: Transaction['type'] | 'all';
    status?: Transaction['status'] | 'all';
    limit?: number;
}

async function fetchTransactions(
    address: string,
    chainId: number,
    options: FetchOptions = {}
): Promise<Transaction[]> {
    try {
        const { type = 'all', status = 'all', limit = 50 } = options;

        let url = `${API_BASE}/api/wallet/transactions?address=${address}&chainId=${chainId}&limit=${limit}`;
        if (status !== 'all') url += `&status=${status}`;

        const response = await fetch(url);
        const data = await response.json();

        let transactions = (data.transactions || []).map((tx: any) => ({
            hash: tx.hash,
            type: mapTxType(tx),
            status: mapTxStatus(tx.status),
            from: tx.from,
            to: tx.to,
            value: tx.value,
            token: tx.tokenSymbol || 'ETH',
            valueUSD: tx.valueUSD || 0,
            gasUsed: tx.gasUsed,
            gasPrice: tx.gasPrice,
            gasCostUSD: tx.gasFee ? parseFloat(tx.gasFee) * 2500 : 0, // Rough ETH price estimate
            timestamp: tx.timestamp,
            confirmations: tx.confirmations || 0,
            blockNumber: tx.blockNumber,
            swapDetails: tx.swapDetails,
        }));

        // Filter by type if specified
        if (type !== 'all') {
            transactions = transactions.filter((tx: Transaction) => tx.type === type);
        }

        return transactions;
    } catch (error) {
        console.error('Failed to fetch transactions:', error);
        return [];
    }
}

function mapTxType(tx: any): Transaction['type'] {
    if (tx.type) return tx.type;

    // Infer type from data
    const from = tx.from?.toLowerCase();
    const to = tx.to?.toLowerCase();
    const address = tx.userAddress?.toLowerCase();

    if (tx.swapDetails) return 'swap';
    if (tx.input && tx.input !== '0x') return 'contract';
    if (to === address) return 'receive';
    return 'send';
}

function mapTxStatus(status: string): Transaction['status'] {
    switch (status?.toLowerCase()) {
        case 'confirmed':
        case 'success':
            return 'success';
        case 'pending':
            return 'pending';
        case 'failed':
            return 'failed';
        default:
            return 'confirming';
    }
}

export function useTransactions(
    address: string | undefined,
    chainId: number = 1,
    options: FetchOptions = {}
) {
    const queryClient = useQueryClient();
    const { type = 'all', status = 'all', limit = 50 } = options;

    const transactionsQuery = useQuery({
        queryKey: ['transactions', address, chainId, type, status, limit],
        queryFn: () => fetchTransactions(address!, chainId, options),
        enabled: !!address,
        refetchInterval: 15000,
        staleTime: 10000,
    });

    const refetch = () => {
        queryClient.invalidateQueries({ queryKey: ['transactions', address] });
    };

    return {
        transactions: transactionsQuery.data ?? [],
        isLoading: transactionsQuery.isLoading,
        isRefreshing: transactionsQuery.isFetching,
        error: transactionsQuery.error,
        refetch,
    };
}

export default useTransactions;
