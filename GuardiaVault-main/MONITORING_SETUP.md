# GuardiaVault Monitoring & Alerting Setup Guide

**Version:** 1.0
**Last Updated:** 2025-11-07

This guide provides step-by-step instructions for setting up comprehensive monitoring and alerting for GuardiaVault in production.

---

## 📊 Monitoring Stack Overview

### Recommended Tools
1. **Error Tracking:** Sentry
2. **Performance Monitoring:** New Relic / DataDog / Grafana
3. **Uptime Monitoring:** Better Stack / UptimeRobot / Pingdom
4. **Log Aggregation:** LogRocket / Logtail / CloudWatch
5. **Database Monitoring:** Built-in provider tools (Neon, Supabase, etc.)

---

## 🔴 1. Error Tracking with Sentry

### Setup Steps

#### Backend (Node.js)

```typescript
// server/services/sentry.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: 1.0,
    integrations: [
      new ProfilingIntegration(),
    ],
    beforeSend(event) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
      }
      return event;
    },
  });
}

// Call in server/index.ts
import { initSentry } from './services/sentry';
initSentry();
```

#### Frontend (React)

```typescript
// client/src/lib/sentry.ts
import * as Sentry from '@sentry/react';

export function initSentry() {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: ['localhost', /^https:\/\/guardiavault\.com/],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Filter PII
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
      }
      return event;
    },
  });
}

// Call in main.tsx
import { initSentry } from './lib/sentry';
initSentry();
```

### Environment Variables

```bash
# .env.production
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_AUTH_TOKEN=your_auth_token_here
SENTRY_ORG=your-org
SENTRY_PROJECT=guardiavault
```

### Upload Source Maps

```json
// package.json
{
  "scripts": {
    "build": "vite build && sentry-cli sourcemaps upload --org=your-org --project=guardiavault ./dist"
  }
}
```

### Alert Configuration

**Critical Errors (Immediate Alert)**
- Database connection failures
- Authentication failures (>10/min)
- Payment processing failures
- Smart contract interaction failures

**High Priority (Alert within 5 minutes)**
- API error rate >1%
- Response time >1s (p95)
- Cache failures
- Email delivery failures

**Medium Priority (Alert within 15 minutes)**
- Individual user errors (429, 403)
- Non-critical API failures
- Asset loading failures

---

## 📈 2. Performance Monitoring

### Option A: New Relic

```typescript
// server/newrelic.js
'use strict'

exports.config = {
  app_name: ['GuardiaVault'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  },
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 0.5,
  },
  error_collector: {
    enabled: true,
    ignore_status_codes: [404],
  },
  distributed_tracing: {
    enabled: true
  },
  slow_sql: {
    enabled: true,
    max_samples: 10
  }
}

// Require at top of server/index.ts
require('./newrelic');
```

### Option B: DataDog

```typescript
// server/services/datadog.ts
import tracer from 'dd-trace';

export function initDataDog() {
  tracer.init({
    env: process.env.NODE_ENV,
    service: 'guardiavault-api',
    version: process.env.npm_package_version,
    logInjection: true,
  });
}
```

### Key Metrics to Track

#### API Performance
- **Response Time:**
  - p50 (median): <100ms
  - p95: <200ms
  - p99: <500ms
- **Throughput:** Requests per second
- **Error Rate:** <0.1%

#### Database Performance
- **Query Time:**
  - p50: <20ms
  - p95: <50ms
  - p99: <100ms
- **Connection Pool:** Usage %
- **Slow Queries:** Count per hour

#### Cache Performance
- **Hit Rate:** >50%
- **Miss Rate:** <50%
- **Eviction Rate:** Monitor for memory pressure

#### Business Metrics
- **Vaults Created:** Per hour/day
- **Recoveries Initiated:** Per day
- **Guardian Attestations:** Per day
- **Active Users:** Daily/Monthly
- **Revenue:** Subscription conversions

---

## ⏰ 3. Uptime Monitoring

### Better Stack (Recommended)

**Website:** https://betterstack.com

**Setup:**
1. Create account and project
2. Add endpoints to monitor:

```yaml
endpoints:
  - name: API Health Check
    url: https://guardiavault.com/api/health
    interval: 60s
    expected_status: 200
    timeout: 5s

  - name: Homepage
    url: https://guardiavault.com
    interval: 60s
    expected_status: 200
    timeout: 5s

  - name: Dashboard
    url: https://guardiavault.com/dashboard
    interval: 300s
    expected_status: 200
    timeout: 10s
```

**Alert Channels:**
- Email: team@guardiavault.com
- SMS: +1-XXX-XXX-XXXX
- Slack: #production-alerts
- Discord: #alerts

**Alert Rules:**
- **Critical:** 3 consecutive failures (3 minutes)
- **Recovery:** Send "All clear" notification

### Health Check Endpoint

```typescript
// server/routes/health.ts
import express from 'express';
import { db } from '../db';

const router = express.Router();

router.get('/api/health', async (req, res) => {
  try {
    // Check database
    await db.execute(sql`SELECT 1`);

    // Check Redis
    const redis = await getRedisClient();
    if (redis && isRedisReady()) {
      await redis.ping();
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        redis: isRedisReady() ? 'up' : 'down',
        api: 'up',
      },
      version: process.env.npm_package_version,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

export default router;
```

---

## 📝 4. Log Aggregation

### Logtail Setup

```typescript
// server/services/logger.ts
import pino from 'pino';
import { Logtail } from '@logtail/node';
import { PinoLogtail } from '@logtail/pino';

const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN || '');

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    targets: [
      // Console transport (development)
      ...(process.env.NODE_ENV === 'development' ? [{
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }] : []),
      // Logtail transport (production)
      ...(process.env.NODE_ENV === 'production' ? [{
        target: '@logtail/pino',
        options: { logtail },
      }] : []),
    ],
  },
});

// Structured logging helpers
export function logInfo(message: string, context?: Record<string, any>) {
  logger.info({ ...context }, message);
}

export function logError(error: Error, context?: Record<string, any>) {
  logger.error({ err: error, ...context }, error.message);
}

export function logWarn(message: string, context?: Record<string, any>) {
  logger.warn({ ...context }, message);
}
```

### Log Queries

**Find Errors:**
```
level:error
```

**Find Slow Queries:**
```
duration:>1000 AND context:database
```

**Find Failed Logins:**
```
message:"Login failed" AND context:auth
```

**Find Admin Actions:**
```
context:admin AND action:*
```

---

## 📊 5. Custom Dashboards

### Grafana Dashboard

**Metrics to Display:**

1. **System Health**
   - API uptime %
   - Error rate
   - Active connections

2. **Performance**
   - Response time (p50, p95, p99)
   - Database query time
   - Cache hit rate

3. **Business Metrics**
   - New vaults (last 24h)
   - Active recoveries
   - Guardian attestations
   - Revenue (daily/monthly)

4. **Alerts**
   - Active alerts
   - Recently resolved
   - Alert history

### Sample Dashboard Config

```json
{
  "dashboard": {
    "title": "GuardiaVault Production",
    "panels": [
      {
        "title": "API Response Time",
        "targets": [{
          "query": "avg(api_response_time_ms)"
        }],
        "alert": {
          "conditions": [
            {
              "evaluator": { "params": [200] },
              "operator": "gt",
              "query": "p95(api_response_time_ms)"
            }
          ]
        }
      }
    ]
  }
}
```

---

## 🚨 6. Alert Configuration

### Alert Priority Levels

| Priority | Response Time | Notification Channels |
|----------|---------------|----------------------|
| P0 - Critical | Immediate | SMS + Slack + Email + PagerDuty |
| P1 - High | 5 minutes | Slack + Email |
| P2 - Medium | 15 minutes | Email |
| P3 - Low | 1 hour | Email (digest) |

### Critical Alerts (P0)

**Database Down**
```yaml
condition: database_connection_failures > 3 in 1 minute
action: SMS + Slack + Email
escalation: Page on-call engineer after 5 minutes
```

**API Error Rate Spike**
```yaml
condition: error_rate > 5% in 5 minutes
action: SMS + Slack + Email
escalation: Page on-call engineer after 10 minutes
```

**Payment Processing Failure**
```yaml
condition: stripe_webhook_failures > 3 in 5 minutes
action: SMS + Slack + Email
escalation: Immediate
```

### High Priority Alerts (P1)

**Slow API Response**
```yaml
condition: p95_response_time > 500ms for 5 minutes
action: Slack + Email
escalation: After 15 minutes
```

**Cache Degradation**
```yaml
condition: cache_hit_rate < 30% for 10 minutes
action: Slack + Email
escalation: After 30 minutes
```

### Medium Priority Alerts (P2)

**High Memory Usage**
```yaml
condition: memory_usage > 80% for 15 minutes
action: Email
escalation: After 1 hour
```

**Disk Space Low**
```yaml
condition: disk_usage > 85%
action: Email
escalation: After 2 hours
```

---

## 📧 7. Notification Channels

### Slack Integration

```typescript
// server/services/slack.ts
import axios from 'axios';

export async function sendSlackAlert(
  message: string,
  severity: 'critical' | 'warning' | 'info' = 'info'
) {
  const colors = {
    critical: '#FF0000',
    warning: '#FFA500',
    info: '#0000FF',
  };

  await axios.post(process.env.SLACK_WEBHOOK_URL!, {
    attachments: [{
      color: colors[severity],
      title: `GuardiaVault Alert - ${severity.toUpperCase()}`,
      text: message,
      footer: 'GuardiaVault Monitoring',
      ts: Math.floor(Date.now() / 1000),
    }],
  });
}
```

### Email Alerts

```typescript
// server/services/email-alerts.ts
import { sendEmail } from './email';

export async function sendEmailAlert(
  subject: string,
  message: string,
  severity: 'critical' | 'warning' | 'info' = 'info'
) {
  await sendEmail({
    to: process.env.ALERT_EMAIL!,
    subject: `[${severity.toUpperCase()}] ${subject}`,
    html: `
      <h2 style="color: ${severity === 'critical' ? 'red' : 'orange'}">
        GuardiaVault Alert
      </h2>
      <p>${message}</p>
      <hr>
      <small>Timestamp: ${new Date().toISOString()}</small>
    `,
  });
}
```

---

## 🔧 8. Environment Variables

```bash
# Monitoring & Alerting
SENTRY_DSN=https://...@sentry.io/...
NEW_RELIC_LICENSE_KEY=...
DATADOG_API_KEY=...
LOGTAIL_SOURCE_TOKEN=...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_EMAIL=alerts@guardiavault.com
BETTER_STACK_API_KEY=...
```

---

## ✅ Verification Checklist

After setup, verify all monitoring is working:

- [ ] Send test error to Sentry (confirm receipt)
- [ ] Trigger performance alert (simulate slow response)
- [ ] Test uptime monitoring (take service down briefly)
- [ ] Send test log to aggregation service
- [ ] Trigger Slack alert (test notification)
- [ ] Trigger email alert (test notification)
- [ ] Verify dashboard is updating in real-time
- [ ] Test alert escalation (leave alert unacknowledged)

---

## 📱 On-Call Rotation

### On-Call Schedule
- **Primary:** Rotates weekly
- **Secondary:** Rotates weekly (offset by 3-4 days)
- **Escalation:** After 15 minutes

### On-Call Responsibilities
1. Respond to P0 alerts within 5 minutes
2. Acknowledge all alerts within 15 minutes
3. Provide status updates every 30 minutes during incidents
4. Document all incidents in post-mortem
5. Update runbooks based on learnings

### Runbooks
- Database Connection Issues: `docs/runbooks/database.md`
- High Error Rate: `docs/runbooks/errors.md`
- Performance Degradation: `docs/runbooks/performance.md`
- Smart Contract Issues: `docs/runbooks/smart-contracts.md`

---

## 📚 Additional Resources

- [Sentry Documentation](https://docs.sentry.io)
- [New Relic Documentation](https://docs.newrelic.com)
- [DataDog Documentation](https://docs.datadoghq.com)
- [Better Stack Documentation](https://betterstack.com/docs)
- [Logtail Documentation](https://betterstack.com/docs/logs)

---

**Last Updated:** 2025-11-07
**Maintained By:** DevOps Team
**Review Frequency:** Quarterly
