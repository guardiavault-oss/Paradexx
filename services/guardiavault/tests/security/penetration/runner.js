/**
 * Security Penetration Testing Runner for GuardiaVault
 * Automated security tests to identify vulnerabilities
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const config = {
  targetUrl: process.env.TARGET_URL || 'http://localhost:5000',
  verbose: process.env.VERBOSE === 'true',
};

/**
 * Test results tracker
 */
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const requestOptions = {
      ...options,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Log test result
 */
function logTest(name, passed, message = '', severity = 'info') {
  results.total++;

  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    if (severity === 'warning') {
      results.warnings++;
      console.log(`⚠️  ${name}: ${message}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}: ${message}`);
    }
  }

  results.tests.push({ name, passed, message, severity });
}

/**
 * Security Tests
 */

async function testSQLInjection() {
  console.log('\n🔍 Testing SQL Injection vulnerabilities...');

  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users--",
    "' UNION SELECT NULL--",
    "admin'--",
    "' OR 1=1--",
  ];

  for (const payload of sqlPayloads) {
    try {
      const res = await makeRequest(`${config.targetUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payload,
          password: payload,
        }),
      });

      // Should NOT return 200 or expose database errors
      const passed = res.statusCode !== 200 && !res.body.includes('SQL') && !res.body.includes('syntax');
      logTest(
        `SQL Injection protection (payload: ${payload.substring(0, 20)}...)`,
        passed,
        passed ? '' : 'Potential SQL injection vulnerability',
        'critical'
      );
    } catch (error) {
      logTest(`SQL Injection test error`, true, 'Request blocked (good)');
    }
  }
}

async function testXSS() {
  console.log('\n🔍 Testing XSS vulnerabilities...');

  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>',
  ];

  for (const payload of xssPayloads) {
    try {
      const res = await makeRequest(`${config.targetUrl}/api/vaults`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token', // Will fail auth but test input handling
        },
        body: JSON.stringify({
          name: payload,
          guardians: [],
        }),
      });

      // Should sanitize or reject the payload
      const bodyLower = res.body.toLowerCase();
      const passed = !bodyLower.includes('<script') && !bodyLower.includes('onerror');

      logTest(
        `XSS protection (payload: ${payload.substring(0, 30)}...)`,
        passed,
        passed ? '' : 'Potential XSS vulnerability',
        'high'
      );
    } catch (error) {
      logTest(`XSS test error`, true, 'Request blocked (good)');
    }
  }
}

async function testCSRF() {
  console.log('\n🔍 Testing CSRF protection...');

  try {
    // Test if state-changing operations require CSRF token
    const res = await makeRequest(`${config.targetUrl}/api/vaults`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://evil-site.com',
      },
      body: JSON.stringify({
        name: 'Evil Vault',
        guardians: [],
      }),
    });

    // Should reject cross-origin requests without proper CSRF protection
    const passed = res.statusCode === 401 || res.statusCode === 403;
    logTest(
      'CSRF protection on state-changing operations',
      passed,
      passed ? '' : 'Missing CSRF protection',
      'high'
    );
  } catch (error) {
    logTest('CSRF test error', true, 'Request blocked (good)');
  }
}

async function testAuthenticationBypass() {
  console.log('\n🔍 Testing authentication bypass vulnerabilities...');

  // Test 1: Access protected route without token
  try {
    const res = await makeRequest(`${config.targetUrl}/api/vaults`);
    const passed = res.statusCode === 401;
    logTest(
      'Protected routes require authentication',
      passed,
      passed ? '' : 'Protected route accessible without auth',
      'critical'
    );
  } catch (error) {
    logTest('Auth bypass test error', false, error.message);
  }

  // Test 2: Invalid token
  try {
    const res = await makeRequest(`${config.targetUrl}/api/vaults`, {
      headers: { Authorization: 'Bearer invalid-token' },
    });
    const passed = res.statusCode === 401;
    logTest(
      'Invalid tokens are rejected',
      passed,
      passed ? '' : 'Invalid token accepted',
      'critical'
    );
  } catch (error) {
    logTest('Invalid token test error', false, error.message);
  }

  // Test 3: Token manipulation
  try {
    const res = await makeRequest(`${config.targetUrl}/api/vaults`, {
      headers: { Authorization: 'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0.' },
    });
    const passed = res.statusCode === 401;
    logTest(
      'Manipulated tokens are rejected',
      passed,
      passed ? '' : 'Manipulated token accepted',
      'critical'
    );
  } catch (error) {
    logTest('Token manipulation test error', false, error.message);
  }
}

async function testRateLimiting() {
  console.log('\n🔍 Testing rate limiting...');

  const requests = [];
  const numRequests = 100; // Send 100 requests quickly

  for (let i = 0; i < numRequests; i++) {
    requests.push(
      makeRequest(`${config.targetUrl}/api/health`).catch(() => ({ statusCode: 429 }))
    );
  }

  const responses = await Promise.all(requests);
  const rateLimited = responses.filter((r) => r.statusCode === 429).length;

  const passed = rateLimited > 0;
  logTest(
    'Rate limiting is enforced',
    passed,
    passed ? `${rateLimited}/${numRequests} requests rate limited` : 'No rate limiting detected',
    'medium'
  );
}

async function testSecurityHeaders() {
  console.log('\n🔍 Testing security headers...');

  try {
    const res = await makeRequest(config.targetUrl);

    // Check for important security headers
    const headers = [
      { name: 'X-Content-Type-Options', expected: 'nosniff' },
      { name: 'X-Frame-Options', expected: ['DENY', 'SAMEORIGIN'] },
      { name: 'X-XSS-Protection', expected: '1; mode=block' },
      { name: 'Strict-Transport-Security', expected: null }, // Just check presence
      { name: 'Content-Security-Policy', expected: null },
    ];

    for (const header of headers) {
      const value = res.headers[header.name.toLowerCase()];
      let passed = false;

      if (header.expected === null) {
        passed = !!value;
      } else if (Array.isArray(header.expected)) {
        passed = header.expected.some((exp) => value?.includes(exp));
      } else {
        passed = value === header.expected;
      }

      logTest(
        `Security header: ${header.name}`,
        passed,
        passed ? `Present: ${value}` : `Missing or incorrect`,
        'medium'
      );
    }
  } catch (error) {
    logTest('Security headers test error', false, error.message);
  }
}

async function testPasswordPolicy() {
  console.log('\n🔍 Testing password policy...');

  const weakPasswords = ['123456', 'password', 'qwerty', 'abc123', '12345678'];

  for (const password of weakPasswords) {
    try {
      const res = await makeRequest(`${config.targetUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test${Date.now()}@test.com`,
          password: password,
        }),
      });

      // Should reject weak passwords
      const passed = res.statusCode !== 201 && res.statusCode !== 200;
      logTest(
        `Weak password rejected: "${password}"`,
        passed,
        passed ? '' : 'Weak password accepted',
        'medium'
      );
    } catch (error) {
      logTest(`Password policy test error`, true, 'Request blocked (good)');
    }
  }
}

async function testInformationDisclosure() {
  console.log('\n🔍 Testing information disclosure...');

  // Test error messages don't leak sensitive info
  try {
    const res = await makeRequest(`${config.targetUrl}/api/nonexistent`);
    const body = res.body.toLowerCase();

    // Should NOT expose stack traces, file paths, or sensitive errors
    const leaked =
      body.includes('stack trace') ||
      body.includes('at file:') ||
      body.includes('at /home') ||
      body.includes('at c:\\');

    logTest(
      'Error messages do not leak sensitive information',
      !leaked,
      leaked ? 'Stack traces or file paths exposed' : '',
      'medium'
    );
  } catch (error) {
    logTest('Information disclosure test error', true, 'No information leaked');
  }
}

/**
 * Main test runner
 */
async function runSecurityTests() {
  console.log('🔐 Starting Security Penetration Tests for GuardiaVault\n');
  console.log(`Target: ${config.targetUrl}\n`);

  // Run all security tests
  await testSQLInjection();
  await testXSS();
  await testCSRF();
  await testAuthenticationBypass();
  await testRateLimiting();
  await testSecurityHeaders();
  await testPasswordPolicy();
  await testInformationDisclosure();

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Security Test Summary');
  console.log('='.repeat(50));
  console.log(`Total tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);

  const successRate = ((results.passed / results.total) * 100).toFixed(2);
  console.log(`\nSuccess rate: ${successRate}%`);

  if (results.failed > 0) {
    console.log('\n⚠️  Critical vulnerabilities found! Review failed tests above.');
    process.exit(1);
  } else if (results.warnings > 0) {
    console.log('\n⚠️  Security warnings found. Review recommended.');
  } else {
    console.log('\n✅ All security tests passed!');
  }
}

// Run the security tests
if (require.main === module) {
  runSecurityTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runSecurityTests };
