# Organize Documentation Files
# Moves all markdown files to docs/ directory (except README.md)

Write-Host "Organizing documentation files..." -ForegroundColor Cyan

$docsDir = "docs"
if (-not (Test-Path $docsDir)) {
    New-Item -ItemType Directory -Path $docsDir | Out-Null
}

# Categories for documentation
$categories = @{
    "deployment" = @("DEPLOYMENT*.md", "DEPLOY*.md", "QUICK_DEPLOY.md")
    "features" = @("FEATURE*.md", "ADVANCED*.md", "LANDING*.md")
    "setup" = @("SETUP*.md", "ENV*.md", "DATABASE*.md", "MIGRATION*.md")
    "guides" = @("*GUIDE*.md", "*GUIDES*.md", "*SETUP*.md")
    "implementation" = @("IMPLEMENTATION*.md", "*COMPLETE*.md", "*SUMMARY*.md")
    "security" = @("SECURITY*.md")
    "testing" = @("TEST*.md", "*TEST*.md")
    "business" = @("BUSINESS*.md", "STRATEGY*.md")
    "troubleshooting" = @("TROUBLESHOOT*.md", "ERROR*.md", "FIX*.md", "CONSOLE*.md")
}

# Move files to appropriate subdirectories
Get-ChildItem -Path . -Filter "*.md" -File | Where-Object { 
    $_.Name -ne "README.md" 
} | ForEach-Object {
    $file = $_
    $moved = $false
    
    foreach ($category in $categories.Keys) {
        $patterns = $categories[$category]
        foreach ($pattern in $patterns) {
            if ($file.Name -like $pattern) {
                $targetDir = Join-Path $docsDir $category
                if (-not (Test-Path $targetDir)) {
                    New-Item -ItemType Directory -Path $targetDir | Out-Null
                }
                Move-Item -Path $file.FullName -Destination $targetDir -Force
                Write-Host "Moved $($file.Name) to docs/$category/" -ForegroundColor Green
                $moved = $true
                break
            }
        }
        if ($moved) { break }
    }
    
    if (-not $moved) {
        # Move to docs/ root
        Move-Item -Path $file.FullName -Destination $docsDir -Force
        Write-Host "Moved $($file.Name) to docs/" -ForegroundColor Yellow
    }
}

Write-Host "`nDocumentation organization complete!" -ForegroundColor Cyan
Write-Host "All docs moved to docs/ directory" -ForegroundColor Green

