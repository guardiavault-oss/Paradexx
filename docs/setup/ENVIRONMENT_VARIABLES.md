# Environment Variables Documentation

This document describes all environment variables used by the Paradex Wallet platform.

## Quick Start

1. Copy `.env.example` to `.env.local`
2. Fill in the required values
3. Run `pnpm dev`

---

## Frontend Environment Variables (Vite)

All frontend variables must be prefixed with `VITE_` to be exposed to the browser.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API endpoint | `https://paradexx-production.up.railway.app` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_WS_URL` | WebSocket endpoint for real-time updates | Same as API URL with ws:// |
| `VITE_SUPABASE_URL` | Supabase project URL | - |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | - |
| `VITE_APP_URL` | Application URL (for OAuth callbacks) | `http://localhost:5173` |
| `VITE_ENABLE_ANALYTICS` | Enable analytics tracking | `false` |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | - |
| `VITE_ENVIRONMENT` | Environment name | `development` |

---

## Backend Environment Variables

### Database

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |

### Authentication

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for JWT token signing | Random 64-char string |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `SESSION_SECRET` | Express session secret | Random 64-char string |

### Email (Resend)

| Variable | Description | Required |
|----------|-------------|----------|
| `RESEND_API_KEY` | Resend API key | Yes (for email features) |
| `EMAIL_FROM` | Default sender email | `noreply@yourdomain.com` |

### Blockchain / Web3

| Variable | Description | Example |
|----------|-------------|---------|
| `ETHEREUM_RPC_URL` | Ethereum RPC endpoint | Alchemy/Infura URL |
| `BSC_RPC_URL` | BSC RPC endpoint | - |
| `POLYGON_RPC_URL` | Polygon RPC endpoint | - |
| `ARBITRUM_RPC_URL` | Arbitrum RPC endpoint | - |
| `OPTIMISM_RPC_URL` | Optimism RPC endpoint | - |
| `BASE_RPC_URL` | Base RPC endpoint | - |
| `PRIVATE_KEY` | Wallet private key (for transactions) | - |

### External APIs

| Variable | Description | Required |
|----------|-------------|----------|
| `ETHERSCAN_API_KEY` | Etherscan API key | For block explorer features |
| `COINGECKO_API_KEY` | CoinGecko API key | For price data |
| `ONE_INCH_API_KEY` | 1inch API key | For DEX aggregation |
| `MORALIS_API_KEY` | Moralis API key | For NFT/token data |
| `ALCHEMY_API_KEY` | Alchemy API key | For RPC & webhooks |

### MEV Protection

| Variable | Description | Example |
|----------|-------------|---------|
| `FLASHBOTS_AUTH_KEY` | Flashbots auth key | - |
| `EDEN_AUTH_KEY` | Eden Network auth key | - |
| `MEV_BLOCKER_API_KEY` | MEV Blocker API key | - |

### Payments (Stripe)

| Variable | Description | Required |
|----------|-------------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret key | For payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | For webhook verification |

### Guardian/Inheritance Features

| Variable | Description | Required |
|----------|-------------|----------|
| `ENCRYPTION_KEY` | Key for encrypting sensitive data | Yes |
| `IPFS_GATEWAY_URL` | IPFS gateway URL | For decentralized storage |
| `PINATA_API_KEY` | Pinata API key | For IPFS pinning |

### Monitoring & Analytics

| Variable | Description | Required |
|----------|-------------|----------|
| `SENTRY_DSN` | Sentry DSN for error tracking | No |
| `POSTHOG_API_KEY` | PostHog API key | No |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | `info` |

---

## Environment Profiles

### Development (`.env.local`)

```bash
VITE_API_URL=http://localhost:3000
VITE_APP_URL=http://localhost:5173
VITE_ENVIRONMENT=development
LOG_LEVEL=debug
```

### Staging (`.env.staging`)

```bash
VITE_API_URL=https://staging-api.paradex.app
VITE_APP_URL=https://staging.paradex.app
VITE_ENVIRONMENT=staging
LOG_LEVEL=info
```

### Production (`.env.production`)

```bash
VITE_API_URL=https://paradexx-production.up.railway.app
VITE_APP_URL=https://paradex.app
VITE_ENVIRONMENT=production
LOG_LEVEL=warn
VITE_ENABLE_ANALYTICS=true
```

---

## Security Notes

1. **Never commit** `.env.local` or any file containing real secrets
2. Use **environment variables** in CI/CD for secrets
3. Rotate keys regularly, especially after team member changes
4. Use different API keys for development, staging, and production
5. Consider using a secrets manager (AWS Secrets Manager, HashiCorp Vault) for production

---

## Obtaining API Keys

### Alchemy
1. Sign up at [alchemy.com](https://www.alchemy.com/)
2. Create an app for each network
3. Copy the API key

### Resend (Email)
1. Sign up at [resend.com](https://resend.com/)
2. Verify your domain
3. Create an API key

### Stripe (Payments)
1. Sign up at [stripe.com](https://stripe.com/)
2. Get keys from Dashboard → Developers → API keys
3. Set up webhooks for subscription events

### CoinGecko
1. Sign up at [coingecko.com](https://www.coingecko.com/en/api)
2. Get API key from dashboard

### 1inch
1. Sign up at [portal.1inch.dev](https://portal.1inch.dev/)
2. Create an API key

---

## Troubleshooting

### Environment variables not loading
- Ensure the file is named `.env.local` (not `.env`)
- Restart the dev server after changes
- Check that variables have `VITE_` prefix for frontend access

### API connection issues
- Verify `VITE_API_URL` is correct
- Check CORS settings on the backend
- Ensure the API server is running

### Database connection errors
- Verify `DATABASE_URL` format
- Check if database server is accessible
- Ensure SSL settings match your database provider
