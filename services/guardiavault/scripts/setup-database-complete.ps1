# Complete Database Setup Script for GuardiaVault
# This script sets up the database using Docker or guides you through local PostgreSQL setup

Write-Host "🚀 GuardiaVault Database Setup" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is available
$dockerAvailable = $false
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
        $dockerAvailable = $true
    }
} catch {
    Write-Host "⚠️  Docker not found or not running" -ForegroundColor Yellow
}

# Check if Docker Desktop is running
$dockerRunning = $false
if ($dockerAvailable) {
    try {
        docker ps > $null 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerRunning = $true
            Write-Host "✅ Docker Desktop is running" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Docker Desktop is not running" -ForegroundColor Yellow
            Write-Host "   Please start Docker Desktop and try again" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Cannot connect to Docker" -ForegroundColor Yellow
    }
}

# Function to check if database is accessible
function Test-DatabaseConnection {
    param([string]$ConnectionString)
    
    try {
        # Try to connect using Node.js script
        $testScript = @"
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1').then(() => {
    console.log('SUCCESS');
    process.exit(0);
}).catch((err) => {
    console.log('FAILED: ' + err.message);
    process.exit(1);
});
"@
        $testScript | Out-File -FilePath "$env:TEMP\test-db.js" -Encoding UTF8
        
        $env:DATABASE_URL = $ConnectionString
        node "$env:TEMP\test-db.js" 2>&1 | Out-Null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

# Check if .env exists and has DATABASE_URL
$envFile = ".env"
$databaseUrl = $null

if (Test-Path $envFile) {
    Write-Host "✅ Found .env file" -ForegroundColor Green
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "DATABASE_URL=(.+)") {
        $databaseUrl = $matches[1].Trim()
        Write-Host "✅ DATABASE_URL found in .env" -ForegroundColor Green
    } else {
        Write-Host "⚠️  DATABASE_URL not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    Write-Host "   Creating .env from env.example..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    $databaseUrl = "postgresql://guardiavault:changeme@localhost:5432/guardiavault"
}

# If Docker is available and running, start database
if ($dockerRunning) {
    Write-Host ""
    Write-Host "🐳 Starting PostgreSQL with Docker..." -ForegroundColor Cyan
    
    # Check if container already exists
    $existingContainer = docker ps -a --filter "name=guardiavault-db" --format "{{.Names}}" 2>&1
    if ($existingContainer -like "*guardiavault-db*") {
        Write-Host "   Container exists, starting it..." -ForegroundColor Yellow
        docker start guardiavault-db 2>&1 | Out-Null
    } else {
        Write-Host "   Creating new container..." -ForegroundColor Yellow
        docker-compose up -d postgres 2>&1 | Out-Null
    }
    
    # Wait for database to be ready
    Write-Host "   Waiting for database to be ready..." -ForegroundColor Yellow
    $maxWait = 30
    $waited = 0
    $ready = $false
    
    while ($waited -lt $maxWait -and -not $ready) {
        Start-Sleep -Seconds 2
        $waited += 2
        try {
            $testResult = docker exec guardiavault-db pg_isready -U guardiavault 2>&1
            if ($LASTEXITCODE -eq 0) {
                $ready = $true
            }
        } catch {
            # Continue waiting
        }
    }
    
    if ($ready) {
        Write-Host "✅ Database is ready!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Database might not be ready yet, but continuing..." -ForegroundColor Yellow
    }
    
    $databaseUrl = "postgresql://guardiavault:changeme@localhost:5432/guardiavault"
} else {
    Write-Host ""
    Write-Host "📋 Manual Database Setup Required" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Start Docker Desktop" -ForegroundColor Cyan
    Write-Host "   1. Start Docker Desktop application" -ForegroundColor White
    Write-Host "   2. Wait for it to fully start" -ForegroundColor White
    Write-Host "   3. Run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Use Local PostgreSQL" -ForegroundColor Cyan
    Write-Host "   1. Install PostgreSQL from https://www.postgresql.org/download/" -ForegroundColor White
    Write-Host "   2. Create database: createdb guardiavault" -ForegroundColor White
    Write-Host "   3. Update DATABASE_URL in .env file" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 3: Use Cloud Database (Neon, Railway, etc.)" -ForegroundColor Cyan
    Write-Host "   1. Create a PostgreSQL database" -ForegroundColor White
    Write-Host "   2. Copy connection string to DATABASE_URL in .env" -ForegroundColor White
    Write-Host ""
    
    if ($databaseUrl) {
        Write-Host "Current DATABASE_URL: $databaseUrl" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Would you like to continue with migrations anyway? (y/n)" -ForegroundColor Yellow
        $continue = Read-Host
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-Host "Exiting. Please set up database first." -ForegroundColor Red
            exit 1
        }
    }
}

# Test database connection
Write-Host ""
Write-Host "🔍 Testing database connection..." -ForegroundColor Cyan
if ($databaseUrl) {
    $env:DATABASE_URL = $databaseUrl
    $connected = Test-DatabaseConnection -ConnectionString $databaseUrl
    
    if ($connected) {
        Write-Host "✅ Database connection successful!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Cannot connect to database" -ForegroundColor Yellow
        Write-Host "   URL: $databaseUrl" -ForegroundColor Gray
        Write-Host "   Please check:" -ForegroundColor Yellow
        Write-Host "   - Database is running" -ForegroundColor White
        Write-Host "   - Connection string is correct" -ForegroundColor White
        Write-Host "   - Firewall/network allows connection" -ForegroundColor White
        Write-Host ""
        Write-Host "Continuing with migrations anyway..." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  No DATABASE_URL configured" -ForegroundColor Yellow
}

# Run migrations
Write-Host ""
Write-Host "📝 Running database migrations..." -ForegroundColor Cyan

# First, push schema using drizzle-kit
Write-Host "   1. Pushing schema to database..." -ForegroundColor Yellow
$env:DATABASE_URL = $databaseUrl
pnpm run db:push 2>&1 | Out-Host

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Schema pushed successfully" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Schema push had issues (might be OK if tables exist)" -ForegroundColor Yellow
}

# Apply manual migrations
Write-Host "   2. Applying manual migrations..." -ForegroundColor Yellow

$migrationFiles = @(
    "migrations/001_death_verification.sql",
    "migrations/002_landing_page_features.sql",
    "migrations/003_recovery_system.sql",
    "migrations/004_fragment_scheme_tracking.sql",
    "migrations/005_security_constraints.sql",
    "migrations/006_guardian_referral_discounts.sql",
    "migrations/006_recovery_setups.sql",
    "migrations/007_smart_wills.sql",
    "migrations/008_notifications.sql",
    "migrations/009_add_totp_columns.sql",
    "migrations/010_production_features.sql",
    "migrations/011_query_optimization_indexes.sql",
    "migrations/012_hardware_devices.sql"
)

foreach ($migration in $migrationFiles) {
    if (Test-Path $migration) {
        Write-Host "      Applying $migration..." -ForegroundColor Gray
        # Use Node.js to run the migration
        $migrationScript = @'
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sql = fs.readFileSync('MIGRATION_FILE', 'utf8');

pool.query(sql)
  .then(() => {
    console.log('SUCCESS');
    process.exit(0);
  })
  .catch((err) => {
    if (err.message.includes('already exists') || err.message.includes('duplicate')) {
      console.log('SKIPPED (already exists)');
      process.exit(0);
    } else {
      console.log('ERROR: ' + err.message);
      process.exit(1);
    }
  });
'@
        $migrationScript = $migrationScript.Replace('MIGRATION_FILE', $migration)
        $migrationScript | Out-File -FilePath "$env:TEMP\run-migration.js" -Encoding UTF8
        $env:DATABASE_URL = $databaseUrl
        $result = node "$env:TEMP\run-migration.js" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            if ($result -like "*SUCCESS*") {
                Write-Host "      ✅ Applied successfully" -ForegroundColor Green
            } elseif ($result -like "*SKIPPED*") {
                Write-Host "      ⏭️  Skipped (already exists)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "      ⚠️  Error: $result" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "🎉 Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run tests: npm test" -ForegroundColor White
Write-Host "   2. Start server: npm run dev" -ForegroundColor White
Write-Host "   3. Open Drizzle Studio: npm run db:studio" -ForegroundColor White

