# Backend Recovery API & Encryption - Implementation Complete ✅

## What's Been Implemented

### 1. Database Schema ✅

#### `shared/schema.ts`
Added recovery tables:
- **`recoveries`** table: Stores recovery setup, encrypted seed phrase, status
- **`recoveryKeys`** table: Stores recovery key information, invitation tokens, attestation status
- **`recoveryStatusEnum`**: Enum for recovery status (active, triggered, completed, cancelled)

#### Migration File: `migrations/003_recovery_system.sql`
- SQL migration for recovery tables
- Indexes for performance
- Foreign key constraints

**To Apply Migration**:
```bash
psql $DATABASE_URL -f migrations/003_recovery_system.sql
```

Or use Drizzle:
```bash
cp migrations/003_recovery_system.sql drizzle/migrations/
pnpm run db:migrate
```

### 2. Storage Layer ✅

#### `server/storage.ts`
- Added recovery methods to `IStorage` interface:
  - `createRecovery()`, `getRecovery()`, `getRecoveriesByUser()`, `updateRecovery()`
  - `createRecoveryKey()`, `getRecoveryKey()`, `getRecoveryKeyByToken()`, `getRecoveryKeysByRecovery()`, `updateRecoveryKey()`
- Implemented in both `MemStorage` (in-memory) and `PostgresStorage` (PostgreSQL)

### 3. API Endpoints ✅

#### `POST /api/recovery/create`
**Purpose**: Create recovery setup, generate recovery key addresses, send invitations

**Request**:
```typescript
{
  walletAddress: string; // Ethereum address
  recoveryKeys: Array<{
    email: string;
    name: string;
  }>; // Exactly 3 recovery keys
  encryptedData: string; // Client-side encrypted seed phrase
}
```

**Response**:
```typescript
{
  recoveryId: string; // Database recovery ID
  recoveryKeyAddresses: [string, string, string]; // Generated addresses for contract
  message: string;
}
```

**What it does**:
1. Validates input (wallet address format, exactly 3 recovery keys)
2. Generates deterministic wallet addresses from recovery key emails
3. Creates recovery record in database
4. Creates recovery key records with invitation tokens
5. Sends email invitations to recovery keys
6. Returns recovery ID and addresses for contract creation

#### `GET /api/recovery/verify-token/:token`
**Purpose**: Verify magic link token and return recovery information

**Response**:
```typescript
{
  recoveryId: number; // Contract recovery ID
  walletAddress: string;
  recoveryKeyInfo: {
    name: string;
    email: string;
  };
}
```

**What it does**:
1. Validates invitation token
2. Checks token expiration (30 days)
3. Returns recovery information for portal

#### `GET /api/recovery/has-attested/:recoveryId`
**Purpose**: Check if recovery key has attested

**Query Parameters**:
- `walletAddress`: Recovery key's wallet address

**Response**:
```typescript
{
  hasAttested: boolean;
}
```

#### `POST /api/recovery/mark-attested/:recoveryId`
**Purpose**: Mark recovery key as attested (called after contract attestation)

**Request**:
```typescript
{
  walletAddress: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  attestedCount: number; // Number of recovery keys who have attested
}
```

**What it does**:
1. Updates recovery key attestation status
2. Checks if 2-of-3 threshold is met
3. Updates recovery status to "triggered" if threshold met

#### `POST /api/recovery/update-contract-id/:recoveryId`
**Purpose**: Store contract recovery ID after contract creation

**Request**:
```typescript
{
  contractRecoveryId: number;
}
```

**Response**:
```typescript
{
  success: boolean;
}
```

### 4. Encryption Implementation ✅

#### `client/src/lib/encryption.ts`
**Web Crypto API Implementation**:
- **`encryptSeedPhrase()`**: AES-GCM encryption with PBKDF2 key derivation
  - Uses 256-bit keys
  - 100,000 iterations for PBKDF2
  - Random salt and IV for each encryption
  - Returns base64 encoded string (salt + IV + encrypted data)
  
- **`decryptSeedPhrase()`**: Decrypts encrypted seed phrase
  - Extracts salt, IV, and encrypted data
  - Derives key using same parameters
  - Returns original seed phrase

- **`generateEncryptionPassword()`**: Generates password from wallet address + timestamp

**Security Features**:
- ✅ Industry-standard AES-GCM encryption
- ✅ PBKDF2 key derivation (100k iterations)
- ✅ Random salt and IV for each encryption
- ✅ Client-side encryption (seed phrase never sent unencrypted)
- ✅ Proper base64 encoding for storage

### 5. Frontend Integration ✅

#### `client/src/pages/SetupRecovery.tsx`
- Updated to use proper encryption (`encryptSeedPhrase()`)
- Calls backend API to create recovery
- Stores contract recovery ID after contract creation

## API Flow

### Recovery Setup Flow:
```
1. User fills out SetupRecovery form
2. Frontend encrypts seed phrase client-side
3. Frontend calls POST /api/recovery/create
4. Backend:
   - Creates recovery record
   - Generates recovery key addresses
   - Creates recovery key records
   - Sends email invitations
5. Frontend calls contract.createRecovery()
6. Frontend calls POST /api/recovery/update-contract-id
7. Recovery setup complete!
```

### Recovery Key Attestation Flow:
```
1. Recovery key clicks email link → /recovery-portal/:token
2. Frontend calls GET /api/recovery/verify-token/:token
3. Backend validates token and returns recovery info
4. Recovery key connects wallet
5. Recovery key clicks "Attest Recovery"
6. Frontend calls contract.attestRecovery()
7. Frontend calls POST /api/recovery/mark-attested/:recoveryId
8. Backend updates attestation status
9. If 2-of-3 threshold met, recovery status → "triggered"
```

## Email Integration

The system uses the existing `sendEmail()` service from `server/services/email.ts`.

**Email Configuration** (Environment Variables):
```
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=no-reply@guardiavault.com
```

**Email Template** (in recovery creation):
- Subject: "You've been chosen as a Recovery Key"
- Includes: Recovery key name, invitation URL, expiration date, responsibility reminder

## Security Considerations

### ✅ Implemented:
- Client-side encryption (seed phrase never unencrypted on server)
- Secure token generation (UUID)
- Token expiration (30 days)
- Input validation (Zod schemas)
- Email verification before access
- Wallet address validation

### 🔒 Production Recommendations:
1. **Rate Limiting**: Add rate limits to recovery endpoints
2. **Token Rotation**: Regenerate tokens periodically
3. **Audit Logging**: Log all recovery operations
4. **Email Templates**: Use HTML email templates (not plain text)
5. **Two-Factor**: Consider 2FA for recovery key attestation
6. **Monitoring**: Alert on suspicious recovery patterns

## Database Migration

### To Apply Migration:
```bash
# Option 1: Direct SQL
psql $DATABASE_URL -f migrations/003_recovery_system.sql

# Option 2: Via Drizzle
cp migrations/003_recovery_system.sql drizzle/migrations/
pnpm run db:migrate
```

### Migration Includes:
- `recoveries` table with indexes
- `recovery_keys` table with indexes
- `recovery_status` enum type
- Foreign key constraints
- Performance indexes

## Testing Checklist

### Backend API:
- [ ] `POST /api/recovery/create` - Creates recovery, sends emails
- [ ] `GET /api/recovery/verify-token/:token` - Validates tokens
- [ ] `GET /api/recovery/has-attested/:recoveryId` - Checks attestation
- [ ] `POST /api/recovery/mark-attested/:recoveryId` - Updates attestation
- [ ] `POST /api/recovery/update-contract-id/:recoveryId` - Stores contract ID

### Encryption:
- [ ] `encryptSeedPhrase()` - Encrypts seed phrase
- [ ] `decryptSeedPhrase()` - Decrypts correctly
- [ ] Different passwords produce different ciphertexts
- [ ] Same password + data = same encryption (with different salt/IV)

### Integration:
- [ ] Full recovery setup flow works
- [ ] Email invitations are sent
- [ ] Recovery key portal loads correctly
- [ ] Attestation updates database and contract

## Next Steps

1. **Deploy Migration**: Apply `003_recovery_system.sql` to database
2. **Test Endpoints**: Test all API endpoints with Postman/curl
3. **Email Service**: Configure SMTP settings in environment
4. **Frontend Testing**: Test full recovery flow end-to-end
5. **Payment Integration**: Add recovery fee processing (15% of recovered assets)

---

**Status**: Backend API and encryption implementation complete! ✅

All endpoints are ready for testing and integration with the frontend.

