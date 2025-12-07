# Paradox Project Structure

**Last Updated:** 2025-12-04

---

## 📁 Root Directory

```
paradox/
├── src/                    # Frontend application
├── app/                    # FastAPI backend (Python)
├── contracts/              # Smart contracts
├── scripts/                # Automation and deployment scripts
├── docs/                   # Documentation
├── public/                 # Static assets
├── config/                 # Configuration files
├── tests/                  # Test suites
├── docker-compose.yml      # Docker orchestration
├── package.json            # Frontend dependencies
├── pyproject.toml          # Python dependencies
└── README.md               # Main documentation
```

---

## 🎨 Frontend (`src/`)

### Component Organization

```
src/
├── components/             # React components (316 files)
│   ├── ui/                 # Design system primitives (75 files)
│   │   ├── glass-card.tsx  # Glassmorphism components
│   │   ├── AnimatedCard.tsx
│   │   ├── DotScreenShader.tsx
│   │   └── ...
│   ├── widgets/            # Dashboard widgets (6 files)
│   │   ├── QuickStatsWidget.tsx
│   │   ├── GasTrackerWidget.tsx
│   │   └── ...
│   ├── tribe-onboarding/   # Onboarding flows
│   │   ├── OnboardingApp.tsx
│   │   ├── TunnelLanding.tsx
│   │   ├── Assessment.tsx
│   │   └── Dashboard.tsx
│   ├── guardianx/          # Inheritance system
│   ├── landing/            # Landing pages
│   └── ...                 # Feature components
│
├── contexts/               # React Context providers
│   ├── AuthContext.tsx     # Authentication
│   ├── WalletContext.tsx   # Wallet state
│   └── TribeTheme.tsx      # Theme management
│
├── hooks/                  # Custom React hooks
│   ├── useMempoolMonitoring.ts
│   ├── useRegenData.ts
│   └── ...
│
├── styles/                 # Styling and design tokens
│   ├── design-system.css   # CSS variables
│   ├── tokens/             # Design tokens
│   │   ├── colors.ts       # 40 semantic colors
│   │   ├── typography.ts   # Font system
│   │   └── effects.ts      # Shadows, blur, etc.
│   └── globals.css         # Global styles
│
├── utils/                  # Utility functions
│   ├── api-client.ts       # API wrapper
│   ├── console-filter.ts   # Console cleanup
│   └── keyboardShortcuts.ts
│
├── animations/             # Animation variants
│   └── variants.ts         # Framer Motion configs
│
├── services/               # Frontend services
│   └── logger.service.ts   # Logging
│
├── App.tsx                 # Main app component
├── main.tsx                # Entry point
└── vite-env.d.ts           # Vite types
```

---

## 🐍 Backend (`app/`)

### FastAPI Structure

```
app/
├── api/                    # API endpoints
│   ├── main_comprehensive.py  # Main FastAPI app
│   ├── bridge_service_endpoints.py
│   ├── wallet_guard_endpoints.py
│   ├── scarlette_endpoints.py
│   └── ...
│
├── core/                   # Core services
│   ├── bridge_service_client.py
│   ├── wallet_guard.py
│   ├── scarlette_ai.py
│   └── mempool_manager.py
│
├── models/                 # Pydantic models
│   ├── bridge.py
│   ├── transaction.py
│   └── ...
│
├── services/               # Business logic
│   ├── bridge_service.py
│   ├── mev_protection.py
│   └── inheritance_manager.py
│
└── utils/                  # Utilities
    └── logger.py
```

---

## 🔧 TypeScript Backend (`src/backend/`)

### Express.js Structure

```
src/backend/
├── routes/                 # Express routes
│   ├── auth.routes.ts      # Authentication
│   ├── wallet.routes.ts    # Wallet operations
│   ├── market.routes.ts    # Market data
│   ├── trading.routes.ts   # Trading features
│   └── ...
│
├── services/               # Business logic
│   ├── auth.service.ts
│   ├── verification.service.ts
│   ├── trading.service.ts
│   └── ...
│
├── models/                 # Data models
│   ├── User.ts
│   ├── Wallet.ts
│   └── ...
│
├── middleware/             # Express middleware
│   ├── auth.middleware.ts
│   └── error.middleware.ts
│
├── config/                 # Configuration
│   └── database.ts
│
└── server.ts               # Express app entry
```

---

## 📜 Smart Contracts (`contracts/`)

```
contracts/
├── GuardianVault.sol       # Inheritance vaults
├── SocialRecovery.sol      # Guardian recovery
├── TimeLock.sol            # Time-locked transfers
└── ...
```

---

## 🤖 Scripts (`scripts/`)

### Organization

```
scripts/
├── start-platform.ps1      # Main startup script
├── start-all-docker.ps1    # Docker startup
├── deploy.ps1              # Deployment
├── test-all-api-endpoints.py  # API testing
├── test_bridge_integration.py # Bridge tests
└── ...
```

---

## 📚 Documentation (`docs/`)

### Structure

```
docs/
├── guides/                 # User guides
│   ├── SETUP_GUIDE.md
│   ├── MOBILE_BUILD_GUIDE.md
│   └── COMMAND_CHEATSHEET.md
│
├── technical/              # Technical docs
│   ├── TSX-USAGE-REPORT.md
│   └── UNUSED-COMPONENTS.md
│
├── design/                 # Design system
│   ├── DESIGN-SYSTEM.md
│   └── DESIGN-SYSTEM-SUMMARY.md
│
├── integrations/           # Integration guides
│   └── BRIDGE_SERVICE_QUICK_START.md
│
├── deployment/             # Deployment docs
│
├── archive/                # Old/obsolete docs
│
├── ARCHITECTURE.md         # System architecture
├── API.md                  # API documentation
├── DEPLOYMENT.md           # Deployment guide
├── CONTRIBUTING.md         # Contribution guidelines
└── SECURITY_BEST_PRACTICES.md
```

---

## 🐳 Docker

```
docker-compose.yml          # Full stack
docker-compose.simple.yml   # DB only
Dockerfile.frontend         # Frontend container
```

---

## 🔧 Configuration Files

```
.env                        # Environment variables
.env.example                # Example env file
.gitignore                  # Git ignore rules
package.json                # Frontend dependencies
pyproject.toml              # Python dependencies
pnpm-workspace.yaml         # Monorepo config
tsconfig.json               # TypeScript config
vite.config.ts              # Vite config
tailwind.config.js          # Tailwind config
capacitor.config.ts         # Capacitor config (mobile)
netlify.toml                # Netlify deployment
railway.json                # Railway deployment
nginx.conf                  # Nginx config
```

---

## 📊 Key Metrics

- **Total TSX Components**: 340 (329 after cleanup)
- **Active Components**: ~256 (75-80% usage)
- **UI Primitives**: 75 files
- **Widgets**: 6 files
- **Documentation Files**: 150+ (organized into `docs/`)
- **Scripts**: 32 PowerShell/Python scripts

---

## 🗂️ File Naming Conventions

### Components
- **PascalCase**: `ComponentName.tsx`
- **UI Components**: `ui/component-name.tsx` (kebab-case for primitives)
- **Pages**: `PageName.tsx`
- **Modals**: `ModalName.tsx`

### Scripts
- **kebab-case**: `script-name.ps1`
- **snake_case**: `script_name.py`

### Documentation
- **SCREAMING_SNAKE_CASE**: `FEATURE_NAME.md`
- **kebab-case**: `feature-name.md` (for guides)

---

## 🚀 Quick Navigation

### Most Important Files

**Frontend:**
- `src/App.tsx` — Main app component
- `src/main.tsx` — Entry point
- `src/components/Dashboard.tsx` — Main dashboard
- `src/components/GlassOnboarding.tsx` — Wallet creation
- `src/contexts/AuthContext.tsx` — Authentication
- `src/contexts/WalletContext.tsx` — Wallet state

**Backend:**
- `app/api/main_comprehensive.py` — FastAPI main
- `src/backend/server.ts` — Express server
- `src/backend/routes/auth.routes.ts` — Auth endpoints
- `src/backend/routes/market.routes.ts` — Market data

**Configuration:**
- `.env` — Environment variables
- `vite.config.ts` — Frontend config
- `docker-compose.yml` — Docker setup
- `package.json` — Dependencies

**Documentation:**
- `README.md` — Main docs
- `docs/ARCHITECTURE.md` — System design
- `docs/design/DESIGN-SYSTEM.md` — Design tokens

---

## 🎯 Development Workflow

1. **Start Services**: `./start-platform.ps1`
2. **Frontend**: http://localhost:5000
3. **Backend API**: http://localhost:3001
4. **FastAPI**: http://localhost:8000
5. **Database**: PostgreSQL on port 5432
6. **Redis**: Redis on port 6379

---

**For detailed setup instructions, see [SETUP_GUIDE.md](guides/SETUP_GUIDE.md)**


