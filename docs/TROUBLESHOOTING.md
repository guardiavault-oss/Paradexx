# Troubleshooting Guide

Common issues and solutions for RegenX integration.

## Table of Contents

1. [Connection Issues](#connection-issues)
2. [Authentication Problems](#authentication-problems)
3. [WebSocket Issues](#websocket-issues)
4. [Transaction Problems](#transaction-problems)
5. [Performance Issues](#performance-issues)
6. [Error Messages](#error-messages)

## Connection Issues

### API Requests Failing

**Symptoms:**
- Network errors
- Timeout errors
- CORS errors

**Solutions:**

1. **Check API URL**
   ```typescript
   // Verify base URL is correct
   console.log(import.meta.env.VITE_API_URL);
   ```

2. **Check Network Connection**
   ```typescript
   // Test connectivity
   fetch('https://api.regenx.app/health')
     .then(res => console.log('Connected:', res.ok))
     .catch(err => console.error('Connection failed:', err));
   ```

3. **CORS Issues**
   - Ensure backend allows your origin
   - Check CORS headers in response

### WebSocket Not Connecting

**Symptoms:**
- WebSocket status shows "disconnected"
- No real-time updates

**Solutions:**

1. **Check WebSocket URL**
   ```typescript
   const wsUrl = import.meta.env.VITE_WS_URL;
   console.log('WebSocket URL:', wsUrl);
   ```

2. **Check Authentication**
   ```typescript
   // Ensure token is set
   const token = localStorage.getItem('auth_token');
   if (!token) {
     console.error('No auth token found');
   }
   ```

3. **Manual Reconnection**
   ```typescript
   import { wsManager } from '@/services/websocket';
   await wsManager.reconnect();
   ```

## Authentication Problems

### Token Expired

**Symptoms:**
- 401 Unauthorized errors
- Automatic logout

**Solutions:**

1. **Refresh Token**
   ```typescript
   try {
     const response = await apiClient.post('/auth/refresh', {
       refreshToken: getRefreshToken(),
     });
     setAuthToken(response.data.token);
   } catch (error) {
     // Redirect to login
     window.location.href = '/login';
   }
   ```

2. **Auto-Refresh on 401**
   ```typescript
   // Add interceptor
   apiClient.interceptors.response.use(
     (response) => response,
     async (error) => {
       if (error.status === 401) {
         await refreshToken();
         return apiClient.request(error.config);
       }
       return Promise.reject(error);
     }
   );
   ```

### Invalid Token

**Symptoms:**
- Authentication errors
- Token not accepted

**Solutions:**

1. **Verify Token Format**
   ```typescript
   const token = localStorage.getItem('auth_token');
   // JWT tokens have 3 parts separated by dots
   const parts = token?.split('.');
   if (parts?.length !== 3) {
     console.error('Invalid token format');
   }
   ```

2. **Check Token Expiration**
   ```typescript
   function isTokenExpired(token: string): boolean {
     try {
       const payload = JSON.parse(atob(token.split('.')[1]));
       return payload.exp * 1000 < Date.now();
     } catch {
       return true;
     }
   }
   ```

## WebSocket Issues

### Frequent Disconnections

**Symptoms:**
- WebSocket disconnects often
- Reconnection attempts fail

**Solutions:**

1. **Check Network Stability**
   ```typescript
   // Monitor network status
   window.addEventListener('online', () => {
     wsManager.reconnect();
   });
   ```

2. **Increase Reconnect Attempts**
   ```typescript
   const manager = new WebSocketManager({
     reconnectAttempts: 10,
     reconnectDelay: 2000,
     exponentialBackoff: true,
   });
   ```

3. **Check Server Status**
   ```typescript
   // Ping server
   fetch('https://api.regenx.app/health')
     .then(res => console.log('Server status:', res.status));
   ```

### Messages Not Received

**Symptoms:**
- Subscribed but no messages
- Handler not called

**Solutions:**

1. **Verify Subscription**
   ```typescript
   const unsubscribe = wsManager.subscribe('my:channel', (data) => {
     console.log('Received:', data);
   });
   
   // Don't unsubscribe too early
   // return unsubscribe in useEffect cleanup
   ```

2. **Check Channel Name**
   ```typescript
   // Ensure channel name matches server
   wsManager.subscribe('wallet:activity', handler);
   ```

3. **Debug Messages**
   ```typescript
   wsManager.on('message', (message) => {
     console.log('All messages:', message);
   });
   ```

## Transaction Problems

### Transaction Stuck

**Symptoms:**
- Transaction pending for long time
- No confirmation

**Solutions:**

1. **Check Transaction Status**
   ```typescript
   const status = await apiClient.get(`/transactions/${txHash}`);
   console.log('Status:', status.data.status);
   ```

2. **Check Gas Price**
   ```typescript
   // Low gas price can cause stuck transactions
   const gasPrice = await apiClient.get('/gas/price');
   console.log('Current gas price:', gasPrice.data);
   ```

3. **Cancel and Retry**
   ```typescript
   // Cancel stuck transaction
   await apiClient.post(`/transactions/${txHash}/cancel`);
   
   // Retry with higher gas
   await apiClient.post('/wallet/send', {
     ...txData,
     gasPrice: higherGasPrice,
   });
   ```

### Transaction Failed

**Symptoms:**
- Transaction shows as failed
- Error message displayed

**Solutions:**

1. **Check Error Details**
   ```typescript
   const tx = await apiClient.get(`/transactions/${txHash}`);
   console.error('Error:', tx.data.error);
   ```

2. **Common Causes:**
   - Insufficient balance
   - Invalid recipient address
   - Contract revert
   - Gas limit too low

3. **Retry with Fixes**
   ```typescript
   // Fix the issue and retry
   await apiClient.post('/wallet/send', {
     ...txData,
     // Fix: increase gas limit, check balance, etc.
   });
   ```

## Performance Issues

### Slow API Responses

**Symptoms:**
- Long loading times
- Timeout errors

**Solutions:**

1. **Enable Caching**
   ```typescript
   // Cache responses
   const cached = cache.get(key);
   if (cached) return cached;
   
   const data = await apiClient.get('/endpoint');
   cache.set(key, data, 60000); // 1 minute
   ```

2. **Optimize Requests**
   ```typescript
   // Batch requests
   const [balance, transactions] = await Promise.all([
     apiClient.get('/wallet/balance'),
     apiClient.get('/wallet/transactions'),
   ]);
   ```

3. **Use WebSocket for Real-time**
   ```typescript
   // Instead of polling, use WebSocket
   wsManager.subscribe('wallet:balance', (data) => {
     setBalance(data.balance);
   });
   ```

### Memory Leaks

**Symptoms:**
- App slows down over time
- High memory usage

**Solutions:**

1. **Clean Up Subscriptions**
   ```typescript
   useEffect(() => {
     const unsubscribe = wsManager.subscribe('channel', handler);
     return unsubscribe; // Important!
   }, []);
   ```

2. **Clear Intervals**
   ```typescript
   useEffect(() => {
     const interval = setInterval(() => {
       // Polling
     }, 1000);
     
     return () => clearInterval(interval);
   }, []);
   ```

## Error Messages

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `UNAUTHORIZED` | Invalid token | Refresh or re-login |
| `FORBIDDEN` | Insufficient permissions | Check user role |
| `NOT_FOUND` | Resource doesn't exist | Verify ID/endpoint |
| `VALIDATION_ERROR` | Invalid request data | Check request format |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |
| `SERVICE_UNAVAILABLE` | Service down | Check status page |

### Debug Mode

Enable debug logging:

```typescript
// In development
if (import.meta.env.DEV) {
  window.__REGENX_DEBUG__ = true;
}

// Log all API calls
apiClient.interceptors.request.use((config) => {
  if (window.__REGENX_DEBUG__) {
    console.log('API Request:', config);
  }
  return config;
});
```

## Getting Help

1. **Check Documentation**: [API Docs](./API.md), [Integration Guide](./INTEGRATION_GUIDE.md)
2. **GitHub Issues**: Report bugs and request features
3. **Support**: Contact support@regenx.app
4. **Status Page**: Check service status at status.regenx.app
