/**
 * Authentication Service
 * Platform-agnostic authentication for web and mobile
 */

import { apiClient } from "./apiClient";
import { API_ENDPOINTS } from "../config/api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  walletAddress?: string;
}

export interface User {
  id: string;
  email: string;
  walletAddress?: string;
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    return apiClient.post(API_ENDPOINTS.auth.login, credentials);
  }

  async register(data: RegisterData): Promise<User> {
    return apiClient.post(API_ENDPOINTS.auth.register, data);
  }

  async logout(): Promise<void> {
    return apiClient.post(API_ENDPOINTS.auth.logout, {});
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      return await apiClient.get(API_ENDPOINTS.auth.me);
    } catch {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }
}

export const authService = new AuthService();

