# Death Verification System - Implementation Complete

## ✅ Implementation Summary

The death verification system has been fully implemented with the following components:

### 1. Database Schema ✅

**File**: `shared/schema.death-verification.ts`

**Tables Created**:
- `death_verification_events` - All verification records from all sources
- `ssdi_check_log` - SSDI check history and API responses
- `death_certificate_orders` - Certificate ordering and tracking
- `consent_log` - Consent audit trail for compliance
- `proof_of_life_challenges` - Proof of life challenge tracking

**Users Table Extensions** (requires migration):
- `ssn_hash` - Hashed SSN (never plaintext)
- `full_name` - Full name for matching
- `date_of_birth` - Date of birth
- `last_known_location` - Last known location
- `death_monitoring_enabled` - Enable/disable monitoring
- `verification_tier` - Verification level (1-4)
- `last_ssdi_check` - Last SSDI check timestamp
- `ssdi_consent_given` - Consent flag
- `ssdi_consent_date` - Consent timestamp
- `ssdi_consent_ip_address` - IP address at consent
- `death_verified_at` - Death verification timestamp
- `death_confidence_score` - Final confidence score
- `status` - User status (active/deceased/verification_pending)

### 2. SSDI Monitoring Service ✅

**File**: `server/services/ssdiMonitor.ts`

**Features**:
- Daily SSDI checks for all consenting users
- Multiple provider support (GenealogyBank, FamilySearch)
- Match scoring and confidence calculation
- Automatic verification event creation
- Secondary verification triggers
- Comprehensive logging

**Usage**:
```typescript
import ssdiMonitor from './services/ssdiMonitor';

// Run daily check
await ssdiMonitor.runDailyCheck();

// Check specific user
await ssdiMonitor.checkUserSSDI(user);
```

### 3. Obituary Scraper Service ✅

**File**: `server/services/obituaryScraper.ts`

**Features**:
- Multi-source obituary search (Legacy.com, Tributes.com, FindAGrave)
- API and web scraping support
- NLP-based match scoring
- Fuzzy name matching (Levenshtein distance)
- Location and date matching
- Context analysis from obituary text

**Sources**:
- Legacy.com (API) - 70% coverage, high reliability
- Tributes.com (Scraping) - US nationwide
- FindAGrave (API) - Global coverage

### 4. Death Certificate Service ✅

**File**: `server/services/deathCertificateService.ts`

**Features**:
- State API integration (California, Texas, Florida)
- VitalChek ordering service
- Certificate delivery webhooks
- Secure certificate storage (IPFS placeholder)
- Automatic verification event creation

**Providers**:
- VitalChek - All 50 states, $25-50 per certificate
- State APIs - Direct access where available

### 5. Consensus Engine ✅

**File**: `server/services/deathConsensusEngine.ts`

**Features**:
- Multi-source verification consensus
- Weighted confidence scoring
- Source-specific weights:
  - Death Certificate: 1.0 (100%)
  - SSDI: 0.8 (80%)
  - Legacy.com: 0.7 (70%)
  - Insurance Claim: 0.9 (90%)
- Minimum confidence threshold: 0.7 (70%)
- Minimum sources required: 2
- Automatic vault release trigger

**Configurable**:
- `DEATH_VERIFICATION_MIN_CONFIDENCE` - Minimum confidence (default: 0.7)
- `DEATH_VERIFICATION_MIN_SOURCES` - Minimum sources (default: 2)

### 6. API Endpoints ✅

**File**: `server/routes.ts`

**Endpoints Added**:

1. **POST `/api/users/consent/death-monitoring`**
   - User consent to death monitoring
   - Stores SSN hash (never plaintext)
   - Records consent with IP and timestamp

2. **GET `/api/death-verification/status`**
   - Returns verification status for user
   - Shows all verification events
   - Consensus status

3. **POST `/api/death-verification/proof-of-life`**
   - Complete proof of life challenge
   - Clears false death reports

4. **POST `/webhooks/vitalchek`**
   - Handles certificate delivery webhooks
   - Verifies webhook signature
   - Processes certificate data

### 7. Cron Jobs ✅

**File**: `server/jobs/deathVerificationCron.ts`

**Scheduled Tasks**:

1. **SSDI Daily Check** - Runs at 2 AM daily
   - Checks all consenting users against SSDI
   - Creates verification events for matches

2. **Obituary Search** - Runs every 6 hours
   - Searches obituaries for pending SSDI matches
   - Stores high-confidence obituary matches

3. **Consensus Check** - Runs every hour
   - Checks for consensus on pending verifications
   - Triggers vault release when consensus reached

**Enable/Disable**:
```bash
DEATH_VERIFICATION_ENABLED=true
```

## Setup Instructions

### Step 1: Database Migration

1. **Generate migration**:
   ```bash
   pnpm run db:generate
   ```

2. **Review migration** (check for death verification tables)

3. **Apply migration**:
   ```bash
   pnpm run db:migrate
   ```

4. **Add users table extensions** (manual SQL):
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

### Step 2: Environment Variables

Add to `.env`:

```bash
# Death Verification
DEATH_VERIFICATION_ENABLED=true
DEATH_VERIFICATION_MIN_CONFIDENCE=0.7
DEATH_VERIFICATION_MIN_SOURCES=2

# SSDI Configuration
SSDI_API_KEY=your_genealogybank_api_key
SSDI_API_URL=https://api.genealogybank.com/ssdi
SSDI_BATCH_SIZE=1000

# Obituary Scraping
LEGACY_API_KEY=your_legacy_api_key
LEGACY_API_URL=https://api.legacy.com/v1/obituaries
FINDAGRAVE_API_KEY=your_findagrave_api_key
OBITUARY_ENABLED=true

# Death Certificate
VITALCHEK_API_KEY=your_vitalchek_api_key
VITALCHEK_API_URL=https://api.vitalchek.com/v1
VITALCHEK_WEBHOOK_SECRET=your_webhook_secret

# State Vital Records (optional)
CA_VITAL_RECORDS_API=https://api.cdph.ca.gov/vital-records
CA_VITAL_RECORDS_KEY=your_ca_key
TX_VITAL_RECORDS_API=https://api.dshs.texas.gov/vs
TX_VITAL_RECORDS_KEY=your_tx_key

# Encryption
SSN_SALT=your_random_salt_for_ssn_hashing
ENCRYPTION_KEY=your_32_byte_hex_key
```

### Step 3: Install Dependencies

```bash
pnpm add axios cheerio natural node-cron
pnpm add -D @types/node-cron
```

### Step 4: Enable Cron Jobs

Set environment variable:
```bash
DEATH_VERIFICATION_ENABLED=true
```

## Usage Flow

### 1. User Consent

User provides consent via API:
```bash
POST /api/users/consent/death-monitoring
{
  "consent": true,
  "fullName": "John Doe",
  "dateOfBirth": "1980-01-01",
  "ssn": "123-45-6789",
  "lastKnownLocation": "New York, NY"
}
```

### 2. Automated Monitoring

Cron jobs automatically:
- Check SSDI daily at 2 AM
- Search obituaries every 6 hours
- Check consensus every hour

### 3. Death Detection

When death is found:
1. **SSDI match** → Create verification event
2. **Obituary match** → Create verification event
3. **Death certificate** → Create verification event
4. **Consensus check** → Verify if threshold met
5. **Vault release** → Trigger smart contract

### 4. Proof of Life

If false positive:
1. User receives proof of life challenge
2. User provides challenge code
3. Death reports cleared
4. Monitoring continues

## Verification Process

```
SSDI Match (0.8 confidence)
    ↓
Obituary Match (0.7 confidence)
    ↓
Death Certificate (1.0 confidence)
    ↓
Consensus Check
    ├─ Weighted Average: 0.83
    ├─ Sources: 3
    ├─ Threshold: 0.7 ✓
    └─ Min Sources: 2 ✓
    ↓
DEATH VERIFIED
    ↓
Vault Release Triggered
```

## Security & Privacy

### SSN Handling
- **Never store plaintext SSN**
- SHA-256 hash with salt
- Used for matching only
- Cannot be reversed

### Consent Management
- Explicit consent required
- IP address logged
- Timestamp recorded
- Can be revoked

### Encryption
- Personal data encrypted at rest
- AES-256-GCM for sensitive fields
- Encryption keys secured

### Webhook Security
- HMAC signature verification
- Secure webhook secrets
- HTTPS required

## Legal Considerations

⚠️ **Important**: This system requires legal review before production use.

1. **Compliance Requirements**:
   - HIPAA (if handling health data)
   - GDPR (if EU users)
   - State privacy laws
   - Federal privacy laws

2. **Consent Requirements**:
   - Explicit written consent
   - Clear explanation of monitoring
   - Right to revoke consent
   - Data retention policies

3. **Dispute Process**:
   - 72-hour proof of life challenge
   - Appeal process for false positives
   - Human review for low-confidence matches

4. **Legal Status**:
   - This detects inactivity, not legal death
   - Legal death requires official documentation
   - May require court order for certain actions

## Testing

### Test SSDI Check

```bash
# Test single user check (admin endpoint)
POST /api/admin/test-ssdi-check
{
  "userId": "user-id"
}
```

### Test Obituary Search

```bash
# Test obituary search (admin endpoint)
POST /api/admin/test-obituary-search
{
  "userId": "user-id"
}
```

### Test Consensus

```bash
# Test consensus check
POST /api/admin/test-consensus
{
  "userId": "user-id"
}
```

## Monitoring

### Metrics to Track
- SSDI checks per day
- Obituary searches per day
- Death matches found
- False positive rate
- Consensus verification rate
- Vault releases triggered

### Alerts
- High false positive rate
- SSDI API failures
- Obituary search failures
- Consensus failures
- Webhook failures

## Next Steps

1. ✅ Schema created
2. ✅ Services implemented
3. ✅ API endpoints added
4. ✅ Cron jobs configured
5. ⏳ Run database migrations
6. ⏳ Configure API keys
7. ⏳ Test in staging
8. ⏳ Legal review
9. ⏳ Production deployment

## Files Created

### Services
- `server/services/ssdiMonitor.ts` - SSDI monitoring
- `server/services/obituaryScraper.ts` - Obituary scraping
- `server/services/deathCertificateService.ts` - Certificate ordering
- `server/services/deathConsensusEngine.ts` - Consensus verification

### Schema
- `shared/schema.death-verification.ts` - Death verification tables

### Jobs
- `server/jobs/deathVerificationCron.ts` - Scheduled tasks

### Documentation
- `DEATH_VERIFICATION_SETUP.md` - Setup guide
- `DEATH_VERIFICATION_IMPLEMENTATION.md` - This file

## Dependencies Added

- `axios` - HTTP requests
- `cheerio` - HTML parsing
- `natural` - NLP and string matching
- `node-cron` - Scheduled tasks

---

**Status**: ✅ Implementation Complete

**Next**: Database migration and testing in staging environment.

