# Landing Page Features - Backend Implementation

This document outlines the implementation of all features mentioned on the landing page.

## ✅ Implemented Features

### 1. AI Risk Monitor ✅
**Location**: `server/services/aiRiskMonitor.ts`

**Features**:
- Detects suspicious login patterns (new IP, new device, location changes)
- Identifies unusual activity patterns
- Tracks failed authentication attempts
- Creates risk events with severity levels (low, medium, high, critical)
- Risk scoring algorithm (0.0 to 1.0)

**API Endpoints**:
- `GET /api/security/risk-events` - Get user's security risk events
- `POST /api/security/risk-events/:eventId/resolve` - Resolve a risk event

**Integration**:
- Integrated into login endpoint (`/api/auth/login`)
- Automatically logs failed authentication attempts
- Tracks suspicious login patterns

**Database**: `ai_risk_events` table

### 2. Behavioral Biometrics ✅
**Location**: `server/services/behavioralBiometrics.ts`

**Features**:
- Typing pattern analysis (keystroke dynamics, dwell time, flight time)
- Mouse movement signature extraction (velocity, acceleration, path analysis)
- Interaction signature verification
- Confidence scoring (0.0 to 1.0)
- Baseline biometric storage and comparison

**API Endpoints**:
- `POST /api/security/biometrics` - Save behavioral biometric data
- `POST /api/security/biometrics/verify` - Verify user identity

**Integration**:
- Creates risk events if biometric verification fails
- Stores baseline signatures for comparison

**Database**: `behavioral_biometrics` table

### 3. Legacy Messages ✅
**Location**: `server/services/legacyMessages.ts`

**Features**:
- Video message storage and delivery
- Letter/text message storage
- S3 integration for video file uploads
- Per-beneficiary or vault-wide messages
- Automatic delivery when vault triggers
- Scheduled delivery support

**API Endpoints**:
- `GET /api/vaults/:vaultId/legacy-messages` - Get messages for a vault
- `POST /api/vaults/:vaultId/legacy-messages` - Create a message
- `GET /api/legacy-messages/:messageId/upload-url` - Get video upload URL
- `PUT /api/legacy-messages/:messageId` - Update message
- `DELETE /api/legacy-messages/:messageId` - Delete message

**Integration**:
- Automatically marks messages as ready when vault triggers
- Integrated with death consensus engine

**Database**: `legacy_messages` table

### 4. Smart Contract Integration ✅
**Location**: `server/services/smartContract.ts`

**Features**:
- Smart contract deployment for vaults
- Check-in functionality on-chain
- Vault release triggering on-chain
- Contract status tracking
- Multiple network support (Ethereum, Polygon, etc.)

**API Endpoints**:
- `POST /api/vaults/:vaultId/smart-contract` - Deploy vault smart contract
- `GET /api/vaults/:vaultId/smart-contract` - Get contract info

**Integration**:
- Automatically triggers contract release when vault is activated
- Uses existing GuardiaVault.sol contract

**Database**: `vault_smart_contracts` table

### 5. Death Verification System ✅
**Already Implemented**: `server/services/deathConsensusEngine.ts`

### 6. Guardian Secret Distribution ✅
**Already Implemented**: `server/services/shamir.ts`

### 7. Multi-Party Verification ✅
**Already Implemented**: Through guardian consensus in vault system

## Database Schema

All new tables have been added to `shared/schema.ts`:

1. **legacy_messages** - Stores video and text messages
2. **ai_risk_events** - Tracks security risk events
3. **behavioral_biometrics** - Stores behavioral signatures
4. **vault_smart_contracts** - Tracks smart contract deployments

## Migration

Run the migration to create the new tables:

```bash
psql $DATABASE_URL -f migrations/002_landing_page_features.sql
```

Or use Drizzle to generate and apply:

```bash
pnpm run db:generate
pnpm run db:migrate
```

## Environment Variables

Add these to your `.env` file:

```bash
# Smart Contract Integration
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
DEPLOYER_PRIVATE_KEY=your_private_key_here
GUARDIAVAULT_CONTRACT_ADDRESS=0x... # If using deployed contract

# S3 for Legacy Messages (already configured if using S3)
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

## Frontend Integration (TODO)

The following frontend components need to be created:

1. **Security Dashboard** - Display AI risk events and behavioral biometric status
2. **Legacy Messages UI** - Create, edit, and manage legacy messages
3. **Smart Contract Status** - Show contract deployment status and on-chain vault info

## Testing

Test the new endpoints:

```bash
# AI Risk Monitor
curl -X GET http://localhost:5000/api/security/risk-events \
  -H "Cookie: connect.sid=YOUR_SESSION"

# Behavioral Biometrics
curl -X POST http://localhost:5000/api/security/biometrics \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{"dataType":"typing_pattern","signature":"abc123","confidence":"0.95"}'

# Legacy Messages
curl -X POST http://localhost:5000/api/vaults/VAULT_ID/legacy-messages \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{"type":"letter","title":"My Final Letter","content":"Dear family..."}'
```

## Next Steps

1. ✅ Database schema - Complete
2. ✅ Backend services - Complete
3. ✅ API endpoints - Complete
4. ⏳ Frontend components - Pending
5. ⏳ Integration testing - Pending
6. ⏳ Production deployment - Pending

## Notes

- AI Risk Monitor uses simplified risk scoring - can be enhanced with ML models
- Behavioral Biometrics uses basic signature comparison - can be enhanced with more sophisticated matching
- Smart Contract integration requires proper RPC URL and private key configuration
- Legacy Messages requires S3 configuration for video storage

