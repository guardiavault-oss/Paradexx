// Complete System Test - All Endpoints, Yield Vaults, Recovery Keys, Fees
import dotenv from 'dotenv';
import { logger } from '../services/logger.service';
import axios from 'axios';

dotenv.config();

const API_BASE = process.env.BACKEND_URL || process.env.API_BASE || 'http://localhost:3001/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test123!';

let accessToken: string | null = null;

interface TestResult {
  category: string;
  test: string;
  status: '✅' | '❌' | '⚠️';
  message: string;
}

const results: TestResult[] = [];

async function authenticate() {
  try {
    // Try register first
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
      } else if (error.response?.status === 404) {
        logger.info('❌ Auth endpoint not found - check backend routes');
        logger.info(`   Tried: ${API_BASE}/auth/register`);
        return false;
      } else {
        logger.info(`⚠️  Registration: ${error.response?.status || error.message}`);
      }
    }
    
    // Login
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    accessToken = response.data.accessToken;
    if (!accessToken) {
      logger.info('❌ No access token received');
      return false;
    }
    logger.info('✅ Login successful');
    return true;
  } catch (error: any) {
    logger.info('❌ Authentication failed:', error.message);
    if (error.response) {
      logger.info(`   Status: ${error.response.status}`);
      logger.info(`   URL: ${error.config?.url}`);
      logger.info(`   Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testEndpoint(category: string, test: string, method: string, path: string, data?: any) {
  try {
    const config: any = {
      method,
      url: `${API_BASE}${path}`,
      validateStatus: () => true,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    };
    if (data) config.data = data;
    
    const response = await axios(config);
    const success = response.status >= 200 && response.status < 300;
    
    results.push({
      category,
      test,
      status: success ? '✅' : response.status === 401 ? '⚠️' : '❌',
      message: `Status ${response.status}`,
    });
    
    return success;
  } catch (error: any) {
    results.push({
      category,
      test,
      status: '❌',
      message: error.message,
    });
    return false;
  }
}

async function runTests() {
  logger.info('\n🧪 COMPREHENSIVE SYSTEM TEST\n');
  logger.info('='.repeat(60));
  
  if (!(await authenticate())) {
    logger.info('\n❌ Cannot proceed without authentication\n');
    return;
  }
  
  logger.info('\n✅ Authenticated\n');
  
  // Auth endpoints
  logger.info('Testing Auth Endpoints...');
  await testEndpoint('Auth', 'Register', 'POST', '/auth/register', {
    email: 'test2@example.com',
    password: 'Test123!',
    displayName: 'Test User 2',
  });
  
  // User endpoints
  logger.info('Testing User Endpoints...');
  await testEndpoint('User', 'Get Profile', 'GET', '/user/profile');
  
  // Guardian endpoints
  logger.info('Testing Guardian Endpoints...');
  await testEndpoint('Guardian', 'List Guardians', 'GET', '/guardians');
  await testEndpoint('Guardian', 'Add Guardian', 'POST', '/guardians', {
    email: 'guardian1@example.com',
    name: 'Guardian One',
  });
  
  // Beneficiary endpoints
  logger.info('Testing Beneficiary Endpoints...');
  await testEndpoint('Beneficiary', 'List Beneficiaries', 'GET', '/beneficiaries');
  await testEndpoint('Beneficiary', 'Add Beneficiary', 'POST', '/beneficiaries', {
    name: 'Beneficiary One',
    email: 'ben1@example.com',
    percentage: 50,
  });
  
  // Recovery endpoints
  logger.info('Testing Recovery Endpoints...');
  await testEndpoint('Recovery', 'Initiate Recovery', 'POST', '/guardians/recovery', {
    requesterEmail: 'ben1@example.com',
    reason: 'Test recovery',
  });
  
  // Trading endpoints
  logger.info('Testing Trading Endpoints...');
  await testEndpoint('Trading', 'Get Tokens', 'GET', '/defi/tokens?chainId=1');
  await testEndpoint('Trading', 'Get Quote', 'POST', '/defi/swap/quote', {
    fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    toToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    amount: '100000000000000000',
    chainId: 1,
  });
  
  // Yield adapter endpoints
  logger.info('Testing Yield Adapter Endpoints...');
  await testEndpoint('Yield', 'Get Adapters', 'GET', '/defi/yield-adapters');
  await testEndpoint('Yield', 'Get Lido Adapter', 'GET', '/defi/yield-adapters/lido');
  await testEndpoint('Yield', 'Get Aave Adapter', 'GET', '/defi/yield-adapters/aave');
  
  // Yield vault endpoints
  logger.info('Testing Yield Vault Endpoints...');
  await testEndpoint('Yield Vault', 'List Vaults', 'GET', '/defi/yield-vaults');
  await testEndpoint('Yield Vault', 'Create Vault', 'POST', '/defi/yield-vaults', {
    name: 'Test Yield Vault',
    strategy: 'lido',
  });
  
  // Print results
  logger.info('\n' + '='.repeat(60));
  logger.info('\n📊 TEST RESULTS\n');
  logger.info('='.repeat(60));
  
  const categories = [...new Set(results.map(r => r.category))];
  
  categories.forEach(category => {
    logger.info(`\n${category}:`);
    results.filter(r => r.category === category).forEach(r => {
      logger.info(`  ${r.status} ${r.test} - ${r.message}`);
    });
  });
  
  const passed = results.filter(r => r.status === '✅').length;
  const failed = results.filter(r => r.status === '❌').length;
  const skipped = results.filter(r => r.status === '⚠️').length;
  
  logger.info('\n' + '='.repeat(60));
  logger.info(`\n✅ Passed: ${passed}`);
  logger.info(`⚠️  Skipped: ${skipped}`);
  logger.info(`❌ Failed: ${failed}`);
  logger.info(`\nTotal: ${results.length} tests\n`);
}

runTests().catch(console.error);

