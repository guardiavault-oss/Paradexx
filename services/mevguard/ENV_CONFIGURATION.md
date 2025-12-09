# Environment Configuration Guide

## Quick Setup

Create a `.env` file in the project root with the following configuration:

```bash
# ============================================================================
# REQUIRED SECURITY SETTINGS
# ============================================================================
# Generate using: openssl rand -hex 32

JWT_SECRET=REPLACE_WITH_32_BYTE_HEX_STRING
API_KEY=REPLACE_WITH_32_BYTE_HEX_STRING
ENCRYPTION_KEY=REPLACE_WITH_32_BYTE_HEX_STRING

# ============================================================================
# DATABASE (REQUIRED)
# ============================================================================
DATABASE_URL=postgresql://mev_user:STRONG_PASSWORD_HERE@postgres:5432/mev_protection
DB_PASSWORD=STRONG_PASSWORD_HERE

# ============================================================================
# REDIS CACHE (REQUIRED)
# ============================================================================
REDIS_URL=redis://:STRONG_PASSWORD_HERE@redis:6379/0
REDIS_PASSWORD=STRONG_PASSWORD_HERE

# ============================================================================
# BLOCKCHAIN RPC (At least one REQUIRED)
# ============================================================================
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-rpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc

# ============================================================================
# CORS SECURITY (REQUIRED)
# ============================================================================
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# ============================================================================
# MONITORING (REQUIRED)
# ============================================================================
GRAFANA_ADMIN_PASSWORD=STRONG_PASSWORD_HERE
SENTRY_DSN=https://YOUR_SENTRY_DSN@sentry.io/PROJECT_ID

# ============================================================================
# MEMPOOL SERVICE INTEGRATION (RECOMMENDED)
# ============================================================================
# If you have a comprehensive mempool monitoring system, set this to use it
# instead of duplicate monitoring. Falls back to direct Web3 if not set.
MEMPOOL_API_URL=http://localhost:8001

# ============================================================================
# OPTIONAL SETTINGS
# ============================================================================
ENVIRONMENT=production
LOG_LEVEL=INFO
DEFAULT_PROTECTION_LEVEL=high
ENABLE_PRIVATE_MEMPOOL=true
MAX_GAS_PRICE_GWEI=500
```

## Security Checklist

- [ ] All passwords are strong and unique
- [ ] JWT_SECRET is a random 32-byte hex string
- [ ] API_KEY is a random 32-byte hex string  
- [ ] ENCRYPTION_KEY is a random 32-byte hex string
- [ ] Database password is strong (16+ characters)
- [ ] Redis password is strong (16+ characters)
- [ ] Grafana admin password is changed from default
- [ ] CORS origins are restricted to your domains only
- [ ] .env file is in .gitignore (never commit it!)

## Generating Secure Secrets

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate API key
openssl rand -hex 32

# Generate encryption key
openssl rand -hex 32

# Generate strong password (20 characters)
openssl rand -base64 20
```

## Full Configuration Reference

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete environment variable documentation.

