/**
 * Critical User Flows E2E Tests
 * Tests for essential user journeys
 */

import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('User can connect wallet', async ({ page }) => {
    // Click connect wallet button
    await page.click('[data-testid="connect-wallet-button"]');
    
    // Wait for wallet connection modal
    await expect(page.locator('[data-testid="wallet-connection-modal"]')).toBeVisible();
    
    // Select wallet provider
    await page.click('[data-testid="wallet-provider-metamask"]');
    
    // Wait for connection
    await expect(page.locator('[data-testid="wallet-connected"]')).toBeVisible({ timeout: 10000 });
  });

  test('User can view wallet balance', async ({ page }) => {
    // Assume wallet is already connected
    await page.goto('/wallet');
    
    // Check balance is displayed
    await expect(page.locator('[data-testid="wallet-balance"]')).toBeVisible();
    await expect(page.locator('[data-testid="wallet-balance"]')).not.toHaveText('$0.00');
  });

  test('User can send transaction', async ({ page }) => {
    await page.goto('/wallet');
    
    // Click send button
    await page.click('[data-testid="send-button"]');
    
    // Fill transaction form
    await page.fill('[data-testid="recipient-address"]', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    await page.fill('[data-testid="amount"]', '0.1');
    
    // Submit transaction
    await page.click('[data-testid="submit-transaction"]');
    
    // Confirm transaction
    await page.click('[data-testid="confirm-transaction"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="transaction-success"]')).toBeVisible({ timeout: 30000 });
  });

  test('User can view transaction history', async ({ page }) => {
    await page.goto('/wallet/transactions');
    
    // Check transactions list is visible
    await expect(page.locator('[data-testid="transactions-list"]')).toBeVisible();
    
    // Check at least one transaction exists
    const transactions = page.locator('[data-testid="transaction-item"]');
    await expect(transactions.first()).toBeVisible();
  });

  test('User can enable security features', async ({ page }) => {
    await page.goto('/security');
    
    // Enable MEV protection
    await page.click('[data-testid="mev-protection-toggle"]');
    await expect(page.locator('[data-testid="mev-protection-status"]')).toHaveText('Enabled');
    
    // Enable wallet guard
    await page.click('[data-testid="wallet-guard-toggle"]');
    await expect(page.locator('[data-testid="wallet-guard-status"]')).toHaveText('Active');
  });

  test('User can use AI assistant', async ({ page }) => {
    await page.goto('/ai');
    
    // Open chat
    await page.click('[data-testid="ai-chat-button"]');
    
    // Type message
    await page.fill('[data-testid="ai-chat-input"]', 'What is Ethereum?');
    await page.click('[data-testid="ai-chat-send"]');
    
    // Wait for response
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
  });

  test('User can bridge tokens', async ({ page }) => {
    await page.goto('/bridge');
    
    // Select source chain
    await page.click('[data-testid="source-chain-select"]');
    await page.click('[data-testid="chain-ethereum"]');
    
    // Select target chain
    await page.click('[data-testid="target-chain-select"]');
    await page.click('[data-testid="chain-polygon"]');
    
    // Enter amount
    await page.fill('[data-testid="bridge-amount"]', '1');
    
    // Initiate bridge
    await page.click('[data-testid="bridge-submit"]');
    
    // Confirm bridge
    await page.click('[data-testid="bridge-confirm"]');
    
    // Wait for bridge status
    await expect(page.locator('[data-testid="bridge-status"]')).toBeVisible();
  });
});

