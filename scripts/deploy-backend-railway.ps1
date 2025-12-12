# Deploy Backend to Railway
# This script helps deploy the backend API to Railway

Write-Host "Deploying Backend to Railway" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan

Write-Host "`nPrerequisites:" -ForegroundColor Yellow
Write-Host "   1. Railway account (https://railway.app)" -ForegroundColor White
Write-Host "   2. GitHub repository connected" -ForegroundColor White
Write-Host "   3. Railway CLI installed (optional): npm install -g @railway/cli" -ForegroundColor White

Write-Host "`nStep 1: Railway Dashboard Setup" -ForegroundColor Yellow
Write-Host "   Go to: https://railway.app/dashboard" -ForegroundColor Cyan
Write-Host "   1. Click 'New Project'" -ForegroundColor White
Write-Host "   2. Select 'Deploy from GitHub repo'" -ForegroundColor White
Write-Host "   3. Choose your repository" -ForegroundColor White

Write-Host "`nStep 2: Add PostgreSQL Database" -ForegroundColor Yellow
Write-Host "   1. Click '+ New' > 'Database' > 'PostgreSQL'" -ForegroundColor White
Write-Host "   2. Copy DATABASE_URL from Variables tab" -ForegroundColor White

Write-Host "`nStep 3: Set Environment Variables" -ForegroundColor Yellow
Write-Host "   Go to your service > Variables tab" -ForegroundColor White
Write-Host "   Required variables:" -ForegroundColor White
Write-Host "   - DATABASE_URL (from PostgreSQL)" -ForegroundColor Gray
Write-Host "   - NODE_ENV=production" -ForegroundColor Gray
Write-Host "   - PORT=3001" -ForegroundColor Gray
Write-Host "   - SESSION_SECRET (generate random)" -ForegroundColor Gray
Write-Host "   - JWT_SECRET (generate random)" -ForegroundColor Gray

Write-Host "`nGenerating secrets..." -ForegroundColor Yellow
$sessionSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
$jwtSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
$encryptionKey = -join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object {[char]$_})

Write-Host "`nGenerated Secrets (copy these to Railway Variables):" -ForegroundColor Green
Write-Host "SESSION_SECRET=$sessionSecret" -ForegroundColor Cyan
Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor Cyan
Write-Host "ENCRYPTION_KEY=$encryptionKey" -ForegroundColor Cyan

Write-Host "`nStep 4: Railway will auto-deploy" -ForegroundColor Yellow
Write-Host "   Railway uses railway.json configuration" -ForegroundColor White
Write-Host "   Build command: cd src/backend && npm install && npx prisma generate && npm run build" -ForegroundColor Gray
Write-Host "   Start command: cd src/backend && npm start" -ForegroundColor Gray

Write-Host "`nStep 5: Get Railway URL" -ForegroundColor Yellow
Write-Host "   After deployment, Railway provides a URL like:" -ForegroundColor White
Write-Host "   https://your-app-name.up.railway.app" -ForegroundColor Cyan
Write-Host "   Copy this URL for mobile app configuration!" -ForegroundColor Yellow

Write-Host "`nStep 6: Verify Deployment" -ForegroundColor Yellow
Write-Host "   Test health endpoint:" -ForegroundColor White
Write-Host "   curl https://your-app-name.up.railway.app/health" -ForegroundColor Cyan

Write-Host "`nStep 7: Update Mobile App" -ForegroundColor Yellow
Write-Host "   After backend is deployed:" -ForegroundColor White
Write-Host "   1. Update .env.production with Railway URL" -ForegroundColor Gray
Write-Host "   2. Or update src/services/config.ts" -ForegroundColor Gray
Write-Host "   3. Rebuild: npm run build" -ForegroundColor Gray
Write-Host "   4. Sync: npx cap sync android" -ForegroundColor Gray

Write-Host "`nRailway Configuration:" -ForegroundColor Yellow
Write-Host "   Config file: railway.json" -ForegroundColor White
Write-Host "   Health check: /health" -ForegroundColor White
Write-Host "   Port: 3001" -ForegroundColor White

Write-Host "`nFor detailed instructions, see:" -ForegroundColor Yellow
Write-Host "   docs/DEPLOY_BACKEND_FIRST.md" -ForegroundColor Cyan

