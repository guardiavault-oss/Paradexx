# 🛡️ MEV Protection + Mempool Dashboard Integration Guide

## Overview
This guide integrates the **MEV Protection Service (Port 8004)** with the existing **Unified Mempool System Dashboard** to provide comprehensive MEV detection and protection capabilities.

## Services Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Integration Architecture                 │
├─────────────────────────────────────────────────────────────┤
│ Mempool Dashboard (Port 3000)                              │
│ │                                                           │
│ ├─ Mempool System API (Port 8001)                          │
│ │  └─ Transaction monitoring, MEV opportunities             │
│ │                                                           │
│ └─ MEV Protection Service (Port 8004)                      │
│    └─ Real-time protection, threat detection               │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Integration Steps

### 1. Start Required Services

**Start MEV Protection Service:**
```bash
cd services/mev-protection-service
python api.py  # Runs on port 8004
```

**Start Unified Mempool System:**
```bash
cd services/unified-mempool-system
python api.py  # Runs on port 8001
```

**Start Mempool Dashboard:**
```bash
cd services/unified-mempool-system/dashboard
npm run dev    # Runs on port 3000
```

### 2. Enhanced API Integration

Add these methods to `unified-mempool-system/dashboard/src/lib/api-client.ts`:

```typescript
// MEV Protection Service Methods (Port 8004)
async getMEVProtectionStatus() {
  try {
    const response = await this.client.get('http://localhost:8004/api/status');
    return {
      isActive: response.data.status === 'active',
      protectionLevel: response.data.protection_level || 'standard',
      networks: response.data.active_networks || [],
      uptime: response.data.uptime_hours || 0,
      threatsDetected: response.data.threats_detected_24h || 0,
      transactionsProtected: response.data.transactions_protected_24h || 0,
      valueProtected: response.data.value_protected_usd || 0
    };
  } catch (error) {
    console.error('MEV Protection service unavailable');
    return { isActive: false, protectionLevel: 'basic', networks: [] };
  }
}

async enableMEVProtection(config) {
  try {
    const response = await this.client.post('http://localhost:8004/api/protection/enable', config);
    return response.data.success === true;
  } catch (error) {
    return false;
  }
}

async disableMEVProtection() {
  try {
    const response = await this.client.post('http://localhost:8004/api/protection/disable');
    return response.data.success === true;
  } catch (error) {
    return false;
  }
}

async getMEVThreats(limit = 10) {
  try {
    const response = await this.client.get(`http://localhost:8004/api/threats?limit=${limit}`);
    return response.data.threats || [];
  } catch (error) {
    return [];
  }
}

async getProtectedTransactions(limit = 10) {
  try {
    const response = await this.client.get(`http://localhost:8004/api/protection/history?limit=${limit}`);
    return response.data.protected_transactions || [];
  } catch (error) {
    return [];
  }
}
```

### 3. Enhanced MEV Page

Update `unified-mempool-system/dashboard/src/app/mev/page.tsx`:

```typescript
// Add these imports
import { Shield } from 'lucide-react'

// Add protection state
const [protectionStatus, setProtectionStatus] = useState(null)
const [protectionLoading, setProtectionLoading] = useState(false)

// Add protection data fetching
useEffect(() => {
  const fetchProtectionStatus = async () => {
    try {
      const status = await apiClient.getMEVProtectionStatus()
      setProtectionStatus(status)
    } catch (error) {
      console.error('Failed to fetch protection status:', error)
    }
  }
  
  fetchProtectionStatus()
  const interval = setInterval(fetchProtectionStatus, 30000)
  return () => clearInterval(interval)
}, [])

// Add protection toggle function
const handleToggleProtection = async () => {
  setProtectionLoading(true)
  try {
    if (protectionStatus?.isActive) {
      await apiClient.disableMEVProtection()
    } else {
      await apiClient.enableMEVProtection({
        networks: ['ethereum'],
        protectionLevel: 'standard'
      })
    }
    const status = await apiClient.getMEVProtectionStatus()
    setProtectionStatus(status)
  } catch (error) {
    console.error('Failed to toggle protection:', error)
  } finally {
    setProtectionLoading(false)
  }
}
```

Add this UI component after the stats grid:

```typescript
{/* MEV Protection Panel */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3 }}
  className="glass-dark rounded-xl p-6 mb-6"
>
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-lg ${protectionStatus?.isActive ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
        {protectionStatus?.isActive ? (
          <Shield className="h-6 w-6 text-green-400" />
        ) : (
          <Shield className="h-6 w-6 text-red-400" />
        )}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white">MEV Protection</h3>
        <p className="text-sm text-muted-foreground">
          Status: {protectionStatus?.isActive ? 'Active' : 'Inactive'} • 
          Level: {protectionStatus?.protectionLevel || 'Basic'}
        </p>
      </div>
    </div>
    
    <button
      onClick={handleToggleProtection}
      disabled={protectionLoading}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
        protectionStatus?.isActive
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-green-600 hover:bg-green-700 text-white'
      } ${protectionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {protectionLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      ) : protectionStatus?.isActive ? (
        'Stop Protection'
      ) : (
        'Start Protection'
      )}
    </button>
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="p-4 rounded-lg bg-green-900/20 border border-green-800">
      <div className="text-xl font-bold text-green-400">
        {protectionStatus?.transactionsProtected || 0}
      </div>
      <p className="text-xs text-green-300">Transactions Protected</p>
    </div>
    <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-800">
      <div className="text-xl font-bold text-blue-400">
        ${protectionStatus?.valueProtected?.toLocaleString() || 0}
      </div>
      <p className="text-xs text-blue-300">Value Protected</p>
    </div>
    <div className="p-4 rounded-lg bg-red-900/20 border border-red-800">
      <div className="text-xl font-bold text-red-400">
        {protectionStatus?.threatsDetected || 0}
      </div>
      <p className="text-xs text-red-300">Threats Blocked</p>
    </div>
  </div>
</motion.div>
```

## 🔧 API Endpoints

### MEV Protection Service (Port 8004)
- `GET /api/status` - Protection status
- `POST /api/protection/enable` - Enable protection
- `POST /api/protection/disable` - Disable protection
- `GET /api/threats` - Recent threats
- `GET /api/protection/history` - Protected transactions
- `GET /api/analytics` - Protection analytics
- `GET /api/stats/realtime` - Real-time stats

### Unified Mempool System (Port 8001)
- `GET /api/v1/transactions` - Mempool transactions
- `GET /api/v1/mev/opportunities` - MEV opportunities
- `GET /api/v1/analytics` - Mempool analytics
- `GET /api/v1/threats` - Threat intelligence

## 🎯 Features Added

### ✅ MEV Protection Control Panel
- **Start/Stop Protection** - Real-time protection toggle
- **Protection Level Configuration** - Basic, Standard, High, Maximum, Enterprise
- **Network Selection** - Multi-chain support
- **Status Monitoring** - Live protection status

### ✅ Real-time Protection Metrics
- **Transactions Protected** - 24-hour count
- **Value Protected** - USD value saved
- **Threats Detected** - Security incidents blocked
- **Uptime Monitoring** - Service availability

### ✅ Threat Intelligence Integration
- **Real-time Threat Feed** - Live MEV attack detection
- **Threat Classification** - Sandwich, frontrunning, arbitrage, etc.
- **Severity Scoring** - Low, Medium, High, Critical
- **Protection History** - Complete audit trail

### ✅ Enhanced Analytics
- **Protection Efficiency** - Success rates and performance
- **Attack Prevention** - Blocked attack statistics
- **Value Saved Analysis** - ROI and protection impact
- **Network Performance** - Cross-chain protection metrics

## 🚀 Testing Integration

### 1. Service Health Check
```bash
# Check MEV Protection Service
curl http://localhost:8004/health

# Check Mempool System  
curl http://localhost:8001/health
```

### 2. Enable Protection
```javascript
// In browser console on dashboard
await apiClient.enableMEVProtection({
  networks: ['ethereum'],
  protectionLevel: 'high',
  slippageTolerance: 0.5
})
```

### 3. Monitor Real-time Data
- Navigate to `/mev` in dashboard
- Verify protection status updates
- Check threat detection feed
- Monitor transaction protection

## 🔄 Automatic Integration Script

Run the provided integration script:
```bash
cd services/mev-protection-service
node mev-protection-integration.js
```

This will automatically:
1. Add MEV Protection API methods to the mempool dashboard
2. Integrate protection UI components
3. Configure service connections
4. Set up real-time monitoring

## 📊 Production Deployment

For production deployment:

1. **Environment Variables:**
```env
NEXT_PUBLIC_MEV_PROTECTION_URL=https://mev-protection.guardefi.net
NEXT_PUBLIC_MEMPOOL_API_URL=https://mempool.guardefi.net
```

2. **Load Balancing:**
- Use nginx for service routing
- Implement health checks
- Configure failover mechanisms

3. **Monitoring:**
- Set up service monitoring
- Configure alerts for protection failures
- Monitor performance metrics

## 🎉 Integration Complete!

The MEV Protection Service is now fully integrated with the Mempool Dashboard, providing:

- **Real-time MEV attack protection**
- **Comprehensive threat monitoring** 
- **Transaction-level security**
- **Analytics and reporting**
- **Multi-chain support**

Navigate to `http://localhost:3000/mev` to access the enhanced MEV protection dashboard!
