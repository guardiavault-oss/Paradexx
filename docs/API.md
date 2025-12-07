# API Documentation

Complete API documentation for RegenX services.

## Base URL

```
Production: https://api.regenx.app
Staging: https://api-staging.regenx.app
Development: http://localhost:8000
```

## Authentication

All API requests require authentication via JWT token.

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Getting a Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "your_jwt_token_here...",
    "expiresIn": 3600
  }
}
```

## Endpoints

### Wallet

#### Get Wallet Balance

```http
GET /api/wallet/balance
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "balance": "1000000000000000000",
    "tokenSymbol": "ETH",
    "balanceUSD": "2500.00"
  }
}
```

#### Get Transactions

```http
GET /api/wallet/transactions?page=1&limit=20
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "hash": "0x123...",
        "from": "0x...",
        "to": "0x...",
        "value": "100000000000000000",
        "timestamp": 1234567890,
        "status": "confirmed"
      }
    ],
    "total": 100,
    "page": 1,
    "hasMore": true
  }
}
```

#### Send Transaction

```http
POST /api/wallet/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "value": "100000000000000000",
  "gasPrice": "20000000000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hash": "0x789...",
    "status": "pending"
  }
}
```

### MEV Protection

#### Check MEV Threat

```http
POST /api/mev/check
Authorization: Bearer <token>
Content-Type: application/json

{
  "transaction": {
    "to": "0x...",
    "value": "100000000000000000",
    "data": "0x..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isThreat": false,
    "riskLevel": "low",
    "recommendations": []
  }
}
```

#### Enable Protection

```http
POST /api/mev/protect
Authorization: Bearer <token>
Content-Type: application/json

{
  "transactionHash": "0x123...",
  "protectionType": "private_pool"
}
```

### Bridge

#### Initiate Bridge

```http
POST /api/bridge/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "sourceChain": "ethereum",
  "targetChain": "polygon",
  "amount": "1000000000000000000",
  "token": "ETH",
  "fromAddress": "0x...",
  "toAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "bridge_123",
    "status": "pending"
  }
}
```

#### Get Bridge Status

```http
GET /api/bridge/status/:transactionId
Authorization: Bearer <token>
```

### Security

#### Scan Address

```http
POST /api/security/scan
Authorization: Bearer <token>
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isSafe": true,
    "threats": [],
    "riskScore": 0.1
  }
}
```

### AI Service

#### Chat

```http
POST /api/ai/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What is Ethereum?",
  "sessionId": "session_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Ethereum is a decentralized platform...",
    "sessionId": "session_123"
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token",
    "statusCode": 401,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Error Codes

- `UNAUTHORIZED` - Invalid or missing token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `SERVER_ERROR` - Internal server error
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable

## Rate Limiting

- **Free tier**: 100 requests/minute
- **Premium tier**: 1000 requests/minute
- **Enterprise**: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## WebSocket API

See [WebSocket Documentation](./WEBSOCKET.md) for real-time API details.

## SDK Usage

```typescript
import { apiClient } from '@regenx/sdk';

// Get balance
const balance = await apiClient.get('/wallet/balance');

// Send transaction
const tx = await apiClient.post('/wallet/send', {
  to: '0x...',
  value: '100000000000000000',
});
```

