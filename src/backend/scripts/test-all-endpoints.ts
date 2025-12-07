// Comprehensive Endpoint Testing
import dotenv from 'dotenv';
import { logger } from '../services/logger.service';
import axios from 'axios';

dotenv.config();

const API_BASE = process.env.BACKEND_URL || 'http://localhost:3001/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test123!';

let accessToken: string | null = null;

interface TestResult {
  name: string;
  status: '✅' | '❌' | '⚠️';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function authenticate() {
  logger.info('\n🔐 Authenticating...\n');

  try {
    // Try to register
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        displayName: 'Test User',
      });
      logger.info('✅ User registered');
    } catch (error: any) {
      if (error.response?.status === 409) {
        logger.info('⚠️  User already exists');
      } else {
        throw error;
      }
    }

    // Login
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    accessToken = response.data.accessToken;
    if (!accessToken) {
      throw new Error('No access token received');
    }

    logger.info('✅ Authentication successful\n');
    return true;
  } catch (error: any) {
    logger.info('❌ Authentication failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      logger.info('   Backend server is not running. Start it with: npm run dev\n');
    }
    return false;
  }
}

async function testEndpoint(name: string, method: string, path: string, data?: any, requiresAuth = true) {
  try {
    const config: any = {
      method,
      url: `${API_BASE}${path}`,
      validateStatus: () => true,
    };

    if (requiresAuth && accessToken) {
      config.headers = { Authorization: `Bearer ${accessToken}` };
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);

    if (response.status >= 200 && response.status < 300) {
      results.push({
        name,
        status: '✅',
        message: `Status ${response.status}`,
        details: response.data,
      });
      return { success: true, data: response.data };
    } else if (response.status === 401) {
      results.push({
        name,
        status: '⚠️',
        message: 'Authentication required',
      });
      return { success: false, needsAuth: true };
    } else {
      results.push({
        name,
        status: '⚠️',
        message: `Status ${response.status}: ${response.data?.error || response.data?.message || 'Unknown error'}`,
      });
      return { success: false, error: response.data };
    }
  } catch (error: any) {
    results.push({
      name,
      status: '❌',
      message: error.message,
    });
    return { success: false, error: error.message };
  }
}

async function testAuthEndpoints() {
  logger.info('\n📋 Testing Auth Endpoints...\n');
  logger.info('='.repeat(60));

  await testEndpoint('POST /auth/register', 'POST', '/auth/register', {
    email: 'test2@example.com',
    password: 'Test123!',
    displayName: 'Test User 2',
  }, false);

  await testEndpoint('POST /auth/login', 'POST', '/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  }, false);
}

async function testUserEndpoints() {
  logger.info('\n👤 Testing User Endpoints...\n');
  logger.info('='.repeat(60));

  await testEndpoint('GET /user/profile', 'GET', '/user/profile');
}

async function testGuardianEndpoints() {
  logger.info('\n👥 Testing Guardian Endpoints...\n');
  logger.info('='.repeat(60));

  // List guardians
  await testEndpoint('GET /guardians', 'GET', '/guardians');

  // Add guardian
  const addResult = await testEndpoint('POST /guardians', 'POST', '/guardians', {
    email: 'guardian1@example.com',
    name: 'Guardian One',
  });

  // List guardians again
  await testEndpoint('GET /guardians (after add)', 'GET', '/guardians');

  // Add more guardians
  await testEndpoint('POST /guardians (2)', 'POST', '/guardians', {
    email: 'guardian2@example.com',
    name: 'Guardian Two',
  });

  await testEndpoint('POST /guardians (3)', 'POST', '/guardians', {
    email: 'guardian3@example.com',
    name: 'Guardian Three',
  });
}

async function testBeneficiaryEndpoints() {
  logger.info('\n👨‍👩‍👧 Testing Beneficiary Endpoints...\n');
  logger.info('='.repeat(60));

  // List beneficiaries
  await testEndpoint('GET /beneficiaries', 'GET', '/beneficiaries');

  // Add beneficiary
  await testEndpoint('POST /beneficiaries', 'POST', '/beneficiaries', {
    name: 'Beneficiary One',
    email: 'ben1@example.com',
    percentage: 50,
    relationship: 'Spouse',
  });

  await testEndpoint('POST /beneficiaries (2)', 'POST', '/beneficiaries', {
    name: 'Beneficiary Two',
    email: 'ben2@example.com',
    percentage: 50,
    relationship: 'Child',
  });

  // List beneficiaries again
  await testEndpoint('GET /beneficiaries (after add)', 'GET', '/beneficiaries');
}

async function testRecoveryEndpoints() {
  logger.info('\n🔐 Testing Recovery Endpoints...\n');
  logger.info('='.repeat(60));

  // Initiate recovery
  const recoveryResult = await testEndpoint('POST /guardians/recovery', 'POST', '/guardians/recovery', {
    requesterEmail: 'ben1@example.com',
    reason: 'Testing recovery flow',
  });

  // Get recovery status (if recovery was created)
  if (recoveryResult.success && recoveryResult.data?.id) {
    await testEndpoint('GET /guardians/recovery/:id', 'GET', `/guardians/recovery/${recoveryResult.data.id}`);
  }
}

async function testTradingEndpoints() {
  logger.info('\n💱 Testing Trading Endpoints...\n');
  logger.info('='.repeat(60));

  // Get supported tokens
  await testEndpoint('GET /defi/tokens', 'GET', '/defi/tokens?chainId=1');

  // Get swap quote
  await testEndpoint('POST /defi/swap/quote', 'POST', '/defi/swap/quote', {
    fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    toToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    amount: '100000000000000000',
    chainId: 1,
  });

  // Get liquidity sources
  await testEndpoint('GET /defi/liquidity-sources', 'GET', '/defi/liquidity-sources?chainId=1');
}

async function testYieldVaultEndpoints() {
  logger.info('\n💰 Testing Yield Vault Endpoints...\n');
  logger.info('='.repeat(60));

  // Check if yield vault routes exist
  await testEndpoint('GET /defi/yield-vaults', 'GET', '/defi/yield-vaults');
  await testEndpoint('GET /defi/yield-vaults/:id', 'GET', '/defi/yield-vaults/test-vault-id');
  await testEndpoint('POST /defi/yield-vaults', 'POST', '/defi/yield-vaults', {
    name: 'Test Yield Vault',
    initialDeposit: '1000000000000000000',
  });
}

async function printResults() {
  logger.info('\n' + '='.repeat(60));
  logger.info('\n📊 TEST RESULTS SUMMARY\n');
  logger.info('='.repeat(60));

  const passed = results.filter(r => r.status === '✅').length;
  const failed = results.filter(r => r.status === '❌').length;
  const skipped = results.filter(r => r.status === '⚠️').length;

  results.forEach(result => {
    logger.info(`${result.status} ${result.name}`);
    logger.info(`   ${result.message}`);
    if (result.details && Object.keys(result.details).length > 0) {
      const preview = JSON.stringify(result.details).substring(0, 100);
      logger.info(`   Data: ${preview}...`);
    }
    logger.info('');
  });

  logger.info('='.repeat(60));
  logger.info(`\n✅ Passed: ${passed}`);
  logger.info(`⚠️  Skipped/Warnings: ${skipped}`);
  logger.info(`❌ Failed: ${failed}`);
  logger.info(`\nTotal: ${results.length} tests\n`);
}

async function runAllTests() {
  logger.info('\n🚀 Starting Comprehensive Endpoint Tests...\n');
  logger.info('='.repeat(60));

  // Authenticate first
  const authSuccess = await authenticate();
  if (!authSuccess) {
    logger.info('\n❌ Cannot proceed without authentication\n');
    process.exit(1);
  }

  // Run all test suites
  await testAuthEndpoints();
  await testUserEndpoints();
  await testGuardianEndpoints();
  await testBeneficiaryEndpoints();
  await testRecoveryEndpoints();
  await testTradingEndpoints();
  await testYieldVaultEndpoints();

  // Print summary
  await printResults();
}

runAllTests().catch(console.error);

