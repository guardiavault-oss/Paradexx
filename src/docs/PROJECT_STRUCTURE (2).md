# Project Structure

## Directory Overview

```
paradex/
├── 📄 Root Files
│   ├── App.tsx                     # Main application entry point
│   ├── index.html                  # HTML template
│   ├── README.md                   # Project overview and quick start
│   ├── CHANGELOG.md                # Version history and changes
│   ├── Attributions.md             # Third-party credits
│   └── package.json                # Dependencies and scripts
│
├── 📁 components/                  # React components
│   ├── 📁 dashboard/              # Dashboard-specific widgets
│   │   ├── DegenHub.tsx           # Degen trading hub
│   │   ├── RegenHub.tsx           # Regen investment hub
│   │   ├── StatusBar.tsx          # Top status bar
│   │   ├── BottomNav.tsx          # Mobile navigation
│   │   ├── SniperBot.tsx          # Token sniper
│   │   ├── WhaleTracker.tsx       # Whale tracking
│   │   ├── MemeScanner.tsx        # Meme coin scanner
│   │   ├── MEVShield.tsx          # MEV protection
│   │   ├── WalletGuard.tsx        # Multi-sig protection
│   │   ├── InheritanceVault.tsx   # Smart will
│   │   └── EmergencyProtection.tsx # Panic mode
│   │
│   ├── 📁 effects/                # Visual effects
│   │   ├── AnimatedGradientText.tsx
│   │   ├── BackgroundBeams.tsx
│   │   ├── BentoGrid.tsx
│   │   ├── Card3D.tsx
│   │   ├── Meteors.tsx
│   │   ├── MovingBorder.tsx
│   │   ├── ParticlesBackground.tsx
│   │   ├── ShineBorder.tsx
│   │   ├── Sparkles.tsx
│   │   ├── Spotlight.tsx
│   │   └── index.ts
│   │
│   ├── 📁 features/               # Feature modules
│   │   ├── CuratedDappLauncher.tsx
│   │   ├── CustomTokenImport.tsx
│   │   ├── DeFiDashboard.tsx
│   │   ├── FeeBreakdown.tsx
│   │   ├── FirstTransactionGuide.tsx
│   │   ├── GasManager.tsx
│   │   ├── GuardianXInheritance.tsx
│   │   ├── HelpCenter.tsx
│   │   ├── LegalPages.tsx
│   │   ├── MEVProtection.tsx
│   │   ├── MemeRadar.tsx
│   │   ├── PortfolioAnalytics.tsx
│   │   ├── PrivacyShield.tsx
│   │   ├── SniperBot.tsx
│   │   ├── WalletGuard.tsx
│   │   ├── WhaleTracker.tsx
│   │   └── index.ts
│   │
│   ├── 📁 figma/                  # Figma integration
│   │   └── ImageWithFallback.tsx  # Protected: Image with fallback
│   │
│   ├── 📁 landing/                # Landing pages
│   │   ├── Assessment.tsx         # User assessment
│   │   └── LandingPage.tsx        # Marketing page
│   │
│   ├── 📁 layout/                 # Layout components
│   │   ├── CardGrid.tsx
│   │   ├── Container.tsx
│   │   ├── Flex.tsx
│   │   ├── PageLayout.tsx
│   │   ├── Section.tsx
│   │   ├── SidebarLayout.tsx
│   │   ├── Stack.tsx
│   │   └── index.ts
│   │
│   ├── 📁 modals/                 # Modal dialogs
│   │   ├── NetworkSwitchModal.tsx
│   │   └── WalletConnectModal.tsx
│   │
│   ├── 📁 security/               # Security features
│   │   ├── DecoyWalletMode.tsx
│   │   ├── HoneypotDetectionModal.tsx
│   │   ├── PhishingWarning.tsx
│   │   └── index.ts
│   │
│   ├── 📁 tokens/                 # Token management
│   │   ├── TokenDetail.tsx
│   │   ├── TokenDiscovery.tsx
│   │   ├── TokenImage.tsx
│   │   ├── TokenList.tsx
│   │   ├── TokenManagementModal.tsx
│   │   └── index.ts
│   │
│   ├── 📁 transaction/            # Transaction handling
│   │   ├── TransactionSimulator.tsx
│   │   └── TransactionStatusPanel.tsx
│   │
│   ├── 📁 ui/                     # Core UI components
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── Button.tsx
│   │   ├── Dropdown.tsx
│   │   ├── GlassCard.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Progress.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Tabs.tsx
│   │   ├── Toast.tsx
│   │   ├── Tooltip.tsx
│   │   └── ... (50+ UI components)
│   │
│   └── 📄 Individual Components
│       ├── Dashboard.tsx           # Main dashboard
│       ├── DashboardNew.tsx        # Alternative dashboard
│       ├── FlowingShaderBackground.tsx  # Menger sponge shader
│       ├── GlassOnboarding.tsx     # Onboarding flow
│       ├── LoginModal.tsx          # Authentication
│       ├── NoiseBackground.tsx     # Noise texture
│       ├── ParadexLogo.tsx         # Logo component
│       ├── SplashScreen.tsx        # Initial splash
│       ├── TribeOnboarding.tsx     # Identity selection
│       ├── TunnelLanding.tsx       # 3D tunnel landing
│       └── WalletEntry.tsx         # Entry point
│
├── 📁 data/                        # Static data
│   ├── degenSlides.ts             # Degen tunnel cards
│   └── regenSlides.ts             # Regen tunnel cards
│
├── 📁 design-system/               # Design system (self-contained)
│   ├── tokens.ts                  # Design tokens
│   ├── globals.css                # CSS variables
│   ├── README.md                  # Design system docs
│   └── ... (migration tools, guides)
│
├── 📁 docs/                        # Documentation
│   ├── ARCHITECTURE.md            # System architecture
│   ├── COMPONENT_REFERENCE.md     # Component API docs
│   ├── DESIGN_SYSTEM.md           # Design guidelines
│   ├── DEVELOPMENT.md             # Development workflow
│   └── PROJECT_STRUCTURE.md       # This file
│
├── 📁 guidelines/                  # Custom guidelines
│   └── Guidelines.md              # AI assistant rules
│
├── 📁 hooks/                       # Custom React hooks
│   ├── usePerformance.ts          # Performance monitoring
│   └── useScarletteWillAI.ts      # AI assistant
│
├── 📁 imports/                     # Figma imports
│   ├── svg-65k65cik3m.ts         # SVG data
│   └── svg-e9glq69foo.ts         # SVG data
│
├── 📁 lib/                         # Utility libraries
│   ├── cn.ts                      # Classname utility
│   ├── motion.ts                  # Motion utilities
│   └── utils.ts                   # Helper functions
│
├── 📁 public/                      # Static assets
│   ├── manifest.json              # PWA manifest
│   └── service-worker.js          # Service worker
│
├── 📁 styles/                      # Global styles
│   ├── globals.css                # Main stylesheet
│   └── tokens/
│       └── index.ts               # Style tokens
│
├── 📁 supabase/                    # Backend
│   └── functions/server/
│       ├── index.tsx              # Hono server
│       └── kv_store.tsx           # Protected: KV utility
│
└── 📁 utils/                       # Utility functions
    ├── analytics.ts               # Analytics tracking
    ├── api.ts                     # API utilities
    ├── cache.ts                   # Caching strategies
    ├── constants.ts               # App constants
    ├── errorHandler.ts            # Error handling
    ├── helpers.ts                 # Helper functions
    ├── logger.ts                  # Logging utilities
    ├── performance.ts             # Performance utilities
    ├── three.ts                   # Three.js singleton
    ├── validation.ts              # Input validation
    └── supabase/
        └── info.tsx               # Protected: Supabase config
```

## Component Categories

### 🎯 Core Flow Components
The main user journey through the app:
1. `SplashScreen` → Initial load
2. `WalletEntry` → Wallet connection
3. `GlassOnboarding` → Setup flow
4. `TribeOnboarding` → Identity selection
5. `TunnelLanding` → Feature showcase
6. `Assessment` → User profiling
7. `Dashboard` / `DashboardNew` → Main interface

### 🎨 Visual Components
WebGL and effect components:
- `FlowingShaderBackground` - Menger sponge fractal
- `TunnelLanding` - 3D tunnel with GSAP
- `NoiseBackground` - Texture overlay
- All in `/components/effects/` - Visual effects library

### 🛠️ Feature Components
Business logic and features:
- `/components/dashboard/` - Dashboard widgets
- `/components/features/` - Feature modules
- `/components/security/` - Security features
- `/components/tokens/` - Token management
- `/components/transaction/` - Transaction handling

### 🧱 UI Components
Reusable UI building blocks:
- `/components/ui/` - Core UI library (50+ components)
- `/components/layout/` - Layout helpers
- `/components/modals/` - Modal dialogs

## Protected Files

⚠️ **Do not modify these system files:**
- `/supabase/functions/server/kv_store.tsx`
- `/utils/supabase/info.tsx`
- `/components/figma/ImageWithFallback.tsx`

## Data Flow

```
User Input
    ↓
Component
    ↓
React State (useState/useEffect)
    ↓
API Call (utils/api.ts)
    ↓
Supabase Server (/supabase/functions/server/index.tsx)
    ↓
Database (kv_store.tsx) or External API
    ↓
Response → Component → UI Update
```

## File Naming Conventions

- **Components**: PascalCase (e.g., `DashboardNew.tsx`)
- **Utilities**: camelCase (e.g., `utils/performance.ts`)
- **Hooks**: camelCase with "use" prefix (e.g., `usePerformance.ts`)
- **Types**: PascalCase with type suffix (e.g., `ButtonProps`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `API_BASE_URL`)

## Import Conventions

```typescript
// React imports
import { useState, useEffect } from 'react';

// Third-party libraries
import { motion } from 'motion/react';
import * as THREE from 'three';

// Local utilities
import { cn } from '@/lib/cn';
import { api } from '@/utils/api';

// Components (relative imports)
import { Button } from './components/ui/Button';
import Dashboard from './components/Dashboard';

// Figma assets
import logo from 'figma:asset/abc123.png'; // Raster
import svgData from './imports/svg-abc123'; // Vector

// Types
import type { ComponentProps } from './types';
```

## Code Organization Best Practices

### 1. Component Structure
```typescript
// Imports
import { ... } from '...';

// Types
interface ComponentProps {
  // ...
}

// Component
export function Component({ ...props }: ComponentProps) {
  // State
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => { ... }, []);
  
  // Handlers
  const handleAction = () => { ... };
  
  // Render
  return (
    <div>...</div>
  );
}
```

### 2. File Size Guidelines
- **Components**: <300 lines (split if larger)
- **Utilities**: <200 lines
- **Hooks**: <150 lines
- **Types**: <100 lines per file

### 3. Folder Organization
- **Index files**: Export all public components
- **Subfolders**: Group related components
- **Tests**: Co-locate with components (when added)

## Bundle Organization

### Lazy Loaded Chunks
```typescript
// Heavy components loaded on-demand
const TunnelLanding = lazy(() => import('./components/TunnelLanding'));
const DashboardNew = lazy(() => import('./components/DashboardNew'));
```

### Code Splitting
Vite automatically splits code by:
- Route-based splitting
- Dynamic imports
- Vendor chunks

## Environment-Specific Files

### Development
- `.env.local` - Local environment variables
- `vite.config.ts` - Build configuration

### Production
- `.env.production` - Production variables
- Build output in `/dist`

## Next Steps

1. **For new developers**: Read [DEVELOPMENT.md](DEVELOPMENT.md)
2. **For components**: See [COMPONENT_REFERENCE.md](COMPONENT_REFERENCE.md)
3. **For architecture**: Read [ARCHITECTURE.md](ARCHITECTURE.md)
4. **For design**: Check [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)

## Maintenance

### Adding New Components
1. Create in appropriate `/components` subdirectory
2. Add to index file if creating a new module
3. Document in COMPONENT_REFERENCE.md
4. Update this file if creating new directories

### Deprecating Components
1. Mark as deprecated in code comments
2. Update CHANGELOG.md
3. Remove after one minor version
4. Update documentation

### Refactoring
1. Maintain same public API where possible
2. Update all imports
3. Document in CHANGELOG.md
4. Update relevant documentation
