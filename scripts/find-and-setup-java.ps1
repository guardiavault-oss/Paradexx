# Find and Setup Java for Android Build

Write-Host "Finding Java Installation" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan

Write-Host "`nCommon Java Installation Locations:" -ForegroundColor Yellow
$commonPaths = @(
    "C:\Program Files\Java",
    "C:\Program Files\Eclipse Adoptium",
    "C:\Program Files\Eclipse Foundation",
    "$env:LOCALAPPDATA\Programs\Eclipse Adoptium",
    "$env:ProgramFiles\Java",
    "$env:ProgramFiles(x86)\Java",
    "C:\Program Files\Android\Android Studio\jbr"
)

$found = $false
foreach ($path in $commonPaths) {
    if (Test-Path $path) {
        Write-Host "Checking: $path" -ForegroundColor Gray
        $jdkDirs = Get-ChildItem $path -Directory -ErrorAction SilentlyContinue | Where-Object { 
            $_.Name -match "jdk|java|jbr" -and (Test-Path (Join-Path $_.FullName "bin\java.exe"))
        }
        if ($jdkDirs) {
            foreach ($jdk in $jdkDirs) {
                Write-Host "  Found: $($jdk.FullName)" -ForegroundColor Green
                $found = $true
            }
        }
    }
}

if (-not $found) {
    Write-Host "`nJava not found in common locations." -ForegroundColor Yellow
    Write-Host "`nTo find Java manually:" -ForegroundColor Yellow
    Write-Host "   1. Open File Explorer" -ForegroundColor White
    Write-Host "   2. Go to: C:\Program Files" -ForegroundColor White
    Write-Host "   3. Look for folders like:" -ForegroundColor White
    Write-Host "      - Java" -ForegroundColor Gray
    Write-Host "      - Eclipse Adoptium" -ForegroundColor Gray
    Write-Host "      - jdk-XX" -ForegroundColor Gray
    Write-Host "   4. Inside should be: bin\java.exe" -ForegroundColor White
    
    Write-Host "`nOnce you find Java, run:" -ForegroundColor Yellow
    Write-Host "   `$env:JAVA_HOME = 'C:\Program Files\Java\jdk-XX'" -ForegroundColor Cyan
    Write-Host "   `$env:PATH = '`$env:JAVA_HOME\bin;' + `$env:PATH" -ForegroundColor Cyan
    Write-Host "   java -version" -ForegroundColor Cyan
    Write-Host "   cd android" -ForegroundColor Cyan
    Write-Host "   .\gradlew bundleRelease" -ForegroundColor Cyan
} else {
    Write-Host "`nTo use one of these, set JAVA_HOME:" -ForegroundColor Yellow
    Write-Host "   `$env:JAVA_HOME = 'C:\path\to\java'" -ForegroundColor Cyan
    Write-Host "   `$env:PATH = '`$env:JAVA_HOME\bin;' + `$env:PATH" -ForegroundColor Cyan
}
