# Paradox Wallet - Complete Platform Guide

## 🚀 Quick Start

### Prerequisites

- **Node.js** v20+ and **pnpm** package manager
- **Docker Desktop** (for PostgreSQL and Redis)
- **Python 3.10+** (for MEV Guard and Cross-Chain services)

### Start Everything

```powershell
# Start the complete platform (all services)
.\start-full-platform.ps1

# Or start with options:
.\start-full-platform.ps1 -SkipDocker      # Skip Docker (if you have local PostgreSQL/Redis)
.\start-full-platform.ps1 -SkipPython      # Skip Python services (MEV Guard, Cross-Chain)
.\start-full-platform.ps1 -FrontendOnly    # Only start frontend
.\start-full-platform.ps1 -BackendOnly     # Only start backend services
```

## 📦 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Vite)                    │
│                         http://localhost:5173                    │
└────────────────────────────────┬────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐  ┌───────────────────┐  ┌───────────────────┐
│   Backend API │  │   MEV Guard API   │  │ Cross-Chain API   │
│  (Express/TS) │  │  (FastAPI/Python) │  │ (FastAPI/Python)  │
│  port: 3001   │  │    port: 8000     │  │    port: 8001     │
└───────┬───────┘  └─────────┬─────────┘  └─────────┬─────────┘
        │                    │                      │
        │          ┌─────────┴──────────┐          │
        │          │   Blockchain RPCs  │          │
        │          │  (Alchemy, etc.)   │          │
        │          └────────────────────┘          │
        │                                          │
        └──────────────────┬───────────────────────┘
                          │
           ┌──────────────┴──────────────┐
           │                             │
    ┌──────┴──────┐               ┌──────┴──────┐
    │ PostgreSQL  │               │    Redis    │
    │ port: 5432  │               │ port: 6379  │
    └─────────────┘               └─────────────┘
```

## 🔌 Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 5173 | React/Vite development server |
| Backend API | 3001 | Main Express/TypeScript API |
| MEV Guard | 8000 | MEV protection service (Python) |
| Cross-Chain | 8001 | Bridge security service (Python) |
| Degen Services | 3002 | Sniper bot and trading tools |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache and sessions |
| PgAdmin | 5050 | Database management UI |
| Redis Commander | 8081 | Redis management UI |

## 🌐 API Endpoints Reference

### Authentication

```
POST /api/auth/register          - Register new user
POST /api/auth/login             - Login with email/password
POST /api/auth/logout            - Logout and invalidate tokens
POST /api/auth/refresh           - Refresh access token
POST /api/auth/oauth/google      - OAuth login with Google
GET  /api/auth/me                - Get current user profile
```

### Wallet Management

```
POST /api/wallet/create          - Create new wallet
GET  /api/wallet/balance         - Get wallet balance
GET  /api/wallet/transactions    - Get transaction history
POST /api/wallet/send            - Send transaction
GET  /api/wallet/tokens          - Get token balances
GET  /api/wallet/nfts            - Get NFT collection
```

### Trading & Swaps

```
POST /api/swaps/aggregators      - Get quotes from all DEX aggregators
POST /api/swaps/build-tx         - Build swap transaction
POST /api/trading/orders         - Create limit order
POST /api/trading/orders/oco     - Create OCO order (take-profit + stop-loss)
POST /api/trading/orders/trailing-stop - Create trailing stop
GET  /api/trading/orders         - Get user's orders
DELETE /api/trading/orders/:id   - Cancel order
POST /api/trading/dca            - Create DCA plan
GET  /api/trading/dca            - Get DCA plans
```

### MEV Protection

```
GET  /api/mev-guard/status       - Check MEV protection status
POST /api/mev-guard/protect      - Submit protected transaction
POST /api/mev-guard/simulate     - Simulate transaction
```

### Inheritance Platform

```
POST /api/inheritance/vault      - Create inheritance vault
GET  /api/inheritance/vault      - Get user's vault
PUT  /api/inheritance/vault/:id  - Update vault settings
POST /api/inheritance/vault/:id/check-in - Manual check-in
POST /api/inheritance/vault/:id/cancel-trigger - Cancel triggered vault
POST /api/inheritance/beneficiaries - Add beneficiary
PUT  /api/inheritance/beneficiaries/:id - Update beneficiary
DELETE /api/inheritance/beneficiaries/:id - Remove beneficiary
```

### Cross-Chain Bridge

```
POST /api/cross-chain/quote      - Get bridge quote
POST /api/cross-chain/bridge     - Execute bridge transaction
GET  /api/cross-chain/status/:id - Check bridge status
GET  /api/cross-chain/chains     - Get supported chains
GET  /api/cross-chain/tokens     - Get supported tokens
```

### Market Data

```
GET  /api/market-data/prices     - Get token prices
GET  /api/market-data/trending   - Get trending tokens
GET  /api/market-data/chart/:token - Get price chart data
```

### DeFi

```
GET  /api/defi/yield-vaults      - Get yield vaults
POST /api/defi/deposits          - Deposit to yield vault
POST /api/defi/withdrawals       - Withdraw from vault
GET  /api/defi/apy-rates         - Get current APY rates
GET  /api/defi/positions         - Get user's DeFi positions
```

## 💻 Frontend Service Usage

### Trading Service

```typescript
import { unifiedTradingService } from '@/services';

// Get swap quotes from all DEXs
const quotes = await unifiedTradingService.getSwapQuotes({
  fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
  toToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  amount: '1000000000000000000', // 1 ETH in wei
  chainId: 1,
  userAddress: '0x...',
  slippage: 1,
});

// Execute swap with MEV protection
const result = await unifiedTradingService.executeSwap({
  fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  toToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  amount: '1000000000000000000',
  chainId: 1,
  userAddress: '0x...',
  useMEVProtection: true,
});

// Create limit order
const order = await unifiedTradingService.createLimitOrder({
  chainId: 1,
  type: 'buy',
  tokenIn: 'USDC',
  tokenOut: 'ETH',
  amountIn: '1000',
  triggerPrice: '2000',
});

// Create DCA plan
const dcaPlan = await unifiedTradingService.createDCAPlan({
  chainId: 1,
  tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  tokenSymbol: 'WETH',
  amountPerPurchase: '100',
  frequency: 'weekly',
  strategy: 'fixed',
});
```

### Inheritance Service

```typescript
import { unifiedInheritanceService } from '@/services';

// Create inheritance vault
const vault = await unifiedInheritanceService.createVault({
  name: 'My Crypto Legacy',
  tier: 'premium',
  inactivityDays: 365,
  walletAddresses: ['0x...'],
  distributionMethod: 'automatic',
});

// Add beneficiary
const beneficiary = await unifiedInheritanceService.addBeneficiary({
  vaultId: vault.id,
  name: 'John Doe',
  email: 'john@example.com',
  walletAddress: '0x...',
  percentage: 50,
});

// Manual check-in
await unifiedInheritanceService.checkIn(vault.id);

// Get vault status
const vaultStatus = await unifiedInheritanceService.getVault();
console.log(`Days until trigger: ${vaultStatus.daysUntilTrigger}`);
```

### Authentication

```typescript
import { authService, setAuthTokens } from '@/services';

// Register
const { tokens, user } = await authService.register({
  email: 'user@example.com',
  password: 'securePassword123',
  displayName: 'John',
});
setAuthTokens(tokens);

// Login
const result = await authService.login({
  email: 'user@example.com',
  password: 'securePassword123',
});

// Get current user
const me = await authService.getCurrentUser();
```

## 🔧 Development Commands

```powershell
# Install all dependencies
pnpm install
cd src/backend && pnpm install

# Start development servers individually
pnpm run dev                    # Frontend only
cd src/backend && pnpm run dev  # Backend only

# Build for production
pnpm run build

# Run database migrations
cd src/backend && npx prisma migrate dev

# View database
cd src/backend && npx prisma studio
```

## 🐳 Docker Commands

```powershell
# Start all containers
docker-compose up -d

# Start only databases
docker-compose up -d postgres redis

# View logs
docker-compose logs -f backend

# Stop all
docker-compose down

# Reset databases (WARNING: deletes all data)
docker-compose down -v
```

## 🧪 Testing the Platform

### 1. Health Check

```bash
# Backend API
curl http://localhost:3001/health

# MEV Guard
curl http://localhost:8000/health

# Cross-Chain
curl http://localhost:8001/health
```

### 2. Register & Login

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","displayName":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### 3. Get Swap Quotes

```bash
curl -X POST http://localhost:3001/api/swaps/aggregators \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fromToken": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    "toToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "amount": "1000000000000000000",
    "chainId": 1,
    "userAddress": "0x...",
    "slippage": 1
  }'
```

## 🔐 Security Notes

1. **API Keys**: All API keys in `.env.local` are for development. Use separate keys for production.
2. **Private Keys**: Never commit private keys. Use environment variables or secret management.
3. **MEV Protection**: Always enable MEV protection for mainnet transactions.
4. **Authentication**: Use 2FA for production accounts.

## 💰 Platform Economics

### Pricing Model

**Platform is FREE** - No subscription fees, no premium tiers.

### Swap Fee

A **0.79% fee** is applied to all swaps. This fee:

- Supports ongoing platform development
- Goes to the treasury wallet
- Is automatically deducted from swap amounts

```typescript
// Frontend usage
import { unifiedTradingService } from '@/services';

const quote = await unifiedTradingService.getSwapQuotes({
  fromToken: '0xEeee...',
  toToken: '0xA0b8...',
  amount: '1000000000000000000', // 1 ETH
  userAddress: walletAddress,
});

// Quote includes fee breakdown
console.log(quote.feeAmount); // 0.79% of input
console.log(quote.netAmount); // Amount after fee
```

### Treasury Wallet

All swap fees are routed to: Configure in `.env.local`:

```
TREASURY_WALLET_ADDRESS="0x7Ca8C2D3De35E3d19EDB02127CB2f41C0cD0f50E"
```

## 💳 Buy Crypto with ChangeNOW

Users can buy crypto directly with fiat currency (USD, EUR, etc.) without KYC.

### Setup

Get your API key from [ChangeNOW](https://changenow.io/) and add to `.env.local`:

```
CHANGENOW_API_KEY="your_api_key_here"
```

### Frontend Usage

```typescript
import { changeNOWService, POPULAR_FIAT, POPULAR_CRYPTO } from '@/services';

// Get quote
const quote = await changeNOWService.getQuote({
  from: 'USD',
  to: 'ETH',
  amount: 100,
});

// Buy crypto
const result = await changeNOWService.buyCrypto({
  fiatCurrency: 'USD',
  cryptoCurrency: 'ETH',
  fiatAmount: 100,
  walletAddress: '0x...',
});

// Track transaction
const status = await changeNOWService.getTransactionStatus(result.transaction.id);
```

## 🎨 Token Icons

Real token logos are fetched from multiple sources:

- Trust Wallet Assets
- 1inch Token List
- CoinGecko

### Frontend Usage

```typescript
import { tokenIconsService, COMMON_TOKEN_ICONS } from '@/services';

// By symbol (instant, cached)
const ethIcon = tokenIconsService.getIconBySymbol('ETH');

// By address (async, fetches from CDN)
const tokenIcon = await tokenIconsService.getIconByAddress(1, '0xA0b8...');

// Batch fetch
const icons = await tokenIconsService.getIcons([
  { chainId: 1, address: '0xA0b8...' },
  { chainId: 137, address: '0x2791...' },
]);
```

## 📈 Yield & Staking

Integrated with deployed adapter contracts for yield generation.

### Deployed Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| Lido Adapter | `0xC30F4DE8666c79757116517361dFE6764A6Dc128` |
| Aave Adapter | `0xcc27a22d92a8B03D822974CDeD6BB74c63Ac0ae1` |
| Yield Vault | `0x86bE7Bf7Ef3Af62BB7e56a324a11fdBA7f3AfbBb` |
| Yield Optimizer | `0x026C7cC2dbf634e05c650e95E30df0be97Df8767` |

### API Endpoints

```
GET  /api/yield/strategies           - List all yield strategies with APY
GET  /api/yield/strategy/:id         - Get strategy details
GET  /api/yield/vaults               - Get user's yield vaults
POST /api/yield/vaults               - Create new vault
POST /api/yield/deposit              - Deposit into strategy
POST /api/yield/withdraw             - Withdraw from strategy
GET  /api/yield/balance/:strategy/:address - Get balance
GET  /api/yield/contracts            - Get deployed contract addresses
```

## 📧 Email Authentication (Resend)

Email verification and notifications are powered by Resend.

### Setup

1. Get API key from [Resend](https://resend.com/)
2. Add to `.env.local`:

```
RESEND_API_KEY="re_YOUR_API_KEY"
FROM_EMAIL="Paradex <noreply@yourdomain.com>"
```

### Email Types

| Email Type | Trigger |
|------------|---------|
| Verification | User registers |
| Welcome | Email verified |
| Password Reset | User requests reset |
| Guardian Invitation | User adds guardian |
| Recovery Request | Recovery initiated |
| Inheritance Alert | Vault triggered |
| Beneficiary Notification | User passes away |

### Inheritance Death Notifications

When an inheritance vault triggers due to prolonged inactivity:

1. **Guardians** receive attestation request emails
2. **Beneficiaries** receive condolence notifications with claim instructions
3. **Owner** receives final warning (if still active)

```typescript
// Email service handles these automatically via inheritance jobs
// Triggered when inactivity period expires
```

## 🆘 Troubleshooting

### Database Connection Failed

```powershell
# Ensure Docker is running
docker ps

# Restart database containers
docker-compose restart postgres redis
```

### Port Already in Use

```powershell
# Find process on port
Get-NetTCPConnection -LocalPort 3001

# Kill process
Stop-Process -Id <PID> -Force
```

### Python Services Not Starting

```powershell
# Install Python dependencies
cd "mevguard service"
pip install -r requirements.txt

cd "../crosschain service"
pip install -r requirements.txt
```

### Frontend Not Connecting to Backend

1. Check that backend is running: `curl http://localhost:3001/health`
2. Verify CORS settings in backend
3. Check browser console for errors
4. Verify `.env.local` has correct `VITE_API_URL`

## 📄 License

MIT License - see LICENSE file for details.
