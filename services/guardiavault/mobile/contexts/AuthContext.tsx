/**
 * Authentication Context
 * Manages authentication state for the mobile app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient, API_ENDPOINTS } from "../services/apiClient";

interface User {
  id: string;
  email: string;
  walletAddress?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ user: User }>(API_ENDPOINTS.auth.me);
      if (response && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error: any) {
      // 401 is expected if not authenticated - don't log as error
      if (error.status && error.status !== 401) {
        console.error("Auth check failed:", error);
      }
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post<{ user: User; token?: string }>(
        API_ENDPOINTS.auth.login,
        { email, password }
      );

      if (!response || !response.user) {
        throw new Error("Invalid response from server");
      }

      // Store token if provided (for token-based auth)
      if (response.token) {
        await apiClient.setAuthToken(response.token);
      }

      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error: any) {
      const message = error.message || error.status === 401 
        ? "Invalid email or password" 
        : "Login failed. Please try again.";
      throw new Error(message);
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const response = await apiClient.post<{ user: User; token?: string }>(
        API_ENDPOINTS.auth.register,
        { email, password }
      );

      if (!response || !response.user) {
        throw new Error("Invalid response from server");
      }

      // Store token if provided
      if (response.token) {
        await apiClient.setAuthToken(response.token);
      }

      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error: any) {
      const message = error.message || error.status === 409
        ? "Email already exists"
        : "Signup failed. Please try again.";
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post(API_ENDPOINTS.auth.logout);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await apiClient.setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

