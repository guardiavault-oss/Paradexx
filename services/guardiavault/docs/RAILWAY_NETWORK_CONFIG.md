# Railway Network Configuration Guide

## DNS Resolution Issues

If you're experiencing DNS resolution errors like:
```
getaddrinfo ENOTFOUND api.lido.fi
getaddrinfo ENOTFOUND aave-api-v3.aave.com
```

This guide will help you fix network connectivity issues in Railway.

## Solutions

### 1. Railway Network Settings

Railway containers should have outbound internet access by default. If DNS is failing:

1. **Check Railway Service Settings:**
   - Go to your Railway project → Service → Settings
   - Ensure "Public Networking" is enabled (if available)
   - Check that no network restrictions are applied

2. **Verify Environment Variables:**
   - Railway should automatically configure DNS
   - If issues persist, you may need to contact Railway support

### 2. Docker DNS Configuration

The Dockerfile now includes:
- DNS utilities (`bind-tools`)
- CA certificates for HTTPS
- Public DNS servers as fallback (8.8.8.8, 8.8.4.4, 1.1.1.1)

### 3. Node.js DNS Configuration

If DNS issues persist, you can configure Node.js to use specific DNS servers by setting environment variables in Railway:

```bash
# Add these to Railway environment variables:
NODE_OPTIONS=--dns-result-order=ipv4first
```

Or create a custom DNS resolver in the application code (see below).

### 4. Network Connectivity Test

The startup script (`scripts/startup.sh`) now includes network connectivity tests that will:
- Test DNS resolution for `api.lido.fi` and `aave-api-v3.aave.com`
- Test HTTPS connectivity to both APIs
- Display DNS server configuration

Check the startup logs to see if these tests pass.

### 5. Railway-Specific Fixes

If the issue persists on Railway:

1. **Rebuild the container:**
   ```bash
   # In Railway dashboard, trigger a redeploy
   ```

2. **Check Railway Status:**
   - Visit https://status.railway.app
   - Check for any network/DNS issues

3. **Contact Railway Support:**
   - If DNS resolution fails consistently
   - Railway may need to whitelist your service for outbound connections

### 6. Alternative: Use IP Addresses (Not Recommended)

As a last resort, you could hardcode IP addresses, but this is **NOT RECOMMENDED** because:
- IP addresses can change
- SSL certificates won't validate correctly
- This breaks HTTPS security

**Only use this if absolutely necessary and update regularly.**

## Verification

After deploying, check the startup logs for:

```
🌐 Testing network connectivity...
  → Testing DNS resolution for api.lido.fi...
    ✅ DNS resolution working (api.lido.fi)
  → Testing DNS resolution for aave-api-v3.aave.com...
    ✅ DNS resolution working (aave-api-v3.aave.com)
  → Testing HTTPS connectivity to Lido API...
    ✅ HTTPS connection to Lido API successful
  → Testing HTTPS connectivity to Aave API...
    ✅ HTTPS connection to Aave API successful
✅ Network connectivity check complete
```

If you see warnings or failures, the network configuration needs adjustment.

## Troubleshooting

### DNS Resolution Fails

1. Check Railway service logs for DNS errors
2. Verify Railway network settings
3. Try redeploying the service
4. Contact Railway support if issue persists

### HTTPS Connection Fails

1. Verify CA certificates are installed (they are in the Dockerfile)
2. Check if Railway has firewall rules blocking outbound HTTPS
3. Verify the API endpoints are accessible from your location
4. Check Railway status page for network issues

### Intermittent Failures

1. Add retry logic to API calls (already implemented in code)
2. Implement exponential backoff
3. Use connection pooling
4. Monitor Railway service metrics for network issues

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Status](https://status.railway.app)
- [Docker DNS Configuration](https://docs.docker.com/config/containers/container-networking/#dns-services)

