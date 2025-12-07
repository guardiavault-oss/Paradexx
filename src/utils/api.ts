/**
 * API Client with retry logic, caching, and error handling
 */

import { cache } from './cache';
import { logger, logHelpers } from './logger';
import { errorHandler, errorHelpers } from './errorHandler';

interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTTL?: number;
}

interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onResponse?: (response: Response) => Response | Promise<Response>;
  onError?: (error: Error) => Error | Promise<Error>;
}

class APIClient {
  private baseURL: string;
  private defaultTimeout: number = 30000;
  private defaultRetries: number = 3;
  private interceptors: RequestInterceptor[] = [];

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  /**
   * Add request/response interceptor
   */
  addInterceptor(interceptor: RequestInterceptor): () => void {
    this.interceptors.push(interceptor);
    return () => {
      const index = this.interceptors.indexOf(interceptor);
      if (index > -1) {
        this.interceptors.splice(index, 1);
      }
    };
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;
    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        processedConfig = await interceptor.onRequest(processedConfig);
      }
    }
    return processedConfig;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let processedResponse = response;
    for (const interceptor of this.interceptors) {
      if (interceptor.onResponse) {
        processedResponse = await interceptor.onResponse(processedResponse);
      }
    }
    return processedResponse;
  }

  /**
   * Apply error interceptors
   */
  private async applyErrorInterceptors(error: Error): Promise<Error> {
    let processedError = error;
    for (const interceptor of this.interceptors) {
      if (interceptor.onError) {
        processedError = await interceptor.onError(processedError);
      }
    }
    return processedError;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async requestWithRetry(
    url: string,
    config: RequestConfig,
    attempt: number = 1
  ): Promise<Response> {
    const maxRetries = config.retries ?? this.defaultRetries;
    const retryDelay = config.retryDelay ?? 1000;

    try {
      const controller = new AbortController();
      const timeout = config.timeout ?? this.defaultTimeout;

      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error: any) {
      if (attempt < maxRetries) {
        logger.warn(`Request failed, retrying (${attempt}/${maxRetries})`, {
          url,
          error: error.message,
        });

        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
        return this.requestWithRetry(url, config, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const url = this.baseURL + endpoint;
    const startTime = performance.now();

    // Check cache first
    if (config.cache && config.method === 'GET') {
      const cached = cache.get<T>(url);
      if (cached !== null) {
        logger.debug(`Cache hit: ${url}`);
        return cached;
      }
    }

    try {
      // Apply request interceptors
      const processedConfig = await this.applyRequestInterceptors(config);

      // Make request
      const response = await this.requestWithRetry(url, processedConfig);

      // Apply response interceptors
      const processedResponse = await this.applyResponseInterceptors(response);

      // Parse response
      const data = await processedResponse.json();

      // Cache if enabled
      if (config.cache) {
        cache.set(url, data, { ttl: config.cacheTTL });
      }

      // Log success
      const duration = performance.now() - startTime;
      logHelpers.logAPI(
        config.method || 'GET',
        endpoint,
        'success',
        duration
      );

      return data;
    } catch (error: any) {
      // Apply error interceptors
      const processedError = await this.applyErrorInterceptors(error);

      // Log error
      const duration = performance.now() - startTime;
      logHelpers.logAPI(
        config.method || 'GET',
        endpoint,
        'error',
        duration,
        { error: processedError.message }
      );

      // Handle error
      if (error.name === 'AbortError') {
        throw errorHelpers.timeoutError(`Request to ${endpoint}`);
      } else {
        throw errorHelpers.apiError(
          `API request failed: ${processedError.message}`,
          undefined,
          { endpoint, error: processedError }
        );
      }
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
    });
  }
}

// Create API client instances
export const api = new APIClient(process.env.NEXT_PUBLIC_API_URL || '');

// Mock API for development
export const mockApi = {
  /**
   * Get wallet balance
   */
  getBalance: async (address: string): Promise<{ balance: string; tokens: any[] }> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      balance: '1.5234',
      tokens: [
        { symbol: 'ETH', balance: '1.5234', value: 3047.89 },
        { symbol: 'USDC', balance: '1000.00', value: 1000.00 },
      ],
    };
  },

  /**
   * Get transaction history
   */
  getTransactions: async (address: string, limit: number = 10): Promise<any[]> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return Array.from({ length: limit }).map((_, i) => ({
      hash: `0x${Math.random().toString(16).slice(2)}`,
      from: address,
      to: `0x${Math.random().toString(16).slice(2, 42)}`,
      value: (Math.random() * 10).toFixed(4),
      timestamp: Date.now() - i * 3600000,
      status: 'confirmed',
    }));
  },

  /**
   * Get token price
   */
  getTokenPrice: async (symbol: string): Promise<{ price: number; change24h: number }> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      price: Math.random() * 5000,
      change24h: (Math.random() - 0.5) * 20,
    };
  },

  /**
   * Get NFTs
   */
  getNFTs: async (address: string): Promise<any[]> => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      name: `NFT #${i + 1}`,
      collection: 'Paradox Collection',
      image: `https://picsum.photos/seed/${i}/400/400`,
      floorPrice: (Math.random() * 5).toFixed(2),
    }));
  },
};

// Add authentication interceptor
api.addInterceptor({
  onRequest: async (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
  onResponse: async (response) => {
    // Handle authentication errors
    if (response.status === 401) {
      // Clear auth token
      localStorage.removeItem('auth_token');
      // Redirect to login
      window.location.href = '/login';
    }
    return response;
  },
});

// Add logging interceptor
api.addInterceptor({
  onRequest: async (config) => {
    logger.debug('API Request', {
      method: config.method,
      url: config.url,
      headers: config.headers,
    });
    return config;
  },
  onResponse: async (response) => {
    logger.debug('API Response', {
      status: response.status,
      statusText: response.statusText,
    });
    return response;
  },
  onError: async (error) => {
    logger.error('API Error', error);
    return error;
  },
});
