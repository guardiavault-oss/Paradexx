# Security Hardening Guide

This document outlines security measures implemented in ParaDex Wallet and recommended hardening steps.

## Security Headers

### Netlify Configuration

Security headers are configured in `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https: wss:; font-src 'self' data:; frame-ancestors 'none';"
```

### Nginx Configuration

For self-hosted deployments, add to nginx.conf:

```nginx
# Security Headers
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

# HSTS (uncomment after SSL is verified working)
# add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https: wss:; font-src 'self' data:; frame-ancestors 'none';" always;
```

## Authentication Security

### JWT Configuration

```typescript
// Recommended JWT settings
const JWT_CONFIG = {
  algorithm: 'HS256',
  expiresIn: '15m',      // Short-lived access tokens
  refreshExpiresIn: '7d', // Longer refresh tokens
  issuer: 'paradex-wallet',
  audience: 'paradex-wallet-api',
};

// Never expose in logs
const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
```

### Password Requirements

- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Not in common password lists

### Session Management

- Use HTTP-only cookies for refresh tokens
- Implement token rotation
- Invalidate all sessions on password change
- Maximum concurrent sessions: 5

## API Security

### Rate Limiting

```typescript
// Rate limiting configuration
const RATE_LIMITS = {
  // General API
  standard: {
    windowMs: 60 * 1000,  // 1 minute
    max: 100,             // 100 requests per minute
  },
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,                     // 5 attempts
  },
  // Transaction endpoints
  transaction: {
    windowMs: 60 * 1000,  // 1 minute
    max: 10,              // 10 transactions per minute
  },
};
```

### Input Validation

- Validate all inputs server-side
- Use Zod schemas for type validation
- Sanitize HTML inputs
- Validate Ethereum addresses with checksum

### CORS Configuration

```typescript
// Production CORS settings
const corsOptions = {
  origin: [
    'https://paradex.app',
    'https://www.paradex.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
};
```

## Wallet Security

### Private Key Handling

- NEVER store private keys on the server
- Use client-side encryption for local storage
- Implement hardware wallet support (Ledger, Trezor)
- Clear sensitive data from memory after use

### Transaction Signing

- Always verify transaction details before signing
- Implement transaction simulation
- Show gas estimates before confirmation
- Support MEV protection

## Data Protection

### Encryption at Rest

- Database: Use encrypted PostgreSQL storage
- File storage: Use encrypted S3 buckets
- Backups: Encrypt all backups with AES-256

### Encryption in Transit

- TLS 1.3 minimum
- Perfect Forward Secrecy enabled
- Strong cipher suites only

### PII Handling

- Encrypt PII in database
- Implement data retention policies
- Support GDPR data export/deletion
- Audit logging for PII access

## Infrastructure Security

### Firewall Rules

```bash
# Allow only necessary ports
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw enable
```

### Database Security

- Use connection pooling
- Enable SSL for database connections
- Use least-privilege database users
- Regular security patches

### Container Security

```dockerfile
# Use non-root user
USER node

# Don't expose unnecessary ports
EXPOSE 3000

# Health checks
HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1
```

## Monitoring & Incident Response

### Security Logging

```typescript
// Log security events
const securityEvents = [
  'login_success',
  'login_failure',
  'password_change',
  'mfa_enabled',
  'mfa_disabled',
  'api_key_created',
  'api_key_revoked',
  'suspicious_activity',
];
```

### Alert Thresholds

| Event | Threshold | Action |
|-------|-----------|--------|
| Failed logins | 5 in 15 min | Account lockout |
| Rate limit hits | 100 in 1 min | Temporary IP ban |
| Invalid tokens | 10 in 5 min | Alert security team |
| SQL injection attempts | 1 | Block IP, alert |

### Incident Response

1. Detect and contain the incident
2. Assess the scope and impact
3. Notify affected users if required
4. Document the incident
5. Implement preventive measures

## Security Checklist

### Pre-Launch

- [ ] Penetration testing completed
- [ ] Dependency audit passed
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] JWT secrets rotated
- [ ] Database credentials secure
- [ ] Logging configured
- [ ] Monitoring enabled

### Ongoing

- [ ] Weekly dependency updates
- [ ] Monthly security scans
- [ ] Quarterly penetration tests
- [ ] Annual security audit
- [ ] Regular backup verification

## Vulnerability Reporting

If you discover a security vulnerability, please report it to:

- Email: security [at] paradex [dot] app
- Bug Bounty: https://bugcrowd.com/paradex (when available)

We will acknowledge receipt within 24 hours and provide a detailed response within 72 hours.

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
