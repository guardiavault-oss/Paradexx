# GuardiaVault Sepolia Deployment Summary

**Deployment Date:** 2025-11-04
**Network:** Sepolia Testnet (Chain ID: 11155111)
**Deployer Address:** 0x774876375C50636CDcf2879863C3F5AEB29AF9E1

---

## 📋 Deployed Contracts

### 1. GuardiaVault (Main Contract)
- **Address:** `0x3D853c85Df825EA3CEd26040Cba0341778eAA891`
- **Purpose:** Core vault contract for digital asset management and guardian-based recovery
- **Etherscan:** https://sepolia.etherscan.io/address/0x3D853c85Df825EA3CEd26040Cba0341778eAA891

### 2. YieldVault
- **Address:** `0xe63b2eaaE33fbe61C887235668ec0705bCFb463e`
- **Purpose:** Yield generation vault with Lido and Aave protocol adapters
- **Etherscan:** https://sepolia.etherscan.io/address/0xe63b2eaaE33fbe61C887235668ec0705bCFb463e

### 3. LifetimeAccess
- **Address:** `0x01eFA1b345f806cC847aa434FC99c255CDc02Da1`
- **Purpose:** Lifetime subscription payment contract (Solo Guardian, Family Vault, Legacy Pro)
- **Etherscan:** https://sepolia.etherscan.io/address/0x01eFA1b345f806cC847aa434FC99c255CDc02Da1

---

## 🔍 Contract Verification Commands

To verify contracts on Etherscan (optional):

```bash
# Verify GuardiaVault
npx hardhat verify --network sepolia 0x3D853c85Df825EA3CEd26040Cba0341778eAA891

# Verify YieldVault
npx hardhat verify --network sepolia 0xe63b2eaaE33fbe61C887235668ec0705bCFb463e

# Verify LifetimeAccess
npx hardhat verify --network sepolia 0x01eFA1b345f806cC847aa434FC99c255CDc02Da1
```

---

## ✅ Environment Variables Updated

The following variables have been configured in `.env`:

```bash
# Main Contracts
VITE_GUARDIA_VAULT_ADDRESS=0x3D853c85Df825EA3CEd26040Cba0341778eAA891
YIELD_VAULT_ADDRESS=0xe63b2eaaE33fbe61C887235668ec0705bCFb463e
VITE_LIFETIME_ACCESS_ADDRESS=0x01eFA1b345f806cC847aa434FC99c255CDc02Da1

# Network Configuration
VITE_CHAIN_ID=11155111
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY_HERE
```

---

## 🚀 Next Steps

### 1. Start the Application
```bash
cd client
npm run dev
```

Your frontend will now connect to the deployed Sepolia contracts.

### 2. Test Contract Interactions

Visit your application and test:
- ✅ Wallet connection (MetaMask on Sepolia network)
- ✅ GuardiaVault functions (add guardians, create vault)
- ✅ LifetimeAccess purchases
- ✅ YieldVault deposits (if integrated)

### 3. Add Sepolia Network to MetaMask

If not already added:
- **Network Name:** Sepolia Test Network
- **RPC URL:** https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY_HERE
- **Chain ID:** 11155111
- **Currency Symbol:** ETH
- **Block Explorer:** https://sepolia.etherscan.io

### 4. Get Test ETH

If you need more Sepolia ETH for testing:
- https://sepoliafaucet.com
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://cloud.google.com/application/web3/faucet/ethereum/sepolia

---

## 📊 Deployment Statistics

- **Total Contracts Deployed:** 3
- **Gas Used:** ~5-10M gas total (varies by deployment)
- **Deployment Cost:** ~0.01-0.05 SepoliaETH
- **Remaining Balance:** 0.594 SepoliaETH

---

## ⚠️ Important Notes

1. **Never commit your private key** - The `.env` file is gitignored
2. **Sepolia is a testnet** - Funds have no real value
3. **Contract addresses are permanent** - Save this document for reference
4. **Backend integration** - Ensure your backend uses these contract addresses
5. **Frontend configuration** - Vite will pick up VITE_* variables automatically

---

## 🔗 Quick Links

- **GuardiaVault Contract:** https://sepolia.etherscan.io/address/0x3D853c85Df825EA3CEd26040Cba0341778eAA891
- **YieldVault Contract:** https://sepolia.etherscan.io/address/0xe63b2eaaE33fbe61C887235668ec0705bCFb463e
- **LifetimeAccess Contract:** https://sepolia.etherscan.io/address/0x01eFA1b345f806cC847aa434FC99c255CDc02Da1
- **Your Deployer Wallet:** https://sepolia.etherscan.io/address/0x774876375C50636CDcf2879863C3F5AEB29AF9E1
- **Sepolia Explorer:** https://sepolia.etherscan.io

---

## 🎉 Success!

All contracts have been successfully deployed to Sepolia testnet and are ready for testing!
