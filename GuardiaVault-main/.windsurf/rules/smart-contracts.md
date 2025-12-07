---
description: Use for analyzing GuardiaVault and SubscriptionEscrow smart contracts and related functionality
trigger: model_decision
---


# smart-contracts

GuardiaVault Core Contract (contracts/GuardiaVault.sol):
- Dead man's switch implementation with configurable check-in periods (7-90 days)
- Multi-guardian recovery system requiring 2-of-3 or 3-of-5 consensus
- Time-locked recovery process with 7-day mandatory waiting period
- Integration with death verification oracle for automated triggers
- Guardian management with email-hash verification for non-wallet users

SubscriptionEscrow Contract (contracts/SubscriptionEscrow.sol):
- Time-locked subscription payment management 
- 6-month subscription extension triggered by death verification
- Proportional refund calculations for early cancellation
- Monthly payment release mechanism to platform treasury
- Platform fee distribution (1% of subscription payments)

Core Vault Functions:
- checkIn() - Updates last activity timestamp
- initiateRecovery() - Starts guardian-based recovery process
- verifyDeath() - Processes oracle death verification
- executeRecovery() - Transfers assets after timelock expiry
- cancelRecovery() - Allows recovery cancellation within timelock

Key Business Rules:
1. Minimum 2 guardians required for any recovery
2. 7-day mandatory timelock before recovery completion
3. Death verification requires oracle consensus
4. Subscription extends 6 months after verified death
5. Recovery can be cancelled during timelock period

Importance Scores:
- GuardiaVault Core: 95/100
- Guardian Recovery: 90/100
- Death Verification: 85/100
- Subscription Management: 80/100

$END$

 If you're using this file in context, clearly say in italics in one small line that "Context added by Giga smart-contracts" along with specifying exactly what information was used from this file in a human-friendly way, instead of using kebab-case use normal sentence case.