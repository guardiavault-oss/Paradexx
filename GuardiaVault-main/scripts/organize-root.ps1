# Organize Root Directory - Move files to appropriate locations
# This script organizes loose files in the root directory

Write-Host "🧹 Organizing root directory files..." -ForegroundColor Cyan

# Create destination directories
$statusDir = "docs\archive\status-reports"
$envDir = "docs\deployment\env"
$miscDir = "docs\archive\misc-files"
$assetsDir = "attached_assets\misc"

New-Item -ItemType Directory -Force -Path $statusDir | Out-Null
New-Item -ItemType Directory -Force -Path $envDir | Out-Null
New-Item -ItemType Directory -Force -Path $miscDir | Out-Null
New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null

# Move documentation/status files
$docFiles = @(
    "ADD_TO_NETLIFY_NOW.md",
    "DEPLOYMENT_CHECKLIST.md",
    "DEPLOYMENT_COMPLETE.md",
    "DEPLOYMENT_FIX_SUMMARY.md",
    "DEPLOYMENT_GUIDE.md",
    "DEPLOYMENT_STATUS.md",
    "ENV_SETUP_GUIDE.md",
    "HEALTHCHECK_TROUBLESHOOTING.md",
    "NETLIFY_SETUP_MANUAL.md",
    "PRODUCTION_DEPLOYMENT_GUIDE.md",
    "PRODUCTION_ENV_COMPLETE.md",
    "PRODUCTION_FEATURES_COMPLETE.md",
    "PRODUCTION_FEATURES_SUMMARY.md",
    "PRODUCTION_SETUP.md",
    "PROJECT_ORGANIZATION_COMPLETE.md",
    "SEPOLIA_DEPLOYMENT_GUIDE.md",
    "SEPOLIA_DEPLOYMENT.md",
    "STRIPE_QUICK_START.md",
    "MOBILE_OPTIMIZATION.md",
    "OPERATIONAL_IMPROVEMENTS.md",
    "SETUP_ANIMATIONS.md",
    "UX_IMPROVEMENTS_SUMMARY.md",
    "UX_PHASE_2_COMPLETE.md",
    "UX_UI_AUDIT.md",
    "WORLD_CLASS_FEATURES.md"
)

$moved = 0
foreach ($file in $docFiles) {
    if (Test-Path $file) {
        try {
            Move-Item -Path $file -Destination (Join-Path $statusDir $file) -Force
            Write-Host "  ✓ Moved: $file" -ForegroundColor Green
            $moved++
        } catch {
            Write-Host "  ✗ Failed: $file - $_" -ForegroundColor Red
        }
    }
}

# Move environment variable files
$envFiles = @("NETLIFY_ENV_VARS.txt", "RAILWAY_ENV_VARS.txt")
foreach ($file in $envFiles) {
    if (Test-Path $file) {
        try {
            Move-Item -Path $file -Destination (Join-Path $envDir $file) -Force
            Write-Host "  ✓ Moved: $file" -ForegroundColor Green
            $moved++
        } catch {
            Write-Host "  ✗ Failed: $file - $_" -ForegroundColor Red
        }
    }
}

# Move image/media files
$imageExtensions = @("*.png", "*.jpg", "*.jpeg", "*.webp", "*.PNG", "*.JPG", "*.mp4")
foreach ($pattern in $imageExtensions) {
    Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue | 
        Where-Object { $_.Name -notmatch '^(package-lock\.json|components\.json)$' } | 
        ForEach-Object {
            try {
                Move-Item -Path $_.FullName -Destination (Join-Path $assetsDir $_.Name) -Force
                Write-Host "  ✓ Moved: $($_.Name)" -ForegroundColor Green
                $moved++
            } catch {
                Write-Host "  ✗ Failed: $($_.Name) - $_" -ForegroundColor Red
            }
        }
}

# Move miscellaneous text/document files
$miscExtensions = @("*.txt", "*.reg", "*.html", "*.pdf", "*.zip", "*.lnk", "*.log", "*.py")
foreach ($pattern in $miscExtensions) {
    Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue | 
        Where-Object { 
            $_.Name -notmatch '^(package\.json|tsconfig|vite|env\.example|\.gitignore|\.editorconfig|\.gitattributes|README|CHANGELOG|CONTRIBUTING|LICENSE|install-.*\.sh|setup-dev\.ps1|setup-dev\.log)$' -and
            $_.Name -notmatch '^[a-z]+\.config\.(ts|js|cjs)$'
        } | 
        ForEach-Object {
            try {
                Move-Item -Path $_.FullName -Destination (Join-Path $miscDir $_.Name) -Force
                Write-Host "  ✓ Moved: $($_.Name)" -ForegroundColor Green
                $moved++
            } catch {
                Write-Host "  ✗ Failed: $($_.Name) - $_" -ForegroundColor Red
            }
        }
}

# Move any remaining .ts files that aren't configs
Get-ChildItem -Path . -Filter "*.ts" -File -ErrorAction SilentlyContinue | 
    Where-Object { 
        $_.Name -notmatch '^[a-z]+\.config\.ts$' -and
        $_.Name -notmatch '^(tsconfig|vite|vitest|playwright|eslint)'
    } | 
    ForEach-Object {
        try {
            Move-Item -Path $_.FullName -Destination (Join-Path $miscDir $_.Name) -Force
            Write-Host "  ✓ Moved: $($_.Name)" -ForegroundColor Green
            $moved++
        } catch {
            Write-Host "  ✗ Failed: $($_.Name) - $_" -ForegroundColor Red
        }
    }

# Move web directory if it exists
if (Test-Path "web") {
    try {
        Move-Item -Path "web" -Destination (Join-Path $miscDir "web") -Force
        Write-Host "  ✓ Moved: web/" -ForegroundColor Green
        $moved++
    } catch {
        Write-Host "  ✗ Failed: web - $_" -ForegroundColor Red
    }
}

Write-Host "`n✅ Organization complete! Moved $moved files" -ForegroundColor Green
Write-Host "`n📁 Files organized into:" -ForegroundColor Cyan
Write-Host "   - docs/archive/status-reports/ (documentation files)" -ForegroundColor White
Write-Host "   - docs/deployment/env/ (environment variables)" -ForegroundColor White
Write-Host "   - attached_assets/misc/ (images and media)" -ForegroundColor White
Write-Host "   - docs/archive/misc-files/ (miscellaneous files)" -ForegroundColor White

