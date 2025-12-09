# Testnet Deployment Guide

Complete guide for deploying and testing contracts on Sepolia testnet.

## Prerequisites

1. **Testnet ETH**: Get Sepolia ETH from a faucet
   - https://sepoliafaucet.com/
   - https://www.alchemy.com/faucets/ethereum-sepolia
   - https://faucet.quicknode.com/ethereum/sepolia

2. **Environment Setup**:
   ```bash
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   PRIVATE_KEY=0x...  # Your deployer wallet private key
   ETHERSCAN_API_KEY=...  # For contract verification
   ```

3. **Deployer Wallet**: Fund with ~0.1 Sepolia ETH (for gas)

## Step 1: Verify Security Fixes

Before deploying, verify all security fixes:

```bash
npm run verify:security
```

Expected output:
```
✅ All security fixes verified successfully!
```

## Step 2: Compile Contracts

```bash
npm run compile
```

Verify no compilation errors.

## Step 3: Run Contract Tests

```bash
npm run test:contracts
```

All tests should pass.

## Step 4: Deploy to Sepolia

### Deploy GuardiaVault

```bash
npm run deploy:sepolia
```

**Expected Output:**
```
✅ GuardiaVault deployed!
   Address: 0x...
   TX Hash: 0x...
```

Save the contract address.

### Deploy YieldVault

```bash
npm run deploy:yield:sepolia
```

**Or with custom treasury:**

```bash
npx hardhat ignition deploy ignition/modules/YieldVault.ts --network sepolia --parameters '{"YieldVaultModule":{"treasury":"0xYourTreasuryAddress"}}'
```

**Expected Output:**
```
✅ YieldVault deployed!
   Address: 0x...
   LidoAdapter: 0x...
   AaveAdapter: 0x...
```

Save all contract addresses.

## Step 5: Update Environment Variables

Add to `.env`:
```bash
# Sepolia Testnet
VITE_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
VITE_GUARDIA_VAULT_ADDRESS=0x...  # From deployment
YIELD_VAULT_ADDRESS=0x...  # From deployment
LIDO_ADAPTER_ADDRESS=0x...  # From deployment
AAVE_ADAPTER_ADDRESS=0x...  # From deployment
```

## Step 6: Verify Contracts on Etherscan

After deployment:

```bash
# Verify GuardiaVault
npx hardhat verify --network sepolia CONTRACT_ADDRESS

# Verify YieldVault
npx hardhat verify --network sepolia YIELD_VAULT_ADDRESS "TREASURY_ADDRESS"
```

## Step 7: Test Contracts on Testnet

### Test 1: Create a Vault

1. Connect wallet to Sepolia
2. Visit your frontend (configured for Sepolia)
3. Create a vault
4. Verify transaction on Etherscan

### Test 2: Create Yield Position

1. Navigate to Yield Vaults
2. Create position with test ETH
3. Verify staking works
4. Check contract state on Etherscan

### Test 3: Yield Calculation

1. Wait for yield to accumulate
2. Trigger manual yield update (via API or keeper)
3. Verify yield recorded on-chain
4. Check fee collection

### Test 4: Guardian System

1. Add guardians to vault
2. Test guardian attestation
3. Verify 2-of-3 recovery works

### Test 5: Recovery Flow

1. Simulate inactivity
2. Test guardian recovery
3. Test beneficiary claim
4. Verify funds distribution

## Step 8: Monitor and Verify

### Check Contract State

Use Etherscan to verify:
- ✅ Contract code verified
- ✅ State variables correct
- ✅ Events emitted correctly
- ✅ Transactions successful

### Monitor for Issues

- Check transaction gas costs
- Verify yield accumulation
- Monitor for unexpected reverts
- Check error logs

## Step 9: Load Testing

Test with multiple users:
1. Create multiple vaults
2. Test concurrent operations
3. Verify no race conditions
4. Check gas optimization

## Troubleshooting

### Issue: "Insufficient funds"

**Fix:** Get more Sepolia ETH from faucet

### Issue: "Contract verification failed"

**Fix:** 
- Ensure constructor arguments are correct
- Check contract was deployed correctly
- Try verifying again after 5 blocks

### Issue: "RPC rate limit"

**Fix:**
- Use your own Alchemy/Infura endpoint
- Increase rate limit in provider settings

### Issue: "Transaction reverted"

**Fix:**
- Check gas limit is sufficient
- Verify contract state allows operation
- Check error message in Etherscan

## Success Criteria

Your testnet deployment is successful when:

✅ All contracts deployed  
✅ Contracts verified on Etherscan  
✅ Basic operations work (create vault, stake)  
✅ Yield accumulates correctly  
✅ Guardian system works  
✅ Recovery flow tested  
✅ No critical errors or reverts  

## Next Steps After Testnet Success

1. **Document Findings**
   - Gas costs
   - Any issues found
   - Performance metrics

2. **Fix Issues**
   - Address any bugs found
   - Optimize gas if needed
   - Improve error messages

3. **Prepare for Mainnet**
   - Final security audit
   - Legal review
   - Insurance consideration
   - Marketing materials

---

**Ready for mainnet when testnet testing is successful!**

