# Performance Optimization Guide

Performance best practices and optimization strategies for RegenX.

## Table of Contents

1. [Frontend Optimization](#frontend-optimization)
2. [API Optimization](#api-optimization)
3. [Database Optimization](#database-optimization)
4. [WebSocket Optimization](#websocket-optimization)
5. [Caching Strategies](#caching-strategies)
6. [Monitoring](#monitoring)

## Frontend Optimization

### Code Splitting

```typescript
// Lazy load components
const Wallet = lazy(() => import('@/components/Wallet'));
const Bridge = lazy(() => import('@/components/Bridge'));

// Use Suspense
<Suspense fallback={<Loading />}>
  <Wallet />
</Suspense>
```

### Bundle Optimization

```typescript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'date-fns'],
        },
      },
    },
  },
};
```

### Image Optimization

```typescript
// Use WebP format
<img src="image.webp" alt="..." loading="lazy" />

// Responsive images
<img
  srcSet="image-320w.webp 320w, image-640w.webp 640w"
  sizes="(max-width: 640px) 320px, 640px"
  src="image-640w.webp"
/>
```

### Memoization

```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething();
}, [dependencies]);
```

## API Optimization

### Request Batching

```typescript
// ❌ Bad - Multiple requests
const balance = await api.get('/wallet/balance');
const transactions = await api.get('/wallet/transactions');
const nfts = await api.get('/wallet/nfts');

// ✅ Good - Batch requests
const [balance, transactions, nfts] = await Promise.all([
  api.get('/wallet/balance'),
  api.get('/wallet/transactions'),
  api.get('/wallet/nfts'),
]);
```

### Pagination

```typescript
// Use cursor-based pagination
const transactions = await api.get('/transactions', {
  params: {
    cursor: lastCursor,
    limit: 20,
  },
});
```

### Compression

```typescript
// Enable gzip compression
import compression from 'compression';
app.use(compression());
```

## Database Optimization

### Indexing

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_wallet_address ON transactions(wallet_address);
CREATE INDEX idx_timestamp ON transactions(timestamp);
```

### Query Optimization

```typescript
// ❌ Bad - N+1 queries
for (const wallet of wallets) {
  const balance = await getBalance(wallet.address);
}

// ✅ Good - Single query
const balances = await getBalances(wallets.map(w => w.address));
```

### Connection Pooling

```typescript
// Use connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## WebSocket Optimization

### Message Batching

```typescript
// Batch multiple updates
const batch = [];
setInterval(() => {
  if (batch.length > 0) {
    ws.send(JSON.stringify({ type: 'batch', data: batch }));
    batch.length = 0;
  }
}, 100);
```

### Subscription Management

```typescript
// Only subscribe to needed channels
useEffect(() => {
  const unsubscribe = wsManager.subscribe('wallet:balance', handler);
  return unsubscribe; // Clean up
}, []);
```

### Reconnection Strategy

```typescript
// Use exponential backoff
const manager = new WebSocketManager({
  reconnectDelay: 1000,
  exponentialBackoff: true,
  backoffMultiplier: 2,
  maxBackoffDelay: 60000,
});
```

## Caching Strategies

### Client-Side Caching

```typescript
// Cache API responses
const cache = new Map();

async function getCachedData(key: string, fetcher: () => Promise<any>) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const data = await fetcher();
  cache.set(key, data);
  setTimeout(() => cache.delete(key), 60000); // 1 minute TTL
  return data;
}
```

### Server-Side Caching

```typescript
// Redis caching
import Redis from 'ioredis';
const redis = new Redis();

async function getCached(key: string, fetcher: () => Promise<any>) {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  const data = await fetcher();
  await redis.setex(key, 300, JSON.stringify(data)); // 5 min TTL
  return data;
}
```

### CDN Caching

```nginx
# Cache static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Monitoring

### Performance Metrics

```typescript
// Track API response times
const startTime = performance.now();
await api.get('/endpoint');
const duration = performance.now() - startTime;
console.log(`API call took ${duration}ms`);
```

### Web Vitals

```typescript
// Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npx vite-bundle-visualizer
```

## Best Practices

1. **Measure First** - Profile before optimizing
2. **Optimize Critical Path** - Focus on user-facing features
3. **Lazy Load** - Load code when needed
4. **Cache Aggressively** - Cache everything possible
5. **Monitor Continuously** - Track performance metrics

## Performance Targets

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

## Tools

- **Lighthouse**: Web performance auditing
- **WebPageTest**: Detailed performance analysis
- **Chrome DevTools**: Performance profiling
- **Bundle Analyzer**: Bundle size analysis

