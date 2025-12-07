# AegisX Browser Extension Build Guide

This guide covers building and publishing the AegisX wallet browser extension for Chrome Web Store and Firefox Add-ons.

## Prerequisites

- Node.js 18+ and npm
- Chrome browser (for testing)
- Firefox browser (for testing)

## Project Structure

```
regenx-extension/
├── public/
│   ├── manifest.json      # Extension manifest (MV3)
│   ├── icons/             # Extension icons
│   └── inject.js          # Injected web3 provider
├── src/
│   ├── background/        # Service worker
│   ├── content/           # Content scripts
│   ├── popup/             # Popup UI (React)
│   ├── options/           # Options page
│   └── lib/               # Shared libraries
├── webpack.config.js
├── package.json
└── tsconfig.json
```

## Build Process

### Step 1: Install Dependencies

```bash
cd regenx-extension
npm install
```

### Step 2: Build for Development

```bash
npm run dev
```

This watches for changes and rebuilds automatically.

### Step 3: Build for Production

```bash
npm run build
```

Output is written to `dist/` directory.

### Step 4: Load in Chrome (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `regenx-extension/dist` directory

### Step 5: Load in Firefox (Development)

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` in `dist/`

## Manifest Configuration

The extension uses Manifest V3 (`public/manifest.json`):

```json
{
  "manifest_version": 3,
  "name": "AegisX - Intelligent Wallet Protection",
  "version": "1.0.0",
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "webRequest",
    "notifications"
  ]
}
```

## Chrome Web Store Submission

### Developer Account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay one-time $5 registration fee
3. Verify your identity

### Required Assets

| Asset | Size | Format |
|-------|------|--------|
| Store Icon | 128x128 | PNG |
| Small Promo Tile | 440x280 | PNG |
| Large Promo Tile (optional) | 920x680 | PNG |
| Screenshots | 1280x800 or 640x400 | PNG/JPEG |
| Marquee Promo Tile (optional) | 1400x560 | PNG |

### Submission Steps

1. Create a ZIP of the `dist/` directory:
   ```bash
   cd regenx-extension
   zip -r aegisx-extension.zip dist/
   ```

2. Upload to Chrome Web Store Developer Dashboard

3. Fill in listing details:
   - Name: AegisX Wallet
   - Description: (see below)
   - Category: Productivity
   - Language: English

4. Submit for review (2-7 days typically)

### Store Description

**Short Description (132 chars max):**
```
Protect your wallet from MEV attacks and malicious contracts with AI-powered transaction analysis.
```

**Full Description:**
```
AegisX is an intelligent wallet protection extension that safeguards your cryptocurrency transactions.

KEY FEATURES:

Transaction Protection:
• MEV (Miner Extractable Value) attack detection
• Front-running protection
• Sandwich attack prevention
• Flash loan monitoring

Security Analysis:
• Smart contract risk scoring
• Honeypot detection
• Rug pull warnings
• Token approval monitoring

Real-time Alerts:
• Suspicious transaction notifications
• Wallet guard monitoring
• Threat detection alerts
• Gas price optimization

DegenX Trading Tools:
• Cross-chain bridge integration
• DEX aggregation
• Sniper bot protection
• Whale tracking

PRIVACY:
• No data collection
• All analysis done locally
• Your keys, your crypto

Works with popular dApps including Uniswap, OpenSea, Blur, and more.
```

## Firefox Add-ons Submission

### Developer Account

1. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
2. Create a free Mozilla account

### Submission Steps

1. Create a source ZIP (if using bundler):
   ```bash
   zip -r aegisx-source.zip . -x "node_modules/*" -x "dist/*"
   ```

2. Create distribution ZIP:
   ```bash
   cd dist && zip -r ../aegisx-firefox.zip .
   ```

3. Upload both files to Add-on Developer Hub

4. Firefox review is typically faster (1-3 days)

## Version Management

Update version in these files for each release:

1. `public/manifest.json`:
   ```json
   "version": "1.0.1"
   ```

2. `package.json`:
   ```json
   "version": "1.0.1"
   ```

## Testing Checklist

Before submission, verify:

- [ ] Extension loads without errors
- [ ] Popup opens correctly
- [ ] Options page loads
- [ ] Content script injects properly
- [ ] Background service worker runs
- [ ] Storage permissions work
- [ ] All icons display correctly
- [ ] No console errors

## Common Issues

### Content Security Policy Errors

The extension uses strict CSP. Ensure all scripts are bundled, not inline.

### Service Worker Lifecycle

MV3 service workers can be terminated. Use:
```javascript
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });
```

### Web Accessible Resources

Any resources accessed by content scripts must be listed:
```json
"web_accessible_resources": [{
  "resources": ["inject.js"],
  "matches": ["<all_urls>"]
}]
```

## Troubleshooting

### Build Errors

If webpack isn't found:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Extension Not Loading

- Check for manifest syntax errors
- Verify all referenced files exist
- Check Chrome DevTools for errors

### API Permissions

If API calls fail, ensure host_permissions include the domains:
```json
"host_permissions": [
  "https://api.yourservice.com/*"
]
```

## CI/CD Integration

For automated builds, use GitHub Actions:

```yaml
name: Build Extension
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd regenx-extension && npm ci
      - run: cd regenx-extension && npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: extension
          path: regenx-extension/dist
```
