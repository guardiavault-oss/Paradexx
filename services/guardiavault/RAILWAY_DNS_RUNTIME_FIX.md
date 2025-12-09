# Railway DNS Runtime Fix

## Problem

DNS resolution is failing at **runtime** when the application tries to fetch APY data:
```
getaddrinfo ENOTFOUND api.lido.fi
getaddrinfo ENOTFOUND aave-api-v3.aave.com
```

This happens when:
- Yield calculator cron job runs
- Protocol health checks execute
- API calls are made to external services

## Root Cause

Railway's internal DNS server (`fd12::10`) cannot resolve external domains. Node.js uses the system's DNS resolver (`getaddrinfo`), which relies on Railway's DNS configuration.

## Solution Implemented

### 1. DNS Configuration at Server Startup

Added DNS configuration in `server/index.ts` to use public DNS servers:
```typescript
import dns from "dns";

const PUBLIC_DNS_SERVERS = ["8.8.8.8", "8.8.4.4", "1.1.1.1"];
dns.setServers([...PUBLIC_DNS_SERVERS, ...currentServers]);
```

This tells Node.js to try public DNS servers first before falling back to Railway's DNS.

### 2. DNS Resolver Utility

Created `server/utils/dnsResolver.ts` with utilities for:
- Resolving hostnames using public DNS servers
- Configuring DNS globally for the process

## Limitations

**Important:** `dns.setServers()` may not work if Railway's system DNS is hardcoded or overridden. Node.js's `getaddrinfo` uses the system resolver, which Railway controls.

## Next Steps (If Issue Persists)

### Option 1: Contact Railway Support (Recommended)

1. **Go to Railway Dashboard:**
   - Your project → Service → Settings
   - Check "Public Networking" is enabled

2. **Contact Railway Support:**
   - Report: "Internal DNS (`fd12::10`) cannot resolve external domains"
   - Request: Enable external DNS resolution or configure public DNS fallback
   - Reference: `getaddrinfo ENOTFOUND api.lido.fi` errors

3. **Check Railway Status:**
   - Visit https://status.railway.app
   - Look for DNS/network issues

### Option 2: Verify DNS Configuration

After redeploying with the fix, check startup logs for:
```
✅ [DNS] Configured public DNS servers as fallback: [ '8.8.8.8', '8.8.4.4', '1.1.1.1' ]
```

If you see this message, the DNS configuration was applied.

### Option 3: Test DNS Resolution

Add a test endpoint to verify DNS resolution:
```typescript
app.get("/api/test-dns", async (req, res) => {
  try {
    const dns = require("dns");
    const { promisify } = require("util");
    const lookup = promisify(dns.lookup);
    
    const lidoIp = await lookup("api.lido.fi");
    const aaveIp = await lookup("aave-api-v3.aave.com");
    
    res.json({
      success: true,
      lido: lidoIp.address,
      aave: aaveIp.address,
      dnsServers: dns.getServers()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      dnsServers: require("dns").getServers()
    });
  }
});
```

## Expected Behavior After Fix

If the DNS configuration works:
- ✅ No more `getaddrinfo ENOTFOUND` errors
- ✅ API calls to Lido and Aave succeed
- ✅ Yield calculator cron job runs successfully
- ✅ Protocol health checks pass

If errors persist:
- ⚠️ Railway's system DNS is overriding Node.js DNS settings
- ⚠️ Contact Railway support to fix DNS configuration
- ⚠️ This is an infrastructure issue, not an application issue

## Verification

After redeploying, monitor logs for:
1. DNS configuration message at startup
2. Absence of `getaddrinfo ENOTFOUND` errors
3. Successful API calls to external services

If `getaddrinfo ENOTFOUND` errors continue, this confirms Railway's DNS configuration needs to be fixed at the infrastructure level.

