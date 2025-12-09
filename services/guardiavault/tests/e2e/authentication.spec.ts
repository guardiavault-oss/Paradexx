import { test, expect } from '@playwright/test';

/**
 * E2E Test: Authentication Flows
 * Tests login, registration, 2FA, and WebAuthn
 */

test.describe('User Registration', () => {
  test('should register a new user successfully', async ({ page }) => {
    await page.goto('/register');

    // Fill registration form
    await page.fill('input[name="email"]', `test+${Date.now()}@guardiavault.com`);
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');

    // Accept terms
    await page.check('input[name="acceptTerms"]');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for success and redirect
    await expect(page.locator('text=Registration successful')).toBeVisible();
    await page.waitForURL('/verify-email');
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/register');

    // Try weak password
    await page.fill('input[name="password"]', 'weak');
    await page.blur('input[name="password"]');

    // Check for error
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="email"]', 'invalid-email');
    await page.blur('input[name="email"]');

    await expect(page.locator('text=Invalid email address')).toBeVisible();
  });
});

test.describe('User Login', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test@guardiavault.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should handle forgot password flow', async ({ page }) => {
    await page.goto('/login');

    await page.click('a:has-text("Forgot Password")');
    await page.waitForURL('/forgot-password');

    await page.fill('input[name="email"]', 'test@guardiavault.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Password reset email sent')).toBeVisible();
  });
});

test.describe('Two-Factor Authentication', () => {
  test('should setup 2FA', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@guardiavault.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to settings
    await page.click('a[href="/settings"]');
    await page.click('button:has-text("Security")');

    // Enable 2FA
    await page.click('button:has-text("Enable 2FA")');

    // QR code should appear
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();

    // Show backup codes
    await expect(page.locator('[data-testid="backup-codes"]')).toBeVisible();
  });

  test('should require 2FA code on login when enabled', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test2fa@guardiavault.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Should show 2FA input
    await expect(page.locator('input[name="totpCode"]')).toBeVisible();

    // Enter code (in real test, you'd generate a valid TOTP code)
    await page.fill('input[name="totpCode"]', '123456');
    await page.click('button:has-text("Verify")');
  });
});

test.describe('WebAuthn / Passwordless', () => {
  test('should show WebAuthn registration option', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('button:has-text("Sign in with passkey")')).toBeVisible();
  });

  test('should navigate to WebAuthn setup', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@guardiavault.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Go to settings
    await page.click('a[href="/settings"]');
    await page.click('button:has-text("Security")');

    // Start WebAuthn setup
    await page.click('button:has-text("Add Security Key")');

    // In real scenario, WebAuthn dialog would appear
    await expect(page.locator('text=Register your security key')).toBeVisible();
  });
});

test.describe('Session Management', () => {
  test('should logout successfully', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@guardiavault.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('button:has-text("Logout")');

    // Should redirect to login
    await page.waitForURL('/login');
  });

  test('should persist session on page reload', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@guardiavault.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Clear cookies to ensure logged out
    await page.context().clearCookies();

    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/login');
  });
});
