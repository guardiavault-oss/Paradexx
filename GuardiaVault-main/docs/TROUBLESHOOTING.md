# Troubleshooting Guide

Common issues and solutions for GuardiaVault development and deployment.

## Port Already in Use (EADDRINUSE)

### Error:
```
Error: listen EADDRINUSE: address already in use ::1:5000
```

### Solution:

**Windows PowerShell:**
```powershell
# Find process using port 5000
Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess

# Kill the process (replace PID with actual process ID)
Stop-Process -Id <PID> -Force

# Or kill all Node processes
Get-Process node | Stop-Process -Force
```

**Alternative - Use different port:**
```bash
# In .env file
PORT=5001
```

## Missing RPC URL

### Error:
```
ERROR: No RPC URL configured
context: "YieldService.init"
```

### Solution:

**For Local Development:**
```bash
# Add to .env
SEPOLIA_RPC_URL=http://localhost:8545  # If using Hardhat node
```

**For Testnet:**
```bash
# Get free RPC URL from Alchemy or Infura
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

**Note:** YieldService will work in limited mode without RPC URL (for development only).

## Module Not Found Errors

### Error:
```
Cannot find module '.../services/yieldService.js'
```

### Solution:

**Check import paths:**
- Use relative paths: `./services/yieldService.js` (not `../services/`)
- Ensure file extensions are `.js` in imports (TypeScript compiles to `.js`)

## Database Connection Issues

### Error:
```
⚠️  DATABASE_URL not set - using in-memory storage
```

### Solution:

**For Development:**
```bash
# Optional - in-memory storage works for testing
# Or add to .env:
DATABASE_URL=postgresql://user:pass@localhost:5432/guardiavault
```

**For Production:**
- Required - set up PostgreSQL database
- See `docs/PRODUCTION_ENVIRONMENT_SETUP.md`

## Missing Environment Variables

### Warning:
```
⚠️  SESSION_SECRET is not set (optional)
⚠️  ENCRYPTION_KEY is not set (optional)
```

### Solution:

**For Development:**
- These are optional but recommended
- Generate secrets for production:
```bash
# Generate secure random strings
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Contract Compilation Errors

### Error:
```
Compilation failed...
```

### Solution:

1. **Clear cache:**
```bash
rm -rf cache artifacts
npm run compile
```

2. **Check Solidity version:**
- Ensure all contracts use compatible versions
- Check `hardhat.config.cjs` for version settings

3. **Check imports:**
- Verify all import paths are correct
- Ensure OpenZeppelin contracts are installed

## Test Failures

### Error:
```
Tests failing...
```

### Solution:

1. **Run specific test:**
```bash
npm run test:contracts -- --grep "test name"
```

2. **Check test setup:**
- Ensure Hardhat node is running (if needed)
- Verify test accounts have funds

## Frontend Connection Issues

### Error:
```
Cannot connect to backend...
```

### Solution:

1. **Check server is running:**
```bash
curl http://localhost:5000/api/health
```

2. **Check CORS settings:**
- Verify `ALLOWED_ORIGINS` in `.env`
- Check browser console for CORS errors

3. **Check wallet connection:**
- Ensure MetaMask is connected
- Verify network is correct (localhost:8545 for local)

## Yield Service Issues

### Error:
```
YieldService: No RPC URL configured
```

### Solution:

**Development Mode (No RPC):**
- Service works in limited mode
- Mock data returned for strategies
- Won't update on-chain yields

**Production Mode (RPC Required):**
```bash
# Add to .env
SEPOLIA_RPC_URL=...  # For testnet
MAINNET_RPC_URL=...  # For mainnet
YIELD_VAULT_ADDRESS=0x...  # Deployed contract address
```

## Quick Fixes

### Restart Everything:
```bash
# Kill all Node processes
Get-Process node | Stop-Process -Force  # Windows
# pkill -f node  # Linux/Mac

# Restart
npm run dev
```

### Clear All Caches:
```bash
# Clear npm cache
npm cache clean --force

# Clear Hardhat cache
rm -rf cache artifacts

# Reinstall dependencies (if needed)
rm -rf node_modules
npm install
```

### Reset Environment:
```bash
# Copy fresh env.example
cp env.example .env

# Add required values
# Test with: npm run test:env-validation
```

## Getting Help

1. **Check logs:**
   - Server logs show detailed error messages
   - Check browser console for frontend errors
   - Check Hardhat node output for contract errors

2. **Verify setup:**
   ```bash
   npm run verify:security  # Check security fixes
   npm run compile          # Check compilation
   npm run test:contracts   # Check tests
   ```

3. **Review documentation:**
   - `docs/QUICK_START.md` - Basic setup
   - `docs/TESTNET_DEPLOYMENT.md` - Deployment guide
   - `docs/VERIFICATION_CHECKLIST.md` - Pre-deployment checklist

---

**Most issues are resolved by:**
1. Clearing port 5000
2. Setting required environment variables
3. Recompiling contracts
4. Restarting the server






