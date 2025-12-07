/**
 * API Client
 * Platform-agnostic HTTP client for web and React Native
 */

import { API_BASE_URL } from "../config/api";
import { Platform } from "../utils/platform";

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export class ApiClient {
  private baseURL: string;
  private credentials: RequestCredentials;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.credentials = Platform.isWeb ? "include" : "omit"; // Cookies on web, token on native
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: this.credentials,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: response.statusText,
        }));

        throw {
          message: error.message || "Request failed",
          status: response.status,
          code: error.code,
        } as ApiError;
      }

      // Handle empty responses
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as T);
    } catch (error: any) {
      if (error.status) {
        throw error; // Re-throw ApiError
      }
      throw {
        message: error.message || "Network error",
        status: 0,
      } as ApiError;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();

