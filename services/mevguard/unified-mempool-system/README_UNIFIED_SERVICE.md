# 🚀 Unified Mempool Service

## Overview

The Unified Mempool Service integrates three powerful mempool services into a single, easy-to-use API:

1. **mempool-core** (port 8000) - Advanced analytics, transactions, MEV detection
2. **mempool-hub** (port 8011) - Unified stats, threat detection, transaction analysis  
3. **unified-engine** (port 8001) - Real-time monitoring, comprehensive analytics

## Quick Start

### Start the Unified Service

```bash
cd unified-mempool-system
python api/unified_mempool_service.py
```

The service will start on **port 8002**.

### Start All Services

Make sure all services are running:

```bash
# Terminal 1 - mempool-core
cd src/unified_mempool/mempool-core/app
python -m api.main

# Terminal 2 - mempool-hub
cd src/unified_mempool/mempool-hub
python app.py

# Terminal 3 - unified-engine
cd unified-mempool-system
python api/unified_api_gateway.py

# Terminal 4 - unified service
cd unified-mempool-system
python api/unified_mempool_service.py
```

## API Endpoints

### Health & Status

- `GET /` - Service information
- `GET /health` - Health check for all services
- `GET /api/v1/services` - Status of all integrated services

### Data Endpoints

- `GET /api/v1/dashboard` - Unified dashboard data
- `GET /api/v1/transactions` - Transactions from all sources
- `GET /api/v1/analytics` - Analytics from all services
- `GET /api/v1/mev` - MEV opportunities and analysis
- `GET /api/v1/threats` - Threat detection data
- `GET /api/v1/stats` - Network statistics

## Configuration

Set environment variables to customize service URLs:

```bash
export MEMPOOL_CORE_URL=http://localhost:8000
export MEMPOOL_HUB_URL=http://localhost:8011
export UNIFIED_ENGINE_URL=http://localhost:8001
```

## Testing

```bash
# Test service health
curl http://localhost:8002/health

# Get unified dashboard
curl http://localhost:8002/api/v1/dashboard

# Get service status
curl http://localhost:8002/api/v1/services
```

## Integration

The unified service automatically:
- ✅ Checks health of all services
- ✅ Aggregates data from multiple sources
- ✅ Provides fallback if services are unavailable
- ✅ Handles errors gracefully

## Next Steps

See `DASHBOARD_FEATURES_DOCUMENTATION.md` for dashboard integration guide.


