<p align="center">

  <img src="assets/logo.png" alt="Paradexx Logo" width="200"/>  # DualGen Landing Page

</p>

  This is a code bundle for DualGen Landing Page. The original project is available at https://www.figma.com/design/Xcd5fK0IArY6YRlGS1obuW/DualGen-Landing-Page.

<h1 align="center">Paradexx</h1>

  ## Running the code

<p align="center">

  <strong>A next-generation Web3 wallet platform with advanced security features, DeFi integrations, and AI-powered insights.</strong>  Run `npm i` to install the dependencies.

</p>

  Run `npm run dev` to start the development server.

<p align="center">  # Paradexx

  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Features

### 🛡️ Security
- **MEV Protection** - Shield transactions from front-running and sandwich attacks
- **Bridge Security** - Real-time security scoring for cross-chain bridges
- **Wallet Guard** - Advanced wallet monitoring and threat detection
- **GuardiaVault** - Inheritance and legacy planning with multi-guardian support

### 💎 DeFi Features
- **Multi-chain Swaps** - Seamless token swaps across major networks
- **Yield Opportunities** - AI-curated yield farming and staking
- **Limit Orders & DCA** - Advanced trading automation
- **Sniper Bot** - Meme token detection and early entry tools

### 🤖 AI-Powered
- **Scarlette AI** - Intelligent assistant for DeFi navigation
- **Risk Analysis** - Smart contract and token risk assessment
- **Portfolio Insights** - AI-driven portfolio optimization suggestions

### 📱 Multi-Platform
- Web Application (React + Vite)
- Mobile Apps (iOS & Android via Capacitor)
- Browser Extension

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (optional, for backend services)

### Installation

```bash
# Clone the repository
git clone https://github.com/guardiavault-oss/Paradexx.git
cd Paradexx

# Install dependencies
pnpm install

# Set up environment variables
cp config/.env.example .env.local

# Start development server
pnpm dev
```

### Running with Docker

```bash
# Start all services
docker-compose up -d

# Or use the startup script
./scripts/start-all-docker.ps1
```

---

## Architecture

```
Paradexx/
├── src/                    # Main frontend application
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── contexts/           # React contexts
│   ├── backend/            # Backend API (Express + Prisma)
│   └── utils/              # Utility functions
│
├── services/               # Microservices
│   ├── mevguard/           # MEV protection service
│   ├── crosschain/         # Cross-chain bridge service
│   ├── scarlette/          # AI assistant service
│   ├── degen/              # DeFi analytics service
│   ├── wallet-guard/       # Wallet monitoring dashboard
│   └── guardiavault/       # Inheritance & legacy service
│
├── contracts/              # Smart contracts (Solidity)
├── circuits/               # ZK circuits
├── extension/              # Browser extension
├── android/                # Android native code
├── ios/                    # iOS native code
│
├── config/                 # Configuration files
│   ├── docker/             # Docker configurations
│   └── deployment/         # Deployment configs (Railway, Netlify)
│
├── docs/                   # Documentation
│   ├── architecture/       # Architecture docs
│   ├── integration/        # Integration guides
│   ├── setup/              # Setup guides
│   └── guides/             # User guides
│
├── scripts/                # Utility scripts
├── tests/                  # Test files
└── e2e/                    # End-to-end tests
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture/) | System design and component structure |
| [Setup Guide](docs/setup/DEPLOYMENT.md) | Deployment and setup instructions |
| [Contributing](docs/CONTRIBUTING.md) | Contribution guidelines |

### Integration Guides
- [MEV Protection](docs/integration/MEV_PROTECTION_INTEGRATION.md)
- [Bridge Security](docs/integration/BRIDGE_SECURITY_INTEGRATION_SUMMARY.md)
- [GuardiaVault](docs/integration/GUARDIAVAULT_INTEGRATION.md)
- [Scarlette AI](docs/integration/SCARLETTE_INTEGRATION.md)

---

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **TanStack Query** - Data fetching

### Backend
- **Express.js** - API server
- **Prisma** - ORM
- **PostgreSQL** - Database
- **Redis** - Caching

### Blockchain
- **ethers.js** - Ethereum interactions
- **WalletConnect** - Wallet connectivity
- **Multiple chains** - Ethereum, Base, Arbitrum, Polygon, BSC

---

## Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm preview          # Preview production build

# Testing
pnpm test             # Run tests
pnpm test:e2e         # Run E2E tests

# Docker
./scripts/start-all-docker.ps1    # Start all services
./scripts/test-platform-health.ps1 # Health check
```

---

## Environment Variables

See `config/.env.example` for all required environment variables.

Key variables:
```env
VITE_API_URL=https://your-api-url.com
VITE_WS_URL=wss://your-ws-url.com
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ by the GuardiaVault Team
</p>
