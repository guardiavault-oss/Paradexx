# API Configuration Centralization

## Overview

The API configuration has been centralized to eliminate redundant definitions across the codebase. Previously, `API_URL` was defined in 20+ files individually. Now, all API-related configuration is managed from a single source of truth.

## Migration Summary

### Files Created

1. **`src/config/api.ts`** - Centralized API configuration
   - `API_URL` - Base API URL
   - `WS_URL` - WebSocket URL
   - `API_ENDPOINTS` - All REST API endpoints organized by category
   - `WS_ENDPOINTS` - WebSocket endpoints
   - `RPC_URLS` - Chain-specific RPC URLs
   - `EXTERNAL_APIS` - Third-party API URLs
   - `BLOCK_EXPLORERS` - Block explorer URLs by chain
   - Helper functions: `getTransactionUrl()`, `getAddressUrl()`, `getWsUrl()`, `getApiUrl()`, `getAuthHeaders()`

2. **`src/config/pricing.ts`** - Centralized pricing configuration
   - `SUBSCRIPTION_TIERS` - Free, Pro, Elite, Lifetime tiers
   - `SWAP_FEES` - Fee structure by tier (0.5%, 0.35%, 0.2%, 0.15%)
   - `YIELD_FEES` - Universal 0.75% yield fee
   - `PREMIUM_FEATURES` - Feature list for premium tiers
   - Helper functions: `getSwapFee()`, `getYieldFee()`, `calculateFeeSavings()`

3. **`src/config/index.ts`** - Central export for all config modules

4. **`src/hooks/useApi.ts`** - Universal API hook
   - Request caching (5-minute default TTL)
   - Retry logic with exponential backoff
   - Auth token management
   - Request deduplication

5. **`src/components/PricingPage.tsx`** - Subscription pricing page
   - Tier comparison
   - Fee calculator
   - Monthly/Annual billing toggle

### Files Updated

The following files were updated to import from `src/config/api.ts`:

**Hooks:**
- `useNotifications.ts`
- `useWhaleData.ts`
- `useSecurityCenter.ts`
- `useSmartWill.ts`
- `useBuyProviders.ts`
- `useYieldOpportunities.ts`
- `useSniperBot.ts`
- `useDashboard.ts`
- `useDashboardStats.ts`
- `usePortfolioHoldings.ts`
- `useOrders.ts`
- `useNFTGallery.ts`
- `useMemeRadar.ts`
- `useBridgesList.ts`
- `useAddressBook.ts`
- `useSettings.ts`

**Components:**
- `WhaleTracker.tsx`
- `WalletConnectModal.tsx`
- `TransactionSimulator.tsx`
- `AirdropPage.tsx`
- `PortfolioAnalytics.tsx`

**Other:**
- `App.tsx`
- `guardianVerification.ts`

## Usage

### Importing API Configuration

```typescript
// Import specific exports
import { API_URL, API_ENDPOINTS, getAuthHeaders } from '../config/api';

// Or import from central config
import { API_URL, API_ENDPOINTS } from '../config';
```

### Making API Requests

```typescript
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';

// Using predefined endpoints
const response = await fetch(API_ENDPOINTS.auth.login, {
  method: 'POST',
  headers: getAuthHeaders(),
  body: JSON.stringify({ email, password }),
});

// Using dynamic endpoints
const walletData = await fetch(API_ENDPOINTS.wallet.balance(walletAddress));
```

### Using Pricing Config

```typescript
import { SUBSCRIPTION_TIERS, getSwapFee, calculateFeeSavings } from '../config/pricing';

// Get swap fee for a tier
const fee = getSwapFee('pro'); // Returns 0.35

// Calculate fee savings
const savings = calculateFeeSavings('pro', 100000); // Monthly volume $100k
```

## Benefits

1. **Single Source of Truth** - All API URLs defined in one place
2. **Type Safety** - TypeScript interfaces for all configurations
3. **Easy Updates** - Change URL in one place, updates everywhere
4. **Environment Support** - Uses `import.meta.env` for production/development
5. **No More Duplication** - Eliminated 20+ redundant definitions
6. **Helper Functions** - Common operations like auth headers built-in

## Environment Variables

The config respects these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://paradexx-production.up.railway.app` |
| `VITE_GUARDIAVAULT_API_URL` | GuardiaVault API | `http://localhost:5000/api` |
| `VITE_SCARLETTE_API_URL` | Scarlette AI API | `${API_URL}/api/scarlette` |
| `VITE_ETH_RPC_URL` | Ethereum RPC | Alchemy demo |
| `VITE_POLYGON_RPC_URL` | Polygon RPC | Alchemy demo |
| `VITE_ARBITRUM_RPC_URL` | Arbitrum RPC | Alchemy demo |
| `VITE_BASE_RPC_URL` | Base RPC | Alchemy demo |
