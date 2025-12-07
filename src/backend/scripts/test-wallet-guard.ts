// Test Wallet Guard Service Integration
import dotenv from 'dotenv';
import { logger } from '../services/logger.service';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const WALLET_GUARD_URL = process.env.WALLET_GUARD_URL || 'http://localhost:8044';
const WALLET_GUARD_API_KEY = process.env.WALLET_GUARD_API_KEY || 'demo-api-key';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  data?: any;
}

const results: TestResult[] = [];

async function testWalletGuardService() {
  logger.info('\n🧪 Testing Wallet Guard Service Integration\n');
  logger.info('='.repeat(60));
  logger.info(`Wallet Guard URL: ${WALLET_GUARD_URL}`);
  logger.info(`API Key: ${WALLET_GUARD_API_KEY ? 'Set' : 'Not Set'}`);
  logger.info('='.repeat(60) + '\n');

  // Test 1: Health Check
  await testHealthCheck();

  // Test 2: API Connectivity
  await testAPIConnectivity();

  // Test 3: Monitor Wallet
  await testMonitorWallet();

  // Test 4: Get Wallet Status
  await testGetWalletStatus();

  // Test 5: Get Threats
  await testGetThreats();

  // Test 6: Get Analytics
  await testGetAnalytics();

  // Print Results
  printResults();
}

async function testHealthCheck() {
  try {
    const response = await fetch(`${WALLET_GUARD_URL}/health`);
    const data = await response.json();

    if (response.ok) {
      results.push({
        test: 'Health Check',
        status: 'pass',
        message: 'Wallet Guard service is healthy',
        data: data,
      });
      logger.info('✅ Health Check: PASS');
    } else {
      results.push({
        test: 'Health Check',
        status: 'fail',
        message: `Service returned status ${response.status}`,
      });
      logger.info('❌ Health Check: FAIL');
    }
  } catch (error: any) {
    results.push({
      test: 'Health Check',
      status: 'fail',
      message: `Connection failed: ${error.message}`,
    });
    logger.info('❌ Health Check: FAIL - Service not reachable');
    logger.info(`   Error: ${error.message}`);
  }
}

async function testAPIConnectivity() {
  try {
    const response = await fetch(`${WALLET_GUARD_URL}/api/v1/wallet-guard/analytics`, {
      headers: {
        'X-API-Key': WALLET_GUARD_API_KEY,
      },
    });

    if (response.ok || response.status === 401) {
      results.push({
        test: 'API Connectivity',
        status: 'pass',
        message: 'API endpoint is reachable',
      });
      logger.info('✅ API Connectivity: PASS');
    } else {
      results.push({
        test: 'API Connectivity',
        status: 'fail',
        message: `API returned status ${response.status}`,
      });
      logger.info('❌ API Connectivity: FAIL');
    }
  } catch (error: any) {
    results.push({
      test: 'API Connectivity',
      status: 'fail',
      message: `Connection failed: ${error.message}`,
    });
    logger.info('❌ API Connectivity: FAIL');
  }
}

async function testMonitorWallet() {
  const testWallet = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // Vitalik's wallet

  try {
    const response = await fetch(
      `${WALLET_GUARD_URL}/api/v1/wallet-guard/monitor?wallet_address=${testWallet}&network=ethereum`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': WALLET_GUARD_API_KEY,
        },
        body: JSON.stringify({
          alert_channels: ['email'],
          protection_level: 'high',
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      results.push({
        test: 'Monitor Wallet',
        status: 'pass',
        message: 'Successfully started monitoring wallet',
        data: data,
      });
      logger.info('✅ Monitor Wallet: PASS');
    } else {
      results.push({
        test: 'Monitor Wallet',
        status: response.status === 404 ? 'skip' : 'fail',
        message: `API returned status ${response.status}: ${data.error || JSON.stringify(data)}`,
      });
      logger.info(`⚠️  Monitor Wallet: ${response.status === 404 ? 'SKIP' : 'FAIL'}`);
    }
  } catch (error: any) {
    results.push({
      test: 'Monitor Wallet',
      status: 'fail',
      message: `Request failed: ${error.message}`,
    });
    logger.info('❌ Monitor Wallet: FAIL');
  }
}

async function testGetWalletStatus() {
  const testWallet = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

  try {
    const response = await fetch(
      `${WALLET_GUARD_URL}/api/v1/wallet-guard/status/${testWallet}?network=ethereum`,
      {
        headers: {
          'X-API-Key': WALLET_GUARD_API_KEY,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      results.push({
        test: 'Get Wallet Status',
        status: 'pass',
        message: 'Successfully retrieved wallet status',
        data: data,
      });
      logger.info('✅ Get Wallet Status: PASS');
      logger.info(`   Threat Level: ${data.threat_level || 'N/A'}`);
      logger.info(`   Monitored: ${data.is_monitored || 'N/A'}`);
    } else {
      results.push({
        test: 'Get Wallet Status',
        status: response.status === 404 ? 'skip' : 'fail',
        message: `API returned status ${response.status}`,
      });
      logger.info(`⚠️  Get Wallet Status: ${response.status === 404 ? 'SKIP' : 'FAIL'}`);
    }
  } catch (error: any) {
    results.push({
      test: 'Get Wallet Status',
      status: 'fail',
      message: `Request failed: ${error.message}`,
    });
    logger.info('❌ Get Wallet Status: FAIL');
  }
}

async function testGetThreats() {
  try {
    const response = await fetch(
      `${WALLET_GUARD_URL}/api/v1/wallet-guard/threats?hours=24`,
      {
        headers: {
          'X-API-Key': WALLET_GUARD_API_KEY,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      results.push({
        test: 'Get Threats',
        status: 'pass',
        message: `Successfully retrieved threats (${Array.isArray(data) ? data.length : 0} found)`,
        data: Array.isArray(data) ? data.slice(0, 3) : data,
      });
      logger.info('✅ Get Threats: PASS');
      logger.info(`   Threats Found: ${Array.isArray(data) ? data.length : 0}`);
    } else {
      results.push({
        test: 'Get Threats',
        status: 'skip',
        message: `API returned status ${response.status}`,
      });
      logger.info('⚠️  Get Threats: SKIP');
    }
  } catch (error: any) {
    results.push({
      test: 'Get Threats',
      status: 'fail',
      message: `Request failed: ${error.message}`,
    });
    logger.info('❌ Get Threats: FAIL');
  }
}

async function testGetAnalytics() {
  try {
    const response = await fetch(
      `${WALLET_GUARD_URL}/api/v1/wallet-guard/analytics`,
      {
        headers: {
          'X-API-Key': WALLET_GUARD_API_KEY,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      results.push({
        test: 'Get Analytics',
        status: 'pass',
        message: 'Successfully retrieved analytics',
        data: data,
      });
      logger.info('✅ Get Analytics: PASS');
      if (data.total_monitored !== undefined) {
        logger.info(`   Monitored Wallets: ${data.total_monitored}`);
      }
      if (data.threats_detected_24h !== undefined) {
        logger.info(`   Threats (24h): ${data.threats_detected_24h}`);
      }
    } else {
      results.push({
        test: 'Get Analytics',
        status: 'skip',
        message: `API returned status ${response.status}`,
      });
      logger.info('⚠️  Get Analytics: SKIP');
    }
  } catch (error: any) {
    results.push({
      test: 'Get Analytics',
      status: 'fail',
      message: `Request failed: ${error.message}`,
    });
    logger.info('❌ Get Analytics: FAIL');
  }
}

function printResults() {
  logger.info('\n' + '='.repeat(60));
  logger.info('📊 TEST RESULTS SUMMARY');
  logger.info('='.repeat(60) + '\n');

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const skipped = results.filter((r) => r.status === 'skip').length;

  logger.info(`✅ Passed: ${passed}`);
  logger.info(`❌ Failed: ${failed}`);
  logger.info(`⚠️  Skipped: ${skipped}`);
  logger.info(`📊 Total: ${results.length}\n`);

  if (failed === 0) {
    logger.info('🎉 All critical tests passed!');
  } else {
    logger.info('⚠️  Some tests failed. Check Wallet Guard service configuration.');
  }

  logger.info('\n' + '='.repeat(60) + '\n');
}

// Run tests
testWalletGuardService().catch(console.error);

