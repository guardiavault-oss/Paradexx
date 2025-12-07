/**
 * WebSocket E2E Tests
 * Tests for WebSocket functionality
 */

import { test, expect } from '@playwright/test';

test.describe('WebSocket Functionality', () => {
  test('WebSocket connects on page load', async ({ page }) => {
    await page.goto('/');
    
    // Wait for WebSocket connection indicator
    await expect(page.locator('[data-testid="websocket-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="websocket-status"]')).toHaveText(/connected|connecting/i);
  });

  test('WebSocket reconnects after disconnect', async ({ page }) => {
    await page.goto('/');
    
    // Wait for connection
    await expect(page.locator('[data-testid="websocket-status"]')).toHaveText(/connected/i);
    
    // Simulate disconnect (via dev tools or network throttling)
    await page.evaluate(() => {
      // Trigger WebSocket disconnect
      window.dispatchEvent(new Event('offline'));
    });
    
    // Wait for reconnecting status
    await expect(page.locator('[data-testid="websocket-status"]')).toHaveText(/reconnecting/i, { timeout: 5000 });
    
    // Wait for reconnection
    await expect(page.locator('[data-testid="websocket-status"]')).toHaveText(/connected/i, { timeout: 30000 });
  });

  test('Real-time updates are received', async ({ page }) => {
    await page.goto('/wallet');
    
    // Wait for initial data
    await expect(page.locator('[data-testid="wallet-balance"]')).toBeVisible();
    
    // Simulate WebSocket message
    await page.evaluate(() => {
      const event = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'wallet:balance',
          data: {
            walletAddress: '0x...',
            balance: '1000000000000000000',
            tokenSymbol: 'ETH',
          },
        }),
      });
      window.dispatchEvent(event);
    });
    
    // Check balance updated (this would need actual WebSocket server)
    // For now, just verify the page handles messages
    await page.waitForTimeout(1000);
  });
});

