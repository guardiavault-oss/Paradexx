import { useState, useEffect, useCallback } from 'react';

interface UseApiDataOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  autoFetch?: boolean;
  refetchInterval?: number; // in milliseconds
}

interface UseApiDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApiData<T>(
  fetchFn: () => Promise<{ data?: T; error?: string; status: number }>,
  options: UseApiDataOptions<T> = {}
): UseApiDataReturn<T> {
  const {
    initialData = null,
    onSuccess,
    onError,
    autoFetch = true,
    refetchInterval,
  } = options;

  const [data, setData] = useState<T | null>(initialData as T | null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchFn();

      if (response.error) {
        setError(response.error);
        if (onError) {
          onError(response.error);
        }
        return;
      }

      if (response.data) {
        setData(response.data);
        if (onSuccess) {
          onSuccess(response.data);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, onSuccess, onError]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  useEffect(() => {
    if (!refetchInterval) return;

    const interval = setInterval(() => {
      fetchData();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
