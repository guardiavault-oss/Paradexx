/**
 * Comprehensive Test Suite for SetupRecovery Component
 * Tests multi-step recovery flow, form validation, encryption, and recovery setup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/setup/test-utils';
import SetupRecovery from '@/pages/SetupRecovery';

// Mock dependencies
const mockSetLocation = vi.fn();
const mockToast = vi.fn();
const mockCreateRecovery = vi.fn();
const mockEncryptSeedPhrase = vi.fn();
const mockGenerateEncryptionPassword = vi.fn();

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

// Mock useWallet hook
vi.mock('@/hooks/useWallet', () => ({
  useWallet: () => ({
    walletAddress: '0x1234567890123456789012345678901234567890',
  }),
}));

// Mock useMultiSigRecovery hook
vi.mock('@/hooks/useMultiSigRecovery', () => ({
  useMultiSigRecovery: () => ({
    createRecovery: mockCreateRecovery,
    loading: false,
  }),
}));

// Mock encryption functions
vi.mock('@/lib/encryption', () => ({
  encryptSeedPhrase: mockEncryptSeedPhrase,
  generateEncryptionPassword: mockGenerateEncryptionPassword,
}));

// Mock fetch
global.fetch = vi.fn();

describe('SetupRecovery Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateRecovery.mockResolvedValue({ recoveryId: '1' });
    mockEncryptSeedPhrase.mockResolvedValue('encrypted_data');
    mockGenerateEncryptionPassword.mockReturnValue('encryption_password');
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        recoveryId: 'db_recovery_id',
        recoveryKeyAddresses: [
          '0x1111111111111111111111111111111111111111',
          '0x2222222222222222222222222222222222222222',
          '0x3333333333333333333333333333333333333333',
        ],
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders recovery setup page with all sections', () => {
      renderWithProviders(<SetupRecovery />);

      expect(screen.getByText(/setup wallet recovery/i)).toBeInTheDocument();
      expect(screen.getByText(/protect your wallet/i)).toBeInTheDocument();
      expect(screen.getByText(/back to dashboard/i)).toBeInTheDocument();
    });

    it('shows step 1: wallet address on initial render', () => {
      renderWithProviders(<SetupRecovery />);

      expect(screen.getByText(/wallet address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/wallet address/i)).toBeInTheDocument();
      expect(screen.getByText(/next: recovery keys/i)).toBeInTheDocument();
    });

    it('displays progress indicator', () => {
      renderWithProviders(<SetupRecovery />);

      // Progress bar should be visible
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    it('navigates from step 1 to step 2', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SetupRecovery />);

      const walletInput = screen.getByLabelText(/wallet address/i);
      const nextButton = screen.getByText(/next: recovery keys/i);

      await user.type(walletInput, '0x1234567890123456789012345678901234567890');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/recovery keys/i)).toBeInTheDocument();
        expect(screen.getByText(/choose 3 trusted people/i)).toBeInTheDocument();
      });
    });

    it('navigates from step 2 to step 3', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SetupRecovery />);

      // Navigate to step 2
      const walletInput = screen.getByLabelText(/wallet address/i);
      await user.type(walletInput, '0x1234567890123456789012345678901234567890');
      await user.click(screen.getByText(/next: recovery keys/i));

      await waitFor(() => {
        expect(screen.getByText(/recovery keys/i)).toBeInTheDocument();
      });

      // Fill recovery keys
      const nameInputs = screen.getAllByPlaceholderText(/john doe/i);
      const emailInputs = screen.getAllByPlaceholderText(/john@example.com/i);

      await user.type(nameInputs[0], 'John Doe');
      await user.type(emailInputs[0], 'john@example.com');
      await user.type(nameInputs[1], 'Jane Smith');
      await user.type(emailInputs[1], 'jane@example.com');
      await user.type(nameInputs[2], 'Bob Johnson');
      await user.type(emailInputs[2], 'bob@example.com');

      // Navigate to step 3
      await user.click(screen.getByText(/next: seed phrase/i));

      await waitFor(() => {
        expect(screen.getByText(/seed phrase/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/word1 word2 word3/i)).toBeInTheDocument();
      });
    });

    it('navigates from step 3 to step 4 (review)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SetupRecovery />);

      // Navigate through steps
      const walletInput = screen.getByLabelText(/wallet address/i);
      await user.type(walletInput, '0x1234567890123456789012345678901234567890');
      await user.click(screen.getByText(/next: recovery keys/i));

      await waitFor(() => {
        expect(screen.getByText(/recovery keys/i)).toBeInTheDocument();
      });

      const nameInputs = screen.getAllByPlaceholderText(/john doe/i);
      const emailInputs = screen.getAllByPlaceholderText(/john@example.com/i);

      await user.type(nameInputs[0], 'John Doe');
      await user.type(emailInputs[0], 'john@example.com');
      await user.type(nameInputs[1], 'Jane Smith');
      await user.type(emailInputs[1], 'jane@example.com');
      await user.type(nameInputs[2], 'Bob Johnson');
      await user.type(emailInputs[2], 'bob@example.com');

      await user.click(screen.getByText(/next: seed phrase/i));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/word1 word2 word3/i)).toBeInTheDocument();
      });

      const seedPhraseInput = screen.getByPlaceholderText(/word1 word2 word3/i);
      await user.type(seedPhraseInput, 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12');

      await user.click(screen.getByText(/next: review/i));

      await waitFor(() => {
        expect(screen.getByText(/review & submit/i)).toBeInTheDocument();
        expect(screen.getByText(/0x1234567890123456789012345678901234567890/i)).toBeInTheDocument();
      });
    });

    it('allows going back to previous steps', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SetupRecovery />);

      // Navigate to step 2
      const walletInput = screen.getByLabelText(/wallet address/i);
      await user.type(walletInput, '0x1234567890123456789012345678901234567890');
      await user.click(screen.getByText(/next: recovery keys/i));

      await waitFor(() => {
        expect(screen.getByText(/recovery keys/i)).toBeInTheDocument();
      });

      // Go back to step 1
      const backButton = screen.getByText(/back/i);
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.getByText(/wallet address/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('validates wallet address format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SetupRecovery />);

      const walletInput = screen.getByLabelText(/wallet address/i);
      const nextButton = screen.getByText(/next: recovery keys/i);

      await user.type(walletInput, 'invalid-address');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid ethereum address format/i)).toBeInTheDocument();
      });
    });

    it('validates wallet address length', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SetupRecovery />);

      const walletInput = screen.getByLabelText(/wallet address/i);
      const nextButton = screen.getByText(/next: recovery keys/i);

      await user.type(walletInput, '0x123');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid wallet address/i)).toBeInTheDocument();
      });
    });

    it('validates recovery key email format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SetupRecovery />);

      // Navigate to step 2
      const walletInput = screen.getByLabelText(/wallet address/i);
      await user.type(walletInput, '0x1234567890123456789012345678901234567890');
      await user.click(screen.getByText(/next: recovery keys/i));

      await waitFor(() => {
        expect(screen.getByText(/recovery keys/i)).toBeInTheDocument();
      });

      const emailInputs = screen.getAllByPlaceholderText(/john@example.com/i);
      await user.type(emailInputs[0], 'invalid-email');

      // Try to proceed
      await user.click(screen.getByText(/next: seed phrase/i));

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it('validates recovery key name length', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SetupRecovery />);

      // Navigate to step 2
      const walletInput = screen.getByLabelText(/wallet address/i);
      await user.type(walletInput, '0x1234567890123456789012345678901234567890');
      await user.click(screen.getByText(/next: recovery keys/i));

      await waitFor(() => {
        expect(screen.getByText(/recovery keys/i)).toBeInTheDocument();
      });

      const nameInputs = screen.getAllByPlaceholderText(/john doe/i);
      await user.type(nameInputs[0], 'A'); // Too short

      await user.click(screen.getByText(/next: seed phrase/i));

      await waitFor(() => {
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('validates seed phrase minimum length', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SetupRecovery />);

      // Navigate to step 3
      const walletInput = screen.getByLabelText(/wallet address/i);
      await user.type(walletInput, '0x1234567890123456789012345678901234567890');
      await user.click(screen.getByText(/next: recovery keys/i));

      await waitFor(() => {
        expect(screen.getByText(/recovery keys/i)).toBeInTheDocument();
      });

      const nameInputs = screen.getAllByPlaceholderText(/john doe/i);
      const emailInputs = screen.getAllByPlaceholderText(/john@example.com/i);

      await user.type(nameInputs[0], 'John Doe');
      await user.type(emailInputs[0], 'john@example.com');
      await user.type(nameInputs[1], 'Jane Smith');
      await user.type(emailInputs[1], 'jane@example.com');
      await user.type(nameInputs[2], 'Bob Johnson');
      await user.type(emailInputs[2], 'bob@example.com');

      await user.click(screen.getByText(/next: seed phrase/i));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/word1 word2 word3/i)).toBeInTheDocument();
      });

      const seedPhraseInput = screen.getByPlaceholderText(/word1 word2 word3/i);
      await user.type(seedPhraseInput, 'word1 word2'); // Too short

      await user.click(screen.getByText(/next: review/i));

      await waitFor(() => {
        expect(screen.getByText(/seed phrase must be at least 12 words/i)).toBeInTheDocument();
      });
    });

    it('requires exactly 3 recovery keys', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SetupRecovery />);

      // Navigate to step 2
      const walletInput = screen.getByLabelText(/wallet address/i);
      await user.type(walletInput, '0x1234567890123456789012345678901234567890');
      await user.click(screen.getByText(/next: recovery keys/i));

      await waitFor(() => {
        expect(screen.getAllByText(/recovery key/i)).toHaveLength(3);
      });
    });
  });

  describe('Recovery Setup Flow', () => {
    it('completes full recovery setup flow', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SetupRecovery />);

      // Step 1: Enter wallet address
      const walletInput = screen.getByLabelText(/wallet address/i);
      await user.type(walletInput, '0x1234567890123456789012345678901234567890');
      await user.click(screen.getByText(/next: recovery keys/i));

      // Step 2: Enter recovery keys
      await waitFor(() => {
        expect(screen.getByText(/recovery keys/i)).toBeInTheDocument();
      });

      const nameInputs = screen.getAllByPlaceholderText(/john doe/i);
      const emailInputs = screen.getAllByPlaceholderText(/john@example.com/i);

      await user.type(nameInputs[0], 'John Doe');
      await user.type(emailInputs[0], 'john@example.com');
      await user.type(nameInputs[1], 'Jane Smith');
      await user.type(emailInputs[1], 'jane@example.com');
      await user.type(nameInputs[2], 'Bob Johnson');
      await user.type(emailInputs[2], 'bob@example.com');

      await user.click(screen.getByText(/next: seed phrase/i));

      // Step 3: Enter seed phrase
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/word1 word2 word3/i)).toBeInTheDocument();
      });

      const seedPhrase = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';
      const seedPhraseInput = screen.getByPlaceholderText(/word1 word2 word3/i);
      await user.type(seedPhraseInput, seedPhrase);

      await user.click(screen.getByText(/next: review/i));

      // Step 4: Review and submit
      await waitFor(() => {
        expect(screen.getByText(/review & submit/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /setup recovery/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockGenerateEncryptionPassword).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890');
        expect(mockEncryptSeedPhrase).toHaveBeenCalledWith(seedPhrase, 'encryption_password');
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/recovery/create',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });

      await waitFor(() => {
        expect(mockCreateRecovery).toHaveBeenCalled();
      });
    });

    it('handles recovery setup success', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SetupRecovery />);

      // Complete all steps
      const walletInput = screen.getByLabelText(/wallet address/i);
      await user.type(walletInput, '0x1234567890123456789012345678901234567890');
      await user.click(screen.getByText(/next: recovery keys/i));

      await waitFor(() => {
        expect(screen.getByText(/recovery keys/i)).toBeInTheDocument();
      });

      const nameInputs = screen.getAllByPlaceholderText(/john doe/i);
      const emailInputs = screen.getAllByPlaceholderText(/john@example.com/i);

      await user.type(nameInputs[0], 'John Doe');
      await user.type(emailInputs[0], 'john@example.com');
      await user.type(nameInputs[1], 'Jane Smith');
      await user.type(emailInputs[1], 'jane@example.com');
      await user.type(nameInputs[2], 'Bob Johnson');
      await user.type(emailInputs[2], 'bob@example.com');

      await user.click(screen.getByText(/next: seed phrase/i));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/word1 word2 word3/i)).toBeInTheDocument();
      });

      const seedPhraseInput = screen.getByPlaceholderText(/word1 word2 word3/i);
      await user.type(seedPhraseInput, 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12');

      await user.click(screen.getByText(/next: review/i));

      await waitFor(() => {
        expect(screen.getByText(/review & submit/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /setup recovery/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Recovery Setup Complete!',
          })
        );
      });

      await waitFor(() => {
        expect(mockSetLocation).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('handles recovery setup errors', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to create recovery setup' }),
      });

      renderWithProviders(<SetupRecovery />);

      // Complete all steps
      const walletInput = screen.getByLabelText(/wallet address/i);
      await user.type(walletInput, '0x1234567890123456789012345678901234567890');
      await user.click(screen.getByText(/next: recovery keys/i));

      await waitFor(() => {
        expect(screen.getByText(/recovery keys/i)).toBeInTheDocument();
      });

      const nameInputs = screen.getAllByPlaceholderText(/john doe/i);
      const emailInputs = screen.getAllByPlaceholderText(/john@example.com/i);

      await user.type(nameInputs[0], 'John Doe');
      await user.type(emailInputs[0], 'john@example.com');
      await user.type(nameInputs[1], 'Jane Smith');
      await user.type(emailInputs[1], 'jane@example.com');
      await user.type(nameInputs[2], 'Bob Johnson');
      await user.type(emailInputs[2], 'bob@example.com');

      await user.click(screen.getByText(/next: seed phrase/i));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/word1 word2 word3/i)).toBeInTheDocument();
      });

      const seedPhraseInput = screen.getByPlaceholderText(/word1 word2 word3/i);
      await user.type(seedPhraseInput, 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12');

      await user.click(screen.getByText(/next: review/i));

      await waitFor(() => {
        expect(screen.getByText(/review & submit/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /setup recovery/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('Navigation', () => {
    it('navigates back to dashboard when back button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SetupRecovery />);

      const backButton = screen.getByText(/back to dashboard/i);
      await user.click(backButton);

      expect(mockSetLocation).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty wallet address', () => {
      renderWithProviders(<SetupRecovery />);

      const nextButton = screen.getByText(/next: recovery keys/i);
      expect(nextButton).toBeDisabled();
    });

    it('handles incomplete recovery keys', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SetupRecovery />);

      const walletInput = screen.getByLabelText(/wallet address/i);
      await user.type(walletInput, '0x1234567890123456789012345678901234567890');
      await user.click(screen.getByText(/next: recovery keys/i));

      await waitFor(() => {
        expect(screen.getByText(/recovery keys/i)).toBeInTheDocument();
      });

      const nextButton = screen.getByText(/next: seed phrase/i);
      expect(nextButton).toBeDisabled();
    });
  });
});

