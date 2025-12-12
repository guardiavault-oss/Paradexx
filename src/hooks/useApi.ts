/**
 * useApi - Centralized API hook with caching, retry, and error handling
 *
 * Features:
 * - Automatic token management
 * - Request caching
 * - Retry logic with exponential backoff
 * - Global error handling
 * - Request deduplication
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { API_URL } from '../config/api';

interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheDuration?: number; // ms
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

interface ApiState<T> extends ApiResponse<T> {
  status: number | null;
  headers: Headers | null;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Global cache store
const cache = new Map<string, CacheEntry<unknown>>();

// Pending requests for deduplication
const pendingRequests = new Map<string, Promise<unknown>>();

// Get auth token from storage
function getAuthToken(): string | null {
  try {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  } catch {
    return null;
  }
}

// Get refresh token
function getRefreshToken(): string | null {
  try {
    return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
  } catch {
    return null;
  }
}

// Set tokens
function setTokens(accessToken: string, refreshToken?: string): void {
  try {
    localStorage.setItem('token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  } catch {
    // Fallback to session storage
    sessionStorage.setItem('token', accessToken);
    if (refreshToken) {
      sessionStorage.setItem('refreshToken', refreshToken);
    }
  }
}

// Clear tokens
function clearTokens(): void {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
  } catch {
    // Ignore
  }
}

// Refresh access token
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    if (data.accessToken) {
      setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    }

    return null;
  } catch {
    return null;
  }
}

// Sleep utility for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate cache key from URL and options
function getCacheKey(url: string, options?: RequestInit): string {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
}

// Check if cache entry is valid
function isCacheValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() < entry.expiresAt;
}

// Make API request with all features
async function apiRequest<T>(
  url: string,
  options: RequestOptions = {}
): Promise<{ data: T | null; error: string | null; status: number; headers: Headers }> {
  const {
    retries = 3,
    retryDelay = 1000,
    cache: useCache = false,
    cacheDuration = 60000, // 1 minute default
    ...fetchOptions
  } = options;

  // Check cache first (only for GET requests)
  const cacheKey = getCacheKey(url, fetchOptions);
  if (useCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
    const cached = cache.get(cacheKey) as CacheEntry<T> | undefined;
    if (isCacheValid(cached)) {
      return {
        data: cached.data,
        error: null,
        status: 200,
        headers: new Headers(),
      };
    }
  }

  // Deduplicate concurrent requests
  if (pendingRequests.has(cacheKey)) {
    try {
      const data = await pendingRequests.get(cacheKey) as T;
      return { data, error: null, status: 200, headers: new Headers() };
    } catch (error) {
      return { data: null, error: (error as Error).message, status: 0, headers: new Headers() };
    }
  }

  // Build headers with auth token
  const headers = new Headers(fetchOptions.headers);
  if (!headers.has('Content-Type') && fetchOptions.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const requestPromise = (async () => {
    let lastError: string = 'Unknown error';
    let lastStatus = 0;
    let lastHeaders = new Headers();

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          headers,
        });

        lastStatus = response.status;
        lastHeaders = response.headers;

        // Handle 401 - try to refresh token
        if (response.status === 401 && attempt < retries) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            headers.set('Authorization', `Bearer ${newToken}`);
            continue; // Retry with new token
          }
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          lastError = errorData.message || errorData.error || `HTTP ${response.status}`;

          // Don't retry on client errors (4xx) except 401
          if (response.status >= 400 && response.status < 500 && response.status !== 401) {
            return { data: null, error: lastError, status: lastStatus, headers: lastHeaders };
          }

          if (attempt < retries) {
            await sleep(retryDelay * Math.pow(2, attempt));
            continue;
          }

          return { data: null, error: lastError, status: lastStatus, headers: lastHeaders };
        }

        // Parse response
        const contentType = response.headers.get('Content-Type');
        let data: T;

        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text() as unknown as T;
        }

        // Cache successful GET responses
        if (useCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
          cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + cacheDuration,
          });
        }

        return { data, error: null, status: lastStatus, headers: lastHeaders };
      } catch (error) {
        lastError = (error as Error).message || 'Network error';

        if (attempt < retries) {
          await sleep(retryDelay * Math.pow(2, attempt));
          continue;
        }
      }
    }

    return { data: null, error: lastError, status: lastStatus, headers: lastHeaders };
  })();

  // Track pending request for deduplication
  pendingRequests.set(cacheKey, requestPromise.then(r => r.data));

  try {
    const result = await requestPromise;
    return result;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

// Hook options
interface UseApiOptions<T> {
  immediate?: boolean; // Fetch immediately on mount
  defaultValue?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  retries?: number;
  cache?: boolean;
  cacheDuration?: number;
}

// Main hook
export function useApi<T>(
  endpoint: string,
  options: UseApiOptions<T> = {}
) {
  const {
    immediate = false,
    defaultValue = null as T,
    onSuccess,
    onError,
    retries = 3,
    cache: useCache = true,
    cacheDuration = 60000,
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: defaultValue,
    error: null,
    loading: immediate,
    status: null,
    headers: null,
  });

  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // GET request
  const get = useCallback(async (queryParams?: Record<string, string>) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    let url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    if (queryParams) {
      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;
    }

    const result = await apiRequest<T>(url, {
      method: 'GET',
      signal: abortControllerRef.current.signal,
      retries,
      cache: useCache,
      cacheDuration,
    });

    if (!mountedRef.current) return result;

    setState({
      data: result.data ?? defaultValue,
      error: result.error,
      loading: false,
      status: result.status,
      headers: result.headers,
    });

    if (result.data && onSuccess) {
      onSuccess(result.data);
    }
    if (result.error && onError) {
      onError(result.error);
    }

    return result;
  }, [endpoint, defaultValue, onSuccess, onError, retries, useCache, cacheDuration]);

  // POST request
  const post = useCallback(async <D = unknown>(data?: D) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    const result = await apiRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      retries,
    });

    if (!mountedRef.current) return result;

    setState({
      data: result.data ?? defaultValue,
      error: result.error,
      loading: false,
      status: result.status,
      headers: result.headers,
    });

    if (result.data && onSuccess) {
      onSuccess(result.data);
    }
    if (result.error && onError) {
      onError(result.error);
    }

    return result;
  }, [endpoint, defaultValue, onSuccess, onError, retries]);

  // PUT request
  const put = useCallback(async <D = unknown>(data?: D) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    const result = await apiRequest<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      retries,
    });

    if (!mountedRef.current) return result;

    setState({
      data: result.data ?? defaultValue,
      error: result.error,
      loading: false,
      status: result.status,
      headers: result.headers,
    });

    if (result.data && onSuccess) {
      onSuccess(result.data);
    }
    if (result.error && onError) {
      onError(result.error);
    }

    return result;
  }, [endpoint, defaultValue, onSuccess, onError, retries]);

  // DELETE request
  const del = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    const result = await apiRequest<T>(url, {
      method: 'DELETE',
      retries,
    });

    if (!mountedRef.current) return result;

    setState({
      data: result.data ?? defaultValue,
      error: result.error,
      loading: false,
      status: result.status,
      headers: result.headers,
    });

    if (result.data && onSuccess) {
      onSuccess(result.data);
    }
    if (result.error && onError) {
      onError(result.error);
    }

    return result;
  }, [endpoint, defaultValue, onSuccess, onError, retries]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      data: defaultValue,
      error: null,
      loading: false,
      status: null,
      headers: null,
    });
  }, [defaultValue]);

  // Fetch on mount if immediate
  useEffect(() => {
    if (immediate) {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        get();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [immediate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    get,
    post,
    put,
    delete: del,
    reset,
    refetch: get,
  };
}

// Utility hook for simple GET requests
export function useApiGet<T>(
  endpoint: string,
  options: Omit<UseApiOptions<T>, 'immediate'> = {}
) {
  return useApi<T>(endpoint, { ...options, immediate: true });
}

// Utility hook for mutations (POST/PUT/DELETE)
export function useApiMutation<T, D = unknown>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  options: Omit<UseApiOptions<T>, 'immediate'> = {}
) {
  const api = useApi<T>(endpoint, { ...options, immediate: false });

  const mutate = useCallback(async (data?: D) => {
    switch (method) {
      case 'POST':
        return api.post(data);
      case 'PUT':
        return api.put(data);
      case 'DELETE':
        return api.delete();
      default:
        return api.post(data);
    }
  }, [api, method]);

  return {
    ...api,
    mutate,
  };
}

// Clear all cache
export function clearApiCache(): void {
  cache.clear();
}

// Clear specific cache entry
export function clearCacheEntry(url: string, method = 'GET'): void {
  const key = getCacheKey(url, { method });
  cache.delete(key);
}

export default useApi;
