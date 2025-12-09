/**
 * useWallet Hook Tests
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWallet, WalletProvider } from "../../../client/src/hooks/useWallet";

// Mock useToast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: [],
  }),
}));

// Mock window.ethereum
const mockEthereum = {
  request: vi.fn().mockResolvedValue([]),
  on: vi.fn(),
  removeListener: vi.fn(),
};

Object.defineProperty(window, "ethereum", {
  writable: true,
  value: mockEthereum,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>{children}</WalletProvider>
  </QueryClientProvider>
);

describe("useWallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with disconnected state", () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    expect(result.current.isWalletConnected).toBe(false);
    expect(result.current.walletAddress).toBeNull();
  });

  it("should connect wallet when connectWallet is called", async () => {
    mockEthereum.request.mockResolvedValue(["0x1234567890123456789012345678901234567890"]);

    const { result } = renderHook(() => useWallet(), { wrapper });

    await result.current.connectWallet();

    await waitFor(() => {
      expect(result.current.isWalletConnected).toBe(true);
    });
  });

  it("should disconnect wallet when disconnectWallet is called", async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    // First connect
    mockEthereum.request.mockResolvedValue(["0x1234567890123456789012345678901234567890"]);
    await result.current.connectWallet();

    // Then disconnect
    await result.current.disconnectWallet();

    expect(result.current.isWalletConnected).toBe(false);
    expect(result.current.walletAddress).toBeNull();
  });
});

