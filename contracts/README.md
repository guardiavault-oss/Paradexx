# GuardianX Smart Contracts

## Overview

This directory contains the smart contracts for GuardianX attestation system.

## Contracts

### GuardianAttestationRegistry.sol

On-chain registry for GuardianX safety attestations. Stores attestation hashes on-chain (lightweight). Actual attestation data stored off-chain (IPFS/Ceramic).

#### Features

- **Publish Attestations**: Store attestation hashes on-chain
- **Revoke Attestations**: Revoke previously published attestations
- **Verify Attestations**: Check if an attestation is valid (published and not revoked)
- **Batch Verification**: Batch check multiple attestations

#### Usage

```solidity
// Deploy contract
GuardianAttestationRegistry registry = new GuardianAttestationRegistry();

// Publish attestation
bytes32 attestationHash = keccak256(abi.encodePacked(attestationData));
registry.publishAttestation(attestationHash);

// Verify attestation
bool isValid = registry.isAttestationValid(issuer, attestationHash);

// Revoke attestation
registry.revokeAttestation(attestationHash);
```

#### Events

- `AttestationPublished(address indexed issuer, bytes32 indexed attestationHash, uint256 timestamp)`
- `AttestationRevoked(address indexed issuer, bytes32 indexed attestationHash, uint256 timestamp)`

## Deployment

### Testnet (Sepolia)

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Mainnet

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

## Testing

```bash
npx hardhat test
```

## Security

- Contract has been audited (audit pending)
- Use at your own risk

## License

MIT

