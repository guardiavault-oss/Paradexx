# 🚨 SECURITY FIXES REQUIRED - IMMEDIATE ACTION

**Date:** November 7, 2025
**Status:** ❌ CRITICAL ISSUE REQUIRES IMMEDIATE ATTENTION

---

## 🔴 CRITICAL: API Keys Exposed in Git

### The Problem

The file `client/.env.production` contains API keys and is **committed to version control**:

```bash
# Line 22:
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY_HERE

# Line 25:
VITE_WALLETCONNECT_PROJECT_ID=f32270e55fe94b09ccfc7a375022bb41
```

**Note:** The WalletConnect Project ID is designed to be public and is NOT a security risk.

**However:** The Infura API key should not be in git, even for testnet.

### Why This Matters

- Anyone with access to the repository can use your Infura quota
- Potential service disruption if rate limits are exceeded
- Violation of security best practices
- Could be flagged by automated security scanners

---

## ✅ IMMEDIATE FIX (10 minutes)

### Step 1: Remove from Git

```bash
cd /home/user/GuardiaVault

# Remove the file from git (but keep local copy)
git rm --cached client/.env.production

# Add to .gitignore to prevent future commits
echo "client/.env.production" >> .gitignore

# Commit the removal
git commit -m "security: Remove API keys from version control"

# Push the changes
git push origin $(git branch --show-current)
```

### Step 2: Rotate API Keys

1. **Infura API Key:**
   - Go to https://app.infura.io/
   - Generate a new API key for Sepolia
   - Update in Netlify environment variables (NOT in code)

2. **WalletConnect Project ID:**
   - No action needed - this is designed to be public

### Step 3: Update Environment Variables

**In Netlify Dashboard:**
1. Go to Site Settings > Environment Variables
2. Add/Update:
   ```
   VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_NEW_KEY_HERE
   ```
3. Redeploy the site

### Step 4: Clean Documentation

Remove the API keys from these files (replace with placeholder):

```bash
# Files containing the exposed key:
QUICK_START.md (lines 35, 36, 85)
docs/deployment/env/RAILWAY_ENV_VARS.txt (lines 32, 33, 84, 85)
docs/deployment/env/NETLIFY_ENV_VARS.txt (lines 15, 34)
```

Replace with:
```
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY
```

---

## 🟡 MEDIUM PRIORITY FIX (Optional but Recommended)

### XSS Defense-in-Depth: Add DOMPurify

**File:** `client/src/pages/SmartWillBuilder.tsx` (line 1052)

**Current Code:**
```tsx
<div dangerouslySetInnerHTML={{ __html: previewContent }} />
```

**Issue:** While the HTML is currently escaped by Handlebars on the server, using `dangerouslySetInnerHTML` is risky.

**Recommended Fix:**

1. Install DOMPurify:
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

2. Update the component:
```tsx
import DOMPurify from 'dompurify';

// In the render:
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(previewContent)
}} />
```

**Why:** Adds an extra layer of protection in case server-side escaping is bypassed.

---

## 📋 Verification Checklist

After applying fixes:

- [ ] `client/.env.production` removed from git
- [ ] `client/.env.production` added to `.gitignore`
- [ ] New Infura API key generated
- [ ] Netlify environment variables updated
- [ ] Documentation updated with placeholders
- [ ] Site redeployed successfully
- [ ] Test that the app still connects to Sepolia
- [ ] Verify no API keys in `git log --all --patch | grep -i "infura"`

---

## 🔒 Prevention for Future

### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Check for potential secrets being committed

if git diff --cached --name-only | grep -E '\.(env|production)$'; then
    echo "❌ ERROR: Attempting to commit .env or .production files"
    echo "These files should not be committed to version control"
    exit 1
fi

# Check for API keys in staged changes
if git diff --cached | grep -E 'api[_-]?key.*=.*[a-zA-Z0-9]{20,}' -i; then
    echo "❌ ERROR: Potential API key detected in commit"
    echo "Please use environment variables instead"
    exit 1
fi

exit 0
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

### Add git-secrets (Optional)

```bash
# Install git-secrets
brew install git-secrets  # macOS
# or
sudo apt install git-secrets  # Linux

# Initialize for this repo
cd /home/user/GuardiaVault
git secrets --install
git secrets --register-aws
git secrets --add 'infura.*[a-f0-9]{32}'
git secrets --add 'INFURA.*KEY'
```

---

## 📞 Questions?

If you need help with any of these fixes, please refer to:
- Full audit report: `SECURITY_AUDIT_DETAILED.md`
- Deployment docs: `docs/deployment/`
- [Infura Dashboard](https://app.infura.io/)
- [Netlify Environment Variables Guide](https://docs.netlify.com/environment-variables/overview/)

---

**Priority:** 🚨 HIGH - Fix today
**Time Required:** ~10-15 minutes
**Difficulty:** Easy
