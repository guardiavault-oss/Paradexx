/**
 * Comprehensive Test Suite for CreateVault Component
 * Tests wallet connection, deposit validation, vault creation, and navigation
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/setup/test-utils';
import CreateVault from '@/pages/CreateVault';

// Mock dependencies
const mockConnectWallet = vi.fn();
const mockSetLocation = vi.fn();
const mockToast = vi.fn();

// Create a mock implementation
const mockUseWallet = vi.fn(() => ({
  walletAddress: null,
  isWalletConnected: false,
  connectWallet: mockConnectWallet,
}));

// Mock useWallet hook
vi.mock('@/hooks/useWallet', () => ({
  useWallet: () => mockUseWallet(),
}));

// Mock wouter router
vi.mock('wouter', () => ({
  useLocation: () => ['', mockSetLocation],
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock Navigation component
vi.mock('@/components/Navigation', () => ({
  default: () => <nav data-testid="navigation">Navigation</nav>,
}));

describe('CreateVault Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnectWallet.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders create vault page with all sections', () => {
      renderWithProviders(<CreateVault />);

      expect(screen.getByText(/create your guardiavault/i)).toBeInTheDocument();
      expect(screen.getByText(/initial deposit/i)).toBeInTheDocument();
      expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
    });

    it('displays vault features', () => {
      renderWithProviders(<CreateVault />);

      expect(screen.getByText(/5-8% apy on deposited assets/i)).toBeInTheDocument();
      expect(screen.getByText(/free inheritance protection/i)).toBeInTheDocument();
      expect(screen.getByText(/multi-signature recovery system/i)).toBeInTheDocument();
      expect(screen.getByText(/biometric check-in security/i)).toBeInTheDocument();
    });

    it('shows wallet connection prompt when wallet is not connected', () => {
      renderWithProviders(<CreateVault />);

      expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument();
      expect(screen.getByText(/connect your wallet to create a guardiavault/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/deposit amount/i)).not.toBeInTheDocument();
    });
  });

  describe('Wallet Connection', () => {
    it('calls connectWallet when connect button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CreateVault />);

      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      expect(mockConnectWallet).toHaveBeenCalled();
    });

    it('displays connected wallet address when wallet is connected', () => {
      mockUseWallet.mockReturnValue({
        walletAddress: '0x1234567890123456789012345678901234567890',
        isWalletConnected: true,
        connectWallet: mockConnectWallet,
      } as any);

      renderWithProviders(<CreateVault />);

      expect(screen.getByText(/connected wallet/i)).toBeInTheDocument();
      expect(screen.getByText(/0x1234...7890/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/deposit amount/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        walletAddress: '0x1234567890123456789012345678901234567890',
        isWalletConnected: true,
        connectWallet: mockConnectWallet,
      } as any);
    });

    it('validates amount is required', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CreateVault />);

      const createButton = screen.getByRole('button', { name: /create vault/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Invalid amount',
          })
        );
      });
    });

    it('validates amount is greater than zero', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CreateVault />);

      const amountInput = screen.getByLabelText(/deposit amount/i);
      const createButton = screen.getByRole('button', { name: /create vault/i });

      await user.type(amountInput, '0');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Invalid amount',
          })
        );
      });
    });

    it('validates amount is positive', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CreateVault />);

      const amountInput = screen.getByLabelText(/deposit amount/i);
      const createButton = screen.getByRole('button', { name: /create vault/i });

      await user.type(amountInput, '-1');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Invalid amount',
          })
        );
      });
    });

    it('accepts valid deposit amounts', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CreateVault />);

      const amountInput = screen.getByLabelText(/deposit amount/i) as HTMLInputElement;

      await user.type(amountInput, '0.5');

      expect(amountInput.value).toBe('0.5');
    });
  });

  describe('Vault Creation', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        walletAddress: '0x1234567890123456789012345678901234567890',
        isWalletConnected: true,
        connectWallet: mockConnectWallet,
      } as any);
    });

    it('creates vault with valid amount', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CreateVault />);

      const amountInput = screen.getByLabelText(/deposit amount/i);
      const createButton = screen.getByRole('button', { name: /create vault/i });

      await user.type(amountInput, '1.5');
      await user.click(createButton);

      // Wait for vault creation (simulated delay)
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Vault created successfully',
          })
        );
      }, { timeout: 2500 });

      // Should redirect to setup recovery
      await waitFor(() => {
        expect(mockSetLocation).toHaveBeenCalledWith('/setup-recovery');
      }, { timeout: 2500 });
    });

    it('shows loading state during vault creation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CreateVault />);

      const amountInput = screen.getByLabelText(/deposit amount/i);
      const createButton = screen.getByRole('button', { name: /create vault/i });

      await user.type(amountInput, '1.0');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/creating vault/i)).toBeInTheDocument();
        expect(createButton).toBeDisabled();
      });
    });

    it('handles vault creation errors', async () => {
      const user = userEvent.setup();
      // Mock an error in the vault creation process
      const originalSetTimeout = setTimeout;
      vi.spyOn(global, 'setTimeout').mockImplementationOnce((fn: any) => {
        return originalSetTimeout(() => {
          throw new Error('Vault creation failed');
        }, 0) as any;
      });

      renderWithProviders(<CreateVault />);

      const amountInput = screen.getByLabelText(/deposit amount/i);
      const createButton = screen.getByRole('button', { name: /create vault/i });

      await user.type(amountInput, '1.0');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Failed to create vault',
            variant: 'destructive',
          })
        );
      }, { timeout: 2500 });
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        walletAddress: '0x1234567890123456789012345678901234567890',
        isWalletConnected: true,
        connectWallet: mockConnectWallet,
      } as any);
    });

    it('allows user to input deposit amount', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CreateVault />);

      const amountInput = screen.getByLabelText(/deposit amount/i) as HTMLInputElement;

      await user.type(amountInput, '2.5');

      expect(amountInput.value).toBe('2.5');
    });

    it('disables create button when amount is invalid', () => {
      renderWithProviders(<CreateVault />);

      const createButton = screen.getByRole('button', { name: /create vault/i });

      expect(createButton).toBeDisabled();
    });

    it('enables create button when amount is valid', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CreateVault />);

      const amountInput = screen.getByLabelText(/deposit amount/i);
      const createButton = screen.getByRole('button', { name: /create vault/i });

      await user.type(amountInput, '0.5');

      await waitFor(() => {
        expect(createButton).not.toBeDisabled();
      });
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        walletAddress: '0x1234567890123456789012345678901234567890',
        isWalletConnected: true,
        connectWallet: mockConnectWallet,
      } as any);
    });

    it('handles very small deposit amounts', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CreateVault />);

      const amountInput = screen.getByLabelText(/deposit amount/i) as HTMLInputElement;

      await user.type(amountInput, '0.01');

      expect(amountInput.value).toBe('0.01');
    });

    it('handles very large deposit amounts', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CreateVault />);

      const amountInput = screen.getByLabelText(/deposit amount/i) as HTMLInputElement;

      await user.type(amountInput, '1000');

      expect(amountInput.value).toBe('1000');
    });

    it('handles decimal precision', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CreateVault />);

      const amountInput = screen.getByLabelText(/deposit amount/i) as HTMLInputElement;

      await user.type(amountInput, '0.123456789');

      expect(amountInput.value).toBe('0.123456789');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      mockUseWallet.mockReturnValue({
        walletAddress: '0x1234567890123456789012345678901234567890',
        isWalletConnected: true,
        connectWallet: mockConnectWallet,
      } as any);

      renderWithProviders(<CreateVault />);

      expect(screen.getByLabelText(/deposit amount/i)).toBeInTheDocument();
    });

    it('has proper button roles', () => {
      renderWithProviders(<CreateVault />);

      expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
    });
  });
});

