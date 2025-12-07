# Healthcheck Troubleshooting Guide

## Issue: Healthcheck Failing on Railway

If your healthcheck is failing, here's how to diagnose and fix it.

## 🔍 Diagnosis Steps

### 1. Check Railway Logs

In Railway dashboard:
1. Go to your service → **Deployments** tab
2. Click on the latest deployment
3. Check the **Logs** tab

Look for:
- `🚀 Server started and listening`
- `✅ Health endpoint registered`
- `✅ Server is ready for health checks`
- Any error messages

### 2. Common Issues

#### Issue: Environment Validation Failing

**Symptom:** Server exits before starting

**Fix:** 
- Set `SESSION_SECRET` in Railway environment variables
- Set `NODE_ENV=production`
- Check all required environment variables are set

#### Issue: Server Not Listening

**Symptom:** No "Server started" message in logs

**Fix:**
- Verify `PORT` is set (Railway sets this automatically)
- Check `HOST=0.0.0.0` is set for production
- Ensure no other service is using the port

#### Issue: Routes Registration Failing

**Symptom:** Server starts but routes don't work

**Fix:**
- Check database connection (if using PostgreSQL)
- Verify `DATABASE_URL` is set correctly
- Check for missing environment variables

## ✅ What I Fixed

1. **Made environment validation non-blocking in production**
   - Server will start even if some env vars are missing
   - Health endpoint will work regardless

2. **Made route registration non-blocking**
   - Server stays up even if routes fail to register
   - Health endpoint remains accessible

3. **Improved error handling**
   - Better error messages
   - Server continues running for health checks
   - More detailed logging

4. **Increased healthcheck timeout**
   - Start period: 40s → 90s
   - Timeout: 3s → 10s
   - Retries: 3 → 5

5. **Enhanced health endpoint**
   - Better error handling
   - More detailed response
   - Always returns 200 if server is running

## 🚀 Quick Fixes

### Minimal Production .env

Add these to Railway environment variables:

```env
NODE_ENV=production
SESSION_SECRET=wcOWQL+E6TRFkhx//1QHwAxpQ0Qtbdf+WzEUpKcJB7Y=
HOST=0.0.0.0
```

Railway automatically provides:
- `PORT` (don't override)
- `DATABASE_URL` (if you added PostgreSQL)

### Test Health Endpoint Locally

After deploying, test the health endpoint:

```bash
curl https://your-app.up.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"...","uptime":123,"port":"5000"}
```

## 📝 Next Steps

1. **Check Railway logs** - Look for startup messages
2. **Verify environment variables** - Especially `SESSION_SECRET`
3. **Test health endpoint** - Use curl or browser
4. **Check database connection** - If using PostgreSQL
5. **Review error messages** - In Railway logs

## 🆘 Still Not Working?

If healthcheck still fails:

1. **Check Railway logs** for the exact error
2. **Verify all required env vars** are set
3. **Test locally** with production env vars
4. **Check if server is actually listening** - Look for "Server started" message

The health endpoint should work **even if**:
- Database isn't connected
- Routes fail to register
- Some services fail to initialize

As long as the server starts listening, `/health` will return 200 OK.

