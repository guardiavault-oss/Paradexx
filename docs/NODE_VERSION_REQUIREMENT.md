# Node.js Version Requirement for Android Deployment

## Issue

Capacitor 8 (latest) requires **Node.js 22+**, but your current version may be lower.

## Solutions

### Option 1: Upgrade Node.js (Recommended)

**Download Node.js 22 LTS:**
- Windows: https://nodejs.org/
- Or use nvm-windows: `nvm install 22`

**Verify installation:**
```powershell
node --version
# Should show v22.x.x or higher
```

### Option 2: Use Capacitor 7 (Compatible with Node 20)

If you can't upgrade Node.js, install Capacitor 7:

```powershell
pnpm add -D @capacitor/core@7 @capacitor/cli@7 @capacitor/android@7 @capacitor/ios@7 @capacitor/splash-screen@7 @capacitor/status-bar@7 @capacitor/keyboard@7 @capacitor/app@7
```

**Note**: Capacitor 7 works with Node.js 18+ and is still fully supported.

## Check Your Node Version

```powershell
node --version
```

## After Upgrading/Installing

Run the deployment script again:
```powershell
.\scripts\deploy-android-playstore.ps1
```

