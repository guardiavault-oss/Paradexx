/**
 * Security Audit Script
 * Comprehensive security checks for deployment readiness
 */

import { db } from "../server/db";
import { users, vaults, parties, fragments, checkIns, subscriptions } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

interface SecurityIssue {
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  issue: string;
  file?: string;
  line?: number;
  recommendation: string;
}

const issues: SecurityIssue[] = [];

function addIssue(severity: SecurityIssue["severity"], category: string, issue: string, recommendation: string, file?: string, line?: number) {
  issues.push({ severity, category, issue, recommendation, file, line });
}

async function auditDatabase() {
  console.log("🔍 Auditing database schema...");
  
  try {
    if (!db) {
      addIssue("critical", "database", "Database connection not available", "Ensure DATABASE_URL is set correctly");
      return;
    }

    // Check for missing constraints
    const result = await db.execute(sql`
      SELECT 
        table_name,
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      ORDER BY table_name, constraint_type
    `);

    // Check for indexes on foreign keys
    const indexes = await db.execute(sql`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    // Verify critical indexes exist
    const criticalIndexes = [
      { table: "users", column: "email" },
      { table: "users", column: "wallet_address" },
      { table: "vaults", column: "owner_id" },
      { table: "parties", column: "vault_id" },
      { table: "fragments", column: "vault_id" },
      { table: "check_ins", column: "vault_id" },
    ];

    for (const index of criticalIndexes) {
      const exists = indexes.rows?.some((idx: any) => 
        idx.tablename === index.table && idx.indexdef?.includes(index.column)
      );
      
      if (!exists) {
        addIssue(
          "high",
          "database",
          `Missing index on ${index.table}.${index.column}`,
          `Add index: CREATE INDEX idx_${index.table}_${index.column} ON ${index.table}(${index.column})`
        );
      }
    }

    console.log("✅ Database schema audit complete");
  } catch (error: any) {
    addIssue("critical", "database", `Database audit failed: ${error.message}`, "Check database connection and permissions");
  }
}

async function auditEnvironment() {
  console.log("🔍 Auditing environment variables...");

  const requiredVars = [
    "SESSION_SECRET",
    "DATABASE_URL",
  ];

  const recommendedVars = [
    "SENTRY_DSN",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASS",
    "STRIPE_SECRET_KEY",
    "WEBAUTHN_RP_ID",
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      addIssue("critical", "environment", `Missing required environment variable: ${varName}`, `Set ${varName} in environment`);
    }
  }

  for (const varName of recommendedVars) {
    if (!process.env[varName]) {
      addIssue("medium", "environment", `Missing recommended environment variable: ${varName}`, `Consider setting ${varName} for full functionality`);
    }
  }

  // Check for weak secrets
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    addIssue("high", "security", "SESSION_SECRET is too short (minimum 32 characters)", "Generate a longer random secret");
  }

  if (process.env.SESSION_SECRET === "guardiavault-dev-secret-change-in-production") {
    addIssue("critical", "security", "Using default SESSION_SECRET", "CHANGE SESSION_SECRET in production!");
  }

  console.log("✅ Environment audit complete");
}

async function auditInputValidation() {
  console.log("🔍 Auditing input validation...");

  // Check routes.ts for validation middleware usage
  const routesContent = readFileSync(join(process.cwd(), "server/routes.ts"), "utf-8");
  
  // Critical endpoints that must have validation
  const criticalEndpoints = [
    "/api/auth/register",
    "/api/auth/login",
    "/api/vaults",
    "/api/parties",
    "/api/vaults/recover",
    "/api/checkin",
  ];

  for (const endpoint of criticalEndpoints) {
    const methodPatterns = [
      `app\\.post\\(["']${endpoint.replace("/api", "")}["']`,
      `app\\.get\\(["']${endpoint.replace("/api", "")}["']`,
      `app\\.put\\(["']${endpoint.replace("/api", "")}["']`,
      `app\\.patch\\(["']${endpoint.replace("/api", "")}["']`,
      `app\\.delete\\(["']${endpoint.replace("/api", "")}["']`,
    ];

    const hasValidation = methodPatterns.some(pattern => {
      const regex = new RegExp(pattern);
      const match = routesContent.match(regex);
      if (!match) return false;
      
      const lineIndex = routesContent.substring(0, match.index || 0).split("\n").length;
      const context = routesContent.split("\n").slice(lineIndex - 1, lineIndex + 10).join("\n");
      
      return context.includes("validateBody") || context.includes("validateQuery") || context.includes("validateParams");
    });

    if (!hasValidation) {
      addIssue(
        "high",
        "validation",
        `Endpoint ${endpoint} lacks input validation`,
        `Add validateBody/validateQuery middleware to ${endpoint}`
      );
    }
  }

  console.log("✅ Input validation audit complete");
}

async function auditErrorHandling() {
  console.log("🔍 Auditing error handling...");

  const routesContent = readFileSync(join(process.cwd(), "server/routes.ts"), "utf-8");
  const lines = routesContent.split("\n");

  // Check for routes without try-catch
  let currentEndpoint = "";
  let inAsyncHandler = false;
  let hasTryCatch = false;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.match(/app\.(get|post|put|patch|delete)\(["']/)) {
      currentEndpoint = line.match(/["']([^"']+)["']/)?.[1] || "";
      inAsyncHandler = false;
      hasTryCatch = false;
    }

    if (line.includes("async (req, res)") || line.includes("async(req, res)")) {
      inAsyncHandler = true;
      braceDepth = 0;
    }

    if (inAsyncHandler) {
      if (line.includes("{")) braceDepth++;
      if (line.includes("}")) braceDepth--;

      if (line.includes("try {")) {
        hasTryCatch = true;
      }

      if (braceDepth === 0 && inAsyncHandler && !hasTryCatch && currentEndpoint && line.trim() === "}") {
        // Handler ended without try-catch
        if (!currentEndpoint.includes("/health") && !currentEndpoint.includes("/debug")) {
          addIssue(
            "medium",
            "error-handling",
            `Route handler for ${currentEndpoint} lacks try-catch`,
            `Wrap handler in try-catch block`
          );
        }
        inAsyncHandler = false;
        hasTryCatch = false;
      }
    }
  }

  console.log("✅ Error handling audit complete");
}

async function auditSQLInjection() {
  console.log("🔍 Auditing SQL injection protection...");

  const routesContent = readFileSync(join(process.cwd(), "server/routes.ts"), "utf-8");
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    {
      pattern: /sql`[^`]*\$\{/g,
      issue: "SQL template literals with variable interpolation",
      recommendation: "Use parameterized queries with Drizzle ORM instead"
    },
    {
      pattern: /query\([^)]*\+/g,
      issue: "String concatenation in SQL queries",
      recommendation: "Use parameterized queries"
    },
  ];

  for (const { pattern, issue, recommendation } of dangerousPatterns) {
    const matches = routesContent.match(pattern);
    if (matches && matches.length > 0) {
      // Check if they're in comments
      const allMatches = [...routesContent.matchAll(pattern)];
      for (const match of allMatches) {
        const beforeMatch = routesContent.substring(0, match.index || 0);
        const lastNewline = beforeMatch.lastIndexOf("\n");
        const lineNumber = beforeMatch.substring(0, lastNewline).split("\n").length + 1;
        const lineContent = routesContent.split("\n")[lineNumber - 1];
        
        if (!lineContent.trim().startsWith("//") && !lineContent.trim().startsWith("*")) {
          addIssue(
            "critical",
            "sql-injection",
            issue,
            recommendation,
            "server/routes.ts",
            lineNumber
          );
        }
      }
    }
  }

  console.log("✅ SQL injection audit complete");
}

async function generateReport() {
  console.log("\n" + "=".repeat(80));
  console.log("SECURITY AUDIT REPORT");
  console.log("=".repeat(80) + "\n");

  const bySeverity = {
    critical: issues.filter(i => i.severity === "critical"),
    high: issues.filter(i => i.severity === "high"),
    medium: issues.filter(i => i.severity === "medium"),
    low: issues.filter(i => i.severity === "low"),
  };

  const byCategory: Record<string, SecurityIssue[]> = {};
  for (const issue of issues) {
    if (!byCategory[issue.category]) {
      byCategory[issue.category] = [];
    }
    byCategory[issue.category].push(issue);
  }

  console.log(`Total Issues Found: ${issues.length}\n`);

  console.log("By Severity:");
  console.log(`  Critical: ${bySeverity.critical.length}`);
  console.log(`  High: ${bySeverity.high.length}`);
  console.log(`  Medium: ${bySeverity.medium.length}`);
  console.log(`  Low: ${bySeverity.low.length}\n`);

  console.log("\nCRITICAL ISSUES:");
  console.log("-".repeat(80));
  for (const issue of bySeverity.critical) {
    console.log(`\n[${issue.category.toUpperCase()}] ${issue.issue}`);
    console.log(`  File: ${issue.file || "N/A"}${issue.line ? `:${issue.line}` : ""}`);
    console.log(`  Recommendation: ${issue.recommendation}`);
  }

  console.log("\n\nHIGH PRIORITY ISSUES:");
  console.log("-".repeat(80));
  for (const issue of bySeverity.high) {
    console.log(`\n[${issue.category.toUpperCase()}] ${issue.issue}`);
    console.log(`  Recommendation: ${issue.recommendation}`);
  }

  if (bySeverity.medium.length > 0) {
    console.log("\n\nMEDIUM PRIORITY ISSUES:");
    console.log("-".repeat(80));
    for (const issue of bySeverity.medium.slice(0, 10)) {
      console.log(`\n[${issue.category.toUpperCase()}] ${issue.issue}`);
      console.log(`  Recommendation: ${issue.recommendation}`);
    }
    if (bySeverity.medium.length > 10) {
      console.log(`\n... and ${bySeverity.medium.length - 10} more medium priority issues`);
    }
  }

  console.log("\n\n" + "=".repeat(80));
  
  if (bySeverity.critical.length === 0 && bySeverity.high.length === 0) {
    console.log("✅ No critical or high-priority security issues found!");
    console.log("Platform appears ready for deployment after addressing medium/low priority items.");
  } else {
    console.log(`⚠️  ${bySeverity.critical.length + bySeverity.high.length} critical/high priority issues must be fixed before deployment.`);
  }
  console.log("=".repeat(80) + "\n");

  return {
    total: issues.length,
    bySeverity,
    byCategory,
    isReadyForDeployment: bySeverity.critical.length === 0 && bySeverity.high.length === 0,
  };
}

async function main() {
  console.log("Starting comprehensive security audit...\n");

  await auditDatabase();
  await auditEnvironment();
  await auditInputValidation();
  await auditErrorHandling();
  await auditSQLInjection();

  const report = await generateReport();
  
  process.exit(report.isReadyForDeployment ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

export { main as auditSecurity };

