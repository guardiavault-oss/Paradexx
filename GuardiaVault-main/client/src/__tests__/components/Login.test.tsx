/**
 * Comprehensive Test Suite for Login Component
 * Tests all critical user flows, form validation, error handling, and edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/setup/test-utils';
import Login from '@/pages/Login';

// Mock dependencies
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockSetLocation = vi.fn();
const mockToast = vi.fn();

// Mock useWallet hook
vi.mock('@/hooks/useWallet', () => ({
  useWallet: () => ({
    isAuthenticated: false,
    isConnecting: false,
    login: mockLogin,
    register: mockRegister,
  }),
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

// Mock WebAuthn functions
const mockCheckWebAuthnAvailable = vi.fn();
const mockAuthenticateWithWebAuthnForLogin = vi.fn();
const mockIsWebAuthnSupported = vi.fn(() => false);
const mockIsMobileDevice = vi.fn(() => false);
const mockGetBiometricTypeName = vi.fn(() => 'Biometric');

vi.mock('@/lib/webauthn-login', () => ({
  checkWebAuthnAvailable: mockCheckWebAuthnAvailable,
  authenticateWithWebAuthnForLogin: mockAuthenticateWithWebAuthnForLogin,
  isWebAuthnSupported: mockIsWebAuthnSupported,
  isMobileDevice: mockIsMobileDevice,
  getBiometricTypeName: mockGetBiometricTypeName,
}));

// Mock window.ethereum
Object.defineProperty(window, 'ethereum', {
  writable: true,
  value: undefined,
});

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
    mockRegister.mockResolvedValue(undefined);
    mockCheckWebAuthnAvailable.mockResolvedValue(false);
    mockAuthenticateWithWebAuthnForLogin.mockResolvedValue({
      success: false,
      error: 'Not available',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders login form with all required elements', () => {
      renderWithProviders(<Login />);

      expect(screen.getByTestId('text-login-subtitle')).toBeInTheDocument();
      expect(screen.getByTestId('tab-login')).toBeInTheDocument();
      expect(screen.getByTestId('tab-signup')).toBeInTheDocument();
      expect(screen.getByTestId('input-login-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-login-password')).toBeInTheDocument();
      expect(screen.getByTestId('button-login-submit')).toBeInTheDocument();
      expect(screen.getByTestId('button-back-to-home')).toBeInTheDocument();
    });

    it('renders signup form when signup tab is active', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const signupTab = screen.getByTestId('tab-signup');
      await user.click(signupTab);

      expect(screen.getByTestId('input-signup-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-signup-password')).toBeInTheDocument();
      expect(screen.getByTestId('input-signup-confirm-password')).toBeInTheDocument();
      expect(screen.getByTestId('button-signup-submit')).toBeInTheDocument();
    });

    it('shows social login buttons', () => {
      renderWithProviders(<Login />);

      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
    });

    it('renders trust signals at the bottom', () => {
      renderWithProviders(<Login />);

      expect(screen.getByText(/256-bit encryption/i)).toBeInTheDocument();
      expect(screen.getByText(/non-custodial/i)).toBeInTheDocument();
      expect(screen.getByText(/gdpr compliant/i)).toBeInTheDocument();
    });

    it('renders password visibility toggle buttons', () => {
      renderWithProviders(<Login />);

      expect(screen.getByTestId('button-toggle-login-password')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates email format on login', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const emailInput = screen.getByTestId('input-login-email');
      const submitButton = screen.getByTestId('button-login-submit');

      // Invalid email
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });

      // Valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/invalid email address/i)).not.toBeInTheDocument();
      });
    });

    it('validates password minimum length on login', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const emailInput = screen.getByTestId('input-login-email');
      const passwordInput = screen.getByTestId('input-login-password');
      const submitButton = screen.getByTestId('button-login-submit');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('validates email format on signup', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const signupTab = screen.getByTestId('tab-signup');
      await user.click(signupTab);

      const emailInput = screen.getByTestId('input-signup-email');
      const submitButton = screen.getByTestId('button-signup-submit');

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it('validates password confirmation matches on signup', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const signupTab = screen.getByTestId('tab-signup');
      await user.click(signupTab);

      const emailInput = screen.getByTestId('input-signup-email');
      const passwordInput = screen.getByTestId('input-signup-password');
      const confirmPasswordInput = screen.getByTestId('input-signup-confirm-password');
      const submitButton = screen.getByTestId('button-signup-submit');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'DifferentPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
    });

    it('validates password minimum length on signup', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const signupTab = screen.getByTestId('tab-signup');
      await user.click(signupTab);

      const emailInput = screen.getByTestId('input-signup-email');
      const passwordInput = screen.getByTestId('input-signup-password');
      const confirmPasswordInput = screen.getByTestId('input-signup-confirm-password');
      const submitButton = screen.getByTestId('button-signup-submit');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'short');
      await user.type(confirmPasswordInput, 'short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('toggles password visibility on login', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const passwordInput = screen.getByTestId('input-login-password') as HTMLInputElement;
      const toggleButton = screen.getByTestId('button-toggle-login-password');

      // Password should be hidden by default
      expect(passwordInput.type).toBe('password');

      // Click toggle to show password
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('text');

      // Click toggle to hide password again
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });

    it('toggles password visibility on signup', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const signupTab = screen.getByTestId('tab-signup');
      await user.click(signupTab);

      const passwordInput = screen.getByTestId('input-signup-password') as HTMLInputElement;
      const toggleButton = screen.getByTestId('button-toggle-signup-password');

      expect(passwordInput.type).toBe('password');
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('text');
    });

    it('toggles confirm password visibility on signup', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const signupTab = screen.getByTestId('tab-signup');
      await user.click(signupTab);

      const confirmPasswordInput = screen.getByTestId('input-signup-confirm-password') as HTMLInputElement;
      const toggleButton = screen.getByTestId('button-toggle-confirm-password');

      expect(confirmPasswordInput.type).toBe('password');
      await user.click(toggleButton);
      expect(confirmPasswordInput.type).toBe('text');
    });

    it('switches between login and signup tabs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      // Initially on login tab
      expect(screen.getByTestId('input-login-email')).toBeInTheDocument();

      // Switch to signup
      const signupTab = screen.getByTestId('tab-signup');
      await user.click(signupTab);
      expect(screen.getByTestId('input-signup-email')).toBeInTheDocument();

      // Switch back to login
      const loginTab = screen.getByTestId('tab-login');
      await user.click(loginTab);
      expect(screen.getByTestId('input-login-email')).toBeInTheDocument();
    });

    it('navigates back to home when back button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const backButton = screen.getByTestId('button-back-to-home');
      await user.click(backButton);

      expect(mockSetLocation).toHaveBeenCalledWith('/');
    });
  });

  describe('Login Flow', () => {
    it('submits login form with valid credentials', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(undefined);
      renderWithProviders(<Login />);

      const emailInput = screen.getByTestId('input-login-email');
      const passwordInput = screen.getByTestId('input-login-password');
      const submitButton = screen.getByTestId('button-login-submit');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          'test@example.com',
          'Password123!',
          undefined,
          undefined
        );
      });
    });

    it('shows error for invalid credentials', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid email or password';
      mockLogin.mockRejectedValue(new Error(errorMessage));
      renderWithProviders(<Login />);

      const emailInput = screen.getByTestId('input-login-email');
      const passwordInput = screen.getByTestId('input-login-password');
      const submitButton = screen.getByTestId('button-login-submit');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'WrongPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('handles 2FA requirement', async () => {
      const user = userEvent.setup();
      const error: any = new Error('2FA required');
      error.requires2FA = true;
      mockLogin.mockRejectedValue(error);
      renderWithProviders(<Login />);

      const emailInput = screen.getByTestId('input-login-email');
      const passwordInput = screen.getByTestId('input-login-password');
      const submitButton = screen.getByTestId('button-login-submit');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication code/i)).toBeInTheDocument();
      });
    });

    it('submits 2FA code when provided', async () => {
      const user = userEvent.setup();
      const error: any = new Error('2FA required');
      error.requires2FA = true;
      mockLogin
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);
      renderWithProviders(<Login />);

      const emailInput = screen.getByTestId('input-login-email');
      const passwordInput = screen.getByTestId('input-login-password');
      const submitButton = screen.getByTestId('button-login-submit');

      // First attempt - triggers 2FA
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication code/i)).toBeInTheDocument();
      });

      // Enter TOTP code
      const totpInputs = screen.getAllByRole('textbox');
      const totpInput = totpInputs.find((input) => 
        input.getAttribute('aria-label')?.includes('OTP') || 
        input.closest('[class*="input-otp"]')
      );

      if (totpInput) {
        await user.type(totpInput, '123456');
      }

      // Submit again with 2FA code
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(2);
      });
    });

    it('switches between TOTP and backup code', async () => {
      const user = userEvent.setup();
      const error: any = new Error('2FA required');
      error.requires2FA = true;
      mockLogin.mockRejectedValue(error);
      renderWithProviders(<Login />);

      const emailInput = screen.getByTestId('input-login-email');
      const passwordInput = screen.getByTestId('input-login-password');
      const submitButton = screen.getByTestId('button-login-submit');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication code/i)).toBeInTheDocument();
      });

      // Switch to backup code
      const useBackupCodeButton = screen.getByText(/use backup code instead/i);
      await user.click(useBackupCodeButton);

      await waitFor(() => {
        expect(screen.getByText(/backup code/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/enter 8-digit backup code/i)).toBeInTheDocument();
      });

      // Switch back to TOTP
      const useTotpButton = screen.getByText(/use totp code instead/i);
      await user.click(useTotpButton);

      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication code/i)).toBeInTheDocument();
      });
    });

    it('redirects to dashboard on successful login', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(undefined);
      renderWithProviders(<Login />);

      const emailInput = screen.getByTestId('input-login-email');
      const passwordInput = screen.getByTestId('input-login-password');
      const submitButton = screen.getByTestId('button-login-submit');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSetLocation).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Signup Flow', () => {
    it('submits signup form with valid data', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue(undefined);
      renderWithProviders(<Login />);

      const signupTab = screen.getByTestId('tab-signup');
      await user.click(signupTab);

      const emailInput = screen.getByTestId('input-signup-email');
      const passwordInput = screen.getByTestId('input-signup-password');
      const confirmPasswordInput = screen.getByTestId('input-signup-confirm-password');
      const submitButton = screen.getByTestId('button-signup-submit');

      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'SecurePassword123!');
      await user.type(confirmPasswordInput, 'SecurePassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          'newuser@example.com',
          'SecurePassword123!'
        );
      });
    });

    it('shows error for failed signup', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Email already exists';
      mockRegister.mockRejectedValue(new Error(errorMessage));
      renderWithProviders(<Login />);

      const signupTab = screen.getByTestId('tab-signup');
      await user.click(signupTab);

      const emailInput = screen.getByTestId('input-signup-email');
      const passwordInput = screen.getByTestId('input-signup-password');
      const confirmPasswordInput = screen.getByTestId('input-signup-confirm-password');
      const submitButton = screen.getByTestId('button-signup-submit');

      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/signup failed/i)).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('redirects to dashboard on successful signup', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue(undefined);
      renderWithProviders(<Login />);

      const signupTab = screen.getByTestId('tab-signup');
      await user.click(signupTab);

      const emailInput = screen.getByTestId('input-signup-email');
      const passwordInput = screen.getByTestId('input-signup-password');
      const confirmPasswordInput = screen.getByTestId('input-signup-confirm-password');
      const submitButton = screen.getByTestId('button-signup-submit');

      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'SecurePassword123!');
      await user.type(confirmPasswordInput, 'SecurePassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSetLocation).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('shows password strength indicator', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const signupTab = screen.getByTestId('tab-signup');
      await user.click(signupTab);

      const passwordInput = screen.getByTestId('input-signup-password');

      // Weak password
      await user.type(passwordInput, 'weak');
      await waitFor(() => {
        expect(screen.getByText(/weak/i)).toBeInTheDocument();
      });

      // Strong password
      await user.clear(passwordInput);
      await user.type(passwordInput, 'StrongPassword123!@#');
      await waitFor(() => {
        expect(screen.getByText(/excellent|very strong/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('disables submit button while loading on login', async () => {
      const user = userEvent.setup();
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderWithProviders(<Login />);

      const emailInput = screen.getByTestId('input-login-email');
      const passwordInput = screen.getByTestId('input-login-password');
      const submitButton = screen.getByTestId('button-login-submit');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(screen.getByText(/logging in/i)).toBeInTheDocument();
      });
    });

    it('disables submit button while loading on signup', async () => {
      const user = userEvent.setup();
      mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderWithProviders(<Login />);

      const signupTab = screen.getByTestId('tab-signup');
      await user.click(signupTab);

      const emailInput = screen.getByTestId('input-signup-email');
      const passwordInput = screen.getByTestId('input-signup-password');
      const confirmPasswordInput = screen.getByTestId('input-signup-confirm-password');
      const submitButton = screen.getByTestId('button-signup-submit');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      const networkError = new Error('Network request failed');
      networkError.name = 'TypeError';
      mockLogin.mockRejectedValue(networkError);
      renderWithProviders(<Login />);

      const emailInput = screen.getByTestId('input-login-email');
      const passwordInput = screen.getByTestId('input-login-password');
      const submitButton = screen.getByTestId('button-login-submit');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });
    });

    it('clears error when switching tabs', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));
      renderWithProviders(<Login />);

      const emailInput = screen.getByTestId('input-login-email');
      const passwordInput = screen.getByTestId('input-login-password');
      const submitButton = screen.getByTestId('button-login-submit');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'WrongPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });

      // Switch to signup tab
      const signupTab = screen.getByTestId('tab-signup');
      await user.click(signupTab);

      // Error should be cleared (or not visible in signup tab)
      await waitFor(() => {
        expect(screen.queryByText(/login failed/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Biometric Login', () => {
    it('shows biometric login button when WebAuthn is available', async () => {
      mockIsWebAuthnSupported.mockReturnValue(true);
      mockCheckWebAuthnAvailable.mockResolvedValue(true);
      renderWithProviders(<Login />);

      const emailInput = screen.getByTestId('input-login-email');
      await userEvent.type(emailInput, 'test@example.com');

      await waitFor(() => {
        expect(screen.getByText(/login with/i)).toBeInTheDocument();
      });
    });

    it('handles biometric login success', async () => {
      const user = userEvent.setup();
      mockIsWebAuthnSupported.mockReturnValue(true);
      mockCheckWebAuthnAvailable.mockResolvedValue(true);
      mockAuthenticateWithWebAuthnForLogin.mockResolvedValue({
        success: true,
        user: {
          id: '1',
          email: 'test@example.com',
        },
      });

      // Mock window.location.href
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = { href: '', assign: vi.fn(), replace: vi.fn() };

      renderWithProviders(<Login />);

      const emailInput = screen.getByTestId('input-login-email');
      await user.type(emailInput, 'test@example.com');

      await waitFor(() => {
        expect(screen.getByText(/login with/i)).toBeInTheDocument();
      });

      const biometricButton = screen.getByText(/login with/i).closest('button');
      if (biometricButton) {
        await user.click(biometricButton);
      }

      await waitFor(() => {
        expect(mockAuthenticateWithWebAuthnForLogin).toHaveBeenCalledWith('test@example.com');
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Login Successful',
          })
        );
      });

      // Restore original location
      window.location = originalLocation;
    });

    it('handles biometric login failure', async () => {
      const user = userEvent.setup();
      mockIsWebAuthnSupported.mockReturnValue(true);
      mockCheckWebAuthnAvailable.mockResolvedValue(true);
      mockAuthenticateWithWebAuthnForLogin.mockResolvedValue({
        success: false,
        error: 'Biometric authentication failed',
      });

      renderWithProviders(<Login />);

      const emailInput = screen.getByTestId('input-login-email');
      await user.type(emailInput, 'test@example.com');

      await waitFor(() => {
        expect(screen.getByText(/login with/i)).toBeInTheDocument();
      });

      const biometricButton = screen.getByText(/login with/i).closest('button');
      if (biometricButton) {
        await user.click(biometricButton);
      }

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Biometric Login Failed',
            variant: 'destructive',
          })
        );
      });
    });

    it('requires email before biometric login', async () => {
      const user = userEvent.setup();
      mockIsWebAuthnSupported.mockReturnValue(true);
      mockCheckWebAuthnAvailable.mockResolvedValue(true);

      renderWithProviders(<Login />);

      // Biometric button should not appear without email
      await waitFor(() => {
        const biometricButtons = screen.queryAllByText(/login with/i);
        // Button should not be visible until email is entered
        expect(biometricButtons.length).toBe(0);
      });

      // Enter email to trigger WebAuthn check
      const emailInput = screen.getByTestId('input-login-email');
      await user.type(emailInput, 'test@example.com');

      // Wait for biometric button to appear
      await waitFor(() => {
        expect(screen.getByText(/login with/i)).toBeInTheDocument();
      });

      // Clear email and try to click biometric button
      await user.clear(emailInput);
      const biometricButton = screen.queryByText(/login with/i)?.closest('button');
      
      if (biometricButton) {
        await user.click(biometricButton);
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
              title: 'Email Required',
            })
          );
        });
      }
    });
  });

  describe('Social Login', () => {
    it('shows message for Google login', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const googleButton = screen.getByRole('button', { name: /google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Google Login',
          })
        );
      });
    });

    it('shows message for GitHub login', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const githubButton = screen.getByRole('button', { name: /github/i });
      await user.click(githubButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'GitHub Login',
          })
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty form submission', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const submitButton = screen.getByTestId('button-login-submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it('handles very long email addresses', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const emailInput = screen.getByTestId('input-login-email');
      const longEmail = 'a'.repeat(100) + '@example.com';
      
      await user.type(emailInput, longEmail);
      
      // Email validation should still work
      const submitButton = screen.getByTestId('button-login-submit');
      await user.click(submitButton);

      // Should not show email format error if email is valid
      await waitFor(() => {
        expect(screen.queryByText(/invalid email address/i)).not.toBeInTheDocument();
      });
    });

    it('handles special characters in password', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const passwordInput = screen.getByTestId('input-login-password');
      const specialPassword = 'P@ssw0rd!@#$%^&*()';
      
      await user.type(passwordInput, specialPassword);
      
      // Password should accept special characters
      expect(passwordInput).toHaveValue(specialPassword);
    });

    it('handles rapid tab switching', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const loginTab = screen.getByTestId('tab-login');
      const signupTab = screen.getByTestId('tab-signup');

      // Rapidly switch tabs
      await user.click(signupTab);
      await user.click(loginTab);
      await user.click(signupTab);
      await user.click(loginTab);

      // Should still be functional
      expect(screen.getByTestId('input-login-email')).toBeInTheDocument();
    });

    it('handles form submission with only whitespace', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const emailInput = screen.getByTestId('input-login-email');
      const passwordInput = screen.getByTestId('input-login-password');
      const submitButton = screen.getByTestId('button-login-submit');

      await user.type(emailInput, '   ');
      await user.type(passwordInput, '   ');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderWithProviders(<Login />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('has proper button roles', () => {
      renderWithProviders(<Login />);

      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
    });

    it('shows error messages in accessible format', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));
      renderWithProviders(<Login />);

      const emailInput = screen.getByTestId('input-login-email');
      const passwordInput = screen.getByTestId('input-login-password');
      const submitButton = screen.getByTestId('button-login-submit');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'WrongPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toBeInTheDocument();
        expect(within(errorAlert).getByText(/login failed/i)).toBeInTheDocument();
      });
    });
  });
});

