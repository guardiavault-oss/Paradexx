/**
 * Legacy Messages Component Tests
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LegacyMessages from '@/pages/LegacyMessages';
import { BrowserRouter } from 'wouter';
import { WalletProvider } from '@/hooks/useWallet';

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: [],
  }),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock wouter
vi.mock('wouter', async () => {
  const actual = await vi.importActual('wouter');
  return {
    ...actual,
    BrowserRouter: ({ children }: any) => <div>{children}</div>,
    useLocation: () => ['/', vi.fn()],
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <WalletProvider>
        {children}
      </WalletProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

describe('LegacyMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no vaults', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ vaults: [] }),
    });

    render(<LegacyMessages />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText(/create a vault first/i)).toBeInTheDocument();
    });
  });

  it('should display vault selector when vaults exist', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        vaults: [{ id: 'vault-1', name: 'My Vault' }],
      }),
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [] }),
    });

    render(<LegacyMessages />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText(/select vault/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

