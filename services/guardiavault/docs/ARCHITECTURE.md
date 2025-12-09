# GuardiaVault Architecture

## System Overview

GuardiaVault is a comprehensive digital inheritance platform built with a modern, scalable architecture supporting web, mobile, and blockchain components.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                              │
├─────────────────────────────────────────────────────────────┤
│  Web App (React + Vite)    │  Mobile App (React Native)     │
│  - Responsive UI            │  - Native iOS/Android         │
│  - Wallet Integration       │  - Biometric Auth             │
│  - Code Splitting          │  - Offline Support            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer                                 │
├─────────────────────────────────────────────────────────────┤
│  Express.js Backend                                         │
│  - RESTful API                                              │
│  - Authentication & Authorization                           │
│  - Rate Limiting & Security                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                        │
│  - User Management                                          │
│  - Vault Metadata                                           │
│  - Guardian Relations                                       │
│  - Recovery Tracking                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Blockchain Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Ethereum Smart Contracts                                   │
│  - GuardiaVault.sol (Main Vault)                            │
│  - MultiSigRecovery.sol (Recovery)                          │
│  - YieldVault.sol (Yield Generation)                        │
│  - DAOVerification.sol (Community Verification)              │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend (Web)
- **Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 7.2
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context API
- **Routing**: Wouter (lightweight router)
- **Code Splitting**: Route-based lazy loading
- **Performance**: Optimized bundles with vendor chunking

### Mobile
- **Framework**: React Native 0.74
- **Platform**: Expo 51
- **Navigation**: React Navigation
- **State**: Shared with web via shared utilities
- **Authentication**: Native biometric APIs

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with CSRF protection
- **API**: RESTful design
- **Security**: Helmet, rate limiting, input validation

### Smart Contracts
- **Language**: Solidity 0.8.26
- **Framework**: Hardhat
- **Testing**: Hardhat + Chai
- **Deployment**: Hardhat Ignition
- **Networks**: Ethereum Mainnet, Sepolia Testnet

## Data Flow

### Vault Creation
1. User creates vault via web/mobile
2. Client generates encryption keys
3. Keys split using Shamir Secret Sharing (2-of-3)
4. Fragments encrypted and stored
5. Vault metadata stored in database
6. Smart contract deployed (optional)

### Recovery Process
1. Guardians attest to recovery need
2. System collects 2-of-3 fragments
3. Fragments decrypted and combined
4. Original key reconstructed
5. Assets recovered and transferred

### Death Verification
1. Multi-source verification triggered
2. Official records checked
3. Obituaries monitored
4. Consensus reached (70% confidence)
5. Recovery process initiated

## Security Architecture

### Zero-Knowledge Design
- Server never sees plaintext keys
- All encryption client-side
- Fragments encrypted separately
- No single point of failure

### Encryption
- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 (100,000 iterations)
- **Secret Sharing**: Shamir's Secret Sharing (2-of-3)
- **Key Storage**: Encrypted fragments only

### Blockchain Security
- Time-locked contracts
- Multi-signature requirements
- Guardian consensus (2-of-3)
- Emergency revocation (7-day window)

## Deployment Architecture

### Production
- **Frontend**: Netlify (CDN + Edge)
- **Backend**: Railway (Container)
- **Database**: PostgreSQL (Railway managed)
- **Blockchain**: Ethereum Mainnet

### Development
- **Local**: Docker Compose
- **Database**: PostgreSQL container
- **Blockchain**: Hardhat local node

## Scalability

### Horizontal Scaling
- Stateless API servers
- Database connection pooling
- CDN for static assets
- Load balancing ready

### Performance
- Code splitting for faster loads
- Database indexing
- Caching strategies
- Asset optimization

## Monitoring & Observability

- Health check endpoints
- Error tracking (Sentry)
- Database query logging
- Performance metrics

## Technology Decisions

### Why React + Vite?
- Fast development experience
- Excellent performance
- Strong ecosystem
- TypeScript support

### Why PostgreSQL?
- ACID compliance
- Strong relational features
- JSON support
- Excellent performance

### Why Express.js?
- Mature ecosystem
- Flexible middleware
- Easy to understand
- Great TypeScript support

### Why Hardhat?
- Best-in-class Solidity tooling
- Excellent testing framework
- Great developer experience
- Active community

---

For detailed implementation information, see:
- [Implementation Documentation](./implementation/)
- [Security Documentation](./security/)
- [Deployment Documentation](./deployment/)

