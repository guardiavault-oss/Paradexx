/**
 * Apply Landing Page Features Migration
 * Creates tables for AI Risk Monitor, Behavioral Biometrics, Legacy Messages, and Smart Contracts
 * 
 * Usage:
 *   tsx server/scripts/apply-landing-features-migration.ts
 *   OR
 *   DATABASE_URL="postgresql://..." tsx server/scripts/apply-landing-features-migration.ts
 */

import "dotenv/config"; // Load .env file
import { readFileSync } from "fs";
import { join } from "path";
import pgPromise from "pg-promise";

async function applyMigration() {
  // Get DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("❌ Error: DATABASE_URL environment variable is not set");
    console.log("\nPlease set DATABASE_URL before running this script:");
    console.log("  export DATABASE_URL='postgresql://user:password@host:5432/database'");
    console.log("  # OR");
    console.log("  DATABASE_URL='postgresql://...' tsx server/scripts/apply-landing-features-migration.ts");
    process.exit(1);
  }

  try {
    console.log("📋 Reading migration file...");
    const migrationPath = join(process.cwd(), "migrations", "002_landing_page_features.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    console.log("🔌 Connecting to database...");
    const pg = pgPromise();
    const db = pg(databaseUrl);

    // Test connection first
    await db.one("SELECT 1 as test");

    console.log("🚀 Applying migration...");
    console.log("   (This may take a few moments...)");
    
    // Execute migration in a transaction
    await db.tx(async (t) => {
      // Execute the entire migration SQL
      await t.none(migrationSQL);
      return true;
    });

    console.log("\n✅ Migration applied successfully!");
    console.log("\nCreated tables:");
    console.log("  ✓ legacy_messages");
    console.log("  ✓ ai_risk_events");
    console.log("  ✓ behavioral_biometrics");
    console.log("  ✓ vault_smart_contracts");
    console.log("\nCreated enums:");
    console.log("  ✓ legacy_message_type");
    console.log("  ✓ legacy_message_status");
    console.log("  ✓ security_event_type");
    console.log("  ✓ security_event_severity");
    console.log("  ✓ biometric_data_type");
    console.log("  ✓ contract_deployment_status");
    console.log("\n🎉 Landing page features database setup complete!");

    await db.$pool.end();
  } catch (error: any) {
    console.error("\n❌ Migration failed!");
    console.error("Error:", error.message);

    if (error.code === "42P07") {
      console.error("\n⚠️  Table already exists - this is okay if migration was already applied");
      console.log("   You can safely ignore this error.");
    } else if (error.code === "23505") {
      console.error("\n⚠️  Duplicate key error - migration may have been partially applied");
      console.log("   Check your database to see which tables were created.");
    } else if (error.code === "42710") {
      console.error("\n⚠️  Enum/type already exists - some parts of migration were already applied");
      console.log("   This is usually safe to ignore.");
    } else {
      console.error("\nFull error details:");
      console.error(error);
      console.log("\n💡 Troubleshooting:");
      console.log("   1. Check DATABASE_URL is correct");
      console.log("   2. Ensure database exists and is accessible");
      console.log("   3. Check migration file exists: migrations/002_landing_page_features.sql");
      console.log("   4. Review PostgreSQL logs for more details");
    }

    process.exit(1);
  }
}

applyMigration();

