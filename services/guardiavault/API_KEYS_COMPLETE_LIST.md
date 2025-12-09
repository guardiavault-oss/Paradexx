# Complete API Keys List for 100% Full Functionality

This document lists **ALL** API keys and credentials required for full GuardiaVault platform functionality.

---

## 🔴 CRITICAL - Core Functionality (Required)

### Database
- **DATABASE_URL** - PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Required for: All data storage

### Security Keys
- **SESSION_SECRET** - Session encryption key
  - Generate: `openssl rand -base64 32`
  - Required for: User sessions and authentication

- **SSN_SALT** - Salt for SSN hashing
  - Generate: `openssl rand -hex 16`
  - Required for: Social Security Number encryption

- **ENCRYPTION_KEY** - AES-256-GCM encryption key
  - Generate: `openssl rand -hex 32` (64 hex characters)
  - Required for: Sensitive data encryption

- **WIZARD_ENCRYPTION_KEY** - Wizard state encryption
  - Generate: `openssl rand -hex 32` (64 hex characters)
  - Required for: Will wizard state encryption

- **NOTIFY_HMAC_SECRET** - HMAC secret for notification tokens
  - Generate: `openssl rand -base64 32`
  - Required for: Guardian invitation tokens

---

## 📧 EMAIL SERVICE (Required for Notifications)

### SendGrid (Recommended)
- **SENDGRID_API_KEY** - SendGrid API key
  - Get from: https://sendgrid.com → Settings → API Keys → Create API Key
  - Free tier: 100 emails/day
  - Required for: Email notifications, guardian invitations, check-in reminders

- **SENDGRID_FROM_EMAIL** - Verified sender email address
  - Must be verified in SendGrid dashboard
  - Format: `noreply@yourdomain.com`

### SMTP Alternative (If not using SendGrid)
- **SMTP_HOST** - SMTP server hostname
- **SMTP_PORT** - SMTP port (587 for TLS, 465 for SSL)
- **SMTP_USER** - SMTP username
- **SMTP_PASS** - SMTP password
- **SMTP_FROM** - Sender email address

---

## 📱 SMS SERVICE (Required for SMS Notifications)

### Twilio
- **TWILIO_ACCOUNT_SID** - Twilio Account SID
  - Get from: https://www.twilio.com/try-twilio
  - Found in: Twilio Console → Account Summary

- **TWILIO_AUTH_TOKEN** - Twilio Auth Token
  - Found in: Twilio Console → Account → API Keys

- **TWILIO_PHONE_NUMBER** - Twilio phone number
  - Format: `+1234567890` (with country code)
  - Get from: Twilio Console → Phone Numbers → Buy a Number

- **TWILIO_MESSAGING_SERVICE_SID** (Optional) - Alternative to phone number
  - Use if using Twilio Messaging Service instead of single number

---

## 💳 PAYMENT PROCESSING (Required for Subscriptions)

### Stripe
- **STRIPE_SECRET_KEY** - Stripe Secret Key
  - Get from: https://dashboard.stripe.com/apikeys
  - Test: `sk_test_...`
  - Production: `sk_live_...`
  - Required for: Subscription payments, referral rewards

- **STRIPE_PUBLISHABLE_KEY** (Optional) - Stripe Publishable Key
  - For future Stripe Elements integration
  - Found in: Same page as secret key

- **STRIPE_PRICE_SOLO** (Optional) - Solo plan price ID
- **STRIPE_PRICE_FAMILY** (Optional) - Family plan price ID
- **STRIPE_PRICE_PRO** (Optional) - Pro plan price ID
  - Get from: Stripe Dashboard → Products → Prices

---

## ⛓️ BLOCKCHAIN / WEB3 (Required for Smart Contracts)

### RPC Providers
- **SEPOLIA_RPC_URL** - Sepolia testnet RPC URL
  - Format: `https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID`
  - Or: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`
  - Get from: https://infura.io or https://alchemy.com
  - Required for: Testnet contract interactions

- **VITE_SEPOLIA_RPC_URL** - Frontend Sepolia RPC URL
  - Same as above, but for client-side usage

- **MAINNET_RPC_URL** - Ethereum mainnet RPC URL
  - Format: `https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
  - Required for: Production yield protocols (Lido, Aave)

### Blockchain Services
- **VITE_WALLETCONNECT_PROJECT_ID** - WalletConnect/Reown Project ID
  - Get from: https://cloud.reown.com (formerly WalletConnect Cloud)
  - Free tier available
  - Required for: Wallet connections (MetaMask, Coinbase Wallet, etc.)

- **ETHERSCAN_API_KEY** - Etherscan API key
  - Get from: https://etherscan.io/apis
  - Free tier available
  - Required for: Contract verification

- **VITE_ALCHEMY_API_KEY** - Alchemy API key
  - Get from: https://www.alchemy.com/
  - Free tier: 300M compute units/month
  - Required for: NFT fetching across multiple chains (Ethereum, Polygon, Arbitrum, Optimism, Base)

### Contract Deployment
- **PRIVATE_KEY** - Private key for contract deployment
  - Format: `0x` followed by 64 hex characters
  - ⚠️ **SECURITY WARNING**: Keep this secure! Never commit to git!
  - Required for: Contract deployment and transactions

### Contract Addresses (After Deployment)
- **VITE_GUARDIA_VAULT_ADDRESS** - Main GuardiaVault contract address
- **YIELD_VAULT_ADDRESS** - YieldVault contract address
- **LIDO_ADAPTER_ADDRESS** - Lido adapter contract address
- **AAVE_ADAPTER_ADDRESS** - Aave adapter contract address
- **VITE_ESCROW_CONTRACT_ADDRESS** - Subscription escrow contract address
- **VITE_LIFETIME_ACCESS_ADDRESS** - Lifetime access contract address
- **TREASURY_ADDRESS** - Treasury address for fee collection

### Network Configuration
- **VITE_CHAIN_ID** - Blockchain network ID
  - `31337` = Hardhat (local)
  - `11155111` = Sepolia (testnet)
  - `1` = Ethereum Mainnet (production)

---

## 🤖 AI SERVICE (Optional - for AI Optimizer)

### OpenAI
- **OPENAI_API_KEY** - OpenAI API key
  - Get from: https://platform.openai.com/api-keys
  - Required for: AI-powered yield strategy recommendations
  - Fallback: System uses rule-based recommendations if not set

- **OPENAI_MODEL** (Optional) - OpenAI model to use
  - Default: `gpt-4o-mini`
  - Options: `gpt-4o-mini`, `gpt-4`, `gpt-3.5-turbo`

---

## 📊 YIELD GENERATION (Required for Yield Features)

### Yield Protocols
The system integrates with these DeFi protocols (no API keys needed, but requires RPC URLs):

#### Lido - ETH Liquid Staking ✅ (Fully Integrated)
- **Description**: Liquid staking protocol for Ethereum. Stake ETH and receive stETH (staked ETH) tokens that accrue rewards.
- **Supported Asset**: ETH
- **Typical APY**: ~5.2% (varies with network staking rewards)
- **Mainnet Contract**: `0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84`
- **stETH Token**: `0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84`
- **API Endpoint**: `https://api.lido.fi/v1/steth/apr` (public, no key needed)
- **Stats API**: `https://api.lido.fi/v1/steth/stats` (public, no key needed)
- **Features**: 
  - Liquid staking (receive stETH immediately)
  - Rebasing token (balance increases automatically)
  - No lock-up period
  - Can be unstaked via withdrawal queue

#### Aave V3 - Token Lending ✅ (Fully Integrated)
- **Description**: Decentralized lending protocol. Supply tokens and earn interest via aTokens.
- **Supported Assets**: USDC, ETH, DAI, USDT, WETH
- **Typical APY**: 
  - USDC: ~4.1%
  - ETH: ~3.8%
  - DAI: ~3.6%
- **Mainnet Contracts**:
  - Pool: `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`
  - USDC: `0xA0b86A33e6441B8435b662303c4B5C5B7B8e4E8a`
  - USDT: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
  - DAI: `0x6B175474E89094C44Da98b954EedeAC495271d0F`
  - WETH: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
- **API Endpoint**: `https://aave-api-v3.aave.com/data/pools` (public, no key needed)
- **Alternative API**: `https://api.aave.com/v3/protocol-data` (public, no key needed)
- **Features**:
  - Supply liquidity and earn interest
  - aTokens automatically accrue interest
  - Instant withdrawals (if liquidity available)
  - Multiple asset support

#### Compound - Token Lending 🔄 (Ready for Integration)
- **Description**: Decentralized lending protocol similar to Aave.
- **Supported Assets**: USDC, ETH, DAI (planned)
- **Typical APY**: ~3.5% (varies by asset)
- **API Endpoint**: `https://api.compound.finance/api/v2/ctoken` (public, no key needed)
- **Status**: Code structure ready, API integration pending
- **Features**: 
  - Supply tokens and earn cTokens
  - Interest accrues in token balance
  - Multiple asset support

#### Yearn - Yield Aggregation 🔄 (Ready for Integration)
- **Description**: Automated yield farming and aggregation protocol.
- **Supported Assets**: USDC, ETH, DAI (planned)
- **Typical APY**: ~4.5% (varies by vault strategy)
- **API Endpoint**: `https://api.yearn.finance/v1/chains/1/vaults/all` (public, no key needed)
- **Status**: Code structure ready, API integration pending
- **Features**:
  - Automated strategy optimization
  - Vault-based yield farming
  - Multiple asset support

#### Curve - Stablecoin Yield 🔄 (Ready for Integration)
- **Description**: Stablecoin liquidity pools with yield generation.
- **Supported Assets**: USDC, USDT, DAI (stablecoins)
- **Typical APY**: ~4.0% (varies by pool)
- **API Endpoint**: Varies by pool (public, no key needed)
- **Status**: Code structure ready, API integration pending
- **Features**:
  - Stablecoin-focused pools
  - Low slippage swaps
  - Yield from trading fees

### Protocol Data Sources & APIs

#### Real-Time APY Data (Public APIs - No Keys Required)
- **Lido APY API**: `https://api.lido.fi/v1/steth/apr`
  - Returns: Current APR and SMA APR
  - Update frequency: Real-time
  - Cache: 5 minutes (system default)

- **Aave V3 Pool Data API**: `https://aave-api-v3.aave.com/data/pools`
  - Returns: Reserve data with liquidity rates for all assets
  - Update frequency: Real-time
  - Cache: 5 minutes (system default)

- **Aave Protocol Data API**: `https://api.aave.com/v3/protocol-data`
  - Alternative endpoint for Aave data
  - Returns: Comprehensive protocol statistics

- **Compound API**: `https://api.compound.finance/api/v2/ctoken`
  - Returns: cToken data with supply/borrow rates
  - Status: Ready for integration

- **Yearn API**: `https://api.yearn.finance/v1/chains/1/vaults/all`
  - Returns: All Yearn vault data with APY
  - Status: Ready for integration

- **Curve API**: Varies by pool
  - Returns: Pool-specific APY data
  - Status: Ready for integration

### Configuration Requirements

**Required Environment Variables:**
- `MAINNET_RPC_URL` - Ethereum mainnet RPC URL (for production yield protocols)
- `LIDO_ADAPTER_ADDRESS` - Deployed Lido adapter contract address
- `AAVE_ADAPTER_ADDRESS` - Deployed Aave adapter contract address
- `YIELD_VAULT_ADDRESS` - Deployed YieldVault contract address

**Optional (for automated yield updates):**
- `KEEPER_PRIVATE_KEY` - Private key for automated yield update transactions
- `KEEPER_SECRET` - Secret for keeper API authentication

**Note**: 
- Yield protocols use on-chain smart contracts. Only RPC URLs are needed for interaction.
- All protocol APIs are public and require no authentication.
- APY data is cached for 5 minutes to reduce API calls.
- System falls back to contract queries if APIs are unavailable.

---

## 💀 DEATH VERIFICATION (Optional - for Death Monitoring)

### SSDI (Social Security Death Index) Monitoring
- **SSDI_API_KEY** - GenealogyBank/FamilySearch/Ancestry API key
  - Get from: GenealogyBank, FamilySearch, or Ancestry.com
  - Required for: SSDI record monitoring

- **SSDI_API_URL** - SSDI API endpoint
  - Default: `https://api.genealogybank.com/ssdi`

- **FAMILYSEARCH_API_KEY** (Optional) - FamilySearch API key
  - Alternative SSDI provider

- **SSDI_BATCH_SIZE** (Optional) - Batch size for SSDI queries
  - Default: `1000`

### Obituary Services
- **LEGACY_API_KEY** - Legacy.com API key
  - Get from: Legacy.com API
  - Required for: Obituary search

- **LEGACY_API_URL** - Legacy API endpoint
  - Default: `https://api.legacy.com/v1/obituaries`

- **FINDAGRAVE_API_KEY** - FindAGrave API key
  - Get from: FindAGrave API
  - Required for: Obituary search

- **OBITUARY_ENABLED** - Enable obituary scraping
  - Default: `true`

### Death Certificate Services
- **VITALCHEK_API_KEY** - VitalChek API key
  - Get from: VitalChek API
  - Required for: Death certificate verification

- **VITALCHEK_API_URL** - VitalChek API endpoint
  - Default: `https://api.vitalchek.com/v1`

- **VITALCHEK_WEBHOOK_SECRET** - Webhook secret for VitalChek
  - Required for: Webhook verification

### State Vital Records (Optional - State-Specific)
- **CA_VITAL_RECORDS_API** - California vital records API URL
  - Format: `https://api.cdph.ca.gov/vital-records`

- **CA_VITAL_RECORDS_KEY** - California API key
  - Get from: California Department of Public Health

- **TX_VITAL_RECORDS_API** - Texas vital records API URL
  - Format: `https://api.dshs.texas.gov/vs`

- **TX_VITAL_RECORDS_KEY** - Texas API key
  - Get from: Texas Department of State Health Services

### Death Verification Configuration
- **DEATH_VERIFICATION_ENABLED** - Enable death verification system
  - Default: `false`
  - Set to `true` to enable monitoring

- **DEATH_VERIFICATION_MIN_CONFIDENCE** - Minimum confidence score
  - Default: `0.7` (70%)
  - Range: `0.0` to `1.0`

- **DEATH_VERIFICATION_MIN_SOURCES** - Minimum independent sources
  - Default: `2`
  - Required for: Consensus-based death verification

---

## 🔔 ADDITIONAL NOTIFICATIONS (Optional)

### Telegram
- **TELEGRAM_BOT_TOKEN** - Telegram bot token
  - Get from: @BotFather on Telegram
  - Create bot: https://core.telegram.org/bots/tutorial
  - Required for: Telegram notifications

---

## 🗄️ FILE STORAGE (Optional)

### AWS S3
- **AWS_ACCESS_KEY_ID** - AWS Access Key ID
  - Get from: AWS IAM Console

- **AWS_SECRET_ACCESS_KEY** - AWS Secret Access Key
  - Get from: AWS IAM Console

- **AWS_REGION** - AWS region
  - Options: `us-east-1`, `us-west-2`, `eu-west-1`, etc.
  - Default: `us-east-1`

- **AWS_S3_BUCKET** or **S3_BUCKET** - S3 bucket name
  - Create bucket in AWS S3 Console
  - Required for: File uploads and document storage

---

## 🔐 IDENTITY VERIFICATION (Optional)

### Onfido
- **ONFIDO_TOKEN** - Onfido API token
  - Get from: https://onfido.com
  - Required for: KYC/identity verification

---

## 🔍 ERROR TRACKING (Recommended)

### Sentry
- **SENTRY_DSN** - Sentry DSN (Backend)
  - Get from: https://sentry.io → Create Project → Get DSN
  - Format: `https://your_key@your_org.ingest.sentry.io/your_project_id`
  - Required for: Backend error tracking

- **VITE_SENTRY_DSN** - Sentry DSN (Frontend)
  - Use a separate Sentry project for frontend
  - Required for: Client-side error tracking

- **SENTRY_ENVIRONMENT** - Sentry environment (Backend)
  - Options: `development`, `staging`, `production`
  - Default: `development`

- **VITE_SENTRY_ENVIRONMENT** - Sentry environment (Frontend)
  - Options: `development`, `staging`, `production`
  - Default: `development`

---

## 🔐 OAUTH (Optional - for Social Login)

### Google OAuth
- **GOOGLE_CLIENT_ID** - Google OAuth Client ID
  - Get from: https://console.cloud.google.com/apis/credentials
  - Create OAuth 2.0 Client ID

- **GOOGLE_CLIENT_SECRET** - Google OAuth Client Secret
  - Get from: Same page as Client ID

- **GOOGLE_REDIRECT_URI** - Google OAuth redirect URI
  - Format: `http://localhost:5000/api/auth/oauth/google/callback` (dev)
  - Format: `https://yourdomain.com/api/auth/oauth/google/callback` (prod)
  - Must match in Google Console

### GitHub OAuth
- **GITHUB_CLIENT_ID** - GitHub OAuth Client ID
  - Get from: https://github.com/settings/developers → OAuth Apps → New OAuth App

- **GITHUB_CLIENT_SECRET** - GitHub OAuth Client Secret
  - Get from: Same OAuth App page

- **GITHUB_REDIRECT_URI** - GitHub OAuth redirect URI
  - Format: `http://localhost:5000/api/auth/oauth/github/callback` (dev)
  - Format: `https://yourdomain.com/api/auth/oauth/github/callback` (prod)
  - Must match in GitHub OAuth App settings

---

## 📋 SUMMARY BY PRIORITY

### 🔴 Essential (Core Platform)
1. `DATABASE_URL`
2. `SESSION_SECRET`
3. `ENCRYPTION_KEY`
4. `WIZARD_ENCRYPTION_KEY`
5. `SSN_SALT`
6. `NOTIFY_HMAC_SECRET`
7. `VITE_GUARDIA_VAULT_ADDRESS`
8. `VITE_CHAIN_ID`

### 🟡 Critical Features
9. `SENDGRID_API_KEY` + `SENDGRID_FROM_EMAIL` (Email notifications)
10. `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER` (SMS)
11. `STRIPE_SECRET_KEY` (Payments)
12. `SEPOLIA_RPC_URL` / `VITE_SEPOLIA_RPC_URL` (Blockchain)
13. `VITE_WALLETCONNECT_PROJECT_ID` (Wallet connections)
14. `VITE_ALCHEMY_API_KEY` (NFT fetching)
15. `ETHERSCAN_API_KEY` (Contract verification)

### 🟢 Yield Features
16. `MAINNET_RPC_URL` (For production yield protocols)
17. `YIELD_VAULT_ADDRESS` (After deployment)
18. `LIDO_ADAPTER_ADDRESS` (After deployment)
19. `AAVE_ADAPTER_ADDRESS` (After deployment)

### 🔵 Enhanced Features
20. `OPENAI_API_KEY` (AI optimizer)
21. `DEATH_VERIFICATION_ENABLED=true` + death verification API keys
22. `TELEGRAM_BOT_TOKEN` (Telegram notifications)
23. `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` + `AWS_S3_BUCKET` (File storage)
24. `SENTRY_DSN` + `VITE_SENTRY_DSN` (Error tracking)
25. `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (Google OAuth)
26. `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` (GitHub OAuth)
27. `ONFIDO_TOKEN` (KYC verification)

---

## 📝 Quick Setup Checklist

### Minimum Setup (Basic Functionality)
- [ ] Database configured
- [ ] Security keys generated
- [ ] Smart contract deployed
- [ ] Email service configured
- [ ] Blockchain RPC URLs set

### Full Functionality (100%)
- [ ] All minimum setup items
- [ ] SMS service configured
- [ ] Payment processing configured
- [ ] Yield protocols deployed
- [ ] NFT fetching configured
- [ ] Wallet connections configured
- [ ] AI optimizer configured (optional)
- [ ] Death verification configured (optional)
- [ ] Error tracking configured (recommended)
- [ ] File storage configured (optional)
- [ ] OAuth configured (optional)

---

## 🔗 Quick Links to Get API Keys

- **SendGrid**: https://sendgrid.com → Settings → API Keys
- **Twilio**: https://www.twilio.com/try-twilio
- **Stripe**: https://dashboard.stripe.com/apikeys
- **Alchemy**: https://www.alchemy.com/
- **Infura**: https://infura.io
- **WalletConnect**: https://cloud.reown.com
- **Etherscan**: https://etherscan.io/apis
- **OpenAI**: https://platform.openai.com/api-keys
- **Sentry**: https://sentry.io
- **AWS**: https://console.aws.amazon.com/iam
- **Google OAuth**: https://console.cloud.google.com/apis/credentials
- **GitHub OAuth**: https://github.com/settings/developers
- **Telegram Bot**: https://core.telegram.org/bots/tutorial (@BotFather)

---

**Note**: This list represents ALL possible API keys. Some are optional and the system will work with reduced functionality if they're not set. Refer to the `env.example` file for default values and configuration options.

