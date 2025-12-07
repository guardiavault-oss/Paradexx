import { logger } from '../services/logger.service';
/**
 * Complete API Test Suite with Authentication
 * Tests all 33+ endpoints with proper auth flow
 */

const API_BASE = 'http://localhost:3001';
let authToken = '';
const results: any[] = [];

async function testEndpoint(
  method: string,
  path: string,
  body?: any,
  requiresAuth = false,
  skipAuth = false
): Promise<any> {
  const url = `${API_BASE}${path}`;
  const startTime = Date.now();

  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(requiresAuth && !skipAuth && authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(url, options);
    const duration = Date.now() - startTime;
    const statusCode = response.status;

    let status = statusCode === 200 || statusCode === 201 ? 'success' : 'pending';
    if (statusCode === 401) status = 'auth-required';
    if (statusCode === 404) status = 'not-found';
    if (statusCode >= 400 && statusCode < 500) status = 'client-error';
    if (statusCode >= 500) status = 'server-error';

    const data = await response.json();

    return { endpoint: path, method, status, statusCode, duration, data };
  } catch (error: any) {
    return {
      endpoint: path,
      method,
      status: 'error',
      message: error.message,
    };
  }
}

async function runFullTests() {
  logger.info('🚀 Paradox Complete API Test Suite\n');

  // Step 1: Register and authenticate
  logger.info('📍 Step 1: User Registration & Authentication\n');

  const email = `test-${Date.now()}@example.com`;
  const registerResult = await testEndpoint('POST', '/api/auth/register', {
    email,
    password: 'TestPass123!@#',
    username: 'testuser',
  });
  
  results.push(registerResult);
  logger.info(`✓ Register: ${registerResult.statusCode} (${registerResult.duration}ms)`);

  if (registerResult.data?.accessToken) {
    authToken = registerResult.data.accessToken;
    logger.info(`✓ Auth Token: Obtained\n`);
  } else {
    logger.info(`⚠️  No auth token obtained, using mock token\n`);
    authToken = 'mock-token';
  }

  // Step 2: Test all endpoints
  logger.info('📍 Step 2: Testing All API Endpoints\n');

  // Auth endpoints
  logger.info('🔐 Auth Endpoints:');
  results.push(await testEndpoint('GET', '/api/auth/me', undefined, true));
  results.push(await testEndpoint('POST', '/api/auth/login', { email, password: 'TestPass123!@#' }));
  logger.info('  ✓ Auth endpoints tested\n');

  // ChangeNOW endpoints
  logger.info('💱 ChangeNOW Endpoints:');
  results.push(await testEndpoint('GET', '/api/changenow/status'));
  results.push(await testEndpoint('GET', '/api/changenow/currencies'));
  results.push(await testEndpoint('POST', '/api/changenow/quote', { from: 'USD', to: 'ETH', amount: 100 }, true));
  results.push(await testEndpoint('POST', '/api/changenow/exchange', { from: 'USD', to: 'ETH', amount: 100, address: '0x123' }, true));
  logger.info('  ✓ ChangeNOW endpoints tested\n');

  // Onramper endpoints
  logger.info('🌐 Onramper Endpoints:');
  results.push(await testEndpoint('GET', '/api/onramper/status'));
  results.push(await testEndpoint('GET', '/api/onramper/fiat-currencies'));
  results.push(await testEndpoint('GET', '/api/onramper/crypto-currencies'));
  results.push(await testEndpoint('POST', '/api/onramper/quote', { fiatCurrency: 'USD', cryptoCurrency: 'ETH', amount: 100, address: '0x123' }, true));
  logger.info('  ✓ Onramper endpoints tested\n');

  // Profit Routing endpoints
  logger.info('💰 Profit Routing Endpoints:');
  results.push(await testEndpoint('GET', '/api/profit-routing/status'));
  results.push(await testEndpoint('GET', '/api/profit-routing/stats', undefined, true));
  results.push(await testEndpoint('GET', '/api/profit-routing/transactions', undefined, true));
  logger.info('  ✓ Profit routing endpoints tested\n');

  // Guardian endpoints
  logger.info('🛡️  Guardian Endpoints:');
  results.push(await testEndpoint('GET', '/api/guardian/summary', undefined, true));
  results.push(await testEndpoint('GET', '/api/guardians', undefined, true));
  results.push(await testEndpoint('POST', '/api/guardians', { email: 'guardian@example.com', name: 'Guardian' }, true));
  results.push(await testEndpoint('POST', '/api/guardians/invite', { email: 'guardian@example.com' }, true));
  logger.info('  ✓ Guardian endpoints tested\n');

  // DeFi endpoints
  logger.info('🔄 DeFi Endpoints:');
  results.push(await testEndpoint('GET', '/api/defi/tokens', undefined, true));
  results.push(await testEndpoint('POST', '/api/defi/quote', { from: 'ETH', to: 'USDC', amount: '1' }, true));
  results.push(await testEndpoint('POST', '/api/defi/swap', { fromToken: 'ETH', toToken: 'USDC', amount: '1' }, true));
  logger.info('  ✓ DeFi endpoints tested\n');

  // MEV Guard endpoints
  logger.info('🛡️  MEV Guard Endpoints:');
  results.push(await testEndpoint('GET', '/api/mev-guard/status'));
  results.push(await testEndpoint('POST', '/api/mev-guard/protect', { tx: '0xtest' }, true));
  results.push(await testEndpoint('POST', '/api/mev-guard/analyze', { transaction: '0xtest' }, true));
  logger.info('  ✓ MEV Guard endpoints tested\n');

  // Wallet endpoints
  logger.info('💳 Wallet Endpoints:');
  results.push(await testEndpoint('GET', '/api/wallet', undefined, true));
  results.push(await testEndpoint('GET', '/api/wallet/balance', undefined, true));
  results.push(await testEndpoint('POST', '/api/wallet/send', { to: '0x123', amount: '1' }, true));
  logger.info('  ✓ Wallet endpoints tested\n');

  // Will/Inheritance endpoints
  logger.info('📋 Will/Inheritance Endpoints:');
  results.push(await testEndpoint('GET', '/api/will', undefined, true));
  results.push(await testEndpoint('GET', '/api/inheritance', undefined, true));
  results.push(await testEndpoint('POST', '/api/will/templates', {}, true));
  logger.info('  ✓ Will endpoints tested\n');

  // DegenX endpoints
  logger.info('🚀 DegenX Endpoints:');
  results.push(await testEndpoint('GET', '/api/degenx', undefined, true));
  results.push(await testEndpoint('GET', '/api/degenx/analytics/degen', undefined, true));
  results.push(await testEndpoint('POST', '/api/degenx/discover', {}, true));
  logger.info('  ✓ DegenX endpoints tested\n');

  // AI endpoints
  logger.info('🤖 AI Endpoints:');
  results.push(await testEndpoint('POST', '/api/ai/chat', { message: 'Hello' }, true));
  results.push(await testEndpoint('GET', '/api/ai/health'));
  logger.info('  ✓ AI endpoints tested\n');

  // Print summary
  logger.info('\n' + '═'.repeat(80));
  logger.info('📊 FINAL TEST SUMMARY\n');

  const success = results.filter(r => r.status === 'success').length;
  const pending = results.filter(r => r.status === 'pending').length;
  const authReq = results.filter(r => r.status === 'auth-required').length;
  const notFound = results.filter(r => r.status === 'not-found').length;
  const errors = results.filter(r => r.status === 'error' || r.status === 'client-error' || r.status === 'server-error').length;

  logger.info(`✅ Working: ${success + pending}`);
  logger.info(`🔒 Need Auth: ${authReq}`);
  logger.info(`⚠️  Not Found: ${notFound}`);
  logger.info(`❌ Errors: ${errors}`);
  logger.info(`📊 Total: ${results.length}`);

  logger.info('\n' + '═'.repeat(80) + '\n');
}

runFullTests().catch(console.error);
