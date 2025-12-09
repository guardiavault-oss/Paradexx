/**
 * Apply Death Verification Migration
 * Helper script to apply the death verification migration
 * 
 * Usage:
 *   tsx server/scripts/apply-death-verification-migration.ts
 *   OR
 *   DATABASE_URL="postgresql://..." tsx server/scripts/apply-death-verification-migration.ts
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
    console.log("  DATABASE_URL='postgresql://...' tsx server/scripts/apply-death-verification-migration.ts");
    process.exit(1);
  }

  try {
    console.log("📋 Reading migration file...");
    const migrationPath = join(process.cwd(), "migrations", "001_death_verification.sql");
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

    console.log("✅ Migration applied successfully!");
    console.log("\n📊 Verifying migration...");

    // Verify tables were created
    const tables = await db.manyOrNone(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%death%' OR table_name LIKE '%ssdi%' OR table_name LIKE '%consent%' OR table_name LIKE '%proof%')
      ORDER BY table_name
    `);

    console.log("\n✅ Created tables:");
    tables.forEach((table: any) => {
      console.log(`   - ${table.table_name}`);
    });

    // Verify users table columns
    const columns = await db.manyOrNone(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND (column_name LIKE '%death%' OR column_name LIKE '%ssdi%' OR column_name LIKE '%verification%' OR column_name = 'status')
      ORDER BY column_name
    `);

    console.log("\n✅ Extended users table with columns:");
    columns.forEach((col: any) => {
      console.log(`   - ${col.column_name}`);
    });

    // Verify enums
    const enums = await db.manyOrNone(`
      SELECT typname 
      FROM pg_type 
      WHERE typname LIKE '%death_verification%'
      ORDER BY typname
    `);

    console.log("\n✅ Created enum types:");
    enums.forEach((enumType: any) => {
      console.log(`   - ${enumType.typname}`);
    });

    await db.$pool.end();
    
    console.log("\n🎉 Migration complete! Death verification system is ready.");
    console.log("\n📝 Next steps:");
    console.log("   1. Set DEATH_VERIFICATION_ENABLED=true in your .env");
    console.log("   2. Configure API keys (SSDI_API_KEY, LEGACY_API_KEY, VITALCHEK_API_KEY)");
    console.log("   3. Start the server to enable cron jobs");
    
  } catch (error: any) {
    console.error("\n❌ Migration failed!");
    console.error("Error:", error.message);
    
    if (error.code) {
      console.error(`PostgreSQL Error Code: ${error.code}`);
    }
    
    if (error.detail) {
      console.error(`Details: ${error.detail}`);
    }
    
    if (error.hint) {
      console.error(`Hint: ${error.hint}`);
    }
    
    if (error.position) {
      console.error(`Position: ${error.position}`);
    }
    
    if (error.query) {
      console.error(`Failed Query: ${error.query.substring(0, 200)}...`);
    }
    
    if (error.message.includes("already exists")) {
      console.log("\n💡 Note: Some objects may already exist. The migration is idempotent and safe to re-run.");
      console.log("   You can safely ignore 'already exists' errors.");
    }
    
    if (error.message.includes("relation") && error.message.includes("does not exist")) {
      console.log("\n💡 Note: The 'users' table might not exist yet.");
      console.log("   Make sure you've run the base schema migrations first.");
    }
    
    console.error("\n🔍 Full error details:");
    console.error(JSON.stringify(error, null, 2));
    
    process.exit(1);
  }
}

applyMigration().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});

