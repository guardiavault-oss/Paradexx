# Security Best Practices

Security guidelines and best practices for RegenX.

## Table of Contents

1. [Authentication](#authentication)
2. [Data Protection](#data-protection)
3. [API Security](#api-security)
4. [WebSocket Security](#websocket-security)
5. [Frontend Security](#frontend-security)
6. [Infrastructure Security](#infrastructure-security)

## Authentication

### Token Management

- **Never store tokens in localStorage for sensitive operations**
  ```typescript
  // ❌ Bad
  localStorage.setItem('token', token);
  
  // ✅ Good - Use httpOnly cookies for sensitive tokens
  // Or use secure sessionStorage with expiration
  sessionStorage.setItem('token', token);
  ```

- **Implement token rotation**
  ```typescript
  // Refresh tokens before expiration
  if (isTokenExpiringSoon(token)) {
    await refreshToken();
  }
  ```

- **Validate tokens on every request**
  ```typescript
  // Server-side validation
  const decoded = jwt.verify(token, SECRET);
  if (decoded.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }
  ```

### Password Security

- **Use strong password requirements**
  - Minimum 12 characters
  - Mix of uppercase, lowercase, numbers, symbols
  - No common passwords

- **Hash passwords with bcrypt**
  ```typescript
  import bcrypt from 'bcrypt';
  
  const hashed = await bcrypt.hash(password, 12);
  const isValid = await bcrypt.compare(password, hashed);
  ```

## Data Protection

### Encryption

- **Encrypt sensitive data at rest**
  ```typescript
  import crypto from 'crypto';
  
  const cipher = crypto.createCipher('aes-256-gcm', key);
  const encrypted = cipher.update(data, 'utf8', 'hex');
  ```

- **Use HTTPS/TLS for all communications**
  - Enforce HTTPS in production
  - Use HSTS headers
  - Regular certificate renewal

### PII Protection

- **Minimize data collection**
  - Only collect necessary data
  - Anonymize where possible

- **GDPR Compliance**
  - User data deletion
  - Data export functionality
  - Consent management

## API Security

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Input Validation

```typescript
import { z } from 'zod';

const schema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string().regex(/^\d+$/),
});

const validated = schema.parse(req.body);
```

### SQL Injection Prevention

```typescript
// ❌ Bad - SQL injection risk
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ Good - Use parameterized queries
const query = 'SELECT * FROM users WHERE id = $1';
await db.query(query, [userId]);
```

### XSS Prevention

```typescript
import DOMPurify from 'dompurify';

// Sanitize user input
const clean = DOMPurify.sanitize(userInput);
```

## WebSocket Security

### Authentication

```typescript
// Verify token on connection
wss.on('connection', (ws, req) => {
  const token = new URL(req.url, 'http://localhost').searchParams.get('token');
  if (!verifyToken(token)) {
    ws.close(1008, 'Unauthorized');
    return;
  }
  // Handle connection
});
```

### Message Validation

```typescript
// Validate all incoming messages
ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    validateMessage(message); // Schema validation
    handleMessage(message);
  } catch (error) {
    ws.close(1008, 'Invalid message');
  }
});
```

### Rate Limiting

```typescript
// Limit message rate per connection
const messageLimiter = new Map();

ws.on('message', (data) => {
  const count = messageLimiter.get(ws) || 0;
  if (count > 100) { // 100 messages per minute
    ws.close(1008, 'Rate limit exceeded');
    return;
  }
  messageLimiter.set(ws, count + 1);
});
```

## Frontend Security

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline';">
```

### XSS Prevention

```typescript
// Always sanitize user input
import DOMPurify from 'dompurify';

function renderUserContent(content: string) {
  return <div dangerouslySetInnerHTML={{ 
    __html: DOMPurify.sanitize(content) 
  }} />;
}
```

### Secure Storage

```typescript
// ❌ Don't store sensitive data in localStorage
localStorage.setItem('privateKey', key);

// ✅ Use secure storage or encrypted storage
import { secureStorage } from '@/utils/secureStorage';
secureStorage.set('privateKey', encryptedKey);
```

## Infrastructure Security

### Environment Variables

- **Never commit secrets to git**
  ```bash
  # Use .env files (in .gitignore)
  # Or use secrets manager (AWS Secrets Manager, etc.)
  ```

- **Rotate secrets regularly**
  - API keys: Every 90 days
  - Database passwords: Every 180 days
  - SSL certificates: Before expiration

### Network Security

- **Use firewalls**
  - Restrict database access
  - Whitelist IPs for admin access

- **Use VPN for admin access**
  - Require VPN for production access
  - Multi-factor authentication

### Monitoring

- **Log security events**
  ```typescript
  logger.warn('Failed login attempt', {
    ip: req.ip,
    user: req.body.email,
    timestamp: new Date(),
  });
  ```

- **Alert on suspicious activity**
  - Multiple failed logins
  - Unusual API usage patterns
  - Unauthorized access attempts

## Security Checklist

### Development

- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Error messages don't leak sensitive info

### Deployment

- [ ] HTTPS enforced
- [ ] Security headers set
- [ ] Secrets in environment variables
- [ ] Database credentials rotated
- [ ] Regular security updates
- [ ] DDoS protection

### Monitoring

- [ ] Security event logging
- [ ] Intrusion detection
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Vulnerability scanning

## Incident Response

### Security Incident Procedure

1. **Identify** - Detect the security issue
2. **Contain** - Isolate affected systems
3. **Eradicate** - Remove the threat
4. **Recover** - Restore normal operations
5. **Learn** - Post-incident review

### Contact

- **Security Team**: security@regenx.app
- **Emergency**: +1-XXX-XXX-XXXX

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Best Practices](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

