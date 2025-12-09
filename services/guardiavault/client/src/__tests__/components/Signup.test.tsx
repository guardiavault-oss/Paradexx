/**
 * Comprehensive Test Suite for Signup Component
 * Tests payment verification, form validation, terms acceptance, and account creation
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/setup/test-utils';
import Signup from '@/pages/Signup';

// Mock dependencies
const mockSetLocation = vi.fn();
const mockToast = vi.fn();

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

// Mock fetch
global.fetch = vi.fn();

describe('Signup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful payment verification
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete (window.location as any).search;
  });

  describe('Payment Verification', () => {
    it('shows loading state while verifying payment', () => {
      // Set up URL with session_id
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          search: '?session_id=test_session&plan=Pro&months=6',
        },
      });

      renderWithProviders(<Signup />);

      expect(screen.getByText(/verifying payment/i)).toBeInTheDocument();
      expect(screen.getByText(/please wait a moment/i)).toBeInTheDocument();
    });

    it('redirects to home if no payment session found', async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          search: '',
        },
      });

      renderWithProviders(<Signup />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'No Payment Found',
          })
        );
        expect(mockSetLocation).toHaveBeenCalledWith('/');
      });
    });

    it('displays payment success message after verification', async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          search: '?session_id=test_session&plan=Pro&months=6',
        },
      });

      renderWithProviders(<Signup />);

      await waitFor(() => {
        expect(screen.getByText(/payment successful/i)).toBeInTheDocument();
        expect(screen.getByText(/pro plan/i)).toBeInTheDocument();
        expect(screen.getByText(/6 months/i)).toBeInTheDocument();
      });
    });
  });

  describe('Rendering', () => {
    beforeEach(async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          search: '?session_id=test_session&plan=Pro&months=6',
        },
      });

      renderWithProviders(<Signup />);
      await waitFor(() => {
        expect(screen.queryByText(/verifying payment/i)).not.toBeInTheDocument();
      });
    });

    it('renders signup form with all required fields', () => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/create password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('renders terms and conditions checkbox', () => {
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(screen.getByText(/i have read and agree to the/i)).toBeInTheDocument();
    });

    it('renders link to login page', () => {
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByText(/login here/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          search: '?session_id=test_session&plan=Pro&months=6',
        },
      });

      renderWithProviders(<Signup />);
      await waitFor(() => {
        expect(screen.queryByText(/verifying payment/i)).not.toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toBeInvalid();
      });
    });

    it('validates password minimum length', async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByLabelText(/create password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(passwordInput, 'short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Password Too Short',
          })
        );
      });
    });

    it('validates password confirmation match', async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByLabelText(/create password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const checkbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'DifferentPassword123!');
      await user.click(checkbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Passwords Don't Match",
          })
        );
      });
    });

    it('requires terms acceptance before submission', async () => {
      const user = userEvent.setup();
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/create password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Terms Required',
          })
        );
      });
    });
  });

  describe('User Interactions', () => {
    beforeEach(async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          search: '?session_id=test_session&plan=Pro&months=6',
        },
      });

      renderWithProviders(<Signup />);
      await waitFor(() => {
        expect(screen.queryByText(/verifying payment/i)).not.toBeInTheDocument();
      });
    });

    it('allows user to toggle terms checkbox', async () => {
      const user = userEvent.setup();
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

      expect(checkbox.checked).toBe(false);
      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });

    it('opens terms and conditions dialog', async () => {
      const user = userEvent.setup();
      const termsLink = screen.getByText(/terms & conditions/i);

      await user.click(termsLink);

      await waitFor(() => {
        expect(screen.getByText(/terms & conditions/i)).toBeInTheDocument();
        expect(screen.getByText(/acceptance of terms/i)).toBeInTheDocument();
        expect(screen.getByText(/no custody/i)).toBeInTheDocument();
      });
    });

    it('navigates to login page when login link is clicked', async () => {
      const user = userEvent.setup();
      const loginLink = screen.getByText(/login here/i);

      await user.click(loginLink);

      expect(mockSetLocation).toHaveBeenCalledWith('/login');
    });
  });

  describe('Account Creation', () => {
    beforeEach(async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          search: '?session_id=test_session&plan=Pro&months=6',
        },
      });
    });

    it('submits form with valid data and payment session', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '1', email: 'test@example.com' } }),
      });

      renderWithProviders(<Signup />);
      await waitFor(() => {
        expect(screen.queryByText(/verifying payment/i)).not.toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/create password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const checkbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Password123!');
      await user.click(checkbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/register',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'Password123!',
              stripeSessionId: 'test_session',
              plan: 'Pro',
              months: '6',
            }),
          })
        );
      });
    });

    it('shows success message and redirects on successful signup', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '1', email: 'test@example.com' } }),
      });

      renderWithProviders(<Signup />);
      await waitFor(() => {
        expect(screen.queryByText(/verifying payment/i)).not.toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/create password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const checkbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Password123!');
      await user.click(checkbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Account Created! 🎉',
          })
        );
      });

      // Wait for redirect
      await waitFor(() => {
        expect(mockSetLocation).toHaveBeenCalledWith('/dashboard');
      }, { timeout: 1500 });
    });

    it('handles signup failure gracefully', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      }).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Email already exists' }),
      });

      renderWithProviders(<Signup />);
      await waitFor(() => {
        expect(screen.queryByText(/verifying payment/i)).not.toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/create password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const checkbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Password123!');
      await user.click(checkbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Signup Failed',
            variant: 'destructive',
          })
        );
      });
    });

    it('handles network errors', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      }).mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<Signup />);
      await waitFor(() => {
        expect(screen.queryByText(/verifying payment/i)).not.toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/create password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const checkbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Password123!');
      await user.click(checkbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Signup Failed',
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('Loading States', () => {
    beforeEach(async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          search: '?session_id=test_session&plan=Pro&months=6',
        },
      });
    });

    it('disables submit button while creating account', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      }).mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(<Signup />);
      await waitFor(() => {
        expect(screen.queryByText(/verifying payment/i)).not.toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/create password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const checkbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Password123!');
      await user.click(checkbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          search: '?session_id=test_session&plan=Pro&months=6',
        },
      });

      renderWithProviders(<Signup />);
      await waitFor(() => {
        expect(screen.queryByText(/verifying payment/i)).not.toBeInTheDocument();
      });
    });

    it('handles empty form submission', async () => {
      const user = userEvent.setup();
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Terms Required',
          })
        );
      });
    });

    it('handles very long email addresses', async () => {
      const user = userEvent.setup();
      const emailInput = screen.getByLabelText(/email address/i);
      const longEmail = 'a'.repeat(100) + '@example.com';

      await user.type(emailInput, longEmail);

      // Email validation should still work
      expect(emailInput).toHaveValue(longEmail);
    });
  });
});

