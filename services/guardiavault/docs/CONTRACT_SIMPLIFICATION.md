# GuardiaVault Contract Simplification

## Overview
Simplified `GuardiaVault.sol` from ~537 lines to ~654 lines with streamlined logic focused on core digital will functionality.

## Key Simplifications

### ✅ What Was Kept
- **Guardian attestation system** (2-of-3 consensus)
- **Time-based dead man's switch** (backup if guardians don't act)
- **Beneficiary claims**
- **Check-in system**
- **Reentrancy protection**

### ❌ What Was Removed
- Subscription escrow (moved to Stripe)
- Lifetime purchase contract
- 6-month death extension
- Variable guardian thresholds (now fixed 2-of-3)
- Chainlink Keepers dependency
- Guardian addition/removal (guardians set at creation only)
- Beneficiary update functionality (locked at creation)

## New Features

### 1. Fixed Guardian System
- **Exactly 3 guardians** (not 5)
- **2-of-3 threshold** for instant trigger
- **Set at vault creation** (cannot be modified)
- **24-hour cooldown** between attestations per guardian

### 2. Emergency Revoke
```solidity
function emergencyRevoke(uint256 vaultId, bytes calldata proofOfLifeSignature)
```
- Owner can revoke false trigger within **7 days**
- Requires proof-of-life signature (validated off-chain)
- Clears guardian attestations and resets vault to Active

### 3. Enhanced Security
- **Beneficiaries cannot be guardians** (enforced at creation)
- **Cannot modify during Warning state** (prevents death-bed manipulation)
- **Guardian cooldown** prevents rushed decisions
- **Revoke window** prevents permanent false triggers

### 4. Simplified Status Flow
```
Active → Warning → Triggered → Claimed
         ↑ (checkIn)
         ↑ (revoke within 7 days)
```

## Contract Constants

```solidity
MIN_CHECK_IN_INTERVAL = 30 days
MAX_CHECK_IN_INTERVAL = 365 days
MIN_GRACE_PERIOD = 7 days
MAX_GRACE_PERIOD = 90 days
MAX_BENEFICIARIES = 10
GUARDIAN_COUNT = 3 (exactly)
GUARDIAN_TRIGGER_THRESHOLD = 2 (2-of-3)
GUARDIAN_ATTESTATION_COOLDOWN = 24 hours
REVOKE_WINDOW = 7 days
```

## Core Functions

### 1. `createVault(...)`
- Creates vault with exactly 3 guardians
- Validates: guardians ≠ beneficiaries, no duplicates
- Sets check-in interval (30-365 days)
- Sets grace period (7-90 days)

### 2. `checkIn(uint256 vaultId)`
- Resets timer
- Clears guardian attestations
- Only works if status == Active

### 3. `attestDeath(uint256 vaultId)`
- Guardian-only function
- Requires 24h cooldown between attestations
- Triggers vault immediately when 2-of-3 attest

### 4. `updateVaultStatus(uint256 vaultId)`
- Public function (anyone can call)
- Updates status based on time: Active → Warning → Triggered
- Called automatically before sensitive operations

### 5. `claim(uint256 vaultId)`
- Beneficiary claims IPFS metadata hash
- Receives encrypted vault data
- Cannot claim twice

### 6. `emergencyRevoke(uint256 vaultId, bytes proofOfLifeSignature)`
- Owner revokes false trigger within 7 days
- Requires proof-of-life (validated off-chain)
- Resets vault to Active and clears attestations

## Death Verification Strategy

### Track 1: Guardian Attestation (Fast - 24-48 hours)
- 2 out of 3 guardians attest to death
- Instant vault trigger
- Best for: Confirmed deaths, legal proceedings

### Track 2: Dead Man's Switch (Slow - 90-120 days)
- Owner fails to check in within interval + grace
- Automatic trigger after grace period
- Best for: Unreachable guardians, missing persons

## Guardian Selection Guidelines

**Who should be guardians:**
- Spouse/partner
- Adult child or sibling
- Close friend or lawyer

**NOT crypto people** - these should be people who:
- Will definitely know if you die
- Can be reached by beneficiaries
- Won't collude with beneficiaries to fake death

## Access Control Strategy

**Recommended: Simple Permissionless Contract**

- Contract has NO subscription check at contract level
- Frontend checks Stripe subscription status
- Contract is open (anyone can create vault)
- If someone reverse-engineers and creates vault without paying... they still need your frontend for full experience

**Alternative (More Complex):**
- Backend validates Stripe subscription
- Backend signs message proving subscription
- Contract verifies signature from backend address
- Adds complexity for minimal security gain

**Recommendation: Use simple approach** - gate at frontend only.

## IPFS Metadata Structure

When beneficiary claims, they receive IPFS hash containing:

```json
{
  "encryptedVaultData": "...",  // Encrypted with key fragments
  "instructions": "Download GuardiaVault app to decrypt",
  "contactEmail": "support@guardiavault.com",
  "beneficiaryCount": 3,
  "yourFragment": 1
}
```

## Encryption Scheme

- Master key split into N fragments (N = number of beneficiaries)
- Requires K fragments to decrypt (e.g., 2-of-3 using Shamir's Secret Sharing)
- Each beneficiary gets their fragment from IPFS
- They must coordinate to decrypt vault contents

## Deployment Cost Estimate

**Simplified Contract:**
- Contract size: ~654 lines
- Estimated gas: ~1,200,000-1,400,000
- Cost at 40 gwei: ~0.048-0.056 ETH
- USD equivalent: ~$120-168

**Audit Cost:**
- MythX automated: $99
- Manual review (Upwork): $500-1,000
- Total: ~$600-1,100 (vs $40-50k for complex version)

## Next Steps

1. ✅ Contract simplified and compiled
2. ⏳ Write unit tests (Hardhat/Foundry)
3. ⏳ Deploy to Sepolia testnet
4. ⏳ Test all functions end-to-end
5. ⏳ Integrate with Stripe subscription check (frontend only)
6. ⏳ Build guardian onboarding flow
7. ⏳ Implement beneficiary claim UI
8. ⏳ Run MythX automated audit
9. ⏳ Manual code review
10. ⏳ Deploy to mainnet

## Guardian Onboarding Flow (To Implement)

```
1. User creates vault → Contract emits GuardiansAssigned event
2. Backend listens for event
3. Sends email to each guardian:
   "You've been named a guardian for [Name]'s digital vault.
   
   What this means: If [Name] passes away, you'll be asked 
   to confirm this by clicking a link. 2 of the 3 guardians 
   must confirm before the vault activates.
   
   [Accept Guardian Role] [Decline]"

4. Guardian clicks accept → Store in database
5. If declines → Notify user to pick someone else
```

## Additional Revenue Streams (Backend Implementation)

### 1. Vault Claim Fees (2-5% of assets)
- Calculate percentage when vault triggers
- Store in database/subscription record
- Charge at time of claim

### 2. Enterprise Plans ($5k-50k/year)
- Custom pricing page for B2B sales
- Contact form for enterprise inquiries
- Custom Stripe products for enterprise

### 3. Document Storage Fees
- Track document storage size per user
- Charge for storage beyond basic IPFS hash
- Add storage quota to subscription limits

