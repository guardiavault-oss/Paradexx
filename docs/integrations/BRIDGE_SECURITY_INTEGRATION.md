# Bridge Security Service Integration Guide

## Overview

This guide explains how the Cross-Chain Bridge Security Service is integrated into the Paradex Wallet application.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Paradex Wallet Frontend                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Bridge UI  │  │ Security UI  │  │  Components │ │
│  │  Components  │  │  Components  │  │             │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                  │          │
│         └─────────────────┼──────────────────┘          │
│                           │                             │
│  ┌───────────────────────▼───────────────────────┐     │
│  │     React Hooks (useBridgeSecurity)           │     │
│  └───────────────────────┬───────────────────────┘     │
│                           │                             │
│  ┌───────────────────────▼───────────────────────┐     │
│  │  bridgeSecurityService (TypeScript Client)     │     │
│  └───────────────────────┬───────────────────────┘     │
└───────────────────────────┼─────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
┌───────────────────────────▼─────────────────────────────┐
│   Cross-Chain Bridge Security Service (Backend)          │
│   http://localhost:8000/api/v1                           │
└──────────────────────────────────────────────────────────┘
```

## Components

### 1. Service Client (`src/services/bridgeSecurityService.ts`)

TypeScript client for interacting with the security service API.

**Key Methods:**
- `getSecurityScore()` - Get security score for a bridge (with caching)
- `analyzeBridge()` - Comprehensive bridge analysis
- `comprehensiveSecurityScan()` - Full security scan before transactions
- `validateTransaction()` - Validate cross-chain transactions
- `getSecurityAlerts()` - Get active security alerts

### 2. React Hooks (`src/hooks/useBridgeSecurity.ts`)

**`useBridgeSecurityScore`** - Main hook for bridge security data
```typescript
const {
  securityScore,
  loading,
  error,
  fetchSecurityScore,
  fetchAnalysis,
  fetchComprehensiveScan,
  refresh
} = useBridgeSecurityScore(bridgeAddress, network, {
  autoRefresh: true,
  refreshInterval: 60000
});
```

**`useBridgeSafetyCheck`** - Quick safety check
```typescript
const {
  isSafe,
  shouldBlock,
  warningLevel,
  securityScore
} = useBridgeSafetyCheck(bridgeAddress, network);
```

**`useSecurityAlerts`** - Real-time security alerts
```typescript
const {
  alerts,
  criticalAlerts,
  unacknowledgedAlerts,
  refresh
} = useSecurityAlerts(bridgeAddress);
```

### 3. UI Components

**`BridgeSecurityBadge`** - Display security score badge
```tsx
<BridgeSecurityBadge
  score={8.5}
  riskLevel="LOW"
  size="medium"
  showLabel={true}
/>
```

**`BridgeSecurityWarning`** - Display security warnings
```tsx
<BridgeSecurityWarning
  bridgeAddress="0x..."
  network="ethereum"
  onViewDetails={() => {}}
  onDismiss={() => {}}
/>
```

## Usage Examples

### Example 1: Bridge Selection Screen

```tsx
import { useBridgeSafetyCheck } from '@/hooks/useBridgeSecurity';
import { BridgeSecurityBadge, BridgeSecurityWarning } from '@/components/bridge';

function BridgeSelection({ bridgeAddress, network }) {
  const { isSafe, shouldBlock, warningLevel, securityScore } = 
    useBridgeSafetyCheck(bridgeAddress, network);

  return (
    <div>
      <BridgeSecurityBadge
        score={securityScore?.overall_score}
        riskLevel={securityScore?.risk_level}
      />
      
      {shouldBlock && (
        <BridgeSecurityWarning
          bridgeAddress={bridgeAddress}
          network={network}
        />
      )}
      
      <button disabled={shouldBlock}>
        {shouldBlock ? 'Bridge Blocked' : 'Select Bridge'}
      </button>
    </div>
  );
}
```

### Example 2: Pre-Transaction Security Check

```tsx
import { useBridgeSecurityScore } from '@/hooks/useBridgeSecurity';

function BridgeTransaction({ bridgeAddress, network, transactionData }) {
  const { fetchComprehensiveScan, scanResult, loading } = 
    useBridgeSecurityScore(bridgeAddress, network);

  const handleTransaction = async () => {
    // Perform comprehensive scan before transaction
    await fetchComprehensiveScan(transactionData, {
      include_attack_analysis: true,
      include_signature_analysis: true,
      deep_scan: true
    });

    if (scanResult?.executive_summary.risk_level === 'CRITICAL') {
      alert('Transaction blocked due to critical security risk');
      return;
    }

    // Proceed with transaction
    // ...
  };

  return (
    <button onClick={handleTransaction} disabled={loading}>
      {loading ? 'Scanning...' : 'Confirm Transaction'}
    </button>
  );
}
```

### Example 3: Real-Time Security Alerts

```tsx
import { useSecurityAlerts } from '@/hooks/useBridgeSecurity';

function SecurityAlertsPanel() {
  const { alerts, criticalAlerts, unacknowledgedAlerts } = useSecurityAlerts();

  return (
    <div>
      {criticalAlerts.map(alert => (
        <div key={alert.alert_id} className="alert-critical">
          <h4>{alert.message}</h4>
          <p>{alert.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## Configuration

### Environment Variables

Add to `.env` or `.env.local`:

```bash
# Bridge Security Service URL
VITE_BRIDGE_SECURITY_SERVICE_URL=http://localhost:8000/api/v1
```

### Docker Compose

The service is already configured in `docker-compose.yml`:

```yaml
bridge-security-service:
  build:
    context: ./crosschain service
  ports:
    - "8000:8000"
  environment:
    PORT: 8000
    DATABASE_URL: postgresql://...
    REDIS_URL: redis://...
```

## Integration Points

### 1. Bridge Selection Flow

1. User selects a bridge
2. `useBridgeSafetyCheck` hook checks security
3. Display `BridgeSecurityBadge` with score
4. If risk detected, show `BridgeSecurityWarning`
5. Block transaction if `shouldBlock === true`

### 2. Transaction Confirmation Flow

1. User confirms bridge transaction
2. Call `fetchComprehensiveScan()` with transaction data
3. Check `scanResult.executive_summary.risk_level`
4. Block if CRITICAL, warn if HIGH
5. Proceed if safe

### 3. Real-Time Monitoring

1. `useSecurityAlerts` hook subscribes to alerts
2. Display critical alerts in notification center
3. Auto-refresh every 30 seconds
4. Show alerts for bridges user has used

## Caching Strategy

Security scores are cached for 5 minutes to reduce API calls:

```typescript
// Cache is automatically managed by the service
// Clear cache manually if needed:
bridgeSecurityService.clearCache();
bridgeSecurityService.clearCacheForBridge(address, network);
```

## Error Handling

The service includes comprehensive error handling:

```typescript
const { error, loading } = useBridgeSecurityScore(address, network, {
  onError: (error) => {
    console.error('Security check failed:', error);
    // Show user-friendly error message
  }
});
```

## Best Practices

1. **Always check security before transactions** - Use `comprehensiveSecurityScan` before signing
2. **Show warnings, don't block silently** - Let users make informed decisions
3. **Cache scores** - Use cached scores for better UX
4. **Handle errors gracefully** - Don't block transactions if service is unavailable
5. **Real-time alerts** - Subscribe to alerts for bridges user has used

## Testing

### Manual Testing

1. Start the security service:
   ```bash
   docker-compose up bridge-security-service
   ```

2. Test in wallet:
   - Select a bridge
   - Verify security badge appears
   - Test with high-risk bridge
   - Verify warning appears

### Integration Testing

```typescript
import { bridgeSecurityService } from '@/services/bridgeSecurityService';

test('should fetch security score', async () => {
  const score = await bridgeSecurityService.getSecurityScore(
    '0x1234...',
    'ethereum'
  );
  expect(score.overall_score).toBeGreaterThan(0);
});
```

## Troubleshooting

### Service Not Available

If the service is unavailable:
- Check if service is running: `docker-compose ps`
- Check service logs: `docker-compose logs bridge-security-service`
- Verify environment variable: `VITE_BRIDGE_SECURITY_SERVICE_URL`

### CORS Issues

If you see CORS errors:
- Ensure service allows requests from frontend origin
- Check service CORS configuration in `src/api/main.py`

### Slow Response Times

- Security scores are cached for 5 minutes
- Use `autoRefresh: false` for better performance
- Consider using `useBridgeSafetyCheck` for quick checks

## Next Steps

1. ✅ Service client created
2. ✅ React hooks implemented
3. ✅ UI components created
4. ✅ Docker integration complete
5. ⏳ Add to bridge transaction flow
6. ⏳ Add security alerts to notification center
7. ⏳ Add security dashboard page

## Support

For issues or questions:
- Check service logs: `docker-compose logs bridge-security-service`
- Review API documentation: http://localhost:8000/docs
- Check service health: http://localhost:8000/health

