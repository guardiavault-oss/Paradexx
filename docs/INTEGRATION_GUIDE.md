# Integration Guide

Complete integration guide for all RegenX services.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Wallet Integration](#wallet-integration)
3. [MEV Protection](#mev-protection)
4. [Bridge Service](#bridge-service)
5. [Security Services](#security-services)
6. [AI Service](#ai-service)
7. [WebSocket Integration](#websocket-integration)
8. [Guardia-Vault Integration](#guardia-vault-integration)

## Getting Started

### Installation

```bash
npm install @regenx/sdk
```

### Basic Setup

```typescript
import { RegenX } from '@regenx/sdk';

const regenx = new RegenX({
  apiKey: 'your-api-key',
  environment: 'production', // or 'staging', 'development'
});
```

## Wallet Integration

### Connect Wallet

```typescript
import { useWallet } from '@/hooks/useWallet';

function MyComponent() {
  const { connect, disconnect, isConnected, address } = useWallet();

  return (
    <button onClick={connect}>
      {isConnected ? `Connected: ${address}` : 'Connect Wallet'}
    </button>
  );
}
```

### Get Balance

```typescript
import { apiClient } from '@/services/api';

const balance = await apiClient.get('/wallet/balance');
console.log(balance.data.balanceUSD);
```

### Send Transaction

```typescript
const tx = await apiClient.post('/wallet/send', {
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  value: '100000000000000000', // 0.1 ETH
});

console.log('Transaction hash:', tx.data.hash);
```

## MEV Protection

### Enable MEV Protection

```typescript
import { MEVThreatHandler } from '@/services/websocket';

const mevHandler = new MEVThreatHandler(wsManager);

mevHandler.subscribe({
  onAlert: (alert) => {
    if (alert.severity === 'critical') {
      console.error('MEV threat detected!', alert);
    }
  },
});

// Enable monitoring
mevHandler.enableMonitoring('0x...');
```

### Protect Transaction

```typescript
// Before sending transaction
const threatCheck = await apiClient.post('/mev/check', {
  transaction: {
    to: '0x...',
    value: '100000000000000000',
  },
});

if (threatCheck.data.isThreat) {
  // Enable protection
  await apiClient.post('/mev/protect', {
    transactionHash: txHash,
    protectionType: 'private_pool',
  });
}
```

## Bridge Service

### Bridge Tokens

```typescript
import { BridgeTransactionHandler } from '@/services/websocket';

const bridgeHandler = new BridgeTransactionHandler(wsManager);

// Initiate bridge
const txId = bridgeHandler.initiateBridge({
  sourceChain: 'ethereum',
  targetChain: 'polygon',
  amount: '1000000000000000000',
  token: 'ETH',
  fromAddress: '0x...',
  toAddress: '0x...',
});

// Subscribe to updates
bridgeHandler.subscribeToTransaction(txId, {
  onUpdate: (update) => {
    console.log('Progress:', update.progress?.percentage);
  },
  onStatusChange: (txId, status) => {
    if (status === 'completed') {
      console.log('Bridge completed!');
    }
  },
});
```

## Security Services

### Scan Address

```typescript
const scanResult = await apiClient.post('/security/scan', {
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
});

if (!scanResult.data.isSafe) {
  console.warn('Address has security risks:', scanResult.data.threats);
}
```

### Enable Wallet Guard

```typescript
import { SecurityThreatHandler } from '@/services/websocket';

const securityHandler = new SecurityThreatHandler(wsManager);

securityHandler.subscribe({
  onThreat: (threat) => {
    // Show alert to user
    alert(`Security threat: ${threat.description}`);
  },
});

securityHandler.enableMonitoring('0x...', {
  monitorTransactions: true,
  monitorContracts: true,
});
```

## AI Service

### Chat Integration

```typescript
import { AIStreamHandler } from '@/services/websocket';

const aiHandler = new AIStreamHandler(wsManager);

const requestId = aiHandler.sendMessage('What is DeFi?');

aiHandler.startStream(requestId, {
  onChunk: (chunk) => {
    // Update UI with streaming content
    console.log(chunk.content);
  },
  onComplete: (fullContent) => {
    console.log('Complete:', fullContent);
  },
});
```

## WebSocket Integration

### Basic Setup

```typescript
import { wsManager } from '@/services/websocket';

// Connect
await wsManager.connect();

// Subscribe to channel
const unsubscribe = wsManager.subscribe('wallet:activity', (data) => {
  console.log('Activity:', data);
});

// Send message
wsManager.send({
  type: 'custom_event',
  data: { message: 'Hello' },
  timestamp: new Date().toISOString(),
});
```

### React Hook

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

function MyComponent() {
  const { status, isConnected, send, subscribe } = useWebSocket({
    autoConnect: true,
  });

  useEffect(() => {
    const unsubscribe = subscribe('my:channel', (data) => {
      console.log(data);
    });
    return unsubscribe;
  }, [subscribe]);

  return <div>Status: {status}</div>;
}
```

## Guardia-Vault Integration

### Collaboration Features

```typescript
import { CollaborationHandler } from '@/services/websocket';

const collabHandler = new CollaborationHandler(wsManager);

// Join vault
collabHandler.joinVault('vault_123', 'user_456', 'guardian');

// Subscribe to events
collabHandler.subscribeToVault('vault_123', {
  onEvent: (event) => {
    console.log('Event:', event);
  },
  onPresenceUpdate: (presence) => {
    console.log('Active users:', presence.users.length);
  },
});

// Send message
collabHandler.sendMessage('vault_123', 'Hello guardians!');
```

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch
2. **Loading States**: Show loading indicators during async operations
3. **WebSocket**: Clean up subscriptions on component unmount
4. **Security**: Never expose API keys in client-side code
5. **Rate Limiting**: Respect rate limits and implement retry logic
6. **Offline Support**: Use offline queue for critical operations

## Troubleshooting

See [Troubleshooting Guide](./TROUBLESHOOTING.md) for common issues and solutions.

