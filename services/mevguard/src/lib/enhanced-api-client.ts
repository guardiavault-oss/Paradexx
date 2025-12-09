/**
 * Enhanced API Client with advanced features:
 * - Automatic retry with exponential backoff
 * - Request/response interceptors
 * - Request caching
 * - Connection status monitoring
 * - Request queuing for offline scenarios
 * - Type-safe responses
 * - Response transformation
 */

// Configuration
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableCache?: boolean;
  cacheTTL?: number;
  enableQueue?: boolean;
  getAuthToken?: () => Promise<string | null>;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: ApiError) => void;
}

// Error types
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request options
export interface RequestOptions extends RequestInit {
  retry?: boolean;
  cache?: boolean;
  cacheKey?: string;
  timeout?: number;
  transform?: (data: any) => any;
  validate?: (data: any) => boolean;
}

// Response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
  headers?: Headers;
  cached?: boolean;
}

// Cache entry
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Queued request
interface QueuedRequest {
  endpoint: string;
  options: RequestOptions;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

export class EnhancedApiClient {
  private baseURL: string;
  private config: Required<Omit<ApiClientConfig, 'getAuthToken' | 'onConnectionChange' | 'onError'>> & {
    getAuthToken?: () => Promise<string | null>;
    onConnectionChange?: (connected: boolean) => void;
    onError?: (error: ApiError) => void;
  };
  private cache: Map<string, CacheEntry<any>> = new Map();
  private requestQueue: QueuedRequest[] = [];
  private isOnline: boolean = navigator.onLine;
  private isProcessingQueue: boolean = false;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, '');
    this.config = {
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      enableCache: config.enableCache ?? true,
      cacheTTL: config.cacheTTL || 60000, // 1 minute default
      enableQueue: config.enableQueue ?? true,
      getAuthToken: config.getAuthToken,
      onConnectionChange: config.onConnectionChange,
      onError: config.onError,
    };

    // Monitor online/offline status
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  /**
   * Main request method with all enhancements
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const requestId = `${options.method || 'GET'}_${endpoint}_${Date.now()}`;

    // Check cache first
    if (options.cache !== false && this.config.enableCache) {
      const cacheKey = options.cacheKey || endpoint;
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return { data: cached, status: 200, cached: true };
      }
    }

    // Queue request if offline
    if (!this.isOnline && this.config.enableQueue) {
      return this.queueRequest<T>(endpoint, options);
    }

    // Create abort controller
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    try {
      // Get auth token
      const token = await this.config.getAuthToken?.();
      
      // Build headers
      const headers = new Headers(options.headers);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      // Make request with retry logic
      const response = await this.requestWithRetry<T>(
        url,
        {
          ...options,
          headers,
          signal: controller.signal,
        },
        requestId
      );

      // Transform response if needed
      let data = response.data;
      if (options.transform && data) {
        data = options.transform(data);
      }

      // Validate response if validator provided
      if (options.validate && data) {
        if (!options.validate(data)) {
          throw new ApiError(500, 'Response validation failed', data);
        }
      }

      // Cache response if enabled
      if (options.cache !== false && this.config.enableCache && response.status === 200) {
        const cacheKey = options.cacheKey || endpoint;
        this.setCache(cacheKey, data, this.config.cacheTTL);
      }

      return response;
    } catch (error) {
      const apiError = this.handleError(error);
      
      if (this.config.onError) {
        this.config.onError(apiError);
      }

      return {
        status: apiError.status,
        error: apiError.message,
      };
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * Request with automatic retry and exponential backoff
   */
  private async requestWithRetry<T>(
    url: string,
    options: RequestOptions,
    requestId: string,
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    const timeout = options.timeout || this.config.timeout;
    const shouldRetry = options.retry !== false && attempt <= this.config.retryAttempts;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Retry on 5xx errors or 429 (rate limit)
        if (shouldRetry && (response.status >= 500 || response.status === 429)) {
          return this.retryRequest<T>(url, options, requestId, attempt, response.status);
        }

        throw new ApiError(
          response.status,
          data.detail || data.message || `HTTP ${response.status}`,
          data
        );
      }

      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      // Retry on network errors
      if (shouldRetry && this.isRetryableError(error)) {
        return this.retryRequest<T>(url, options, requestId, attempt, 0);
      }

      throw error;
    }
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest<T>(
    url: string,
    options: RequestOptions,
    requestId: string,
    attempt: number,
    status: number
  ): Promise<ApiResponse<T>> {
    const delay = this.calculateBackoffDelay(attempt, status);
    
    console.log(`Retrying request (attempt ${attempt}/${this.config.retryAttempts}) after ${delay}ms`);

    await this.sleep(delay);

    return this.requestWithRetry<T>(url, options, requestId, attempt + 1);
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attempt: number, status: number): number {
    // Base delay with exponential backoff
    let delay = this.config.retryDelay * Math.pow(2, attempt - 1);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    delay += jitter;

    // Longer delay for rate limiting
    if (status === 429) {
      delay *= 2;
    }

    // Cap at 30 seconds
    return Math.min(delay, 30000);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof ApiError) {
      return error.status >= 500 || error.status === 429;
    }

    // Network errors, timeouts, etc.
    return (
      error instanceof TypeError ||
      error.name === 'AbortError' ||
      error.message?.includes('network') ||
      error.message?.includes('timeout')
    );
  }

  /**
   * Handle errors and convert to ApiError
   */
  private handleError(error: any): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error.name === 'AbortError') {
      return new ApiError(408, 'Request timeout', undefined, error);
    }

    if (error instanceof TypeError) {
      return new ApiError(0, 'Network error - check your connection', undefined, error);
    }

    return new ApiError(500, error.message || 'Unknown error', undefined, error);
  }

  /**
   * Queue request for later when offline
   */
  private queueRequest<T>(endpoint: string, options: RequestOptions): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        endpoint,
        options,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      console.log(`Request queued (${this.requestQueue.length} in queue)`);
    });
  }

  /**
   * Process queued requests when back online
   */
  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    console.log(`Processing ${this.requestQueue.length} queued requests`);

    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const queued of queue) {
      try {
        const response = await this.request(queued.endpoint, queued.options);
        queued.resolve(response);
      } catch (error) {
        queued.reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Handle online event
   */
  private handleOnline() {
    console.log('Connection restored');
    this.isOnline = true;
    this.config.onConnectionChange?.(true);
    this.processQueue();
  }

  /**
   * Handle offline event
   */
  private handleOffline() {
    console.log('Connection lost');
    this.isOnline = false;
    this.config.onConnectionChange?.(false);
  }

  /**
   * Cache management
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Cancel request
   */
  cancelRequest(requestId: string) {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * Cancel all requests
   */
  cancelAllRequests() {
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();
  }

  /**
   * Utility: Sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Convenience methods for common HTTP methods
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance factory
export function createApiClient(config: ApiClientConfig): EnhancedApiClient {
  return new EnhancedApiClient(config);
}

