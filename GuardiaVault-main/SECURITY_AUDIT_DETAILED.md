# GuardiaVault Security Audit Report
**Date:** November 7, 2025
**Auditor:** Claude (Automated Security Audit)
**Scope:** Full codebase security review

---

## Executive Summary

This comprehensive security audit identified **1 CRITICAL issue**, **1 MEDIUM issue**, and **multiple security best practices properly implemented**. The GuardiaVault project demonstrates strong security fundamentals with proper input validation, authentication, and SQL injection protection. However, the critical exposure of API keys in version control requires immediate remediation.

**Security Score:** 7.5/10 (Good, but critical issue must be resolved)

---

## 🔴 CRITICAL Issues (Immediate Action Required)

### 1. **API Keys Committed to Git Repository**
**Severity:** CRITICAL
**File:** `/home/user/GuardiaVault/client/.env.production`
**Lines:** 22, 25

**Issue:**
The file `client/.env.production` is tracked in git and contains real API keys:
- Infura API Key: `YOUR_INFURA_API_KEY_HERE` (Sepolia RPC URL)
- WalletConnect Project ID: `f32270e55fe94b09ccfc7a375022bb41`

This file is committed to version control (commit: `0d364cb`) and appears in multiple documentation files:
- `QUICK_START.md`
- `docs/deployment/env/RAILWAY_ENV_VARS.txt`
- `docs/deployment/env/NETLIFY_ENV_VARS.txt`
- Multiple files in `docs/archive/status-reports/`

**Risk:**
- ✅ **WalletConnect Project ID:** This is actually designed to be public and is NOT a secret. No action needed.
- ⚠️ **Infura API Key:** While this is for Sepolia testnet (not mainnet), exposing it allows:
  - Unauthorized usage against your Infura quota
  - Potential service disruption if rate limits are hit
  - Not a critical security breach for testnet, but bad practice

**Recommendations:**
1. **Immediately rotate the Infura API key** at https://app.infura.io/
2. **Remove `client/.env.production` from git:**
   ```bash
   git rm --cached client/.env.production
   echo "client/.env.production" >> .gitignore
   git commit -m "Remove exposed API keys from version control"
   ```
3. **Remove the API key from all documentation files** - replace with placeholder `YOUR_API_KEY`
4. **Use environment variables injection** during build/deployment (Netlify environment variables)
5. **Audit git history** - Consider using tools like `git-secrets` or BFG Repo-Cleaner to remove from history
6. **For production:** Never commit `.env.production` - use platform environment variables instead

**Status:** ❌ **UNRESOLVED** - Requires immediate action

---

## 🟡 MEDIUM Priority Issues

### 1. **Potential XSS Risk with dangerouslySetInnerHTML**
**Severity:** MEDIUM (Mitigated but not ideal)
**File:** `/home/user/GuardiaVault/client/src/pages/SmartWillBuilder.tsx`
**Line:** 1052

**Issue:**
The component uses `dangerouslySetInnerHTML` to render HTML preview content:
```tsx
<div dangerouslySetInnerHTML={{ __html: previewContent }} />
```

**Mitigation in place:**
- ✅ The HTML is generated server-side using Handlebars templates (`/home/user/GuardiaVault/server/services/willPdfTemplate.hbs`)
- ✅ Handlebars uses `{{variable}}` syntax which **auto-escapes HTML** by default
- ✅ No triple-brace `{{{variable}}}` usage found (which would bypass escaping)
- ✅ Input is validated with Zod schema before template rendering

**Why it's still a concern:**
- Using `dangerouslySetInnerHTML` is an anti-pattern in React
- Future template modifications could introduce XSS if triple-braces are used
- Relies on developer awareness of Handlebars escaping rules

**Recommendations:**
1. **Option 1 (Preferred):** Replace `dangerouslySetInnerHTML` with a proper HTML parser like `DOMPurify` or `react-html-parser`
2. **Option 2:** Add server-side DOMPurify sanitization before sending HTML to client
3. **Option 3:** Render the will preview as React components instead of raw HTML
4. **Add a code comment** warning developers about the importance of Handlebars escaping

**Example fix:**
```tsx
import DOMPurify from 'dompurify';

// In component:
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewContent) }} />
```

**Status:** ⚠️ **MITIGATED** - Consider improvement for defense-in-depth

---

## ✅ Properly Secured Areas

### 1. **Hardcoded Secrets/Keys** ✅
**Status:** SECURE (except for the .env.production issue above)

- ✅ No hardcoded API keys, secrets, or passwords found in source code
- ✅ All sensitive values use `process.env.*` environment variables
- ✅ Test file (`scripts/test-env-validation.ts`) contains only dummy test data
- ✅ `.env` files properly excluded in `.gitignore`:
  ```
  .env
  .env.local
  .env.*.local
  ```

**Files checked:**
- All `.ts`, `.js`, `.tsx`, `.jsx` files searched for patterns like `API_KEY=`, `SECRET=`, `PASSWORD=`, `TOKEN=`
- No matches with hardcoded values (only environment variable references)

---

### 2. **API Security** ✅
**Status:** SECURE

**HTTP/HTTPS Usage:**
- ✅ No insecure HTTP calls to external services found
- ✅ All external API calls use HTTPS
- ✅ HTTP only used for localhost development

**SSL/TLS Configuration:**
- ✅ No `rejectUnauthorized: false` or SSL verification disabled
- ✅ HTTPS enforced in production via session configuration

**CORS Configuration:**
- ✅ Strict CORS middleware implemented (`/home/user/GuardiaVault/server/middleware/security.ts`)
- ✅ Production mode validates against `ALLOWED_ORIGINS` environment variable
- ✅ Blocks unauthorized origins and logs violations
- ✅ Development mode allows all origins (appropriate for dev)

**CORS Implementation:**
```typescript
// Production: Strict origin validation
if (origin && allowedOrigins.includes(origin)) {
  res.header('Access-Control-Allow-Origin', origin);
} else if (origin) {
  logWarn(`CORS blocked request from: ${origin}`);
  return res.status(403).json({ message: 'Forbidden' });
}
```

---

### 3. **Environment Variable Usage** ✅
**Status:** SECURE

**Environment Variable Files:**
- ✅ `.env.example` - Contains only placeholders, no real secrets
- ✅ `.env.test.example` - Contains test/placeholder values
- ✅ `client/.env.example` - Placeholders only
- ⚠️ `client/.env.production` - **Contains real API keys (see critical issue)**

**Validation:**
- ✅ Environment validation implemented (`server/config/env-validator.ts`)
- ✅ Production secrets validated for strength (SESSION_SECRET min length)
- ✅ Prevents default secrets in production
- ✅ Validates ENCRYPTION_KEY format

**Sample placeholders from .env.example:**
```bash
SESSION_SECRET=your-session-secret-change-in-production
PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
ETHERSCAN_API_KEY=your-etherscan-api-key
SENDGRID_API_KEY=
STRIPE_SECRET_KEY=
```

---

### 4. **Input Validation & SQL Injection Protection** ✅
**Status:** SECURE

**SQL Injection Prevention:**
- ✅ Using **Drizzle ORM** with parameterized queries
- ✅ No raw SQL string concatenation found
- ✅ All database queries use safe query builders
- ✅ SQL injection tests exist (`tests/integration/api/auth.test.ts`, `tests/integration/api/hardware.test.ts`)

**Example safe query:**
```typescript
await db
  .insert(claimFiles)
  .values({
    claimId: validated.claimId,
    fileName: file.originalname,
    mimeType: file.mimetype,
    // ... parameterized values
  })
  .returning();
```

**Input Validation:**
- ✅ **Zod schemas** used for request validation (`server/middleware/validation.ts`)
- ✅ Validation middleware for body, query params, and route params
- ✅ UUID validation for IDs
- ✅ Ethereum address validation
- ✅ Email format validation

**XSS Prevention:**
- ✅ HTML sanitization middleware (`server/middleware/htmlSanitizer.ts`)
- ✅ Applied to endpoints accepting user HTML (messages, legacy content)
- ✅ Removes `<script>`, event handlers, `javascript:` protocol, iframes
- ✅ Additional request body sanitization removes `<>` brackets and event handlers

**Sanitization Implementation:**
```typescript
export function sanitizeHTML(html: string): string {
  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");
  // ... more sanitization
}
```

---

### 5. **Authentication & Authorization** ✅
**Status:** SECURE

**Password Hashing:**
- ✅ Using **bcrypt** with cost factor 10
- ✅ Implemented in registration, OAuth, and demo user flows
- ✅ No plaintext passwords stored

**JWT Configuration:**
- ✅ JWT tokens for invite system (`server/services/invite-tokens.ts`)
- ✅ Secret from environment variable: `JWT_SECRET` or fallback to `SESSION_SECRET`
- ✅ Expiration time: 7 days for invite tokens
- ✅ Proper token validation with error handling

**Session Management:**
- ✅ Express-session with secure configuration
- ✅ HttpOnly cookies (prevents XSS cookie theft)
- ✅ Secure flag enabled in production (HTTPS only)
- ✅ SameSite: "none" for cross-origin OAuth (with secure:true requirement)
- ✅ 7-day session expiration
- ✅ Redis store support for production scalability

**Session Configuration:**
```typescript
const sessionOptions: session.SessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: "guardiavault.sid",
  cookie: {
    secure: isHTTPS,      // HTTPS only in production
    httpOnly: true,       // Prevents XSS
    sameSite: isHTTPS ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  },
};
```

**Authentication Middleware:**
- ✅ `requireAuth` middleware validates session
- ✅ Returns 401 for unauthorized requests
- ✅ Debug logging in development only

---

### 6. **File Upload Security** ✅
**Status:** SECURE

**Configuration:** `/home/user/GuardiaVault/server/routes-evidence.ts`

- ✅ **File size limit:** 10MB maximum
- ✅ **MIME type validation:** Whitelist of allowed types
  - `application/pdf`
  - `image/jpeg`, `image/png`, `image/jpg`
  - `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `text/plain`
- ✅ **Memory storage** (not disk) - safer for temporary processing
- ✅ **SHA-256 hash** computed for file integrity
- ✅ **Authentication required** for all upload endpoints
- ✅ **Input validation** using Zod schemas

**File upload middleware:**
```typescript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [ /* whitelist */ ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});
```

---

### 7. **Security Headers & CSP** ✅
**Status:** SECURE

**Helmet Integration:**
- ✅ Helmet.js installed and configured
- ✅ CSP disabled in Helmet (using custom CSP middleware)

**Custom Security Headers:** (`server/middleware/security.ts`)
- ✅ `X-Frame-Options: DENY` (prevents clickjacking)
- ✅ `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Permissions-Policy` (restricts geolocation, microphone, camera)
- ✅ `Strict-Transport-Security` in production with HTTPS

**Content Security Policy:**
- ✅ Custom CSP middleware (`server/middleware/csp.ts`)
- ✅ Nonce-based script execution
- ✅ CSP violation reporting endpoint
- ✅ Environment-specific policies (dev vs production)

---

### 8. **Rate Limiting** ✅
**Status:** SECURE

**API Rate Limiting:**
- ✅ General API: 100 requests per 15 minutes per IP
- ✅ Auth endpoints: 5 attempts per 15 minutes per IP
- ✅ Logging of rate limit violations
- ✅ Standard HTTP 429 responses

**Implementation:**
```typescript
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Stricter for auth
  skipSuccessfulRequests: true,
});
```

---

## 🔍 Additional Security Observations

### Code Quality & Security Practices

**Good Practices Found:**
- ✅ No use of `eval()` or `new Function()` (dangerous code execution)
- ✅ No dangerouslySetInnerHTML except in one controlled case (will preview)
- ✅ TypeScript strict mode for type safety
- ✅ Comprehensive error handling
- ✅ Security logging for audit trails
- ✅ Penetration testing scripts exist (`tests/security/penetration/runner.js`)

**Test Coverage:**
- ✅ SQL injection tests
- ✅ XSS attempt handling tests
- ✅ Authentication flow tests
- ✅ Integration tests for API security

---

## 📊 Security Checklist Summary

| Category | Status | Notes |
|----------|--------|-------|
| Hardcoded Secrets | ⚠️ | One file with API keys in git |
| Environment Variables | ✅ | Proper usage, validation in place |
| HTTPS/SSL | ✅ | No insecure configurations |
| CORS | ✅ | Strict origin validation |
| SQL Injection | ✅ | Using ORM with parameterized queries |
| XSS Protection | ⚠️ | One dangerouslySetInnerHTML (mitigated) |
| Password Hashing | ✅ | Bcrypt with appropriate cost |
| JWT Security | ✅ | Secrets from env, proper expiration |
| Session Security | ✅ | HttpOnly, Secure, SameSite configured |
| File Uploads | ✅ | Size limits, MIME validation, auth required |
| Rate Limiting | ✅ | API and auth endpoints protected |
| Security Headers | ✅ | CSP, X-Frame-Options, HSTS |
| Input Validation | ✅ | Zod schemas, sanitization middleware |
| Authentication | ✅ | Proper session-based auth |
| Authorization | ✅ | Resource ownership checks |

---

## 🎯 Recommendations Priority List

### Immediate (Do Today)
1. ✅ **Rotate Infura API key** and update environment variables
2. ✅ **Remove `client/.env.production` from git** and add to .gitignore
3. ✅ **Update documentation** to remove exposed API keys

### Short-term (This Week)
4. ⚠️ **Add DOMPurify** to sanitize HTML before using `dangerouslySetInnerHTML`
5. ⚠️ **Audit git history** for the Infura API key and consider using BFG Repo-Cleaner
6. ⚠️ **Add pre-commit hooks** using `git-secrets` or similar to prevent future key commits

### Medium-term (This Month)
7. 📝 **Security audit automation** - Add automated security scanning (e.g., Snyk, npm audit)
8. 📝 **Dependency scanning** - Regular updates for security patches
9. 📝 **Add security.txt** file for responsible disclosure
10. 📝 **Consider bug bounty program** for production

### Best Practices
11. 📝 **Regular security reviews** - Quarterly code audits
12. 📝 **Penetration testing** - Annual third-party security assessment
13. 📝 **Security training** - Keep team updated on OWASP Top 10

---

## 📋 Production Deployment Checklist

Before deploying to production, verify:

- [ ] All API keys removed from git repository
- [ ] `client/.env.production` not committed
- [ ] New Infura API key generated and configured in Netlify
- [ ] `ALLOWED_ORIGINS` configured with production domains
- [ ] `SESSION_SECRET` is strong (32+ characters, random)
- [ ] `NOTIFY_HMAC_SECRET` is strong and unique
- [ ] All `.env` files listed in `.gitignore`
- [ ] HTTPS enforced on all production endpoints
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] CSP policies tested and working
- [ ] Error messages don't leak sensitive information
- [ ] Database credentials secured
- [ ] Backup and recovery procedures documented
- [ ] Security incident response plan in place

---

## 🏆 Overall Security Assessment

**Strengths:**
- Strong authentication and session management
- Comprehensive input validation and sanitization
- Proper use of security headers and CSP
- Good separation of concerns (middleware architecture)
- SQL injection protection via ORM
- Rate limiting on sensitive endpoints
- File upload security controls

**Weaknesses:**
- API keys exposed in version control (critical)
- Use of dangerouslySetInnerHTML (medium, mitigated)
- Lack of automated secret scanning in CI/CD

**Final Score:** 7.5/10 (Good Security Posture)

**Recommendation:** Address the critical .env.production issue immediately, then focus on the medium-priority XSS improvement. The codebase demonstrates security awareness and follows most best practices. With the critical issue resolved, this would rate 8.5-9/10.

---

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Security Best Practices](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)
- [Helmet.js Documentation](https://helmetjs.github.io/)

---

**Report Generated:** November 7, 2025
**Next Audit Due:** February 7, 2026 (3 months)
