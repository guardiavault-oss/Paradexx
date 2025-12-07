# GuardiaVault Project Structure

## Overview

This is a monorepo containing:
- **Web Application** (React + Vite)
- **Mobile Application** (React Native + Expo)
- **Backend API** (Express.js + TypeScript)
- **Smart Contracts** (Solidity + Hardhat)
- **Shared Code** (Platform-agnostic utilities)

---

## Directory Structure

```
GuardiaVault-2/
├── client/                 # Web frontend (React)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # React hooks
│   │   ├── lib/           # Utilities, contracts, config
│   │   └── services/      # Frontend services
│   └── public/            # Static assets
│
├── mobile/                # Mobile app (React Native + Expo)
│   ├── App.tsx            # Main app component
│   ├── app.json           # Expo configuration
│   └── package.json       # Mobile dependencies
│
├── server/                # Backend API
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   ├── middleware/       # Express middleware
│   ├── jobs/              # Background jobs/cron
│   ├── scripts/           # Utility scripts
│   └── index.ts           # Server entry point
│
├── contracts/             # Smart contracts
│   ├── GuardiaVault.sol
│   ├── MultiSigRecovery.sol
│   ├── YieldVault.sol
│   ├── DAOVerification.sol
│   └── scripts/           # Deployment scripts
│
├── shared/                # Shared code (Web + Mobile)
│   ├── schema.ts          # Database schema
│   ├── config/            # Shared configuration
│   ├── services/          # Platform-agnostic services
│   ├── hooks/             # Shared hooks
│   └── utils/             # Platform utilities
│
├── tests/                 # Test files
│   ├── contracts/         # Contract tests
│   ├── backend/           # Backend tests
│   ├── frontend/          # Frontend tests
│   └── integration/       # Integration tests
│
├── docs/                  # Documentation
│   ├── deployment/        # Deployment guides
│   ├── features/          # Feature documentation
│   ├── setup/             # Setup guides
│   └── guides/            # User guides
│
├── migrations/            # Database migrations
├── scripts/               # Utility scripts
└── ignition/              # Hardhat deployment modules
```

---

## Key Files

### Configuration
- `package.json` - Root package.json with all scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite (web) configuration
- `hardhat.config.ts` - Hardhat (contracts) configuration
- `drizzle.config.ts` - Database ORM configuration
- `tailwind.config.ts` - Tailwind CSS configuration

### Documentation
- `README.md` - Main project documentation
- `docs/` - All project documentation organized by category

### Environment
- `env.example` - Environment variables template
- `.env` - Local environment variables (gitignored)

---

## Code Sharing Strategy

### Web-Only Code
Located in `client/src/`:
- React components using DOM APIs
- Wagmi wallet integration
- GSAP animations
- Tailwind CSS components

### Mobile-Only Code
Located in `mobile/`:
- React Native components
- Expo-specific code
- Native modules

### Shared Code
Located in `shared/`:
- API client (`shared/services/apiClient.ts`)
- Platform utilities (`shared/utils/platform.ts`)
- API configuration (`shared/config/api.ts`)
- Database schema (`shared/schema.ts`)

---

## Testing Strategy

### Contract Tests
- Location: `tests/contracts/`
- Framework: Hardhat + Chai
- Coverage: 90%+ target

### Backend Tests
- Location: `tests/backend/`
- Framework: Vitest
- Coverage: 85%+ target

### Frontend Tests
- Location: `tests/frontend/`
- Framework: Vitest + Testing Library
- Coverage: 75%+ target

### Integration Tests
- Location: `tests/integration/`
- Framework: Vitest
- Coverage: Critical paths 100%

---

## Development Workflow

### Web Development
```bash
npm run dev              # Start web dev server
npm run build            # Build web app
```

### Mobile Development
```bash
cd mobile
npm start                # Start Expo dev server
npm run android          # Run on Android
npm run ios              # Run on iOS
```

### Backend Development
```bash
npm run dev              # Start backend server
npm run db:migrate       # Run database migrations
```

### Contract Development
```bash
npm run compile          # Compile contracts
npm run test:contracts   # Test contracts
npm run deploy:sepolia   # Deploy to Sepolia
```

---

## Platform Compatibility

### Web
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Wallet connection via MetaMask, WalletConnect, etc.
- Responsive design (mobile-optimized web)

### Mobile (React Native)
- iOS 13+
- Android 8+
- Wallet connection via WalletConnect
- Native biometric authentication

---

## Shared Dependencies

Both web and mobile use:
- `ethers` - Ethereum library
- `zod` - Schema validation
- `@tanstack/react-query` - Data fetching
- Shared API client
- Shared contract ABIs

---

## Next Steps

1. Complete mobile app implementation
2. Add comprehensive tests
3. Set up CI/CD pipeline
4. Deploy to production

