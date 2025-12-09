# 🛡️ MEV Protection Service - Complete API Documentation

## 📋 Table of Contents
1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [MEV Protection API (Port 8000)](#mev-protection-api-port-8000)
4. [Enhanced MEV API (Port 8000)](#enhanced-mev-api-port-8000)
5. [Legacy API (Port 8004)](#legacy-api-port-8004)
6. [WebSocket Endpoints](#websocket-endpoints)
7. [Request/Response Models](#requestresponse-models)
8. [Error Handling](#error-handling)

---

## 🔐 Authentication

All protected endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <API_KEY>
```

Or via API key header:
```
X-API-Key: <API_KEY>
```

**Default API Key**: `demo-api-key` (change in production via `API_KEY` env variable)

---

## 🛡️ MEV Protection API (Port 8000)

Base URL: `http://localhost:8000`

### Health & Status

#### `GET /health`
Health check endpoint (no auth required)

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00",
  "version": "2.0.0",
  "service": "mev-protection"
}
```

---

### Protection Management

#### `POST /api/v1/protection/start`
Start MEV protection for specified networks

**Request Body:**
```json
{
  "networks": ["ethereum", "polygon", "bsc"],
  "protection_level": "high"
}
```

**Protection Levels:** `basic`, `standard`, `high`, `maximum`, `enterprise`

**Supported Networks:** `ethereum`, `polygon`, `bsc`, `arbitrum`, `optimism`, `avalanche`, `fantom`, `base`, `linea`, `scroll`, `starknet`

**Response:**
```json
{
  "status": "success",
  "message": "MEV protection started for 3 networks at high level",
  "networks": ["ethereum", "polygon", "bsc"],
  "protection_level": "high",
  "timestamp": "2024-01-01T00:00:00"
}
```

#### `POST /api/v1/protection/stop`
Stop MEV protection

**Request Body:**
```json
{
  "networks": ["ethereum"]  // Optional: stop specific networks, null = stop all
}
```

**Response:**
```json
{
  "status": "success",
  "message": "MEV protection stopped",
  "timestamp": "2024-01-01T00:00:00"
}
```

#### `GET /api/v1/protection/status`
Get current protection status

**Response:**
```json
{
  "is_active": true,
  "status": "active",
  "protection_level": "high",
  "active_networks": ["ethereum"],
  "networks": ["ethereum"],
  "uptime_hours": 24,
  "threats_detected_24h": 150,
  "transactions_protected_24h": 5000,
  "value_protected_usd": 250000.50,
  "statistics": {
    "threats_detected": 150,
    "transactions_protected": 5000,
    "value_protected": 250000.50,
    "success_rate": 98.5
  }
}
```

---

### Transaction Protection

#### `POST /api/v1/transactions/protect`
Protect a specific transaction

**Request Body:**
```json
{
  "transaction_hash": "0x1234...",
  "network": "ethereum",
  "protection_level": "high",
  "gas_limit": 21000,
  "max_gas_price": 50000000000,
  "slippage_tolerance": 0.5,
  "private_mempool": true
}
```

**Response:**
```json
{
  "status": "success",
  "protection": {
    "transaction_hash": "0x1234...",
    "network": "ethereum",
    "protection_level": "high",
    "strategies": ["private_mempool", "gas_adjustment"],
    "status": "protected",
    "created_at": "2024-01-01T00:00:00",
    "result": {
      "success": true,
      "strategy_used": "private_mempool",
      "gas_saved": 15000,
      "value_protected": 500.25,
      "execution_time": 1.2
    }
  },
  "timestamp": "2024-01-01T00:00:00"
}
```

---

### Threat Detection

#### `GET /api/v1/threats`
Get detected MEV threats

**Query Parameters:**
- `network` (optional): Filter by network
- `severity` (optional): Filter by severity (`low`, `medium`, `high`, `critical`)
- `threat_type` (optional): Filter by threat type (`sandwich`, `frontrun`, `backrun`, `other`)
- `limit` (default: 100, max: 1000): Number of results
- `offset` (default: 0): Pagination offset

**Response:**
```json
{
  "threats": [
    {
      "threat_id": "threat_123",
      "threat_type": "sandwich",
      "target_transaction": "0x5678...",
      "attacker_address": "0xabcd...",
      "profit_potential": 1.5,
      "gas_price": 50000000000,
      "confidence": 0.95,
      "severity": "high",
      "detected_at": "2024-01-01T00:00:00",
      "network": "ethereum",
      "protection_applied": true,
      "mitigation_strategy": "private_mempool",
      "estimated_loss": 500.25
    }
  ],
  "total_count": 150,
  "limit": 100,
  "offset": 0,
  "timestamp": "2024-01-01T00:00:00"
}
```

#### `GET /api/v1/threats/{threat_id}`
Get specific threat details

**Response:**
```json
{
  "threat_id": "threat_123",
  "threat_type": "sandwich",
  "target_transaction": "0x5678...",
  "attacker_address": "0xabcd...",
  "profit_potential": 1.5,
  "gas_price": 50000000000,
  "confidence": 0.95,
  "severity": "high",
  "detected_at": "2024-01-01T00:00:00",
  "network": "ethereum",
  "protection_applied": true,
  "mitigation_strategy": "private_mempool",
  "estimated_loss": 500.25,
  "metadata": {},
  "timestamp": "2024-01-01T00:00:00"
}
```

---

### Statistics & Analytics

#### `GET /api/v1/stats`
Get protection statistics

**Query Parameters:**
- `network` (optional): Filter by network
- `timeframe` (default: `24h`): `1h`, `6h`, `24h`, `7d`, `30d`

**Response:**
```json
{
  "statistics": {
    "threats_detected": 150,
    "threats_mitigated": 148,
    "transactions_protected": 5000,
    "value_protected": 250000.50,
    "gas_saved": 75000000,
    "protection_success_rate": 98.67,
    "ai_predictions": 200,
    "false_positives": 2,
    "total_threats": 150,
    "active_protections": 5
  },
  "timeframe": "24h",
  "timestamp": "2024-01-01T00:00:00"
}
```

#### `GET /api/v1/dashboard`
Get live dashboard data

**Response:**
```json
{
  "overview": {
    "active_protections": 5,
    "threats_detected_24h": 150,
    "transactions_protected_24h": 5000,
    "value_protected_24h": 250000.50
  },
  "networks": {
    "ethereum": {
      "threats": 100,
      "protected": 3000
    }
  },
  "recent_threats": [],
  "timestamp": "2024-01-01T00:00:00"
}
```

#### `GET /api/v1/mev/metrics`
Get MEV saved metrics

**Query Parameters:**
- `time_period` (default: `1h`): Time period for metrics

**Response:**
```json
{
  "total_mev_saved": 2.5,
  "transactions_protected": 5000,
  "average_mev_per_transaction": 0.0005,
  "gas_cost_saved": 75000000,
  "successful_protections": 4950,
  "failed_protections": 50,
  "protection_success_rate": 99.0,
  "relay_usage_stats": {},
  "time_period": "1h",
  "network_breakdown": {
    "ethereum": 2.0,
    "polygon": 0.5
  },
  "generated_at": "2024-01-01T00:00:00",
  "timestamp": "2024-01-01T00:00:00"
}
```

#### `GET /api/v1/mev/history`
Get historical MEV metrics

**Response:**
```json
{
  "history": [
    {
      "total_mev_saved": 2.5,
      "transactions_protected": 5000,
      "average_mev_per_transaction": 0.0005,
      "protection_success_rate": 99.0,
      "time_period": "1h",
      "generated_at": "2024-01-01T00:00:00"
    }
  ],
  "total_reports": 10,
  "timestamp": "2024-01-01T00:00:00"
}
```

---

### Network Management

#### `GET /api/v1/networks`
Get supported networks

**Response:**
```json
{
  "networks": [
    {
      "name": "ethereum",
      "display_name": "Ethereum",
      "chain_id": 1,
      "enabled": true
    }
  ],
  "timestamp": "2024-01-01T00:00:00"
}
```

#### `GET /api/v1/networks/{network}/status`
Get network-specific status

**Response:**
```json
{
  "network": "ethereum",
  "status": "active",
  "statistics": {
    "threats_detected": 100,
    "threats_mitigated": 98,
    "active_protections": 3,
    "threat_level": "medium"
  },
  "timestamp": "2024-01-01T00:00:00"
}
```

---

### Private Relay Management

#### `GET /api/v1/relays`
Get private relay connection status

**Response:**
```json
{
  "relays": {
    "flashbots": {
      "relay_type": "flashbots",
      "status": "connected",
      "latency": 150,
      "success_rate": 99.5,
      "last_used": "2024-01-01T00:00:00",
      "enabled": true,
      "endpoint": "https://relay.flashbots.net",
      "supported_networks": ["ethereum"]
    }
  },
  "total_relays": 1,
  "active_relays": 1,
  "timestamp": "2024-01-01T00:00:00"
}
```

#### `POST /api/v1/relays/{relay_type}/test`
Test specific relay connection

**Relay Types:** `flashbots`, `mev_share`, `eden_network`, `custom`

**Response:**
```json
{
  "relay_type": "flashbots",
  "status": "connected",
  "latency": 150,
  "message": "Relay flashbots tested successfully",
  "timestamp": "2024-01-01T00:00:00"
}
```

---

### Order Flow Auction (OFA)

#### `GET /api/v1/ofa/auctions`
Get active OFA auctions

**Response:**
```json
{
  "auctions": [
    {
      "auction_id": "auction_123",
      "intent_type": "swap",
      "transaction_hash": "0x5678...",
      "max_gas_price": 50000000000,
      "deadline": 1704067200,
      "participants": ["builder1", "builder2"],
      "status": "active",
      "created_at": "2024-01-01T00:00:00",
      "winning_bid": 45000000000,
      "winning_participant": "builder1"
    }
  ],
  "total_auctions": 1,
  "timestamp": "2024-01-01T00:00:00"
}
```

#### `POST /api/v1/ofa/create`
Create new OFA auction

**Request Body:**
```json
{
  "intent_type": "swap",
  "transaction_hash": "0x5678...",
  "max_gas_price": 50000000000,
  "deadline": 1704067200,
  "metadata": {}
}
```

**Intent Types:** `swap`, `bridge`, `lend`, `borrow`, `stake`, `unstake`, `claim`, `other`

**Response:**
```json
{
  "auction_id": "auction_123",
  "intent_type": "swap",
  "transaction_hash": "0x5678...",
  "max_gas_price": 50000000000,
  "deadline": 1704067200,
  "participants": [],
  "status": "active",
  "created_at": "2024-01-01T00:00:00",
  "message": "OFA auction created successfully",
  "timestamp": "2024-01-01T00:00:00"
}
```

---

### PBS (Proposer-Builder Separation)

#### `GET /api/v1/pbs/builders`
Get PBS builder information

**Response:**
```json
{
  "builders": [
    {
      "name": "Flashbots Builder",
      "endpoint": "https://builder.flashbots.net",
      "supported_networks": ["ethereum"],
      "status": "active",
      "fee_recipient": "0xFeeRecipientAddress",
      "last_block": 18750000,
      "total_blocks": 156000
    }
  ],
  "total_builders": 3,
  "active_builders": 3,
  "timestamp": "2024-01-01T00:00:00"
}
```

#### `GET /api/v1/pbs/relay/status`
Get PBS relay status and fallback information

**Response:**
```json
{
  "relay_status": {
    "flashbots": {
      "status": "connected",
      "latency": 150,
      "success_rate": 99.5,
      "fallback_available": true,
      "last_failure": 0,
      "max_retries": 3
    }
  },
  "fallback_events": [],
  "total_fallbacks_needed": 0,
  "pbs_healthy": true,
  "timestamp": "2024-01-01T00:00:00"
}
```

---

## 🚀 Enhanced MEV API (Port 8000)

Base URL: `http://localhost:8000` (same port, different endpoints)

### Health & Status

#### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00",
  "version": "2.0.0",
  "components": {
    "orderflow_controller": true,
    "mev_detection_engine": true,
    "builder_pbs_awareness": true
  }
}
```

#### `GET /status`
Get comprehensive protection status

**Response:**
```json
{
  "system_status": "active",
  "networks_active": 3,
  "relays_active": 2,
  "builders_monitored": 5,
  "total_orders_processed": 10000,
  "orders_protected": 9800,
  "mev_attacks_detected": 200,
  "mev_attacks_mitigated": 195,
  "mev_saved_eth": 5.5,
  "protection_success_rate": 97.5,
  "kpi_score": 95.0,
  "last_updated": "2024-01-01T00:00:00"
}
```

---

### Orderflow Control

#### `POST /api/v1/intent/submit`
Submit a new intent for processing

**Request Body:**
```json
{
  "user_address": "0x1234...",
  "intent_type": "swap",
  "target_contracts": ["0x5678..."],
  "expected_outcome": {
    "min_amount_out": "1000000"
  },
  "max_slippage": 0.5,
  "deadline": 1704067200,
  "priority": 5
}
```

**Response:**
```json
{
  "intent_id": "intent_123",
  "status": "submitted",
  "estimated_protection_time_ms": 1000.0,
  "protection_strategies": ["gas_adjustment", "private_mempool", "slippage_protection"],
  "created_at": "2024-01-01T00:00:00"
}
```

#### `GET /api/v1/intent/{intent_id}`
Get intent status and details

**Response:**
```json
{
  "intent_id": "intent_123",
  "status": "protected",
  "user_address": "0x1234...",
  "intent_type": "swap",
  "protection_applied": true,
  "created_at": "2024-01-01T00:00:00",
  "execution_plan": {
    "strategy": "private_mempool",
    "estimated_gas": 21000
  }
}
```

---

### MEV Detection

#### `POST /api/v1/mev/detect`
Detect MEV attacks in transaction data

**Request Body:**
```json
{
  "transaction_data": {
    "hash": "0x1234...",
    "from": "0xabcd...",
    "to": "0x5678...",
    "value": "1000000000000000000"
  },
  "network": "ethereum",
  "detection_level": "standard"
}
```

**Detection Levels:** `basic`, `standard`, `advanced`

**Response:**
```json
{
  "detections": [
    {
      "detection_id": "det_123",
      "attack_type": "sandwich",
      "confidence": 0.95,
      "severity": "high",
      "profit_potential": 1.5,
      "estimated_loss": 500.25,
      "protection_applied": true,
      "mitigation_strategy": "private_mempool",
      "detected_at": "2024-01-01T00:00:00"
    }
  ],
  "total_attacks_detected": 1,
  "protection_applied": true,
  "estimated_mev_saved": 500.25,
  "detection_time_ms": 150.5
}
```

#### `GET /api/v1/mev/stats`
Get MEV protection statistics

**Response:**
```json
{
  "detection_status": {
    "total_attacks_detected": 200,
    "attacks_mitigated": 195,
    "protection_success_rate": 97.5,
    "avg_detection_time_ms": 150.5
  },
  "kpi_metrics": {
    "total_mev_saved_eth": 5.5,
    "kpi_score": 95.0
  },
  "attack_statistics": {
    "sandwich": 100,
    "frontrun": 50,
    "backrun": 30,
    "other": 20
  }
}
```

---

### KPI & Analytics

#### `GET /api/v1/kpi/metrics`
Get KPI metrics and analytics

**Response:**
```json
{
  "total_mev_saved_eth": 5.5,
  "total_gas_saved_gwei": 75000000,
  "protection_success_rate": 97.5,
  "detection_accuracy": 0.95,
  "avg_protection_time_ms": 1000.0,
  "kpi_score": 95.0,
  "target_achievement": 95.0,
  "mev_saved_by_type": {
    "sandwich": 3.0,
    "frontrun": 1.5,
    "backrun": 1.0
  },
  "network_performance": {
    "ethereum": 98.0,
    "polygon": 96.0
  }
}
```

#### `GET /api/v1/analytics/dashboard`
Get comprehensive analytics dashboard data

**Response:**
```json
{
  "overview": {
    "total_orders_processed": 10000,
    "orders_protected": 9800,
    "mev_attacks_detected": 200,
    "mev_attacks_mitigated": 195,
    "mev_saved_eth": 5.5,
    "protection_success_rate": 97.5
  },
  "builders": {
    "total_builders": 5,
    "active_builders": 5
  },
  "relays": {
    "total_relays": 2,
    "health_score": 98.5
  },
  "networks": {
    "active_networks": 3,
    "network_coverage": {
      "ethereum": 98.0,
      "polygon": 96.0
    }
  },
  "performance": {
    "kpi_score": 95.0,
    "avg_detection_time_ms": 150.5,
    "avg_protection_time_ms": 1000.0
  },
  "timestamp": "2024-01-01T00:00:00"
}
```

---

### Builder & PBS Awareness

#### `GET /api/v1/builders/status`
Get builder status and performance

**Response:**
```json
{
  "total_builders": 5,
  "active_builders": 5,
  "degraded_builders": 0,
  "offline_builders": 0,
  "avg_performance": 98.5,
  "competition_index": 0.85,
  "builders": [
    {
      "name": "Flashbots Builder",
      "status": "active",
      "performance": 99.0
    }
  ]
}
```

#### `GET /api/v1/relays/status`
Get relay status and health

**Response:**
```json
{
  "total_relays": 2,
  "health_score": 98.5,
  "relays": [
    {
      "name": "Flashbots",
      "status": "connected",
      "latency": 150,
      "success_rate": 99.5
    }
  ]
}
```

#### `GET /api/v1/fallback/status`
Get fallback strategy status

**Response:**
```json
{
  "total_activations": 5,
  "success_rate": 100.0,
  "available_strategies": 3,
  "recent_activations": [
    {
      "strategy": "backup_relay",
      "triggered_at": "2024-01-01T00:00:00",
      "success": true
    }
  ]
}
```

---

### Real-time Monitoring

#### `GET /api/v1/monitoring/live`
Get live monitoring data for real-time dashboard

**Response:**
```json
{
  "orderflow": {
    "active_intents": 10,
    "processed_24h": 10000
  },
  "mev_detection": {
    "active_detections": 5,
    "threats_24h": 200
  },
  "timestamp": "2024-01-01T00:00:00"
}
```

#### `GET /api/v1/monitoring/stream`
Stream real-time monitoring data (Server-Sent Events)

**Response:** Continuous stream of JSON data

---

### Configuration

#### `GET /api/v1/config`
Get current system configuration

**Response:**
```json
{
  "configurations": {
    "orderflow": {
      "max_slippage": 0.5,
      "default_protection_level": "high"
    },
    "mev_detection": {
      "detection_level": "standard",
      "confidence_threshold": 0.8
    },
    "builder_pbs": {
      "monitoring_interval": 60
    }
  },
  "timestamp": "2024-01-01T00:00:00"
}
```

---

## 🔌 WebSocket Endpoints

### `WS /ws`
WebSocket endpoint for real-time updates

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle real-time updates
};
```

**Message Format:**
```json
{
  "overview": {
    "active_protections": 5,
    "threats_detected_24h": 150
  },
  "timestamp": "2024-01-01T00:00:00"
}
```

**Update Frequency:** Every 5 seconds

---

## 📊 Legacy API (Port 8004)

Base URL: `http://localhost:8004`

### `GET /`
Service information

### `GET /health`
Health check

### `POST /api/protect/transaction`
Protect transaction (legacy endpoint)

### `POST /api/analyze/mev`
Analyze MEV (legacy endpoint)

### `POST /api/flashbots/relay`
Flashbots relay (legacy endpoint)

### `POST /api/detect/sandwich`
Detect sandwich attack (legacy endpoint)

### `POST /api/detect/frontrunning`
Detect frontrunning (legacy endpoint)

### `GET /api/mev-bots`
Get MEV bots (legacy endpoint)

### `GET /api/stats`
Get stats (legacy endpoint)

---

## ⚠️ Error Handling

All endpoints return standard error responses:

```json
{
  "error": {
    "code": 404,
    "message": "Threat not found",
    "timestamp": "2024-01-01T00:00:00"
  }
}
```

**Common Error Codes:**
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error
- `503`: Service Unavailable

---

## 📝 Notes

1. All timestamps are in ISO 8601 format
2. All amounts are in wei/gwei unless specified otherwise
3. All addresses are in checksum format
4. Rate limiting: 100 requests/minute per API key
5. WebSocket connections have a 5-minute timeout
6. Maximum request body size: 10MB

---

## 🔗 API Documentation

Interactive API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`


