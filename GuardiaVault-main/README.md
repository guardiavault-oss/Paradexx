# GuardiaVault 🔐

> A blockchain-based cryptographic dead man's switch for secure cryptocurrency inheritance

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://reactjs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.74-61DAFB.svg)](https://reactnative.dev/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.26-363636.svg)](https://soliditylang.org/)

GuardiaVault is a comprehensive platform that solves the **$200B+ problem of lost cryptocurrency assets** due to death or incapacitation. It uses zero-knowledge secret distribution, blockchain smart contracts, and guardian-based consensus to ensure safe inheritance.

---

## ✨ Features

### 🔐 Core Security

- **Shamir Secret Sharing**: 2-of-3 threshold scheme for secret recovery
- **Zero-Custody Architecture**: Platform never has access to private keys
- **AES-256-GCM Encryption**: Client-side encryption with PBKDF2 key derivation
- **Blockchain Timelock**: On-chain vault management with guardian attestation

### ⛓️ Blockchain Integration

- **Smart Contract Vaults**: `GuardiaVault.sol` manages time-locked vaults
- **Multi-Sig Recovery**: `MultiSigRecovery.sol` for wallet recovery (2-of-3 keys)
- **Yield-Generating Vaults**: `YieldVault.sol` auto-stakes funds in DeFi protocols
- **DAO Verification**: `DAOVerification.sol` for community-driven claim verification

### 📱 Cross-Platform

- **Web Application**: React + Vite (responsive, mobile-optimized)
- **Mobile Application**: React Native + Expo (iOS & Android)
- **Shared Codebase**: Platform-agnostic utilities and services

### 🔔 Advanced Features

- **Biometric Check-in**: Behavioral biometric verification
- **Automated Death Verification**: Multi-source verification with official certificates
- **Guardian Network**: 2-of-3 guardian attestation system
- **Check-In System**: Configurable intervals with grace periods
- **Multi-Party Recovery**: 2-of-3 recovery keys with 7-day time lock

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL (optional, falls back to in-memory storage)
- MetaMask or compatible wallet

### Deploy & Run (5 Minutes)

1. **Compile contracts:**

   ```bash
   npm run compile
   ```

2. **Start local blockchain** (new terminal):

   ```bash
   npm run node:local
   ```

3. **Deploy contracts:**

   ```bash
   npm run deploy:local              # GuardiaVault
   npm run deploy:yield:local        # YieldVault with Lido & Aave
   ```

4. **Start dev server:**

   ```bash
   npm run dev
   ```

5. **Visit** `http://localhost:5000` and create your first vault! 🎉

📖 **Full deployment guide:** See [docs/QUICK_START.md](./docs/QUICK_START.md) or [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Run database migrations (if using PostgreSQL)
npm run db:migrate

# Start development server
npm run dev
```

The app will be available at:

- **Web**: <http://localhost:5000>
- **API**: <http://localhost:5000/api>

### Mobile Development

```bash
cd mobile
npm install
npm start
```

Then:

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app

---

## 📁 Project Structure

```text
GuardiaVault-2/
├── client/           # Web frontend (React + Vite)
├── mobile/           # Mobile app (React Native + Expo)
├── server/           # Backend API (Express.js)
├── contracts/        # Smart contracts (Solidity)
├── shared/           # Shared code (Web + Mobile)
├── tests/            # Test files
└── docs/             # Documentation
```

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed structure.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# By category
npm run test:contracts    # Smart contract tests
npm run test:backend      # Backend API tests
npm run test:frontend     # Frontend component tests

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Documentation Index](./docs/README.md)** - Complete documentation overview
- **[Deployment Guides](./docs/DEPLOYMENT_INDEX.md)** - All deployment documentation
- **[Quick Start](./QUICK_START.md)** - Get started in 5 minutes
- **[Project Structure](./PROJECT_STRUCTURE.md)** - Detailed project organization

See [docs/README.md](./docs/README.md) for the complete documentation index.

---

## 🔧 Development

### Smart Contracts

```bash
# Compile contracts
npm run compile

# Run contract tests
npm run test:contracts

# Deploy to Sepolia
npm run deploy:sepolia
```

### Backend

```bash
# Start development server
npm run dev

# Run backend tests
npm run test:backend

# Database migrations
npm run db:migrate
npm run db:studio      # Open Drizzle Studio
```

### Frontend

```bash
# Start Vite dev server (auto-starts with npm run dev)
# Access at http://localhost:5000
```

---

## 🔒 Security

- **Zero-Knowledge Design**: Server never stores plaintext keys
- **Client-Side Encryption**: All sensitive data encrypted before transmission
- **Smart Contract Audits**: Contracts designed for professional audit
- **Input Validation**: Zod schemas for all API inputs
- **Rate Limiting**: Express rate limiting middleware
- **CORS Protection**: Configured CORS policies
- **Content Security Policy**: Comprehensive CSP headers with nonce support

## ⚡ Performance

- **Response Compression**: Gzip compression enabled for JSON, HTML, CSS, JS (60-80% size reduction)
  - Compression level: 6 (balanced speed/ratio)
  - Threshold: 1KB (only compress larger responses)
  - Content types: JSON, text, HTML, CSS, JavaScript, SVG
  - Excludes: Images, fonts, PDFs (already compressed)
- **Static Asset Optimization**: Efficient serving of static files
- **Performance Monitoring**: Built-in request timing and metrics

---

## 🎯 Smart Contracts

### GuardiaVault.sol

Main vault contract with:

- 2-of-3 guardian attestation
- Time-based dead man's switch
- Emergency revoke (7-day window)
- Beneficiary claims

### MultiSigRecovery.sol

Wallet recovery contract:

- 2-of-3 recovery keys
- 7-day time lock
- Encrypted seed phrase storage

### YieldVault.sol

Yield-generating vaults:

- Auto-staking in DeFi protocols
- 1% performance fee
- Principal protection

### DAOVerification.sol

Community verification:

- Verifier staking
- Reputation system
- Auto-resolution at 70%

---

## 📱 Platform Support

### Web

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design (mobile-optimized)
- Wallet connection via MetaMask, WalletConnect

### Mobile Platform Support

- iOS 13+
- Android 8+
- Wallet connection via WalletConnect
- Native biometric authentication

---

## 🛠️ Tech Stack

### Frontend Stack

- **React 18.3** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **GSAP** - Animations
- **Wagmi** - Ethereum hooks

### Mobile Stack

- **React Native 0.74** - Mobile framework
- **Expo 51** - Development platform
- **WalletConnect** - Wallet connection

### Backend Stack

- **Express.js** - Web framework
- **PostgreSQL** - Database (optional)
- **Drizzle ORM** - Database toolkit
- **Zod** - Schema validation

### Blockchain

- **Solidity 0.8.26** - Smart contracts
- **Hardhat** - Development environment
- **Ethers.js 6** - Ethereum library

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support & Resources

- **Documentation**: [docs/README.md](./docs/README.md) - Complete documentation index
- **Deployment**: [docs/DEPLOYMENT_INDEX.md](./docs/DEPLOYMENT_INDEX.md) - Deployment guides
- **Contributing**: [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md) - Version history

---

## 🎯 Roadmap

### Completed ✅

- Core vault system
- Guardian attestation
- Multi-sig recovery
- Yield-generating vaults
- DAO verification
- Biometric check-in
- Automated death verification

### In Progress 🔄

- Mobile app full implementation
- Comprehensive test coverage
- Production deployment

### Planned 📋

- Advanced analytics
- Multi-chain support
- Legal document generation
- Enterprise features

---

## Built with ❤️ for the crypto community
