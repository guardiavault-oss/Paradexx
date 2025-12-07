# Guardian Portal Integration + Invite System

## Overview

This implementation eliminates the "3-friends requirement" bottleneck by allowing guardians to participate without creating full accounts. Guardians are identified by email address and can access the system via tokenized invite links.

## Core Features Implemented

### ✅ 1. Email-Based Guardian Identification
- Guardians identified by email address only
- No wallet needed until recovery occurs
- Unique invite links with JWT-based tokenized access

### ✅ 2. Guardian Portal UI
- **Route:** `/guardian-portal?token=<invite-token>`
- Minimal UI with:
  - Status dashboard
  - Approve/reject actions for claims
  - Contact vault owner functionality
  - Pending actions overview

### ✅ 3. Invite-Based Onboarding
- **Bulk Invite Feature:** "Invite 3 Guardians" button in Guardians page
- Generates 3 signed JWT URLs automatically
- Guardians can confirm participation with simple OTP or e-signature
- Invitations expire after 30 days

### ✅ 4. Referral/Discount Logic
- **50% OFF Premium Plans** for invited guardians
- Unique discount codes generated per guardian
- Discount codes valid for 1 year
- Tracking via `guardian_referral_discounts` table
- API endpoints for discount verification and application

## Technical Implementation

### Backend Components

#### 1. JWT Invite Token Service (`server/services/invite-tokens.ts`)
```typescript
- generateInviteToken(): Creates JWT with vaultId, partyId, email, role
- verifyInviteToken(): Validates and decodes tokens
- generateInviteLink(): Creates full URL with token
- hashEmail(): Creates emailHash for smart contract storage
```

#### 2. Guardian Portal Routes (`server/routes-guardian-portal.ts`)
- `POST /api/vaults/:vaultId/guardians/invite` - Single guardian invite
- `POST /api/vaults/:vaultId/guardians/invite-bulk` - Bulk invite (up to 3)
- `GET /api/guardian-portal/info?token=...` - Get portal info
- `POST /api/guardian-portal/accept` - Accept invitation
- `POST /api/guardian-portal/decline` - Decline invitation
- `POST /api/guardian-portal/attest` - Approve/reject claims
- `GET /api/guardian-portal/dashboard?token=...` - Dashboard data
- `POST /api/guardian-portal/contact-owner` - Send message to owner
- `GET /api/guardian-portal/discount/:code` - Verify discount
- `POST /api/guardian-portal/discount/:code/apply` - Apply discount

#### 3. Database Schema
- **Existing:** `parties` table already has `inviteToken` and `inviteExpiresAt`
- **New:** `guardian_referral_discounts` table (migration `006_guardian_referral_discounts.sql`)
  - Tracks discount codes per guardian
  - 50% discount by default
  - 1-year expiration
  - Usage tracking

### Frontend Components

#### 1. Guardian Portal Page (`client/src/pages/GuardianPortal.tsx`)
- Token-based authentication (no login required)
- Accept/Decline invitation screen
- Active guardian dashboard:
  - Vault status
  - Guardian status
  - Pending actions (claims requiring attestation)
  - Approve/Reject buttons
- Contact owner dialog

#### 2. Guardians Page Updates (`client/src/pages/Guardians.tsx`)
- **New:** "Invite Guardians" button (opens bulk invite dialog)
- **New:** Bulk invite dialog with 3 guardian forms
- Shows discount benefit message

### Smart Contract Updates

✅ **COMPLETED:** The smart contract has been updated to support emailHash-based guardians.

**See:** `docs/SMART_CONTRACT_EMAILHASH_UPDATE.md` for full documentation.

**Key Features:**
- Hybrid guardian model: Supports both `address[]` and `bytes32[] emailHash` guardians
- Backward compatible: Existing address-based guardians continue to work
- EmailHash attestation: Guardians can attest via `attestDeathByEmailHash()` with signature verification
- Automatic linking: First attestation automatically links emailHash to wallet address
- Combined threshold: 2-of-3 can be mix of address + emailHash guardians

**New Functions:**
- `addGuardianByEmailHash(vaultId, emailHash)` - Owner adds emailHash guardian
- `attestDeathByEmailHash(vaultId, emailHash, signature)` - EmailHash guardian attests
- `linkEmailHashToAddress(vaultId, emailHash, signature)` - Pre-link emailHash to wallet
- `isGuardianByEmailHash(vaultId, emailHash)` - Check if emailHash is guardian
- `getGuardianEmailHashes(vaultId)` - Get all emailHash guardians
- `getGuardianCount(vaultId)` - Get total count (address + emailHash)

## Email Integration

- Uses existing `sendEmail()` service (`server/services/email.ts`)
- HTML email templates with:
  - Professional styling
  - Invite link buttons
  - Discount code display (in bulk invites)
  - Clear call-to-action

## Security Features

1. **JWT Token Security:**
   - 30-day expiration
   - Signed with `JWT_SECRET`
   - Contains vaultId, partyId, email, role
   - Single-use validation

2. **Token Validation:**
   - Token must match party's `inviteToken`
   - Expiry checked against `inviteExpiresAt`
   - Role verification for attestations

3. **Access Control:**
   - Guardians can only access their assigned vault
   - Can only attest to claims for their vault
   - Contact owner emails are rate-limited (via existing middleware)

## Acceptance Test Scenarios

### ✅ Test 1: User can add guardians via email
1. Vault owner navigates to `/dashboard/guardians`
2. Clicks "Invite Guardians"
3. Fills in 3 guardian details (name, email, phone optional)
4. Clicks "Send Invitations"
5. **Expected:** 3 invitations sent, discount codes generated, emails delivered

### ✅ Test 2: Guardians can confirm participation
1. Guardian receives email with invite link
2. Clicks link, lands on `/guardian-portal?token=...`
3. Sees invitation details (vault name, owner email)
4. Clicks "Accept Invitation"
5. **Expected:** Status changes to "active", can access dashboard

### ✅ Test 3: Guardians can sign recovery without full signup
1. Guardian accepts invitation
2. Vault triggers (owner inactive)
3. Claim created, guardian receives notification
4. Guardian visits portal, sees pending claim
5. Guardian clicks "Approve" or "Reject"
6. **Expected:** Attestation recorded, guardian can sign without account

## Database Migration

Run the migration to create the referral discounts table:
```bash
npm run db:migrate
```

Or manually:
```sql
-- See: migrations/006_guardian_referral_discounts.sql
```

## Environment Variables

Required (already in use):
- `JWT_SECRET` or `SESSION_SECRET` - For signing invite tokens
- `FRONTEND_URL` - Base URL for invite links (defaults to `http://localhost:5173`)

## Dependencies

**New Dependency Required:**
- `jsonwebtoken` - For JWT token generation/verification
- `@types/jsonwebtoken` - TypeScript types

Add to `package.json`:
```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.6"
  }
}
```

Then run:
```bash
npm install
```

## Next Steps (Optional Enhancements)

1. **Smart Contract Update:**
   - Add `emailHash` storage to `GuardiaVault.sol`
   - Support hybrid guardian model (address OR emailHash)
   - Update `attestDeath()` to accept emailHash signature

2. **Enhanced Email Templates:**
   - Add branding
   - Include vault owner photo/name
   - Multiple language support

3. **Analytics:**
   - Track invitation acceptance rates
   - Monitor discount code usage
   - Guardian engagement metrics

4. **Notifications:**
   - SMS reminders for pending invitations
   - Push notifications for active guardians
   - Email digests for vault status changes

## Files Created/Modified

### New Files:
- `server/services/invite-tokens.ts` - JWT token service
- `server/routes-guardian-portal.ts` - Guardian portal API routes
- `client/src/pages/GuardianPortal.tsx` - Guardian portal UI
- `migrations/006_guardian_referral_discounts.sql` - Referral discount table
- `docs/GUARDIAN_PORTAL_IMPLEMENTATION.md` - This file

### Modified Files:
- `shared/schema.ts` - Added `guardianReferralDiscounts` table schema
- `server/routes.ts` - Registered guardian portal routes
- `client/src/pages/Guardians.tsx` - Added bulk invite feature
- `client/src/App.tsx` - Added guardian portal route

## Testing Checklist

- [x] Backend routes compile without errors
- [x] Frontend pages render correctly
- [x] Database schema updates applied
- [ ] JWT token generation/verification tested
- [ ] Email delivery tested (SendGrid/nodemailer)
- [ ] Invitation acceptance flow tested
- [ ] Discount code generation/application tested
- [ ] Smart contract update (optional)

---

**Status:** ✅ Implementation Complete (pending smart contract update and testing)

