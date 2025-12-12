# Build AAB using Android Studio
# Alternative method if Gradle command line doesn't work

Write-Host "Building AAB with Android Studio" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan

Write-Host "`nOption 1: Build in Android Studio (Recommended)" -ForegroundColor Yellow
Write-Host "   1. Open Android Studio" -ForegroundColor White
Write-Host "   2. Open project: android folder" -ForegroundColor White
Write-Host "   3. Wait for Gradle sync to complete" -ForegroundColor White
Write-Host "   4. Go to: Build > Generate Signed Bundle / APK" -ForegroundColor White
Write-Host "   5. Select: Android App Bundle" -ForegroundColor White
Write-Host "   6. Choose keystore: android\release-keystore.jks" -ForegroundColor White
Write-Host "   7. Enter passwords" -ForegroundColor White
Write-Host "   8. Build > Release" -ForegroundColor White
Write-Host "   9. Output: android\app\build\outputs\bundle\release\app-release.aab" -ForegroundColor Cyan

Write-Host "`nOption 2: Set JAVA_HOME and use Gradle" -ForegroundColor Yellow
Write-Host "   Find Java JDK location (usually in Android Studio):" -ForegroundColor White
Write-Host "   C:\Program Files\Android\Android Studio\jbr" -ForegroundColor Gray
Write-Host "   Or: C:\Program Files\Java\jdk-XX" -ForegroundColor Gray
Write-Host ""
Write-Host "   Then set JAVA_HOME:" -ForegroundColor White
Write-Host "   `$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'" -ForegroundColor Cyan
Write-Host "   cd android" -ForegroundColor Cyan
Write-Host "   .\gradlew bundleRelease" -ForegroundColor Cyan

Write-Host "`nOption 3: Use Android Studio Terminal" -ForegroundColor Yellow
Write-Host "   1. Open Android Studio" -ForegroundColor White
Write-Host "   2. Open project: android folder" -ForegroundColor White
Write-Host "   3. Open Terminal in Android Studio (bottom panel)" -ForegroundColor White
Write-Host "   4. Run: .\gradlew bundleRelease" -ForegroundColor Cyan
Write-Host "   (Android Studio terminal has JAVA_HOME already set)" -ForegroundColor Gray

Write-Host "`nCurrent Package Name: com.paradex.wallet" -ForegroundColor Green
Write-Host "Ready to build!" -ForegroundColor Green

