# Complete Vault Test Instructions

## ✅ Current Status

- ✅ Database: **CONNECTED**
- ✅ Vault Logic: **PASSED**
- ⚠️  API Tests: **NEED AUTH TOKEN**

## 🚀 Quick Test (3 Steps)

### Step 1: Start Backend Server

```powershell
cd src/backend
npm run dev
```

Keep this running in one terminal.

### Step 2: Get Auth Token (New Terminal)

```powershell
cd src/backend

# Register and login
curl -X POST http://localhost:3001/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"displayName\":\"Test User\"}'

curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\"}'
```

**Copy the `accessToken` from the login response.**

### Step 3: Run Full Test

```powershell
# Set token and run test
$env:TEST_ACCESS_TOKEN="your_token_here"
npm run test:vault:complete
```

## 🎯 Expected Results

After getting the token, you should see:

```
✅ Vault Logic: PASSED
✅ Database: CONNECTED
✅ Guardian API: WORKING
✅ Recovery API: WORKING
✅ Beneficiary API: WORKING
```

## 📋 Manual API Test

If you want to test APIs manually:

### 1. Add Guardian
```powershell
curl -X POST http://localhost:3001/api/guardians `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{\"email\":\"guardian1@example.com\",\"name\":\"Guardian One\"}'
```

### 2. List Guardians
```powershell
curl http://localhost:3001/api/guardians `
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Add Beneficiary
```powershell
curl -X POST http://localhost:3001/api/beneficiaries `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{\"name\":\"Beneficiary One\",\"email\":\"ben1@example.com\",\"percentage\":50}'
```

### 4. Initiate Recovery
```powershell
curl -X POST http://localhost:3001/api/guardians/recovery `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{\"requesterEmail\":\"ben1@example.com\",\"reason\":\"Test recovery\"}'
```

## 🔧 Troubleshooting

### Backend Not Running
```powershell
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Start backend
npm run dev
```

### Token Expired
- Tokens expire after 24 hours
- Just login again to get a new token

### Database Connection Lost
```powershell
# Check Docker container
docker ps --filter "name=regenx-postgres"

# Restart if needed
docker restart regenx-postgres
```

## ✅ Success Checklist

- [ ] Backend server running (`npm run dev`)
- [ ] Database connected (Docker container running)
- [ ] User registered/logged in
- [ ] TEST_ACCESS_TOKEN set
- [ ] Full test passing (`npm run test:vault:complete`)

## 🎉 Next Steps After Tests Pass

1. ✅ Vault logic validated
2. ✅ Database connected
3. ✅ APIs working
4. ⚠️  Smart contract integration (next phase)
5. ⚠️  Frontend integration (next phase)
6. ⚠️  Railway deployment (next phase)

