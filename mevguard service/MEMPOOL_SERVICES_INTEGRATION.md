# 🔗 Mempool Services Integration Guide

## ✅ New Services Added

You've added **5 powerful mempool service components** that can significantly enhance your system:

### 1. **mempool-core** 🎯
**Location**: `src/unified_mempool/mempool-core/`

**Features**:
- ✅ **Elite Mempool System API** - Enterprise-grade FastAPI application
- ✅ **Enhanced Mempool Monitor** - Fully asynchronous processing with AsyncWeb3
- ✅ **MEV Detection** - Advanced MEV analysis and detection
- ✅ **Database Integration** - PostgreSQL with asyncpg
- ✅ **Prometheus Metrics** - System monitoring and metrics
- ✅ **Multiple Routers**:
  - `/api/v1/transactions` - Transaction management
  - `/api/v1/alerts` - Alert system
  - `/api/v1/rules` - Rule engine
  - `/api/v1/mev` - MEV detection
  - `/api/v1/analytics` - Analytics and reporting
  - `/api/v1/websocket` - Real-time streaming

**Port**: 8000 (configurable)

### 2. **mempool-hub** 🔄
**Location**: `src/unified_mempool/mempool-hub/`

**Features**:
- ✅ **Unified Mempool Operations** - Consolidates monitoring, ingestion, and analysis
- ✅ **WebSocket Support** - Real-time mempool data streaming
- ✅ **Threat Detection** - Sandwich attacks, front-running detection
- ✅ **Multi-Network Support** - Ethereum, Polygon, Arbitrum, Optimism
- ✅ **Real-time Stats** - Mempool statistics broadcasting

**Port**: 8011

**Endpoints**:
- `GET /health` - Health check
- `GET /stats/{network}` - Network mempool stats
- `GET /transactions/{network}` - Pending transactions
- `GET /threats` - Threat detections
- `POST /analyze` - Transaction analysis
- `WS /ws/{network}` - WebSocket streaming

### 3. **mempool-ingestor** 📥
**Location**: `src/unified_mempool/mempool-ingestor/`

**Features**:
- ✅ **Smart Ingestor** - Filtered, tenant-aware transaction streaming
- ✅ **Multi-Tenant Support** - Tenant-specific filtering
- ✅ **Network Listeners** - WebSocket listeners for multiple networks
- ✅ **Global Filters** - Noise reduction filters
- ✅ **Tenant Routing** - Route transactions to relevant tenants

**Key Features**:
- Tenant configuration loading
- Network-specific listeners
- Value-based filtering
- Contract address filtering
- Module routing

### 4. **mempool-legacy** 📚
**Location**: `src/unified_mempool/mempool-legacy/`

**Features**:
- ✅ **Filter Engine** - Legacy filter compiler
- ✅ **Backward Compatibility** - Support for legacy systems

### 5. **mempool-service** 🛠️
**Location**: `src/unified_mempool/mempool-service/`

**Features**:
- ✅ **Service Tests** - Comprehensive test suite
- ✅ **Container Tests** - Mempool container testing

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Unified Mempool System                    │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐    ┌───────▼──────┐    ┌───────▼──────┐
│ mempool-core │    │ mempool-hub  │    │mempool-      │
│              │    │              │    │ingestor      │
│ - API        │◄───┤ - Unified    │◄───┤              │
│ - Monitor    │    │   Ops        │    │ - Smart      │
│ - MEV        │    │ - WebSocket  │    │   Filtering  │
│ - Analytics  │    │ - Threats    │    │ - Multi-     │
│ - Database   │    │              │    │   Tenant     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    ┌───────▼──────┐
                    │  MEV         │
                    │  Protection  │
                    │  Service     │
                    └──────────────┘
```

## 🔌 Integration Strategy

### Option 1: Unified API Gateway (Recommended)

Create a unified gateway that routes to all services:

```python
# unified-api-gateway.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="Unified Mempool Gateway")

# Service URLs
MEMPOOL_CORE_URL = "http://localhost:8000"
MEMPOOL_HUB_URL = "http://localhost:8011"
MEMPOOL_INGESTOR_URL = "http://localhost:8012"

@app.get("/api/v1/transactions")
async def get_transactions():
    """Route to mempool-core"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{MEMPOOL_CORE_URL}/api/v1/transactions")
        return response.json()

@app.get("/api/v1/stats/{network}")
async def get_stats(network: str):
    """Route to mempool-hub"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{MEMPOOL_HUB_URL}/stats/{network}")
        return response.json()
```

### Option 2: Direct Integration

Integrate each service directly into your existing unified API:

```python
# In unified_api_gateway.py
from mempool_core.app.api.main import app as core_app
from mempool_hub.app import app as hub_app
from mempool_ingestor.smart_ingestor import SmartMempoolIngestor

# Mount sub-applications
app.mount("/core", core_app)
app.mount("/hub", hub_app)

# Initialize ingestor
ingestor = SmartMempoolIngestor()
await ingestor.start()
```

### Option 3: Microservices Architecture

Run each service independently and use service discovery:

```yaml
# docker-compose.yml
services:
  mempool-core:
    build: ./src/unified_mempool/mempool-core
    ports:
      - "8000:8000"
  
  mempool-hub:
    build: ./src/unified_mempool/mempool-hub
    ports:
      - "8011:8011"
  
  mempool-ingestor:
    build: ./src/unified_mempool/mempool-ingestor
    ports:
      - "8012:8012"
```

## 🚀 Quick Start Integration

### Step 1: Update Your Unified API Gateway

Add routes to integrate the new services:

```python
# In api/unified_api_gateway.py

# Import new services
import sys
sys.path.append('src/unified_mempool')

from mempool_hub.app import mempool_hub
from mempool_ingestor.smart_ingestor import SmartMempoolIngestor

# Initialize ingestor
ingestor = SmartMempoolIngestor()
await ingestor.start()

# Add hub routes
@app.get("/api/v1/hub/stats/{network}")
async def get_hub_stats(network: str):
    stats = mempool_hub.get_mempool_stats(network)
    return stats.dict()

@app.get("/api/v1/hub/threats")
async def get_hub_threats():
    return {
        "threats": [detection.dict() for detection in mempool_hub.threat_detections]
    }
```

### Step 2: Update MEV Protection Integration

Update `ProtectedAddressManager` to use the new services:

```python
# In src/mev_protection/core/protected_address_manager.py

class ProtectedAddressManager:
    def __init__(self, mev_engine, mempool_api_url=None):
        # Use mempool-hub for unified operations
        self.mempool_hub_url = mempool_api_url or "http://localhost:8011"
        # Or use mempool-core for advanced features
        self.mempool_core_url = "http://localhost:8000"
```

### Step 3: Add Service Health Checks

```python
@app.get("/health/services")
async def check_services():
    services = {
        "mempool_core": await check_service("http://localhost:8000/health"),
        "mempool_hub": await check_service("http://localhost:8011/health"),
        "unified_engine": await check_service("http://localhost:8001/health")
    }
    return services
```

## 📊 Enhanced Features Available

### From mempool-core:
- **Advanced Analytics** - `/api/v1/analytics/*`
- **Rule Engine** - `/api/v1/rules/*`
- **Alert System** - `/api/v1/alerts/*`
- **MEV Detection** - `/api/v1/mev/*`
- **Database Persistence** - PostgreSQL integration
- **Prometheus Metrics** - `/metrics`

### From mempool-hub:
- **Unified Stats** - `/stats/{network}`
- **Threat Detection** - `/threats`
- **Transaction Analysis** - `/analyze`
- **WebSocket Streaming** - `/ws/{network}`

### From mempool-ingestor:
- **Smart Filtering** - Tenant-aware filtering
- **Multi-Tenant Support** - Isolated tenant processing
- **Network Listeners** - Real-time WebSocket listeners
- **Efficient Routing** - Route to relevant modules

## 🔄 Integration with MEV Protection

### Update ProtectedAddressManager

```python
# Use mempool-hub for unified operations
async def _monitor_mempool_service(self):
    """Monitor using mempool-hub"""
    async with self.mempool_session.ws_connect(
        f"{self.mempool_hub_url}/ws/ethereum"
    ) as ws:
        async for msg in ws:
            if msg.type == aiohttp.WSMsgType.TEXT:
                data = json.loads(msg.data)
                if data.get("type") == "mempool_stats":
                    # Process mempool stats
                    await self._process_mempool_stats(data["data"])
```

### Use mempool-core for Advanced Analytics

```python
# Get advanced analytics from mempool-core
async def get_advanced_analytics(self):
    async with self.mempool_session.get(
        f"{self.mempool_core_url}/api/v1/analytics/dashboard"
    ) as response:
        return await response.json()
```

## 🎯 Recommended Integration Approach

### Phase 1: Start with mempool-hub
- ✅ Easiest to integrate
- ✅ Unified operations
- ✅ WebSocket support
- ✅ Threat detection

### Phase 2: Add mempool-core
- ✅ Advanced analytics
- ✅ Database persistence
- ✅ Rule engine
- ✅ Alert system

### Phase 3: Integrate mempool-ingestor
- ✅ Multi-tenant support
- ✅ Smart filtering
- ✅ Efficient routing

## 📝 Next Steps

1. **Test Each Service Individually**
   ```bash
   # Test mempool-core
   cd src/unified_mempool/mempool-core
   python app/api/main.py
   
   # Test mempool-hub
   cd src/unified_mempool/mempool-hub
   python app.py
   
   # Test mempool-ingestor
   cd src/unified_mempool/mempool-ingestor
   python smart_ingestor.py
   ```

2. **Update Unified API Gateway**
   - Add routes for new services
   - Integrate health checks
   - Add service discovery

3. **Update MEV Protection**
   - Use mempool-hub for monitoring
   - Use mempool-core for analytics
   - Integrate threat detection

4. **Update Dashboard**
   - Add new analytics endpoints
   - Integrate WebSocket streams
   - Add threat detection UI

---

**These services provide enterprise-grade mempool monitoring capabilities! Let's integrate them into your unified system.**


