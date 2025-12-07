# Integration Guides

## Honeypot Detector Integration

### Quick Start

1. **Install dependencies**:
```bash
npm install
```

2. **Import the API client**:
```typescript
import { honeypotAPI } from '@/services/api/honeypot';
```

3. **Analyze a token**:
```typescript
const result = await honeypotAPI.analyzeToken({
  token_address: '0x...',
  chain_id: 1,
});

if (result.is_honeypot) {
  // Show warning
}
```

### Integration Steps

1. **Add token scanning to swap flow**:
   - Import `TokenSecurityScanner` component
   - Add before swap confirmation
   - Handle scan results

2. **Display security scores**:
   - Use `SecurityScoreDisplay` component
   - Show in token lists and details

3. **Show analysis reports**:
   - Use `ContractAnalysisModal` component
   - Trigger on "View Details" click

## Wallet Guard Integration

### Quick Start

1. **Import the API client**:
```typescript
import { walletGuardAPI } from '@/services/api/walletGuard';
```

2. **Start monitoring**:
```typescript
await walletGuardAPI.startMonitoring(walletAddress);
```

3. **Get wallet status**:
```typescript
const status = await walletGuardAPI.getWalletStatus(walletAddress);
```

### Integration Steps

1. **Add security dashboard**:
   - Import `SecurityDashboard` component
   - Add route: `/security`
   - Connect to wallet address

2. **Real-time threat monitoring**:
   - Use `useWalletGuard` hook
   - Set up WebSocket connection
   - Display threats in real-time

3. **Transaction risk scoring**:
   - Call `simulateTransaction` before execution
   - Show risk score and warnings
   - Allow user to proceed or cancel

## Component Integration Examples

### Token Scanning in Swap

```tsx
import { TokenSecurityScanner } from '@/components/security/TokenSecurityScanner';

function SwapPanel() {
  const [tokenAddress, setTokenAddress] = useState('');

  return (
    <div>
      <TokenInput value={tokenAddress} onChange={setTokenAddress} />
      
      {tokenAddress && (
        <TokenSecurityScanner
          tokenAddress={tokenAddress}
          chainId={1}
          autoScan={true}
          onScanComplete={(result) => {
            if (result.is_honeypot) {
              // Show warning
            }
          }}
        />
      )}
    </div>
  );
}
```

### Security Dashboard

```tsx
import { SecurityDashboard } from '@/components/security/SecurityDashboard';

function App() {
  const [walletAddress] = useState('0x...');

  return (
    <Route path="/security">
      <SecurityDashboard walletAddress={walletAddress} />
    </Route>
  );
}
```

### Real-time Threat Monitoring

```tsx
import { useWalletGuard } from '@/features/security/hooks/useWalletGuard';

function SecurityMonitor() {
  const { threats, isMonitoring } = useWalletGuard({
    walletAddress: '0x...',
    autoStartMonitoring: true,
    onThreatDetected: (threat) => {
      // Show notification
      console.log('Threat detected:', threat);
    },
  });

  return (
    <div>
      {threats.map((threat) => (
        <ThreatCard key={threat.threat_id} threat={threat} />
      ))}
    </div>
  );
}
```

## Error Handling

Wrap components with error boundaries:

```tsx
import { SecurityErrorBoundary } from '@/components/errors/ErrorBoundary';

<SecurityErrorBoundary>
  <SecurityDashboard />
</SecurityErrorBoundary>
```

## Environment Setup

Add to `.env`:
```bash
VITE_API_URL=http://localhost:8000
VITE_HONEYPOT_DETECTOR_URL=http://localhost:8001
VITE_WALLET_GUARD_URL=http://localhost:8003
VITE_WS_URL=ws://localhost:8003/ws
VITE_SENTRY_DSN=your-sentry-dsn
```

