# Root Directory Files Reference

This document explains the purpose of each file in the root directory of GuardiaVault.

## Essential Files

### Configuration Files
- **`package.json`** - Node.js dependencies and scripts
- **`pnpm-lock.yaml`** - Locked dependency versions (commit this!)
- **`pnpm-workspace.yaml`** - PNPM workspace configuration
- **`tsconfig.json`** - TypeScript configuration for project
- **`tsconfig.hardhat.json`** - TypeScript config for Hardhat
- **`vite.config.ts`** - Vite build configuration
- **`tailwind.config.ts`** - Tailwind CSS configuration
- **`postcss.config.js`** - PostCSS configuration
- **`drizzle.config.ts`** - Drizzle ORM configuration
- **`hardhat.config.cjs`** - Hardhat configuration
- **`eslint.config.js`** - ESLint configuration
- **`playwright.config.ts`** - Playwright E2E test configuration
- **`vitest.config.ts`** - Vitest test configuration (main)
- **`vitest.config.client.ts`** - Frontend test configuration
- **`vitest.config.integration.ts`** - Integration test configuration
- **`stryker.config.json`** - Mutation testing configuration
- **`jest.config.js`** - Jest configuration (legacy)
- **`components.json`** - shadcn/ui component configuration

### Deployment Files
- **`Dockerfile`** - Docker container definition
- **`docker-compose.yml`** - Local development Docker setup
- **`docker-compose.prod.yml`** - Production Docker setup
- **`netlify.toml`** - Netlify deployment configuration
- **`railway.json`** - Railway deployment configuration

### Documentation Files
- **`README.md`** - Main project documentation (start here!)
- **`CHANGELOG.md`** - Version history and changes
- **`CONTRIBUTING.md`** - Contribution guidelines
- **`LICENSE`** - MIT License
- **`README_LEGAL.md`** - Legal documentation overview
- **`DESIGN_GUIDELINES.md`** - Design system guidelines
- **`PROJECT_STRUCTURE.md`** - Detailed project structure
- **`QUICK_START.md`** - Quick start guide
- **`ENV_SETUP_GUIDE.md`** - Environment setup guide
- **`PRODUCTION_SETUP.md`** - Production setup guide
- **`PRODUCTION_DEPLOYMENT_GUIDE.md`** - Production deployment guide
- **`DEPLOYMENT_GUIDE.md`** - General deployment guide
- **`DEPLOYMENT_CHECKLIST.md`** - Deployment checklist
- **`SEPOLIA_DEPLOYMENT_GUIDE.md`** - Sepolia testnet deployment
- **`SEPOLIA_DEPLOYMENT.md`** - Sepolia deployment details
- **`STRIPE_QUICK_START.md`** - Stripe payment setup

### Environment Files
- **`env.example`** - Environment variable template (copy to `.env`)

### Scripts
- **`install-animation-packages.sh`** - Animation package installation script

## Directory Structure

```
GuardiaVault-2/
├── client/              # Web frontend
├── mobile/              # Mobile application
├── server/              # Backend API
├── contracts/           # Smart contracts
├── shared/              # Shared code
├── docs/                # Documentation
├── migrations/          # Database migrations
├── tests/               # Test files
├── scripts/             # Utility scripts
├── legal/               # Legal documents
└── [config files]       # Configuration files (root)
```

## File Organization Principles

1. **Configuration files** stay in root for tool discovery
2. **Documentation** organized in `docs/` directory
3. **Status/completion reports** archived in `docs/archive/`
4. **Environment variables** documented in `docs/deployment/env/`
5. **Temporary files** excluded via `.gitignore`

## See Also

- [Project Structure](./PROJECT_STRUCTURE.md)
- [Documentation Index](./docs/README.md)
- [Deployment Index](./docs/DEPLOYMENT_INDEX.md)

