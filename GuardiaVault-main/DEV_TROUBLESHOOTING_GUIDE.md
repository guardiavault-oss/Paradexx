# Development Mode Troubleshooting Guide

**Date:** November 7, 2025  
**Purpose:** Debug authentication and routing issues in development mode

---

## 🚀 Starting Development Server

### Step 1: Free Port 5000 (if already in use)

**Windows PowerShell:**
```powershell
# Find and kill process on port 5000
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | 
  Select-Object -ExpandProperty OwningProcess | 
  ForEach-Object { Stop-Process -Id $_ -Force }
```

**Or use Task Manager:**
1. Open Task Manager (Ctrl + Shift + Esc)
2. Find process using port 5000
3. End task

### Step 2: Start Development Server

```bash
npm run dev
# or
pnpm run dev
```

**Expected Output:**
```
✅ [SERVER] Listening on 0.0.0.0:5000 (env=development)
✅ [ROUTES] Routes registered
✅ Development debug routes registered
```

---

## 🔧 Development Debug Endpoints

These endpoints are **only available in development mode**:

### 1. List All Routes
**GET** `/api/dev/routes`

Shows all registered API routes for debugging.

**Example:**
```bash
curl http://localhost:5000/api/dev/routes
```

**Response:**
```json
{
  "success": true,
  "total": 45,
  "routes": [
    { "method": "POST", "path": "/api/auth/login" },
    { "method": "GET", "path": "/api/auth/me" },
    ...
  ]
}
```

### 2. Check Storage Status
**GET** `/api/dev/storage`

Shows storage type and user information.

**Example:**
```bash
curl http://localhost:5000/api/dev/storage
```

**Response:**
```json
{
  "success": true,
  "storage": {
    "type": "MemStorage",
    "hasDatabase": false,
    "userCount": 1,
    "users": [
      {
        "id": "...",
        "email": "demo@guardiavault.com",
        "hasPassword": true,
        "passwordHashFormat": "$2b$10$..."
      }
    ]
  }
}
```

### 3. Check Session Status
**GET** `/api/dev/session`

Shows current session information.

**Example:**
```bash
curl http://localhost:5000/api/dev/session
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "session-id-here",
    "exists": true,
    "userId": "user-id-here",
    "hasCookies": true,
    "cookieHeader": "present"
  }
}
```

### 4. Create Test User
**POST** `/api/dev/create-test-user`

Creates a test user for development.

**Example:**
```bash
curl -X POST http://localhost:5000/api/dev/create-test-user \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!@#"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Test user created",
  "user": {
    "id": "...",
    "email": "test@example.com"
  },
  "credentials": {
    "email": "test@example.com",
    "password": "Test123!@#"
  }
}
```

### 5. Test Login (Detailed Debug)
**POST** `/api/dev/test-login`

Tests login with detailed debugging information.

**Example:**
```bash
curl -X POST http://localhost:5000/api/dev/test-login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!@#"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Password matches",
  "debug": {
    "userFound": true,
    "userId": "...",
    "email": "test@example.com",
    "passwordHashFormat": "$2b$10$...",
    "isValidHashFormat": true,
    "passwordLength": 11,
    "originalPasswordLength": 11,
    "hadWhitespace": false,
    "passwordMatch": true,
    "passwordMatchWithoutTrim": false,
    "comparisonError": null
  }
}
```

---

## 🐛 Troubleshooting Common Issues

### Issue 1: Port 5000 Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:5000
```

**Fix:**
```powershell
# Windows PowerShell
Get-NetTCPConnection -LocalPort 5000 | 
  Select-Object -ExpandProperty OwningProcess | 
  ForEach-Object { Stop-Process -Id $_ -Force }
```

**Or change port:**
```bash
PORT=5001 npm run dev
```

### Issue 2: 404 Errors on API Routes

**Symptoms:**
- `GET /api/auth/me` returns 404
- `GET /api/subscriptions/status` returns 404

**Debug Steps:**

1. **Check if routes are registered:**
   ```bash
   curl http://localhost:5000/api/dev/routes
   ```
   Look for the routes in the list.

2. **Check server logs:**
   - Look for `[ROUTES] Routes registered`
   - Check for any route registration errors

3. **Verify route order:**
   - Routes should be registered before Vite middleware
   - Check `server/index.ts` for middleware order

### Issue 3: 401 Errors on Login

**Symptoms:**
- `POST /api/auth/login` returns 401
- "Invalid email or password" error

**Debug Steps:**

1. **Check if user exists:**
   ```bash
   curl http://localhost:5000/api/dev/storage
   ```

2. **Test login with debug endpoint:**
   ```bash
   curl -X POST http://localhost:5000/api/dev/test-login \
     -H "Content-Type: application/json" \
     -d '{"email": "your-email", "password": "your-password"}'
   ```
   This will show detailed password comparison info.

3. **Check server logs:**
   - Look for `[DEBUG]` messages about password comparison
   - Check for `Password comparison failed` warnings

4. **Create test user:**
   ```bash
   curl -X POST http://localhost:5000/api/dev/create-test-user \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "Test123!@#"}'
   ```
   Then try logging in with these credentials.

### Issue 4: Session Not Working

**Symptoms:**
- Login succeeds but `/api/auth/me` returns 401
- Session not persisting

**Debug Steps:**

1. **Check session status:**
   ```bash
   curl http://localhost:5000/api/dev/session
   ```

2. **Check cookies:**
   - DevTools → Application → Cookies
   - Should see `guardiavault.sid` cookie
   - Check if cookie is being sent with requests

3. **Check server logs:**
   - Look for session save errors
   - Check for cookie configuration issues

---

## 📊 Server Logs in Development

Development mode uses **debug-level logging**. You'll see:

### Login Attempt Logs:
```
[DEBUG] Login route hit
[DEBUG] Login attempt { email: "user@example.com" }
[DEBUG] Normalized auth inputs { email: "user@example.com", ... }
[DEBUG] Looking up user by email { email: "user@example.com" }
[DEBUG] User found { userId: "...", email: "user@example.com" }
[DEBUG] Comparing password { userId: "...", passwordLength: 11, ... }
[INFO] Login successful { userId: "...", email: "user@example.com" }
```

### Password Mismatch Logs:
```
[WARN] Password comparison failed {
  userId: "...",
  email: "user@example.com",
  passwordLength: 11,
  hashedPasswordValid: true,
  hashPrefix: "$2b$10$..."
}
```

### Route Registration Logs:
```
[INFO] Registering routes
[DEBUG] Storage type { storageType: "MemStorage" }
[INFO] Development debug routes registered
```

---

## 🧪 Testing Authentication Flow

### Step 1: Check Demo Account

If using in-memory storage, demo account should exist:

```bash
# Check storage
curl http://localhost:5000/api/dev/storage

# Should show demo user
```

**Demo Credentials:**
- Email: `demo@guardiavault.com`
- Password: `Demo123!@#` (if DEMO_PASSWORD not set, check server logs)

### Step 2: Test Login

```bash
# Test login with debug endpoint
curl -X POST http://localhost:5000/api/dev/test-login \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@guardiavault.com", "password": "Demo123!@#"}'
```

### Step 3: Create Test User (if needed)

```bash
curl -X POST http://localhost:5000/api/dev/create-test-user \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!@#"}'
```

### Step 4: Test Actual Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "test@example.com", "password": "Test123!@#"}'
```

### Step 5: Check Session

```bash
# Use cookies from previous request
curl http://localhost:5000/api/auth/me \
  -b cookies.txt
```

---

## 🔍 Debugging Checklist

When troubleshooting authentication:

- [ ] Server is running on port 5000
- [ ] Routes are registered (check `/api/dev/routes`)
- [ ] User exists (check `/api/dev/storage`)
- [ ] Password hash format is valid (check test-login response)
- [ ] Session is created (check `/api/dev/session`)
- [ ] Cookies are being sent (check DevTools → Network)
- [ ] Server logs show detailed debug info

---

## 📚 Related Documentation

- `AUTH_FIXES.md` - Authentication fixes applied
- `server/routes-dev-debug.ts` - Dev debug routes source
- `server/services/logger.ts` - Logging configuration

---

## ✅ Quick Commands

```bash
# Start dev server
npm run dev

# Check routes
curl http://localhost:5000/api/dev/routes

# Check storage
curl http://localhost:5000/api/dev/storage

# Check session
curl http://localhost:5000/api/dev/session

# Create test user
curl -X POST http://localhost:5000/api/dev/create-test-user \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!@#"}'

# Test login
curl -X POST http://localhost:5000/api/dev/test-login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!@#"}'
```

---

**All development debug tools are now available! Use these endpoints to troubleshoot authentication issues.**

