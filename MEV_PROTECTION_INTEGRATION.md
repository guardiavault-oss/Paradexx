# MEV Protection Integration Guide

This guide explains how to use the MEV Protection service integration in your wallet project.

## Overview

The wallet now integrates with the MEV Protection service to provide real-time protection against:
- Sandwich attacks
- Frontrunning
- Backrunning
- Flash loan attacks
- Other MEV exploits

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# MEV Protection Service URL
MEV_PROTECTION_API_URL=http://localhost:8000

# API Key (default: demo-api-key)
MEV_PROTECTION_API_KEY=demo-api-key

# Enable by default
MEV_PROTECTION_ENABLED=true
MEV_PROTECTION_LEVEL=high
```

### Starting the MEV Protection Service

1. Navigate to the MEV protection service directory:
```bash
cd "mevguard service"
```

2. Start the service:
```bash
python main.py
# or
python api.py
```

The service will run on `http://localhost:8000` by default.

## Usage

### Basic Transaction with MEV Protection

```typescript
import { transactionService } from './src/backend/services/transaction.service';

// Send transaction with MEV protection enabled
const txHash = await transactionService.sendTransaction({
  from: '0x...',
  to: '0x...',
  amount: '1.0',
  privateKey: '0x...',
  chain: 'ethereum',
  mevProtection: true,
  protectionLevel: 'high', // basic, standard, high, maximum, enterprise
  slippageTolerance: 0.5, // 0.5% slippage tolerance
});
```

### Advanced Usage

```typescript
import { mevProtectionApi } from './src/backend/services/mev-protection-api.service';

// 1. Check service status
const isConnected = mevProtectionApi.isConnectedToService();
if (!isConnected) {
  console.warn('MEV Protection service is not available');
}

// 2. Start protection for networks
await mevProtectionApi.startProtection({
  networks: ['ethereum', 'polygon', 'bsc'],
  protection_level: 'high',
});

// 3. Get protection status
const status = await mevProtectionApi.getProtectionStatus();
console.log('Protection active:', status.is_active);
console.log('Transactions protected (24h):', status.transactions_protected_24h);
console.log('Value protected (USD):', status.value_protected_usd);

// 4. Analyze transaction before sending
const analysis = await mevProtectionApi.analyzeTransaction(
  '0x...',
  1, // ethereum chain ID
  'standard' // detection level
);

// 5. Get MEV metrics
const metrics = await mevProtectionApi.getMevMetrics('24h');
console.log('MEV saved:', metrics.total_mev_saved, 'ETH');
console.log('Success rate:', metrics.protection_success_rate, '%');

// 6. Detect threats
const threats = await mevProtectionApi.detectThreats({
  network: 'ethereum',
  severity: 'high',
  limit: 10,
});
```

## Protection Levels

- **basic**: Basic slippage protection (2%), monitoring
- **standard**: Enhanced protection (1%), frontrunning detection
- **high**: Advanced protection (0.5%), private relays (recommended)
- **maximum**: Maximum protection (0.1%), multi-relay routing, pre-execution simulation
- **enterprise**: Custom algorithms, dedicated infrastructure

## Supported Networks

- Ethereum (Chain ID: 1)
- Polygon (Chain ID: 137)
- BSC (Chain ID: 56)
- Arbitrum (Chain ID: 42161)
- Optimism (Chain ID: 10)
- Avalanche (Chain ID: 43114)
- Fantom (Chain ID: 250)
- Base (Chain ID: 8453)
- Linea (Chain ID: 59144)
- Scroll (Chain ID: 534352)

## API Endpoints Used

The integration uses these real endpoints from the MEV Protection service:

### Protection Management
- `POST /api/v1/protection/start` - Start protection
- `POST /api/v1/protection/stop` - Stop protection
- `GET /api/v1/protection/status` - Get status

### Transaction Protection
- `POST /api/v1/transactions/protect` - Protect transaction

### Threat Detection
- `GET /api/v1/threats` - Get detected threats

### Analytics
- `GET /api/v1/mev/metrics` - Get MEV metrics
- `GET /api/v1/stats` - Get statistics
- `GET /api/v1/dashboard` - Get dashboard data

### Analysis
- `POST /api/v1/mev/detect` - Analyze transaction

## Error Handling

The integration includes automatic error handling:

1. **Service Unavailable**: If the MEV protection service is down, transactions will still proceed (with a warning)
2. **Network Errors**: Retries with exponential backoff
3. **Validation Errors**: Detailed error messages

## Testing

1. Start the MEV protection service:
```bash
cd "mevguard service"
python api.py
```

2. Test the connection:
```typescript
import { mevProtectionApi } from './src/backend/services/mev-protection-api.service';

const connected = await mevProtectionApi.checkConnection();
console.log('Connected:', connected);
```

3. Send a protected transaction:
```typescript
const txHash = await transactionService.sendTransaction({
  // ... transaction params
  mevProtection: true,
});
```

## Troubleshooting

### Service Not Available

If you see "MEV Protection service is not available":
1. Check if the service is running: `curl http://localhost:8000/health`
2. Verify the API URL in `.env`
3. Check firewall/network settings

### Transaction Not Protected

If transactions aren't being protected:
1. Verify `mevProtection: true` is set
2. Check the chain ID is supported
3. Review service logs for errors

### API Key Issues

If you get authentication errors:
1. Verify `MEV_PROTECTION_API_KEY` in `.env`
2. Default key is `demo-api-key` (change in production)

## Next Steps

1. Configure your MEV protection service URL
2. Set appropriate protection levels for your use case
3. Monitor protection statistics
4. Adjust settings based on your transaction patterns

## Support

For issues or questions:
- Check service logs: `mevguard service` directory
- Review API documentation: `API_ENDPOINTS_DOCUMENTATION.md`
- Check service health: `GET /health` endpoint


