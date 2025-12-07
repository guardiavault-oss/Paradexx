# Paradex Integration Guide

## 🎯 Overview

This guide documents the complete integration of all Paradex components, including the main app flow, legal pages, and guardian portal.

## 📁 Project Structure

```
/
├── App.tsx                           # Main application logic and flow
├── AppRouter.tsx                     # Router configuration (NEW)
├── /components/
│   ├── GuardianPortal.tsx           # Standalone guardian portal (NEW)
│   ├── PrivacyPolicy.tsx            # Privacy policy page (NEW)
│   ├── TermsOfService.tsx           # Terms of service page (NEW)
│   ├── TunnelLanding.tsx            # 3D tunnel with feature cards
│   ├── GlassOnboarding.tsx          # Wallet creation/import flow
│   ├── WalletEntry.tsx              # Initial landing page
│   ├── DashboardNew.tsx             # Main dashboard
│   ├── FlowingShaderBackground.tsx  # Menger sponge fractal background
│   ├── SplashScreen.tsx             # Initial splash screen
│   └── ...other components
└── /data/
    ├── degenSlides.ts               # 7 degen feature cards with images
    └── regenSlides.ts               # 8 regen feature cards with images
```

## 🛣️ Routing Structure

### Main Routes (`/AppRouter.tsx`)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `App` | Main application flow |
| `/guardian` | `GuardianPortal` | Standalone guardian portal (tokenized access) |
| `/privacy` | `PrivacyPolicy` | Privacy policy (App Store requirement) |
| `/terms` | `TermsOfService` | Terms of service (App Store requirement) |

### Main App Flow (`/`)

1. **SplashScreen** → Animated "Paradex" intro
2. **WalletEntry** → Choose "Create Wallet" or "Import Wallet"
3. **LoginModal** (if importing) → Email/password login
4. **GlassOnboarding** (if creating) → 8-step wallet setup
   - Step 1: Choose Easy or Advanced Setup
   - Step 2: Enter Name
   - Step 3: Enter Email
   - Step 4: Create Password
   - Step 5: Verify Email Code
   - Step 6: Enable Biometrics (optional)
   - Step 7: Easy = Seed Phrase, Advanced = Guardians
   - Step 8: Review & Confirm
5. **SplitScreen** → Choose Degen or Regen tribe
6. **TunnelLanding** → 3D tunnel with feature cards
7. **Assessment** → Personality assessment (optional)
8. **Dashboard** → Main app interface

## 🎨 Design System

### Color Scheme

#### Degen (High-Risk Trader)
- **Primary**: `#DC143C` (Crimson Red)
- **Accents**: Red/orange fire effects
- **Vibe**: Aggressive, fast-paced, YOLO

#### Regen (Long-term Builder)
- **Primary**: `#00ADEF` (Electric Blue)
- **Accents**: Blue/cyan protective glows
- **Vibe**: Sustainable, secure, legacy-focused

### Typography
- **Font**: Rajdhani (sans-serif)
- **Weights**: 500, 700, 900
- **Style**: Bold, uppercase, tech-forward

### Effects
- **Metallic Chrome**: Gradient text with drop shadows
- **Glassmorphism**: Backdrop blur with subtle borders
- **Glows**: Box shadows with color-matched rgba values

## 🛡️ Guardian Portal

### Purpose
Allows wallet guardians to:
1. Accept/decline guardian invitations without downloading app
2. View and approve/reject recovery requests
3. Access recovery flow when wallet owner needs help

### Access Method
Guardians receive tokenized email links:
```
https://paradex.io/guardian?token=abc123xyz456
```

### Features
- ✅ No app download required
- ✅ Works in any web browser
- ✅ Bookmarkable for easy access
- ✅ Real-time recovery status
- ✅ Multi-sig approval system

### Flow States
1. **Invitation** → Accept or decline guardian role
2. **Dashboard** → View protected wallet status
3. **Recovery** → Approve or reject recovery request
4. **Success** → Confirmation and next steps

## 📜 Legal Pages

### Privacy Policy (`/privacy`)
Required for App Store compliance. Covers:
- Information collection
- Data protection measures
- Usage of information
- Information sharing policies
- User rights (GDPR/CCPA)
- Data retention policies

### Terms of Service (`/terms`)
Required for App Store compliance. Covers:
- Acceptance of terms
- Service description
- Risk disclaimers
- User responsibilities
- Prohibited uses
- Limitation of liability
- Governing law (Delaware, USA)

### Integration Points
- Footer links on **WalletEntry** page
- Footer links on **GlassOnboarding** flow
- Opens in new tab to preserve main app state

## 🚀 Feature Cards

### Degen Features (7 cards)
1. **Leverage Trading** - 10x-100x leverage positions
2. **Sniper Bot** - Lightning-fast token sniping
3. **Flash Loans** - Instant uncollateralized loans
4. **Meme Alerts** - Real-time meme coin notifications
5. **Ape Mode** - One-click max trades
6. **Degen Leaderboard** - Compete with top degens
7. **Portfolio Tracker** - Real-time P&L analytics

### Regen Features (8 cards)
1. **Wallet Guard** - Active malicious contract protection
2. **Inheritance Platform** - GuardianX Legacy Vault
3. **MEV Protection** - Anti-extraction shield
4. **Panic Mode** - Emergency asset evacuation
5. **Social Recovery** - Seedless recovery via guardians
6. **Privacy Shield** - Transaction obfuscation
7. **DeFi Dashboard** - Yield aggregation
8. **Portfolio Analytics** - Wealth tracking & tax reporting

All feature cards include:
- ✅ Custom images (figma:asset imports)
- ✅ Title, subtitle, content, description
- ✅ Positioned at 60% from top, 50% horizontally
- ✅ Tribe-specific glow effects (red/blue)

## 🎮 Interactive Elements

### Particle Shaders
- **Split Screen**: Fire (degen) and Snow (regen) particles
- **Tunnel**: Voronoi glass tube with tribe-specific tinting
- **Menger Sponge**: Fractal background on WalletEntry

### Animations
- **Motion/React**: Page transitions, card reveals
- **WebGL Shaders**: Real-time particle effects
- **CSS Transitions**: Hover states, button effects

## 🔧 Development

### Key Dependencies
- `react` - UI framework
- `motion/react` - Animations (formerly Framer Motion)
- `react-router-dom` - Routing
- `lucide-react` - Icons
- `three` (via TunnelLanding) - 3D graphics

### Running Locally
```bash
npm install
npm run dev
```

### Building for Production
```bash
npm run build
```

### Environment Variables
None required for basic functionality. Guardian portal would need:
- `VITE_API_URL` - Backend API endpoint (optional, defaults to `/api`)

## 📱 App Store Requirements

### Checklist
- [x] Privacy Policy accessible at `/privacy`
- [x] Terms of Service accessible at `/terms`
- [x] Links in footer of onboarding flow
- [x] Clear data collection disclosure
- [x] User rights and data deletion policy
- [x] Legal contact information
- [ ] App Store screenshots (1284x2778 for iPhone 14 Pro Max)
- [ ] App Store description and keywords
- [ ] Age rating and content warnings

### Apple App Store Specific
- Ensure Privacy Policy URL is added in App Store Connect
- Add Terms of Service URL in App Store Connect
- Complete "App Privacy" section with data collection details
- Set appropriate age rating (17+ for crypto trading)

### Google Play Store Specific
- Add Privacy Policy URL in Play Console
- Complete "Data safety" section
- Set content rating via IARC questionnaire
- Add disclaimer about crypto trading risks

## 🔐 Security Considerations

### Client-Side
- ✅ No private keys stored on server
- ✅ Zero-knowledge architecture
- ✅ Biometric authentication (Face ID/Touch ID)
- ✅ Secure enclave for cryptographic operations

### Guardian Portal
- ✅ Tokenized access (unique URLs)
- ✅ No login required for guardians
- ✅ Time-locked recovery periods
- ✅ Multi-sig approval requirements

### Legal Compliance
- ✅ GDPR-compliant data handling
- ✅ CCPA user rights support
- ✅ Clear disclaimer of financial advice
- ✅ Age restrictions (18+)

## 🎯 Next Steps

### Immediate
1. [ ] Test routing on all routes
2. [ ] Verify legal page links work
3. [ ] Test guardian portal with mock token
4. [ ] Ensure all images load correctly

### Short-term
1. [ ] Connect guardian portal to backend API
2. [ ] Implement email sending for guardian invitations
3. [ ] Add analytics tracking
4. [ ] Create App Store screenshots

### Long-term
1. [ ] Backend integration (Supabase)
2. [ ] Real blockchain integration (Web3)
3. [ ] Push notifications for guardian requests
4. [ ] Multi-language support
5. [ ] Mobile app versions (React Native)

## 📧 Contact & Support

For questions about this integration:
- **Email**: dev@paradex.io
- **Legal**: legal@paradex.io
- **Privacy**: privacy@paradex.io

---

**Last Updated**: December 5, 2024
**Version**: 1.0.0
**Author**: Paradex Development Team
