/**
 * Deployment Verification Script
 * Tests production deployment health and critical endpoints
 */

import axios from 'axios';

const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || process.argv[2];

if (!DEPLOYMENT_URL) {
  console.error('❌ Error: DEPLOYMENT_URL not provided');
  console.log('\nUsage:');
  console.log('  DEPLOYMENT_URL=https://your-app.up.railway.app tsx scripts/verify-deployment.ts');
  console.log('  OR');
  console.log('  tsx scripts/verify-deployment.ts https://your-app.up.railway.app');
  process.exit(1);
}

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  responseTime?: number;
}

const results: TestResult[] = [];

async function testEndpoint(name: string, path: string, expectedStatus: number = 200) {
  const url = `${DEPLOYMENT_URL}${path}`;
  const startTime = Date.now();

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true, // Don't throw on any status
    });
    const responseTime = Date.now() - startTime;

    if (response.status === expectedStatus) {
      results.push({
        name,
        status: 'pass',
        message: `✅ ${response.status} - ${responseTime}ms`,
        responseTime,
      });
      return true;
    } else {
      results.push({
        name,
        status: 'warn',
        message: `⚠️  Expected ${expectedStatus}, got ${response.status} - ${responseTime}ms`,
        responseTime,
      });
      return false;
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    results.push({
      name,
      status: 'fail',
      message: `❌ ${error.message} - ${responseTime}ms`,
      responseTime,
    });
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting deployment verification...');
  console.log(`📍 Target: ${DEPLOYMENT_URL}\n`);
  console.log('=' .repeat(60));

  // Test 1: Health endpoint
  console.log('\n📊 Testing health endpoint...');
  await testEndpoint('Health Check', '/health', 200);

  // Test 2: API root
  console.log('📊 Testing API root...');
  await testEndpoint('API Root', '/api', 200);

  // Test 3: Auth endpoint (should return 401 when not authenticated)
  console.log('📊 Testing auth endpoint...');
  await testEndpoint('Auth Me (Unauthenticated)', '/api/auth/me', 401);

  // Test 4: CORS headers
  console.log('📊 Testing CORS headers...');
  try {
    const response = await axios.options(`${DEPLOYMENT_URL}/api/auth/me`, {
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'GET',
      },
      timeout: 5000,
    });

    if (response.headers['access-control-allow-origin']) {
      results.push({
        name: 'CORS Configuration',
        status: 'pass',
        message: '✅ CORS headers present',
      });
    } else {
      results.push({
        name: 'CORS Configuration',
        status: 'warn',
        message: '⚠️  CORS headers may not be configured',
      });
    }
  } catch (error: any) {
    results.push({
      name: 'CORS Configuration',
      status: 'fail',
      message: `❌ ${error.message}`,
    });
  }

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION RESULTS\n');

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  results.forEach((result) => {
    console.log(`${result.name}:`);
    console.log(`  ${result.message}`);

    if (result.status === 'pass') passCount++;
    else if (result.status === 'warn') warnCount++;
    else failCount++;
  });

  console.log('\n' + '='.repeat(60));
  console.log('📈 SUMMARY\n');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`⚠️  Warnings: ${warnCount}`);
  console.log(`❌ Failed: ${failCount}`);

  if (failCount > 0) {
    console.log('\n❌ Deployment verification FAILED');
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check Railway deployment logs');
    console.log('   2. Verify DATABASE_URL is set in Railway');
    console.log('   3. Ensure migrations ran successfully');
    console.log('   4. Check for build/runtime errors');
    process.exit(1);
  } else if (warnCount > 0) {
    console.log('\n⚠️  Deployment verification PASSED with warnings');
    process.exit(0);
  } else {
    console.log('\n✅ Deployment verification PASSED');
    process.exit(0);
  }
}

runTests();
