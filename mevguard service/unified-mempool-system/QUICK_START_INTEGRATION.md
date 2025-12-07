# 🚀 Quick Start: Service Integration

## Step 1: Test Services

Run the test script to check if services are running:

```bash
cd unified-mempool-system
python test_services.py
```

## Step 2: Start Services (Choose One Method)

### Method A: Use Start Scripts

**Windows:**
```powershell
.\start_all_services.ps1
```

**Linux/Mac:**
```bash
chmod +x start_all_services.sh
./start_all_services.sh
```

### Method B: Manual Start (3 Terminals)

**Terminal 1 - mempool-core:**
```bash
cd unified-mempool-system/src/unified_mempool/mempool-core/app
python -m api.main
```

**Terminal 2 - mempool-hub:**
```bash
cd unified-mempool-system/src/unified_mempool/mempool-hub
python app.py
```

**Terminal 3 - unified-engine:**
```bash
cd unified-mempool-system
python api/unified_api_gateway.py
```

## Step 3: Verify Integration

```bash
# Check integrated health
curl http://localhost:8001/api/v1/integrated/health

# Get transactions from mempool-core
curl http://localhost:8001/api/v1/integrated/transactions?limit=10

# Get stats from mempool-hub
curl http://localhost:8001/api/v1/integrated/stats/ethereum

# Get threats from mempool-hub
curl http://localhost:8001/api/v1/integrated/threats
```

## What's Integrated?

✅ **mempool-core** → Advanced analytics, transactions, MEV detection
✅ **mempool-hub** → Unified stats, threat detection, transaction analysis
✅ **mempool-ingestor** → Smart filtering (ready for integration)

## Next Steps

1. ✅ Test each service individually
2. ✅ Start all services
3. ✅ Verify integration endpoints
4. ✅ Update MEV Protection to use integrated services
5. ✅ Add dashboard components

---

**Ready to test! Start the services and verify the integration.**


