# Death Verification System Setup

This document describes the death verification system integration for GuardiaVault.

## Overview

The death verification system integrates multiple data sources to automatically detect user deaths and trigger vault recovery:

1. **SSDI (Social Security Death Index)** - Primary source
2. **Obituary Scraping** - Secondary verification
3. **Death Certificate APIs** - Official verification
4. **Consensus Engine** - Multi-source verification

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              DEATH VERIFICATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │   SSDI API   │   │  Obituaries  │   │ Death Cert   │    │
│  │   Monitor    │   │   Scraper    │   │     API      │    │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘    │
│         │                   │                   │             │
│         └───────────────────┼───────────────────┘             │
│                             ▼                                │
│                  ┌──────────────────────┐                   │
│                  │  Consensus Engine    │                   │
│                  │   (Multi-Source)     │                   │
│                  └──────────┬───────────┘                   │
│                             ▼                                │
│                  ┌──────────────────────┐                   │
│                  │   Smart Contract     │                   │
│                  │   Vault Trigger      │                   │
│                  └──────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## Setup Steps

### Step 1: Database Migration

Run migration to add death verification tables:

```bash
pnpm run db:generate
pnpm run db:migrate
```

This creates:
- `death_verification_events` - Verification records
- `ssdi_check_log` - SSDI check history
- `death_certificate_orders` - Certificate orders
- `consent_log` - Consent audit trail
- `proof_of_life_challenges` - Proof of life challenges

### Step 2: Extend Users Table

Add death verification columns to users table:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS ssn_hash VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_known_location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS death_monitoring_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_tier INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ssdi_check TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ssdi_consent_given BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ssdi_consent_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ssdi_consent_ip_address INET;
ALTER TABLE users ADD COLUMN IF NOT EXISTS death_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS death_confidence_score DECIMAL(3,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
```

### Step 3: Environment Variables

Add to `.env`:

```bash
# SSDI Configuration
SSDI_API_KEY=your_genealogybank_api_key
SSDI_API_URL=https://api.genealogybank.com/ssdi
SSDI_BATCH_SIZE=1000

# Obituary Scraping
LEGACY_API_KEY=your_legacy_api_key
OBITUARY_ENABLED=true

# Death Certificate
VITALCHEK_API_KEY=your_vitalchek_api_key
DEATH_CERT_ENABLED=true

# Encryption
SSN_SALT=your_random_salt_for_ssn_hashing
ENCRYPTION_KEY=your_32_byte_hex_key
```

### Step 4: Install Dependencies

```bash
pnpm add axios cheerio puppeteer natural
```

For scraping (optional):
```bash
pnpm add puppeteer
```

### Step 5: Schedule Cron Jobs

Add to `server/jobs/ssdiCron.ts`:

```typescript
import cron from 'node-cron';
import ssdiMonitor from '../services/ssdiMonitor';

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🕐 Starting SSDI monitoring job...');
  try {
    await ssdiMonitor.runDailyCheck();
  } catch (error) {
    console.error('SSDI monitoring job failed:', error);
  }
});
```

### Step 6: API Endpoints

Add consent endpoint in `server/routes.ts`:

```typescript
// Consent for death monitoring
app.post('/api/users/consent/death-monitoring', requireAuth, async (req, res) => {
  // Handle consent (see implementation)
});
```

## Services

### SSDI Monitor Service

**File**: `server/services/ssdiMonitor.ts`

Monitors SSDI daily for death records.

**Usage**:
```typescript
import ssdiMonitor from './services/ssdiMonitor';

// Run daily check
await ssdiMonitor.runDailyCheck();

// Check specific user
await ssdiMonitor.checkUserSSDI(user);
```

### Obituary Scraper Service

**File**: `server/services/obituaryScraper.ts` (to be created)

Searches obituaries across multiple sources.

### Death Certificate Service

**File**: `server/services/deathCertificateService.ts` (to be created)

Handles death certificate ordering and verification.

### Consensus Engine

**File**: `server/services/deathConsensusEngine.ts` (to be created)

Verifies death from multiple sources and triggers vault release.

## Privacy & Security

### SSN Handling

- **Never store plaintext SSN**
- Store SHA-256 hash only: `hashSSN(ssn, salt)`
- Use for matching only, cannot be reversed

### Consent Management

- Explicit consent required before monitoring
- Consent logged with IP address and timestamp
- Users can revoke consent at any time

### Encryption

- Personal data encrypted at rest
- AES-256-GCM for sensitive fields
- Encryption keys stored securely

## Legal Considerations

⚠️ **Important**: This system is for detecting inactivity, not legal death verification. Always consult legal counsel before implementing.

1. **Compliance**: HIPAA, GDPR, state privacy laws
2. **Consent**: Explicit written consent required
3. **Data Retention**: Follow legal requirements
4. **Dispute Process**: Allow users to dispute death reports
5. **Proof of Life**: 72-hour challenge period

## Testing

### Test SSDI Check

```bash
# Test single user check
curl -X POST http://localhost:5000/api/admin/test-ssdi-check \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"userId": "user-id"}'
```

### Test Death Verification

```bash
# Simulate death match (test only)
curl -X POST http://localhost:5000/api/admin/simulate-death \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"userId": "user-id"}'
```

## Monitoring

- **SSDI Check Logs**: Track all checks in `ssdi_check_log` table
- **Verification Events**: All verification attempts in `death_verification_events`
- **Alerts**: Send alerts on death matches
- **Metrics**: Track check frequency, match rate, false positives

## Next Steps

1. ✅ Schema created
2. ✅ SSDI service created
3. ⏳ Create obituary scraper service
4. ⏳ Create death certificate service
5. ⏳ Create consensus engine
6. ⏳ Add API endpoints
7. ⏳ Add cron jobs
8. ⏳ Test integration
9. ⏳ Deploy to staging

## Additional Resources

- SSDI Provider Documentation
- Obituary API Documentation
- Death Certificate API Documentation
- Legal Compliance Guide

---

**Status**: Initial implementation complete. Additional services pending.

