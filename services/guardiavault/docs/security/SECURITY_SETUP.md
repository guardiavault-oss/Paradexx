# Security Configuration Guide

This document describes the security measures implemented in GuardiaVault.

## Security Features

### 1. Helmet.js - Security Headers ✅

Helmet helps secure Express apps by setting various HTTP headers.

**Implemented in**: `server/index.ts`

**Headers Set**:
- `Content-Security-Policy` - Prevents XSS attacks
- `X-Content-Type-Options` - Prevents MIME-type sniffing
- `X-Frame-Options` - Prevents clickjacking
- `X-XSS-Protection` - Additional XSS protection
- `Strict-Transport-Security` - Forces HTTPS (in production)
- `Referrer-Policy` - Controls referrer information

**Configuration**:
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.sentry.io", "https://*.alchemy.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disabled for compatibility
}));
```

### 2. Rate Limiting ✅

Protects against brute force attacks and API abuse.

**Implemented in**: `server/index.ts`

**Two-tier Rate Limiting**:

1. **General API Rate Limiting**
   - Window: 15 minutes
   - Max requests: 100 per IP
   - Applied to: All `/api/` routes

2. **Authentication Rate Limiting**
   - Window: 15 minutes
   - Max requests: 10 per IP
   - Applied to: `/api/auth/` routes
   - Feature: Skips successful requests (only counts failures)

**Configuration**:
```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 auth attempts per window
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: true,
});
```

### 3. CORS Configuration ✅

Controls cross-origin resource sharing.

**Implemented in**: `server/index.ts`

**Configuration**:
- Only allows configured origins
- Supports credentials (cookies, auth headers)
- Allows necessary HTTP methods
- Handles OPTIONS preflight requests

**Allowed Origins**:
- `APP_URL` from environment
- `http://localhost:5000` (development)
- `http://localhost:5173` (Vite dev server)

### 4. Session Security ✅

Secure session management with express-session.

**Security Features**:
- `httpOnly` cookies (prevents XSS access)
- `secure` cookies in production (HTTPS only)
- Strong session secret
- 7-day expiration
- Prevents session fixation attacks

### 5. Input Validation ✅

Uses Zod for schema validation.

**Validation**:
- All user inputs validated with Zod schemas
- Type-safe validation
- Detailed error messages

### 6. Password Security ✅

bcrypt hashing for passwords.

**Configuration**:
- 10 rounds of hashing
- Salt automatically generated
- Prevents rainbow table attacks

## Production Checklist

### Required Security Settings

- [ ] **SESSION_SECRET**: Strong random string (use `openssl rand -base64 32`)
- [ ] **HTTPS**: SSL/TLS certificates configured
- [ ] **CORS**: Only production domains in allowed origins
- [ ] **Rate Limiting**: Adjust limits based on traffic
- [ ] **Security Headers**: Review CSP for your use case
- [ ] **Environment Variables**: All secrets in secure storage (not in code)
- [ ] **Database**: Connection string secured
- [ ] **API Keys**: All third-party keys secured

### Recommended Security Settings

- [ ] **WAF**: Web Application Firewall (Cloudflare, AWS WAF)
- [ ] **DDoS Protection**: Cloud provider DDoS protection
- [ ] **Security Audit**: Professional security audit before launch
- [ ] **Penetration Testing**: Regular pen testing
- [ ] **Bug Bounty**: Consider bug bounty program
- [ ] **Security Monitoring**: SIEM integration
- [ ] **Backup Encryption**: Encrypted backups
- [ ] **Access Control**: Least privilege principle

## Rate Limiting Tuning

### Adjust Based on Traffic

For high-traffic applications:

```typescript
// General API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // Increase for legitimate traffic
});

// Authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Decrease for tighter security
  skipSuccessfulRequests: true,
});
```

### IP-based vs User-based

Current implementation uses IP-based limiting. For better accuracy, consider:

- User-based limiting (requires authentication)
- Combined IP + User limiting
- Redis-backed rate limiting (for distributed systems)

## Content Security Policy

### Current CSP

```typescript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://*.sentry.io", "https://*.alchemy.com"],
  },
}
```

### Production Recommendations

1. **Remove `'unsafe-inline'` and `'unsafe-eval'`**:
   - Use nonces for inline scripts
   - Bundle all JavaScript
   - Avoid `eval()`

2. **Restrict `connectSrc`**:
   - Only allow specific domains
   - Don't use wildcards in production

3. **Add `fontSrc`**:
   ```typescript
   fontSrc: ["'self'", "https://fonts.gstatic.com"],
   ```

4. **Add `frameSrc`**:
   ```typescript
   frameSrc: ["'none'"], // Or specific domains for iframes
   ```

## Testing Security

### Test Rate Limiting

```bash
# Test general rate limit (should fail after 100 requests)
for i in {1..101}; do curl http://localhost:5000/api/health; done

# Test auth rate limit (should fail after 10 requests)
for i in {1..11}; do curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'; done
```

### Test Security Headers

```bash
curl -I http://localhost:5000
```

Check for:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy: ...`
- `Strict-Transport-Security: ...` (in production with HTTPS)

## Common Attacks Mitigated

### ✅ Protected Against

- **XSS (Cross-Site Scripting)**: CSP headers, input validation
- **CSRF (Cross-Site Request Forgery)**: SameSite cookies, CORS
- **Clickjacking**: X-Frame-Options header
- **Brute Force**: Rate limiting on auth endpoints
- **DDoS**: Rate limiting on all endpoints
- **Session Hijacking**: Secure, httpOnly cookies
- **SQL Injection**: Parameterized queries (Drizzle ORM)
- **MIME Sniffing**: X-Content-Type-Options header

### ⚠️ Additional Recommendations

- **Regular Security Updates**: Keep dependencies updated
- **Security Headers Monitoring**: Use tools like SecurityHeaders.com
- **Vulnerability Scanning**: Regular npm audit, Dependabot
- **Secrets Management**: Use secret management services
- **Logging & Monitoring**: Monitor for suspicious activity

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Rate Limiting Best Practices](https://www.cloudflare.com/learning/bots/what-is-rate-limiting/)

---

**Last Updated**: 2025-01-02  
**Status**: ✅ Security Middleware Configured

