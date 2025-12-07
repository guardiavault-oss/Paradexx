# Paradex Architecture

## 🏗️ Application Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         AppRouter.tsx                           │
│                     (React Router Setup)                        │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ├─── Route: "/"
                │    └─── App.tsx (Main Application)
                │         │
                │         ├─── SplashScreen
                │         │    └─── "Paradex" animated logo
                │         │
                │         ├─── WalletEntry
                │         │    ├─── Create Wallet button (Degen style)
                │         │    ├─── Import Wallet button (Regen style)
                │         │    └─── Legal links footer
                │         │
                │         ├─── LoginModal (if Import)
                │         │    └─── Email/Password → Dashboard
                │         │
                │         ├─── GlassOnboarding (if Create)
                │         │    ├─── Step 1: Easy/Advanced Setup
                │         │    ├─── Step 2-6: User Info
                │         │    ├─── Step 7: Seed/Guardians
                │         │    └─── Step 8: Confirm → SplitScreen
                │         │
                │         ├─── SplitScreen
                │         │    ├─── Degen Side (Red fire particles)
                │         │    └─── Regen Side (Blue snow particles)
                │         │    └─── Select → TunnelLanding
                │         │
                │         ├─── TunnelLanding
                │         │    ├─── 3D Voronoi tunnel
                │         │    ├─── Feature cards (7 degen / 8 regen)
                │         │    └─── Complete → Assessment
                │         │
                │         ├─── Assessment
                │         │    ├─── Personality quiz
                │         │    └─── Results → Dashboard
                │         │
                │         └─── Dashboard
                │              ├─── Wallet overview
                │              ├─── Feature access
                │              └─── Settings (logout)
                │
                ├─── Route: "/guardian"
                │    └─── GuardianPortal.tsx
                │         ├─── URL param: ?token=xxx
                │         ├─── Step: Invitation (accept/decline)
                │         ├─── Step: Dashboard (all clear)
                │         └─── Step: Recovery (approve/reject)
                │
                ├─── Route: "/privacy"
                │    └─── PrivacyPolicy.tsx
                │         ├─── Information Collection
                │         ├─── Data Protection
                │         ├─── User Rights
                │         └─── Contact Info
                │
                └─── Route: "/terms"
                     └─── TermsOfService.tsx
                          ├─── Acceptance of Terms
                          ├─── Risks & Disclaimers
                          ├─── User Responsibilities
                          └─── Limitation of Liability
```

## 🎨 Component Hierarchy

```
App.tsx
├── Background Components (Conditional)
│   ├── SplitParticleBackground (Split screen only)
│   │   ├── ParticleShader (Degen - Red fire up)
│   │   └── ParticleShader (Regen - Blue snow down)
│   └── FeatureBackground (Feature pages only)
│       └── Voronoi Glass Tunnel (Tribe-tinted)
│
├── Transition Components
│   ├── PageTransition (Degen/Regen fullscreen)
│   └── FadeTransition (Black fade between steps)
│
└── Content Components (Mutually Exclusive)
    ├── SplashScreen
    ├── WalletEntry
    │   └── FlowingShaderBackground (Menger sponge)
    ├── GlassOnboarding
    │   └── Glassmorphism cards
    ├── LoginModal
    ├── TribeOnboarding
    ├── TunnelLanding (Lazy loaded)
    │   └── Three.js tunnel scene
    ├── Assessment
    └── DashboardNew (Lazy loaded)
```

## 🗂️ Data Flow

```
User Input → State Updates → UI Renders → Transitions

┌─────────────────┐
│  User Actions   │
└────────┬────────┘
         │
         v
┌─────────────────┐
│   App State     │
│                 │
│ • showSplash    │
│ • showWallet    │
│ • showOnboard   │
│ • selectedSide  │
│ • showDashboard │
│ • assessResults │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Conditional    │
│   Rendering     │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Component      │
│   Displays      │
└─────────────────┘
```

## 🎭 State Machine

```
[START]
   ↓
[Splash] ──2s──> [WalletEntry]
   │                │
   │                ├──Create──> [Onboarding] ──> [SplitScreen]
   │                │                               │
   │                └──Import──> [Login] ──> [Dashboard]
   │                                              ↑
   │                                              │
[SplitScreen] ──Select Side──> [Tunnel] ──> [Assessment] ──┘

[END at Dashboard]
```

## 🔄 Guardian Portal Flow

```
[Email Link with Token]
        ↓
[GuardianPortal validates token]
        ↓
    ┌───┴────┐
    │        │
[Pending] [Active]
    │        │
    v        v
[Accept/ [Dashboard]
 Decline]    │
    │        v
    │    [Recovery Request?]
    │        │
    v        v
[Success] [Approve/Reject]
            │
            v
         [Done]
```

## 💾 Data Storage Strategy

### Client-Side (Browser)
```
localStorage
├── userPreferences
│   ├── selectedTribe: "degen" | "regen"
│   ├── biometricEnabled: boolean
│   └── theme: object
├── walletData (Encrypted)
│   ├── encryptedPrivateKey: string
│   └── publicAddress: string
└── guardianTokens (If guardian)
    └── tokens: string[]
```

### Server-Side (Future Backend)
```
Database
├── users
│   ├── id, email, name, password_hash
│   └── tribe, created_at, last_login
├── wallets
│   ├── user_id, public_address
│   └── wallet_type, guardian_setup
├── guardians
│   ├── wallet_id, guardian_email
│   ├── status, token, invited_at
│   └── accepted_at, last_active
└── recovery_requests
    ├── wallet_id, initiated_at
    ├── required_approvals, current_approvals
    └── status, time_lock, expires_at
```

## 🌐 API Endpoints (Future)

```
Authentication
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/verify

Wallet Management
POST   /api/wallet/create
GET    /api/wallet/balance
GET    /api/wallet/history
POST   /api/wallet/transaction

Guardian System
POST   /api/guardian/invite
GET    /api/guardian-portal/info?token=xxx
POST   /api/guardian-portal/accept
POST   /api/guardian-portal/decline
POST   /api/guardian-portal/approve-recovery

Recovery
POST   /api/recovery/initiate
GET    /api/recovery/status
POST   /api/recovery/execute
POST   /api/recovery/cancel
```

## 🎨 Style Architecture

```
Global Styles (/styles/globals.css)
├── CSS Variables
│   ├── --color-degen: #DC143C
│   ├── --color-regen: #00ADEF
│   └── --color-chrome: linear-gradient(...)
├── Typography Defaults
│   ├── h1, h2, h3 (Rajdhani)
│   └── p, span (Rajdhani)
└── Base Resets

Component Styles
├── Inline styles (Dynamic based on type)
├── Tailwind classes (Utility-first)
└── Style props (Motion animations)
```

## 🔐 Security Layers

```
┌─────────────────────────────────────┐
│        Application Layer            │
│  • Input validation                 │
│  • XSS prevention                   │
│  • CSRF protection                  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│       Cryptographic Layer           │
│  • Seed phrase generation (BIP39)   │
│  • Private key derivation (BIP32)   │
│  • Message signing (ECDSA)          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│         Storage Layer               │
│  • Client-side encryption           │
│  • Secure enclave usage             │
│  • No sensitive data in localStorage│
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│       Communication Layer           │
│  • HTTPS only                       │
│  • Token-based guardian auth        │
│  • Rate limiting                    │
└─────────────────────────────────────┘
```

## 📦 Build & Deploy

```
Development
npm run dev → Vite dev server (port 5173)

Production Build
npm run build → /dist folder
  ├── index.html
  ├── /assets
  │   ├── index-[hash].js
  │   ├── index-[hash].css
  │   └── [images]
  └── /imports (Figma assets)

Deployment
/dist → CDN/Static hosting
  • Vercel (recommended)
  • Netlify
  • AWS S3 + CloudFront
  • GitHub Pages

Environment Setup
• VITE_API_URL (optional)
• NODE_ENV (auto-set by Vite)
```

## 🧪 Testing Strategy

```
Unit Tests (Coming Soon)
├── Utils
│   └── seed phrase generation
├── Components
│   └── form validation
└── Crypto functions
    └── key derivation

Integration Tests
├── Authentication flow
├── Onboarding complete flow
└── Guardian invitation flow

E2E Tests (Playwright/Cypress)
├── Create wallet → Dashboard
├── Import wallet → Dashboard
└── Guardian accepts → Views recovery
```

---

**Note**: This architecture is designed for scalability. The current implementation focuses on the frontend experience, with backend integration planned for future iterations.
