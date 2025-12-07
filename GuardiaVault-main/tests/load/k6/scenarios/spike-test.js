/**
 * K6 Spike Test for GuardiaVault
 * Tests system behavior under sudden traffic spikes
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const vaultFetchDuration = new Trend('vault_fetch_duration');
const checkInDuration = new Trend('check_in_duration');
const failedRequests = new Counter('failed_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },    // Below normal load
    { duration: '1m', target: 10 },    // Stable at low load
    { duration: '30s', target: 1000 }, // Spike to 1000 users
    { duration: '3m', target: 1000 },  // Stay at 1000 for 3 minutes
    { duration: '1m', target: 10 },    // Scale down recovery
    { duration: '2m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'], // Max 5% error rate
    errors: ['rate<0.1'], // Max 10% error rate
    checks: ['rate>0.9'], // 90% of checks should pass
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Test data
const testUsers = [
  { email: 'test1@guardiavault.com', password: 'TestPassword123!' },
  { email: 'test2@guardiavault.com', password: 'TestPassword123!' },
  { email: 'test3@guardiavault.com', password: 'TestPassword123!' },
];

/**
 * Setup function - runs once before the test
 */
export function setup() {
  console.log('Starting spike test setup...');

  // Verify server is accessible
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'server is healthy': (r) => r.status === 200,
  });

  return { startTime: new Date().toISOString() };
}

/**
 * Main test function - runs for each VU
 */
export default function (data) {
  // Select random user
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];

  // Test 1: Login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Login' },
  });

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => r.json('token') !== undefined,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });

  loginDuration.add(loginRes.timings.duration);

  if (!loginSuccess) {
    errorRate.add(1);
    failedRequests.add(1);
    return; // Skip rest of scenario if login fails
  }

  const authToken = loginRes.json('token');
  errorRate.add(0);

  sleep(1); // Think time

  // Test 2: Fetch vaults
  const vaultsRes = http.get(`${BASE_URL}/api/vaults`, {
    headers: { Authorization: `Bearer ${authToken}` },
    tags: { name: 'FetchVaults' },
  });

  const vaultsSuccess = check(vaultsRes, {
    'vaults fetch status is 200': (r) => r.status === 200,
    'vaults response is array': (r) => Array.isArray(r.json()),
    'vaults response time < 500ms': (r) => r.timings.duration < 500,
  });

  vaultFetchDuration.add(vaultsRes.timings.duration);

  if (!vaultsSuccess) {
    errorRate.add(1);
    failedRequests.add(1);
  } else {
    errorRate.add(0);
  }

  sleep(2); // Think time

  // Test 3: Check-in (if vaults exist)
  const vaults = vaultsRes.json();
  if (vaults && vaults.length > 0) {
    const vaultId = vaults[0].id;

    const checkInRes = http.post(
      `${BASE_URL}/api/vaults/${vaultId}/checkin`,
      null,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        tags: { name: 'CheckIn' },
      }
    );

    const checkInSuccess = check(checkInRes, {
      'check-in status is 200': (r) => r.status === 200,
      'check-in response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    checkInDuration.add(checkInRes.timings.duration);

    if (!checkInSuccess) {
      errorRate.add(1);
      failedRequests.add(1);
    } else {
      errorRate.add(0);
    }
  }

  sleep(1); // Think time between iterations
}

/**
 * Teardown function - runs once after the test
 */
export function teardown(data) {
  console.log('Spike test completed');
  console.log(`Started at: ${data.startTime}`);
  console.log(`Ended at: ${new Date().toISOString()}`);
}

/**
 * Handle summary - custom summary output
 */
export function handleSummary(data) {
  return {
    'tests/load/k6/reports/spike-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = `\n${indent}Spike Test Summary\n${indent}==================\n\n`;

  // Add metrics summary
  if (data.metrics) {
    summary += `${indent}HTTP Metrics:\n`;
    summary += `${indent}  - Total Requests: ${data.metrics.http_reqs?.count || 0}\n`;
    summary += `${indent}  - Failed Requests: ${data.metrics.http_req_failed?.count || 0}\n`;
    summary += `${indent}  - Request Duration (avg): ${data.metrics.http_req_duration?.avg?.toFixed(2) || 0}ms\n`;
    summary += `${indent}  - Request Duration (p95): ${data.metrics.http_req_duration?.p95?.toFixed(2) || 0}ms\n`;
    summary += `${indent}  - Request Duration (p99): ${data.metrics.http_req_duration?.p99?.toFixed(2) || 0}ms\n`;
  }

  return summary;
}
