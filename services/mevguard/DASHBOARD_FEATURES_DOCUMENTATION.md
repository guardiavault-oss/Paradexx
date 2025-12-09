# 📊 Dashboard Features Documentation
## New Features from Unified Mempool Service Integration

This document outlines all the new features and components that should be added to the dashboard based on the unified mempool service integration.

---

## 🎯 Overview

The unified mempool service integrates three powerful services:
1. **mempool-core** - Advanced analytics, transactions, MEV detection
2. **mempool-hub** - Unified stats, threat detection, transaction analysis
3. **unified-engine** - Real-time monitoring, comprehensive analytics

All services are now accessible through a single unified API endpoint at `http://localhost:8002`.

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:8002
```

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service information and status |
| `/health` | GET | Health check for all services |
| `/api/v1/services` | GET | Status of all integrated services |
| `/api/v1/dashboard` | GET | Unified dashboard data |
| `/api/v1/transactions` | GET | Transactions from all sources |
| `/api/v1/analytics` | GET | Analytics from all services |
| `/api/v1/mev` | GET | MEV opportunities and analysis |
| `/api/v1/threats` | GET | Threat detection data |
| `/api/v1/stats` | GET | Network statistics |

---

## 🆕 New Dashboard Features to Implement

### 1. **Service Status Panel** ⚡
**Priority: HIGH**

Display the health and status of all integrated services.

**Components:**
- Service health indicators (green/yellow/red)
- Service URLs and connection status
- Last health check timestamp
- Service-specific metrics (uptime, response time)

**API Endpoint:**
```
GET /api/v1/services
```

**Response Structure:**
```json
{
  "services": {
    "mempool-core": {
      "healthy": true,
      "url": "http://localhost:8000",
      "status": { ... }
    },
    "mempool-hub": {
      "healthy": true,
      "url": "http://localhost:8011",
      "status": { ... }
    },
    "unified-engine": {
      "healthy": true,
      "url": "http://localhost:8001",
      "status": { ... }
    }
  }
}
```

**UI Components:**
- Status cards for each service
- Health check refresh button
- Service details modal
- Connection latency display

---

### 2. **Unified Dashboard View** 📈
**Priority: HIGH**

Aggregated dashboard showing data from all services.

**Components:**
- Real-time transaction count
- Network statistics (all chains)
- MEV opportunities summary
- Threat alerts summary
- Service-specific data panels

**API Endpoint:**
```
GET /api/v1/dashboard
```

**Response Structure:**
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "unified-engine": { ... },
    "mempool-hub": { ... },
    "mempool-core": { ... }
  },
  "aggregated": {
    "total_transactions": 12345,
    "active_networks": 5,
    "mev_opportunities": 23,
    "threats_detected": 5
  }
}
```

**UI Components:**
- Multi-service data grid
- Service selector tabs
- Aggregated metrics cards
- Real-time update indicator
- Export dashboard data button

---

### 3. **Enhanced Transactions View** 🔄
**Priority: HIGH**

Unified transaction view with data from multiple sources.

**Features:**
- Filter by network (ethereum, polygon, arbitrum, etc.)
- Filter by minimum value
- Show suspicious transactions only
- Transaction source indicator (which service detected it)
- Enhanced transaction details

**API Endpoint:**
```
GET /api/v1/transactions?limit=100&network=ethereum&min_value=0.1&suspicious_only=true
```

**Query Parameters:**
- `limit` (1-1000): Number of transactions to return
- `network`: Filter by network
- `min_value`: Minimum transaction value
- `suspicious_only`: Show only suspicious transactions

**UI Components:**
- Transaction table with source column
- Network filter dropdown
- Value range slider
- Suspicious transactions toggle
- Transaction detail modal
- Export transactions (CSV/JSON)

---

### 4. **Multi-Source Analytics** 📊
**Priority: MEDIUM**

Analytics dashboard combining data from all services.

**Features:**
- Performance analytics (from unified-engine)
- Security analytics (from mempool-core)
- Network analytics (from mempool-hub)
- Comparative charts (service vs service)
- Time-series analytics

**API Endpoint:**
```
GET /api/v1/analytics?endpoint=dashboard&network=ethereum
```

**Query Parameters:**
- `endpoint`: Analytics endpoint (dashboard, performance, security)
- `network`: Filter by network

**UI Components:**
- Analytics tabs (Performance, Security, Network)
- Service comparison charts
- Time-series graphs
- Analytics export
- Custom date range picker

---

### 5. **Unified MEV Detection** 💰
**Priority: HIGH**

MEV opportunities from all detection sources.

**Features:**
- MEV opportunities list
- MEV type filtering (sandwich, arbitrage, liquidation)
- Profit estimation
- Confidence scores
- Network-specific MEV data

**API Endpoint:**
```
GET /api/v1/mev?endpoint=opportunities&network=ethereum&limit=50
```

**Query Parameters:**
- `endpoint`: MEV endpoint (opportunities, statistics, analysis)
- `network`: Filter by network
- `limit`: Number of results (1-500)

**UI Components:**
- MEV opportunities table
- MEV type filter
- Profit visualization
- Confidence score indicators
- MEV opportunity details modal
- MEV statistics cards

---

### 6. **Threat Intelligence Dashboard** 🛡️
**Priority: HIGH**

Unified threat detection from all services.

**Features:**
- Threat list with severity levels
- Network-specific threats
- Threat source identification
- Threat timeline
- Threat details and recommendations

**API Endpoint:**
```
GET /api/v1/threats?network=ethereum&severity=high&limit=100
```

**Query Parameters:**
- `network`: Filter by network
- `severity`: Filter by severity (low, medium, high, critical)
- `limit`: Number of results (1-1000)

**UI Components:**
- Threat list with severity badges
- Threat filter panel
- Threat timeline view
- Threat detail modal
- Threat statistics
- Threat export

---

### 7. **Network Statistics Panel** 📡
**Priority: MEDIUM**

Real-time network statistics from mempool-hub.

**Features:**
- Network-specific stats
- Pending transactions count
- Average gas price
- Network health indicators
- Historical statistics

**API Endpoint:**
```
GET /api/v1/stats?network=ethereum
```

**Query Parameters:**
- `network`: Network name (ethereum, polygon, arbitrum, etc.)

**UI Components:**
- Network selector
- Statistics cards
- Gas price chart
- Transaction volume chart
- Network health indicator

---

## 🎨 UI/UX Recommendations

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header: Service Status Indicators                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Service 1   │  │ Service 2   │  │ Service 3   │    │
│  │ Status Card │  │ Status Card │  │ Status Card │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
├─────────────────────────────────────────────────────────┤
│  Main Dashboard Content                                 │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Unified Dashboard View                             │ │
│  │ - Aggregated Metrics                               │ │
│  │ - Service-Specific Panels                          │ │
│  └───────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐                   │
│  │ Transactions │  │ MEV Detection│                   │
│  │ Panel        │  │ Panel        │                   │
│  └──────────────┘  └──────────────┘                   │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐                   │
│  │ Threats      │  │ Analytics    │                   │
│  │ Panel        │  │ Panel        │                   │
│  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### Color Coding

- **Service Status:**
  - 🟢 Green: Healthy
  - 🟡 Yellow: Degraded
  - 🔴 Red: Unhealthy

- **Threat Severity:**
  - 🟢 Low: Green
  - 🟡 Medium: Yellow
  - 🟠 High: Orange
  - 🔴 Critical: Red

- **MEV Confidence:**
  - 🔴 0-0.3: Low (Red)
  - 🟡 0.3-0.7: Medium (Yellow)
  - 🟢 0.7-1.0: High (Green)

---

## 🔄 Real-Time Updates

### WebSocket Integration

Consider adding WebSocket support for real-time updates:

```typescript
// WebSocket connection for real-time updates
const ws = new WebSocket('ws://localhost:8002/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Update dashboard with real-time data
};
```

### Polling Strategy

For HTTP polling:
- Dashboard: Every 3-5 seconds
- Transactions: Every 5-10 seconds
- Analytics: Every 30-60 seconds
- Service Status: Every 10-15 seconds

---

## 📱 Responsive Design

### Mobile Considerations

- Stack service status cards vertically
- Use collapsible panels for detailed views
- Implement swipe gestures for navigation
- Optimize charts for small screens

### Tablet Considerations

- 2-column layout for service cards
- Side-by-side panels where appropriate
- Touch-friendly controls

---

## 🚀 Implementation Priority

### Phase 1 (Immediate)
1. ✅ Service Status Panel
2. ✅ Unified Dashboard View
3. ✅ Enhanced Transactions View

### Phase 2 (Short-term)
4. ✅ Unified MEV Detection
5. ✅ Threat Intelligence Dashboard
6. ✅ Network Statistics Panel

### Phase 3 (Long-term)
7. ✅ Multi-Source Analytics
8. ✅ WebSocket Real-Time Updates
9. ✅ Advanced Filtering & Search

---

## 🔧 Technical Implementation

### API Client Setup

```typescript
// unified-api-client.ts
import axios from 'axios';

const unifiedApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_UNIFIED_API_URL || 'http://localhost:8002',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors for error handling
unifiedApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors
    return Promise.reject(error);
  }
);

export default unifiedApiClient;
```

### Example Component

```typescript
// ServiceStatusPanel.tsx
import { useEffect, useState } from 'react';
import unifiedApiClient from '../lib/unified-api-client';

export function ServiceStatusPanel() {
  const [services, setServices] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await unifiedApiClient.get('/api/v1/services');
        setServices(response.data.services);
      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
    const interval = setInterval(fetchServices, 15000); // Poll every 15s
    
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {Object.entries(services).map(([name, service]: [string, any]) => (
        <ServiceCard
          key={name}
          name={name}
          healthy={service.healthy}
          url={service.url}
        />
      ))}
    </div>
  );
}
```

---

## 📝 Notes

- All endpoints support CORS
- Rate limiting may apply (check service documentation)
- Some endpoints may require authentication (add API key if needed)
- Services may be unavailable during maintenance
- Always handle service failures gracefully

---

## 🎯 Next Steps

1. **Update API Client**: Add unified API client to dashboard
2. **Create Components**: Build new dashboard components
3. **Add Routing**: Create routes for new views
4. **Implement Real-Time**: Add WebSocket or polling
5. **Test Integration**: Verify all endpoints work
6. **Add Error Handling**: Handle service failures
7. **Optimize Performance**: Implement caching and lazy loading

---

**Ready to implement! Start with Phase 1 features and iterate based on user feedback.**



