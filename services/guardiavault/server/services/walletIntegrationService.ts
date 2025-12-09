/**
 * Enhanced Wallet Integration Service
 * Supports multiple wallet types including Coinbase Wallet and hardware wallets
 */

import { logInfo, logError } from "./logger";

export interface WalletInfo {
  type: "metamask" | "coinbase" | "walletconnect" | "hardware" | "injected";
  address: string;
  chainId: number;
  isConnected: boolean;
  provider?: any;
}

export class WalletIntegrationService {
  /**
   * Detect available wallets
   */
  async detectAvailableWallets(): Promise<Array<{
    type: string;
    name: string;
    available: boolean;
    icon: string;
  }>> {
    const wallets = [];

    // MetaMask
    wallets.push({
      type: "metamask",
      name: "MetaMask",
      available: typeof window !== "undefined" && !!(window as any).ethereum?.isMetaMask,
      icon: "🦊",
    });

    // Coinbase Wallet
    wallets.push({
      type: "coinbase",
      name: "Coinbase Wallet",
      available:
        typeof window !== "undefined" &&
        (!!(window as any).ethereum?.isCoinbaseWallet ||
          !!(window as any).coinbaseWalletExtension),
      icon: "🔷",
    });

    // WalletConnect
    wallets.push({
      type: "walletconnect",
      name: "WalletConnect",
      available: true, // Always available via QR code
      icon: "🔗",
    });

    // Hardware Wallets (via WebHID)
    wallets.push({
      type: "hardware",
      name: "Hardware Wallet",
      available:
        typeof window !== "undefined" &&
        "hid" in navigator &&
        !!(navigator as any).hid,
      icon: "🔐",
    });

    return wallets;
  }

  /**
   * Connect to Coinbase Wallet
   */
  async connectCoinbaseWallet(): Promise<WalletInfo | null> {
    try {
      if (typeof window === "undefined") {
        return null;
      }

      const ethereum = (window as any).ethereum;
      if (!ethereum || !ethereum.isCoinbaseWallet) {
        throw new Error("Coinbase Wallet not detected");
      }

      // Request account access
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const chainId = await ethereum.request({ method: "eth_chainId" });

      return {
        type: "coinbase",
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        isConnected: true,
        provider: ethereum,
      };
    } catch (error) {
      logError(error as Error, { context: "connectCoinbaseWallet" });
      return null;
    }
  }

  /**
   * Connect to hardware wallet via WebHID
   */
  async connectHardwareWallet(
    deviceType: "ledger" | "trezor" = "ledger"
  ): Promise<WalletInfo | null> {
    try {
      if (typeof window === "undefined") {
        return null;
      }

      if (!("hid" in navigator)) {
        throw new Error("WebHID not supported in this browser");
      }

      // Request device access
      const devices = await (navigator as any).hid.requestDevice({
        filters: [
          { vendorId: 0x2c97 }, // Ledger
          { vendorId: 0x1209 }, // Trezor
        ],
      });

      if (!devices || devices.length === 0) {
        throw new Error("No hardware wallet found");
      }

      // For production, you would use @ledgerhq/hw-app-eth or similar
      // This is a placeholder for the integration
      logInfo("Hardware wallet connected", { deviceType, deviceCount: devices.length });

      return {
        type: "hardware",
        address: "", // Would be derived from device
        chainId: 1,
        isConnected: true,
      };
    } catch (error) {
      logError(error as Error, { context: "connectHardwareWallet", deviceType });
      return null;
    }
  }

  /**
   * Get wallet connection status
   */
  async getWalletStatus(address: string): Promise<{
    connected: boolean;
    type: string | null;
    chainId: number | null;
  }> {
    try {
      if (typeof window === "undefined") {
        return { connected: false, type: null, chainId: null };
      }

      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        return { connected: false, type: null, chainId: null };
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });
      const isConnected = accounts && accounts.includes(address);

      if (isConnected) {
        const chainId = await ethereum.request({ method: "eth_chainId" });
        const type = ethereum.isCoinbaseWallet
          ? "coinbase"
          : ethereum.isMetaMask
          ? "metamask"
          : "injected";

        return {
          connected: true,
          type,
          chainId: parseInt(chainId, 16),
        };
      }

      return { connected: false, type: null, chainId: null };
    } catch (error) {
      logError(error as Error, { context: "getWalletStatus", address });
      return { connected: false, type: null, chainId: null };
    }
  }
}

export const walletIntegrationService = new WalletIntegrationService();

