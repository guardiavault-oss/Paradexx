# API Endpoint Testing Guide

## Overview

This guide provides instructions for testing all API endpoints to ensure they return 200 status codes (or expected status codes for specific endpoints).

## Prerequisites

1. **Backend Server Running**: The backend server must be running before running tests
2. **Environment Variables**: Ensure all required environment variables are set
3. **Database**: Database should be accessible and initialized
4. **Dependencies**: All npm/pnpm dependencies installed

## Starting the Backend Server

### Option 1: Node.js/TypeScript Backend (Port 3001)

```bash
cd src/backend
pnpm install
pnpm start
```

Or using npm:
```bash
cd src/backend
npm install
npm start
```

### Option 2: Python FastAPI Backend (Port 8000)

```bash
python -m uvicorn app.api.main_comprehensive:app --host 0.0.0.0 --port 8000
```

### Option 3: Using Docker Compose

```bash
docker-compose up -d
```

## Running the Tests

### Basic Test (No Authentication)

```bash
npx tsx scripts/test-all-api-endpoints-comprehensive.ts
```

### With Authentication Token

```bash
AUTH_TOKEN=your-token-here npx tsx scripts/test-all-api-endpoints-comprehensive.ts
```

### Against Production/Staging

```bash
API_BASE_URL=https://your-api-url.com AUTH_TOKEN=your-token npx tsx scripts/test-all-api-endpoints-comprehensive.ts
```

### Verbose Output (Show All Successful Endpoints)

```bash
VERBOSE=true npx tsx scripts/test-all-api-endpoints-comprehensive.ts
```

## Expected Results

### Success Criteria

- ✅ **All public endpoints** should return `200 OK`
- ✅ **Authenticated endpoints** should return `200 OK` when valid token is provided
- ✅ **Authenticated endpoints** should return `401 Unauthorized` when no token is provided (this is expected)
- ✅ **Health check endpoints** should always return `200 OK`

### Status Code Expectations

| Endpoint Type | Expected Status | Notes |
|--------------|----------------|-------|
| Health Checks | 200 | Should always work |
| Public Endpoints | 200 | No auth required |
| Authenticated Endpoints (with token) | 200 | Valid token provided |
| Authenticated Endpoints (no token) | 401 | Expected behavior |
| Not Found Endpoints | 404 | Endpoint doesn't exist |
| Server Errors | 500 | Should be investigated |

## Endpoint Categories

The test suite covers the following categories:

1. **System** - Health checks and system status
2. **Auth** - Authentication endpoints
3. **User** - User profile and preferences
4. **Wallet** - Wallet management and operations
5. **Trading** - Trading orders and statistics
6. **Swaps** - Token swap operations
7. **DeFi** - DeFi positions, vaults, and APY rates
8. **MEV** - MEV protection and guard services
9. **Wallet Guard** - Wallet security services
10. **Sniper** - Sniper bot functionality
11. **Market Data** - Market prices and trending tokens
12. **NFT** - NFT gallery and metadata
13. **Fiat** - Fiat on-ramp providers
14. **Account** - Account management
15. **Settings** - User settings
16. **Notifications** - Notification management
17. **Biometric** - Biometric authentication
18. **Support** - Help articles and FAQ
19. **Legal** - Terms of service and privacy policy
20. **Bridge** - Cross-chain bridge operations
21. **Cross-Chain** - Cross-chain routing
22. **Airdrop** - Airdrop hunting
23. **Portfolio** - Portfolio analytics
24. **AI** - AI assistant endpoints
25. **Premium** - Premium features and passes
26. **Whale Tracker** - Whale tracking services
27. **DApps** - DApps directory
28. **Gas** - Gas price information

## Troubleshooting

### Server Not Running

**Error**: `❌ ERROR: Backend server is not running or not accessible!`

**Solution**: 
1. Check if the server is running: `netstat -ano | findstr :3001` (Windows) or `lsof -i :3001` (Mac/Linux)
2. Start the backend server using one of the methods above
3. Wait a few seconds for the server to initialize
4. Run the tests again

### Connection Refused

**Error**: `Status: 0, Error: Error`

**Solution**:
1. Verify the API_BASE_URL is correct
2. Check firewall settings
3. Ensure the server is listening on the correct port
4. Check server logs for errors

### Authentication Errors

**Error**: `Status: 401, Error: Unauthorized`

**Solution**:
- This is expected for endpoints that require authentication
- Provide a valid AUTH_TOKEN environment variable
- Or skip these endpoints by not providing a token (they will be skipped automatically)

### Timeout Errors

**Error**: `Timeout of 30000ms exceeded`

**Solution**:
1. Check server performance
2. Verify database connectivity
3. Check for slow queries
4. Increase timeout in test script if needed

## Test Results Interpretation

### Success Rate

- **100%**: All endpoints working correctly ✅
- **90-99%**: Most endpoints working, review failures ⚠️
- **<90%**: Significant issues, investigate immediately ❌

### Common Failure Reasons

1. **Server not running** - Start the backend server
2. **Database connection issues** - Check database configuration
3. **Missing environment variables** - Set required env vars
4. **Service dependencies down** - Check external service status
5. **Authentication required** - Provide valid auth token
6. **Endpoint doesn't exist** - Verify route registration

## Continuous Integration

For CI/CD pipelines, add this to your workflow:

```yaml
- name: Test API Endpoints
  run: |
    # Start backend server
    cd src/backend && pnpm start &
    sleep 10
    
    # Run tests
    npx tsx scripts/test-all-api-endpoints-comprehensive.ts
    
    # Exit code 0 = all tests passed, 1 = some failed
```

## Manual Testing

For manual endpoint testing, you can use:

- **curl**: `curl http://localhost:3001/api/health`
- **Postman**: Import the API routes and test individually
- **Browser**: Navigate to GET endpoints directly
- **Thunder Client**: VS Code extension for API testing

## Next Steps

After running tests:

1. **Review failed endpoints** - Check the detailed error messages
2. **Fix issues** - Address any server errors or missing endpoints
3. **Re-run tests** - Verify fixes work
4. **Document changes** - Update API documentation if endpoints changed
5. **Deploy** - Once all tests pass, proceed with deployment

## Support

If you encounter issues:

1. Check server logs: `tail -f src/backend/logs/*.log`
2. Review error messages in test output
3. Verify environment configuration
4. Check database connectivity
5. Review API route registration in `src/backend/server.ts`
