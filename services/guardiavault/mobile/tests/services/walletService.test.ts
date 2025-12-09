/**
 * Wallet Service Tests
 * Unit tests for wallet connection service
 */

import { walletService, WalletSession } from "../../services/walletService";
import * as SecureStore from "expo-secure-store";
import { UniversalProvider } from "@walletconnect/universal-provider";
import Constants from "expo-constants";

// Mock dependencies
jest.mock("expo-secure-store");
jest.mock("@walletconnect/universal-provider");
jest.mock("expo-constants");

describe("WalletService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton state
    (walletService as any).provider = null;
    (walletService as any).session = null;

    // Mock Constants
    (Constants.expoConfig as any) = {
      extra: {
        walletconnectProjectId: "test-project-id",
      },
    };
  });

  describe("initialize", () => {
    it("should initialize WalletConnect provider", async () => {
      const mockProvider = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        request: jest.fn(),
        session: null,
      };

      (UniversalProvider.init as jest.Mock).mockResolvedValue(mockProvider);

      await walletService.initialize();

      expect(UniversalProvider.init).toHaveBeenCalledWith({
        projectId: "test-project-id",
        metadata: {
          name: "GuardiaVault",
          description: "Secure crypto inheritance platform",
          url: "https://guardiavault.com",
          icons: ["https://guardiavault.com/icon.png"],
        },
      });
    });

    it("should handle missing project ID", async () => {
      (Constants.expoConfig as any) = { extra: {} };
      process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID = "";

      await walletService.initialize();

      expect(UniversalProvider.init).not.toHaveBeenCalled();
    });

    it("should restore previous session", async () => {
      const mockProvider = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        request: jest.fn(),
        session: {
          topic: "test-topic",
          namespaces: {
            eip155: {
              accounts: ["eip155:11155111:0x1234567890123456789012345678901234567890"],
            },
          },
        },
      };

      (UniversalProvider.init as jest.Mock).mockResolvedValue(mockProvider);
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        "0x1234567890123456789012345678901234567890"
      );

      await walletService.initialize();

      const session = walletService.getSession();
      expect(session).toBeTruthy();
      expect(session?.address).toBe("0x1234567890123456789012345678901234567890");
    });
  });

  describe("connect", () => {
    it("should connect wallet successfully", async () => {
      const mockProvider = {
        connect: jest.fn().mockResolvedValue({
          topic: "test-topic",
          namespaces: {
            eip155: {
              accounts: ["eip155:11155111:0x1234567890123456789012345678901234567890"],
            },
          },
        }),
        disconnect: jest.fn(),
        request: jest.fn(),
        session: null,
      };

      (UniversalProvider.init as jest.Mock).mockResolvedValue(mockProvider);
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await walletService.initialize();
      const session = await walletService.connect();

      expect(session.address).toBe("0x1234567890123456789012345678901234567890");
      expect(session.chainId).toBe(11155111);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "wallet_address",
        "0x1234567890123456789012345678901234567890"
      );
    });

    it("should throw error if provider not initialized", async () => {
      await expect(walletService.connect()).rejects.toThrow();
    });

    it("should handle connection errors", async () => {
      const mockProvider = {
        connect: jest.fn().mockRejectedValue(new Error("Connection failed")),
        disconnect: jest.fn(),
        request: jest.fn(),
        session: null,
      };

      (UniversalProvider.init as jest.Mock).mockResolvedValue(mockProvider);

      await walletService.initialize();
      await expect(walletService.connect()).rejects.toThrow("Connection failed");
    });
  });

  describe("disconnect", () => {
    it("should disconnect wallet and clear session", async () => {
      const mockProvider = {
        connect: jest.fn(),
        disconnect: jest.fn().mockResolvedValue(undefined),
        request: jest.fn(),
        session: null,
      };

      (UniversalProvider.init as jest.Mock).mockResolvedValue(mockProvider);
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await walletService.initialize();
      await walletService.disconnect();

      expect(mockProvider.disconnect).toHaveBeenCalled();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("wallet_session");
      expect(walletService.isConnected()).toBe(false);
    });
  });

  describe("getSession", () => {
    it("should return null when not connected", () => {
      expect(walletService.getSession()).toBeNull();
    });

    it("should return session when connected", async () => {
      const mockProvider = {
        connect: jest.fn().mockResolvedValue({
          topic: "test-topic",
          namespaces: {
            eip155: {
              accounts: ["eip155:11155111:0x1234567890123456789012345678901234567890"],
            },
          },
        }),
        disconnect: jest.fn(),
        request: jest.fn(),
        session: null,
      };

      (UniversalProvider.init as jest.Mock).mockResolvedValue(mockProvider);
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await walletService.initialize();
      await walletService.connect();

      const session = walletService.getSession();
      expect(session).toBeTruthy();
      expect(session?.address).toBe("0x1234567890123456789012345678901234567890");
    });
  });

  describe("isConnected", () => {
    it("should return false when not connected", () => {
      expect(walletService.isConnected()).toBe(false);
    });

    it("should return true when connected", async () => {
      const mockProvider = {
        connect: jest.fn().mockResolvedValue({
          topic: "test-topic",
          namespaces: {
            eip155: {
              accounts: ["eip155:11155111:0x1234567890123456789012345678901234567890"],
            },
          },
        }),
        disconnect: jest.fn(),
        request: jest.fn(),
        session: null,
      };

      (UniversalProvider.init as jest.Mock).mockResolvedValue(mockProvider);
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await walletService.initialize();
      await walletService.connect();

      expect(walletService.isConnected()).toBe(true);
    });
  });

  describe("signMessage", () => {
    it("should sign message successfully", async () => {
      const mockProvider = {
        connect: jest.fn().mockResolvedValue({
          topic: "test-topic",
          namespaces: {
            eip155: {
              accounts: ["eip155:11155111:0x1234567890123456789012345678901234567890"],
            },
          },
        }),
        disconnect: jest.fn(),
        request: jest.fn().mockResolvedValue("0xsignature123"),
        session: {
          topic: "test-topic",
        },
      };

      (UniversalProvider.init as jest.Mock).mockResolvedValue(mockProvider);
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await walletService.initialize();
      await walletService.connect();

      const signature = await walletService.signMessage("test message");

      expect(signature).toBe("0xsignature123");
      expect(mockProvider.request).toHaveBeenCalledWith({
        topic: "test-topic",
        chainId: "eip155:11155111",
        request: {
          method: "personal_sign",
          params: ["test message", "0x1234567890123456789012345678901234567890"],
        },
      });
    });

    it("should throw error if wallet not connected", async () => {
      await expect(walletService.signMessage("test")).rejects.toThrow("Wallet not connected");
    });
  });

  describe("sendTransaction", () => {
    it("should send transaction successfully", async () => {
      const mockProvider = {
        connect: jest.fn().mockResolvedValue({
          topic: "test-topic",
          namespaces: {
            eip155: {
              accounts: ["eip155:11155111:0x1234567890123456789012345678901234567890"],
            },
          },
        }),
        disconnect: jest.fn(),
        request: jest.fn().mockResolvedValue("0xtxhash123"),
        session: {
          topic: "test-topic",
        },
      };

      (UniversalProvider.init as jest.Mock).mockResolvedValue(mockProvider);
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await walletService.initialize();
      await walletService.connect();

      const txHash = await walletService.sendTransaction({
        to: "0xrecipient",
        value: "0x1",
      });

      expect(txHash).toBe("0xtxhash123");
      expect(mockProvider.request).toHaveBeenCalledWith({
        topic: "test-topic",
        chainId: "eip155:11155111",
        request: {
          method: "eth_sendTransaction",
          params: [
            {
              from: "0x1234567890123456789012345678901234567890",
              to: "0xrecipient",
              value: "0x1",
              data: "0x",
            },
          ],
        },
      });
    });

    it("should throw error if wallet not connected", async () => {
      await expect(
        walletService.sendTransaction({ to: "0xrecipient" })
      ).rejects.toThrow("Wallet not connected");
    });
  });
});

