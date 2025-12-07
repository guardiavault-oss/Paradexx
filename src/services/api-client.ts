/**
 * Legacy API Client - Maintained for backward compatibility
 * For new code, use enhanced-api-client.ts instead
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Re-export enhanced client for easy migration
export { api as enhancedApi, enhancedApiClient } from './enhanced-api-client';

// Types for our API responses
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

// Track ongoing token refresh to prevent race conditions
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Subscribe to token refresh
const subscribeToRefresh = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
};

// Notify all subscribers of successful refresh
const notifyRefreshSubscribers = (token: string) => {
    refreshSubscribers.forEach(callback => callback(token));
    refreshSubscribers = [];
};

// Create base axios instance
const createApiClient = (): AxiosInstance => {
    const client = axios.create({
        baseURL: API_BASE_URL,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Request interceptor to add auth token
    client.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            // Add request timestamp for debugging
            config.metadata = { startTime: new Date() };

            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Response interceptor for token refresh and error handling
    client.interceptors.response.use(
        (response: AxiosResponse) => {
            // Log response time for performance monitoring
            const endTime = new Date();
            const duration = endTime.getTime() - response.config.metadata?.startTime?.getTime();

            if (duration > 5000) {
                console.warn(`Slow API response: ${duration}ms for ${response.config.url}`);
            }

            return response;
        },
        async (error) => {
            const originalRequest = error.config;

            // Handle 401 Unauthorized - token refresh with race condition prevention
            if (error.response?.status === 401 && !originalRequest._retry) {
                if (isRefreshing) {
                    // If already refreshing, wait for the new token
                    return new Promise((resolve) => {
                        subscribeToRefresh((token: string) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(client(originalRequest));
                        });
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (!refreshToken) {
                        throw new Error('No refresh token available');
                    }

                    // Attempt to refresh the token
                    const response = await axios.post<ApiResponse<AuthTokens>>(
                        `${API_BASE_URL}/api/auth/refresh`,
                        { refreshToken }
                    );

                    if (response.data.success && response.data.data) {
                        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                        // Store new tokens
                        localStorage.setItem('accessToken', accessToken);
                        localStorage.setItem('refreshToken', newRefreshToken);

                        // Notify all waiting requests
                        notifyRefreshSubscribers(accessToken);

                        // Retry the original request with new token
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                        return client(originalRequest);
                    }
                } catch (refreshError) {
                    // Refresh failed - clear tokens and redirect to login
                    refreshSubscribers = [];
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }

            // Handle other errors
            if (error.response?.status >= 500) {
                console.error('Server error:', error.response.data);
            } else if (error.response?.status === 429) {
                console.warn('Rate limit exceeded:', error.response.data);
            }

            return Promise.reject(error);
        }
    );

    return client;
};

// Export the configured client
export const apiClient = createApiClient();

// Export utility functions
export const setAuthTokens = (tokens: AuthTokens) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
};

export const clearAuthTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
};

export const getAuthToken = (): string | null => {
    return localStorage.getItem('accessToken');
};

// Extend axios config to include metadata
declare module 'axios' {
    interface AxiosRequestConfig {
        metadata?: {
            startTime: Date;
        };
    }
}

export default apiClient;
