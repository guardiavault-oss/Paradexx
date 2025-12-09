# Sepolia Deployment Guide

## Prerequisites

### 1. Get Sepolia RPC URL

Choose one provider:

**Option A: Infura (Recommended)**
1. Go to https://infura.io
2. Sign up / Log in
3. Create new API key
4. Copy the Sepolia endpoint: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

**Option B: Alchemy**
1. Go to https://www.alchemy.com
2. Sign up / Log in
3. Create new app (select Sepolia network)
4. Copy the HTTPS endpoint

### 2. Get Sepolia ETH

Your deployer wallet needs Sepolia ETH for gas fees:

1. Go to https://sepoliafaucet.com OR https://faucet.quicknode.com/ethereum/sepolia
2. Enter your wallet address
3. Request test ETH (you'll need ~0.1 ETH for all deployments)

### 3. Get Etherscan API Key (Optional - for contract verification)

1. Go to https://etherscan.io/apis
2. Sign up / Log in
3. Create new API key
4. Copy the key

## Setup Environment Variables

Update your `.env` file with:

```bash
# Sepolia RPC
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Deployer private key (KEEP SECRET!)
PRIVATE_KEY=0x... # Your wallet private key with Sepolia ETH

# Etherscan API (for verification)
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# Frontend config
VITE_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

## Deployment Steps

### Step 1: Compile Contracts

```bash
npm run compile
```

### Step 2: Deploy GuardiaVault

```bash
npm run deploy:sepolia
```

This deploys the main GuardiaVault contract.

### Step 3: Deploy YieldVault (with Lido & Aave adapters)

```bash
npm run deploy:yield:sepolia
```

This deploys:
- YieldVault contract
- LidoAdapter
- AaveAdapter

### Step 4: Update Environment Variables

After deployment, update `.env` with the contract addresses:

```bash
VITE_GUARDIA_VAULT_ADDRESS=0x... # From step 2
YIELD_VAULT_ADDRESS=0x... # From step 3
LIDO_ADAPTER_ADDRESS=0x... # From step 3
AAVE_ADAPTER_ADDRESS=0x... # From step 3
```

### Step 5: Verify Contracts on Etherscan

```bash
# Verify GuardiaVault
npx hardhat verify --network sepolia GUARDIA_VAULT_ADDRESS

# Verify YieldVault
npx hardhat verify --network sepolia YIELD_VAULT_ADDRESS

# Verify adapters
npx hardhat verify --network sepolia LIDO_ADAPTER_ADDRESS
npx hardhat verify --network sepolia AAVE_ADAPTER_ADDRESS
```

## Contract Addresses (Sepolia)

After deployment, record your addresses here:

- **GuardiaVault**: `0x...`
- **YieldVault**: `0x...`
- **LidoAdapter**: `0x...`
- **AaveAdapter**: `0x...`
- **LifetimeAccess**: `0x...`
- **SmartWill**: `0x...`

## Testing Deployment

```bash
# Test contract interaction
npx hardhat run scripts/test-deployment.ts --network sepolia
```

## Troubleshooting

### "Insufficient funds for gas"
- Get more Sepolia ETH from faucet
- Check your wallet balance: https://sepolia.etherscan.io

### "Invalid API key"
- Double-check your RPC URL
- Ensure your Infura/Alchemy project is active

### "Private key error"
- Ensure PRIVATE_KEY starts with "0x"
- Verify the private key is 64 hex characters (after "0x")
- Export from MetaMask: Account Details > Export Private Key

### "Contract verification failed"
- Wait 30 seconds after deployment
- Ensure ETHERSCAN_API_KEY is set
- Try manual verification on Etherscan

## Security Notes

- ⚠️ **NEVER** commit `.env` to git
- ⚠️ Use a separate deployer wallet (not your main wallet)
- ⚠️ Keep private keys secure
- ⚠️ After deployment, transfer ownership to a multisig wallet
