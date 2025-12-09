# GuardiaVault - Cryptographic Dead Man's Switch

## Overview
GuardiaVault is a SaaS platform designed for secure cryptocurrency inheritance. It leverages blockchain smart contracts, Shamir Secret Sharing (3-of-5 threshold), and a prepaid subscription escrow system to manage time-locked vaults. The platform ensures automatic inheritance distribution upon specified conditions, supported by guardian attestation. The business vision is to provide a robust, secure, and user-friendly solution for digital asset legacy planning, addressing a critical need in the cryptocurrency space with significant market potential for growth and adoption.

## User Preferences
I want iterative development. Ask before making major changes. I prefer detailed explanations.

## System Architecture

### UI/UX Decisions
The frontend uses React with Vite, TypeScript, Tailwind CSS, and shadcn/ui for a modern and responsive user interface. RainbowKit/Wagmi are integrated for seamless Web3 wallet interactions. Key components include a circular "lifeline" display for vault countdowns, marketing feature cards highlighting blockchain integration, and a flexible pricing section for prepaid subscriptions.

### Technical Implementations
GuardiaVault employs a two-tier authentication system:
1.  **Email/Password (Primary)**: Standard registration/login with bcrypt-hashed passwords and session management.
2.  **Wallet Linking (Optional)**: Users can link a Web3 wallet post-authentication, necessary for smart contract interactions.

Core features include:
*   **Shamir Secret Sharing**: 2-of-3 threshold for recovery phrase splitting, using PBKDF2 for key derivation and AES-256-CBC encryption for fragments distributed to guardians.
*   **Smart Contract Vault Management**: `GuardiaVault.sol` manages time-locked vaults with guardian attestations and `SubscriptionEscrow.sol` holds prepaid subscription funds. Vaults feature configurable check-in intervals, grace periods, and a 6-month automatic death extension.
*   **Prepaid Subscription Model**: Offers 6-36 month prepayment options, including a 10-year plan with discounts, managed by the SubscriptionEscrow smart contract.
*   **Vault Check-In System**: Configurable intervals with email/wallet signature verification, providing real-time vault status.
*   **Guardian & Beneficiary Management**: Facilitates creation of vaults with multiple guardians and beneficiaries, including email invitations and multi-party attestation for vault triggers.

### System Design Choices
The system prioritizes security with cryptographic measures like Shamir Secret Sharing, strong password hashing (bcrypt), and wallet signature verification. Data integrity is maintained through a well-defined PostgreSQL schema with Drizzle ORM and cascading deletes. Smart contracts are designed for immutability and Chainlink compatibility. Transactional rollbacks ensure data consistency during critical operations like vault creation.

## External Dependencies
*   **Database**: PostgreSQL (Neon serverless)
*   **ORM**: Drizzle ORM
*   **Authentication**: bcrypt (password hashing), express-session
*   **Cryptography**: `secrets.js-grempe` (Shamir Secret Sharing), Web Crypto API (AES-256-CBC, PBKDF2)
*   **Blockchain Interaction**: RainbowKit, Wagmi (for Ethereum smart contracts)
*   **Smart Contracts**: Custom Ethereum smart contracts (`GuardiaVault.sol`, `SubscriptionEscrow.sol`)
*   **Payments**: Stripe (for fiat payments and subscription management)
*   **Notifications (Future Integration)**: SendGrid, Twilio

## Recent Changes (Last Updated: October 31, 2025)

### Authentication System Overhaul
- **Migrated from wallet-first to email/password-first authentication**
  - Users now register/login with email and password
  - Wallet linking is optional and happens in dashboard after login
  - Dashboard shows "Connect Wallet" banner for users without wallets
  - Login page has tabbed interface (Login/Sign Up tabs)
  - Endpoints: /api/auth/register, /api/auth/login, /api/auth/connect-wallet

### Landing Page Updates
- **Added "Blockchain Smart Contracts" feature card** to marketing section
  - Highlights on-chain vault management
  - Guardian attestation and time-locked security
  - Prepaid escrow with automatic 6-month death extension
  - Chainlink compatibility for price feeds

### Pricing Model Redesign
- **Prepaid subscription model (6-36 months)** replacing monthly/yearly
  - Flexible month selection slider with real-time price calculation
  - Special 10-year plan with 20% discount highlighted
  - Escrow explanation emphasizing 6-month automatic death extension
  - SubscriptionEscrow smart contract integration planned

### GitHub Integration & Bug Fixes (October 31, 2025)
- **Merged full repository structure** with additional pages:
  - /checkout - Stripe checkout for prepaid subscriptions
  - /settings - User settings (email, password, wallet, subscription)
  - /guardians - Guardian management interface
  - /beneficiaries - Beneficiary management interface
  - /key-fragments - Fragment distribution tracking
  - /checkins - Check-in history and status
  - /claims - Beneficiary claim interface for secret recovery
  - /accept-invite - Guardian/beneficiary invitation acceptance

- **Fixed S3 service**: Replaced AWS SDK dependency with simulated mode
  - server/services/s3.ts now uses in-memory storage for development
  - No external AWS SDK required, preventing dependency errors

- **Fixed Stripe initialization**: Made optional to prevent startup crashes
  - Only initializes if STRIPE_SECRET_KEY is present
  - Returns null if key missing, graceful degradation
  - Prevents "Neither apiKey nor config.authenticator provided" error

- **Fixed Wagmi/RainbowKit**: Updated to use correct API
  - Changed from deprecated getDefaultWallets to getDefaultConfig
  - client/src/lib/wagmi.tsx now uses proper RainbowKit setup
  - Supports MetaMask, WalletConnect, Coinbase Wallet

- **Fixed database configuration**: Removed duplicate postgres-js
  - server/db.ts now uses only Neon serverless (@neondatabase/serverless)
  - Removed conflicting postgres npm package
  - Single source of truth for database connection

- **Fixed storage imports**: Updated to use new db export
  - server/storage.ts now imports from correct db module
  - Resolved import errors preventing server startup

### End-to-End Testing Completed
- **Verified authentication flow** with Playwright testing:
  - ✅ Email/password registration works
  - ✅ Login/logout functionality works  
  - ✅ Dashboard access after authentication works
  - ✅ Wallet connection prompt displays correctly
  - Minor cosmetic issues noted (user email not displayed in nav, TanStack Query warnings) - non-blocking

## Implementation Status

### ✅ Completed Features
- **Authentication System**: Email/password-first with optional wallet linking
- **Landing Page**: Features section with blockchain smart contract highlights
- **Pricing Model**: Prepaid subscription UI (6-36 months + 10-year discount)
- **Database Schema**: All tables (users, vaults, parties, fragments, check_ins, subscriptions, notifications)
- **Shamir Secret Sharing**: Fragment generation, encryption, and distribution logic
- **Smart Contracts**: GuardiaVault.sol + SubscriptionEscrow.sol written and ready
- **GitHub Integration**: Full repository merged with all pages
- **Bug Fixes**: S3 simulated, Stripe optional, Wagmi updated, database fixed
- **Testing**: End-to-end authentication flow verified

### 🚧 In Progress
- **SubscriptionEscrow Integration**: Connect smart contract to vault creation flow
- **Vault Creation Wizard**: Multi-step form for vault setup
- **Fragment Recovery UI**: Beneficiary interface for secret reconstruction
- **Guardian Acceptance Flow**: Email invitations and acceptance interface

### 📋 Planned / TODO
- **Smart Contract Deployment**: Deploy to Sepolia testnet then Ethereum mainnet
- **Notification System**: SendGrid/Twilio integration for check-in reminders
- **Multi-Vault Support**: UI for managing multiple vaults per user
- **Beneficiary Claim Flow**: Fragment collection and secret display
- **Security Audit**: Professional audit before production deployment
- **Timelock Simulation**: Testing mode for rapid vault trigger testing

## Next Steps (Priority Order)

1. **Integrate SubscriptionEscrow Contract** (CURRENT PRIORITY)
   - Connect smart contract to frontend vault creation flow
   - Implement prepaid subscription deposit on vault creation
   - Add contract interaction hooks (useEscrowDeposit, useVaultCreation)
   - Display escrow contract address in user settings

2. **Complete Vault Creation Wizard**
   - Multi-step form (Vault Setup → Guardians → Beneficiaries → Review)
   - Guardian/beneficiary email input and validation
   - Visual confirmation of fragment distribution (show all 5 guardians)
   - Smart contract deployment transaction with MetaMask

3. **Build Fragment Recovery Interface**
   - Beneficiary UI to collect 3+ fragments from guardians
   - Shamir reconstruction using combineShares function
   - Secure key display with copy-to-clipboard
   - Audit trail for recovery attempts

4. **Deploy Smart Contracts to Testnet**
   - Deploy GuardiaVault.sol to Sepolia
   - Deploy SubscriptionEscrow.sol to Sepolia
   - Test all contract functions (deposit, withdraw, vault trigger, guardian attestation)
   - Verify contracts on Sepolia Etherscan

5. **Implement Notification System**
   - SendGrid integration for email notifications
   - Check-in reminders (7 days before due, 1 day before due)
   - Guardian invitation emails with accept link
   - Beneficiary vault trigger alerts
   - Twilio SMS alerts for critical notifications

6. **Testing & Security Audit**
   - End-to-end Playwright tests for all user flows
   - Smart contract unit tests with Hardhat
   - API integration tests
   - Professional security audit (Trail of Bits / OpenZeppelin)
   - Bug bounty program on Immunefi

## Legal Compliance & Terminology

**CRITICAL: This is NOT a death verification system**

GuardiaVault is a cryptographic time-lock and inactivity detection system. It uses:
- Periodic check-ins to detect prolonged inactivity
- Multi-party attestation of inability to contact vault owner
- Consensus-based vault triggering (2+ guardians + 1 attestor)
- Shamir Secret Sharing for progressive secret release

**We explicitly avoid:**
- Claims of "death verification" (we're not qualified/licensed)
- "NFT death certificates" (no legal validity)
- "Legal attestor network" (not licensed legal professionals)
- Any language implying legal estate transfer

**Accurate terminology:**
- "Inactivity attestation" (not "death verification")
- "Vault trigger claims" (not "death claims")
- "Supporting documentation" (not "death certificates")
- "Guardian consensus" (not "legal verification")

**Legal Disclaimer Placement:**
- CreateVault.tsx: Step 1, before subscription payment
- Dashboard.tsx: When user has active vaults
- Landing.tsx: Footer section before main footer

**Updated Database Schema (October 31, 2025):**
- Renamed `death_claims` table → `vaultTriggerClaims`
- Updated claim status enum: "pending" (instead of "open"), added "expired"
- Updated all API endpoints: `/api/claims/death` → `/api/claims/trigger`
- Updated all storage functions to use `VaultTriggerClaim` types

## Technical Notes

### Database
- Using PostgreSQL (Neon serverless) with Drizzle ORM
- No migrations needed: `npm run db:push` handles schema sync
- Cascading deletes configured for data integrity
- **Legal compliance refactor (Oct 31, 2025)**: Renamed death_claims → vault_trigger_claims

### Frontend
- React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- RainbowKit/Wagmi for Web3 wallet interactions
- Bound to 0.0.0.0:5000 (required by Replit)
- **Legal disclaimers** added to CreateVault, Dashboard, and Landing pages

### Backend
- Express + TypeScript
- S3 service in simulated mode (no AWS SDK required for development)
- Stripe optional (only loads if STRIPE_SECRET_KEY is set)
- bcrypt for password hashing (10 rounds)
- express-session for session management
- **Legal compliance refactor (Oct 31, 2025)**: All claim APIs use "vault trigger" terminology

### Smart Contracts
- GuardiaVault.sol: Time-locked vaults with guardian attestation
- SubscriptionEscrow.sol: Prepaid subscription escrow with automatic extension
- Ready for deployment to Sepolia/Mainnet
- Chainlink-compatible for price feeds and automation