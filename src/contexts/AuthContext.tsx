/**
 * Authentication Context
 * Manages authentication state for the application
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { authService } from '../services/api-service-layer';
import { User, AuthTokens } from '../types/api.types';

interface Session {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'paradex_access_token',
  REFRESH_TOKEN: 'paradex_refresh_token',
  USER: 'paradex_user',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from storage
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    setIsLoading(true);
    try {
      const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setSession({
          user: parsedUser,
          access_token: storedToken,
          refresh_token: storedRefreshToken,
        });

        // Verify token is still valid by fetching current user
        try {
          const response = await authService.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data);
            setSession(prev => (prev ? { ...prev, user: response.data! } : null));
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data));
          }
        } catch {
          // Token might be expired, try to refresh
          if (storedRefreshToken) {
            await refreshSession();
          } else {
            clearAuthState();
          }
        }
      }
    } catch (err) {
      console.error('Failed to initialize auth:', err);
      clearAuthState();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthState = useCallback(() => {
    setUser(null);
    setSession(null);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login({ email, password });

      if (response.success && response.data) {
        const { user: userData, tokens } = response.data;

        setUser(userData);
        setSession({
          user: userData,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });

        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

        return true;
      } else {
        setError(response.error || 'Login failed');
        return false;
      }
    } catch (err: any) {
      const message = err.message || 'An error occurred during login';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name?: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.register({ email, password, name });

        if (response.success && response.data) {
          const { user: userData, tokens } = response.data;

          setUser(userData);
          setSession({
            user: userData,
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
          });

          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

          return true;
        } else {
          setError(response.error || 'Registration failed');
          return false;
        }
      } catch (err: any) {
        const message = err.message || 'An error occurred during registration';
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuthState();
      setIsLoading(false);
    }
  }, [clearAuthState]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      clearAuthState();
      return false;
    }

    try {
      const response = await authService.refreshToken(refreshToken);

      if (response.success && response.data) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);

        setSession(prev =>
          prev
            ? {
                ...prev,
                access_token: response.data!.accessToken,
                refresh_token: response.data!.refreshToken,
              }
            : null
        );

        return true;
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
    }

    clearAuthState();
    return false;
  }, [clearAuthState]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user && !!session?.access_token,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshSession,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
export type { AuthContextType, Session };
