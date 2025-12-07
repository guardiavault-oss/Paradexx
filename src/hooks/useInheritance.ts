// React hooks for Inheritance/Guardian API integration
import { useState, useEffect, useCallback } from 'react';
import { logger } from '../services/logger.service';
import {
  inviteGuardian,
  getGuardians,
  performCheckIn,
  updateTimelockConfig,
  addBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
  getInheritanceConfig,
  Guardian,
  Beneficiary,
  InheritanceConfig,
  ApiError,
} from '../utils/api-client';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for managing guardians
 */
export function useGuardians() {
  const { session } = useAuth();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchGuardians = useCallback(async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getGuardians(session.access_token);
      setGuardians(data);
    } catch (err: any) {
      setError(err);
      logger.error('Error fetching guardians:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchGuardians();
  }, [fetchGuardians]);

  const invite = useCallback(async (params: {
    guardianEmail: string;
    guardianName: string;
    guardianPhone?: string;
  }) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await inviteGuardian(params, session.access_token);
      await fetchGuardians(); // Refresh list
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, fetchGuardians]);

  return {
    guardians,
    loading,
    error,
    invite,
    refetch: fetchGuardians,
  };
}

/**
 * Hook for check-in functionality (dead man's switch)
 */
export function useCheckIn() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [nextCheckIn, setNextCheckIn] = useState<string | null>(null);

  const checkIn = useCallback(async () => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await performCheckIn(session.access_token);
      setLastCheckIn(new Date().toISOString());
      setNextCheckIn(result.nextCheckIn);
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  return {
    checkIn,
    loading,
    error,
    lastCheckIn,
    nextCheckIn,
  };
}

/**
 * Hook for inheritance configuration
 */
export function useInheritanceConfig() {
  const { session } = useAuth();
  const [config, setConfig] = useState<InheritanceConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getInheritanceConfig(session.access_token);
      setConfig(data);
    } catch (err: any) {
      setError(err);
      logger.error('Error fetching inheritance config:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateTimelock = useCallback(async (days: number) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      await updateTimelockConfig(days, session.access_token);
      await fetchConfig(); // Refresh
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, fetchConfig]);

  return {
    config,
    loading,
    error,
    updateTimelock,
    refetch: fetchConfig,
  };
}

/**
 * Hook for managing beneficiaries
 */
export function useBeneficiaries() {
  const { session } = useAuth();
  const { config, refetch: refetchConfig } = useInheritanceConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const beneficiaries = config?.beneficiaries || [];

  const add = useCallback(async (params: {
    name: string;
    email: string;
    walletAddress: string;
    allocation: number;
    relationship: string;
  }) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await addBeneficiary(params, session.access_token);
      await refetchConfig();
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, refetchConfig]);

  const update = useCallback(async (
    beneficiaryId: string,
    updates: Partial<Beneficiary>
  ) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      await updateBeneficiary(beneficiaryId, updates, session.access_token);
      await refetchConfig();
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, refetchConfig]);

  const remove = useCallback(async (beneficiaryId: string) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      await deleteBeneficiary(beneficiaryId, session.access_token);
      await refetchConfig();
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, refetchConfig]);

  return {
    beneficiaries,
    loading,
    error,
    add,
    update,
    remove,
  };
}
