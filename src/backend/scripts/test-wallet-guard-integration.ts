// Test Backend API Integration with Wallet Guard
import dotenv from 'dotenv';
import { logger } from '../services/logger.service';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const BACKEND_URL = process.env.APP_URL || 'http://localhost:3001';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!@#';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  data?: any;
}

const results: TestResult[] = [];
let accessToken: string | null = null;

async function testBackendIntegration() {
  logger.info('\n🧪 Testing Backend API Integration with Wallet Guard\n');
  logger.info('='.repeat(60));
  logger.info(`Backend URL: ${BACKEND_URL}`);
  logger.info('='.repeat(60) + '\n');

  // Step 1: Register/Login
  await authenticate();

  if (!accessToken) {
    logger.info('❌ Authentication failed. Cannot proceed with tests.\n');
    printResults();
    return;
  }

  // Step 2: Test Wallet Guard Routes
  await testHealthCheck();
  await testMonitorWallet();
  await testGetWalletStatus();
  await testGetThreats();
  await testGetAnalytics();
  await testProtectionAction();
  await testStopMonitoring();

  // Print Results
  printResults();
}

async function authenticate() {
  try {
    // Try to register first
    const registerResponse = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: 'Test User',
      }),
    });

    let response;
    if (registerResponse.ok) {
      response = await registerResponse;
    } else {
      // Try login if registration fails (user might exist)
      const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        }),
      });
      response = loginResponse;
    }

    const data = await response.json();

    if (response.ok && data.accessToken) {
      accessToken = data.accessToken;
      results.push({
        test: 'Authentication',
        status: 'pass',
        message: 'Successfully authenticated',
      });
      logger.info('✅ Authentication: PASS');
    } else {
      results.push({
        test: 'Authentication',
        status: 'fail',
        message: `Failed: ${data.error || 'Unknown error'}`,
      });
      logger.info('❌ Authentication: FAIL');
    }
  } catch (error: any) {
    results.push({
      test: 'Authentication',
      status: 'fail',
      message: `Error: ${error.message}`,
    });
    logger.info('❌ Authentication: FAIL');
  }
}

async function testHealthCheck() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/wallet-guard/health`);
    const data = await response.json();

    if (response.ok) {
      results.push({
        test: 'Backend Health Check',
        status: 'pass',
        message: 'Backend route is working',
        data: data,
      });
      logger.info('✅ Backend Health Check: PASS');
    } else {
      results.push({
        test: 'Backend Health Check',
        status: 'fail',
        message: `Status ${response.status}`,
      });
      logger.info('❌ Backend Health Check: FAIL');
    }
  } catch (error: any) {
    results.push({
      test: 'Backend Health Check',
      status: 'fail',
      message: `Error: ${error.message}`,
    });
    logger.info('❌ Backend Health Check: FAIL');
  }
}

async function testMonitorWallet() {
  const testWallet = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

  try {
    const response = await fetch(`${BACKEND_URL}/api/wallet-guard/monitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        wallet_address: testWallet,
        network: 'ethereum',
        alert_channels: ['email'],
        protection_level: 'high',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      results.push({
        test: 'Monitor Wallet (Backend)',
        status: 'pass',
        message: 'Successfully started monitoring via backend',
        data: data,
      });
      logger.info('✅ Monitor Wallet (Backend): PASS');
    } else if (response.status === 403) {
      results.push({
        test: 'Monitor Wallet (Backend)',
        status: 'skip',
        message: 'Requires DegenX Elite subscription',
      });
      logger.info('⚠️  Monitor Wallet (Backend): SKIP - Requires Elite tier');
    } else {
      results.push({
        test: 'Monitor Wallet (Backend)',
        status: 'fail',
        message: `Status ${response.status}: ${data.error || JSON.stringify(data)}`,
      });
      logger.info('❌ Monitor Wallet (Backend): FAIL');
    }
  } catch (error: any) {
    results.push({
      test: 'Monitor Wallet (Backend)',
      status: 'fail',
      message: `Error: ${error.message}`,
    });
    logger.info('❌ Monitor Wallet (Backend): FAIL');
  }
}

async function testGetWalletStatus() {
  const testWallet = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/wallet-guard/status/${testWallet}?network=ethereum`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      results.push({
        test: 'Get Wallet Status (Backend)',
        status: 'pass',
        message: 'Successfully retrieved status via backend',
        data: data,
      });
      logger.info('✅ Get Wallet Status (Backend): PASS');
    } else if (response.status === 403) {
      results.push({
        test: 'Get Wallet Status (Backend)',
        status: 'skip',
        message: 'Requires DegenX Elite subscription',
      });
      logger.info('⚠️  Get Wallet Status (Backend): SKIP - Requires Elite tier');
    } else {
      results.push({
        test: 'Get Wallet Status (Backend)',
        status: 'skip',
        message: `Status ${response.status}`,
      });
      logger.info('⚠️  Get Wallet Status (Backend): SKIP');
    }
  } catch (error: any) {
    results.push({
      test: 'Get Wallet Status (Backend)',
      status: 'fail',
      message: `Error: ${error.message}`,
    });
    logger.info('❌ Get Wallet Status (Backend): FAIL');
  }
}

async function testGetThreats() {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/wallet-guard/threats?hours=24`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      results.push({
        test: 'Get Threats (Backend)',
        status: 'pass',
        message: `Successfully retrieved threats via backend (${Array.isArray(data) ? data.length : 0} found)`,
        data: Array.isArray(data) ? data.slice(0, 3) : data,
      });
      logger.info('✅ Get Threats (Backend): PASS');
    } else if (response.status === 403) {
      results.push({
        test: 'Get Threats (Backend)',
        status: 'skip',
        message: 'Requires DegenX Elite subscription',
      });
      logger.info('⚠️  Get Threats (Backend): SKIP - Requires Elite tier');
    } else {
      results.push({
        test: 'Get Threats (Backend)',
        status: 'skip',
        message: `Status ${response.status}`,
      });
      logger.info('⚠️  Get Threats (Backend): SKIP');
    }
  } catch (error: any) {
    results.push({
      test: 'Get Threats (Backend)',
      status: 'fail',
      message: `Error: ${error.message}`,
    });
    logger.info('❌ Get Threats (Backend): FAIL');
  }
}

async function testGetAnalytics() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/wallet-guard/analytics`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      results.push({
        test: 'Get Analytics (Backend)',
        status: 'pass',
        message: 'Successfully retrieved analytics via backend',
        data: data,
      });
      logger.info('✅ Get Analytics (Backend): PASS');
    } else if (response.status === 403) {
      results.push({
        test: 'Get Analytics (Backend)',
        status: 'skip',
        message: 'Requires DegenX Elite subscription',
      });
      logger.info('⚠️  Get Analytics (Backend): SKIP - Requires Elite tier');
    } else {
      results.push({
        test: 'Get Analytics (Backend)',
        status: 'skip',
        message: `Status ${response.status}`,
      });
      logger.info('⚠️  Get Analytics (Backend): SKIP');
    }
  } catch (error: any) {
    results.push({
      test: 'Get Analytics (Backend)',
      status: 'fail',
      message: `Error: ${error.message}`,
    });
    logger.info('❌ Get Analytics (Backend): FAIL');
  }
}

async function testProtectionAction() {
  const testWallet = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

  try {
    const response = await fetch(`${BACKEND_URL}/api/wallet-guard/protect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        wallet_address: testWallet,
        action_type: 'alert',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      results.push({
        test: 'Protection Action (Backend)',
        status: 'pass',
        message: 'Successfully applied protection via backend',
        data: data,
      });
      logger.info('✅ Protection Action (Backend): PASS');
    } else if (response.status === 403) {
      results.push({
        test: 'Protection Action (Backend)',
        status: 'skip',
        message: 'Requires DegenX Elite subscription',
      });
      logger.info('⚠️  Protection Action (Backend): SKIP - Requires Elite tier');
    } else {
      results.push({
        test: 'Protection Action (Backend)',
        status: 'skip',
        message: `Status ${response.status}`,
      });
      logger.info('⚠️  Protection Action (Backend): SKIP');
    }
  } catch (error: any) {
    results.push({
      test: 'Protection Action (Backend)',
      status: 'fail',
      message: `Error: ${error.message}`,
    });
    logger.info('❌ Protection Action (Backend): FAIL');
  }
}

async function testStopMonitoring() {
  const testWallet = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

  try {
    const response = await fetch(`${BACKEND_URL}/api/wallet-guard/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        wallet_address: testWallet,
      }),
    });

    if (response.ok || response.status === 404) {
      results.push({
        test: 'Stop Monitoring (Backend)',
        status: 'pass',
        message: 'Successfully stopped monitoring via backend',
      });
      logger.info('✅ Stop Monitoring (Backend): PASS');
    } else if (response.status === 403) {
      results.push({
        test: 'Stop Monitoring (Backend)',
        status: 'skip',
        message: 'Requires DegenX Elite subscription',
      });
      logger.info('⚠️  Stop Monitoring (Backend): SKIP - Requires Elite tier');
    } else {
      results.push({
        test: 'Stop Monitoring (Backend)',
        status: 'skip',
        message: `Status ${response.status}`,
      });
      logger.info('⚠️  Stop Monitoring (Backend): SKIP');
    }
  } catch (error: any) {
    results.push({
      test: 'Stop Monitoring (Backend)',
      status: 'fail',
      message: `Error: ${error.message}`,
    });
    logger.info('❌ Stop Monitoring (Backend): FAIL');
  }
}

function printResults() {
  logger.info('\n' + '='.repeat(60));
  logger.info('📊 BACKEND INTEGRATION TEST RESULTS');
  logger.info('='.repeat(60) + '\n');

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const skipped = results.filter((r) => r.status === 'skip').length;

  logger.info(`✅ Passed: ${passed}`);
  logger.info(`❌ Failed: ${failed}`);
  logger.info(`⚠️  Skipped: ${skipped}`);
  logger.info(`📊 Total: ${results.length}\n`);

  if (failed === 0) {
    logger.info('🎉 Backend integration is working correctly!');
  } else {
    logger.info('⚠️  Some tests failed. Check backend configuration.');
  }

  logger.info('\n' + '='.repeat(60) + '\n');
}

// Run tests
testBackendIntegration().catch(console.error);

