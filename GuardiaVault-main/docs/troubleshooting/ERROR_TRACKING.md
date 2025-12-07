# Error Tracking Setup Guide

This document describes how error tracking is configured in GuardiaVault using Sentry.

## Overview

GuardiaVault uses **Sentry** for error tracking and monitoring:
- **Backend**: `@sentry/node` for server-side error tracking
- **Frontend**: `@sentry/react` for client-side error tracking

## Features

- ✅ Automatic exception capture
- ✅ Request context tracking
- ✅ User context tracking
- ✅ Performance monitoring
- ✅ Source map support (for minified code)
- ✅ Release tracking
- ✅ Environment-based filtering

## Setup

### 1. Create Sentry Project

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project (Node.js for backend, React for frontend)
3. Copy the DSN from project settings

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Backend Sentry DSN
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Frontend Sentry DSN (exposed to browser)
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Optional: Release version
SENTRY_RELEASE=guardiavault@1.0.0
VITE_SENTRY_RELEASE=guardiavault@1.0.0

# Optional: Enable in development
VITE_SENTRY_DEBUG=false
```

### 3. Verify Installation

The error tracking is automatically initialized when the server starts or the client loads.

**Backend** (`server/index.ts`):
- Initializes on server startup
- Gracefully degrades if `SENTRY_DSN` is not set

**Frontend** (`client/src/main.tsx`):
- Initializes before React app renders
- Gracefully degrades if `VITE_SENTRY_DSN` is not set

## Usage

### Backend Error Tracking

```typescript
import { captureException, captureMessage, setUserContext } from './services/errorTracking';

// Capture an exception
try {
  await someOperation();
} catch (error) {
  captureException(error, {
    additionalContext: {
      operation: 'vault_creation',
      vaultId: vault.id,
    },
  });
}

// Capture a message (non-error)
captureMessage('Vault created successfully', 'info');

// Set user context
setUserContext(userId, userEmail, userWalletAddress);

// Clear user context on logout
clearUserContext();
```

### Frontend Error Tracking

```typescript
import { captureException, captureMessage } from './services/errorTracking';

// In React Error Boundary or try/catch
try {
  await someOperation();
} catch (error) {
  captureException(error, {
    userAction: 'vault_creation',
    component: 'CreateVaultForm',
  });
}

// Capture user events
captureMessage('User clicked create vault button', 'info');
```

### React Error Boundary

For automatic React error capture, wrap your app:

```typescript
import * as Sentry from "@sentry/react";

function App() {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      {/* Your app */}
    </Sentry.ErrorBoundary>
  );
}
```

## Configuration

### Sampling Rates

Currently configured:
- **Production**: 10% of transactions (0.1 sample rate)
- **Development**: 100% of transactions (1.0 sample rate)

Adjust in `server/services/errorTracking.ts`:

```typescript
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
```

### Filtered Errors

These errors are automatically ignored:
- `ResizeObserver loop limit exceeded` (browser noise)
- `Non-Error promise rejection captured`
- `NetworkError`, `TimeoutError`

Add more in `server/services/errorTracking.ts`:

```typescript
ignoreErrors: [
  // Your custom patterns
  'CustomErrorPattern',
],
```

## Best Practices

### 1. Include Context

Always include relevant context when capturing errors:

```typescript
captureException(error, {
  vaultId: vault.id,
  userId: user.id,
  operation: 'vault_creation',
  timestamp: new Date().toISOString(),
});
```

### 2. Set User Context

Set user context for authenticated requests:

```typescript
// In auth middleware or route handler
setUserContext(req.session.userId, user.email, user.walletAddress);
```

### 3. Don't Capture Expected Errors

Don't capture validation errors or expected errors:

```typescript
if (error instanceof z.ZodError) {
  // This is expected - don't capture
  return res.status(400).json({ errors: error.errors });
}

// Only capture unexpected errors
captureException(error);
```

### 4. Use Appropriate Log Levels

```typescript
captureMessage('User logged in', 'info');
captureMessage('Failed to send email', 'warning');
captureMessage('Database connection lost', 'error');
```

## Monitoring

### Sentry Dashboard

View errors at: `https://sentry.io/organizations/YOUR_ORG/issues/`

### Key Metrics to Monitor

- **Error Rate**: Number of errors per time period
- **Affected Users**: How many users encountered errors
- **Error Types**: Most common error types
- **Performance**: Transaction performance metrics

### Alerts

Set up alerts in Sentry:
1. Go to Project Settings → Alerts
2. Create alert rules for:
   - High error rate
   - New error types
   - Performance degradation
   - User-impacting errors

## Production Checklist

- [ ] Sentry DSN configured in production environment
- [ ] Release tracking enabled (`SENTRY_RELEASE`)
- [ ] Source maps uploaded for minified code
- [ ] Error sampling rate set appropriately
- [ ] User context being set for authenticated requests
- [ ] Alerts configured for critical errors
- [ ] Ignore patterns configured for noise
- [ ] Performance monitoring enabled

## Troubleshooting

### Errors Not Appearing in Sentry

1. **Check DSN**: Verify `SENTRY_DSN` is set correctly
2. **Check Network**: Ensure server can reach `*.sentry.io`
3. **Check Console**: Look for Sentry initialization messages
4. **Check Sampling**: Errors might be sampled out

### Too Many Errors

1. **Increase Sampling Rate**: Reduce `tracesSampleRate`
2. **Add Ignore Patterns**: Filter out known noise
3. **Review Error Sources**: Identify and fix root causes

### Performance Impact

1. **Adjust Sampling**: Reduce sampling rates
2. **Use Async Capture**: Errors are captured asynchronously
3. **Filter Errors**: Ignore non-critical errors

## Additional Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry React Integration](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Node.js Integration](https://docs.sentry.io/platforms/node/)

---

**Last Updated**: 2025-01-02  
**Status**: ✅ Error Tracking Configured

