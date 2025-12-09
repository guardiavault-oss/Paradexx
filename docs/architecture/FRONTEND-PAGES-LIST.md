# Paradox Wallet - Frontend Pages (Physically Visible)

**Generated:** 2025-12-04  
**Source:** Analyzed `src/App.tsx` routing logic

---

## 🎯 Main Navigation Pages

These are the core pages accessible via `activeTab` state and bottom navigation:

### 1. **Dashboard** (`activeTab === "dashboard"`)
**Component:** `Dashboard.tsx`  
**Path:** Main landing page  
**Features:**
- Portfolio overview
- Quick stats widgets
- Token list preview
- Quick action buttons
- AI assistant access
- Security status

---

### 2. **Portfolio** (`activeTab === "portfolio"`)
**Component:** `Portfolio.tsx`  
**Path:** Portfolio view  
**Features:**
- Full token list
- Balance breakdown
- Performance charts
- Asset allocation

---

### 3. **NFT Gallery** (`activeTab === "nfts"`)
**Component:** `NFTGallery.tsx`  
**Path:** NFT collection  
**Features:**
- NFT grid display
- Collection filtering
- NFT detail views

---

### 4. **Token List** (`activeTab === "tokens"`)
**Component:** `TokenList.tsx`  
**Path:** Token management  
**Features:**
- All tokens display
- Search/filter
- Add custom tokens
- Token details

---

## 🔥 Degen Features

### 5. **DegenX Dashboard** (`activeTab === "degenx"`)
**Component:** `DegenDashboard.tsx`  
**Path:** Degen mode hub  
**Features:**
- Degen score
- Meme tracker
- Whale alerts
- Quick sniper access

---

### 6. **Meme Scope Terminal** (`activeTab === "meme-terminal"`)
**Component:** `MemeScopeTerminalAdvanced.tsx`  
**Path:** Meme coin scanner  
**Features:**
- Real-time meme tracking
- Viral potential scoring
- Social sentiment analysis
- Quick buy interface

---

### 7. **Trading Page** (`activeTab === "trading"`)
**Component:** `TradingPage.tsx`  
**Path:** Advanced trading interface  
**Features:**
- DEX aggregation
- Swap interface
- Price charts
- Order history

---

### 8. **Whale Tracker** (`activeTab === "whale-tracker"`)
**Component:** `WhaleTrackerPage.tsx`  
**Path:** Whale monitoring  
**Features:**
- Live whale transactions
- Copy trading setup
- Whale wallet tracking
- Transaction alerts

---

### 9. **Airdrop Hunter** (`activeTab === "airdrops"`)
**Component:** `AirdropPage.tsx`  
**Path:** Airdrop opportunities  
**Features:**
- Active airdrops
- Eligibility checker
- Claim interface
- Historical airdrops

---

## 🌿 Regen Features

### 10. **GuardianX Legacy Vault** (`activeTab === "guardianx"` or `"legacy-vault"`)
**Component:** `GuardianXLegacyVault.tsx`  
**Path:** Inheritance management  
**Features:**
- Vault creation
- Beneficiary management
- Time-lock configuration
- Legacy messages

---

### 11. **Vault Management** (`activeTab === "vault-management"`)
**Component:** `VaultManagement.tsx`  
**Path:** All vaults view  
**Features:**
- Vault list
- Vault health status
- Quick actions
- Guardian monitoring

---

### 12. **RegenX Dashboard** (`activeTab === "regenx"`)
**Component:** `RegenDashboard.tsx`  
**Path:** Regen mode hub  
**Features:**
- Security score
- Guardian status
- Vault overview
- MEV protection stats

---

### 13. **Wallet Guard** (`activeTab === "wallet-guard"`)
**Component:** `WalletGuardDashboard.tsx`  
**Path:** Guardian system  
**Features:**
- Guardian management
- Recovery settings
- Social recovery setup
- Guardian invitations

---

### 14. **Security Center** (`activeTab === "security-center"`)
**Component:** `SecurityCenter.tsx`  
**Path:** Security dashboard  
**Features:**
- Security score
- Threat monitoring
- Transaction simulation
- Rug guard scanner

---

## 💰 Financial Features

### 15. **DeFi Dashboard** (`activeTab === "defi"` or `"defi-dashboard"`)
**Component:** `DeFiDashboardEnhanced.tsx` or `DeFiDashboard.tsx`  
**Path:** DeFi positions  
**Features:**
- Staking positions
- Yield opportunities
- LP positions
- Protocol integrations

---

### 16. **Buy Page** (`activeTab === "buy"`)
**Component:** `BuyPage.tsx`  
**Path:** Fiat on-ramp  
**Features:**
- Buy crypto with fiat
- Payment methods
- Quote comparison
- Transaction history

---

### 17. **Portfolio Analytics** (`activeTab === "analytics"`)
**Component:** `PortfolioAnalytics.tsx` or `AnalyticsDashboard.tsx`  
**Path:** Analytics dashboard  
**Features:**
- Performance charts
- P&L tracking
- Asset allocation
- Transaction analytics

---

### 18. **Portfolio Page** (`activeTab === "portfolio-page"`)
**Component:** `PortfolioPage.tsx`  
**Path:** Detailed portfolio view  
**Features:**
- Advanced portfolio analytics
- Multi-chain view
- Historical performance
- Export features

---

## 🛠️ Settings & Support

### 19. **Help Center** (`activeTab === "help"`)
**Component:** `HelpCenter.tsx`  
**Path:** Help & FAQ  
**Features:**
- Documentation
- FAQs
- Video tutorials
- Support contact

---

### 20. **Transaction History** (`activeTab === "history"`)
**Component:** `TransactionHistory.tsx`  
**Path:** All transactions  
**Features:**
- Complete transaction log
- Filtering/search
- Export transactions
- Transaction details

---

### 21. **Pro Features** (`activeTab === "pro-features"`)
**Component:** `ProFeaturesPage.tsx`  
**Path:** Premium features showcase  
**Features:**
- Feature comparison
- Subscription plans
- Upgrade flow
- Feature demos

---

## 🎨 Special Pages

### 22. **Auth Screen**
**Component:** `AuthScreen.tsx`  
**Path:** Login/Signup  
**Rendered:** Before authentication  
**Features:**
- Email/password login
- OAuth options
- Demo mode access
- Signup flow

---

### 23. **Splash Screen**
**Component:** `SplashScreen.tsx`  
**Path:** Initial load  
**Rendered:** On app startup  
**Features:**
- Loading animation
- Brand display

---

### 24. **Onboarding Flow**
**Component:** `GlassOnboarding.tsx`  
**Path:** New user onboarding  
**Rendered:** After signup  
**Features:**
- Wallet creation
- Easy/Advanced setup
- Seed phrase generation
- Guardian setup

---

### 25. **Tribe Assessment**
**Component:** `TribeAssessment.tsx`  
**Path:** Degen/Regen selection  
**Rendered:** For new users  
**Features:**
- Personality quiz
- Degen vs Regen
- Feature recommendations
- Theme selection

---

## 📱 Mobile-Only Views

### Recovery Page
**Component:** `RecoveryPage.tsx` (from `src/pages/`)  
**Path:** Account recovery  
**Features:**
- Guardian recovery
- Seed phrase recovery

---

## 🔀 Sub-Views & Nested Pages

### Add Guardian
**Component:** `AddGuardian.tsx`  
**Triggered from:** Vault management  

### Add Beneficiary
**Component:** `AddBeneficiary.tsx`  
**Triggered from:** Legacy vault  

### Vault Detail View
**Component:** `VaultDetailView.tsx`  
**Triggered from:** Vault list click  

### Token Detail
**Component:** `TokenDetail.tsx`  
**Triggered from:** Token list click  

---

## 📊 Summary

**Total Main Pages:** 21+ navigable pages  
**Plus:** 4 special flows (auth, onboarding, splash, tribe)  
**Plus:** 5+ sub-views/detail pages  

**Grand Total:** ~30 distinct user-facing pages/views

---

## 🗺️ Navigation Map

```
App Root
├── Splash Screen (initial)
├── Auth Screen (login/signup)
├── Tribe Assessment (new users)
├── Onboarding Flow (wallet setup)
│
└── Main App (after auth)
    │
    ├── Bottom Nav Pages:
    │   ├── Dashboard (home)
    │   ├── Portfolio
    │   ├── Trading
    │   ├── NFTs
    │   └── Tokens
    │
    ├── Degen Features:
    │   ├── DegenX Dashboard
    │   ├── Meme Terminal
    │   ├── Whale Tracker
    │   └── Airdrop Hunter
    │
    ├── Regen Features:
    │   ├── RegenX Dashboard
    │   ├── GuardianX Vault
    │   ├── Vault Management
    │   ├── Wallet Guard
    │   └── Security Center
    │
    ├── Financial:
    │   ├── DeFi Dashboard
    │   ├── Buy Page
    │   ├── Portfolio Analytics
    │   └── Transaction History
    │
    └── Settings/Support:
        ├── Help Center
        └── Pro Features
```

---

**Note:** This list represents pages with dedicated `activeTab` values or special rendering logic in `App.tsx`. Modals and overlays are separate components but not counted as "pages" in this list.


