#!/usr/bin/env tsx
/**
 * Comprehensive Endpoint Test Suite
 * Tests ALL API endpoints from every service
 * Continues until all endpoints return 200
 */

// Use native fetch (Node 18+) or node-fetch if available
const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000';
const API_KEY = process.env.API_KEY || 'demo-api-key';
// Get AUTH_TOKEN from env or command line args
const AUTH_TOKEN = process.env.AUTH_TOKEN || process.argv.find(arg => arg.startsWith('--token='))?.split('=')[1] || '';

interface Endpoint {
  method: string;
  path: string;
  name: string;
  requiresAuth?: boolean;
  body?: any;
  params?: Record<string, string>;
}

const endpoints: Endpoint[] = [
  // Root & Health
  { method: 'GET', path: '/', name: 'Root endpoint' },
  { method: 'GET', path: '/health', name: 'Health check' },
  
  // Account Management
  { method: 'GET', path: '/api/account/', name: 'Get account info', requiresAuth: true },
  { method: 'GET', path: '/api/account/wallets', name: 'Get user wallets', requiresAuth: true },
  { method: 'POST', path: '/api/account/wallets', name: 'Create wallet', requiresAuth: true, body: { name: 'Test Wallet', network: 'ethereum' } },
  { method: 'GET', path: '/api/account/devices', name: 'Get devices', requiresAuth: true },
  { method: 'GET', path: '/api/account/sessions', name: 'Get sessions', requiresAuth: true },
  
  // Wallet Operations
  { method: 'GET', path: '/api/wallet/status', name: 'Get wallet status', requiresAuth: true },
  
  // Bridge Operations
  { method: 'GET', path: '/api/bridge/networks', name: 'Get bridge networks', requiresAuth: true },
  { method: 'GET', path: '/api/bridge/fee', name: 'Get bridge fee', requiresAuth: true },
  
  // MEV Protection
  { method: 'GET', path: '/api/mev/status', name: 'Get MEV status', requiresAuth: true },
  { method: 'GET', path: '/api/mev/stats', name: 'Get MEV stats', requiresAuth: true },
  
  // Vault Management
  { method: 'GET', path: '/api/vault/user/vaults', name: 'Get user vaults', requiresAuth: true },
  { method: 'GET', path: '/api/vault/stats/global', name: 'Get global vault stats' },
  
  // Security
  { method: 'GET', path: '/api/security/mpc', name: 'Get MPC metrics', requiresAuth: true },
  { method: 'GET', path: '/api/security/events', name: 'Get security events', requiresAuth: true },
  { method: 'GET', path: '/api/security/wallet-guard/threats', name: 'Get Wallet Guard threats', requiresAuth: true },
  
  // AI Assistant
  { method: 'GET', path: '/api/ai/health', name: 'AI health check' },
  { method: 'POST', path: '/api/ai/chat', name: 'AI chat', requiresAuth: true, body: { message: 'Hello', conversationHistory: [] } },
  
  // Transaction History
  { method: 'GET', path: '/api/transactions/', name: 'Get transactions', requiresAuth: true },
  { method: 'GET', path: '/api/transactions/stats/summary', name: 'Get transaction stats', requiresAuth: true },
  
  // Settings
  { method: 'GET', path: '/api/settings/', name: 'Get settings', requiresAuth: true },
  { method: 'GET', path: '/api/settings/app-version', name: 'Get app version' },
  
  // Notifications
  { method: 'GET', path: '/api/notifications/', name: 'Get notifications', requiresAuth: true },
  { method: 'GET', path: '/api/notifications/badge-count', name: 'Get badge count', requiresAuth: true },
  
  // Biometric
  { method: 'GET', path: '/api/biometric/status', name: 'Get biometric status', requiresAuth: true },
  
  // Support
  { method: 'GET', path: '/api/support/help', name: 'Get help articles' },
  { method: 'GET', path: '/api/support/status', name: 'Get system status' },
  
  // Legal
  { method: 'GET', path: '/api/legal/terms-of-service', name: 'Get terms of service' },
  { method: 'GET', path: '/api/legal/privacy-policy', name: 'Get privacy policy' },
  { method: 'GET', path: '/api/legal/versions', name: 'Get legal versions' },
  
  // Fiat On-Ramp
  { method: 'GET', path: '/api/fiat/providers', name: 'Get fiat providers' },
  
  // DEX Aggregator
  { method: 'POST', path: '/api/swaps/aggregators', name: 'Get swap aggregator quotes', requiresAuth: true, body: { fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', toToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', amount: '1000000000000000000', fromAddress: '0x0000000000000000000000000000000000000000', chainId: 1 } },
  
  // Cross-Chain Swaps
  { method: 'POST', path: '/api/cross-chain/routes', name: 'Get cross-chain routes', requiresAuth: true, body: { fromChainId: 1, toChainId: 137, fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', toToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', amount: '1000000000000000000', fromAddress: '0x0000000000000000000000000000000000000000' } },
  
  // NFT Gallery
  { method: 'POST', path: '/api/nft/gallery', name: 'Get NFT gallery', requiresAuth: true, body: { walletAddress: '0x0000000000000000000000000000000000000000' } },
  
  // Market Data
  { method: 'POST', path: '/api/market/prices', name: 'Get market prices', requiresAuth: true, body: { tokens: [{ address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', chainId: 1 }] } },
  { method: 'GET', path: '/api/market/pendle/markets', name: 'Get Pendle markets', requiresAuth: true },
  
  // MEV Protection Service (v1)
  { method: 'GET', path: '/api/v1/protection/status', name: 'Get protection status', requiresAuth: true },
  { method: 'GET', path: '/api/v1/stats', name: 'Get protection stats', requiresAuth: true },
  { method: 'GET', path: '/api/v1/dashboard', name: 'Get dashboard', requiresAuth: true },
  { method: 'GET', path: '/api/v1/networks', name: 'Get networks', requiresAuth: true },
  { method: 'GET', path: '/api/v1/threats', name: 'Get threats', requiresAuth: true },
  { method: 'GET', path: '/api/v1/relays', name: 'Get relays', requiresAuth: true },
  { method: 'GET', path: '/api/v1/mev/metrics', name: 'Get MEV metrics', requiresAuth: true },
  
  // Enhanced MEV API
  { method: 'GET', path: '/status', name: 'Get protection status (enhanced)' },
  { method: 'GET', path: '/api/v1/kpi/metrics', name: 'Get KPI metrics', requiresAuth: true },
  { method: 'GET', path: '/api/v1/analytics/dashboard', name: 'Get analytics dashboard', requiresAuth: true },
  
  // Cross-Chain Bridge Service
  { method: 'GET', path: '/api/v1/bridge/metrics', name: 'Get bridge metrics' },
  { method: 'GET', path: '/api/v1/bridge/list', name: 'List bridges' },
  { method: 'GET', path: '/api/v1/network/status', name: 'Get network status' },
  { method: 'GET', path: '/api/v1/network/supported', name: 'Get supported networks' },
  { method: 'GET', path: '/api/v1/vulnerability/threats', name: 'Get vulnerability threats' },
  { method: 'GET', path: '/api/v1/security/dashboard', name: 'Get security dashboard', requiresAuth: true },
];

interface TestResult {
  endpoint: Endpoint;
  status: number;
  success: boolean;
  error?: string;
  responseTime: number;
}

async function testEndpoint(endpoint: Endpoint): Promise<TestResult> {
  const startTime = Date.now();
  const url = new URL(`${API_BASE}${endpoint.path}`);
  
  // Add query params if provided
  if (endpoint.params) {
    Object.entries(endpoint.params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  };
  
  if (endpoint.requiresAuth && AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }
  
  try {
    const response = await fetch(url.toString(), {
      method: endpoint.method,
      headers,
      body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
    });
    
    const responseTime = Date.now() - startTime;
    const success = response.status === 200;
    
    let error: string | undefined;
    if (!success) {
      try {
        const errorData = await response.json();
        error = errorData.error || errorData.detail || `Status ${response.status}`;
      } catch {
        error = `Status ${response.status}`;
      }
    }
    
    return {
      endpoint,
      status: response.status,
      success,
      error,
      responseTime,
    };
  } catch (err) {
    const responseTime = Date.now() - startTime;
    return {
      endpoint,
      status: 0,
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      responseTime,
    };
  }
}

async function runTests() {
  console.log('🚀 Starting comprehensive endpoint tests...\n');
  console.log(`API Base URL: ${API_BASE}`);
  console.log(`Total endpoints to test: ${endpoints.length}\n`);
  
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const endpoint of endpoints) {
    // Skip auth-required endpoints if no token provided
    if (endpoint.requiresAuth && !AUTH_TOKEN) {
      console.log(`⏭️  SKIPPED: ${endpoint.name} (${endpoint.method} ${endpoint.path}) - No auth token`);
      skipped++;
      continue;
    }
    
    process.stdout.write(`Testing: ${endpoint.name}... `);
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ PASSED (${result.status}) - ${result.responseTime}ms`);
      passed++;
    } else {
      console.log(`❌ FAILED (${result.status}) - ${result.error || 'Unknown error'} - ${result.responseTime}ms`);
      failed++;
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);
  console.log('='.repeat(80));
  
  if (failed > 0) {
    console.log('\n❌ FAILED ENDPOINTS:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  - ${r.endpoint.name} (${r.endpoint.method} ${r.endpoint.path})`);
        console.log(`    Status: ${r.status}, Error: ${r.error || 'Unknown'}`);
      });
  }
  
  // Return exit code based on results
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

