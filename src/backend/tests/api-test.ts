import { logger } from '../services/logger.service';
/**
 * Comprehensive API Test Suite
 * Tests all Paradox wallet endpoints
 */

interface TestResult {
  endpoint: string;
  method: string;
  status: 'success' | 'error' | 'auth-required' | 'not-implemented';
  statusCode?: number;
  message: string;
  duration: number;
}

const API_BASE = 'http://localhost:3001';
const results: TestResult[] = [];

// Mock auth token (would be real in production)
const mockToken = 'Bearer mock-token';

async function testEndpoint(
  method: string,
  path: string,
  body?: any,
  requiresAuth = false
): Promise<TestResult> {
  const startTime = Date.now();
  const url = `${API_BASE}${path}`;

  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(requiresAuth && { 'Authorization': mockToken }),
      },
      body: body ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(url, options);
    const duration = Date.now() - startTime;

    let status: 'success' | 'error' | 'auth-required' | 'not-implemented' = 'success';
    let message = `${method} ${path} - ${response.status}`;

    if (response.status === 401) {
      status = 'auth-required';
      message = 'Authentication required';
    } else if (response.status === 404) {
      status = 'not-implemented';
      message = 'Endpoint not implemented';
    } else if (!response.ok) {
      status = 'error';
      message = `Error: ${response.statusText}`;
    }

    return { endpoint: path, method, status, statusCode: response.status, message, duration };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      endpoint: path,
      method,
      status: 'error',
      message: `Network error: ${error.message}`,
      duration,
    };
  }
}

async function runTests() {
  logger.info('🧪 Starting Paradox API Test Suite...\n');

  // Auth endpoints
  logger.info('📍 Testing Auth Endpoints...');
  results.push(await testEndpoint('GET', '/api/auth/me', undefined, true));
  results.push(await testEndpoint('POST', '/api/auth/login', { email: 'test@example.com', password: 'test' }));
  results.push(await testEndpoint('POST', '/api/auth/register', { email: 'test@example.com', password: 'test' }));

  // ChangeNOW endpoints
  logger.info('📍 Testing ChangeNOW Endpoints...');
  results.push(await testEndpoint('GET', '/api/changenow/status'));
  results.push(await testEndpoint('GET', '/api/changenow/currencies'));
  results.push(await testEndpoint('POST', '/api/changenow/quote', { from: 'USD', to: 'ETH', amount: 100 }, true));

  // Onramper endpoints
  logger.info('📍 Testing Onramper Endpoints...');
  results.push(await testEndpoint('GET', '/api/onramper/status'));
  results.push(await testEndpoint('GET', '/api/onramper/fiat-currencies'));
  results.push(await testEndpoint('GET', '/api/onramper/crypto-currencies'));

  // Profit Routing endpoints
  logger.info('📍 Testing Profit Routing Endpoints...');
  results.push(await testEndpoint('GET', '/api/profit-routing/status'));
  results.push(await testEndpoint('GET', '/api/profit-routing/stats', undefined, true));
  results.push(await testEndpoint('GET', '/api/profit-routing/transactions', undefined, true));

  // DeFi endpoints
  logger.info('📍 Testing DeFi Endpoints...');
  results.push(await testEndpoint('GET', '/api/defi/tokens'));
  results.push(await testEndpoint('POST', '/api/defi/swap', { fromToken: 'ETH', toToken: 'USDC', amount: '1' }, true));
  results.push(await testEndpoint('POST', '/api/defi/quote', { from: 'ETH', to: 'USDC', amount: '1' }, true));
  results.push(await testEndpoint('POST', '/api/defi/mempool/connect', {}, true));

  // Guardian endpoints
  logger.info('📍 Testing Guardian Endpoints...');
  results.push(await testEndpoint('GET', '/api/guardian', undefined, true));
  results.push(await testEndpoint('GET', '/api/guardians', undefined, true));
  results.push(await testEndpoint('POST', '/api/guardians/invite', { email: 'guardian@example.com' }, true));

  // MEV Guard endpoints
  logger.info('📍 Testing MEV Guard Endpoints...');
  results.push(await testEndpoint('GET', '/api/mev-guard/status'));
  results.push(await testEndpoint('POST', '/api/mev-guard/protect', { tx: '0x...' }, true));
  results.push(await testEndpoint('POST', '/api/mev-guard/analyze', { transaction: '0x...' }, true));

  // Wallet endpoints
  logger.info('📍 Testing Wallet Endpoints...');
  results.push(await testEndpoint('GET', '/api/wallet', undefined, true));
  results.push(await testEndpoint('GET', '/api/wallet/balance', undefined, true));
  results.push(await testEndpoint('POST', '/api/wallet/send', { to: '0x...', amount: '1' }, true));

  // Will/Inheritance endpoints
  logger.info('📍 Testing Will/Inheritance Endpoints...');
  results.push(await testEndpoint('GET', '/api/will', undefined, true));
  results.push(await testEndpoint('GET', '/api/inheritance', undefined, true));
  results.push(await testEndpoint('POST', '/api/will/templates', {}, true));

  // DegenX endpoints
  logger.info('📍 Testing DegenX Endpoints...');
  results.push(await testEndpoint('GET', '/api/degenx', undefined, true));
  results.push(await testEndpoint('GET', '/api/degenx/analytics/degen', undefined, true));
  results.push(await testEndpoint('POST', '/api/degenx/discover', { tokens: [] }, true));

  // AI endpoints
  logger.info('📍 Testing AI Endpoints...');
  results.push(await testEndpoint('POST', '/api/ai/chat', { message: 'Hello' }, true));
  results.push(await testEndpoint('GET', '/api/ai/health'));

  // Print results
  logger.info('\n\n📊 TEST RESULTS\n');
  logger.info('═'.repeat(80));

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const authCount = results.filter(r => r.status === 'auth-required').length;
  const notImplCount = results.filter(r => r.status === 'not-implemented').length;

  logger.info(`✅ Success: ${successCount}`);
  logger.info(`❌ Errors: ${errorCount}`);
  logger.info(`🔒 Auth Required: ${authCount}`);
  logger.info(`⚠️  Not Implemented: ${notImplCount}`);
  logger.info(`⏱️  Total Tests: ${results.length}`);

  logger.info('\n' + '═'.repeat(80));
  logger.info('\nDETAILED RESULTS:\n');

  // Group by status
  const byStatus = {
    success: results.filter(r => r.status === 'success'),
    'auth-required': results.filter(r => r.status === 'auth-required'),
    error: results.filter(r => r.status === 'error'),
    'not-implemented': results.filter(r => r.status === 'not-implemented'),
  };

  Object.entries(byStatus).forEach(([status, items]) => {
    if (items.length > 0) {
      logger.info(`\n${status.toUpperCase()}:`);
      items.forEach(item => {
        logger.info(
          `  ${item.method.padEnd(6)} ${item.endpoint.padEnd(40)} (${item.duration}ms) - ${item.message}`
        );
      });
    }
  });

  logger.info('\n' + '═'.repeat(80));
}

// Run tests
runTests().catch(console.error);
