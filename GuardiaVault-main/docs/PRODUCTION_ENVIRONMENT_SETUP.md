# Production Environment Setup Guide

This guide provides step-by-step instructions for configuring GuardiaVault for production deployment.

## Overview

Before deploying to production, you must configure several critical environment variables and security settings. This guide covers all required and recommended configurations.

## Critical Security Requirements

### 1. Generate Production Secrets

**Never use development secrets in production!** Generate new secrets for each production environment.

#### Session Secret
```bash
# Generate a secure session secret (32+ characters)
openssl rand -base64 32
```

#### SSN Salt (for hashing sensitive data)
```bash
# Generate a random salt (32+ characters)
openssl rand -hex 32
```

#### Encryption Key (AES-256-GCM)
```bash
# Generate a 64-character hex key (32 bytes)
openssl rand -hex 32
```

### 2. Database Configuration

**Required:** PostgreSQL database URL

```bash
# Production PostgreSQL connection string format:
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Example for managed services:
# - Railway: Provided in dashboard
# - Neon: Provided in dashboard
# - AWS RDS: postgresql://user:pass@your-rds-endpoint:5432/guardiavault?sslmode=require
```

### 3. Application URL

Set your production domain:
```bash
APP_URL=https://yourdomain.com
# Or for Railway: https://your-app.up.railway.app
```

## Complete Production Environment Variables

### Core Configuration

```bash
# Environment
NODE_ENV=production

# Server
PORT=5000
HOST=0.0.0.0
APP_URL=https://yourdomain.com

# CORS (comma-separated allowed origins)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Security & Encryption

```bash
# Session Management
SESSION_SECRET=<generated-with-openssl-rand-base64-32>

# Data Encryption
SSN_SALT=<generated-with-openssl-rand-hex-32>
ENCRYPTION_KEY=<generated-with-openssl-rand-hex-32>
```

### Database

```bash
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
```

### Blockchain/Web3 (if using)

```bash
# Contract Address
VITE_GUARDIA_VAULT_ADDRESS=0x...

# Network Configuration
VITE_CHAIN_ID=1  # Mainnet or appropriate testnet
VITE_SEPOLIA_RPC_URL=https://...
SEPOLIA_RPC_URL=https://...

# Wallet Connection
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# Deployment (keep secure!)
PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=your_key
```

### Email Service (SendGrid)

```bash
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### SMS Service (Twilio) - Optional

```bash
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Error Tracking (Sentry) - Recommended

```bash
# Backend
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=production

# Frontend
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_SENTRY_ENVIRONMENT=production
```

### Payment Processing (Stripe)

```bash
# Use LIVE keys in production
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### Death Verification (Optional)

```bash
DEATH_VERIFICATION_ENABLED=true
DEATH_VERIFICATION_MIN_CONFIDENCE=0.7
DEATH_VERIFICATION_MIN_SOURCES=2

# API Keys (get from providers)
SSDI_API_KEY=xxx
LEGACY_API_KEY=xxx
VITALCHEK_API_KEY=xxx
```

### Logging

```bash
LOG_LEVEL=info  # Use 'info' or 'warn' in production, not 'debug'
```

## Deployment Platforms

### Railway

1. Create a new project in Railway dashboard
2. Connect your repository
3. Add environment variables in Railway dashboard:
   - Go to your service → Variables
   - Add all variables from above
4. Set build command: `npm run build`
5. Set start command: `npm start`

### Docker

Create a `.env.production` file (never commit this!):

```bash
# Copy all production variables above
```

Run:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

1. Clone repository on server
2. Create `.env` file with production variables
3. Run:
   ```bash
   npm install --production
   npm run build
   npm run db:migrate
   npm start
   ```

## Pre-Deployment Checklist

- [ ] All secrets generated (not using dev values)
- [ ] Database URL configured and tested
- [ ] APP_URL set to production domain
- [ ] CORS origins configured
- [ ] Sentry error tracking configured
- [ ] Email service configured (if using)
- [ ] Stripe keys updated to live keys
- [ ] Logging level set to 'info' or 'warn'
- [ ] Smart contracts deployed (if using)
- [ ] Database migrations run
- [ ] SSL/TLS certificates configured
- [ ] Environment variables secured (not in git)
- [ ] Backup strategy in place
- [ ] Monitoring set up

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template only
2. **Rotate secrets regularly** - Especially after any security incident
3. **Use secrets management** - Consider AWS Secrets Manager, HashiCorp Vault, etc.
4. **Enable HTTPS** - Always use SSL/TLS in production
5. **Limit database access** - Use connection pooling and restricted permissions
6. **Monitor logs** - Set up alerts for errors and suspicious activity
7. **Regular updates** - Keep dependencies and system updated
8. **Backup strategy** - Regular automated database backups

## Post-Deployment Verification

1. Check application health: `https://yourdomain.com/health`
2. Verify database connection
3. Test critical user flows (signup, login, vault creation)
4. Check error tracking (Sentry dashboard)
5. Monitor logs for errors
6. Verify email delivery (if configured)
7. Test blockchain integration (if using)

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL format is correct
- Check SSL mode requirements
- Verify firewall rules allow connection
- Test connection from server: `psql $DATABASE_URL`

### Environment Variables Not Loading
- Verify `.env` file exists in root directory
- Check file permissions (should not be world-readable)
- Restart application after adding variables
- Check for typos in variable names

### Build Failures
- Ensure Node.js version matches `.nvmrc`
- Run `npm install` with clean cache: `npm ci`
- Check TypeScript compilation: `npm run check`

## Support

For deployment issues, check:
- [Deployment Documentation](./DEPLOYMENT.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Project README.md

