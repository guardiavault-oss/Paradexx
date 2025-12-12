# API Integration Enhancements

This document describes the enhanced frontend-backend integration improvements.

## Overview

The integration has been significantly enhanced with:
- **Unified API Client** with advanced features
- **Type-safe Service Layer** for all backend services
- **React Query Integration** for efficient data fetching
- **Request Deduplication** to prevent duplicate API calls
- **Intelligent Caching** with TTL support
- **Automatic Retry Logic** with exponential backoff
- **Health Monitoring** for all backend services
- **WebSocket Integration** for real-time updates

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Components                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              React Query Hooks (useApiQuery)            │
│  - Automatic caching                                    │
│  - Background refetching                                │
│  - Optimistic updates                                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Service Layer (api-service-layer)           │
│  - Type-safe service methods                            │
│  - Organized by feature domain                          │
│  - Consistent error handling                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         Enhanced API Client (enhanced-api-client)       │
│  - Request deduplication                                │
│  - Intelligent caching                                  │
│  - Retry with exponential backoff                       │
│  - Health monitoring                                    │
│  - Response transformation                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Backend Services (FastAPI/Express)          │
│  - Main Backend API (port 3001)                        │
│  - MEV Guard Service (port 8000)                       │
│  - Cross-Chain Bridge (port 8001)                      │
│  - Degen Services (port 3002)                          │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Enhanced API Client

The enhanced API client provides:

- **Request Deduplication**: Prevents duplicate API calls within a 1-second window
- **Intelligent Caching**: Automatic caching for GET requests with configurable TTL
- **Retry Logic**: Automatic retry with exponential backoff for retryable errors
- **Health Monitoring**: Continuous health checks for all backend services
- **Response Transformation**: Consistent response format across all services
- **Token Refresh**: Automatic token refresh on 401 errors

**Usage:**

```typescript
import { api } from '@/services/enhanced-api-client';

// Simple GET request
const response = await api.get('/api/wallet/balance');

// With options
const response = await api.get('/api/wallet/balance', {
  cache: true,
  cacheTTL: 60000, // 1 minute
  service: 'backend', // or 'mevguard', 'crosschain', 'degen'
});

// POST request
const response = await api.post('/api/wallet/send', {
  to: '0x...',
  value: '1.0',
});
```

### 2. Service Layer

Type-safe service methods organized by feature domain:

**Available Services:**
- `authService` - Authentication & authorization
- `walletService` - Wallet operations
- `tradingService` - Trading & swaps
- `mevService` - MEV protection
- `bridgeService` - Cross-chain bridging
- `notificationService` - Notifications
- `securityService` - Security & alerts
- `settingsService` - User settings
- `marketDataService` - Market data & prices
- `healthService` - Service health monitoring

**Usage:**

```typescript
import { apiServices } from '@/services';

// Get wallets
const wallets = await apiServices.wallet.getWallets();

// Get swap quote
const quote = await apiServices.trading.getSwapQuote({
  fromToken: 'ETH',
  toToken: 'USDC',
  amount: '1.0',
  slippage: 0.5,
});

// Check service health
const health = await apiServices.health.checkHealth('backend');
```

### 3. React Query Integration

Efficient data fetching with automatic caching and background updates:

**Available Hooks:**
- `useCurrentUser()` - Current authenticated user
- `useWallets()` - User wallets
- `useWalletBalance(address)` - Wallet balance (auto-refreshes)
- `useWalletTransactions(address, page)` - Transaction history
- `useTradingPairs()` - Available trading pairs
- `useSwapQuote(params)` - Get swap quote
- `useMEVStatus()` - MEV protection status
- `useBridgeChains()` - Supported bridge chains
- `useNotifications(page)` - User notifications
- `useTokenPrices(symbols)` - Token prices (auto-refreshes)
- `useSettings()` - User settings

**Usage:**

```typescript
import { useWalletBalance, useSendTransaction } from '@/hooks/useApiQuery';

function WalletComponent({ address }: { address: string }) {
  // Automatic caching, refetching, and error handling
  const { data, isLoading, error } = useWalletBalance(address);
  
  // Mutation with automatic cache invalidation
  const sendTx = useSendTransaction({
    onSuccess: () => {
      console.log('Transaction sent!');
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Balance: {data?.data?.balance}</p>
      <button onClick={() => sendTx.mutate({
        address,
        request: { to: '0x...', value: '0.1' }
      })}>
        Send Transaction
      </button>
    </div>
  );
}
```

### 4. Request Deduplication

Prevents duplicate API calls when multiple components request the same data:

```typescript
// Component A and Component B both call this simultaneously
const response1 = await api.get('/api/wallet/balance');
const response2 = await api.get('/api/wallet/balance');

// Only one actual HTTP request is made
// Both promises resolve with the same response
```

### 5. Intelligent Caching

Automatic caching for GET requests with configurable TTL:

```typescript
// First call - makes HTTP request
const response1 = await api.get('/api/wallet/balance', {
  cache: true,
  cacheTTL: 60000, // Cache for 1 minute
});

// Second call within 1 minute - returns cached data
const response2 = await api.get('/api/wallet/balance', {
  cache: true,
});

// Clear cache when needed
api.clearCache();
api.clearCachePattern('wallet'); // Clear all wallet-related cache
```

### 6. Automatic Retry

Retries failed requests with exponential backoff:

```typescript
// Automatically retries on:
// - Network errors
// - 5xx server errors
// - 429 rate limit errors
// - 408 timeout errors

const response = await api.get('/api/wallet/balance', {
  retries: 3, // Default: 3
  retryDelay: 1000, // Default: 1000ms
});
```

### 7. Health Monitoring

Continuous health monitoring for all backend services:

```typescript
import { apiServices } from '@/services';

// Check health of a specific service
const health = await apiServices.health.checkHealth('backend');

// Get health status of all services
const allHealth = apiServices.health.getAllHealthStatus();

// Health status includes:
// - service: Service name
// - healthy: Boolean
// - latency: Response time in ms
// - lastCheck: Timestamp
// - error: Error message if unhealthy
```

### 8. WebSocket Integration

Real-time updates via WebSocket:

```typescript
import { wsService, subscribeToTransactions } from '@/services';

// Initialize WebSocket connection
await wsService.connect();

// Subscribe to transaction updates
const unsubscribe = subscribeToTransactions((tx) => {
  console.log('New transaction:', tx);
});

// Subscribe to price updates
const unsubscribePrices = subscribeToPriceUpdates((price) => {
  console.log('Price update:', price);
});

// Clean up
unsubscribe();
unsubscribePrices();
```

## Migration Guide

### From Legacy API Client

**Before:**
```typescript
import { apiClient } from '@/services/api-client';

const response = await apiClient.get('/api/wallet/balance');
```

**After:**
```typescript
import { api } from '@/services/enhanced-api-client';

const response = await api.get('/api/wallet/balance');
```

### From Direct Axios Calls

**Before:**
```typescript
import axios from 'axios';

const response = await axios.get('http://localhost:3001/api/wallet/balance');
```

**After:**
```typescript
import { apiServices } from '@/services';

const response = await apiServices.wallet.getBalance(address);
```

### Using React Query

**Before:**
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/wallet/balance')
    .then(res => res.json())
    .then(data => {
      setData(data);
      setLoading(false);
    });
}, []);
```

**After:**
```typescript
import { useWalletBalance } from '@/hooks/useApiQuery';

const { data, isLoading } = useWalletBalance(address);
```

## Configuration

### Environment Variables

```env
# Main Backend API
VITE_API_URL=http://localhost:3001

# WebSocket
VITE_WS_URL=ws://localhost:3001

# MEV Guard Service
VITE_MEVGUARD_URL=http://localhost:8000

# Cross-Chain Bridge Service
VITE_CROSSCHAIN_URL=http://localhost:8001

# Degen Services
VITE_DEGEN_API_URL=http://localhost:3002
```

### Service Configuration

Edit `src/services/config.ts` to customize:
- Service endpoints
- API routes
- Supported chains
- Feature flags

## Best Practices

1. **Use Service Layer**: Always use `apiServices` instead of direct API calls
2. **Use React Query**: Use hooks from `useApiQuery` for data fetching
3. **Enable Caching**: Use caching for frequently accessed data
4. **Handle Errors**: Always handle errors in your components
5. **Use WebSocket**: Use WebSocket for real-time updates instead of polling
6. **Monitor Health**: Check service health before making critical requests

## Error Handling

All API responses follow a consistent format:

```typescript
interface BaseResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

**Example:**
```typescript
try {
  const response = await apiServices.wallet.getBalance(address);
  if (response.success && response.data) {
    // Handle success
  } else {
    // Handle error from response
    console.error(response.error);
  }
} catch (error) {
  // Handle network/other errors
  console.error(error);
}
```

## Performance Tips

1. **Use Request Deduplication**: Enable deduplication for frequently called endpoints
2. **Configure Cache TTL**: Set appropriate cache TTL based on data freshness requirements
3. **Use React Query**: Leverage React Query's built-in optimizations
4. **Monitor Health**: Use health monitoring to avoid calling unhealthy services
5. **Batch Requests**: Combine multiple requests when possible

## Troubleshooting

### Service Not Responding

```typescript
// Check service health
const health = await apiServices.health.checkHealth('backend');
console.log('Service health:', health);
```

### Cache Issues

```typescript
// Clear cache
api.clearCache();

// Clear specific cache pattern
api.clearCachePattern('wallet');
```

### Token Refresh Issues

The enhanced client automatically handles token refresh. If you encounter issues:

```typescript
// Manually refresh token
const refreshToken = localStorage.getItem('refreshToken');
if (refreshToken) {
  await apiServices.auth.refreshToken(refreshToken);
}
```

## Future Enhancements

- [ ] Request/response logging
- [ ] Performance metrics collection
- [ ] Automatic service discovery
- [ ] Circuit breaker pattern
- [ ] Request queuing
- [ ] Offline support
- [ ] Request compression


