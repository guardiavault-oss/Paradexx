#!/bin/sh
# Production startup script for Railway
# Runs database migrations, then starts the server using pnpm start

PORT=${PORT:-5000}
echo "Starting server on port $PORT (uid: $(id -u), node: $(node -v), pnpm: $(pnpm -v 2>/dev/null || echo 'pnpm-not-found'))"
echo "📊 Environment: ${NODE_ENV:-production}"

# Configure DNS fallback for Railway (if Railway's internal DNS fails)
# Railway uses internal DNS (fd12::10) which may not resolve external domains
if [ -f /etc/resolv.conf.backup ] && [ -w /etc/resolv.conf ]; then
  # Test if current DNS can resolve external domains
  if command -v nslookup >/dev/null 2>&1; then
    if ! nslookup api.lido.fi >/dev/null 2>&1; then
      echo "⚠️  Railway DNS failing, attempting to use public DNS fallback..."
      # Try to use backup DNS config (requires root, may not work in Railway)
      # Railway may override this, but it's worth trying
      if [ "$(id -u)" = "0" ]; then
        cp /etc/resolv.conf.backup /etc/resolv.conf 2>/dev/null && \
        echo "    → Switched to public DNS servers (8.8.8.8, 8.8.4.4, 1.1.1.1)"
      fi
    fi
  fi
fi

# Test network connectivity and DNS resolution
echo "🌐 Testing network connectivity..."
if command -v nslookup >/dev/null 2>&1; then
  echo "  → Testing DNS resolution for api.lido.fi..."
  if nslookup api.lido.fi >/dev/null 2>&1; then
    echo "    ✅ DNS resolution working (api.lido.fi)"
  else
    echo "    ⚠️  DNS resolution failed for api.lido.fi"
    echo "    → Checking current DNS servers..."
    cat /etc/resolv.conf 2>/dev/null || echo "    ⚠️  Cannot read /etc/resolv.conf"
    echo "    → Note: Railway may be using internal DNS. API calls will use Node.js DNS resolver."
  fi
  
  echo "  → Testing DNS resolution for aave-api-v3.aave.com..."
  if nslookup aave-api-v3.aave.com >/dev/null 2>&1; then
    echo "    ✅ DNS resolution working (aave-api-v3.aave.com)"
  else
    echo "    ⚠️  DNS resolution failed for aave-api-v3.aave.com"
  fi
fi

# Test HTTPS connectivity to required APIs
echo "  → Testing HTTPS connectivity to Lido API..."
if command -v curl >/dev/null 2>&1; then
  if curl -s --max-time 10 --connect-timeout 5 https://api.lido.fi/v1/steth/apr >/dev/null 2>&1; then
    echo "    ✅ HTTPS connection to Lido API successful"
  else
    echo "    ⚠️  HTTPS connection to Lido API failed (may be network/firewall issue)"
  fi
  
  echo "  → Testing HTTPS connectivity to Aave API..."
  if curl -s --max-time 10 --connect-timeout 5 https://aave-api-v3.aave.com/data/pools >/dev/null 2>&1; then
    echo "    ✅ HTTPS connection to Aave API successful"
  else
    echo "    ⚠️  HTTPS connection to Aave API failed (may be network/firewall issue)"
  fi
else
  echo "    ⚠️  curl not available, skipping HTTPS connectivity test"
fi

echo "✅ Network connectivity check complete"

# Run migrations if DATABASE_URL is set (non-blocking - server will start even if migrations fail)
if [ -n "$DATABASE_URL" ]; then
  echo "✅ DATABASE_URL is configured"
  echo "📝 Running database migrations..."
  
  # Skip drizzle-kit push in production - it requires devDependencies
  # Manual SQL migrations handle schema updates in production
  if [ "$NODE_ENV" != "production" ] && command -v drizzle-kit >/dev/null 2>&1; then
    echo "📋 Creating/updating database tables from schema..."
    pnpm drizzle-kit push 2>&1 || echo "⚠️  drizzle-kit push failed (tables may already exist)"
  else
    echo "📋 Skipping drizzle-kit push (production mode - using manual migrations)"
  fi
  
  # Apply manual SQL migrations if they exist
  if [ -d "migrations" ] && ls migrations/*.sql 1> /dev/null 2>&1; then
    echo "📝 Applying manual SQL migrations..."
    for migration in migrations/*.sql; do
      if [ -f "$migration" ]; then
        echo "  → Applying $(basename $migration)..."
        node -e "
          const { Client } = require('pg');
          const fs = require('fs');
          const client = new Client({ connectionString: process.env.DATABASE_URL });
          (async () => {
            try {
              await client.connect();
              const sql = fs.readFileSync('$migration', 'utf8');
              await client.query(sql);
              console.log('    ✅ Applied successfully');
              process.exit(0);
            } catch (err) {
              const msg = err.message || String(err);
              if (msg.includes('already exists') || msg.includes('duplicate') || (msg.includes('column') && msg.includes('already exists'))) {
                console.log('    ⚠️  Already applied (skipping)');
                process.exit(0);
              } else {
                console.error('    ⚠️  Error:', msg);
                process.exit(0); // Don't fail startup on migration errors
              }
            } finally {
              await client.end().catch(() => {});
            }
          })();
        " 2>&1 || echo "    ⚠️  Migration skipped or already applied"
      fi
    done
    echo "✅ Manual migrations processing complete"
  fi
else
  echo "⚠️  WARNING: DATABASE_URL not set. Migrations will be skipped."
fi

# Start the server using pnpm start (exec replaces PID 1 and forwards signals)
# This ensures Railway can properly manage the process lifecycle
echo "🚀 Starting server..."
exec pnpm start
