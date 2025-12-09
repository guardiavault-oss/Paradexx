# Recovery Metrics & Subscription Expiry Handling

## Overview

This document describes the recovery metrics tracking system and subscription expiry handling for edge cases.

## Recovery Metrics

### What Percentage of Users Need Recovery?

The system now tracks:

1. **Recovery Success Rate**: Percentage of successful recovery attempts
2. **Recovery Needs Percentage**: Percentage of users who attempt recovery vs total active users
3. **Breakdown by Recovery Type**:
   - Lost password recovery
   - Vault recovery (2-of-3 or 3-of-5)
   - Multi-sig wallet recovery

### API Endpoint

```
GET /api/recovery/metrics
```

Returns:
```json
{
  "metrics": {
    "totalAttempts": 150,
    "successfulRecoveries": 142,
    "failedRecoveries": 8,
    "successRate": 94.67,
    "recoveryRate": 5.2,
    "byScheme": {
      "2-of-3": {
        "attempts": 120,
        "successes": 115,
        "successRate": 95.83
      },
      "3-of-5": {
        "attempts": 30,
        "successes": 27,
        "successRate": 90.00
      }
    },
    "byType": {
      "vault": 100,
      "multisig": 30,
      "password": 20
    }
  },
  "recoveryNeeds": {
    "usersNeedingRecovery": 45,
    "totalActiveUsers": 865,
    "percentage": 5.20,
    "breakdown": {
      "lostPassword": 15,
      "lostVault": 20,
      "lostWallet": 10
    }
  }
}
```

## Subscription Expiry Scenarios

### Scenario 1: Death Detected After Subscription Expired

**Problem**: User dies, but subscription expired before death verification.

**Solution**: 
- Subscription is automatically extended by 6 months when death is verified
- Beneficiaries and guardians are notified
- Vault recovery remains accessible

**Implementation**: `subscriptionExpiryHandler.handleDeathAfterExpiry()`

### Scenario 2: Subscription Expires During Warning Period

**Problem**: User's vault is in warning state (missed check-in) and subscription is expiring.

**Solution**:
- User receives warning email about expiring subscription
- Reminder to complete check-in
- Recovery remains available even if subscription expires

**Implementation**: `subscriptionExpiryHandler.handleExpiryDuringWarning()`

### Scenario 3: Lost Password + Expired Subscription

**Problem**: User loses password but subscription has expired.

**Solution**:
- Account recovery is ALWAYS available, even with expired subscription
- This is a security-critical feature
- User can recover account using 2-of-3 guardians or recovery keys

**Implementation**: `subscriptionExpiryHandler.allowRecoveryWithExpiredSubscription()`

## Recovery Thresholds

Current implementation:
- **Vault Recovery**: 2-of-3 guardians (66.67% threshold) or legacy 3-of-5 (60% threshold)
- **Multi-Sig Recovery**: 2-of-3 recovery keys (66.67% threshold)
- **Time Lock**: 7-day waiting period before recovery executes

## Key Principles

1. **Recovery is Always Available**: Even if subscription expires, users can recover accounts
2. **Death Auto-Extension**: Death verification automatically extends subscription by 6 months
3. **Metrics Tracking**: All recovery attempts are tracked for monitoring and improvement
4. **User Communication**: Users are notified of critical subscription expiry scenarios

