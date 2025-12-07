/**
 * Database Migration Runner
 * Manages database migrations with tracking and rollback capability
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from project root
config({ path: resolve(__dirname, '../../../.env') });

// Initialize database connection
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper function to execute SQL queries directly
async function executeSQL(query: string) {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(query);
      return result;
    } finally {
      client.release();
    }
  } catch (error: any) {
    // Improve error messages for common connection issues
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`Database connection refused. Is the database running? Error: ${error.message}`);
    }
    if (error.code === 'ENOTFOUND') {
      throw new Error(`Database host not found. Check DATABASE_URL. Error: ${error.message}`);
    }
    if (error.code === '28P01') {
      throw new Error(`Database authentication failed. Check username/password in DATABASE_URL. Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Create migrations tracking table if it doesn't exist
 */
async function ensureMigrationsTable() {
  await executeSQL(`
    CREATE TABLE IF NOT EXISTS drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log('✅ Migrations tracking table ready');
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations(): Promise<string[]> {
  const result = await executeSQL(`
    SELECT hash FROM drizzle_migrations ORDER BY created_at ASC
  `);
  return result.rows.map((row: { hash: string }) => row.hash);
}

/**
 * Record a migration as applied
 */
async function recordMigration(hash: string) {
  await executeSQL(`
    INSERT INTO drizzle_migrations (hash)
    VALUES ('${hash.replace(/'/g, "''")}')
    ON CONFLICT (hash) DO NOTHING
  `);
}

/**
 * Remove a migration from tracking (for rollback)
 */
async function removeMigration(hash: string) {
  await executeSQL(`
    DELETE FROM drizzle_migrations WHERE hash = '${hash.replace(/'/g, "''")}'
  `);
}

/**
 * Get migration files from migrations directory
 */
function getMigrationFiles(): string[] {
  const migrationsDir = path.join(__dirname, '../../drizzle/migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  const files = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  return files;
}

/**
 * Read migration file content
 */
function readMigrationFile(filename: string): string {
  const migrationsDir = path.join(__dirname, '../../drizzle/migrations');
  const filePath = path.join(migrationsDir, filename);
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Get hash from migration filename
 * Format: pg_XXXXX_hash.sql
 */
function getHashFromFilename(filename: string): string {
  const match = filename.match(/pg_\d+_(.+)\.sql/);
  return match ? match[1] : filename.replace('.sql', '');
}

/**
 * Run a single migration
 */
async function runMigration(filename: string, sqlContent: string) {
  const hash = getHashFromFilename(filename);
  
  console.log(`\n📦 Running migration: ${filename}`);
  
  try {
    // Execute migration SQL
    await executeSQL(sqlContent);
    
    // Record migration as applied
    await recordMigration(hash);
    
    console.log(`✅ Migration applied: ${filename}`);
  } catch (error: any) {
    console.error(`❌ Failed to apply migration ${filename}:`, error.message);
    throw error;
  }
}

/**
 * Rollback a single migration
 */
async function rollbackMigration(filename: string) {
  const hash = getHashFromFilename(filename);
  
  console.log(`\n🔄 Rolling back migration: ${filename}`);
  
  try {
    // Read the migration file to extract rollback SQL
    // Note: Drizzle doesn't generate rollback SQL by default
    // This is a placeholder - you'd need to maintain rollback scripts separately
    const sqlContent = readMigrationFile(filename);
    
    // For now, we just remove it from tracking
    // In production, you'd need to manually create rollback SQL
    await removeMigration(hash);
    
    console.log(`⚠️  Migration removed from tracking: ${filename}`);
    console.log(`⚠️  Note: Rollback SQL not automatically generated. Manual rollback may be required.`);
  } catch (error: any) {
    console.error(`❌ Failed to rollback migration ${filename}:`, error.message);
    throw error;
  }
}

/**
 * Run all pending migrations
 */
export async function migrateUp() {
  try {
    console.log('🚀 Starting migration process...\n');
    
    // Ensure migrations table exists
    await ensureMigrationsTable();
    
    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations();
    console.log(`📋 Applied migrations: ${appliedMigrations.length}`);
    
    // Get all migration files
    const migrationFiles = getMigrationFiles();
    console.log(`📁 Migration files found: ${migrationFiles.length}`);
    
    if (migrationFiles.length === 0) {
      console.log('ℹ️  No migration files found in drizzle/migrations');
      return;
    }
    
    // Find pending migrations
    const pendingMigrations = migrationFiles.filter((file) => {
      const hash = getHashFromFilename(file);
      return !appliedMigrations.includes(hash);
    });
    
    if (pendingMigrations.length === 0) {
      console.log('✅ All migrations are already applied');
      return;
    }
    
    console.log(`\n📦 Pending migrations: ${pendingMigrations.length}`);
    
    // Run pending migrations
    for (const file of pendingMigrations) {
      const sqlContent = readMigrationFile(file);
      await runMigration(file, sqlContent);
    }
    
    console.log(`\n✅ Migration process complete! Applied ${pendingMigrations.length} migration(s)`);
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message || error.toString());
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.detail) {
      console.error(`   Details: ${error.detail}`);
    }
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Verify DATABASE_URL is correct in .env file');
    console.error('   2. Ensure database is running (Docker Desktop or local PostgreSQL)');
    console.error('   3. Check database connection: docker ps (for Docker) or pg_isready (for local)');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Rollback the last migration
 */
export async function migrateDown() {
  try {
    console.log('🔄 Starting rollback process...\n');
    
    // Ensure migrations table exists
    await ensureMigrationsTable();
    
    // Get applied migrations (most recent first)
    const appliedMigrations = await getAppliedMigrations();
    
    if (appliedMigrations.length === 0) {
      console.log('ℹ️  No migrations to rollback');
      return;
    }
    
    // Get all migration files
    const migrationFiles = getMigrationFiles();
    
    // Find the last applied migration
    const lastAppliedHash = appliedMigrations[appliedMigrations.length - 1];
    const lastMigrationFile = migrationFiles.find((file) => 
      getHashFromFilename(file) === lastAppliedHash
    );
    
    if (!lastMigrationFile) {
      console.log('⚠️  Last applied migration file not found');
      return;
    }
    
    await rollbackMigration(lastMigrationFile);
    
    console.log(`\n✅ Rollback complete!`);
  } catch (error: any) {
    console.error('\n❌ Rollback failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Show migration status
 */
export async function migrateStatus() {
  try {
    await ensureMigrationsTable();
    
    const appliedMigrations = await getAppliedMigrations();
    const migrationFiles = getMigrationFiles();
    
    console.log('\n📊 Migration Status\n');
    console.log(`Total migration files: ${migrationFiles.length}`);
    console.log(`Applied migrations: ${appliedMigrations.length}`);
    console.log(`Pending migrations: ${migrationFiles.length - appliedMigrations.length}\n`);
    
    if (migrationFiles.length > 0) {
      console.log('Migration Files:');
      migrationFiles.forEach((file) => {
        const hash = getHashFromFilename(file);
        const isApplied = appliedMigrations.includes(hash);
        const status = isApplied ? '✅ Applied' : '⏳ Pending';
        console.log(`  ${status} - ${file}`);
      });
    }
  } catch (error: any) {
    console.error('❌ Failed to get migration status:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// CLI entry point
const command = process.argv[2];

if (command === 'up') {
  migrateUp();
} else if (command === 'down') {
  migrateDown();
} else if (command === 'status') {
  migrateStatus();
} else {
  console.log(`
Usage: tsx server/scripts/migrate.ts <command>

Commands:
  up      Run all pending migrations
  down    Rollback the last migration
  status  Show migration status

Examples:
  tsx server/scripts/migrate.ts up
  tsx server/scripts/migrate.ts down
  tsx server/scripts/migrate.ts status
  `);
  process.exit(1);
}

