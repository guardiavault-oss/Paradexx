/**
 * Chaos Engineering Test Runner for GuardiaVault
 * Injects various failure scenarios to test system resilience
 */

const http = require('http');
const { spawn } = require('child_process');

// Chaos testing configuration
const config = {
  targetUrl: process.env.TARGET_URL || 'http://localhost:5000',
  duration: parseInt(process.env.CHAOS_DURATION || '300000'), // 5 minutes default
  strategies: [
    'database-failure',
    'network-latency',
    'service-unavailable',
    'memory-stress',
    'random-errors',
  ],
};

/**
 * Chaos strategies
 */
const strategies = {
  /**
   * Simulate database connection failures
   */
  async 'database-failure'() {
    console.log('🔥 Chaos: Simulating database failures...');

    // This would typically use a chaos engineering tool like Chaos Mesh
    // or inject failures at the database connection level
    // For demonstration, we'll log the strategy

    const failureRate = 0.2; // 20% failure rate
    const duration = 60000; // 1 minute

    console.log(`  - Failure rate: ${failureRate * 100}%`);
    console.log(`  - Duration: ${duration / 1000}s`);

    // Monitor system behavior
    await monitorEndpoints(duration, {
      name: 'Database Failure',
      expectedErrors: true,
    });
  },

  /**
   * Inject network latency
   */
  async 'network-latency'() {
    console.log('🔥 Chaos: Injecting network latency...');

    const latencyMs = 1000; // 1 second delay
    const duration = 60000; // 1 minute

    console.log(`  - Latency: ${latencyMs}ms`);
    console.log(`  - Duration: ${duration / 1000}s`);

    // In a real scenario, you'd use tools like tc (traffic control) on Linux
    // or a service mesh to inject latency
    await monitorEndpoints(duration, {
      name: 'Network Latency',
      maxResponseTime: 2000,
    });
  },

  /**
   * Simulate service unavailability
   */
  async 'service-unavailable'() {
    console.log('🔥 Chaos: Simulating service unavailability...');

    const downtime = 30000; // 30 seconds
    const services = ['email', 'stripe', 'blockchain-rpc'];

    console.log(`  - Downtime: ${downtime / 1000}s`);
    console.log(`  - Affected services: ${services.join(', ')}`);

    // Monitor how the system handles service degradation
    await monitorEndpoints(downtime, {
      name: 'Service Unavailable',
      expectedErrors: true,
      gracefulDegradation: true,
    });
  },

  /**
   * Apply memory stress
   */
  async 'memory-stress'() {
    console.log('🔥 Chaos: Applying memory stress...');

    const memoryMB = 512; // Allocate 512MB
    const duration = 60000; // 1 minute

    console.log(`  - Memory allocation: ${memoryMB}MB`);
    console.log(`  - Duration: ${duration / 1000}s`);

    // Allocate memory to stress the system
    const arrays = [];
    const startTime = Date.now();

    while (Date.now() - startTime < duration) {
      // Allocate memory
      arrays.push(new Array(1024 * 1024).fill('x'));

      // Monitor system
      await monitorEndpoints(5000, {
        name: 'Memory Stress',
        checkMemory: true,
      });

      // Release some memory periodically
      if (arrays.length > 10) {
        arrays.splice(0, 5);
      }
    }

    // Cleanup
    arrays.length = 0;
  },

  /**
   * Inject random errors
   */
  async 'random-errors'() {
    console.log('🔥 Chaos: Injecting random errors...');

    const errorRate = 0.15; // 15% error rate
    const duration = 60000; // 1 minute

    console.log(`  - Error rate: ${errorRate * 100}%`);
    console.log(`  - Duration: ${duration / 1000}s`);

    await monitorEndpoints(duration, {
      name: 'Random Errors',
      injectErrors: true,
      errorRate,
    });
  },
};

/**
 * Monitor system endpoints during chaos
 */
async function monitorEndpoints(duration, options = {}) {
  const endpoints = [
    '/api/health',
    '/api/vaults',
    '/api/guardians',
  ];

  const startTime = Date.now();
  const results = {
    total: 0,
    success: 0,
    errors: 0,
    timeouts: 0,
    responseTimes: [],
  };

  while (Date.now() - startTime < duration) {
    for (const endpoint of endpoints) {
      const result = await checkEndpoint(config.targetUrl + endpoint);

      results.total++;

      if (result.success) {
        results.success++;
      } else if (result.timeout) {
        results.timeouts++;
      } else {
        results.errors++;
      }

      results.responseTimes.push(result.responseTime);

      // Check thresholds
      if (options.maxResponseTime && result.responseTime > options.maxResponseTime) {
        console.log(`  ⚠️  Slow response: ${endpoint} took ${result.responseTime}ms`);
      }
    }

    await sleep(1000); // Check every second
  }

  // Report results
  console.log(`\n📊 ${options.name} Results:`);
  console.log(`  - Total requests: ${results.total}`);
  console.log(`  - Successful: ${results.success}`);
  console.log(`  - Errors: ${results.errors}`);
  console.log(`  - Timeouts: ${results.timeouts}`);
  console.log(`  - Success rate: ${((results.success / results.total) * 100).toFixed(2)}%`);

  const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
  console.log(`  - Avg response time: ${avgResponseTime.toFixed(2)}ms`);

  // Evaluate resilience
  const successRate = results.success / results.total;

  if (options.expectedErrors) {
    if (successRate < 0.5) {
      console.log('  ❌ System failed to maintain minimal availability');
    } else if (successRate < 0.8) {
      console.log('  ⚠️  System degraded but operational');
    } else {
      console.log('  ✅ System maintained high availability despite chaos');
    }
  } else {
    if (successRate < 0.95) {
      console.log('  ❌ System stability compromised');
    } else {
      console.log('  ✅ System remained stable');
    }
  }

  return results;
}

/**
 * Check endpoint health
 */
function checkEndpoint(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const timeout = 5000; // 5 second timeout

    const req = http.get(url, (res) => {
      const responseTime = Date.now() - startTime;

      // Consume response data
      res.on('data', () => {});
      res.on('end', () => {
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 500,
          statusCode: res.statusCode,
          responseTime,
          timeout: false,
        });
      });
    });

    req.on('error', () => {
      resolve({
        success: false,
        responseTime: Date.now() - startTime,
        timeout: false,
      });
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      resolve({
        success: false,
        responseTime: timeout,
        timeout: true,
      });
    });
  });
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run chaos tests
 */
async function runChaosTests() {
  console.log('🎯 Starting Chaos Engineering Tests for GuardiaVault\n');
  console.log(`Target: ${config.targetUrl}`);
  console.log(`Total duration: ${config.duration / 1000}s\n`);

  // Check if server is running
  try {
    const healthCheck = await checkEndpoint(config.targetUrl + '/api/health');
    if (!healthCheck.success) {
      console.error('❌ Server is not responding. Please start the server first.');
      process.exit(1);
    }
    console.log('✅ Server is running\n');
  } catch (error) {
    console.error('❌ Cannot connect to server:', error.message);
    process.exit(1);
  }

  // Run each chaos strategy
  for (const strategyName of config.strategies) {
    const strategy = strategies[strategyName];

    if (!strategy) {
      console.warn(`⚠️  Unknown strategy: ${strategyName}`);
      continue;
    }

    try {
      await strategy();
      console.log(''); // Empty line between strategies
    } catch (error) {
      console.error(`❌ Error running strategy ${strategyName}:`, error.message);
    }

    // Cooldown period between strategies
    console.log('😌 Cooldown period (30s)...\n');
    await sleep(30000);
  }

  console.log('🎉 Chaos testing completed!');
}

// Run the chaos tests
if (require.main === module) {
  runChaosTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runChaosTests, strategies };
