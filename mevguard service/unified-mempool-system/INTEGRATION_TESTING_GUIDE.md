# 🧪 Service Integration Testing Guide

## Quick Start

### Step 1: Test Each Service Individually

```bash
# Test all services
python test_services.py
```

This will check:
- ✅ mempool-core health (port 8000)
- ✅ mempool-hub health (port 8011)
- ✅ unified-engine health (port 8001)
- ✅ mempool-ingestor initialization

### Step 2: Start All Services

**Windows (PowerShell):**
```powershell
.\start_all_services.ps1
```

**Linux/Mac:**
```bash
./start_all_services.sh
```

**Manual Start (if scripts don't work):**

Terminal 1 - mempool-core:
```bash
cd src/unified_mempool/mempool-core/app
python -m api.main
```

Terminal 2 - mempool-hub:
```bash
cd src/unified_mempool/mempool-hub
python app.py
```

Terminal 3 - unified-engine:
```bash
python api/unified_api_gateway.py
```

### Step 3: Verify Services

```bash
# Check mempool-core
curl http://localhost:8000/health

# Check mempool-hub
curl http://localhost:8011/health

# Check unified-engine
curl http://localhost:8001/health

# Check integrated services
curl http://localhost:8001/api/v1/integrated/health
```

## Integration Endpoints

Once services are running, the unified API gateway provides integrated endpoints:

### Health Check
```
GET /api/v1/integrated/health
```

### Get Transactions (from mempool-core)
```
GET /api/v1/integrated/transactions?limit=100&network=ethereum
```

### Get Stats (from mempool-hub)
```
GET /api/v1/integrated/stats/ethereum
```

### Get Threats (from mempool-hub)
```
GET /api/v1/integrated/threats
```

### Analyze Transaction (mempool-hub)
```
POST /api/v1/integrated/analyze
{
  "tx_hash": "0x...",
  "from_address": "0x...",
  "to_address": "0x...",
  "value": 1.0,
  "gas_price": 50000000000,
  "network": "ethereum"
}
```

### Get Analytics (from mempool-core)
```
GET /api/v1/integrated/analytics/dashboard
```

## Testing Checklist

- [ ] All services start successfully
- [ ] Health checks return 200
- [ ] Integrated endpoints work
- [ ] Transactions can be fetched
- [ ] Stats can be retrieved
- [ ] Threats can be detected
- [ ] Analytics are available

## Troubleshooting

### Service Won't Start

1. **Check dependencies:**
   ```bash
   pip install -r src/unified_mempool/mempool-core/app/requirements.txt
   ```

2. **Check ports:**
   - mempool-core: 8000
   - mempool-hub: 8011
   - unified-engine: 8001

3. **Check logs:**
   ```bash
   # Windows
   Get-Content logs\mempool-core.log -Tail 50
   
   # Linux/Mac
   tail -f logs/mempool-core.log
   ```

### Integration Not Working

1. **Check service health:**
   ```bash
   python test_services.py
   ```

2. **Verify integration module:**
   ```bash
   python -c "from integrate_services import service_integration; print('OK')"
   ```

3. **Check unified API logs:**
   - Look for "✅ Service integration initialized"
   - Check for any import errors

## Next Steps

After successful integration:

1. ✅ Update MEV Protection to use integrated services
2. ✅ Add dashboard components for new endpoints
3. ✅ Configure mempool-ingestor for multi-tenant support
4. ✅ Set up monitoring and alerts

---

**Ready to integrate! Start services and test the endpoints.**


