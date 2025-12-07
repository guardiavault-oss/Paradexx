/**
 * Edge Case Audit Script
 * Comprehensive edge case identification and verification
 */

import { readFileSync } from "fs";
import { join } from "path";

interface EdgeCase {
  category: string;
  scenario: string;
  severity: "critical" | "high" | "medium";
  description: string;
  currentHandling: string;
  recommendation: string;
  files: string[];
}

const edgeCases: EdgeCase[] = [
  // Authentication Edge Cases
  {
    category: "authentication",
    scenario: "Concurrent login attempts",
    severity: "high",
    description: "Multiple login requests from same user/IP simultaneously",
    currentHandling: "Rate limiting exists, but no explicit concurrency handling",
    recommendation: "Add session management to prevent duplicate sessions",
    files: ["server/routes.ts"],
  },
  {
    category: "authentication",
    scenario: "Login during password reset",
    severity: "medium",
    description: "User attempts to login while password reset token is active",
    currentHandling: "Not explicitly handled",
    recommendation: "Invalidate reset token on successful login",
    files: ["server/routes.ts"],
  },
  {
    category: "authentication",
    scenario: "Session expiry during operation",
    severity: "high",
    description: "User session expires mid-operation (long-running requests)",
    currentHandling: "requireAuth middleware checks, but no graceful handling",
    recommendation: "Add session refresh mechanism for long operations",
    files: ["server/routes.ts"],
  },

  // Vault Edge Cases
  {
    category: "vault",
    scenario: "Vault creation with duplicate guardians",
    severity: "medium",
    description: "Same email/address added as multiple guardians",
    currentHandling: "Not explicitly prevented",
    recommendation: "Add validation to prevent duplicate guardians",
    files: ["server/routes.ts"],
  },
  {
    category: "vault",
    scenario: "Fragment recovery with corrupted fragments",
    severity: "critical",
    description: "Recovery attempt with invalid/corrupted fragment data",
    currentHandling: "Basic validation exists, but error messages may leak info",
    recommendation: "Improve error messages to not reveal fragment validity",
    files: ["server/routes.ts", "server/services/shamir.ts"],
  },
  {
    category: "vault",
    scenario: "Vault modification during recovery",
    severity: "critical",
    description: "Vault settings changed while recovery is in progress",
    currentHandling: "Not explicitly prevented",
    recommendation: "Lock vault modifications during active recovery",
    files: ["server/routes.ts"],
  },
  {
    category: "vault",
    scenario: "Check-in during grace period expiration",
    severity: "high",
    description: "User checks in exactly when grace period expires",
    currentHandling: "Race condition possible",
    recommendation: "Use database transactions for status updates",
    files: ["server/routes-checkin.ts"],
  },

  // Guardian/Beneficiary Edge Cases
  {
    category: "parties",
    scenario: "Guardian removal when only 3 exist",
    severity: "critical",
    description: "Removing guardian when vault has minimum required (3)",
    currentHandling: "UI prevents, but API may allow",
    recommendation: "Add server-side validation to enforce minimum guardians",
    files: ["server/routes.ts"],
  },
  {
    category: "parties",
    scenario: "Guardian email change during recovery",
    severity: "high",
    description: "Guardian email updated while fragments are being distributed",
    currentHandling: "Not handled",
    recommendation: "Lock guardian contact info during recovery",
    files: ["server/routes.ts"],
  },
  {
    category: "parties",
    scenario: "Beneficiary removal with allocated assets",
    severity: "high",
    description: "Removing beneficiary who has assets allocated",
    currentHandling: "Not explicitly prevented",
    recommendation: "Require asset reallocation before removal, or auto-redistribute",
    files: ["server/routes.ts"],
  },

  // Subscription Edge Cases
  {
    category: "subscription",
    scenario: "Payment failure during renewal",
    severity: "high",
    description: "Stripe payment fails during subscription renewal",
    currentHandling: "Partial handling exists",
    recommendation: "Implement grace period for failed payments, send notifications",
    files: ["server/routes.ts"],
  },
  {
    category: "subscription",
    scenario: "Subscription cancellation during death verification",
    severity: "critical",
    description: "User cancels subscription, then death is verified",
    currentHandling: "Handled by subscriptionExpiryHandler",
    recommendation: "Verify auto-extension works in all scenarios",
    files: ["server/services/subscriptionExpiryHandler.ts"],
  },

  // WebAuthn Edge Cases
  {
    category: "webauthn",
    scenario: "WebAuthn registration failure",
    severity: "medium",
    description: "Registration fails mid-process, credential partially created",
    currentHandling: "Basic error handling exists",
    recommendation: "Add cleanup mechanism for partial registrations",
    files: ["server/routes-webauthn.ts", "server/services/webauthn.ts"],
  },
  {
    category: "webauthn",
    scenario: "Multiple WebAuthn devices registration",
    severity: "low",
    description: "User registers multiple devices, some fail",
    currentHandling: "Each device is independent",
    recommendation: "Add device management UI to list/remove devices",
    files: ["server/routes-webauthn.ts"],
  },

  // Recovery Edge Cases
  {
    category: "recovery",
    scenario: "Recovery cancellation mid-process",
    severity: "high",
    description: "Owner cancels recovery after guardians have attested",
    currentHandling: "Handled in contract, but may need frontend update",
    recommendation: "Verify cancellation flow works from all states",
    files: ["server/routes.ts", "contracts/MultiSigRecovery.sol"],
  },
  {
    category: "recovery",
    scenario: "Recovery with wrong scheme fragments",
    severity: "critical",
    description: "User provides 2-of-3 fragments for 3-of-5 vault (or vice versa)",
    currentHandling: "Auto-detection exists, but may fail",
    recommendation: "Improve scheme detection, add explicit validation",
    files: ["server/routes.ts"],
  },

  // Database Edge Cases
  {
    category: "database",
    scenario: "Cascade delete on user deletion",
    severity: "high",
    description: "User deleted, all vaults/fragments should cascade delete",
    currentHandling: "Schema has CASCADE, but verify it works",
    recommendation: "Test cascade deletion, add cleanup jobs for orphaned data",
    files: ["shared/schema.ts"],
  },
  {
    category: "database",
    scenario: "Concurrent database updates",
    severity: "high",
    description: "Multiple simultaneous updates to same record",
    currentHandling: "No explicit transaction/locking",
    recommendation: "Add optimistic locking or database transactions",
    files: ["server/routes.ts"],
  },

  // Check-in Edge Cases
  {
    category: "checkin",
    scenario: "Check-in exactly at deadline",
    severity: "medium",
    description: "Check-in happens exactly when nextCheckInDue arrives",
    currentHandling: "Time-based checks may have race condition",
    recommendation: "Use database-level timestamp comparisons",
    files: ["server/routes-checkin.ts"],
  },
  {
    category: "checkin",
    scenario: "Biometric check-in failure fallback",
    severity: "high",
    description: "WebAuthn fails, TOTP fails, password fallback needed",
    currentHandling: "Fallback exists but may not be tested",
    recommendation: "Test all fallback paths, ensure user can always check in",
    files: ["client/src/lib/webauthn.ts", "server/routes-checkin.ts"],
  },
];

function generateReport() {
  console.log("\n" + "=".repeat(80));
  console.log("EDGE CASE AUDIT REPORT");
  console.log("=".repeat(80) + "\n");

  const bySeverity = {
    critical: edgeCases.filter(e => e.severity === "critical"),
    high: edgeCases.filter(e => e.severity === "high"),
    medium: edgeCases.filter(e => e.severity === "medium"),
  };

  const byCategory: Record<string, EdgeCase[]> = {};
  for (const edgeCase of edgeCases) {
    if (!byCategory[edgeCase.category]) {
      byCategory[edgeCase.category] = [];
    }
    byCategory[edgeCase.category].push(edgeCase);
  }

  console.log(`Total Edge Cases Identified: ${edgeCases.length}\n`);

  console.log("By Severity:");
  console.log(`  Critical: ${bySeverity.critical.length}`);
  console.log(`  High: ${bySeverity.high.length}`);
  console.log(`  Medium: ${bySeverity.medium.length}\n`);

  console.log("\nCRITICAL EDGE CASES:");
  console.log("-".repeat(80));
  for (const edgeCase of bySeverity.critical) {
    console.log(`\n[${edgeCase.category.toUpperCase()}] ${edgeCase.scenario}`);
    console.log(`  Description: ${edgeCase.description}`);
    console.log(`  Current Handling: ${edgeCase.currentHandling}`);
    console.log(`  Recommendation: ${edgeCase.recommendation}`);
    console.log(`  Files: ${edgeCase.files.join(", ")}`);
  }

  console.log("\n\nHIGH PRIORITY EDGE CASES:");
  console.log("-".repeat(80));
  for (const edgeCase of bySeverity.high) {
    console.log(`\n[${edgeCase.category.toUpperCase()}] ${edgeCase.scenario}`);
    console.log(`  Description: ${edgeCase.description}`);
    console.log(`  Recommendation: ${edgeCase.recommendation}`);
  }

  console.log("\n\n" + "=".repeat(80));
  console.log(`⚠️  ${bySeverity.critical.length} critical and ${bySeverity.high.length} high-priority edge cases identified.`);
  console.log("Review and test each scenario before deployment.");
  console.log("=".repeat(80) + "\n");
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateReport();
}

export { edgeCases, generateReport };

