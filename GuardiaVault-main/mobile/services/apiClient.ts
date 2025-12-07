/**
 * Mobile API Client
 * Handles authentication tokens and API requests for React Native
 */

import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define API endpoints locally for mobile (avoiding shared import issues)
const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
    me: "/api/auth/me",
  },
  vaults: {
    list: "/api/vaults",
    get: (id: string) => `/api/vaults/${id}`,
    create: "/api/vaults",
    checkIn: (id: string) => `/api/vaults/${id}/checkin`,
  },
  recovery: {
    create: "/api/recovery/create",
    verifyToken: (token: string) => `/api/recovery/verify-token/${token}`,
  },
  yieldVaults: {
    list: "/api/yield-vaults",
    create: "/api/yield-vaults",
    get: (id: string) => `/api/yield-vaults/${id}`,
  },
  dao: {
    claims: "/api/dao/claims",
    claimCreate: "/api/dao/claims",
    vote: (id: string) => `/api/dao/claims/${id}/vote`,
    verifier: (address: string) => `/api/dao/verifier/${address}`,
    verifierRegister: "/api/dao/verifier/register",
  },
} as const;

// Get API URL from config, with fallback
// Note: For physical devices, use your computer's IP address instead of localhost
// Example: "http://192.168.1.100:5000"
const API_BASE_URL = 
  Constants.expoConfig?.extra?.apiUrl || 
  process.env.EXPO_PUBLIC_API_URL || 
  "http://localhost:5000";
const AUTH_TOKEN_KEY = "@guardiavault:auth_token";

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

class MobileApiClient {
  private baseURL: string;
  private authToken: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.loadAuthToken();
  }

  private async loadAuthToken() {
    try {
      this.authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error("Failed to load auth token:", error);
    }
  }

  async setAuthToken(token: string | null) {
    this.authToken = token;
    if (token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add auth token if available (for token-based auth)
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      // Include credentials for session-based auth (cookies)
      credentials: "include",
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 - clear token and throw
      if (response.status === 401) {
        await this.setAuthToken(null);
        throw {
          message: "Unauthorized",
          status: 401,
        } as ApiError;
      }

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

export const apiClient = new MobileApiClient();
export { API_ENDPOINTS };

