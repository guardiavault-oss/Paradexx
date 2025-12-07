/**
 * Enhanced Unified API Client
 * Features:
 * - Request deduplication
 * - Intelligent caching with TTL
 * - Retry logic with exponential backoff
 * - Response transformation
 * - Health monitoring
 * - Request/response interceptors
 * - Type-safe API calls
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { SERVICE_ENDPOINTS, API_ROUTES } from './config';
import { BaseResponse, ApiError } from '../types/api.types';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface RequestOptions extends AxiosRequestConfig {
    /** Enable request deduplication */
    dedupe?: boolean;
    /** Enable caching (only for GET requests) */
    cache?: boolean;
    /** Cache TTL in milliseconds */
    cacheTTL?: number;
    /** Number of retry attempts */
    retries?: number;
    /** Retry delay in milliseconds */
    retryDelay?: number;
    /** Skip authentication */
    skipAuth?: boolean;
    /** Transform response data */
    transform?: boolean;
}

export interface PendingRequest {
    promise: Promise<AxiosResponse>;
    timestamp: number;
}

export interface CacheEntry<T = unknown> {
    data: T;
    timestamp: number;
    ttl: number;
}

export interface HealthStatus {
    service: string;
    healthy: boolean;
    latency?: number;
    lastCheck?: number;
    error?: string;
}

// ============================================================
// CONFIGURATION
// ============================================================

const DEFAULT_CONFIG = {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    dedupeWindow: 1000, // 1 second
    healthCheckInterval: 60000, // 1 minute
} as const;

// ============================================================
// ENHANCED API CLIENT CLASS
// ============================================================

class EnhancedApiClient {
    private clients: Map<string, AxiosInstance> = new Map();
    private pendingRequests: Map<string, PendingRequest> = new Map();
    private cache: Map<string, CacheEntry> = new Map();
    private healthStatus: Map<string, HealthStatus> = new Map();
    private healthCheckInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.initializeClients();
        this.startHealthMonitoring();
    }

    /**
     * Initialize API clients for each service
     */
    private initializeClients(): void {
        // Main backend API
        this.createClient('backend', SERVICE_ENDPOINTS.BACKEND_API);
        
        // MEV Guard Service
        this.createClient('mevguard', SERVICE_ENDPOINTS.MEVGUARD_API);
        
        // Unified Mempool System
        this.createClient('mempool', SERVICE_ENDPOINTS.MEMPOOL_API);
        
        // Cross-Chain Bridge Service
        this.createClient('crosschain', SERVICE_ENDPOINTS.CROSSCHAIN_API);
        
        // Degen Services
        this.createClient('degen', SERVICE_ENDPOINTS.DEGEN_API);
    }

    /**
     * Create and configure an axios client
     */
    private createClient(name: string, baseURL: string): void {
        const client = axios.create({
            baseURL,
            timeout: DEFAULT_CONFIG.timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor
        client.interceptors.request.use(
            (config) => {
                // Add auth token
                const extendedConfig = config as AxiosRequestConfig & { skipAuth?: boolean; metadata?: { startTime: number; service: string } };
                if (!extendedConfig.skipAuth) {
                    const token = this.getAuthToken();
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }

                // Add request metadata
                extendedConfig.metadata = {
                    startTime: Date.now(),
                    service: name,
                };

                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor
        client.interceptors.response.use(
            (response) => {
                const extendedConfig = response.config as AxiosRequestConfig & { metadata?: { startTime: number; service: string } };
                const metadata = extendedConfig.metadata;
                if (metadata) {
                    const duration = Date.now() - metadata.startTime;
                    if (duration > 5000) {
                        console.warn(`Slow API response: ${duration}ms for ${response.config.url}`);
                    }
                }
                return response;
            },
            async (error: AxiosError) => {
                return this.handleError(error, name);
            }
        );

        this.clients.set(name, client);
    }

    /**
     * Get client for a specific service
     */
    private getClient(service: string = 'backend'): AxiosInstance {
        const client = this.clients.get(service);
        if (!client) {
            throw new Error(`API client for service '${service}' not found`);
        }
        return client;
    }

    /**
     * Generate cache key from request
     */
    private getCacheKey(url: string, params?: Record<string, unknown>): string {
        const paramsStr = params ? JSON.stringify(params) : '';
        return `${url}${paramsStr}`;
    }

    /**
     * Get cached response
     */
    private getCached<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set cached response
     */
    private setCached<T>(key: string, data: T, ttl: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }

    /**
     * Generate request key for deduplication
     */
    private getRequestKey(method: string, url: string, data?: unknown): string {
        const dataStr = data ? JSON.stringify(data) : '';
        return `${method}:${url}:${dataStr}`;
    }

    /**
     * Check if request is pending (for deduplication)
     */
    private getPendingRequest(key: string): Promise<AxiosResponse> | null {
        const pending = this.pendingRequests.get(key);
        if (!pending) return null;

        const age = Date.now() - pending.timestamp;
        if (age > DEFAULT_CONFIG.dedupeWindow) {
            this.pendingRequests.delete(key);
            return null;
        }

        return pending.promise;
    }

    /**
     * Set pending request
     */
    private setPendingRequest(key: string, promise: Promise<AxiosResponse>): void {
        this.pendingRequests.set(key, {
            promise,
            timestamp: Date.now(),
        });

        // Clean up after request completes
        promise.finally(() => {
            setTimeout(() => {
                this.pendingRequests.delete(key);
            }, DEFAULT_CONFIG.dedupeWindow);
        });
    }

    /**
     * Handle errors with retry logic
     */
    private async handleError(error: AxiosError, service: string): Promise<AxiosResponse> {
        const config = error.config as AxiosRequestConfig & { _retry?: boolean; _retryCount?: number };
        
        // Handle 401 - Token refresh
        if (error.response?.status === 401 && !config._retry) {
            return this.handleTokenRefresh(error, service);
        }

        // Handle retryable errors
        if (this.isRetryableError(error) && config._retryCount !== undefined && config._retryCount < DEFAULT_CONFIG.retries) {
            return this.retryRequest(error, service);
        }

        // Transform error to standard format
        throw this.transformError(error);
    }

    /**
     * Handle token refresh
     */
    private async handleTokenRefresh(error: AxiosError, service: string): Promise<AxiosResponse> {
        const config = error.config as AxiosRequestConfig & { _retry?: boolean };
        config._retry = true;

        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await axios.post<BaseResponse<{ accessToken: string; refreshToken: string }>>(
                `${SERVICE_ENDPOINTS.BACKEND_API}/api/auth/refresh`,
                { refreshToken }
            );

            if (response.data.success && response.data.data) {
                const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                // Retry original request
                if (config.headers) {
                    config.headers.Authorization = `Bearer ${accessToken}`;
                }
                return this.getClient(service)(config);
            }
        } catch (refreshError) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
        }

        throw this.transformError(error);
    }

    /**
     * Retry request with exponential backoff
     */
    private async retryRequest(error: AxiosError, service: string): Promise<AxiosResponse> {
        const config = error.config as AxiosRequestConfig & { _retryCount?: number; retryDelay?: number };
        config._retryCount = (config._retryCount || 0) + 1;
        const delay = (config.retryDelay || DEFAULT_CONFIG.retryDelay) * Math.pow(2, config._retryCount - 1);

        await new Promise(resolve => setTimeout(resolve, delay));

        return this.getClient(service)(config);
    }

    /**
     * Check if error is retryable
     */
    private isRetryableError(error: AxiosError): boolean {
        if (!error.response) return true; // Network errors are retryable
        const status = error.response.status;
        return status >= 500 || status === 429 || status === 408;
    }

    /**
     * Transform error to standard format
     */
    private transformError(error: AxiosError): ApiError {
        if (error.response) {
            return {
                code: `HTTP_${error.response.status}`,
                message: error.response.data?.error || error.response.data?.message || error.message,
                details: error.response.data,
            };
        }
        return {
            code: 'NETWORK_ERROR',
            message: error.message || 'Network request failed',
        };
    }

    /**
     * Transform response to standard format
     */
    private transformResponse<T>(response: AxiosResponse<T>, transform: boolean): BaseResponse<T> {
        if (!transform) {
            return response.data as any;
        }

        // If response already has success field, return as-is
        if (response.data && typeof response.data === 'object' && 'success' in response.data) {
            return response.data as BaseResponse<T>;
        }

        // Otherwise wrap in standard format
        return {
            success: true,
            data: response.data,
        };
    }

    /**
     * Generic request method with all enhancements
     */
    private async request<T>(
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
        service: string,
        url: string,
        data?: unknown,
        options: RequestOptions = {}
    ): Promise<BaseResponse<T>> {
        const {
            dedupe = true,
            cache = method === 'GET',
            cacheTTL = DEFAULT_CONFIG.cacheTTL,
            retries = DEFAULT_CONFIG.retries,
            retryDelay = DEFAULT_CONFIG.retryDelay,
            skipAuth = false,
            transform = true,
            ...axiosConfig
        } = options;

        // Check cache for GET requests
        if (cache && method === 'GET') {
            const cacheKey = this.getCacheKey(url, axiosConfig.params);
            const cached = this.getCached<BaseResponse<T>>(cacheKey);
            if (cached) {
                return cached;
            }
        }

        // Check for pending requests (deduplication)
        if (dedupe) {
            const requestKey = this.getRequestKey(method, url, data);
            const pending = this.getPendingRequest(requestKey);
            if (pending) {
                const response = await pending;
                return this.transformResponse<T>(response, transform);
            }
        }

        // Make request
        const client = this.getClient(service);
        const requestConfig: AxiosRequestConfig = {
            ...axiosConfig,
            method,
            url,
            data,
            skipAuth,
            retries,
            retryDelay,
        };

        let requestPromise: Promise<AxiosResponse>;

        switch (method) {
            case 'GET':
                requestPromise = client.get(url, requestConfig);
                break;
            case 'POST':
                requestPromise = client.post(url, data, requestConfig);
                break;
            case 'PUT':
                requestPromise = client.put(url, data, requestConfig);
                break;
            case 'PATCH':
                requestPromise = client.patch(url, data, requestConfig);
                break;
            case 'DELETE':
                requestPromise = client.delete(url, requestConfig);
                break;
        }

        // Store pending request for deduplication
        if (dedupe) {
            const requestKey = this.getRequestKey(method, url, data);
            this.setPendingRequest(requestKey, requestPromise);
        }

        try {
            const response = await requestPromise;
            const transformed = this.transformResponse<T>(response, transform);

            // Cache response
            if (cache && method === 'GET') {
                const cacheKey = this.getCacheKey(url, axiosConfig.params);
                this.setCached(cacheKey, transformed, cacheTTL);
            }

            return transformed;
        } catch (error) {
            throw error;
        }
    }

    /**
     * GET request
     */
    async get<T>(url: string, options?: RequestOptions & { service?: string }): Promise<BaseResponse<T>> {
        const { service = 'backend', ...rest } = options || {};
        return this.request<T>('GET', service, url, undefined, rest);
    }

    /**
     * POST request
     */
    async post<T>(url: string, data?: unknown, options?: RequestOptions & { service?: string }): Promise<BaseResponse<T>> {
        const { service = 'backend', ...rest } = options || {};
        return this.request<T>('POST', service, url, data, rest);
    }

    /**
     * PUT request
     */
    async put<T>(url: string, data?: unknown, options?: RequestOptions & { service?: string }): Promise<BaseResponse<T>> {
        const { service = 'backend', ...rest } = options || {};
        return this.request<T>('PUT', service, url, data, rest);
    }

    /**
     * PATCH request
     */
    async patch<T>(url: string, data?: unknown, options?: RequestOptions & { service?: string }): Promise<BaseResponse<T>> {
        const { service = 'backend', ...rest } = options || {};
        return this.request<T>('PATCH', service, url, data, rest);
    }

    /**
     * DELETE request
     */
    async delete<T>(url: string, options?: RequestOptions & { service?: string }): Promise<BaseResponse<T>> {
        const { service = 'backend', ...rest } = options || {};
        return this.request<T>('DELETE', service, url, undefined, rest);
    }

    /**
     * Health check for a service
     */
    async checkHealth(service: string): Promise<HealthStatus> {
        const startTime = Date.now();
        try {
            const client = this.getClient(service);
            const response = await client.get('/health', { timeout: 5000 });
            const latency = Date.now() - startTime;

            const status: HealthStatus = {
                service,
                healthy: response.status === 200,
                latency,
                lastCheck: Date.now(),
            };

            this.healthStatus.set(service, status);
            return status;
        } catch (error) {
            const status: HealthStatus = {
                service,
                healthy: false,
                latency: Date.now() - startTime,
                lastCheck: Date.now(),
                error: error instanceof Error ? error.message : 'Unknown error',
            };

            this.healthStatus.set(service, status);
            return status;
        }
    }

    /**
     * Start health monitoring
     */
    private startHealthMonitoring(): void {
        this.healthCheckInterval = setInterval(async () => {
            for (const service of this.clients.keys()) {
                await this.checkHealth(service);
            }
        }, DEFAULT_CONFIG.healthCheckInterval);
    }

    /**
     * Get health status for all services
     */
    getHealthStatus(): Map<string, HealthStatus> {
        return new Map(this.healthStatus);
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Clear cache for specific pattern
     */
    clearCachePattern(pattern: string): void {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Get auth token
     */
    private getAuthToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    /**
     * Set auth tokens
     */
    setAuthTokens(accessToken: string, refreshToken: string): void {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    }

    /**
     * Clear auth tokens
     */
    clearAuthTokens(): void {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }
}

// ============================================================
// EXPORT SINGLETON INSTANCE
// ============================================================

export const enhancedApiClient = new EnhancedApiClient();

// Export convenience methods
export const api = {
    get: <T>(url: string, options?: RequestOptions & { service?: string }) =>
        enhancedApiClient.get<T>(url, options),
    post: <T>(url: string, data?: unknown, options?: RequestOptions & { service?: string }) =>
        enhancedApiClient.post<T>(url, data, options),
    put: <T>(url: string, data?: unknown, options?: RequestOptions & { service?: string }) =>
        enhancedApiClient.put<T>(url, data, options),
    patch: <T>(url: string, data?: unknown, options?: RequestOptions & { service?: string }) =>
        enhancedApiClient.patch<T>(url, data, options),
    delete: <T>(url: string, options?: RequestOptions & { service?: string }) =>
        enhancedApiClient.delete<T>(url, options),
    checkHealth: (service: string) => enhancedApiClient.checkHealth(service),
    getHealthStatus: () => enhancedApiClient.getHealthStatus(),
    clearCache: () => enhancedApiClient.clearCache(),
    clearCachePattern: (pattern: string) => enhancedApiClient.clearCachePattern(pattern),
    setAuthTokens: (accessToken: string, refreshToken: string) =>
        enhancedApiClient.setAuthTokens(accessToken, refreshToken),
    clearAuthTokens: () => enhancedApiClient.clearAuthTokens(),
};

export default api;

