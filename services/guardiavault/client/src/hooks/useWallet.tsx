import { createContext, useContext, useState, useEffect, ReactNode } from "react";
// Optimized Ethers import - use optimized imports for better tree-shaking
import { BrowserProvider } from "../lib/ethers-optimized";
import { useToast } from "./use-toast";
import type { User } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";

const DEV_AUTH_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === "true";

interface WalletContextType {
  isAuthenticated: boolean;
  isConnecting: boolean;
  isWalletConnected: boolean;
  walletAddress: string | null;
  user: User | null;
  login: (email: string, password: string, totpToken?: string, backupCode?: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Consider wallet connected if backend user has a wallet OR
  // if the browser wallet reports an active account (for pay-first flow)
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const isWalletConnected = !!user?.walletAddress || !!connectedAddress;

  // Check if user is already authenticated
  useEffect(() => {
    // Check auth immediately, then again after a short delay to catch OAuth redirects
    // Only check if we're not on login/signup pages (where 401 is definitely expected)
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    const isAuthPage = currentPath.includes("/login") || currentPath.includes("/signup");

    // Development-only auth bypass to speed up dashboard work
    if (DEV_AUTH_BYPASS) {
      setIsAuthenticated(true);
      setUser((current) => current || ({ email: "dev@local.test" } as User));
      return;
    }

    let timer: NodeJS.Timeout | undefined;
    let cleanupWallet: (() => void) | undefined;

    // Define checkAuth locally to avoid dependency issues
    const performAuthCheck = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: 'include',
          cache: 'no-store',
          signal: AbortSignal.timeout?.(5000) || undefined,
        });

        if (response.status === 401) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          if (response.status !== 401) {
            const { logError } = await import("../utils/logger");
            logError(new Error(`Auth check failed with status ${response.status}`), {
              context: "checkAuth",
              status: response.status,
            });
          }
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError' && error.name !== 'TimeoutError') {
          const { logError } = await import("../utils/logger");
          logError(error instanceof Error ? error : new Error(String(error)), {
            context: "checkAuth",
          });
        }
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    if (!isAuthPage) {
      // First auth check
      performAuthCheck();

      // Second check after delay to catch OAuth redirects
      // Use a small delay to allow first check to complete
      timer = setTimeout(() => {
        performAuthCheck();
      }, 100);
    }

    // Detect existing wallet connection without requiring login
    // Only check if we're on a page that needs wallet (not login/signup pages)
    const shouldCheckWallet = !isAuthPage;

    if (shouldCheckWallet && typeof window !== "undefined" && window.ethereum) {
      // Use a try-catch to silently fail if wallet isn't available
      try {
        window.ethereum
          .request({ method: "eth_accounts" })
          .then((accounts: string[]) => {
            if (accounts && accounts.length > 0) {
              setConnectedAddress(accounts[0]);
            }
          })
          .catch(() => { });

        // Listen for account changes
        const handleAccountsChanged = (accounts: string[]) => {
          setConnectedAddress(accounts && accounts.length > 0 ? accounts[0] : null);
        };
        window.ethereum.on?.("accountsChanged", handleAccountsChanged);
        cleanupWallet = () => {
          window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
        };
      } catch (error) {
        // Silently ignore wallet errors on login/signup pages
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
      cleanupWallet?.();
    };
  }, []); // Empty dependency array is correct - we only want this to run once on mount

  async function checkAuth() {
    // Development-only auth bypass to speed up dashboard work
    if (DEV_AUTH_BYPASS) {
      setIsAuthenticated(true);
      // Provide a minimal fake user object for UI that expects an email
      setUser((current) => current || ({ email: "dev@local.test" } as User));
      return;
    }

    try {
      const response = await fetch("/api/auth/me", {
        credentials: 'include',
        cache: 'no-store', // Ensure fresh check
        // Suppress console errors for expected 401 responses
        signal: AbortSignal.timeout?.(5000) || undefined, // 5 second timeout
      });

      // Handle expected authentication responses
      if (response.status === 401) {
        // User is not authenticated (expected behavior)
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      if (response.status === 404) {
        // API endpoint not found - likely server not running or routes not configured
        // Don't spam console with errors, just set unauthenticated state
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        // Only log unexpected errors (not 401 or 404)
        if (response.status !== 401 && response.status !== 404) {
          const { logError } = await import("../utils/logger");
          logError(new Error(`Auth check failed with status ${response.status}`), {
            context: "checkAuth",
            status: response.status,
          });
        }
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error: any) {
      // Only log non-abort errors (abort = timeout, which is expected)
      if (error.name !== 'AbortError' && error.name !== 'TimeoutError') {
        const { logError } = await import("../utils/logger");
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "checkAuth",
        });
      }
      // Network error or timeout - silently fail
      // This is expected if backend is not available or request times out
      setIsAuthenticated(false);
      setUser(null);
    }
  }

  async function login(email: string, password: string, totpToken?: string, backupCode?: string) {
    setIsConnecting(true);

    try {
      // Trim and normalize inputs before sending to server
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
          totpToken: totpToken?.trim(),
          backupCode: backupCode?.trim(),
        }),
      });

      // Check if response is JSON
      let result;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle 2FA requirement
      if (result.requires2FA) {
        const error: any = new Error("2FA required");
        error.requires2FA = true;
        throw error;
      }

      if (!response.ok) {
        const errorMessage = result.message || result.error?.message || `Login failed (${response.status})`;
        throw new Error(errorMessage);
      }

      const { user: authenticatedUser } = result;

      if (!authenticatedUser) {
        throw new Error("Invalid response from server");
      }

      setUser(authenticatedUser);
      setIsAuthenticated(true);

      // Invalidate queries to refetch data
      queryClient.invalidateQueries();

      toast({
        title: "Login Successful",
        description: `Welcome back, ${authenticatedUser.email}!`,
      });

      // Small delay to ensure state is updated before redirect
      // Components will check isAuthenticated and redirect accordingly
    } catch (error: any) {
      const { logError } = await import("../utils/logger");
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "login",
      });

      // Don't show toast for 2FA requirement - let the component handle it
      if (!error?.requires2FA) {
        const errorMessage = error.message || "Failed to connect to server. Please check your internet connection and try again.";
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }

  async function register(email: string, password: string) {
    setIsConnecting(true);

    try {
      // Trim and normalize inputs before sending to server
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      });

      // Check if response is JSON
      let result;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        // Extract error message from response
        const errorMessage = result.message ||
          result.error?.message ||
          (result.error && typeof result.error === 'string' ? result.error : null) ||
          `Registration failed (${response.status})`;
        throw new Error(errorMessage);
      }

      const { user: authenticatedUser } = result;

      if (!authenticatedUser) {
        throw new Error("Invalid response from server - user data missing");
      }

      setUser(authenticatedUser);
      setIsAuthenticated(true);

      // Invalidate queries to refetch data
      queryClient.invalidateQueries();

      toast({
        title: "Account Created",
        description: `Welcome to GuardiaVault, ${authenticatedUser.email}!`,
      });
    } catch (error: any) {
      const { logError } = await import("../utils/logger");
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "registration",
      });

      // Provide user-friendly error messages
      let errorMessage = error.message || "Failed to create account";

      // Check if email is already registered - provide helpful message
      if (errorMessage.toLowerCase().includes("email already registered") ||
        errorMessage.toLowerCase().includes("already exists")) {
        errorMessage = "Email already registered. Please try logging in instead.";
      }

      // Network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = "Failed to connect to server. Please check your internet connection and try again.";
      }

      // Database errors
      if (error.message?.includes('database') || error.message?.includes('Database')) {
        errorMessage = "Server database error. Please try again in a moment.";
      }

      toast({
        title: errorMessage.toLowerCase().includes("already registered")
          ? "Account Already Exists"
          : "Registration Failed",
        description: errorMessage,
        variant: "destructive",
        duration: errorMessage.toLowerCase().includes("already registered") ? 5000 : undefined,
      });
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      toast({
        title: "Wallet Not Found",
        description: "Please install MetaMask or another Web3 wallet to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      // Try the standard request first
      let accounts: string[] = [];
      try {
        accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (e: any) {
        // Fallback to explicit permission request if provider throws
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
        accounts = await window.ethereum.request({ method: "eth_accounts" });
      }

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned. Please unlock your wallet and try again.");
      }

      const address = accounts[0];
      setConnectedAddress(address);

      // Create provider for dapp usage
      const provider = new BrowserProvider(window.ethereum);
      // Touch the network to initialize provider (avoid stale cache issues)
      try { await provider.getNetwork(); } catch { }

      // If already authenticated, optionally sync wallet to backend in the future.
      // For pay-first flow, we skip backend linking here.

      // Invalidate queries to refresh any UI relying on wallet state
      queryClient.invalidateQueries();

      toast({
        title: "Wallet Connected",
        description: `Connected ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description:
          error?.message || "Unexpected error while connecting wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }

  async function logout() {
    try {
      await apiRequest("POST", "/api/auth/logout");

      setUser(null);
      setIsAuthenticated(false);
      setConnectedAddress(null); // Clear wallet connection on logout

      // Invalidate all queries to refetch with unauthenticated state
      queryClient.invalidateQueries();

      // Redirect to home page
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }

      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  }

  async function disconnectWallet() {
    // Clear local connected state
    setConnectedAddress(null);
    try {
      // Best-effort: some providers support this method via WalletConnect
      await window.ethereum?.request?.({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
    } catch { }
  }

  // Get walletAddress from connectedAddress or user.walletAddress
  const walletAddress = connectedAddress || user?.walletAddress || null;

  return (
    <WalletContext.Provider
      value={{
        isAuthenticated,
        isConnecting,
        isWalletConnected,
        walletAddress,
        user,
        login,
        register,
        connectWallet,
        disconnectWallet,
        logout,
        checkAuth,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
