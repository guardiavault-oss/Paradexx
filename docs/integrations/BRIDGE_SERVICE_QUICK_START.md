# Cross-Chain Bridge Service - Quick Start Guide 🚀

## Quick Setup (5 minutes)

### 1. Start the Bridge Service

```bash
# Option 1: Direct Python
cd cross-chain-bridge-service
uvicorn src.api.main:app --host 0.0.0.0 --port 8000

# Option 2: Docker
cd cross-chain-bridge-service
docker-compose up -d
```

### 2. Configure Paradox

Add to `.env`:
```bash
BRIDGE_SERVICE_URL=http://localhost:8000
BRIDGE_SERVICE_TIMEOUT=30.0
ENABLE_BRIDGE_SERVICE=true
```

### 3. Start Paradox Backend

```bash
uvicorn app.api.main_comprehensive:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Verify Integration

```bash
# Check bridge service health
curl http://localhost:8000/health

# Check Paradox bridge endpoints
curl http://localhost:8000/api/bridge-service/health
```

---

## Common Use Cases

### Analyze a Bridge (Backend)

```python
from app.core.bridge_service_client import get_bridge_service_client

client = get_bridge_service_client()

# Analyze bridge security
result = await client.analyze_bridge(
    bridge_address="0x1234...",
    source_network="ethereum",
    target_network="polygon",
    analysis_depth="comprehensive"
)

print(f"Security Score: {result['security_score']}")
print(f"Risk Level: {result['risk_level']}")
```

### Analyze a Bridge (Frontend)

```typescript
import { useBridgeService } from '../hooks/useBridgeService';

function BridgeComponent() {
  const bridgeService = useBridgeService();
  
  const analyze = async () => {
    const analysis = await bridgeService.analyzeBridge(
      '0x1234...',
      'ethereum',
      'polygon'
    );
    
    if (analysis) {
      console.log('Score:', analysis.security_score);
      console.log('Risk:', analysis.risk_level);
    }
  };
  
  return <button onClick={analyze}>Analyze</button>;
}
```

### Comprehensive Security Scan

```python
# Backend
scan = await client.comprehensive_security_scan(
    bridge_address="0x1234...",
    network="ethereum",
    transaction_data=[],
    scan_options={
        "include_attack_analysis": True,
        "include_signature_analysis": True,
        "deep_scan": True
    }
)
```

### Get Network Status

```typescript
// Frontend
const status = await bridgeService.getNetworkStatus('ethereum');
console.log('Network:', status.status); // 'operational' | 'degraded' | 'down'
```

---

## API Endpoints Quick Reference

### Health & Status
- `GET /api/bridge-service/health` - Service health
- `GET /api/bridge-service/network/status?network=ethereum` - Network status
- `GET /api/bridge-service/network/supported` - Supported networks

### Bridge Analysis
- `POST /api/bridge-service/analyze` - Analyze bridge
- `POST /api/bridge-service/security-score` - Get security score
- `POST /api/bridge-service/comprehensive-scan` - Full security scan

### Security Monitoring
- `POST /api/bridge-service/detect-attestation-anomalies` - Detect anomalies
- `POST /api/bridge-service/analyze-quorum-skews` - Analyze quorum
- `POST /api/bridge-service/proof-of-reserves` - Monitor reserves

### Transaction
- `POST /api/bridge-service/transaction/validate` - Validate transaction
- `GET /api/bridge-service/transaction/{hash}/status` - Transaction status

---

## Troubleshooting

### Bridge Service Not Responding

1. Check if service is running:
   ```bash
   curl http://localhost:8000/health
   ```

2. Check logs:
   ```bash
   # If using Docker
   docker-compose logs -f cross-chain-bridge-service
   ```

3. Verify port is available:
   ```bash
   netstat -an | grep 8000
   ```

### Integration Errors

1. Check environment variables:
   ```bash
   echo $BRIDGE_SERVICE_URL
   ```

2. Check Paradox logs for connection errors

3. Verify authentication token is valid

### Frontend Not Connecting

1. Check API base URL in `.env`:
   ```bash
   VITE_API_URL=http://localhost:8000
   ```

2. Check browser console for CORS errors

3. Verify authentication token in localStorage

---

## Example Requests

### Analyze Bridge (cURL)

```bash
curl -X POST http://localhost:8000/api/bridge-service/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "bridge_address": "0x1234567890123456789012345678901234567890",
    "source_network": "ethereum",
    "target_network": "polygon",
    "analysis_depth": "comprehensive"
  }'
```

### Get Security Score

```bash
curl -X POST http://localhost:8000/api/bridge-service/security-score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "bridge_address": "0x1234567890123456789012345678901234567890",
    "network": "ethereum"
  }'
```

---

## Next Steps

1. **Read Full Documentation**: See `CROSS_CHAIN_INTEGRATION_SUMMARY.md`
2. **Explore API**: Visit `http://localhost:8000/docs` for interactive API docs
3. **Test Integration**: Use the BridgeModal component in the frontend
4. **Monitor Health**: Set up health check monitoring

---

## Support

- **Documentation**: `CROSS_CHAIN_INTEGRATION_SUMMARY.md`
- **API Docs**: `http://localhost:8000/docs`
- **Bridge Service Docs**: `cross-chain-bridge-service/README.md`

