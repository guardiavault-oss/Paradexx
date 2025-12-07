# GuardiaVault Project Summary

## Overview

GuardiaVault is an enterprise-grade digital inheritance platform for cryptocurrency assets, solving the $200B+ problem of lost crypto due to death or incapacitation.

## Architecture

### Technology Stack
- **Frontend**: React 18.3 + Vite + TypeScript
- **Mobile**: React Native 0.74 + Expo
- **Backend**: Express.js + PostgreSQL + Drizzle ORM
- **Blockchain**: Solidity 0.8.26 + Hardhat + Ethers.js 6
- **Deployment**: Docker + Railway (Backend) + Netlify (Frontend)

### Core Components

1. **Web Application** (`client/`)
   - React-based SPA with code splitting
   - Optimized for performance and SEO
   - Responsive design with mobile optimization

2. **Mobile Application** (`mobile/`)
   - React Native with Expo
   - Native biometric authentication
   - Cross-platform iOS/Android support

3. **Backend API** (`server/`)
   - RESTful API with Express.js
   - PostgreSQL database with Drizzle ORM
   - Comprehensive authentication and authorization

4. **Smart Contracts** (`contracts/`)
   - GuardiaVault.sol - Main vault contract
   - MultiSigRecovery.sol - Wallet recovery
   - YieldVault.sol - Yield generation
   - DAOVerification.sol - Community verification

5. **Shared Code** (`shared/`)
   - Platform-agnostic utilities
   - Database schemas
   - Shared services

## Key Features

### Security
- Zero-knowledge architecture
- Shamir Secret Sharing (2-of-3)
- Client-side AES-256-GCM encryption
- Blockchain timelock contracts

### Functionality
- Guardian-based recovery system
- Biometric check-in verification
- Automated death verification
- Yield-generating vaults
- Multi-sig wallet recovery
- Smart Will Builder

## Deployment

- **Frontend**: Netlify (CDN + SPA hosting)
- **Backend**: Railway (Container deployment)
- **Database**: PostgreSQL (Railway managed)
- **Blockchain**: Ethereum Sepolia (testnet) / Mainnet (production)

## Development Status

✅ **Production Ready**
- Core functionality complete
- Security audits passed
- Performance optimized
- Comprehensive documentation

## Documentation

All documentation is organized in `docs/`:
- Deployment guides
- Setup instructions
- Feature documentation
- Troubleshooting guides
- Security documentation

See [docs/README.md](./README.md) for complete documentation index.

## License

MIT License - See [LICENSE](../LICENSE) for details.

