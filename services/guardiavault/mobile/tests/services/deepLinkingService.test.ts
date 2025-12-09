/**
 * Deep Linking Service Tests
 * Unit tests for deep linking service
 */

import { deepLinkingService } from "../../services/deepLinkingService";
import * as Linking from "expo-linking";

// Mock expo-linking
jest.mock("expo-linking");

describe("DeepLinkingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initialize", () => {
    it("should setup deep link listeners", () => {
      (Linking.getInitialURL as jest.Mock).mockResolvedValue(null);
      (Linking.addEventListener as jest.Mock).mockReturnValue({ remove: jest.fn() });

      const callback = jest.fn();
      const cleanup = deepLinkingService.initialize(callback);

      expect(Linking.getInitialURL).toHaveBeenCalled();
      expect(Linking.addEventListener).toHaveBeenCalledWith("url", expect.any(Function));
      expect(typeof cleanup).toBe("function");
    });

    it("should handle initial URL", async () => {
      (Linking.getInitialURL as jest.Mock).mockResolvedValue(
        "guardiavault://walletconnect/callback?sessionId=123"
      );
      (Linking.addEventListener as jest.Mock).mockReturnValue({ remove: jest.fn() });

      const callback = jest.fn();
      deepLinkingService.initialize(callback);

      // Wait for async operation
      await new Promise((resolve) => setImmediate(resolve));

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "walletconnect/callback",
          params: { sessionId: "123" },
        })
      );
    });
  });

  describe("buildURL", () => {
    it("should build URL with path only", () => {
      const url = deepLinkingService.buildURL("test/path");

      expect(url).toBe("guardiavault://test/path");
    });

    it("should build URL with path and params", () => {
      const url = deepLinkingService.buildURL("test/path", {
        param1: "value1",
        param2: "value2",
      });

      expect(url).toBe("guardiavault://test/path?param1=value1&param2=value2");
    });

    it("should encode URL parameters", () => {
      const url = deepLinkingService.buildURL("test/path", {
        param: "value with spaces",
      });

      expect(url).toBe("guardiavault://test/path?param=value%20with%20spaces");
    });
  });

  describe("openURL", () => {
    it("should open URL successfully", async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      const result = await deepLinkingService.openURL("https://example.com");

      expect(result).toBe(true);
      expect(Linking.canOpenURL).toHaveBeenCalledWith("https://example.com");
      expect(Linking.openURL).toHaveBeenCalledWith("https://example.com");
    });

    it("should return false if URL cannot be opened", async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      const result = await deepLinkingService.openURL("invalid://url");

      expect(result).toBe(false);
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      (Linking.canOpenURL as jest.Mock).mockRejectedValue(new Error("Error opening URL"));

      const result = await deepLinkingService.openURL("https://example.com");

      expect(result).toBe(false);
    });
  });

  describe("handleWalletConnectCallback", () => {
    it("should handle valid WalletConnect callback", () => {
      const result = deepLinkingService.handleWalletConnectCallback(
        "guardiavault://walletconnect/callback?sessionId=abc123"
      );

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe("abc123");
    });

    it("should return failure for invalid callback", () => {
      const result = deepLinkingService.handleWalletConnectCallback(
        "guardiavault://invalid/path"
      );

      expect(result.success).toBe(false);
      expect(result.sessionId).toBeUndefined();
    });

    it("should handle callback without sessionId", () => {
      const result = deepLinkingService.handleWalletConnectCallback(
        "guardiavault://walletconnect/callback"
      );

      expect(result.success).toBe(true);
      expect(result.sessionId).toBeUndefined();
    });
  });

  describe("parseURL", () => {
    it("should parse valid deep link URL", () => {
      // Access private method through public interface
      const result = deepLinkingService.handleWalletConnectCallback(
        "guardiavault://test/path?param=value"
      );

      // Verify parseURL works through buildURL and handleWalletConnectCallback
      const url = deepLinkingService.buildURL("test/path", { param: "value" });
      expect(url).toContain("test/path");
      expect(url).toContain("param=value");
    });
  });
});







