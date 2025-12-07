/**
 * Wallet Connection Service for React Native
 * Uses WalletConnect v2 for multi-wallet support
 */

import { UniversalProvider } from "@walletconnect/universal-provider";
import { ethers } from "ethers";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

// Note: You may need to adjust the WalletConnect import based on your setup
// If @walletconnect/universal-provider doesn't work, consider using @walletconnect/react-native

const WALLETCONNECT_PROJECT_ID = Constants.expoConfig?.extra?.walletconnectProjectId || 
  process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

const WALLET_STORAGE_KEY = "wallet_session";
const WALLET_ADDRESS_KEY = "wallet_address";

export interface WalletSession {
  address: string;
  chainId: number;
  provider?: any;
  account?: string;
}

class WalletService {
  private provider: UniversalProvider | null = null;
  private session: WalletSession | null = null;

  /**
   * Initialize WalletConnect provider
   */
  async initialize(): Promise<void> {
    if (this.provider) return;

    if (!WALLETCONNECT_PROJECT_ID) {
      console.warn("WalletConnect Project ID not configured");
      return;
    }

    try {
      this.provider = await UniversalProvider.init({
        projectId: WALLETCONNECT_PROJECT_ID,
        metadata: {
          name: "GuardiaVault",
          description: "Secure crypto inheritance platform",
          url: "https://guardiavault.com",
          icons: ["https://guardiavault.com/icon.png"],
        },
      });

      // Restore previous session
      await this.restoreSession();
    } catch (error) {
      console.error("Failed to initialize WalletConnect:", error);
      throw error;
    }
  }

  /**
   * Connect wallet using WalletConnect
   */
  async connect(): Promise<WalletSession> {
    if (!this.provider) {
      await this.initialize();
    }

    if (!this.provider) {
      throw new Error("WalletConnect provider not initialized");
    }

    try {
      // Request connection
      const session = await this.provider.connect({
        namespaces: {
          eip155: {
            methods: [
              "eth_sendTransaction",
              "eth_signTransaction",
              "eth_sign",
              "personal_sign",
              "eth_signTypedData",
            ],
            chains: ["eip155:1", "eip155:11155111"], // Mainnet and Sepolia
            events: ["chainChanged", "accountsChanged"],
          },
        },
      });

      if (!session || !session.namespaces.eip155?.accounts?.[0]) {
        throw new Error("Invalid session returned");
      }

      // Extract address and chain
      const account = session.namespaces.eip155.accounts[0];
      const [chainId, address] = account.split(":");
      const parsedChainId = parseInt(chainId.split(":")[1] || chainId);

      this.session = {
        address,
        chainId: parsedChainId,
        provider: this.provider,
        account,
      };

      // Save session
      await this.saveSession();

      return this.session;
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
      throw new Error(error?.message || "Failed to connect wallet");
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    if (this.provider) {
      try {
        await this.provider.disconnect();
      } catch (error) {
        console.error("Error disconnecting:", error);
      }
    }

    this.session = null;
    this.provider = null;

    // Clear stored session
    await SecureStore.deleteItemAsync(WALLET_STORAGE_KEY);
    await SecureStore.deleteItemAsync(WALLET_ADDRESS_KEY);
  }

  /**
   * Get current wallet session
   */
  getSession(): WalletSession | null {
    return this.session;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return !!this.session && !!this.session.address;
  }

  /**
   * Get ethers provider for wallet interactions
   */
  async getEthersProvider(): Promise<ethers.BrowserProvider | null> {
    if (!this.session || !this.provider) {
      return null;
    }

    try {
      // Create ethers provider from WalletConnect session
      const provider = new ethers.BrowserProvider(this.provider as any);
      return provider;
    } catch (error) {
      console.error("Failed to create ethers provider:", error);
      return null;
    }
  }

  /**
   * Sign a message with the connected wallet
   */
  async signMessage(message: string): Promise<string> {
    if (!this.session || !this.provider) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await this.provider.request({
        topic: this.provider.session?.topic || "",
        chainId: `eip155:${this.session.chainId}`,
        request: {
          method: "personal_sign",
          params: [message, this.session.address],
        },
      });

      return result as string;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to sign message");
    }
  }

  /**
   * Send a transaction
   */
  async sendTransaction(transaction: {
    to: string;
    value?: string;
    data?: string;
  }): Promise<string> {
    if (!this.session || !this.provider) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = {
        from: this.session.address,
        to: transaction.to,
        value: transaction.value || "0x0",
        data: transaction.data || "0x",
      };

      const result = await this.provider.request({
        topic: this.provider.session?.topic || "",
        chainId: `eip155:${this.session.chainId}`,
        request: {
          method: "eth_sendTransaction",
          params: [tx],
        },
      });

      return result as string;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to send transaction");
    }
  }

  /**
   * Restore previous wallet session
   */
  private async restoreSession(): Promise<void> {
    try {
      const storedAddress = await SecureStore.getItemAsync(WALLET_ADDRESS_KEY);
      if (!storedAddress || !this.provider?.session) {
        return;
      }

      const account = this.provider.session.namespaces.eip155?.accounts?.[0];
      if (!account) {
        return;
      }

      const [chainId, address] = account.split(":");
      const parsedChainId = parseInt(chainId.split(":")[1] || chainId);

      if (address.toLowerCase() === storedAddress.toLowerCase()) {
        this.session = {
          address,
          chainId: parsedChainId,
          provider: this.provider,
          account,
        };
      }
    } catch (error) {
      console.error("Failed to restore session:", error);
    }
  }

  /**
   * Save wallet session to secure storage
   */
  private async saveSession(): Promise<void> {
    if (!this.session) return;

    try {
      await SecureStore.setItemAsync(
        WALLET_ADDRESS_KEY,
        this.session.address
      );
      // WalletConnect handles session persistence internally
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  }

  /**
   * Listen for wallet events
   */
  on(event: "connect" | "disconnect" | "session_update", callback: (session?: WalletSession) => void): void {
    if (!this.provider) return;

    // WalletConnect event listeners would go here
    // For now, we'll use polling or manual refresh
  }
}

export const walletService = new WalletService();

