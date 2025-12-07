# GuardiaVault Security Model & Limitations

## Passphrase Derivation System

### Design
- **Master Secret**: User-controlled 256-bit secret (base64-encoded)
- **Guardian Passphrases**: Derived via `PBKDF2(masterSecret, salt, 100k iterations)`
- **Derivation Salt**: `{guardianEmail}:fragment:{fragmentIndex}`
- **Storage**: Derivation salt stored with each fragment for reference

### Zero-Knowledge Architecture
1. Server generates master secret (or accepts user-provided)
2. Server derives guardian passphrases using PBKDF2
3. Server encrypts fragments with derived passphrases (AES-256-CBC)
4. Server returns master secret + all passphrases in creation response
5. **Server never persists passphrases** - returned once, then purged
6. User manually distributes passphrases to guardians
7. Server stores only encrypted fragments + derivation salts

## MVP Limitations & Production Considerations

### 1. Guardian Email Immutability
**Current**: Guardian emails are used in passphrase derivation
**Limitation**: Changing a guardian's email breaks passphrase regeneration
**MVP Solution**: Document that guardian emails are cryptographically bound
**Production Fix**: Use immutable guardian IDs instead of emails for salt

### 2. Passphrase Regeneration Flow
**Current**: User can regenerate passphrases using master secret + stored salt
**Limitation**: No UI flow to regenerate passphrases after creation
**MVP Solution**: User must download and save master secret at creation
**Production Fix**: Add "Regenerate Passphrases" UI with master secret input

### 3. Fragment Recovery Flow
**Current**: Beneficiaries collect pre-decrypted fragments from guardians
**Flow**:
  1. Vault triggers
  2. Each guardian decrypts their fragment using their passphrase
  3. Guardians securely send decrypted fragments to beneficiaries
  4. Beneficiaries collect 3+ fragments and use RecoverVault UI
  5. System reconstructs secret via Shamir's Secret Sharing

**Limitation**: No verification that regenerated passphrases actually decrypt fragments
**MVP Solution**: Assume passphrases are saved correctly at creation
**Production Fix**: Add integration test covering full roundtrip

### 4. Guardian Communication
**Current**: Manual passphrase distribution
**Limitation**: No automated secure delivery (email/SMS)
**MVP Solution**: PassphraseDisplay provides download + copy features
**Production Fix**: Integrate SendGrid/Twilio for automated delivery

### 5. Master Secret Storage
**Current**: Shown once in UI with download option
**Limitation**: If master secret is lost, passphrases cannot be regenerated
**MVP Solution**: Warn user prominently to save master secret
**Production Fix**: Offer encrypted backup options (password-protected, HSM, etc.)

## Security Assumptions for MVP

1. **Guardian Emails Are Stable**: Guardians will not change email addresses
2. **Manual Distribution Is Secure**: Users will distribute passphrases via secure channels
3. **Master Secret Is Saved**: Users will save master secret before closing UI
4. **Honest Guardians**: Guardians will decrypt and forward fragments when requested
5. **Out-of-Band Coordination**: Beneficiaries will contact guardians separately

## Production Hardening Checklist

- [ ] Replace email-based salts with immutable guardian IDs or wallet addresses
- [ ] Add passphrase regeneration UI flow
- [ ] Implement end-to-end test: create → regenerate → decrypt → recover
- [ ] Add automated passphrase delivery (encrypted email envelopes)
- [ ] Guardian acceptance flow (confirm receipt of passphrase)
- [ ] Master secret backup with encryption (user password + KDF)
- [ ] HSM integration for master secret storage
- [ ] Guardian rotation capability
- [ ] Email change detection with re-encryption
- [ ] Professional security audit (Trail of Bits / OpenZeppelin)
- [ ] Penetration testing
- [ ] Bug bounty program

## Known Attack Vectors (Mitigated)

1. **Server Compromise**: ✅ Passphrases never persisted on server
2. **Insider Threat**: ✅ Fragments encrypted, need threshold to reconstruct
3. **Guardian Collusion**: ✅ Requires 2 of 3 guardians (acceptable risk)
4. **MITM Attack**: ✅ HTTPS required, wallet signatures for check-ins
5. **Brute Force**: ✅ PBKDF2 with 100k iterations, 256-bit keys

## Known Attack Vectors (MVP Limitations)

1. **Guardian Email Change**: ⚠️ Breaks passphrase regeneration (documented limitation)
2. **Master Secret Loss**: ⚠️ No recovery possible (user responsibility)
3. **Insecure Distribution**: ⚠️ Manual distribution depends on user judgment
4. **No Guardian Verification**: ⚠️ Cannot verify guardians saved passphrases correctly
5. **Replay Attacks**: ⚠️ Check-in signatures not time-bound (future fix)

## Recommended User Guidelines

1. **Save Master Secret Immediately**: Download and store in password manager + physical backup
2. **Verify Guardian Passphrases**: Confirm each guardian has received and stored their passphrase
3. **Use Secure Channels**: Distribute passphrases via encrypted messaging (Signal, Wire, etc.)
4. **Never Email Passphrases**: Email is insecure for cryptographic secrets
5. **Test Recovery Process**: Periodically verify guardians can decrypt their fragments
6. **Document Guardian Info**: Keep record of which email was used for each guardian

## Cryptographic Details

### Fragment Encryption
```
Input: plaintext share (hex)
Salt: random 32 bytes
Key: PBKDF2(passphrase, salt, 100000, 32, SHA-256)
IV: random 16 bytes
Cipher: AES-256-CBC
Output: {encryptedData, iv, salt}
```

### Passphrase Derivation
```
Input: masterSecret (base64), guardianEmail, fragmentIndex
Salt: "{guardianEmail}:fragment:{fragmentIndex}"
Output: PBKDF2(masterSecret, salt, 100000, 32, SHA-256) as base64
```

### Shamir Secret Sharing
```
Scheme: 2-of-3 threshold
Library: secrets.js-grempe
Input: recovery phrase or private key
Output: 3 shares (any 2 can reconstruct)
```

## Future Enhancements

1. **Smart Contract Integration**: On-chain timelock + attestation
2. **ZK-Proofs**: Beneficiary identity verification without revealing identity
3. **Hardware Wallets**: Guardian passphrases stored in hardware security modules
4. **Biometric Backup**: Vault owner can use biometrics for emergency access
5. **Multi-Sig Recovery**: Require multiple beneficiaries to agree on recovery
6. **Automated Health Checks**: Periodic guardian verification
7. **Decentralized Storage**: Store encrypted fragments on IPFS
8. **Cross-Chain Support**: Multi-blockchain vault management

## Audit Trail

- Last Updated: 2025-10-29
- Version: MVP v0.1
- Security Review Status: Internal review only (production audit pending)
