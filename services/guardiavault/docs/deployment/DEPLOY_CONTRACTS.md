# Smart Contract Deployment Guide

This guide walks you through deploying GuardiaVault smart contracts to Sepolia testnet and mainnet.

## Prerequisites

1. **Ethereum Wallet with Test ETH**
   - Create or use an existing wallet
   - Get Sepolia test ETH from faucets:
     - https://sepoliafaucet.com/
     - https://www.alchemy.com/faucets/ethereum-sepolia
     - https://faucets.chain.link/sepolia
   - For mainnet: Ensure you have sufficient ETH for gas fees

2. **RPC Provider**
   - Sign up for a free RPC provider:
     - [Alchemy](https://www.alchemy.com/) (Recommended)
     - [Infura](https://www.infura.io/)
     - [QuickNode](https://www.quicknode.com/)
   
3. **Etherscan API Key** (for contract verification)
   - Sign up at [Etherscan](https://etherscan.io/apis)
   - Get your API key from the API section

## Environment Setup

### 1. Create/Update `.env` File

Add the following environment variables to your `.env` file:

```env
# Network Configuration
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
# OR for Infura:
# SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Deployer Wallet Private Key
# ⚠️ WARNING: Never commit this to git!
# Format: 0x followed by 64 hex characters
PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000

# Etherscan API Key (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Network Selection (optional - defaults to sepolia)
NETWORK=sepolia
```

### 2. Verify Your Setup

```bash
# Compile contracts
npm run compile

# Check your deployer wallet balance
npx hardhat run scripts/check-balance.ts --network sepolia
```

## Deployment Methods

### Method 1: Deploy All Contracts (Recommended)

Deploys both `SubscriptionEscrow` and `GuardiaVault` contracts:

```bash
# Deploy to Sepolia testnet
npx hardhat run scripts/deploy-all.ts --network sepolia

# Or using npm script (if configured)
npm run deploy:sepolia
```

This will:
1. Deploy `SubscriptionEscrow` contract
2. Deploy `GuardiaVault` contract
3. Automatically verify contracts on Etherscan (if API key is set)
4. Save deployment addresses to `deployments/sepolia-all-contracts.json`

### Method 2: Deploy Individual Contracts

#### Deploy SubscriptionEscrow Only

```bash
npx hardhat run scripts/deploy-subscription-escrow.ts --network sepolia
```

#### Deploy GuardiaVault Only

```bash
npx hardhat run scripts/deploy-guardia-vault.ts --network sepolia
```

### Method 3: Using Hardhat Ignition (Modern Approach)

```bash
# Deploy to Sepolia
npx hardhat ignition deploy ignition/modules/GuardiaVault.ts --network sepolia

# This is the same as:
npm run deploy:sepolia
```

## Deployment Output

After successful deployment, you'll see:

```
✅ Deployment Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Network:        sepolia
Chain ID:       11155111
Deployer:       0x1234...5678
Timestamp:      2024-01-15T10:30:00.000Z

Contracts:
┌─────────────────────────────┬──────────────────────────────────────────────┐
│ Contract                    │ Address                                      │
├─────────────────────────────┼──────────────────────────────────────────────┤
│ SubscriptionEscrow          │ 0xABCDEF1234567890ABCDEF1234567890ABCDEF12  │
│ GuardiaVault                │ 0x1234567890ABCDEF1234567890ABCDEF12345678  │
└─────────────────────────────┴──────────────────────────────────────────────┘

Contract URLs:
- SubscriptionEscrow: https://sepolia.etherscan.io/address/0xABCDEF...
- GuardiaVault: https://sepolia.etherscan.io/address/0x123456...

✅ Deployment info saved to deployments/sepolia-all-contracts.json
```

## Post-Deployment Steps

### 1. Save Contract Addresses

Update your environment variables:

```env
# In .env file (for backend)
GUARDIA_VAULT_ADDRESS=0x1234567890ABCDEF1234567890ABCDEF12345678
SUBSCRIPTION_ESCROW_ADDRESS=0xABCDEF1234567890ABCDEF1234567890ABCDEF12

# In .env file (for frontend - these start with VITE_)
VITE_GUARDIA_VAULT_ADDRESS=0x1234567890ABCDEF1234567890ABCDEF12345678
VITE_SUBSCRIPTION_ESCROW_ADDRESS=0xABCDEF1234567890ABCDEF1234567890ABCDEF12
```

### 2. Update Frontend Environment Variables

If deploying frontend to Netlify:

1. Go to Netlify Dashboard > Site Settings > Environment Variables
2. Add:
   - `VITE_GUARDIA_VAULT_ADDRESS`
   - `VITE_SUBSCRIPTION_ESCROW_ADDRESS`
   - `VITE_CHAIN_ID=11155111` (for Sepolia)
   - `VITE_SEPOLIA_RPC_URL`

### 3. Update Backend Environment Variables (Railway)

1. Go to Railway Dashboard > Your Service > Variables
2. Add:
   - `GUARDIA_VAULT_ADDRESS`
   - `SUBSCRIPTION_ESCROW_ADDRESS`
   - `SEPOLIA_RPC_URL`
   - `PRIVATE_KEY` (if backend needs to interact with contracts)

### 4. Verify Contracts on Etherscan

If automatic verification didn't work, manually verify:

```bash
# Verify GuardiaVault
npx hardhat verify --network sepolia 0x1234567890ABCDEF1234567890ABCDEF12345678

# Verify SubscriptionEscrow
npx hardhat verify --network sepolia 0xABCDEF1234567890ABCDEF1234567890ABCDEF12 <platform_address>
```

### 5. Test the Deployment

```bash
# Run contract tests
npm run test:contracts

# Or test interactions manually
npx hardhat console --network sepolia
```

## Mainnet Deployment

When ready for mainnet deployment:

### 1. Update Environment Variables

```env
# Use mainnet RPC
SEPOLIA_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
NETWORK=mainnet

# Use mainnet Etherscan
ETHERSCAN_API_KEY=your_mainnet_etherscan_key

# Ensure PRIVATE_KEY is set (use a secure, dedicated deployer wallet)
```

### 2. Deploy to Mainnet

```bash
# ⚠️ DOUBLE CHECK: Ensure you're using mainnet RPC and have sufficient ETH
npx hardhat run scripts/deploy-all.ts --network mainnet
```

### 3. Update Hardhat Config

Ensure `hardhat.config.cjs` includes mainnet network:

```javascript
networks: {
  mainnet: {
    url: process.env.MAINNET_RPC_URL || "",
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    chainId: 1,
  },
}
```

## Troubleshooting

### Insufficient Balance Error

```
Error: Deployer account has 0 ETH
```

**Solution**: Fund your wallet from a faucet (testnet) or send ETH (mainnet).

### Contract Verification Fails

**Solution**: 
1. Wait a few minutes after deployment (Etherscan indexing)
2. Verify manually using the `npx hardhat verify` command
3. Ensure constructor arguments are correct

### RPC URL Not Working

**Solution**:
1. Check your RPC provider dashboard for status
2. Verify API key is correct
3. Check rate limits
4. Try an alternative RPC provider

### Build Errors

```bash
# Clean and rebuild
rm -rf artifacts cache
npm run compile
```

## Security Best Practices

1. **Never commit private keys** - Use environment variables only
2. **Use separate wallets** - Different wallets for testnet and mainnet
3. **Test thoroughly** - Always test on testnet first
4. **Verify contracts** - Always verify on Etherscan for transparency
5. **Multi-sig deployment** - For mainnet, consider using a multi-sig wallet
6. **Review gas costs** - Check gas estimates before deploying

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Contracts compiled (`npm run compile`)
- [ ] Wallet funded with test ETH
- [ ] RPC URL working
- [ ] Etherscan API key set
- [ ] Deploy to testnet
- [ ] Verify contracts on Etherscan
- [ ] Test contract interactions
- [ ] Update environment variables (backend & frontend)
- [ ] Deploy to mainnet (when ready)
- [ ] Document contract addresses

## Useful Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm run test:contracts

# Run local Hardhat node
npm run node:local

# Deploy to local network
npm run deploy:local

# Check deployment info
cat deployments/sepolia-all-contracts.json

# Hardhat console (interactive)
npx hardhat console --network sepolia
```

## Next Steps

After deploying contracts:

1. ✅ Update frontend environment variables (Netlify)
2. ✅ Update backend environment variables (Railway)
3. ✅ Test contract interactions from frontend
4. ✅ Test API endpoints that interact with contracts
5. ✅ Monitor contract events and logs

## Support

- [Hardhat Documentation](https://hardhat.org/docs)
- [Etherscan Contract Verification](https://etherscan.io/apis#contracts)
- [Hardhat Ignition Docs](https://hardhat.org/ignition/docs)

