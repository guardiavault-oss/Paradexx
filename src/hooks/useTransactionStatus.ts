// Hook for tracking transaction status with Wallet Guard integration
import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../services/logger.service';
import { 
  getRelayedTransactionStatus, 
  RelayedTransactionStatus 
} from '../utils/api-client';

export interface TransactionStatusState {
  hash: string;
  status: 'pending' | 'confirming' | 'success' | 'failed';
  confirmations: number;
  requiredConfirmations: number;
  timestamp: number;
  mevProtected?: boolean;
  privatePool?: string;
  blockNumber?: number;
  error?: string;
  relayData?: RelayedTransactionStatus;
}

interface UseTransactionStatusOptions {
  pollInterval?: number; // in milliseconds
  maxPolls?: number;
  requiredConfirmations?: number;
  network?: string;
}

const DEFAULT_OPTIONS: UseTransactionStatusOptions = {
  pollInterval: 3000, // Poll every 3 seconds
  maxPolls: 100, // Stop after 100 polls (5 minutes at 3s interval)
  requiredConfirmations: 12,
  network: 'ethereum',
};

/**
 * Hook to track a single transaction's status
 */
export function useTransactionStatus(
  txHash: string | null,
  options: UseTransactionStatusOptions = {}
) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const [status, setStatus] = useState<TransactionStatusState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!txHash) return;

    try {
      const relayStatus = await getRelayedTransactionStatus(
        txHash,
        mergedOptions.network || 'ethereum'
      );

      // Map relay status to our status format
      let mappedStatus: TransactionStatusState['status'] = 'pending';
      let confirmations = 0;

      switch (relayStatus.status) {
        case 'pending':
        case 'submitted':
          mappedStatus = 'pending';
          break;
        case 'mined':
          mappedStatus = 'confirming';
          confirmations = relayStatus.confirmations || 1;
          break;
        case 'included':
          mappedStatus = 'success';
          confirmations = mergedOptions.requiredConfirmations || 12;
          break;
        case 'failed':
          mappedStatus = 'failed';
          break;
      }

      // Check if we have enough confirmations
      if (
        mappedStatus === 'confirming' &&
        confirmations >= (mergedOptions.requiredConfirmations || 12)
      ) {
        mappedStatus = 'success';
      }

      setStatus({
        hash: txHash,
        status: mappedStatus,
        confirmations,
        requiredConfirmations: mergedOptions.requiredConfirmations || 12,
        timestamp: Date.now(),
        mevProtected: relayStatus.mev_protected,
        privatePool: relayStatus.private_pool,
        blockNumber: relayStatus.block_number,
        error: relayStatus.error,
        relayData: relayStatus,
      });

      // Stop polling if transaction is finalized
      if (mappedStatus === 'success' || mappedStatus === 'failed') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (err: any) {
      // If relay status fails, try standard RPC (fallback)
      logger.warn('Relay status check failed, using fallback:', err.message);
      
      // For fallback, we'd query the blockchain directly
      // For now, keep the last known status or set to pending
      if (!status) {
        setStatus({
          hash: txHash,
          status: 'pending',
          confirmations: 0,
          requiredConfirmations: mergedOptions.requiredConfirmations || 12,
          timestamp: Date.now(),
        });
      }
    }
  }, [txHash, mergedOptions.network, mergedOptions.requiredConfirmations, status]);

  // Start polling when txHash changes
  useEffect(() => {
    if (!txHash) {
      setStatus(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    pollCountRef.current = 0;

    // Initial fetch
    fetchStatus().finally(() => setIsLoading(false));

    // Start polling
    intervalRef.current = setInterval(() => {
      pollCountRef.current++;

      if (pollCountRef.current >= (mergedOptions.maxPolls || 100)) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setError('Transaction tracking timed out');
        return;
      }

      fetchStatus();
    }, mergedOptions.pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [txHash, mergedOptions.pollInterval, mergedOptions.maxPolls, fetchStatus]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchStatus().finally(() => setIsLoading(false));
  }, [fetchStatus]);

  return {
    status,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Hook to track multiple transactions
 */
export function useTransactionQueue() {
  const [queue, setQueue] = useState<Map<string, TransactionStatusState>>(new Map());
  const [activeTracking, setActiveTracking] = useState<Set<string>>(new Set());

  const addTransaction = useCallback((txHash: string, initialData?: Partial<TransactionStatusState>) => {
    setQueue((prev) => {
      const next = new Map(prev);
      next.set(txHash, {
        hash: txHash,
        status: 'pending',
        confirmations: 0,
        requiredConfirmations: 12,
        timestamp: Date.now(),
        ...initialData,
      });
      return next;
    });

    setActiveTracking((prev) => new Set(prev).add(txHash));
  }, []);

  const updateTransaction = useCallback((txHash: string, update: Partial<TransactionStatusState>) => {
    setQueue((prev) => {
      const current = prev.get(txHash);
      if (!current) return prev;

      const next = new Map(prev);
      next.set(txHash, { ...current, ...update });

      // Remove from active tracking if finalized
      if (update.status === 'success' || update.status === 'failed') {
        setActiveTracking((prevActive) => {
          const nextActive = new Set(prevActive);
          nextActive.delete(txHash);
          return nextActive;
        });
      }

      return next;
    });
  }, []);

  const removeTransaction = useCallback((txHash: string) => {
    setQueue((prev) => {
      const next = new Map(prev);
      next.delete(txHash);
      return next;
    });
    setActiveTracking((prev) => {
      const next = new Set(prev);
      next.delete(txHash);
      return next;
    });
  }, []);

  const clearCompleted = useCallback(() => {
    setQueue((prev) => {
      const next = new Map(prev);
      for (const [hash, tx] of next) {
        if (tx.status === 'success' || tx.status === 'failed') {
          next.delete(hash);
        }
      }
      return next;
    });
  }, []);

  const pendingCount = Array.from(queue.values()).filter(
    (tx) => tx.status === 'pending' || tx.status === 'confirming'
  ).length;

  const successCount = Array.from(queue.values()).filter(
    (tx) => tx.status === 'success'
  ).length;

  const failedCount = Array.from(queue.values()).filter(
    (tx) => tx.status === 'failed'
  ).length;

  return {
    queue: Array.from(queue.values()),
    queueMap: queue,
    activeTracking: Array.from(activeTracking),
    addTransaction,
    updateTransaction,
    removeTransaction,
    clearCompleted,
    pendingCount,
    successCount,
    failedCount,
  };
}
