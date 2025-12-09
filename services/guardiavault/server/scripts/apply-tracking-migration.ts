/**
 * Apply Tracking Tables Migration
 * Creates optimization history, party history, protocol cache, death certificates, and system config tables
 *
 * Usage:
 *   tsx server/scripts/apply-tracking-migration.ts
 *   OR
 *   DATABASE_URL="postgresql://..." tsx server/scripts/apply-tracking-migration.ts
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
    console.log("  DATABASE_URL='postgresql://...' tsx server/scripts/apply-tracking-migration.ts");
    process.exit(1);
  }

  try {
    console.log("📋 Reading migration file...");
    const migrationPath = join(process.cwd(), "migrations", "013_tracking_tables.sql");
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
    console.log("  ✓ optimization_history");
    console.log("  ✓ party_history");
    console.log("  ✓ protocol_cache");
    console.log("  ✓ death_certificates");
    console.log("  ✓ system_config");
    console.log("\nCreated indexes:");
    console.log("  ✓ Optimization history indexes");
    console.log("  ✓ Party history indexes");
    console.log("  ✓ Protocol cache indexes");
    console.log("  ✓ Death certificates indexes");
    console.log("  ✓ System config indexes");
    console.log("\n🎉 Tracking tables database setup complete!");

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
      console.log("   3. Check migration file exists: migrations/013_tracking_tables.sql");
      console.log("   4. Review PostgreSQL logs for more details");
    }

    process.exit(1);
  }
}

applyMigration();
