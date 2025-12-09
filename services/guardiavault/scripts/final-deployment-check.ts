/**
 * Final Deployment Check Script
 * Comprehensive verification before deployment
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

interface Check {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
}

const checks: Check[] = [];

function addCheck(name: string, status: Check["status"], message: string) {
  checks.push({ name, status, message });
}

async function checkEnvironment() {
  console.log("🔍 Checking environment variables...");
  
  const required = ["SESSION_SECRET", "DATABASE_URL"];
  const recommended = ["SENTRY_DSN", "SMTP_HOST", "STRIPE_SECRET_KEY"];
  
  for (const varName of required) {
    if (!process.env[varName]) {
      addCheck(`Environment: ${varName}`, "fail", `Missing required variable: ${varName}`);
    } else {
      addCheck(`Environment: ${varName}`, "pass", `${varName} is set`);
    }
  }
  
  if (process.env.SESSION_SECRET === "guardiavault-dev-secret-change-in-production") {
    addCheck("SESSION_SECRET", "fail", "SESSION_SECRET is still using default value! CHANGE IT!");
  } else if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    addCheck("SESSION_SECRET", "warning", "SESSION_SECRET should be at least 32 characters");
  }
  
  for (const varName of recommended) {
    if (!process.env[varName]) {
      addCheck(`Environment: ${varName}`, "warning", `Missing recommended variable: ${varName}`);
    }
  }
}

async function checkMigrations() {
  console.log("🔍 Checking migrations...");
  
  const migrationFiles = [
    "migrations/000_base_schema.sql",
    "migrations/001_death_verification.sql",
    "migrations/002_landing_page_features.sql",
    "migrations/003_recovery_system.sql",
    "migrations/004_fragment_scheme_tracking.sql",
    "migrations/005_security_constraints.sql",
  ];
  
  for (const file of migrationFiles) {
    if (existsSync(join(process.cwd(), file))) {
      addCheck(`Migration: ${file}`, "pass", "Migration file exists");
    } else {
      addCheck(`Migration: ${file}`, "fail", `Migration file missing: ${file}`);
    }
  }
}

async function checkSecurityMiddleware() {
  console.log("🔍 Checking security middleware...");
  
  const serverIndex = readFileSync(join(process.cwd(), "server/index.ts"), "utf-8");
  
  const securityChecks = [
    { name: "Helmet", pattern: /helmet/i, required: true },
    { name: "Rate Limiting", pattern: /rateLimit|rate-limit/i, required: true },
    { name: "CORS", pattern: /cors/i, required: true },
    { name: "Session", pattern: /express-session|session\(/i, required: true },
    { name: "Input Sanitization", pattern: /sanitizeBody|sanitize/i, required: true },
    { name: "CSRF Protection", pattern: /csrf/i, required: false },
  ];
  
  for (const check of securityChecks) {
    if (serverIndex.match(check.pattern)) {
      addCheck(`Security: ${check.name}`, "pass", `${check.name} is implemented`);
    } else if (check.required) {
      addCheck(`Security: ${check.name}`, "fail", `${check.name} is missing!`);
    } else {
      addCheck(`Security: ${check.name}`, "warning", `${check.name} is not implemented (optional)`);
    }
  }
}

async function checkValidation() {
  console.log("🔍 Checking input validation...");
  
  const routesContent = readFileSync(join(process.cwd(), "server/routes.ts"), "utf-8");
  
  const criticalEndpoints = [
    "/api/auth/register",
    "/api/auth/login",
    "/api/vaults",
    "/api/vaults/recover",
  ];
  
  for (const endpoint of criticalEndpoints) {
    const hasValidation = routesContent.includes(`validateBody`) && 
                          routesContent.includes(endpoint.replace("/api", ""));
    
    if (hasValidation) {
      addCheck(`Validation: ${endpoint}`, "pass", "Has validation middleware");
    } else {
      addCheck(`Validation: ${endpoint}`, "warning", "Validation may be missing");
    }
  }
}

async function checkDatabaseSchema() {
  console.log("🔍 Checking database schema...");
  
  const schemaFile = readFileSync(join(process.cwd(), "shared/schema.ts"), "utf-8");
  
  const requiredTables = ["users", "vaults", "parties", "fragments", "subscriptions"];
  const tableNameMapping: Record<string, string> = {
    "check_ins": "checkIns",
  };
  
  for (const table of requiredTables) {
    const schemaName = tableNameMapping[table] || table;
    if (schemaFile.includes(`${schemaName} = pgTable`) || schemaFile.includes(`export const ${schemaName}`)) {
      addCheck(`Schema: ${table}`, "pass", "Table exists in schema");
    } else {
      addCheck(`Schema: ${table}`, "fail", `Table ${table} missing from schema`);
    }
  }
  
  // Check for checkIns separately (camelCase in schema)
  if (schemaFile.includes("checkIns = pgTable") || schemaFile.includes("export const checkIns")) {
    addCheck("Schema: check_ins", "pass", "Table exists in schema (as checkIns)");
  }
  
  // Check for WebAuthn and TOTP tables
  if (schemaFile.includes("webauthnCredentials")) {
    addCheck("Schema: webauthn_credentials", "pass", "WebAuthn credentials table exists");
  }
  
  if (schemaFile.includes("totpSecrets")) {
    addCheck("Schema: totp_secrets", "pass", "TOTP secrets table exists");
  }
}

async function generateReport() {
  const passed = checks.filter(c => c.status === "pass").length;
  const failed = checks.filter(c => c.status === "fail").length;
  const warnings = checks.filter(c => c.status === "warning").length;
  
  console.log("\n" + "=".repeat(80));
  console.log("FINAL DEPLOYMENT CHECK REPORT");
  console.log("=".repeat(80) + "\n");
  
  console.log(`Total Checks: ${checks.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}\n`);
  
  if (failed > 0) {
    console.log("CRITICAL ISSUES (Must Fix):");
    console.log("-".repeat(80));
    for (const check of checks.filter(c => c.status === "fail")) {
      console.log(`\n❌ ${check.name}`);
      console.log(`   ${check.message}`);
    }
  }
  
  if (warnings > 0) {
    console.log("\n\nWARNINGS (Recommended):");
    console.log("-".repeat(80));
    for (const check of checks.filter(c => c.status === "warning")) {
      console.log(`\n⚠️  ${check.name}`);
      console.log(`   ${check.message}`);
    }
  }
  
  console.log("\n\n" + "=".repeat(80));
  
  if (failed === 0) {
    console.log("✅ ALL CRITICAL CHECKS PASSED!");
    console.log("Platform is ready for deployment.");
    if (warnings > 0) {
      console.log(`Note: ${warnings} warning(s) should be reviewed.`);
    }
  } else {
    console.log(`❌ ${failed} CRITICAL ISSUE(S) MUST BE FIXED BEFORE DEPLOYMENT.`);
  }
  
  console.log("=".repeat(80) + "\n");
  
  return { passed, failed, warnings, isReady: failed === 0 };
}

async function main() {
  console.log("Starting final deployment check...\n");
  
  try {
    await checkEnvironment();
    await checkMigrations();
    await checkSecurityMiddleware();
    await checkValidation();
    await checkDatabaseSchema();
    
    const report = await generateReport();
    
    process.exit(report.isReady ? 0 : 1);
  } catch (error) {
    console.error("Deployment check failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
main().catch(console.error);

export { main as runDeploymentCheck };

