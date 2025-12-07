# Multi-Sig Recovery Frontend Integration - Complete ✅

## What's Been Built

### 1. Contract Integration Files ✅

#### `client/src/lib/contracts/multiSigRecovery.ts`
- Contract instance getter (`getMultiSigRecoveryContract`)
- TypeScript interfaces (`RecoveryData`, `RecoveryStatus`)
- Contract interaction functions:
  - `createRecovery()` - Setup recovery
  - `attestRecovery()` - Recovery key attests
  - `completeRecovery()` - Complete after time lock
  - `cancelRecovery()` - Owner cancels recovery
  - View functions: `getRecoveryDetails()`, `getRecoveryAttestationCount()`, etc.

#### `client/src/lib/contracts/MultiSigRecovery.abi.json` ✅
- ABI generated from compiled contract
- Ready for contract interaction

#### `client/src/lib/contracts/config.ts` ✅
- Added `MultiSigRecovery` contract configuration
- Default address: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` (update after deployment)

### 2. React Hook ✅

#### `client/src/hooks/useMultiSigRecovery.ts`
- Custom hook wrapping contract interactions
- Functions:
  - `createRecovery()` - Creates recovery setup
  - `attestRecovery()` - Recovery key attests
  - `completeRecovery()` - Completes recovery
  - `cancelRecovery()` - Cancels recovery
  - `fetchRecovery()` - Fetches recovery details
  - `fetchRecoveryStatus()` - Gets status with attestation count and time lock

### 3. Frontend Pages ✅

#### `client/src/pages/SetupRecovery.tsx`
**Multi-step recovery setup form**:
- **Step 1**: Wallet Address input
- **Step 2**: Recovery Keys (3 trusted people with email/name)
- **Step 3**: Seed Phrase (encrypted client-side before storage)
- **Step 4**: Review & Submit

**Features**:
- Form validation with Zod
- Progress indicator
- Client-side encryption (placeholder - needs proper implementation)
- Backend API integration for email-to-address conversion
- Contract interaction on submission

#### `client/src/pages/RecoveryKeyPortal.tsx`
**Recovery key portal (email-based access)**:
- Token-based access via URL (`/recovery-portal/:token`)
- Displays recovery status and attestation progress
- "Attest Recovery" button (requires wallet connection)
- Real-time countdown for 7-day time lock
- Shows when recovery can be completed

**Features**:
- Minimal UI (no login required)
- Real-time status updates
- Wallet connection for attestation
- Visual progress indicators

### 4. Routing ✅

#### `client/src/App.tsx`
Added routes:
- `/setup-recovery` → SetupRecovery page
- `/recovery-portal/:token` → RecoveryKeyPortal page

## 🚧 Backend API Endpoints Needed

The frontend expects these backend endpoints (not yet created):

### 1. `POST /api/recovery/create`
**Purpose**: Create recovery setup, send email invitations, convert emails to addresses

**Request**:
```typescript
{
  walletAddress: string;
  recoveryKeys: Array<{
    email: string;
    name: string;
  }>;
  encryptedData: string;
}
```

**Response**:
```typescript
{
  recoveryId: number;
  recoveryKeyAddresses: [string, string, string];
}
```

**What it does**:
- Stores recovery metadata in database
- Sends email invitations to recovery keys
- Creates magic link tokens for recovery portal
- Converts emails to wallet addresses (or creates temp accounts)
- Returns addresses for contract call

### 2. `GET /api/recovery/verify-token/:token`
**Purpose**: Verify magic link token and return recovery info

**Response**:
```typescript
{
  recoveryId: number;
  walletAddress: string;
  recoveryKeyInfo: {
    name: string;
    email: string;
  };
}
```

### 3. `GET /api/recovery/has-attested/:recoveryId`
**Purpose**: Check if current user has attested to recovery

**Response**:
```typescript
{
  hasAttested: boolean;
}
```

## 🔒 Security Considerations

### Client-Side Encryption
The current `encryptSeedPhrase()` function is a **placeholder**. For production:

**Recommended Implementation**:
```typescript
import { encrypt } from 'crypto-js';

const encryptSeedPhrase = (seedPhrase: string, password: string): string => {
  // Use AES encryption with proper key derivation
  return encrypt(seedPhrase, password).toString();
};
```

**Or use Web Crypto API**:
```typescript
async function encryptSeedPhrase(seedPhrase: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(seedPhrase);
  
  // Derive key from password
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('guardiavault-recovery'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Return base64 encoded IV + encrypted data
  return btoa(JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  }));
}
```

### Email-to-Address Conversion
**Options**:
1. **Temporary wallet addresses**: Backend generates temporary addresses for recovery keys
2. **Email signature**: Use EIP-712 to sign with email, backend converts to address
3. **Magic link wallets**: Create wallet when recovery key clicks link

**Recommended**: Option 1 (temporary addresses) - simplest for MVP

## 🎯 Next Steps

### Immediate (Week 1):
1. ✅ Contract integration files created
2. ✅ Frontend pages created
3. ✅ Routing configured
4. [ ] **Implement backend API endpoints**
5. [ ] **Implement proper client-side encryption**
6. [ ] **Email service integration** (SendGrid, Resend, etc.)

### Short-term (Week 2):
1. [ ] **Payment processing for recovery fees** (15% of recovered assets)
2. [ ] **Recovery completion flow** (show encrypted data after time lock)
3. [ ] **Email templates** (invitations, attestation notifications)
4. [ ] **Dashboard integration** (show active recoveries)

### Medium-term (Week 3-4):
1. [ ] **Recovery history page**
2. [ ] **Recovery key management**
3. [ ] **Analytics and metrics**
4. [ ] **SEO landing page**: "Lost Bitcoin Wallet Recovery"

## 📊 Testing Checklist

### SetupRecovery Page:
- [ ] Wallet address validation
- [ ] Recovery key email validation (no duplicates)
- [ ] Seed phrase encryption works
- [ ] Form submission calls backend API
- [ ] Contract interaction succeeds
- [ ] Success toast shows

### RecoveryKeyPortal Page:
- [ ] Token verification works
- [ ] Recovery status displays correctly
- [ ] Attestation count updates
- [ ] Time lock countdown works
- [ ] "Attest Recovery" button calls contract
- [ ] Wallet connection required for attestation

## 🚀 Deployment Checklist

Before going live:
- [ ] Update contract addresses in `config.ts`
- [ ] Deploy MultiSigRecovery contract to testnet/mainnet
- [ ] Implement backend API endpoints
- [ ] Set up email service (SendGrid/Resend)
- [ ] Implement proper encryption (not placeholder)
- [ ] Test full recovery flow end-to-end
- [ ] Set up payment processing for recovery fees
- [ ] Create email templates
- [ ] Add analytics tracking

## 💰 Revenue Integration

### Recovery Fee Payment Flow:
```typescript
// After recovery completes (7-day time lock expired)
1. User recovers wallet access
2. Calculate wallet balance (via blockchain explorer API)
3. Calculate fee: balance * 0.15 (15%)
4. Charge via Stripe:
   await stripe.charges.create({
     amount: Math.round(recoveryFee * 100),
     currency: 'usd',
     description: `Recovery fee for ${walletAddress}`
   });
5. Send encrypted seed phrase to recovery keys
```

---

**Status**: Frontend integration complete ✅
**Next**: Backend API implementation + encryption library integration

