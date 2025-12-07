/**
 * Shared Wallet Hook (Web & React Native)
 * Platform-agnostic wallet connection
 */

import { useState, useEffect } from "react";
import { Platform } from "../utils/platform";

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
}

/**
 * Web wallet implementation using Wagmi
 */
async function getWebWalletState(): Promise<WalletState> {
  if (!Platform.isWeb) {
    return { isConnected: false, address: null, chainId: null };
  }

  try {
    // Dynamic import to avoid bundling in React Native
    // Note: This is a placeholder - web implementation uses hooks differently
    return { isConnected: false, address: null, chainId: null };
    // eslint-disable-next-line no-unreachable
  } catch {
    return { isConnected: false, address: null, chainId: null };
  }
}

/**
 * React Native wallet implementation using WalletConnect
 */
async function getNativeWalletState(): Promise<WalletState> {
  try {
    // Dynamic import to avoid bundling wallet service in web
    const { walletService } = await import("../../mobile/services/walletService");
    const session = walletService.getSession();
    
    if (session) {
      return {
        isConnected: true,
        address: session.address,
        chainId: session.chainId,
      };
    }
    
    return { isConnected: false, address: null, chainId: null };
  } catch (error) {
    console.error("Error getting native wallet state:", error);
    return { isConnected: false, address: null, chainId: null };
  }
}

/**
 * Platform-agnostic wallet hook
 */
export function useWallet(): {
  isWalletConnected: boolean;
  walletAddress: string | null;
  isAuthenticated: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
} {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
  });

  useEffect(() => {
    if (Platform.isWeb) {
      // Web wallet state is managed by WagmiProvider
      // This hook is a simplified wrapper
      // Full implementation would integrate with Wagmi hooks
    } else {
      // Use React Native wallet
      getNativeWalletState().then(setState);
    }
  }, []);

  return {
    isWalletConnected: state.isConnected,
    walletAddress: state.address,
    isAuthenticated: state.isConnected && !!state.address,
    connectWallet: async () => {
      if (Platform.isWeb) {
        // Web wallet connection logic (handled by Wagmi)
        throw new Error("Web wallet connection should use Wagmi hooks");
      } else {
        // React Native wallet connection
        const { walletService } = await import("../../mobile/services/walletService");
        await walletService.initialize();
        const session = await walletService.connect();
        setState({
          isConnected: true,
          address: session.address,
          chainId: session.chainId,
        });
      }
    },
    disconnectWallet: async () => {
      if (!Platform.isWeb) {
        const { walletService } = await import("../../mobile/services/walletService");
        await walletService.disconnect();
      }
      setState({ isConnected: false, address: null, chainId: null });
    },
  };
}

