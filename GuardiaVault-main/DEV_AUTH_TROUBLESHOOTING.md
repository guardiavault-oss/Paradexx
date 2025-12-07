# Development Authentication Troubleshooting Guide

## Quick Start

The server is running with in-memory storage (database connection failed, which is expected in dev without a DB).

## Debug Routes Available

All routes are prefixed with `/api/dev/` and **bypass CSRF validation in development mode**.

### 1. Check Storage Status
```bash
curl http://localhost:5000/api/dev/storage
```

This shows:
- Storage type (MemStorage or Database)
- User count
- List of users (up to 5)

### 2. Check Session Status
```bash
curl http://localhost:5000/api/dev/session
```

This shows:
- Current session ID
- Whether session exists
- User ID (if logged in)
- Cookie status

### 3. Create Test User
```bash
curl -X POST http://localhost:5000/api/dev/create-test-user \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test@example.com\", \"password\": \"Test123!@#\"}"
```

**Note**: In PowerShell, use this format:
```powershell
$body = @{email="test@example.com"; password="Test123!@#"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/dev/create-test-user" -Method POST -Body $body -ContentType "application/json"
```

### 4. Test Password Comparison
```bash
curl -X POST http://localhost:5000/api/dev/test-login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test@example.com\", \"password\": \"Test123!@#\"}"
```

**PowerShell format**:
```powershell
$body = @{email="test@example.com"; password="Test123!@#"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/dev/test-login" -Method POST -Body $body -ContentType "application/json"
```

This returns detailed debugging info:
- Whether user was found
- Password hash format
- Password length (trimmed and original)
- Whether password matches (with and without trim)
- Any comparison errors

### 5. List All Routes
```bash
curl http://localhost:5000/api/dev/routes
```

## Troubleshooting Steps

### Step 1: Check if user exists
```bash
curl http://localhost:5000/api/dev/storage
```

### Step 2: If user doesn't exist, create one
```bash
# Use PowerShell format above or curl
```

### Step 3: Test password comparison
```bash
# Use the test-login endpoint with the exact password you're trying
```

### Step 4: Check the debug output
The `test-login` endpoint will show:
- `passwordMatch`: true/false (with trimmed password)
- `passwordMatchWithoutTrim`: true/false (with original password)
- `passwordHashFormat`: First 10 chars of hash
- `isValidHashFormat`: Whether hash starts with $2b$, $2a$, or $2y$
- `passwordLength`: Length of trimmed password
- `originalPasswordLength`: Length of original password
- `hadWhitespace`: Whether password had leading/trailing whitespace

### Step 5: Try actual login
Once you've verified the password works with `test-login`, try the actual login endpoint:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test@example.com\", \"password\": \"Test123!@#\"}" \
  -c cookies.txt
```

## Common Issues

### Issue: "User not found"
- **Solution**: Create the user first using `/api/dev/create-test-user`

### Issue: "Password does not match"
- Check the `test-login` debug output:
  - If `passwordMatch` is false but `passwordMatchWithoutTrim` is true, the password has whitespace issues
  - If both are false, the password is incorrect
  - If `isValidHashFormat` is false, the password hash is corrupted

### Issue: "Invalid hash format"
- The password hash in storage is not a valid bcrypt hash
- Recreate the user with `/api/dev/create-test-user`

## Server Logs

The server logs will show detailed information about:
- Password comparison attempts
- Hash format validation
- User lookup results
- Any errors during the process

Look for log entries with context `"login"` or `"dev-test-login"`.

