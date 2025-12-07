// React hooks for Web3 API integration
import { useState, useEffect, useCallback } from 'react';
import { logger } from '../services/logger.service';
import {
  getWalletBalance,
  getTransactionHistory,
  getTokenBalances,
  getNFTs,
  getPortfolio,
  WalletBalance,
  Transaction,
  TokenBalance,
  NFT,
  Portfolio,
  ApiError,
} from '../utils/api-client';
import { useAuth } from '../contexts/AuthContext';

export function useWalletBalance(
  address: string | null,
  chain: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base' = 'ethereum',
  enabled: boolean = true
) {
  const { session } = useAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address || !session?.accessToken || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getWalletBalance(address, chain, session.accessToken);
      setBalance(data);
    } catch (err: any) {
      setError(err);
      logger.error('Error fetching wallet balance:', err);
    } finally {
      setLoading(false);
    }
  }, [address, chain, session?.accessToken, enabled]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, error, refetch: fetchBalance };
}

export function useTransactionHistory(
  address: string | null,
  network: 'mainnet' | 'polygon' | 'arbitrum' | 'optimism' | 'base' = 'mainnet',
  enabled: boolean = true
) {
  const { session } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!address || !session?.accessToken || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getTransactionHistory(address, network, session.accessToken);
      setTransactions(data);
    } catch (err: any) {
      setError(err);
      logger.error('Error fetching transaction history:', err);
    } finally {
      setLoading(false);
    }
  }, [address, network, session?.accessToken, enabled]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, error, refetch: fetchTransactions };
}

export function useTokenBalances(
  address: string | null,
  chain: 'eth' | 'polygon' | 'arbitrum' | 'optimism' | 'base' = 'eth',
  enabled: boolean = true
) {
  const { session } = useAuth();
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchTokens = useCallback(async () => {
    if (!address || !session?.accessToken || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getTokenBalances(address, chain, session.accessToken);
      setTokens(data);
    } catch (err: any) {
      setError(err);
      logger.error('Error fetching token balances:', err);
    } finally {
      setLoading(false);
    }
  }, [address, chain, session?.accessToken, enabled]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return { tokens, loading, error, refetch: fetchTokens };
}

export function useNFTs(
  address: string | null,
  chain: 'eth' | 'polygon' | 'arbitrum' | 'optimism' | 'base' = 'eth',
  enabled: boolean = true
) {
  const { session } = useAuth();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchNFTs = useCallback(async () => {
    if (!address || !session?.accessToken || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getNFTs(address, chain, session.accessToken);
      setNfts(data);
    } catch (err: any) {
      setError(err);
      logger.error('Error fetching NFTs:', err);
    } finally {
      setLoading(false);
    }
  }, [address, chain, session?.accessToken, enabled]);

  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  return { nfts, loading, error, refetch: fetchNFTs };
}

export function usePortfolio(
  address: string | null,
  chainId: number = 1,
  enabled: boolean = true
) {
  const { session } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!address || !session?.accessToken || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getPortfolio(address, chainId, session.accessToken);
      setPortfolio(data);
    } catch (err: any) {
      setError(err);
      logger.error('Error fetching portfolio:', err);
    } finally {
      setLoading(false);
    }
  }, [address, chainId, session?.accessToken, enabled]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return { portfolio, loading, error, refetch: fetchPortfolio };
}

