# Railway DNS Resolution Fix

## Problem

Railway is using internal DNS (`fd12::10`) which fails to resolve external domains like `api.lido.fi`:

```
⚠️  DNS resolution failed for api.lido.fi
search internal railway.internal
nameserver fd12::10
getaddrinfo ENOTFOUND api.lido.fi
```

## Root Cause

Railway's internal DNS server may not have access to external domains or may be misconfigured. This affects:
- System DNS tools (`nslookup`, `curl`)
- Node.js DNS resolution (if it falls back to system DNS)

## Solutions

### 1. Node.js DNS Configuration (Already Implemented)

The Dockerfile sets:
```dockerfile
ENV NODE_OPTIONS=--dns-result-order=ipv4first
```

This tells Node.js to prefer IPv4 addresses, which should help with DNS resolution. Node.js has its own DNS resolver that should work even if system DNS fails.

### 2. Verify Node.js Can Resolve DNS

Even if `nslookup` fails, Node.js should still be able to make HTTP requests because it uses its own DNS resolver. The `getaddrinfo ENOTFOUND` error suggests Node.js is also failing, which indicates a deeper Railway network issue.

### 3. Railway-Specific Actions

**Option A: Contact Railway Support (Recommended)**

1. Go to Railway dashboard → Your service → Settings
2. Check if "Public Networking" is enabled
3. Contact Railway support about DNS resolution issues
4. Reference: Railway internal DNS (`fd12::10`) not resolving external domains

**Option B: Check Railway Network Settings**

1. Verify your Railway service has outbound internet access
2. Check Railway status page: https://status.railway.app
3. Look for any network/DNS issues reported

**Option C: Use Railway Environment Variables**

Try setting in Railway dashboard:
```
NODE_OPTIONS=--dns-result-order=ipv4first
```

(Already set in Dockerfile, but Railway may override it)

### 4. Workaround: Direct IP Resolution (Not Recommended)

As a last resort, you could resolve the IP address manually and use it, but this:
- Breaks SSL certificate validation
- Is fragile (IPs can change)
- Should only be used temporarily

## Current Status

✅ **Dockerfile configured** - DNS utilities and Node.js DNS options set
✅ **Startup script** - Tests DNS and provides diagnostics
⚠️ **Railway DNS** - Internal DNS failing (Railway infrastructure issue)

## Expected Behavior

Even if `nslookup` fails, Node.js HTTP requests should still work because:
1. Node.js uses its own DNS resolver (not system DNS)
2. `NODE_OPTIONS=--dns-result-order=ipv4first` is set
3. Node.js will try multiple DNS resolution methods

If Node.js is also failing (`getaddrinfo ENOTFOUND`), this indicates Railway's network configuration needs to be fixed at the infrastructure level.

## Next Steps

1. **Monitor the logs** - Check if actual API calls succeed despite DNS test failures
2. **Contact Railway support** - Report DNS resolution issues with Railway's internal DNS
3. **Check Railway status** - Verify there are no network outages
4. **Verify API calls work** - The app may still function if Node.js can resolve DNS even if `nslookup` fails

## Verification

After Railway fixes their DNS:

```
🌐 Testing network connectivity...
  → Testing DNS resolution for api.lido.fi...
    ✅ DNS resolution working (api.lido.fi)
  → Testing HTTPS connectivity to Lido API...
    ✅ HTTPS connection to Lido API successful
```

If you continue seeing `getaddrinfo ENOTFOUND` errors in the application (not just in startup tests), this is a Railway infrastructure issue that needs to be resolved by Railway support.

