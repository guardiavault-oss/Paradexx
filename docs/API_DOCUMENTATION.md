# API Documentation

## Overview

This document describes the API endpoints for the RegenX Security Integration services.

## Base URLs

- **Honeypot Detector**: `http://localhost:8001`
- **Wallet Guard**: `http://localhost:8003`
- **Main API Gateway**: `http://localhost:8000`

## Authentication

Most endpoints require authentication via API key or JWT token.

### Headers
```
Authorization: Bearer <token>
X-API-Key: <api-key>
```

## Honeypot Detector API

### Analyze Token

Analyze a token for honeypot patterns and security risks.

**Endpoint**: `POST /api/honeypot/analyze`

**Request Body**:
```json
{
  "address": "string",
  "chain_id": 1,
  "deep_analysis": false
}
```

**Response**:
```json
{
  "address": "string",
  "is_honeypot": false,
  "confidence": 0.85,
  "risk_level": "low",
  "detected_techniques": [],
  "analysis_timestamp": "2024-01-01T00:00:00Z"
}
```

### Get Analysis History

Get historical analysis data for a contract.

**Endpoint**: `GET /api/honeypot/history/{address}`

**Query Parameters**:
- `limit` (optional): Number of results (default: 10)

**Response**:
```json
[
  {
    "analysis_id": "string",
    "address": "string",
    "is_honeypot": false,
    "confidence": 0.85,
    "risk_level": "low",
    "detected_techniques": [],
    "analysis_timestamp": "2024-01-01T00:00:00Z"
  }
]
```

### Get Statistics

Get honeypot detection statistics.

**Endpoint**: `GET /api/honeypot/statistics`

**Response**:
```json
{
  "total_analyzed": 1000,
  "honeypots_detected": 50,
  "false_positives": 5,
  "detection_rate": 0.95,
  "average_confidence": 0.85
}
```

## Wallet Guard API

### Start Monitoring

Start monitoring a wallet for threats.

**Endpoint**: `POST /api/v1/wallet-guard/monitor`

**Request Body**:
```json
{
  "wallet_address": "0x..."
}
```

**Response**:
```json
{
  "message": "Monitoring started"
}
```

### Get Wallet Status

Get security status for a wallet.

**Endpoint**: `GET /api/v1/wallet-guard/status/{wallet_address}`

**Response**:
```json
{
  "wallet_address": "0x...",
  "is_monitored": true,
  "protection_enabled": true,
  "threat_count": 0,
  "security_score": 85,
  "risk_level": "low"
}
```

### Get Threats

Get detected threats for a wallet.

**Endpoint**: `GET /api/v1/wallet-guard/threats`

**Query Parameters**:
- `wallet_address` (optional): Filter by wallet
- `limit` (optional): Number of results (default: 50)
- `severity` (optional): Filter by severity

**Response**:
```json
[
  {
    "threat_id": "string",
    "threat_type": "phishing",
    "severity": "high",
    "wallet_address": "0x...",
    "network": "ethereum",
    "description": "string",
    "detected_at": "2024-01-01T00:00:00Z",
    "status": "active"
  }
]
```

### Simulate Transaction

Simulate a transaction to detect risks.

**Endpoint**: `POST /api/v1/wallet-guard/simulate`

**Request Body**:
```json
{
  "wallet_address": "0x...",
  "transaction": {
    "to": "0x...",
    "value": "1000000000000000000",
    "data": "0x"
  },
  "network": "ethereum",
  "simulation_depth": 10
}
```

**Response**:
```json
{
  "simulation_id": "string",
  "result": "safe",
  "risks": [],
  "warnings": [],
  "recommendations": [],
  "confidence_score": 0.9,
  "execution_time": 100,
  "gas_estimate": "21000",
  "balance_changes": {}
}
```

### Get Risk Score

Get risk score for a transaction.

**Endpoint**: `POST /api/v1/guardianx/risk-score`

**Request Body**:
```json
{
  "wallet_address": "0x...",
  "transaction": {
    "to": "0x...",
    "value": "1000000000000000000"
  },
  "network": "ethereum"
}
```

**Response**:
```json
{
  "risk_score": 25,
  "risk_level": "low",
  "recommendations": [],
  "confidence": 0.85
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "details": {}
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

API endpoints are rate-limited:
- Default: 100 requests per minute per API key
- Burst: 10 requests per second

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## WebSocket Events

### Threat Detection

**Event**: `threat_detected`

**Payload**:
```json
{
  "type": "threat",
  "threat": {
    "threat_id": "string",
    "threat_type": "phishing",
    "severity": "high",
    "wallet_address": "0x...",
    "description": "string",
    "detected_at": "2024-01-01T00:00:00Z"
  }
}
```

### Status Update

**Event**: `status_update`

**Payload**:
```json
{
  "type": "status",
  "status": {
    "wallet_address": "0x...",
    "security_score": 85,
    "risk_level": "low"
  }
}
```

