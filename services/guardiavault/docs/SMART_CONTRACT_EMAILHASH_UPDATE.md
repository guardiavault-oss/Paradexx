# Smart Contract EmailHash Update

## Overview

The `GuardiaVault.sol` contract has been updated to support **emailHash-based guardians** in addition to address-based guardians. This enables the Guardian Portal system where guardians can participate via email without requiring a wallet address upfront.

## Changes Summary

### 1. New Storage Variables

```solidity
// EmailHash-based guardian mappings
mapping(uint256 => mapping(bytes32 => bool)) private _isGuardianByEmailHash;
mapping(uint256 => bytes32[]) private _guardianEmailHashes;
mapping(uint256 => mapping(bytes32 => bool)) private _guardianAttestedByEmailHash;
mapping(uint256 => mapping(bytes32 => uint256)) private _lastGuardianAttestationByEmailHash;
mapping(uint256 => mapping(bytes32 => address)) private _emailHashToAddress; // Links emailHash to wallet
```

### 2. Updated Vault Struct

```solidity
struct Vault {
    // ... existing fields ...
    address[] guardians; // Address-based guardians (backward compatible)
    bytes32[] guardianEmailHashes; // NEW: EmailHash-based guardians
    // ... rest of fields ...
}
```

### 3. New Functions

#### `addGuardianByEmailHash(uint256 vaultId, bytes32 emailHash)`
- **Access:** Vault owner only
- **Purpose:** Add an emailHash-based guardian to a vault
- **Limits:** Maximum 5 total guardians (address + emailHash combined)
- **Validation:** Checks for duplicates and zero hash

#### `attestDeathByEmailHash(uint256 vaultId, bytes32 emailHash, bytes calldata signature)`
- **Access:** Public (anyone, but must be emailHash guardian)
- **Purpose:** Allow emailHash-based guardians to attest to owner's death
- **Security:** Requires ECDSA signature proving control of emailHash
- **Message Format:** `"GuardiaVault:Attest:{vaultId}:{emailHash}"`
- **Behavior:** First call links emailHash to signer's address

#### `linkEmailHashToAddress(uint256 vaultId, bytes32 emailHash, bytes calldata signature)`
- **Access:** Public (guardian with emailHash)
- **Purpose:** Link emailHash to wallet address (pre-attestation)
- **Message Format:** `"GuardiaVault:Link:{vaultId}:{emailHash}:{address}"`

### 4. New View Functions

- `isGuardianByEmailHash(uint256 vaultId, bytes32 emailHash) -> bool`
- `getGuardianEmailHashes(uint256 vaultId) -> bytes32[]`
- `getEmailHashLinkedAddress(uint256 vaultId, bytes32 emailHash) -> address`
- `hasGuardianAttestedByEmailHash(uint256 vaultId, bytes32 emailHash) -> bool`
- `getGuardianCount(uint256 vaultId) -> (totalCount, addressCount, emailHashCount)`
- `getVaultWithEmailHashes(uint256 vaultId) -> (full vault info including emailHashes)`

### 5. Updated Functions

- `emergencyRevoke()`: Now clears both address-based and emailHash-based attestations

### 6. New Events

```solidity
event GuardianAttestedByEmailHash(
    uint256 indexed vaultId,
    bytes32 indexed emailHash,
    address guardianAddress,
    uint256 attestationCount,
    bool triggered
);

event GuardianEmailHashAdded(
    uint256 indexed vaultId,
    bytes32 indexed emailHash,
    address indexed addedBy
);

event GuardianEmailHashLinked(
    uint256 indexed vaultId,
    bytes32 indexed emailHash,
    address indexed walletAddress
);
```

## Usage Flow

### Adding EmailHash Guardians (Backend)

1. Vault owner invites guardian via email
2. Backend generates emailHash: `SHA-256(email.toLowerCase().trim())`
3. Backend calls `addGuardianByEmailHash(vaultId, emailHash)`

### Guardian Attestation (Frontend)

1. Guardian receives email invitation and accepts via Guardian Portal
2. When recovery is needed, guardian visits portal
3. Portal shows pending claim requiring attestation
4. Guardian clicks "Approve" → Frontend:
   - Prompts guardian to connect wallet (if not already linked)
   - Generates message: `"GuardiaVault:Attest:{vaultId}:{emailHash}"`
   - Guardian signs message with wallet
   - Frontend calls `attestDeathByEmailHash(vaultId, emailHash, signature)`

### Signature Verification

The contract uses standard ECDSA recovery (`ecrecover`) to verify signatures:
- Message format: `"\x19Ethereum Signed Message:\n{length}{message}"`
- Signature format: 65 bytes (r, s, v)

## Backward Compatibility

✅ **Fully backward compatible:**
- Existing address-based guardians continue to work
- `createVault()` still accepts `address[3] guardians`
- All existing functions unchanged
- Can mix address-based and emailHash-based guardians

## Security Considerations

1. **EmailHash Format:** Must be SHA-256 of email (backend ensures this)
2. **Signature Verification:** Uses standard ECDSA with message prefix
3. **Cooldown:** Same 24-hour cooldown applies to emailHash guardians
4. **Threshold:** Combined count of address + emailHash attestations
5. **Link Once:** EmailHash can only be linked to one address (prevents hijacking)

## Integration with Guardian Portal

The backend service (`server/services/invite-tokens.ts`) provides:
- `hashEmail(email: string): string` - Generates SHA-256 hash

Example usage:
```typescript
import { hashEmail } from "./services/invite-tokens";

const emailHash = hashEmail("guardian@example.com");
// Returns: "0x..." (64-char hex string, converted to bytes32)

// Call smart contract:
await contract.addGuardianByEmailHash(vaultId, emailHash);
```

## Testing Checklist

- [ ] Add emailHash guardian to vault
- [ ] Verify emailHash guardian check functions
- [ ] Link emailHash to wallet address
- [ ] Attest via emailHash (with signature)
- [ ] Verify combined threshold (2-of-3: mix of address + emailHash)
- [ ] Test cooldown period for emailHash guardians
- [ ] Test duplicate emailHash prevention
- [ ] Test emergencyRevoke clears emailHash attestations
- [ ] Verify backward compatibility with address-only guardians

## Migration Notes

**No migration required** - This is a backward-compatible extension. Existing vaults continue to work with address-based guardians only. New vaults can optionally add emailHash guardians.

