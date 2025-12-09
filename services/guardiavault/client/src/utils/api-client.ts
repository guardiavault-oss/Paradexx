/**
 * Enhanced API Client with Retry Logic and Error Handling
 */

interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  onError?: (error: Error) => void;
}

interface ApiError extends Error {
  status?: number;
  code?: string;
  data?: any;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "";
  }

  /**
   * Get user-friendly error message from API response
   */
  private getErrorMessage(error: any, defaultMessage: string): string {
    if (error?.message) return error.message;
    if (error?.data?.message) return error.data.message;
    if (typeof error === "string") return error;
    return defaultMessage;
  }

  /**
   * Get error code for handling specific error types
   */
  private getErrorCode(error: any): string | undefined {
    return error?.code || error?.data?.code;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(status?: number): boolean {
    if (!status) return true; // Network errors are retryable
    return status >= 500 || status === 408 || status === 429;
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Enhanced fetch with retry logic, timeout, and error handling
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      retries = 3,
      retryDelay = 1000,
      timeout = 30000,
      onError,
      ...fetchOptions
    } = options;

    const url = endpoint.startsWith("http") ? endpoint : `${this.baseURL}${endpoint}`;
    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          credentials: "include",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...fetchOptions.headers,
          },
        });

        clearTimeout(timeoutId);

        // Handle non-JSON responses
        const contentType = response.headers.get("content-type");
        let data: any;

        if (contentType?.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = { message: text || "Request failed" };
        }

        // Success response
        if (response.ok) {
          return data.data !== undefined ? data.data : data;
        }

        // Create error object
        const error: ApiError = new Error(
          this.getErrorMessage(data, `Request failed with status ${response.status}`)
        ) as ApiError;
        error.status = response.status;
        error.code = this.getErrorCode(data);
        error.data = data;

        // Don't retry on client errors (4xx) except 429
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          if (onError) onError(error);
          throw error;
        }

        // Check if we should retry
        if (attempt < retries && this.isRetryableError(response.status)) {
          const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
          await this.sleep(delay);
          lastError = error;
          continue;
        }

        // No more retries or non-retryable error
        if (onError) onError(error);
        throw error;
      } catch (error: any) {
        // Network error or timeout
        if (error.name === "AbortError") {
          const timeoutError: ApiError = new Error(
            "Request timed out. Please check your connection and try again."
          ) as ApiError;
          timeoutError.code = "TIMEOUT";
          if (onError) onError(timeoutError);
          throw timeoutError;
        }

        if (error.name === "TypeError" && error.message.includes("fetch")) {
          const networkError: ApiError = new Error(
            "Network error. Please check your internet connection."
          ) as ApiError;
          networkError.code = "NETWORK_ERROR";
          
          if (attempt < retries) {
            const delay = retryDelay * Math.pow(2, attempt);
            await this.sleep(delay);
            lastError = networkError;
            continue;
          }

          if (onError) onError(networkError);
          throw networkError;
        }

        // Re-throw if it's already an ApiError
        if (error.status || error.code) {
          if (onError) onError(error);
          throw error;
        }

        // Unknown error
        lastError = error;
        if (attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
          continue;
        }

        if (onError) onError(error);
        throw error;
      }
    }

    // This should never be reached, but TypeScript needs it
    if (lastError) {
      if (onError) onError(lastError);
      throw lastError;
    }

    throw new Error("Request failed after all retries");
  }

  /**
   * Convenience methods
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
export type { ApiError, RequestOptions };

