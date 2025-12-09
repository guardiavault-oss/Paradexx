# API Documentation

GuardiaVault provides comprehensive REST API documentation using OpenAPI 3.0 (Swagger).

## Accessing the API Documentation

### Development Mode
The API documentation is automatically available in development mode:
- **Swagger UI**: `http://localhost:5000/api-docs`
- **OpenAPI JSON**: `http://localhost:5000/api-docs.json`

### Production Mode
To enable Swagger in production, set the environment variable:
```bash
ENABLE_SWAGGER=true
```

## API Overview

The GuardiaVault API is organized into the following sections:

### Health Endpoints
- `GET /health` - Basic health check
- `GET /ready` - Readiness probe (checks dependencies)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/connect-wallet` - Link wallet to account
- `POST /api/auth/nonce` - Get nonce for wallet authentication
- `POST /api/auth/verify` - Verify wallet signature

### Vaults
- `GET /api/vaults` - List all vaults
- `GET /api/vaults/:id` - Get vault details
- `POST /api/vaults` - Create new vault
- `PATCH /api/vaults/:id` - Update vault
- `DELETE /api/vaults/:id` - Delete vault

### Parties (Guardians & Beneficiaries)
- `GET /api/vaults/:vaultId/parties` - List all parties for a vault
- `GET /api/vaults/:vaultId/parties/:role` - Get parties by role
- `POST /api/vaults/:vaultId/parties` - Add party to vault
- `POST /api/vaults/:vaultId/guardians/invite` - Invite guardian
- `POST /api/guardians/accept` - Accept guardian invitation
- `PATCH /api/parties/:id` - Update party
- `DELETE /api/parties/:id` - Remove party

### Check-ins
- `POST /api/vaults/:vaultId/checkin` - Perform check-in
- `GET /api/vaults/:vaultId/checkins` - Get check-in history

### Claims & Recovery
- `POST /api/vaults/recover` - Trigger vault recovery
- `POST /api/claims/:claimId/attest` - Attest to a claim
- `GET /api/claims/:claimId` - Get claim details
- `GET /api/vaults/:vaultId/claims` - List claims for a vault

### Notifications
- `GET /api/notifications/ack` - Acknowledge notification
- `GET /api/notifications/pending` - Get pending notifications
- `POST /api/notifications/process-pending` - Process pending notifications
- `POST /api/notifications/test-send` - Test notification sending

### Payments
- `POST /api/payments/create-checkout-session` - Create Stripe checkout session
- `POST /api/payments/webhook` - Stripe webhook handler

## Authentication

The API uses session-based authentication. After logging in, a session cookie (`connect.sid`) is automatically set and used for subsequent requests.

### Example: Authenticating and Making Requests

```bash
# 1. Register or Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  -c cookies.txt

# 2. Make authenticated requests
curl -X GET http://localhost:5000/api/vaults \
  -b cookies.txt
```

## Request/Response Format

All requests and responses use JSON format with `Content-Type: application/json`.

### Standard Success Response
```json
{
  "data": { ... }
}
```

### Error Response
```json
{
  "message": "Error message",
  "errors": [
    {
      "path": "field.name",
      "message": "Validation error message",
      "code": "invalid_string"
    }
  ]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Data Models

### User
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "walletAddress": "0x...",
  "createdAt": "2025-01-02T00:00:00Z"
}
```

### Vault
```json
{
  "id": "uuid",
  "name": "My Crypto Vault",
  "ownerId": "uuid",
  "checkInIntervalDays": 90,
  "gracePeriodDays": 30,
  "status": "active",
  "createdAt": "2025-01-02T00:00:00Z",
  "lastCheckIn": "2025-01-02T00:00:00Z"
}
```

### Party (Guardian/Beneficiary)
```json
{
  "id": "uuid",
  "vaultId": "uuid",
  "role": "guardian",
  "name": "John Doe",
  "email": "guardian@example.com",
  "phone": "+1234567890",
  "status": "active",
  "createdAt": "2025-01-02T00:00:00Z",
  "acceptedAt": "2025-01-02T00:00:00Z"
}
```

## Rate Limiting

The API implements rate limiting:
- **General API**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 10 requests per 15 minutes per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Time when rate limit resets

## Security

### Security Headers
All responses include security headers via Helmet.js:
- Content Security Policy (CSP)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security (production)

### CORS
Cross-Origin Resource Sharing is configured for:
- `APP_URL` from environment
- `http://localhost:5000` (development)
- `http://localhost:5173` (Vite dev server)

## Examples

### Creating a Vault

```bash
curl -X POST http://localhost:5000/api/vaults \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "My Crypto Vault",
    "checkInIntervalDays": 90,
    "gracePeriodDays": 30,
    "guardians": [
      {
        "name": "Guardian 1",
        "email": "guardian1@example.com",
        "phone": "+1234567890"
      },
      {
        "name": "Guardian 2",
        "email": "guardian2@example.com"
      },
      {
        "name": "Guardian 3",
        "email": "guardian3@example.com"
      }
    ],
    "beneficiaries": [
      {
        "name": "Beneficiary 1",
        "email": "beneficiary1@example.com"
      }
    ]
  }'
```

### Performing a Check-in

```bash
curl -X POST http://localhost:5000/api/vaults/{vaultId}/checkin \
  -b cookies.txt
```

### Triggering Recovery

```bash
curl -X POST http://localhost:5000/api/vaults/recover \
  -H "Content-Type: application/json" \
  -d '{
    "vaultId": "vault-uuid",
    "guardianShares": [
      {
        "guardianId": "guardian-1-uuid",
        "fragment": "fragment-data",
        "passphrase": "guardian-passphrase"
      },
      {
        "guardianId": "guardian-2-uuid",
        "fragment": "fragment-data",
        "passphrase": "guardian-passphrase"
      },
      {
        "guardianId": "guardian-3-uuid",
        "fragment": "fragment-data",
        "passphrase": "guardian-passphrase"
      }
    ]
  }'
```

## Testing with Swagger UI

1. Start the development server: `pnpm run dev`
2. Navigate to `http://localhost:5000/api-docs`
3. Use the "Authorize" button to set up session authentication
4. Explore and test endpoints directly from the UI

## Additional Resources

- **Swagger/OpenAPI Spec**: `http://localhost:5000/api-docs.json`
- **Source Code**: See `server/routes.ts` for route implementations
- **Validation Schemas**: See `shared/schema.ts` for Zod schemas
- **Error Tracking**: Integrated with Sentry (if configured)

## Contributing

When adding new endpoints:
1. Add JSDoc comments with `@swagger` annotations
2. Include request/response schemas
3. Document authentication requirements
4. Add examples for complex endpoints
5. Update this documentation file

See `server/routes.ts` for examples of documented endpoints.

---

**Note**: The API documentation is automatically generated from JSDoc comments in the route handlers. Keep the comments up-to-date for accurate documentation.

