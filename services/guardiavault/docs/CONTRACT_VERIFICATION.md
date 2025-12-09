# GuardiaVault Contract Verification & Frontend Integration Update

## ✅ Contract Status

Your simplified `GuardiaVault.sol` contract is **verified and matches the specification**:

### Key Features Confirmed:
- ✅ Exactly 3 guardians (fixed at creation)
- ✅ 2-of-3 guardian attestation threshold
- ✅ 24-hour cooldown between guardian attestations
- ✅ 7-day revoke window for false triggers
- ✅ Beneficiaries cannot be guardians (enforced)
- ✅ Cannot modify during Warning state
- ✅ All subscription/escrow logic removed (Stripe-only)

### Contract Functions:
1. `createVault(checkInInterval, gracePeriod, beneficiaries[], guardians[3], metadataHash)` - ✅ Updated
2. `checkIn(vaultId)` - ✅ No changes
3. `attestDeath(vaultId)` - ✅ Renamed from `guardianAttest`
4. `updateVaultStatus(vaultId)` - ✅ Public function
5. `claim(vaultId)` - ✅ Renamed from `claimVault`
6. `emergencyRevoke(vaultId, proofOfLifeSignature)` - ✅ New function
7. `updateMetadata(vaultId, newMetadataHash)` - ✅ Cannot modify during Warning

### Removed Functions:
- ❌ `addBeneficiary()` - Beneficiaries set at creation only
- ❌ `removeBeneficiary()` - Cannot remove beneficiaries
- ❌ `addGuardian()` - Guardians set at creation only
- ❌ `updateBeneficiaries()` - Cannot update beneficiaries

## 🔄 Frontend Integration Updates

### Updated Files:

#### 1. `client/src/lib/contracts/guardiaVault.ts`
- ✅ Updated `VaultData` interface to include `guardians: string[]`
- ✅ Updated `createVault()` to require `guardians: [string, string, string]`
- ✅ Updated `getVaultDetails()` to handle new return structure (tuple)
- ✅ Removed `addBeneficiary()` and `removeBeneficiary()`
- ✅ Removed `addGuardian()`
- ✅ Added `attestDeath()` (replaces `guardianAttest`)
- ✅ Added `claim()` (replaces `claimVault`)
- ✅ Added `updateVaultStatus()`
- ✅ Added `emergencyRevoke()`
- ✅ Added `updateMetadata()`
- ✅ Added guardian query functions: `getGuardians()`, `getGuardianAttestationCount()`, `hasGuardianAttested()`, `isGuardian()`, `canRevoke()`

#### 2. `client/src/hooks/useGuardiaVault.ts`
- ✅ Updated `createVault()` hook to accept guardians array
- ✅ Removed `addBeneficiary()` hook
- ✅ Removed `addGuardian()` hook
- ✅ Added `attestDeath()` hook
- ✅ Updated `claimVault()` to use new `claim()` function
- ✅ Added `updateVaultStatus()` hook
- ✅ Added `revokeVault()` hook
- ✅ Added `updateMetadata()` hook
- ✅ Added `fetchGuardians()` hook
- ✅ Added `fetchGuardianAttestationCount()` hook

## ⚠️ Action Required

### 1. Regenerate ABI File

The ABI file needs to be regenerated from the compiled contract:

```bash
npx hardhat compile
cp artifacts/contracts/GuardiaVault.sol/GuardiaVault.json client/src/lib/contracts/GuardiaVault.abi.json
```

Or manually update `client/src/lib/contracts/GuardiaVault.abi.json` with the new ABI.

### 2. Update Frontend Components

The following components may need updates to use the new contract interface:

- `client/src/pages/CreateVault.tsx` - Must now require exactly 3 guardians
- `client/src/pages/Guardians.tsx` - Remove "Add Guardian" functionality
- `client/src/pages/Claims.tsx` - Update to use `attestDeath()` instead of `guardianAttest()`
- Any components using `addBeneficiary()` or `addGuardian()` - These functions no longer exist

### 3. Contract Deployment

Before deploying, ensure:
- ✅ Contract compiles without errors: `npx hardhat compile`
- ✅ ABI file is updated
- ✅ Frontend components are updated to match new interface
- ✅ Test on Sepolia testnet first

## 📝 New Hook API

```typescript
const {
  loading,
  createVault,              // (checkInInterval, gracePeriod, beneficiaries, guardians[3], metadataHash)
  checkIn,                  // (vaultId)
  fetchVaultDetails,        // Returns: { ..., guardians: string[] }
  fetchVaultStatus,
  attestDeath,              // Guardian-only: (vaultId)
  claimVault,               // Beneficiary-only: (vaultId)
  updateVaultStatus,        // Public: (vaultId)
  revokeVault,              // Owner-only: (vaultId, proofOfLifeSignature)
  updateMetadata,           // Owner-only: (vaultId, newMetadataHash)
  fetchGuardians,           // (vaultId) => string[]
  fetchGuardianAttestationCount, // (vaultId) => number
} = useGuardiaVault();
```

## 🎯 Next Steps

1. **Regenerate ABI** from compiled contract
2. **Update CreateVault component** to require exactly 3 guardians
3. **Remove "Add Guardian" UI** from Guardians page
4. **Update Claims component** to use `attestDeath()`
5. **Test on Sepolia** before mainnet deployment

---

*Contract verified on: $(date)*
*Frontend integration updated to match simplified contract*

