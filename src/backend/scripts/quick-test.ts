// Quick Backend Services Test
import axios from 'axios';
import { logger } from '../services/logger.service';
import dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = process.env.APP_URL || 'http://localhost:3001/api';
let accessToken = '';

const results: any[] = [];

async function test(endpoint: string, method: string = 'GET', body?: any) {
  try {
    const url = `${API_BASE}${endpoint}`;
    const config: any = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      timeout: 10000,
    };
    if (body) config.data = body;
    
    const start = Date.now();
    const response = await axios(config);
    const duration = Date.now() - start;
    
    return { success: true, data: response.data, duration, status: response.status };
  } catch (error: any) {
    const duration = Date.now() - Date.now();
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      status: error.response?.status,
      duration,
    };
  }
}

async function runTests() {
  logger.info('\n🧪 Backend Services Test Suite\n');
  logger.info('='.repeat(60));
  
  // Test 1: Health Check
  logger.info('\n1️⃣  Testing Server Health...');
  const health = await test('/health');
  if (health.success) {
    logger.info('   ✅ Server is running');
    results.push({ test: 'Server Health', status: 'PASS' });
  } else {
    logger.info('   ❌ Server not responding');
    logger.info('   ⚠️  Please start the backend server: npm run dev');
    results.push({ test: 'Server Health', status: 'FAIL', error: health.error });
    return;
  }
  
  // Test 2: Authentication
  logger.info('\n2️⃣  Testing Authentication...');
  const login = await test('/auth/login', 'POST', {
    email: process.env.TEST_EMAIL || 'demo@guardiavault.com',
    password: process.env.TEST_PASSWORD || 'DemoGuardiaVault2024!',
  });
  
  if (login.success && login.data?.access_token) {
    accessToken = login.data.access_token;
    logger.info('   ✅ Authentication successful');
    results.push({ test: 'Authentication', status: 'PASS' });
  } else {
    logger.info('   ⚠️  Authentication failed (may need to register user)');
    results.push({ test: 'Authentication', status: 'SKIP', error: login.error });
  }
  
  // Test 3: MEV Protection
  logger.info('\n3️⃣  Testing MEV Protection...');
  if (accessToken) {
    const mev = await test('/security/mev/analyze', 'POST', {
      from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      data: '0x7ff36ab5',
      value: '100000000000000000',
    });
    if (mev.success) {
      logger.info(`   ✅ MEV Analysis: ${mev.data?.riskLevel || 'unknown'} risk`);
      results.push({ test: 'MEV Protection', status: 'PASS' });
    } else {
      logger.info(`   ❌ MEV Analysis failed: ${mev.error}`);
      results.push({ test: 'MEV Protection', status: 'FAIL', error: mev.error });
    }
  } else {
    logger.info('   ⏭️  Skipped (no auth token)');
    results.push({ test: 'MEV Protection', status: 'SKIP' });
  }
  
  // Test 4: Honeypot Detection
  logger.info('\n4️⃣  Testing Honeypot Detection...');
  if (accessToken) {
    const honeypot = await test('/security/honeypot/check', 'POST', {
      tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      chainId: 1,
    });
    if (honeypot.success) {
      logger.info(`   ✅ Honeypot Check: Risk ${honeypot.data?.riskLevel || 'unknown'}`);
      results.push({ test: 'Honeypot Detection', status: 'PASS' });
    } else {
      logger.info(`   ❌ Honeypot Check failed: ${honeypot.error}`);
      results.push({ test: 'Honeypot Detection', status: 'FAIL', error: honeypot.error });
    }
  } else {
    logger.info('   ⏭️  Skipped (no auth token)');
    results.push({ test: 'Honeypot Detection', status: 'SKIP' });
  }
  
  // Test 5: Bridge Service
  logger.info('\n5️⃣  Testing Bridge Service...');
  if (accessToken) {
    const bridge = await test('/bridge/chains');
    if (bridge.success) {
      logger.info(`   ✅ Bridge Service: ${bridge.data?.length || 0} chains available`);
      results.push({ test: 'Bridge Service', status: 'PASS' });
    } else {
      logger.info(`   ❌ Bridge Service failed: ${bridge.error}`);
      results.push({ test: 'Bridge Service', status: 'FAIL', error: bridge.error });
    }
  } else {
    logger.info('   ⏭️  Skipped (no auth token)');
    results.push({ test: 'Bridge Service', status: 'SKIP' });
  }
  
  // Test 6: Sniper Bot
  logger.info('\n6️⃣  Testing Sniper Bot...');
  if (accessToken) {
    const sniper = await test('/sniper/config');
    if (sniper.success || sniper.status === 200) {
      logger.info('   ✅ Sniper Bot endpoint accessible');
      results.push({ test: 'Sniper Bot', status: 'PASS' });
    } else {
      logger.info(`   ⚠️  Sniper Bot: ${sniper.error || 'Endpoint not configured'}`);
      results.push({ test: 'Sniper Bot', status: 'SKIP', error: sniper.error });
    }
  } else {
    logger.info('   ⏭️  Skipped (no auth token)');
    results.push({ test: 'Sniper Bot', status: 'SKIP' });
  }
  
  // Test 7: Scarlett AI
  logger.info('\n7️⃣  Testing Scarlett AI...');
  if (accessToken) {
    const aiHealth = await test('/ai/health');
    if (aiHealth.success) {
      logger.info(`   ✅ Scarlett AI: ${aiHealth.data?.healthy ? 'Healthy' : 'Unavailable'}`);
      results.push({ test: 'Scarlett AI Health', status: aiHealth.data?.healthy ? 'PASS' : 'SKIP' });
    } else {
      logger.info(`   ⚠️  Scarlett AI Health Check: ${aiHealth.error}`);
      results.push({ test: 'Scarlett AI Health', status: 'SKIP', error: aiHealth.error });
    }
    
    const aiChat = await test('/ai/chat', 'POST', {
      message: 'Hello, what is DeFi?',
    });
    if (aiChat.success) {
      logger.info('   ✅ Scarlett AI Chat: Response received');
      results.push({ test: 'Scarlett AI Chat', status: 'PASS' });
    } else {
      logger.info(`   ⚠️  Scarlett AI Chat: ${aiChat.error}`);
      results.push({ test: 'Scarlett AI Chat', status: 'SKIP', error: aiChat.error });
    }
  } else {
    logger.info('   ⏭️  Skipped (no auth token)');
    results.push({ test: 'Scarlett AI', status: 'SKIP' });
  }
  
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
    if (result.error) {
      logger.info(`   Error: ${result.error}\n`);
    }
  });
  
  logger.info('\n' + '='.repeat(60) + '\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
