import { test, expect } from '@playwright/test';

/**
 * E2E Test: Vault Creation Flow
 * Tests the complete user journey of creating a vault with guardians
 */

test.describe('Vault Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Simulate user login (adjust based on your auth flow)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@guardiavault.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
  });

  test('should create a vault with three guardians', async ({ page }) => {
    // Click create vault button
    await page.click('button:has-text("Create Vault")');

    // Wait for vault creation form
    await expect(page.locator('h1:has-text("Create Your Vault")')).toBeVisible();

    // Fill vault name
    await page.fill('input[name="vaultName"]', 'My Test Vault');

    // Add guardian addresses
    await page.fill('input[name="guardian1"]', '0x1234567890123456789012345678901234567890');
    await page.fill('input[name="guardian2"]', '0x2345678901234567890123456789012345678901');
    await page.fill('input[name="guardian3"]', '0x3456789012345678901234567890123456789012');

    // Set check-in interval
    await page.selectOption('select[name="checkInInterval"]', '30'); // 30 days

    // Submit form
    await page.click('button:has-text("Create Vault")');

    // Wait for success message
    await expect(page.locator('.success-message, .toast-success')).toBeVisible({
      timeout: 10000,
    });

    // Verify redirect to vault details
    await page.waitForURL(/\/vault\/\w+/);

    // Verify vault details are displayed
    await expect(page.locator('h1:has-text("My Test Vault")')).toBeVisible();
    await expect(page.locator('text=3 Guardians')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('button:has-text("Create Vault")');

    // Try to submit without filling fields
    await page.click('button[type="submit"]:has-text("Create")');

    // Check for validation errors
    await expect(page.locator('text=Vault name is required')).toBeVisible();
    await expect(page.locator('text=Guardian addresses are required')).toBeVisible();
  });

  test('should validate ethereum addresses', async ({ page }) => {
    await page.click('button:has-text("Create Vault")');

    // Fill with invalid address
    await page.fill('input[name="guardian1"]', 'invalid-address');
    await page.blur('input[name="guardian1"]');

    // Check for validation error
    await expect(page.locator('text=Invalid Ethereum address')).toBeVisible();
  });

  test('should allow wallet connection for contract interaction', async ({ page }) => {
    // Navigate to vault creation
    await page.click('button:has-text("Create Vault")');

    // Click connect wallet button
    await page.click('button:has-text("Connect Wallet")');

    // In a real scenario, you'd handle MetaMask popup
    // For testing, you might mock this or use a test wallet
    // This is a placeholder for wallet connection flow
    await expect(page.locator('text=Wallet Connected')).toBeVisible({
      timeout: 15000,
    });
  });
});

test.describe('Vault Management', () => {
  test('should display vault list', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for vault list
    await expect(page.locator('[data-testid="vault-list"]')).toBeVisible();

    // Check for at least one vault card
    const vaultCards = page.locator('[data-testid="vault-card"]');
    await expect(vaultCards.first()).toBeVisible();
  });

  test('should navigate to vault details', async ({ page }) => {
    await page.goto('/dashboard');

    // Click on first vault
    await page.click('[data-testid="vault-card"]:first-child');

    // Verify navigation
    await page.waitForURL(/\/vault\/\w+/);
    await expect(page.locator('[data-testid="vault-details"]')).toBeVisible();
  });

  test('should perform check-in', async ({ page }) => {
    // Navigate to vault details (assuming vault exists)
    await page.goto('/dashboard');
    await page.click('[data-testid="vault-card"]:first-child');

    // Click check-in button
    await page.click('button:has-text("Check In")');

    // Confirm action if modal appears
    const confirmButton = page.locator('button:has-text("Confirm")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Wait for success message
    await expect(page.locator('text=Check-in successful')).toBeVisible({
      timeout: 10000,
    });

    // Verify last check-in timestamp updated
    await expect(page.locator('[data-testid="last-check-in"]')).toContainText('Just now');
  });
});

test.describe('Guardian Management', () => {
  test('should invite a new guardian', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-testid="vault-card"]:first-child');

    // Navigate to guardians tab
    await page.click('button:has-text("Guardians")');

    // Click add guardian
    await page.click('button:has-text("Add Guardian")');

    // Fill guardian email
    await page.fill('input[name="guardianEmail"]', 'newguardian@example.com');

    // Submit
    await page.click('button:has-text("Send Invitation")');

    // Verify success
    await expect(page.locator('text=Invitation sent')).toBeVisible();
  });

  test('should remove a guardian', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-testid="vault-card"]:first-child');

    // Navigate to guardians tab
    await page.click('button:has-text("Guardians")');

    // Click remove on first guardian
    await page.click('[data-testid="remove-guardian-btn"]:first-child');

    // Confirm removal
    await page.click('button:has-text("Confirm Removal")');

    // Verify success
    await expect(page.locator('text=Guardian removed')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/dashboard');

    // Tab through elements
    await page.keyboard.press('Tab');
    const firstFocusable = await page.locator(':focus');
    await expect(firstFocusable).toBeVisible();

    // Continue tabbing
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Press Enter on focused element
    await page.keyboard.press('Enter');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for main navigation ARIA labels
    await expect(page.locator('[aria-label="Main navigation"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });
});
