/**
 * Test Environment Validation
 * Script to verify environment variable validation works correctly
 */

import { validateEnvironment, getEnv, getEnvWithDefault } from "../server/config/env-validator";

console.log("🧪 Testing Environment Validation\n");

// Test 1: Valid environment (should pass)
console.log("Test 1: Valid environment variables");
process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test-secret-long-enough-for-validation-testing";
process.env.ENCRYPTION_KEY = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
process.env.SSN_SALT = "test-salt-for-validation";

try {
  validateEnvironment();
  console.log("✅ Test 1 PASSED: Valid environment accepted\n");
} catch (error: any) {
  console.error("❌ Test 1 FAILED:", error.message, "\n");
  process.exit(1);
}

// Test 2: Missing required variable (should fail)
console.log("Test 2: Missing NODE_ENV");
delete process.env.NODE_ENV;

try {
  validateEnvironment();
  console.error("❌ Test 2 FAILED: Should have thrown error for missing NODE_ENV\n");
  process.exit(1);
} catch (error: any) {
  console.log("✅ Test 2 PASSED: Missing NODE_ENV caught\n");
}

// Test 3: Invalid NODE_ENV value (should fail)
console.log("Test 3: Invalid NODE_ENV value");
process.env.NODE_ENV = "invalid";

try {
  validateEnvironment();
  console.error("❌ Test 3 FAILED: Should have thrown error for invalid NODE_ENV\n");
  process.exit(1);
} catch (error: any) {
  console.log("✅ Test 3 PASSED: Invalid NODE_ENV caught\n");
}

// Test 4: Short SESSION_SECRET in production (should fail)
console.log("Test 4: Short SESSION_SECRET in production");
process.env.NODE_ENV = "production";
process.env.SESSION_SECRET = "short";

try {
  validateEnvironment();
  console.error("❌ Test 4 FAILED: Should have thrown error for short SESSION_SECRET in production\n");
  process.exit(1);
} catch (error: any) {
  console.log("✅ Test 4 PASSED: Short SESSION_SECRET in production caught\n");
}

// Test 5: Default SESSION_SECRET in production (should fail)
console.log("Test 5: Default SESSION_SECRET in production");
process.env.NODE_ENV = "production";
process.env.SESSION_SECRET = "dev-secret-change-in-production-PLEASE-CHANGE-THIS";

try {
  validateEnvironment();
  console.error("❌ Test 5 FAILED: Should have thrown error for default SESSION_SECRET in production\n");
  process.exit(1);
} catch (error: any) {
  console.log("✅ Test 5 PASSED: Default SESSION_SECRET in production caught\n");
}

// Test 6: Invalid ENCRYPTION_KEY format in production (should fail)
console.log("Test 6: Invalid ENCRYPTION_KEY format in production");
process.env.NODE_ENV = "production";
process.env.SESSION_SECRET = "a-very-long-secret-that-meets-minimum-requirements-for-production";
process.env.ENCRYPTION_KEY = "invalid";

try {
  validateEnvironment();
  console.error("❌ Test 6 FAILED: Should have thrown error for invalid ENCRYPTION_KEY format\n");
  process.exit(1);
} catch (error: any) {
  console.log("✅ Test 6 PASSED: Invalid ENCRYPTION_KEY format caught\n");
}

// Test 7: Helper functions
console.log("Test 7: Helper functions");
process.env.NODE_ENV = "test";
process.env.TEST_VAR = "test-value";

const testVar = getEnv("TEST_VAR", true);
if (testVar !== "test-value") {
  console.error("❌ Test 7 FAILED: getEnv returned wrong value");
  process.exit(1);
}

const defaultVar = getEnvWithDefault("MISSING_VAR", "default-value");
if (defaultVar !== "default-value") {
  console.error("❌ Test 7 FAILED: getEnvWithDefault returned wrong value");
  process.exit(1);
}

console.log("✅ Test 7 PASSED: Helper functions work correctly\n");

console.log("✅ All environment validation tests passed!\n");

