# Quick Start Guide

Get GuardiaVault up and running in 5 minutes!

## 1. Compile Contracts

```bash
npm run compile
```

✅ Compiles all Solidity contracts (GuardiaVault, YieldVault, adapters)

## 2. Start Local Blockchain

Open a new terminal:

```bash
npm run node:local
```

✅ Starts Hardhat node at `http://localhost:8545`  
✅ Pre-funded test accounts (10,000 ETH each)  
✅ Keep this terminal running

## 3. Deploy Contracts Locally

In your original terminal:

**Deploy GuardiaVault:**
```bash
npm run deploy:local
```

**Deploy YieldVault (with Lido & Aave adapters):**
```bash
npm run deploy:yield:local
```

Or deploy both at once:
```bash
npm run deploy:local && npm run deploy:yield:local
```

✅ Contracts deployed to local blockchain  
✅ Note the addresses printed (add to `.env`)

## 4. Update Environment Variables

Copy contract addresses from deployment output to `.env`:

```bash
# GuardiaVault (from deploy:local)
VITE_GUARDIA_VAULT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# YieldVault (from deploy:yield:local)
YIELD_VAULT_ADDRESS=0x...
LIDO_ADAPTER_ADDRESS=0x...
AAVE_ADAPTER_ADDRESS=0x...

# Network
VITE_CHAIN_ID=31337
```

## 5. Start Development Server

```bash
npm run dev
```

✅ Server starts on `http://localhost:5000`  
✅ Auto-connects to local Hardhat node  
✅ Yield calculation cron job initialized

## 6. Create Your First Vault!

1. Visit `http://localhost:5000`
2. Connect wallet (MetaMask → Add Network → Localhost 8545)
3. Click "Create Vault"
4. Add yield position (Lido ETH staking or Aave lending)
5. Watch yield accumulate! 📈

## Troubleshooting

**Contracts won't compile?**
```bash
rm -rf cache artifacts
npm run compile
```

**Can't connect to Hardhat node?**
- Make sure `npm run node:local` is running
- Check MetaMask is configured for `localhost:8545`
- Chain ID should be `31337`

**Yield not updating?**
- Check `.env` has `YIELD_VAULT_ADDRESS`
- Look for "Yield calculator cron job started" in server logs
- Cron runs every hour automatically

## Next Steps

- 📖 Read [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions
- 🧪 Run tests: `npm run test:contracts`
- 🌐 Deploy to Sepolia testnet: `npm run deploy:sepolia`
- 🔒 Review security: `npm run audit:security`

---

**You're ready to deploy!** The technical foundation is solid. Focus on deployment, testing, and building trust through security audits.

