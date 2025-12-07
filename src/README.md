# Paradex - Dual-Identity Crypto Wallet

> **Two Worlds. One Platform.**

Paradex is a next-generation cryptocurrency wallet that embraces the dual nature of crypto culture: **Degen** (high-risk traders) and **Regen** (long-term builders). Built with React, TypeScript, and WebGL shaders for a stunning metallic chrome aesthetic.

## ✨ Features

### 🔥 Degen Mode (High-Risk Traders)
- **Leverage Trading** - Up to 100x leverage positions
- **Sniper Bot** - Lightning-fast token sniping
- **Flash Loans** - Instant uncollateralized loans
- **Meme Alerts** - Real-time meme coin notifications
- **Ape Mode** - One-click maximum risk trades
- **Degen Leaderboard** - Compete with top traders
- **Portfolio Tracker** - Real-time P&L analytics

### 💎 Regen Mode (Long-term Builders)
- **Wallet Guard** - Active malicious contract protection
- **Inheritance Platform** - GuardianX Legacy Vault
- **MEV Protection** - Anti-extraction shield
- **Panic Mode** - Emergency asset evacuation
- **Social Recovery** - Seedless guardian-based recovery
- **Privacy Shield** - Transaction obfuscation
- **DeFi Dashboard** - Yield aggregation & auto-compounding
- **Portfolio Analytics** - Wealth tracking & tax reporting

### 🛡️ Guardian Portal
Standalone web portal for wallet guardians:
- Accept/decline guardian invitations (no app download needed)
- Approve or reject recovery requests
- Access recovery keys when needed
- View protected wallet status
- Email-based tokenized access

## 🎨 Design

### Aesthetic
- **Metallic Chrome** - Gradient text effects with reflective surfaces
- **Glassmorphism** - Frosted glass cards with backdrop blur
- **WebGL Shaders** - Real-time particle effects and 3D tunnels
- **Tribe Colors** - Crimson red (#DC143C) for Degen, Electric blue (#00ADEF) for Regen

### Typography
- **Font**: Rajdhani (Google Fonts)
- **Style**: Bold, uppercase, tech-forward
- **Weights**: 500 (regular), 700 (bold), 900 (black)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/paradex.git
cd paradex

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Build for Production

```bash
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
/
├── App.tsx                    # Main application logic
├── AppRouter.tsx              # Routing configuration
├── /components/
│   ├── GuardianPortal.tsx    # Standalone guardian portal
│   ├── PrivacyPolicy.tsx     # Legal: Privacy policy
│   ├── TermsOfService.tsx    # Legal: Terms of service
│   ├── TunnelLanding.tsx     # 3D tunnel with feature cards
│   ├── GlassOnboarding.tsx   # Wallet creation flow
│   ├── WalletEntry.tsx       # Landing page
│   ├── DashboardNew.tsx      # Main dashboard
│   └── ...
├── /data/
│   ├── degenSlides.ts        # Degen feature cards
│   └── regenSlides.ts        # Regen feature cards
└── /styles/
    └── globals.css           # Global styles & variables
```

## 🛣️ Routes

| Route | Description |
|-------|-------------|
| `/` | Main application (splash → wallet entry → onboarding → dashboard) |
| `/guardian` | Guardian portal (tokenized access via `?token=xxx`) |
| `/privacy` | Privacy policy (App Store requirement) |
| `/terms` | Terms of service (App Store requirement) |

## 🎮 User Flows

### New User (Create Wallet)
1. **Splash Screen** - Paradex logo animation
2. **Wallet Entry** - Click "Create Wallet"
3. **Onboarding** - 8-step setup process
   - Choose Easy (seed phrase) or Advanced (guardians)
   - Enter personal info & verification
   - Set up security (password, biometrics)
4. **Tribe Selection** - Choose Degen or Regen
5. **Tunnel Landing** - Explore features in 3D tunnel
6. **Assessment** (optional) - Personality quiz
7. **Dashboard** - Access full wallet features

### Returning User (Import Wallet)
1. **Splash Screen**
2. **Wallet Entry** - Click "Import Wallet"
3. **Login** - Email & password
4. **Dashboard** - Direct access

### Guardian Experience
1. Receive email with unique link
2. Click link → Guardian Portal
3. Accept or decline invitation
4. View dashboard when wallet is safe
5. Approve/reject recovery when needed

## 🔐 Security

### Client-Side Security
- ✅ Zero-knowledge architecture (no server-side key storage)
- ✅ BIP39 seed phrase generation
- ✅ BIP32 hierarchical deterministic wallets
- ✅ Biometric authentication (Face ID/Touch ID)
- ✅ Secure enclave for cryptographic operations

### Guardian Recovery
- ✅ Multi-sig approval system (e.g., 2-of-3 guardians)
- ✅ Time-locked recovery periods
- ✅ No single point of failure
- ✅ Email-based tokenized access (no passwords)

### Legal Compliance
- ✅ GDPR-compliant data handling
- ✅ CCPA user rights support
- ✅ Privacy policy & Terms of service
- ✅ Age restrictions (18+)
- ✅ Clear financial risk disclaimers

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Utility-first CSS
- **Motion** (formerly Framer Motion) - Animations

### Graphics & 3D
- **WebGL** - Custom shaders for effects
- **Three.js** - 3D tunnel scene
- **GLSL** - Shader programming

### Routing & State
- **React Router** - Client-side routing
- **React Hooks** - State management

### Icons & UI
- **Lucide React** - Icon library
- **Google Fonts** - Rajdhani typography

## 📱 App Store Deployment

### Requirements Checklist
- [x] Privacy Policy at `/privacy`
- [x] Terms of Service at `/terms`
- [x] Legal links in app footer
- [x] Data collection disclosure
- [x] User rights policy
- [ ] App Store screenshots
- [ ] App Store description
- [ ] Age rating (17+ for crypto)

### Apple App Store
1. Build production version
2. Upload to App Store Connect
3. Add Privacy Policy URL: `https://paradex.io/privacy`
4. Add Terms of Service URL: `https://paradex.io/terms`
5. Complete "App Privacy" section
6. Set age rating: 17+
7. Add financial risk disclaimers

### Google Play Store
1. Build production version
2. Upload to Play Console
3. Add Privacy Policy URL
4. Complete "Data safety" section
5. Complete IARC content rating
6. Add crypto trading disclaimers

## 🧪 Testing

```bash
# Unit tests (coming soon)
npm run test

# E2E tests (coming soon)
npm run test:e2e

# Type checking
npm run type-check

# Lint
npm run lint
```

## 📚 Documentation

- [Integration Guide](./INTEGRATION_GUIDE.md) - Detailed component documentation
- [Architecture](./ARCHITECTURE.md) - System design & data flow
- [API Reference](./API.md) - Backend API endpoints (coming soon)

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## 📧 Contact

- **Website**: https://paradex.io
- **Email**: dev@paradex.io
- **Legal**: legal@paradex.io
- **Privacy**: privacy@paradex.io
- **Support**: support@paradex.io

## 🙏 Acknowledgments

- Inspired by the dual nature of crypto culture
- Shader effects inspired by Shadertoy community
- Icons by Lucide
- Typography by Google Fonts (Rajdhani)

---

**Built with ❤️ by the Paradex team**

*Two Worlds. One Platform. Choose Your Path.*
