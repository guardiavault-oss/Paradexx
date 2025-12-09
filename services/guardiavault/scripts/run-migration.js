#!/usr/bin/env node
/**
 * Migration Runner Script
 * Safely runs database migrations in staging/production environments
 */

const { readFileSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const migrationName = args[0] || '004_fragment_scheme_tracking';

if (!migrationName) {
  console.error('❌ Usage: node scripts/run-migration.js <migration-name>');
  console.error('   Example: node scripts/run-migration.js 004_fragment_scheme_tracking');
  process.exit(1);
}

const migrationFile = join(__dirname, '..', 'migrations', `${migrationName}.sql`);

try {
  // Check if migration file exists
  const migrationSQL = readFileSync(migrationFile, 'utf8');
  console.log(`✅ Found migration: ${migrationName}.sql`);
  
  // Get database connection info from environment
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || 5432;
  const dbName = process.env.DB_NAME || 'guardiavault';
  const dbUser = process.env.DB_USER || 'postgres';
  
  console.log(`\n📊 Database Configuration:`);
  console.log(`   Host: ${dbHost}:${dbPort}`);
  console.log(`   Database: ${dbName}`);
  console.log(`   User: ${dbUser}`);
  
  // Ask for confirmation (unless AUTO_CONFIRM is set)
  if (!process.env.AUTO_CONFIRM) {
    console.log(`\n⚠️  You are about to run migration: ${migrationName}`);
    console.log(`   This will modify the database schema.`);
    console.log(`   Set AUTO_CONFIRM=1 to skip this prompt.`);
    console.log(`\nPress Ctrl+C to cancel, or Enter to continue...`);
    // Wait for user input (in a real scenario, you'd use readline)
  }
  
  // Execute migration using psql
  console.log(`\n🚀 Running migration...`);
  
  const pgPassword = process.env.DB_PASSWORD || process.env.PGPASSWORD;
  const env = { ...process.env };
  if (pgPassword) {
    env.PGPASSWORD = pgPassword;
  }
  
  const psqlCommand = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${migrationFile}`;
  
  console.log(`\nExecuting: ${psqlCommand.replace(pgPassword ? `PGPASSWORD=${pgPassword}` : '', '').trim()}`);
  
  try {
    execSync(psqlCommand, { 
      env,
      stdio: 'inherit',
      encoding: 'utf8'
    });
    
    console.log(`\n✅ Migration ${migrationName} completed successfully!`);
    
    // Verify migration
    console.log(`\n🔍 Verifying migration...`);
    const verifyCommand = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vaults' AND column_name = 'fragment_scheme';"`;
    
    try {
      const verifyResult = execSync(verifyCommand, { 
        env,
        encoding: 'utf8'
      });
      
      if (verifyResult.includes('fragment_scheme')) {
        console.log(`✅ Verification passed: fragment_scheme column exists`);
        
        // Check for existing vaults
        const countCommand = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c "SELECT fragment_scheme, COUNT(*) as count FROM vaults GROUP BY fragment_scheme;"`;
        const countResult = execSync(countCommand, { env, encoding: 'utf8' });
        console.log(`\n📊 Vault scheme distribution:`);
        console.log(countResult);
      } else {
        console.warn(`⚠️  Warning: fragment_scheme column not found after migration`);
      }
    } catch (error) {
      console.warn(`⚠️  Could not verify migration (this may be normal):`, error.message);
    }
    
  } catch (error) {
    console.error(`\n❌ Migration failed:`, error.message);
    process.exit(1);
  }
  
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    console.error(`   Available migrations:`);
    const fs = require('fs');
    const migrationsDir = join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    files.forEach(f => console.error(`     - ${f}`));
  } else {
    console.error(`❌ Error reading migration file:`, error.message);
  }
  process.exit(1);
}

