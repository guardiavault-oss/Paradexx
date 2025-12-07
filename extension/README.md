# Paradox Browser Extension

A secure multi-chain wallet browser extension with MEV protection, social recovery, and AI security.

## Features

- 🔐 **Secure Wallet** - AES-256 encrypted vault with password protection
- 🌐 **Multi-Chain** - Ethereum, Polygon, BSC, Arbitrum, Optimism, Base
- 🛡️ **MEV Protection** - Built-in sandwich attack detection
- 🔗 **WalletConnect** - Connect to any dApp
- 📱 **EIP-6963** - Modern wallet discovery standard
- 🎨 **Beautiful UI** - Clean, modern interface

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
cd extension
npm install
```

### Build

```bash
# Development build
npm run build

# Watch mode
npm run watch

# Production package
npm run package
```

### Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension` folder

## Architecture

```text
extension/
├── manifest.json           # Extension manifest (v3)
├── popup.html             # Popup UI
├── src/
│   ├── background/        # Service worker
│   │   ├── index.js       # Main background script
│   │   ├── wallet-controller.js
│   │   ├── connection-manager.js
│   │   └── transaction-controller.js
│   ├── content/           # Content scripts
│   │   └── index.js       # Injects provider
│   ├── inject/            # Injected scripts
│   │   └── provider.js    # window.ethereum provider
│   ├── popup/             # Popup UI
│   │   ├── index.js
│   │   └── styles.css
│   └── lib/               # Shared utilities
│       └── crypto.js      # Encryption utilities
└── public/
    └── icons/             # Extension icons
```

## Provider API

The extension injects `window.ethereum` compatible with EIP-1193:

```javascript
// Request accounts
const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

// Send transaction
const txHash = await ethereum.request({
  method: 'eth_sendTransaction',
  params: [{
    from: accounts[0],
    to: '0x...',
    value: '0x...'
  }]
});

// Sign message
const signature = await ethereum.request({
  method: 'personal_sign',
  params: [message, accounts[0]]
});

// Switch chain
await ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x89' }] // Polygon
});
```

## Supported Methods

### Account Methods

- `eth_requestAccounts` - Request wallet connection
- `eth_accounts` - Get connected accounts
- `eth_chainId` - Get current chain ID

### Transaction Methods

- `eth_sendTransaction` - Send transaction
- `eth_signTransaction` - Sign transaction
- `eth_estimateGas` - Estimate gas
- `eth_gasPrice` - Get gas price

### Signing Methods

- `personal_sign` - Sign message
- `eth_sign` - Sign message (legacy)
- `eth_signTypedData_v4` - Sign typed data (EIP-712)

### Chain Methods

- `wallet_switchEthereumChain` - Switch network
- `wallet_addEthereumChain` - Add custom network

### Asset Methods

- `wallet_watchAsset` - Add custom token

## Events

```javascript
// Account changed
ethereum.on('accountsChanged', (accounts) => {
  console.log('Accounts:', accounts);
});

// Chain changed
ethereum.on('chainChanged', (chainId) => {
  console.log('Chain:', chainId);
});

// Connect
ethereum.on('connect', (info) => {
  console.log('Connected:', info.chainId);
});

// Disconnect
ethereum.on('disconnect', (error) => {
  console.log('Disconnected:', error);
});
```

## Security

- Private keys are encrypted with AES-256-GCM
- Password-based key derivation with PBKDF2 (100k iterations)
- Auto-lock after 5 minutes of inactivity
- Transaction simulation before signing
- Phishing detection for malicious sites

## License

MIT
