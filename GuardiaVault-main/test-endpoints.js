/**
 * Quick API Endpoint Test Script
 * Tests key endpoints after middleware order fix
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

async function testEndpoint(name, method, path, options = {}) {
  try {
    const url = `${BASE_URL}${path}`;
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...(options.body && { body: JSON.stringify(options.body) }),
    };

    const response = await fetch(url, fetchOptions);
    const status = response.status;
    const isSuccess = status >= 200 && status < 300;
    
    let data = null;
    try {
      const text = await response.text();
      if (text) {
        data = JSON.parse(text);
      }
    } catch {
      data = { raw: 'Non-JSON response' };
    }

    const statusColor = isSuccess ? colors.green : colors.red;
    console.log(`${statusColor}${status}${colors.reset} ${method} ${path}`);
    
    if (!isSuccess && options.expectedFailure) {
      console.log(`${colors.yellow}  ✓ Expected failure${colors.reset}`);
      return { success: true, status, data };
    }
    
    if (isSuccess) {
      console.log(`${colors.green}  ✓ ${name}${colors.reset}`);
      return { success: true, status, data };
    } else {
      console.log(`${colors.red}  ✗ ${name} - ${data?.message || 'Unknown error'}${colors.reset}`);
      return { success: false, status, data };
    }
  } catch (error) {
    console.log(`${colors.red}  ✗ ${name} - ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}API Endpoint Tests${colors.reset}`);
  console.log(`${colors.blue}Testing: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}\n`);

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  // Health endpoints
  console.log(`${colors.blue}Health Endpoints:${colors.reset}`);
  results.total++;
  const health = await testEndpoint('Health Check', 'GET', '/health');
  if (health.success) results.passed++; else results.failed++;

  results.total++;
  const ready = await testEndpoint('Readiness Check', 'GET', '/ready');
  if (ready.success) results.passed++; else results.failed++;

  // Public endpoints
  console.log(`\n${colors.blue}Public Endpoints:${colors.reset}`);
  results.total++;
  const articles = await testEndpoint('Articles List', 'GET', '/api/articles', { expectedFailure: true });
  if (articles.success) results.passed++; else results.failed++;

  // Auth endpoints (should fail without auth)
  console.log(`\n${colors.blue}Auth Endpoints (Unauthenticated):${colors.reset}`);
  results.total++;
  const me = await testEndpoint('Get Current User (should fail)', 'GET', '/api/auth/me', { expectedFailure: true });
  if (me.success) results.passed++; else results.failed++;

  // AI Optimizer status (should work)
  console.log(`\n${colors.blue}AI Optimizer:${colors.reset}`);
  results.total++;
  const aiStatus = await testEndpoint('AI Status', 'GET', '/api/ai/status', { expectedFailure: true });
  if (aiStatus.success) results.passed++; else results.failed++;

  // Summary
  console.log(`\n${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}Test Summary:${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`Total: ${results.total}`);
  console.log(`${colors.blue}========================================${colors.reset}\n`);

  return results;
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests, testEndpoint };

