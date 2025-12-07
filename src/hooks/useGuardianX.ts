// React hooks for GuardianX/Contracts API integration
import { useState, useEffect, useCallback } from 'react';
import { logger } from '../services/logger.service';
import {
  createVault,
  getUserVaults,
  getVaultInfo,
  getContractAddresses,
  VaultInfo,
  VaultTxData,
  ApiError,
} from '../utils/api-client';
import { useAuth } from '../contexts/AuthContext';

export function useUserVaults(
  owner: string | null,
  network: 'ethereum' | 'polygon' | 'arbitrum' | 'base' = 'ethereum',
  enabled: boolean = true
) {
  const { session } = useAuth();
  const [vaults, setVaults] = useState<VaultInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchVaults = useCallback(async () => {
    if (!owner || !session?.access_token || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getUserVaults(owner, network, session.access_token);
      setVaults(data);
    } catch (err: any) {
      setError(err);
      logger.error('Error fetching user vaults:', err);
    } finally {
      setLoading(false);
    }
  }, [owner, network, session?.access_token, enabled]);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  return { vaults, loading, error, refetch: fetchVaults };
}

export function useVaultInfo(
  vaultAddress: string | null,
  network: 'ethereum' | 'polygon' | 'arbitrum' | 'base' = 'ethereum',
  enabled: boolean = true
) {
  const { session } = useAuth();
  const [vault, setVault] = useState<VaultInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchVaultInfo = useCallback(async () => {
    if (!vaultAddress || !session?.access_token || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getVaultInfo(vaultAddress, network, session.access_token);
      setVault(data);
    } catch (err: any) {
      setError(err);
      logger.error('Error fetching vault info:', err);
    } finally {
      setLoading(false);
    }
  }, [vaultAddress, network, session?.access_token, enabled]);

  useEffect(() => {
    fetchVaultInfo();
  }, [fetchVaultInfo]);

  return { vault, loading, error, refetch: fetchVaultInfo };
}

export function useCreateVault() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [txData, setTxData] = useState<VaultTxData | null>(null);

  const create = useCallback(async (params: {
    owner: string;
    guardians: string[];
    threshold: number;
    timelockPeriod: number;
    network: 'ethereum' | 'polygon' | 'arbitrum' | 'base';
  }) => {
    if (!session?.access_token) {
      setError({ error: 'Not authenticated' });
      return;
    }

    setLoading(true);
    setError(null);
    setTxData(null);

    try {
      const data = await createVault(params, session.access_token);
      setTxData(data);
      return data;
    } catch (err: any) {
      setError(err);
      logger.error('Error creating vault:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  return {
    create,
    loading,
    error,
    txData,
  };
}

export function useContractAddresses(
  network: 'ethereum' | 'polygon' | 'arbitrum' | 'base' = 'ethereum',
  enabled: boolean = true
) {
  const [addresses, setAddresses] = useState<{
    factory: string;
    registry: string;
    chainId: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchAddresses = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getContractAddresses(network);
      setAddresses(data);
    } catch (err: any) {
      setError(err);
      logger.error('Error fetching contract addresses:', err);
    } finally {
      setLoading(false);
    }
  }, [network, enabled]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  return { addresses, loading, error, refetch: fetchAddresses };
}

