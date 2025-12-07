# GuardiaVault Deployment Guide

Complete guide for deploying GuardiaVault with integrated yield vault functionality.

## Quick Start

### 1. Compile Contracts

```bash
npm run compile
```

This compiles all Solidity contracts including:
- GuardiaVault.sol
- YieldVault.sol
- LidoAdapter.sol
- AaveAdapter.sol
- SubscriptionEscrow.sol
- And all other contracts

### 2. Start Local Blockchain

In a separate terminal:

```bash
npm run node:local
```

This starts a local Hardhat node at `http://localhost:8545` with:
- Pre-funded test accounts
- Block time: ~1 second
- Chain ID: 31337

### 3. Deploy Contracts Locally

**Deploy GuardiaVault:**
```bash
npm run deploy:local
```

**Deploy YieldVault (with adapters):**
```bash
npx hardhat ignition deploy ignition/modules/YieldVault.ts --network hardhat
```

**Deploy all contracts:**
```bash
npx tsx scripts/deploy-all.ts
```

### 4. Update Environment Variables

After deployment, update your `.env` file with the deployed contract addresses:

```bash
# GuardiaVault
VITE_GUARDIA_VAULT_ADDRESS=0x...  # From deploy:local output

# YieldVault
YIELD_VAULT_ADDRESS=0x...  # From YieldVault deployment
LIDO_ADAPTER_ADDRESS=0x...  # From YieldVault deployment
AAVE_ADAPTER_ADDRESS=0x...  # From YieldVault deployment
TREASURY_ADDRESS=0x...  # Your treasury wallet address

# Network
VITE_CHAIN_ID=31337  # Hardhat local
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5000` and create a vault!

## Detailed Deployment Instructions

### Prerequisites

1. **Node.js** >= 20.0.0
2. **npm** >= 10.0.0
3. **Environment Variables** configured in `.env`

### Step-by-Step Local Deployment

#### Step 1: Install Dependencies

```bash
npm install
```

#### Step 2: Configure Environment

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

Minimum required variables for local development:
```bash
NODE_ENV=development
DATABASE_URL=postgresql://guardiavault:changeme@localhost:5432/guardiavault
SESSION_SECRET=dev-secret-change-in-production
VITE_CHAIN_ID=31337
```

#### Step 3: Start Database (if using PostgreSQL)

```bash
docker-compose up -d
```

Or use your existing PostgreSQL instance.

#### Step 4: Compile Contracts

```bash
npm run compile
```

Expected output:
```
Compiled 22 Solidity files successfully
```

#### Step 5: Start Local Blockchain

**Terminal 1:**
```bash
npm run node:local
```

Keep this running. It provides:
- Test accounts with 10,000 ETH each
- Instant block confirmation
- Full EVM compatibility

#### Step 6: Deploy Contracts

**Terminal 2:**

**Deploy GuardiaVault:**
```bash
npm run deploy:local
```

Expected output:
```
✅ GuardiaVault deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Deploy YieldVault:**
```bash
npx hardhat ignition deploy ignition/modules/YieldVault.ts --network hardhat --parameters '{"YieldVaultModule":{"treasury":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8"}}'
```

Or edit `ignition/modules/YieldVault.ts` to set a default treasury address.

Expected output:
```
✅ LidoAdapter deployed to: 0x...
✅ AaveAdapter deployed to: 0x...
✅ YieldVault deployed to: 0x...
```

#### Step 7: Update Environment Variables

Add deployed addresses to `.env`:

```bash
VITE_GUARDIA_VAULT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
YIELD_VAULT_ADDRESS=0x...  # From YieldVault deployment
LIDO_ADAPTER_ADDRESS=0x...  # From YieldVault deployment  
AAVE_ADAPTER_ADDRESS=0x...  # From YieldVault deployment
```

#### Step 8: Start Development Server

```bash
npm run dev
```

The server will:
- Start on `http://localhost:5000`
- Auto-connect to local Hardhat node
- Initialize yield calculation cron job
- Start notification processor

#### Step 9: Create Your First Vault

1. Visit `http://localhost:5000`
2. Connect wallet (MetaMask configured for localhost:8545)
3. Create a vault
4. Add yield position (Lido or Aave)
5. Watch yield accumulate every hour!

## Sepolia Testnet Deployment

### Prerequisites

1. Sepolia ETH in deployer wallet
2. Sepolia RPC URL configured
3. Private key set in `.env`

### Configure for Sepolia

```bash
# .env
VITE_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=0x...  # Your deployer wallet private key
```

### Deploy to Sepolia

**Deploy GuardiaVault:**
```bash
npm run deploy:sepolia
```

**Deploy YieldVault:**
```bash
npx hardhat ignition deploy ignition/modules/YieldVault.ts --network sepolia --parameters '{"YieldVaultModule":{"treasury":"0xYourTreasuryAddress"}}'
```

### Verify Contracts (Optional)

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS [CONSTRUCTOR_ARGS]
```

## Production Deployment (Mainnet)

### Pre-Deployment Checklist

- [ ] All contracts audited
- [ ] Treasury address is multisig wallet
- [ ] Private keys secured (use hardware wallet or dedicated deployer)
- [ ] Testnet deployment successful
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database backups configured
- [ ] Monitoring set up

### Configure for Mainnet

```bash
# .env
NODE_ENV=production
VITE_CHAIN_ID=1
VITE_SEPOLIA_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=0x...  # Hardware wallet or secure key management
```

### Deploy to Mainnet

**⚠️ CRITICAL: Test on testnet first!**

```bash
# Deploy GuardiaVault
npm run deploy:mainnet  # (add script if needed)

# Deploy YieldVault
npx hardhat ignition deploy ignition/modules/YieldVault.ts --network mainnet --parameters '{"YieldVaultModule":{"treasury":"0xYourMultisigAddress"}}'
```

## Post-Deployment Setup

### 1. Configure YieldVault Integration

After deploying YieldVault, link it to GuardiaVault:

```bash
# Call GuardiaVault.setYieldVault(yieldVaultAddress)
# Or use frontend admin interface
```

### 2. Initialize Protocol Adapters

The adapters are automatically configured in YieldVault constructor, but verify:

- Lido adapter points to mainnet Lido: `0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84`
- Aave adapter points to mainnet Aave Pool: `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`

### 3. Set Up Keeper for Yield Updates

Configure keeper for automated yield updates:

```bash
# .env
KEEPER_PRIVATE_KEY=0x...  # Keeper wallet (separate from deployer)
KEEPER_SECRET=your-secret-for-api-auth
```

The cron job will automatically update yields every hour if `KEEPER_PRIVATE_KEY` is set.

### 4. Configure Treasury Address

Set treasury for fee collection:

```bash
# In YieldVault contract, call:
# setTreasury(0xYourTreasuryAddress)
```

## Testing the Deployment

### 1. Test GuardiaVault

```bash
npm run test:contracts
```

### 2. Test Yield Integration

1. Create a vault
2. Deposit ETH to YieldVault (Lido)
3. Wait and verify yield accumulation
4. Check cron job logs for yield updates

### 3. Test API Endpoints

```bash
# Get available strategies
curl http://localhost:5000/api/yield/strategies

# Get user positions (requires auth)
curl http://localhost:5000/api/yield/positions

# Manual yield update (admin)
curl -X POST http://localhost:5000/api/yield/update-all
```

## Troubleshooting

### Contracts Won't Compile

```bash
# Clear cache and recompile
rm -rf cache artifacts
npm run compile
```

### Deployment Fails

1. Check RPC URL is correct
2. Verify deployer wallet has ETH
3. Check contract constructor parameters
4. Review Hardhat logs for specific errors

### Yield Not Updating

1. Verify `YIELD_VAULT_ADDRESS` is set in `.env`
2. Check cron job is running: Look for "Yield calculator cron job started"
3. Verify `KEEPER_PRIVATE_KEY` if doing on-chain updates
4. Check RPC connection to blockchain

### Database Connection Issues

```bash
# Test database connection
npm run test:env-validation

# Check DATABASE_URL format
# Should be: postgresql://user:pass@host:port/db
```

## Environment Variables Reference

### Required for Local Development

```bash
NODE_ENV=development
DATABASE_URL=postgresql://guardiavault:changeme@localhost:5432/guardiavault
SESSION_SECRET=dev-secret
VITE_CHAIN_ID=31337
```

### Required for Yield Features

```bash
YIELD_VAULT_ADDRESS=0x...
LIDO_ADAPTER_ADDRESS=0x...
AAVE_ADAPTER_ADDRESS=0x...
TREASURY_ADDRESS=0x...
MAINNET_RPC_URL=https://...  # For querying protocols
```

### Optional but Recommended

```bash
KEEPER_PRIVATE_KEY=0x...  # For automated on-chain updates
SENTRY_DSN=...  # Error tracking
SENDGRID_API_KEY=...  # Email notifications
```

## Next Steps After Deployment

1. **Test Yield Accumulation**
   - Create vault with yield position
   - Monitor yield updates via cron job
   - Verify protocol queries work

2. **Set Up Monitoring**
   - Configure Sentry for error tracking
   - Set up uptime monitoring
   - Monitor cron job execution

3. **Security Audit**
   - Smart contract audit
   - Penetration testing
   - Code review

4. **Marketing**
   - Highlight yield-first value proposition
   - Build trust through security audits
   - Scale based on user feedback

## Support

For deployment issues:
- Check `docs/TROUBLESHOOTING.md`
- Review contract compilation errors
- Verify environment configuration
- Test on local network first

---

**You're ready to deploy!** The technical foundation is solid. Focus on deployment, testing, and building trust through security audits.

