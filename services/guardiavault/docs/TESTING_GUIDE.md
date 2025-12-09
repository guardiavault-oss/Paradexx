# Testing Guide - Post-Deployment

Now that your contracts are deployed and the server is running, here's what to test:

## ✅ Immediate Testing (Do This Now)

### 1. Verify Server is Running

Open browser: http://localhost:5000

**Check:**
- [ ] Page loads without errors
- [ ] No console errors in browser DevTools
- [ ] Wallet connection works (MetaMask)

### 2. Test Vault Creation Flow

**Path:** Dashboard → "Create Yield Vault" or `/create-vault`

**Steps:**
1. Connect wallet (MetaMask should prompt)
2. Fill in vault creation form
3. Submit transaction
4. Wait for confirmation

**Verify:**
- [ ] Transaction appears in MetaMask
- [ ] Transaction confirms on blockchain
- [ ] Vault appears in dashboard
- [ ] Contract address is correct

### 3. Test Yield Vault Creation

**Path:** `/yield-vaults` or from Dashboard

**Steps:**
1. Select asset (ETH for Lido, USDC/USDT for Aave)
2. Enter amount (e.g., 0.1 ETH or 100 USDC)
3. Select protocol (Lido or Aave)
4. Create vault

**Verify:**
- [ ] Funds staked successfully
- [ ] Yield vault created in contract
- [ ] Position appears in "My Positions"
- [ ] APY estimate displays correctly

### 4. Verify Backend Services

**API Health Check:**
```bash
curl http://localhost:5000/api/health
```

**Yield API:**
```bash
curl http://localhost:5000/api/yield/strategies
```

**Verify:**
- [ ] Health endpoint returns OK
- [ ] Strategies endpoint returns Lido & Aave
- [ ] Server logs show no errors

### 5. Test Yield Calculation

**Manual Trigger (for testing):**
```bash
curl -X POST http://localhost:5000/api/yield/update-all
```

**Verify:**
- [ ] Endpoint responds successfully
- [ ] Server logs show yield calculation
- [ ] No errors in logs

**Automatic (wait 1 hour):**
- [ ] Cron job runs automatically
- [ ] Logs show "Yield calculation cycle completed"
- [ ] Yield updates in vault

## 🔍 Deep Testing

### Frontend → Contract Integration

1. **Check Contract Addresses:**
   - [ ] `VITE_GUARDIA_VAULT_ADDRESS` in `.env` matches deployed address
   - [ ] `YIELD_VAULT_ADDRESS` in `.env` matches deployed address
   - [ ] Frontend reads addresses correctly

2. **Test Wallet Interactions:**
   - [ ] Transactions sign correctly
   - [ ] Gas estimates reasonable
   - [ ] Transaction confirmations appear
   - [ ] Error handling works (reject, insufficient funds, etc.)

### Backend → Contract Integration

1. **Test Yield Service:**
   ```bash
   # Check service initialization
   # Look for "YieldService initialized" in server logs
   ```

2. **Test Contract Reads:**
   - [ ] Can query vault data
   - [ ] APY estimates returned
   - [ ] Balance queries work

3. **Test Contract Writes (with KEEPER_PRIVATE_KEY):**
   - [ ] Yield updates write to contract
   - [ ] Transactions confirm
   - [ ] Events emitted correctly

### Database Integration

1. **Verify Storage:**
   - [ ] Vaults saved to database
   - [ ] Yield positions tracked
   - [ ] Guardian data persisted

2. **Test Queries:**
   - [ ] `/api/vaults` returns user vaults
   - [ ] `/api/yield/positions` returns positions
   - [ ] Data matches contract state

## 🐛 Common Issues & Fixes

### Issue: "Cannot read property 'getAddress' of undefined"

**Fix:** Contract address not in `.env`
```bash
# Add to .env
VITE_GUARDIA_VAULT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
YIELD_VAULT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Issue: "Network error" or RPC errors

**Fix:** Hardhat node not running
```bash
# Start in new terminal
npm run node:local
```

### Issue: "Insufficient funds"

**Fix:** Import Hardhat test account to MetaMask
- Account #0: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Private key in Hardhat output

### Issue: Yield not updating

**Fix:** Check cron job logs
- Look for "Yield calculator cron job started"
- Check `KEEPER_PRIVATE_KEY` is set if doing on-chain updates
- Verify RPC connection

## 📊 Success Criteria

Your deployment is working if:

✅ **Frontend:**
- Vault creation works
- Wallet connects
- Transactions confirm
- Dashboard shows vaults

✅ **Backend:**
- API responds
- Database saves data
- Cron job runs (check logs)
- Yield service initialized

✅ **Contracts:**
- Transactions succeed
- Events emitted
- State updated correctly
- Yield accumulates

## 🚀 Next Steps After Testing

Once basic testing passes:

1. **Test Guardian System:**
   - Add guardians
   - Test 2-of-3 recovery
   - Verify attestations

2. **Test Beneficiary Flow:**
   - Add beneficiaries
   - Test claim process
   - Verify inheritance flow

3. **Test Yield Accumulation:**
   - Wait for yield to accumulate
   - Verify yield calculation
   - Check fee collection

4. **Security Audit:**
   - Review contract code
   - Test edge cases
   - Check for vulnerabilities

5. **Performance Testing:**
   - Load test API
   - Test with many vaults
   - Monitor gas costs

## 📝 Testing Checklist

Copy this and check off as you test:

```
FRONTEND
[ ] Dashboard loads
[ ] Wallet connection works
[ ] Vault creation flow
[ ] Yield vault creation
[ ] Transaction signing
[ ] Error handling

BACKEND
[ ] Server starts
[ ] Health endpoint works
[ ] API endpoints respond
[ ] Database connection
[ ] Cron job running

CONTRACTS
[ ] GuardiaVault deployed
[ ] YieldVault deployed
[ ] Transactions succeed
[ ] Events emitted
[ ] State reads work

INTEGRATION
[ ] Frontend → Contract
[ ] Backend → Contract
[ ] Frontend → Backend
[ ] Database persistence
[ ] Yield calculation
```

---

**Start with the immediate testing section above!** Visit http://localhost:5000 and create your first vault.

