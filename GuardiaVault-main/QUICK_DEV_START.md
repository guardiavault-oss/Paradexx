# Quick Development Start Guide

**For troubleshooting authentication issues in development mode**

---

## ✅ Port 5000 Fixed

The process using port 5000 has been killed. You can now start the server.

---

## 🚀 Start Development Server

```bash
npm run dev
# or
pnpm run dev
```

---

## 🔧 Development Debug Tools Available

Once the server is running, use these endpoints to troubleshoot:

### 1. Check All Routes
```bash
curl http://localhost:5000/api/dev/routes
```
Shows all registered API routes.

### 2. Check Storage & Users
```bash
curl http://localhost:5000/api/dev/storage
```
Shows storage type and existing users.

### 3. Check Session
```bash
curl http://localhost:5000/api/dev/session
```
Shows current session status.

### 4. Create Test User
```bash
curl -X POST http://localhost:5000/api/dev/create-test-user \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!@#"}'
```

### 5. Test Login (Detailed Debug)
```bash
curl -X POST http://localhost:5000/api/dev/test-login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!@#"}'
```
Shows detailed password comparison info.

---

## 🐛 Troubleshooting Your Issues

### Issue: 404 on `/api/auth/me` and `/api/subscriptions/status`

**Check:**
```bash
# 1. Verify routes are registered
curl http://localhost:5000/api/dev/routes | grep "auth/me"
curl http://localhost:5000/api/dev/routes | grep "subscriptions/status"
```

**If routes are missing:**
- Check server logs for route registration errors
- Verify server started successfully

### Issue: 401 on Login with "Invalid email or password"

**Debug:**
```bash
# 1. Check if user exists
curl http://localhost:5000/api/dev/storage

# 2. Test login with detailed debug
curl -X POST http://localhost:5000/api/dev/test-login \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email", "password": "your-password"}'

# 3. Check server logs for password comparison details
```

**Common Causes:**
- User doesn't exist (create with `/api/dev/create-test-user`)
- Password hash format invalid (check test-login response)
- Password has whitespace (system handles this automatically)
- Case sensitivity (email is normalized, password is case-sensitive)

---

## 📊 What to Check in Server Logs

When you start the server, look for:

```
✅ [ROUTES] Routes registered
✅ Development debug routes registered
[DEBUG] Login route hit
[DEBUG] User found
[DEBUG] Comparing password
[INFO] Login successful
```

If you see errors, they'll be logged with context.

---

## 🎯 Next Steps

1. **Start server:** `npm run dev`
2. **Check routes:** `curl http://localhost:5000/api/dev/routes`
3. **Check storage:** `curl http://localhost:5000/api/dev/storage`
4. **Test login:** Use `/api/dev/test-login` for detailed debugging
5. **Check logs:** Watch server console for debug messages

---

**All development debug tools are ready! Start the server and use the debug endpoints to troubleshoot.**

