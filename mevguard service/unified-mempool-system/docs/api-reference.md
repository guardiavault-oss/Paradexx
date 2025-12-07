# API Reference

The Unified Mempool Monitoring System provides a comprehensive REST API for accessing all monitoring capabilities.

## Base URL

```
http://localhost:8000
```

## Authentication

The API uses JWT-based authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### System Status

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

#### GET /api/v1/status
Get comprehensive system status.

**Response:**
```json
{
  "status": "operational",
  "uptime": 3600,
  "networks": {
    "ethereum": {
      "status": "connected",
      "block_number": 23295459,
      "gas_price": 25.5,
      "latency": 75.98
    },
    "arbitrum": {
      "status": "connected",
      "block_number": 375877719,
      "gas_price": 0.1,
      "latency": 53.88
    }
  },
  "transactions_processed": 15000,
  "mev_attacks": 5,
  "suspicious_transactions": 25,
  "system_metrics": {
    "cpu_usage": 45.2,
    "memory_usage": 512.5,
    "disk_usage": 1024.8
  }
}
```

### Dashboard Data

#### GET /api/v1/dashboard
Get real-time dashboard data.

**Response:**
```json
{
  "overview": {
    "total_transactions": 15000,
    "active_networks": 4,
    "mev_attacks_detected": 5,
    "risk_level": "medium"
  },
  "networks": [
    {
      "name": "ethereum",
      "status": "connected",
      "transactions": 8000,
      "gas_price": 25.5,
      "block_number": 23295459
    }
  ],
  "recent_activity": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "type": "transaction",
      "network": "ethereum",
      "hash": "0x...",
      "value": "1.5 ETH"
    }
  ],
  "alerts": [
    {
      "id": "alert_001",
      "type": "mev_attack",
      "severity": "high",
      "message": "Sandwich attack detected",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Transactions

#### GET /api/v1/transactions
Get transaction data with optional filtering.

**Query Parameters:**
- `network` (string): Filter by network (ethereum, arbitrum, etc.)
- `suspicious_only` (boolean): Show only suspicious transactions
- `limit` (integer): Maximum number of transactions to return
- `offset` (integer): Number of transactions to skip
- `start_time` (string): Start time filter (ISO 8601)
- `end_time` (string): End time filter (ISO 8601)

**Response:**
```json
{
  "transactions": [
    {
      "hash": "0x...",
      "network": "ethereum",
      "from": "0x...",
      "to": "0x...",
      "value": "1.5",
      "gas_price": 25.5,
      "gas_limit": 21000,
      "timestamp": "2024-01-01T00:00:00Z",
      "status": "pending",
      "risk_score": 0.75,
      "is_suspicious": true,
      "mev_indicators": ["sandwich_attack", "frontrunning"]
    }
  ],
  "total": 15000,
  "limit": 100,
  "offset": 0
}
```

### MEV Opportunities

#### GET /api/v1/mev/opportunities
Get detected MEV opportunities and attacks.

**Query Parameters:**
- `network` (string): Filter by network
- `opportunity_type` (string): Filter by type (sandwich, arbitrage, flash_loan, etc.)
- `severity` (string): Filter by severity (low, medium, high, critical)
- `limit` (integer): Maximum number of opportunities to return

**Response:**
```json
{
  "opportunities": [
    {
      "id": "mev_001",
      "type": "sandwich_attack",
      "network": "ethereum",
      "target_transaction": "0x...",
      "attacker_address": "0x...",
      "profit_estimate": "0.5 ETH",
      "confidence": 0.95,
      "severity": "high",
      "timestamp": "2024-01-01T00:00:00Z",
      "details": {
        "frontrun_tx": "0x...",
        "backrun_tx": "0x...",
        "target_tx": "0x..."
      }
    }
  ],
  "total": 25,
  "limit": 100
}
```

### Threat Intelligence

#### GET /api/v1/threats
Get threat intelligence data.

**Query Parameters:**
- `severity` (string): Filter by severity
- `network` (string): Filter by network
- `threat_type` (string): Filter by threat type
- `limit` (integer): Maximum number of threats to return

**Response:**
```json
{
  "threats": [
    {
      "id": "threat_001",
      "type": "malicious_contract",
      "severity": "high",
      "network": "ethereum",
      "address": "0x...",
      "description": "Known malicious contract",
      "first_seen": "2024-01-01T00:00:00Z",
      "last_seen": "2024-01-01T00:00:00Z",
      "indicators": ["honeypot", "rug_pull"],
      "confidence": 0.98
    }
  ],
  "total": 150,
  "limit": 100
}
```

### Real-time Streaming

#### GET /api/v1/stream/transactions
Stream real-time transaction updates.

**Response:** Server-Sent Events (SSE)
```
data: {"type": "transaction", "data": {"hash": "0x...", "network": "ethereum", ...}}

data: {"type": "mev_attack", "data": {"id": "mev_001", "type": "sandwich_attack", ...}}
```

#### GET /api/v1/stream/alerts
Stream real-time security alerts.

**Response:** Server-Sent Events (SSE)
```
data: {"type": "alert", "data": {"id": "alert_001", "severity": "high", "message": "MEV attack detected", ...}}
```

### Analytics

#### GET /api/v1/analytics/performance
Get performance analytics.

**Response:**
```json
{
  "metrics": {
    "transactions_per_second": 15.5,
    "average_processing_time": 0.05,
    "memory_usage": 512.5,
    "cpu_usage": 45.2,
    "network_latency": {
      "ethereum": 75.98,
      "arbitrum": 53.88,
      "optimism": 130.00
    }
  },
  "time_series": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "transactions_per_second": 15.5,
      "memory_usage": 512.5
    }
  ]
}
```

#### GET /api/v1/analytics/security
Get security analytics.

**Response:**
```json
{
  "summary": {
    "total_attacks_detected": 25,
    "attacks_by_type": {
      "sandwich_attack": 15,
      "arbitrage": 8,
      "flash_loan": 2
    },
    "attacks_by_network": {
      "ethereum": 20,
      "arbitrum": 3,
      "optimism": 2
    },
    "risk_distribution": {
      "low": 1000,
      "medium": 500,
      "high": 100,
      "critical": 25
    }
  },
  "trends": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "attacks_detected": 5,
      "risk_level": "medium"
    }
  ]
}
```

### Data Export

#### GET /api/v1/export/transactions
Export transaction data.

**Query Parameters:**
- `format` (string): Export format (json, csv, xlsx)
- `network` (string): Filter by network
- `start_time` (string): Start time filter
- `end_time` (string): End time filter
- `suspicious_only` (boolean): Export only suspicious transactions

**Response:** File download with the requested format.

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "bad_request",
  "message": "Invalid request parameters",
  "details": {
    "field": "network",
    "issue": "Invalid network name"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "not_found",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded",
  "retry_after": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "internal_error",
  "message": "An internal error occurred"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Default**: 1000 requests per hour per IP
- **Authenticated users**: 10000 requests per hour
- **Premium users**: 50000 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## WebSocket Support

For real-time updates, WebSocket connections are available at:
```
ws://localhost:8000/ws
```

### WebSocket Events

#### Subscribe to transaction updates
```json
{
  "type": "subscribe",
  "channel": "transactions",
  "filters": {
    "network": "ethereum",
    "suspicious_only": true
  }
}
```

#### Subscribe to MEV alerts
```json
{
  "type": "subscribe",
  "channel": "mev_alerts",
  "filters": {
    "severity": "high"
  }
}
```

## SDKs and Libraries

Official SDKs are available for:
- Python: `pip install unified-mempool-sdk`
- JavaScript/TypeScript: `npm install @scorpius/unified-mempool-sdk`
- Go: `go get github.com/scorpius/unified-mempool-sdk-go`

## Interactive Documentation

Visit `http://localhost:8000/docs` for interactive Swagger documentation with the ability to test endpoints directly.