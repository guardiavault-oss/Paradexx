# Fragment Recovery Monitoring Guide

## Overview
This document outlines monitoring strategies and metrics for the fragment recovery system, including tracking both 2-of-3 and legacy 3-of-5 schemes.

## Key Metrics to Monitor

### 1. Recovery Success Rates
**Metric**: `vault_recovery_success_rate`
- Track successful vs failed recovery attempts
- Segment by scheme (2-of-3 vs 3-of-5)
- Alert if success rate drops below 95%

```sql
-- Example query for recovery success rate
SELECT 
  fragment_scheme,
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate,
  COUNT(*) as total_attempts
FROM recovery_attempts
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY fragment_scheme;
```

### 2. Fragment Count Distribution
**Metric**: `fragment_count_distribution`
- Monitor fragment counts provided in recovery attempts
- Detect anomalies (too few/many fragments)
- Track average fragments per recovery

### 3. Scheme Detection Accuracy
**Metric**: `scheme_detection_accuracy`
- Track automatic scheme detection vs manual specification
- Monitor cases where detection fails
- Log when vault metadata doesn't match fragment count

### 4. Error Types and Patterns
**Metrics**: 
- `recovery_error_types`: Categorize errors (insufficient fragments, invalid fragments, reconstruction failures)
- `error_rate_by_scheme`: Compare error rates between 2-of-3 and 3-of-5
- Alert on new error patterns

### 5. Legacy Vault Activity
**Metric**: `legacy_vault_recovery_rate`
- Track how many legacy 3-of-5 vaults are still active
- Monitor recovery attempts for legacy vaults
- Plan migration timeline based on usage

## Logging Strategy

### Structured Logging Format
```typescript
{
  event: 'vault_recovery_attempt',
  vaultId: string,
  scheme: '2-of-3' | '3-of-5',
  fragmentsProvided: number,
  threshold: number,
  success: boolean,
  errorType?: string,
  timestamp: ISO8601,
  userId?: string // If authenticated
}
```

### Critical Events to Log

1. **Recovery Attempt Started**
   ```json
   {
     "event": "recovery_started",
     "vaultId": "vault-123",
     "scheme": "2-of-3",
     "fragmentsCount": 2
   }
   ```

2. **Recovery Success**
   ```json
   {
     "event": "recovery_success",
     "vaultId": "vault-123",
     "scheme": "2-of-3",
     "fragmentsUsed": 2,
     "durationMs": 45
   }
   ```

3. **Recovery Failure**
   ```json
   {
     "event": "recovery_failure",
     "vaultId": "vault-123",
     "scheme": "2-of-3",
     "error": "insufficient_fragments",
     "fragmentsProvided": 1,
     "threshold": 2
   }
   ```

4. **Scheme Detection**
   ```json
   {
     "event": "scheme_detected",
     "vaultId": "vault-123",
     "detectedScheme": "2-of-3",
     "detectionMethod": "vault_metadata" | "fragment_count" | "auto_detect",
     "confidence": "high" | "medium" | "low"
   }
   ```

## Alert Thresholds

### Critical Alerts
- Recovery success rate < 90% for any scheme
- Multiple reconstruction failures in 5 minutes
- Scheme detection failures > 5% of attempts
- Legacy vault recovery failures > 10% (may indicate user confusion)

### Warning Alerts
- Recovery success rate < 95%
- Unusual fragment count distribution (e.g., all attempts with exactly 2 fragments)
- High number of "invalid fragment" errors
- Legacy vault activity spike (potential user confusion)

### Info Logs
- Daily recovery attempt summaries
- Scheme distribution statistics
- Legacy vault migration progress

## Monitoring Dashboard

### Recommended Panels

1. **Recovery Success Rate (24h)**
   - Line chart showing success rate over time
   - Separate lines for 2-of-3 and 3-of-5 schemes
   - Alert threshold at 95%

2. **Recovery Attempts by Scheme**
   - Pie chart showing distribution
   - Track migration from 3-of-5 to 2-of-3

3. **Error Distribution**
   - Bar chart showing error types
   - Most common errors at top
   - Color-coded by severity

4. **Fragment Count Heatmap**
   - Heatmap showing fragment count vs success rate
   - Helps identify optimal fragment counts
   - Shows if users are confused about requirements

5. **Legacy Vault Activity**
   - Timeline showing legacy vault recovery attempts
   - Track decline over time (migration progress)

## Edge Cases to Monitor

### 1. Insufficient Fragments
**Scenario**: User provides fewer fragments than threshold
- **Expected**: Error message returned
- **Monitor**: Error rate and user behavior after error
- **Action**: If high rate, improve UI messaging

### 2. Too Many Fragments
**Scenario**: User provides more fragments than needed (e.g., 5 fragments for 2-of-3)
- **Expected**: System uses first N fragments
- **Monitor**: Whether extra fragments cause issues
- **Action**: Log which fragments were used

### 3. Mixed Schemes
**Scenario**: User mixes fragments from different vaults/schemes
- **Expected**: Reconstruction fails
- **Monitor**: Error frequency and patterns
- **Action**: Improve error messages to help users identify issue

### 4. Legacy Vault Confusion
**Scenario**: Legacy vault users confused about fragment requirements
- **Expected**: Higher error rates for legacy vaults
- **Monitor**: Error types and user support tickets
- **Action**: Provide migration guidance or better UI indicators

### 5. Scheme Detection Failures
**Scenario**: Auto-detection selects wrong scheme
- **Expected**: Manual override or correction
- **Monitor**: Detection accuracy and correction rate
- **Action**: Improve detection logic if accuracy < 95%

## Performance Monitoring

### Response Time
- Track recovery endpoint response time
- Alert if p95 > 500ms
- Monitor for performance degradation with scheme detection

### Resource Usage
- CPU/Memory usage during recovery
- Database query performance for vault lookups
- Fragment reconstruction computation time

## User Behavior Analytics

### Track:
- Average time to complete recovery
- Number of attempts before success
- Fragment entry patterns (all at once vs staggered)
- Drop-off rate at fragment entry step

### Insights:
- If users consistently fail on first attempt, improve guidance
- If recovery takes too long, optimize UX
- If legacy vault users struggle more, provide targeted help

## Rollout Monitoring Checklist

- [ ] Recovery success rate baseline established
- [ ] Alert thresholds configured
- [ ] Logging infrastructure tested
- [ ] Dashboard created with key metrics
- [ ] Legacy vault inventory completed
- [ ] Migration timeline defined
- [ ] User support team briefed on changes
- [ ] Error message improvements tested
- [ ] Scheme detection accuracy validated
- [ ] Performance benchmarks established

## Incident Response

### If Recovery Success Rate Drops
1. Check recent deployments/changes
2. Review error logs for patterns
3. Verify fragment validation logic
4. Check if scheme detection is working
5. Review user support tickets
6. Consider rolling back if issue widespread

### If Legacy Vault Issues Detected
1. Identify affected vaults
2. Contact vault owners with guidance
3. Provide migration assistance if needed
4. Update documentation/UI based on issues
5. Consider extending legacy support if needed

## Weekly Review Checklist

- [ ] Review recovery success rates by scheme
- [ ] Check error distribution and trends
- [ ] Monitor legacy vault activity decline
- [ ] Review support tickets related to recovery
- [ ] Validate scheme detection accuracy
- [ ] Update migration timeline based on usage
- [ ] Review performance metrics
- [ ] Check for any new edge cases

## Long-Term Metrics

### Migration Progress
- Percentage of vaults migrated from 3-of-5 to 2-of-3
- Legacy vault recovery attempts over time
- User satisfaction with new scheme

### System Health
- Overall recovery success rate (target: >98%)
- Average recovery time
- User error rate (target: <5%)
- Support ticket volume related to recovery

