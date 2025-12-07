# Death Certificate Verification Oracle

## Overview

This document describes the on-chain death verification system using Chainlink oracles and government vital records APIs.

## Architecture

### Components

1. **Smart Contract (`GuardiaVault.sol`)**
   - `verifyDeath(address userAddress)` - Oracle-only function to verify death
   - `DeathVerified` event - Emitted when death is verified
   - `VaultReadyForClaim` event - Emitted when vault transitions to ReadyForClaim
   - State transitions: `DeathVerified` → `ReadyForClaim` (after configurable delay)

2. **Chainlink External Adapter (`server/services/chainlinkDeathOracle.ts`)**
   - Processes Chainlink oracle requests
   - Queries government vital records APIs
   - Submits verified deaths on-chain
   - Returns Chainlink-compatible responses

3. **Mock API Service (`server/services/mockVitalRecordsAPI.ts`)**
   - Mock government vital records API for testing
   - Can be replaced with real APIs when partnerships are established

4. **Vault Monitor (`server/services/vaultDeathVerificationMonitor.ts`)**
   - Monitors vaults in Warning/Triggered states
   - Flags vaults for death verification after configurable delay

## Flow

```
1. Vault enters Warning/Triggered state
   ↓
2. Vault monitor flags vault for verification (after 7 days)
   ↓
3. Chainlink oracle receives request
   ↓
4. Oracle queries government API (VitalChek/State APIs)
   ↓
5. If death certificate found:
   - Oracle calls verifyDeath(userAddress) on-chain
   - Contract emits DeathVerified event
   - Vault status → DeathVerified
   ↓
6. After delay period (default: 7 days):
   - Call updateDeathVerificationStatus(vaultId)
   - Vault status → ReadyForClaim
   ↓
7. Beneficiaries can claim
```

## Smart Contract Functions

### `verifyDeath(address userAddress)`
- **Access**: Oracle only
- **Purpose**: Verify death on-chain
- **Effects**:
  - Sets `_deathVerifications[vaultId].verified = true`
  - Updates vault status to `DeathVerified`
  - Emits `DeathVerified` event

### `updateDeathVerificationStatus(uint256 vaultId)`
- **Access**: Public
- **Purpose**: Transition `DeathVerified` → `ReadyForClaim` after delay
- **Effects**: Updates vault status if delay has elapsed

### `getDeathVerification(uint256 vaultId)`
- **Access**: Public view
- **Returns**: `(bool verified, uint256 verifiedAt, address verifiedBy)`

### `getReadyForClaimAt(uint256 vaultId)`
- **Access**: Public view
- **Returns**: Timestamp when vault becomes ready for claim

## API Endpoints

### POST `/api/oracle/death-verification`
Chainlink External Adapter endpoint.

**Request:**
```json
{
  "jobId": "job-123",
  "data": {
    "userAddress": "0x...",
    "userId": "user-123",
    "name": "John Doe",
    "dateOfBirth": "1980-01-01",
    "deathDate": "2024-01-15",
    "deathLocation": "Los Angeles, CA"
  }
}
```

**Response:**
```json
{
  "jobRunID": "job-123",
  "status": "success",
  "data": {
    "verified": true,
    "confidence": 1.0,
    "source": "death_certificate_official",
    "certificateNumber": "DC-2024-001234",
    "deathDate": "2024-01-15"
  }
}
```

### POST `/api/oracle/verify-death`
Manual verification trigger (testing/admin).

### POST `/api/oracle/flag-vault`
Flag a vault for verification.

## Configuration

### Environment Variables

```bash
# Oracle Configuration
ORACLE_PRIVATE_KEY=0x... # Private key for oracle wallet
GUARDIA_VAULT_CONTRACT_ADDRESS=0x... # Deployed contract address
RPC_URL=https://... # Ethereum RPC endpoint

# API Configuration (when partnerships exist)
VITALCHEK_API_KEY=...
VITALCHEK_API_URL=https://api.vitalchek.com/v1
CA_VITAL_RECORDS_API=https://...
CA_VITAL_RECORDS_KEY=...

# Mock Mode (for testing)
USE_MOCK_VITAL_RECORDS=true
```

### Contract Configuration

- `deathVerificationDelay`: Default 7 days (configurable via `setDeathVerificationDelay()`)
- `oracle`: Oracle address (set via `setOracle()`)

## Defensibility

### Closed-Source Adapter
The Chainlink External Adapter can be deployed as a closed-source service to protect:
- API credentials
- Query logic
- Rate limiting rules
- Data processing algorithms

### Exclusive Data Partnership
Partner with a records aggregator (e.g., VitalChek) to:
- Get exclusive API access
- Receive webhooks for new death records
- Reduce query costs
- Improve verification speed

## Testing

### Running Tests

```bash
# Compile contracts
npm run compile

# Run death verification tests
npx hardhat test contracts/test/DeathVerification.test.ts
```

### Acceptance Test Flow

1. Create vault with owner, guardians, and beneficiary
2. Oracle verifies death → Vault status becomes `DeathVerified`
3. Fast-forward time by delay period
4. Update status → Vault status becomes `ReadyForClaim`
5. Beneficiary claims → Vault status becomes `Claimed`

## Production Deployment

### 1. Deploy Contract
```bash
npm run deploy:sepolia  # or deploy:mainnet
```

### 2. Set Oracle Address
```solidity
await guardiaVault.setOracle(oracleWalletAddress);
```

### 3. Deploy Oracle Adapter
- Deploy as separate service
- Set environment variables
- Configure Chainlink job to call adapter endpoint

### 4. Enable Monitoring
- Set up cron job to call `vaultDeathVerificationMonitor.checkAndFlagVaults()`
- Runs daily to flag vaults for verification

## Security Considerations

1. **Oracle Access Control**: Only authorized oracle can call `verifyDeath()`
2. **Double Verification Prevention**: Once verified, cannot be verified again
3. **Delay Period**: Configurable delay prevents immediate claims after verification
4. **API Credentials**: Store securely (env vars, secrets manager)
5. **Rate Limiting**: Implement rate limits on oracle endpoints

## Future Enhancements

1. **Multi-Oracle Consensus**: Require multiple oracles to verify death
2. **Reputation System**: Track oracle accuracy
3. **Dispute Mechanism**: Allow challenges to death verifications
4. **Real-time Monitoring**: Subscribe to death record webhooks
5. **Cross-Chain Support**: Verify deaths across multiple chains






