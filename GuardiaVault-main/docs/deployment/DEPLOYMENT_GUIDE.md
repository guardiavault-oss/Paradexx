# GuardiaVault Smart Contract Deployment Guide

## ✅ Completed Steps

### 1. Contract Compilation
- **Status**: ✅ Complete
- **Command**: `pnpm run compile`
- **Result**: All Solidity files compiled successfully
- **Contracts**: GuardiaVault.sol, SubscriptionEscrow.sol

### 2. Local Deployment
- **Status**: ✅ Complete  
- **Network**: Hardhat (local)
- **Contract Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Deployment Method**: Hardhat Ignition (modern deployment system)

## 📋 What's Working Now

1. ✅ Smart contracts are compiled
2. ✅ Deployment scripts are configured
3. ✅ Local testing environment is ready
4. ✅ Frontend landing page is fully functional
5. ✅ User authentication and wallet connection ready

## 🚀 Next Steps to Make Fully Functional

### Step 1: Deploy to Testnet (Sepolia)

1. **Set up your .env file** with:
   ```env
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   PRIVATE_KEY=your_testnet_wallet_private_key
   ETHERSCAN_API_KEY=your_etherscan_key
   ```

2. **Get test ETH** from Sepolia faucet:
   - https://sepoliafaucet.com/
   - https://faucets.chain.link/sepolia

3. **Deploy to Sepolia**:
   ```bash
   pnpm run deploy:sepolia
   ```

### Step 2: Integrate Contracts with Frontend

**Create contract integration file**: `client/src/lib/contracts.ts`

```typescript
import { ethers } from "ethers";
import GuardiaVaultABI from "../../../artifacts/contracts/GuardiaVault.sol/GuardiaVault.json";

export const CONTRACT_ADDRESS = "YOUR_DEPLOYED_ADDRESS_HERE";

export function getGuardiaVaultContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    GuardiaVaultABI.abi,
    signerOrProvider
  );
}
```

### Step 3: Add Contract Functions to Frontend

Create hooks for interacting with the vault:
- `useCreateVault()` - Create a new vault
- `useCheckIn()` - Perform check-ins
- `useGetVaultStatus()` - Get vault status
- `useAddBeneficiary()` - Add beneficiaries
- `useAddGuardian()` - Add guardians

### Step 4: Environment Variables

Add to `client/.env`:
```env
VITE_GUARDIA_VAULT_ADDRESS=deployed_contract_address
VITE_CHAIN_ID=11155111  # Sepolia testnet
VITE_RPC_URL=your_rpc_url
```

### Step 5: Test End-to-End Flow

1. Connect wallet
2. Create a vault
3. Add beneficiaries
4. Add guardians  
5. Perform check-in
6. Test status transitions

## 📦 Available Commands

```bash
# Compile contracts
pnpm run compile

# Deploy to local Hardhat network
pnpm run deploy:local

# Deploy to Sepolia testnet
pnpm run deploy:sepolia

# Run contract tests
pnpm run test:contracts

# Start local Hardhat node (persistent)
pnpm run node:local

# Start frontend dev server
pnpm run dev
```

## 🔧 Contract Features

### GuardiaVault.sol
- ✅ Create vaults with check-in intervals
- ✅ Add/remove beneficiaries (max 20)
- ✅ Add guardians (2-of-3 multi-sig)
- ✅ Perform check-ins
- ✅ Automated status transitions (Active → Warning → Triggered)
- ✅ Guardian attestation system
- ✅ Emergency pause functionality
- ✅ Beneficiary claiming

### SubscriptionEscrow.sol
- ✅ Prepaid subscription system
- ✅ Escrow management
- ✅ Time-based subscription tracking

## 🔒 Security Notes

- **Never commit .env files** with real private keys
- **Use separate wallets** for development and production
- **Test thoroughly** on testnets before mainnet
- **Audit contracts** before mainnet deployment
- **Use hardware wallets** for production deployments

## 📝 Current Status Summary

**Frontend**: ✅ Fully functional landing page with video hero, navigation, features
**Backend**: ✅ Express server with authentication
**Smart Contracts**: ✅ Compiled and tested locally
**Integration**: ⏳ Pending - contracts need to be connected to frontend

## 🎯 Immediate Next Actions

1. Deploy to Sepolia testnet
2. Create contract integration utilities
3. Build vault management UI components
4. Implement wallet connection flow
5. Add transaction notifications
6. Create dashboard for vault management

---

**Current Deployment**: Local Hardhat Network
**Contract Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
**Status**: Ready for testnet deployment and frontend integration
