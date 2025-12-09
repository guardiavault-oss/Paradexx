# Database Migration via API Endpoint

Since Railway doesn't provide shell access, use the migration API endpoint to run database migrations.

## Step 1: Generate Migration Token

Generate a secure random token (32 characters):

**PowerShell:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Alternative (using PowerShell):**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
```

## Step 2: Add Token to Railway Variables

1. Go to Railway Dashboard → **GuardiaVault** service
2. Click **"Variables"** tab
3. Click **"+ New Variable"**
4. Add:
   - **Name:** `MIGRATION_TOKEN`
   - **Value:** (paste the token from Step 1)
5. Click **"Add"**

## Step 3: Trigger Migration

**Using PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"
$url = "https://guardiavault-production.up.railway.app/api/admin/migrate"
Invoke-RestMethod -Method Post -Uri $url -Headers @{"X-Migration-Token"=$token} -ContentType "application/json"
```

**Using curl (if you have it):**
```bash
curl -X POST https://guardiavault-production.up.railway.app/api/admin/migrate \
  -H "X-Migration-Token: YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Using a web browser (for testing):**
Install a browser extension like "REST Client" or use Postman to send:
- **Method:** POST
- **URL:** `https://guardiavault-production.up.railway.app/api/admin/migrate`
- **Header:** `X-Migration-Token: YOUR_TOKEN_HERE`

## Step 4: Verify Migration

After migration completes, verify it worked:

```powershell
curl https://guardiavault-production.up.railway.app/ready
```

Should return:
```json
{
  "status": "ready",
  "checks": {
    "database": true
  }
}
```

## Troubleshooting

### Error: "Unauthorized"
- Make sure `MIGRATION_TOKEN` is set in Railway Variables
- Make sure you're using the exact token value (no extra spaces)
- Make sure the token is NOT "CHANGE_ME_IN_PRODUCTION"

### Error: "Migration failed"
- Check Railway logs for detailed error messages
- Verify `DATABASE_URL` is correctly set in Railway Variables
- Ensure PostgreSQL service is running

### Server not responding
- Check that your Railway service is deployed and running
- Verify the service URL is correct
- Check Railway logs for server errors

