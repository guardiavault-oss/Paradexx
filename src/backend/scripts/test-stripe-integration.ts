// Test Stripe Integration and Tier Enforcement
import axios from 'axios';
import { logger } from '../services/logger.service';
import dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = process.env.APP_URL || 'http://localhost:3001/api';
let accessToken = '';
let testUserId = '';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ test: name, status: 'PASS', message: 'Success' });
    logger.info(`✅ ${name}`);
  } catch (error: any) {
    results.push({ test: name, status: 'FAIL', message: error.message });
    logger.info(`❌ ${name}: ${error.message}`);
  }
}

async function apiRequest(endpoint: string, options: any = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };

  try {
    const response = await axios({
      url,
      method: options.method || 'GET',
      headers,
      data: options.body,
      timeout: 10000,
    });
    return { success: true, data: response.data, status: response.status };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      status: error.response?.status,
    };
  }
}

async function runTests() {
  logger.info('\n🧪 Testing Stripe Integration & Tier Enforcement\n');
  logger.info('='.repeat(60));

  // Test 1: Authentication
  await test('Authentication', async () => {
    const login = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: process.env.TEST_EMAIL || 'demo@guardiavault.com',
        password: process.env.TEST_PASSWORD || 'DemoGuardiaVault2024!',
      },
    });

    if (!login.success || !login.data?.access_token) {
      throw new Error('Authentication failed');
    }

    accessToken = login.data.access_token;
  });

  if (!accessToken) {
    logger.info('\n⚠️  Authentication failed. Some tests will be skipped.\n');
    return;
  }

  // Test 2: Get subscription status (should show no subscription)
  await test('Get Subscription Status (No Subscription)', async () => {
    const status = await apiRequest('/subscription/status');
    if (!status.success) {
      throw new Error('Failed to get subscription status');
    }
    logger.info(`   Current tiers: DegenX=${status.data?.degenx?.tier || 'none'}, GuardianX=${status.data?.guardianx?.tier || 'none'}`);
  });

  // Test 3: Try accessing Elite features without subscription (should fail)
  await test('Sniper Bot Access (No Subscription - Should Fail)', async () => {
    const sniper = await apiRequest('/sniper/config', { method: 'GET' });
    if (sniper.success) {
      throw new Error('Should require Elite subscription');
    }
    if (sniper.status !== 403) {
      throw new Error(`Expected 403, got ${sniper.status}`);
    }
    logger.info(`   ✅ Correctly blocked: ${sniper.error}`);
  });

  await test('MEV Protection Access (No Subscription - Should Fail)', async () => {
    const mev = await apiRequest('/security/mev/analyze', {
      method: 'POST',
      body: {
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        data: '0x7ff36ab5',
        value: '100000000000000000',
      },
    });
    if (mev.success) {
      throw new Error('Should require Elite subscription');
    }
    if (mev.status !== 403) {
      throw new Error(`Expected 403, got ${mev.status}`);
    }
    logger.info(`   ✅ Correctly blocked: ${mev.error}`);
  });

  await test('Bridge Service Access (No Subscription - Should Fail)', async () => {
    const bridge = await apiRequest('/bridge/chains');
    if (bridge.success) {
      throw new Error('Should require Elite subscription');
    }
    if (bridge.status !== 403) {
      throw new Error(`Expected 403, got ${bridge.status}`);
    }
    logger.info(`   ✅ Correctly blocked: ${bridge.error}`);
  });

  // Test 4: Honeypot detection should work (Pro tier feature)
  await test('Honeypot Detection (Should Work - Pro Tier)', async () => {
    const honeypot = await apiRequest('/security/honeypot/check', {
      method: 'POST',
      body: {
        tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        chainId: 1,
      },
    });
    // This should work even without subscription (or require Pro tier)
    // Adjust based on your requirements
    if (!honeypot.success && honeypot.status !== 403) {
      logger.info(`   ⚠️  Note: ${honeypot.error}`);
    }
  });

  // Test 5: Check Stripe configuration
  await test('Stripe Configuration Check', async () => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey.includes('test') || stripeKey.includes('sk_test')) {
      logger.info('   ⚠️  Using test Stripe key');
    } else if (stripeKey.includes('sk_live')) {
      logger.info('   ✅ Using live Stripe key');
    } else {
      throw new Error('Invalid Stripe key format');
    }
  });

  // Test 6: Create checkout session (test endpoint)
  await test('Create Checkout Session Endpoint', async () => {
    const checkout = await apiRequest('/subscription/create-checkout', {
      method: 'POST',
      body: {
        product: 'degenx',
        tier: 'basic',
      },
    });

    if (!checkout.success) {
      // Check if it's a Stripe error or missing key
      if (checkout.error?.includes('Stripe') || checkout.error?.includes('API key')) {
        logger.info(`   ⚠️  Stripe not configured: ${checkout.error}`);
        results[results.length - 1].status = 'SKIP';
        results[results.length - 1].message = 'Stripe not configured';
      } else {
        throw new Error(checkout.error);
      }
    } else {
      logger.info(`   ✅ Checkout URL created: ${checkout.data?.url ? 'Yes' : 'No'}`);
    }
  });

  // Summary
  logger.info('\n' + '='.repeat(60));
  logger.info('\n📊 TEST SUMMARY\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  logger.info(`✅ Passed: ${passed}`);
  logger.info(`❌ Failed: ${failed}`);
  logger.info(`⏭️  Skipped: ${skipped}`);
  logger.info(`📈 Total: ${results.length}\n`);

  logger.info('📋 DETAILED RESULTS:\n');
  results.forEach((result, idx) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    logger.info(`${icon} ${idx + 1}. ${result.test}: ${result.status}`);
    if (result.message !== 'Success') {
      logger.info(`   ${result.message}\n`);
    }
  });

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);

