// Simple test runner with explicit output
import dotenv from 'dotenv';
import { logger } from '../services/logger.service';
import axios from 'axios';

dotenv.config();

const API_BASE = 'http://localhost:3001/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test123!';

logger.info('\n🧪 COMPREHENSIVE SYSTEM TEST\n');
logger.info('='.repeat(60));

let accessToken: string | null = null;

async function main() {
  // Test 1: Check backend
  logger.info('\n[1] Checking backend...');
  try {
    await axios.get('http://localhost:3001/health');
    logger.info('   ✅ Backend is running');
  } catch (error: any) {
    logger.info('   ❌ Backend not running:', error.message);
    logger.info('   Start it with: npm run dev');
    process.exit(1);
  }

  // Test 2: Authenticate
  logger.info('\n[2] Authenticating...');
  try {
    await axios.post(`${API_BASE}/auth/register`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      displayName: 'Test User',
    }).catch(() => {});
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    accessToken = response.data.accessToken;
    logger.info('   ✅ Authenticated');
  } catch (error: any) {
    logger.info('   ❌ Auth failed:', error.message);
    process.exit(1);
  }

  const tests = [
    { name: 'User Profile', method: 'GET', path: '/user/profile' },
    { name: 'List Guardians', method: 'GET', path: '/guardians' },
    { name: 'Add Guardian', method: 'POST', path: '/guardians', data: { email: 'guardian1@example.com', name: 'Guardian One' } },
    { name: 'List Beneficiaries', method: 'GET', path: '/beneficiaries' },
    { name: 'Add Beneficiary', method: 'POST', path: '/beneficiaries', data: { name: 'Beneficiary One', email: 'ben1@example.com', percentage: 50 } },
    { name: 'Get Tokens', method: 'GET', path: '/defi/tokens?chainId=1' },
    { name: 'Get Yield Adapters', method: 'GET', path: '/defi/yield-adapters' },
    { name: 'List Yield Vaults', method: 'GET', path: '/defi/yield-vaults' },
    { name: 'Create Yield Vault', method: 'POST', path: '/defi/yield-vaults', data: { name: 'Test Vault', strategy: 'lido' } },
  ];

  logger.info('\n[3] Testing Endpoints...\n');
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const config: any = {
        method: test.method,
        url: `${API_BASE}${test.path}`,
        headers: { Authorization: `Bearer ${accessToken}` },
      };
      if (test.data) config.data = test.data;

      const response = await axios(config);
      logger.info(`   ✅ ${test.name} - Status ${response.status}`);
      passed++;
    } catch (error: any) {
      const status = error.response?.status || 'ERROR';
      logger.info(`   ${status === 401 ? '⚠️' : '❌'} ${test.name} - ${status}: ${error.response?.data?.error || error.message}`);
      if (status !== 401) failed++;
    }
  }

  logger.info('\n' + '='.repeat(60));
  logger.info(`\n📊 Results: ✅ ${passed} passed | ❌ ${failed} failed\n`);
}

main().catch(console.error);

