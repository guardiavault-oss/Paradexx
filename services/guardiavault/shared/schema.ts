import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - email/password authentication with optional wallet linking
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Hashed password
  walletAddress: text("wallet_address").unique(),
  walletConnectedAt: timestamp("wallet_connected_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  
  // Death Verification Fields (optional - for death monitoring consent)
  ssnHash: text("ssn_hash"), // SHA-256 hash of SSN (never store plaintext)
  fullName: text("full_name"),
  dateOfBirth: timestamp("date_of_birth"),
  lastKnownLocation: text("last_known_location"),
  deathMonitoringEnabled: boolean("death_monitoring_enabled").default(false),
  verificationTier: integer("verification_tier").default(1), // 1-4 based on vault value
  lastSsdiiCheck: timestamp("last_ssdi_check"),
  ssdiConsentGiven: boolean("ssdi_consent_given").default(false),
  ssdiConsentDate: timestamp("ssdi_consent_date"),
  ssdiConsentIpAddress: text("ssdi_consent_ip_address"), // IPv4 or IPv6
  deathVerifiedAt: timestamp("death_verified_at"),
  deathConfidenceScore: varchar("death_confidence_score", { length: 5 }), // DECIMAL(3,2) as string
  status: varchar("status", { length: 20 }).default("active"), // 'active' | 'deceased' | 'verification_pending'
  
  // 2FA/TOTP Fields
  totpSecret: text("totp_secret"), // Encrypted TOTP secret
  totpEnabled: boolean("totp_enabled").default(false),
  backupCodes: text("backup_codes"), // JSON array of hashed backup codes

  // Admin RBAC Fields
  role: varchar("role", { length: 50 }).default("user"), // 'user' | 'admin'
  isAdmin: boolean("is_admin").default(false),
});

// Vault status enum
export const vaultStatusEnum = pgEnum("vault_status", [
  "active",
  "warning",
  "critical",
  "triggered",
  "cancelled",
]);

// Vaults table - main vault configuration
export const vaults = pgTable("vaults", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  checkInIntervalDays: integer("check_in_interval_days").notNull().default(90),
  gracePeriodDays: integer("grace_period_days").notNull().default(14),
  status: vaultStatusEnum("status").notNull().default("active"),
  lastCheckInAt: timestamp("last_check_in_at").notNull().defaultNow(),
  nextCheckInDue: timestamp("next_check_in_due").notNull(),
  fragmentScheme: varchar("fragment_scheme", { length: 10 }).default("2-of-3"), // '2-of-3' or '3-of-5'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Yield protocol enum
export const yieldProtocolEnum = pgEnum("yield_protocol", [
  "aave",
  "compound",
  "uniswap",
  "curve",
  "balancer",
  "rocketpool",
  "lido",
  "frax",
]);

// Yield protocol category enum
export const yieldCategoryEnum = pgEnum("yield_category", [
  "lending",
  "dex_yield",
  "staking",
]);

// Yield Vaults table - diversified yield strategies
export const yieldVaults = pgTable("yield_vaults", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vaultId: varchar("vault_id")
    .notNull()
    .references(() => vaults.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  asset: varchar("asset", { length: 10 }).notNull(), // USDC, DAI, USDT, WETH
  principal: varchar("principal", { length: 50 }).notNull(), // Amount deposited (in wei/smallest unit)
  yieldAccumulated: varchar("yield_accumulated", { length: 50 }).notNull().default("0"), // Total yield earned
  totalValue: varchar("total_value", { length: 50 }).notNull(), // principal + yieldAccumulated
  protocol: yieldProtocolEnum("protocol").notNull(), // Which protocol is being used
  category: yieldCategoryEnum("category").notNull(), // lending, dex_yield, or staking
  apy: varchar("apy", { length: 10 }).notNull(), // Current APY as percentage (e.g., "4.5")
  lastYieldUpdate: timestamp("last_yield_update").notNull().defaultNow(), // Last time yield was calculated
  contractAddress: text("contract_address"), // On-chain yield vault contract address
  txHash: text("tx_hash"), // Transaction hash of vault creation
  status: varchar("status", { length: 20 }).default("active"), // active, paused, withdrawn
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Party role enum
export const partyRoleEnum = pgEnum("party_role", [
  "guardian",
  "beneficiary",
  "attestor",
]);

// Party status enum
export const partyStatusEnum = pgEnum("party_status", [
  "pending",
  "active",
  "declined",
  "inactive",
]);

// Parties table - guardians, beneficiaries, attestors
export const parties = pgTable("parties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vaultId: varchar("vault_id")
    .notNull()
    .references(() => vaults.id, { onDelete: "cascade" }),
  role: partyRoleEnum("role").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  inviteToken: text("invite_token"),
  inviteExpiresAt: timestamp("invite_expires_at"),
  status: partyStatusEnum("status").notNull().default("pending"),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Fragments table - encrypted key fragments
export const fragments = pgTable("fragments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vaultId: varchar("vault_id")
    .notNull()
    .references(() => vaults.id, { onDelete: "cascade" }),
  guardianId: varchar("guardian_id")
    .notNull()
    .references(() => parties.id, { onDelete: "cascade" }),
  fragmentIndex: integer("fragment_index").notNull(),
  encryptedData: text("encrypted_data").notNull(),
  derivationSalt: text("derivation_salt"), // Salt used for passphrase derivation (email:fragment:index) - optional for backwards compatibility
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Check-ins table - history of vault check-ins
export const checkIns = pgTable("check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vaultId: varchar("vault_id")
    .notNull()
    .references(() => vaults.id, { onDelete: "cascade" }),
  checkedInAt: timestamp("checked_in_at").notNull().defaultNow(),
  signature: text("signature").notNull(),
  ipAddress: text("ip_address"),
});

// Notification type enum
export const notificationTypeEnum = pgEnum("notification_type", [
  "check_in_reminder",
  "check_in_warning",
  "check_in_critical",
  "guardian_invitation",
  "beneficiary_notification",
  "attestor_request",
]);

// Notification status enum
export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
]);

// Notifications table - email/SMS queue
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vaultId: varchar("vault_id")
    .notNull()
    .references(() => vaults.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  recipient: text("recipient").notNull(),
  channel: text("channel").notNull(), // 'email' or 'sms'
  status: notificationStatusEnum("status").notNull().default("pending"),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas with Zod validation
export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    createdAt: true,
    lastLoginAt: true,
    walletConnectedAt: true,
    totpSecret: true, // TOTP is stored in separate totp_secrets table
    totpEnabled: true, // TOTP is stored in separate totp_secrets table
    backupCodes: true, // TOTP is stored in separate totp_secrets table
  })
  .extend({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  });

export const insertVaultSchema = createInsertSchema(vaults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastCheckInAt: true,
  nextCheckInDue: true,
  status: true,
});

export const insertYieldVaultSchema = createInsertSchema(yieldVaults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartySchema = createInsertSchema(parties).omit({
  id: true,
  createdAt: true,
  invitedAt: true,
  acceptedAt: true,
  status: true,
});

export const insertFragmentSchema = createInsertSchema(fragments).omit({
  id: true,
  createdAt: true,
});

export const insertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
  checkedInAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  status: true,
});

// Vault trigger claims - attestation of prolonged inactivity, NOT legal death verification
// This system attests to inability to contact the vault owner, not legal death status
export const claimStatusEnum = pgEnum("claim_status", [
  "pending",
  "under_review",
  "approved",
  "rejected",
  "expired",
]);

export const vaultTriggerClaims = pgTable("vault_trigger_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vaultId: varchar("vault_id")
    .notNull()
    .references(() => vaults.id, { onDelete: "cascade" }),
  createdBy: varchar("created_by").notNull(), // user id or email submitting
  claimantEmail: text("claimant_email").notNull(),
  status: claimStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Supporting documentation for vault trigger claims (attestation evidence)
export const claimFiles = pgTable("claim_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id")
    .notNull()
    .references(() => vaultTriggerClaims.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  sha256: text("sha256").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const attestationDecisionEnum = pgEnum("attestation_decision", [
  "pending",
  "approve",
  "reject",
]);

// Guardian/attestor decisions on vault trigger claims
export const claimAttestations = pgTable("claim_attestations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id")
    .notNull()
    .references(() => vaultTriggerClaims.id, { onDelete: "cascade" }),
  partyId: varchar("party_id")
    .notNull()
    .references(() => parties.id, { onDelete: "cascade" }),
  role: partyRoleEnum("role").notNull(), // guardian | attestor
  decision: attestationDecisionEnum("decision").notNull().default("pending"),
  signature: text("signature"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVaultTriggerClaimSchema = createInsertSchema(vaultTriggerClaims).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});

export const insertClaimFileSchema = createInsertSchema(claimFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertClaimAttestationSchema = createInsertSchema(claimAttestations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  decision: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertVault = z.infer<typeof insertVaultSchema>;
export type Vault = typeof vaults.$inferSelect;

export type InsertYieldVault = z.infer<typeof insertYieldVaultSchema>;
export type YieldVault = typeof yieldVaults.$inferSelect;

export type InsertParty = z.infer<typeof insertPartySchema>;
export type Party = typeof parties.$inferSelect;

export type InsertFragment = z.infer<typeof insertFragmentSchema>;
export type Fragment = typeof fragments.$inferSelect;

export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkIns.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export type VaultTriggerClaim = typeof vaultTriggerClaims.$inferSelect;
export type InsertVaultTriggerClaim = z.infer<typeof insertVaultTriggerClaimSchema>;
export type ClaimFile = typeof claimFiles.$inferSelect;
export type InsertClaimFile = z.infer<typeof insertClaimFileSchema>;
export type ClaimAttestation = typeof claimAttestations.$inferSelect;
export type InsertClaimAttestation = z.infer<typeof insertClaimAttestationSchema>;

// Re-export death verification schema types
export * from "./schema.death-verification";

// ============ Legacy Messages Tables ============
export const legacyMessageTypeEnum = pgEnum("legacy_message_type", [
  "video",
  "letter",
]);

export const legacyMessageStatusEnum = pgEnum("legacy_message_status", [
  "draft",
  "ready",
  "delivered",
]);

export const legacyMessages = pgTable("legacy_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vaultId: varchar("vault_id")
    .notNull()
    .references(() => vaults.id, { onDelete: "cascade" }),
  beneficiaryId: varchar("beneficiary_id")
    .references(() => parties.id, { onDelete: "set null" }), // null = all beneficiaries
  type: legacyMessageTypeEnum("type").notNull(),
  title: text("title").notNull(),
  content: text("content"), // For letters/text
  fileUrl: text("file_url"), // For video files (S3)
  fileHash: text("file_hash"), // SHA-256 hash for integrity
  encrypted: boolean("encrypted").notNull().default(true),
  status: legacyMessageStatusEnum("status").notNull().default("draft"),
  scheduledDeliveryDate: timestamp("scheduled_delivery_date"), // Optional future delivery
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLegacyMessageSchema = createInsertSchema(legacyMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deliveredAt: true,
});

// ============ Security Monitoring Tables ============
export const securityEventTypeEnum = pgEnum("security_event_type", [
  "suspicious_login",
  "unusual_activity",
  "failed_authentication",
  "biometric_mismatch",
  "ip_address_change",
  "device_change",
  "location_change",
]);

export const securityEventSeverityEnum = pgEnum("security_event_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const aiRiskEvents = pgTable("ai_risk_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  vaultId: varchar("vault_id")
    .references(() => vaults.id, { onDelete: "set null" }),
  eventType: securityEventTypeEnum("event_type").notNull(),
  severity: securityEventSeverityEnum("severity").notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON string of additional data
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  resolved: boolean("resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAiRiskEventSchema = createInsertSchema(aiRiskEvents).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
  resolvedBy: true,
});

// ============ Subscriptions Table ============
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: varchar("plan", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============ Behavioral Biometrics Tables ============
export const biometricDataTypeEnum = pgEnum("biometric_data_type", [
  "typing_pattern",
  "mouse_movement",
  "interaction_signature",
  "device_fingerprint",
]);

export const behavioralBiometrics = pgTable("behavioral_biometrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dataType: biometricDataTypeEnum("data_type").notNull(),
  signature: text("signature").notNull(), // Encrypted behavioral signature
  confidence: varchar("confidence", { length: 5 }), // DECIMAL(3,2) as string - 0.00 to 1.00
  metadata: text("metadata"), // JSON string of additional data
  deviceId: text("device_id"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBehavioralBiometricSchema = createInsertSchema(behavioralBiometrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============ Smart Contract Integration Tables ============
export const contractDeploymentStatusEnum = pgEnum("contract_deployment_status", [
  "pending",
  "deployed",
  "failed",
  "rejected",
]);

export const vaultSmartContracts = pgTable("vault_smart_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vaultId: varchar("vault_id")
    .notNull()
    .references(() => vaults.id, { onDelete: "cascade" }),
  contractAddress: text("contract_address").unique(),
  network: text("network").notNull().default("ethereum"), // ethereum, polygon, etc.
  deploymentTxHash: text("deployment_tx_hash"),
  deploymentStatus: contractDeploymentStatusEnum("deployment_status").notNull().default("pending"),
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVaultSmartContractSchema = createInsertSchema(vaultSmartContracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deployedAt: true,
});

// Type exports for new tables
export type LegacyMessage = typeof legacyMessages.$inferSelect;
export type InsertLegacyMessage = z.infer<typeof insertLegacyMessageSchema>;

export type AiRiskEvent = typeof aiRiskEvents.$inferSelect;
export type InsertAiRiskEvent = z.infer<typeof insertAiRiskEventSchema>;

export type BehavioralBiometric = typeof behavioralBiometrics.$inferSelect;
export type InsertBehavioralBiometric = z.infer<typeof insertBehavioralBiometricSchema>;

export type VaultSmartContract = typeof vaultSmartContracts.$inferSelect;
export type InsertVaultSmartContract = z.infer<typeof insertVaultSmartContractSchema>;

// ============ Multi-Sig Recovery Tables ============
export const recoveryStatusEnum = pgEnum("recovery_status", [
  "active",
  "triggered",
  "completed",
  "cancelled",
]);

export const recoveries = pgTable("recoveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  contractRecoveryId: integer("contract_recovery_id"), // Recovery ID from MultiSigRecovery contract
  walletAddress: text("wallet_address").notNull(),
  encryptedData: text("encrypted_data").notNull(), // Encrypted seed phrase
  status: recoveryStatusEnum("status").notNull().default("active"),
  initiationTxHash: text("initiation_tx_hash"),
  completionTxHash: text("completion_tx_hash"),
  feeAmount: varchar("fee_amount", { length: 50 }), // Fee collected for recovery (in wei)
  triggeredAt: timestamp("triggered_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const recoveryKeys = pgTable("recovery_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recoveryId: varchar("recovery_id")
    .notNull()
    .references(() => recoveries.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name").notNull(),
  walletAddress: text("wallet_address"), // Wallet address for recovery key (generated if needed)
  inviteToken: text("invite_token").notNull().unique(),
  inviteExpiresAt: timestamp("invite_expires_at").notNull(),
  hasAttested: boolean("has_attested").default(false),
  signature: text("signature"), // Guardian's attestation signature
  txHash: text("tx_hash"), // Transaction hash of on-chain attestation
  attestedAt: timestamp("attested_at"),
  updatedAt: timestamp("updated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRecoverySchema = createInsertSchema(recoveries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  triggeredAt: true,
  completedAt: true,
  status: true,
});

export const insertRecoveryKeySchema = createInsertSchema(recoveryKeys).omit({
  id: true,
  createdAt: true,
  attestedAt: true,
  hasAttested: true,
});

export type Recovery = typeof recoveries.$inferSelect;
export type InsertRecovery = z.infer<typeof insertRecoverySchema>;

export type RecoveryKey = typeof recoveryKeys.$inferSelect;
export type InsertRecoveryKey = z.infer<typeof insertRecoveryKeySchema>;

// ============ WebAuthn Credentials Table ============
export const webauthnCredentials = pgTable("webauthn_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  credentialId: text("credential_id").notNull().unique(), // Base64 URL-safe credential ID
  publicKey: text("public_key").notNull(), // JSON stringified public key
  counter: integer("counter").notNull().default(0),
  deviceType: text("device_type"), // "singleDevice" | "multiDevice" | "hardware"
  deviceName: text("device_name"), // User-friendly name (e.g., "iPhone 14", "YubiKey 5")
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWebAuthnCredentialSchema = createInsertSchema(webauthnCredentials).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
  counter: true,
});

// ============ TOTP Secrets Table ============
export const totpSecrets = pgTable("totp_secrets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(), // One TOTP secret per user
  secret: text("secret").notNull(), // Encrypted TOTP secret
  enabled: boolean("enabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
});

export const insertTotpSecretSchema = createInsertSchema(totpSecrets).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
  enabled: true,
});

export type WebAuthnCredential = typeof webauthnCredentials.$inferSelect;
export type InsertWebAuthnCredential = z.infer<typeof insertWebAuthnCredentialSchema>;

export type TotpSecret = typeof totpSecrets.$inferSelect;
export type InsertTotpSecret = z.infer<typeof insertTotpSecretSchema>;

// ============ DAO Verifiers Table ============
export const daoVerifiers = pgTable("dao_verifiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  verifierAddress: text("verifier_address").notNull().unique(),
  stakeAmount: text("stake_amount").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active' | 'inactive'
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
  deregisteredAt: timestamp("deregistered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDaoVerifierSchema = createInsertSchema(daoVerifiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  registeredAt: true,
  deregisteredAt: true,
});

export type DaoVerifier = typeof daoVerifiers.$inferSelect;
export type InsertDaoVerifier = z.infer<typeof insertDaoVerifierSchema>;

// ============ Guardian Referral Discounts Table ============
export const guardianReferralDiscounts = pgTable("guardian_referral_discounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partyId: varchar("party_id")
    .notNull()
    .references(() => parties.id, { onDelete: "cascade" }),
  vaultId: varchar("vault_id")
    .notNull()
    .references(() => vaults.id, { onDelete: "cascade" }),
  guardianEmail: text("guardian_email").notNull(),
  discountCode: varchar("discount_code", { length: 50 }).notNull().unique(),
  discountPercentage: integer("discount_percentage").notNull().default(50), // 50% off
  used: boolean("used").default(false),
  usedByUserId: varchar("used_by_user_id")
    .references(() => users.id, { onDelete: "set null" }),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGuardianReferralDiscountSchema = createInsertSchema(guardianReferralDiscounts).omit({
  id: true,
  createdAt: true,
  discountCode: true, // Generated automatically
  used: true,
  usedByUserId: true,
  usedAt: true,
});

export type GuardianReferralDiscount = typeof guardianReferralDiscounts.$inferSelect;
export type InsertGuardianReferralDiscount = z.infer<typeof insertGuardianReferralDiscountSchema>;

// ============ Smart Will Builder Tables ============
export const willStatusEnum = pgEnum("will_status", [
  "draft",
  "active",
  "triggered",
  "executed",
  "cancelled",
]);

export const willGuardianTypeEnum = pgEnum("will_guardian_type", [
  "email",
  "wallet",
]);

export const willTriggerTypeEnum = pgEnum("will_trigger_type", [
  "time_lock",
  "death_oracle",
  "multisig_recovery",
  "manual",
]);

export const wills = pgTable("wills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  contractAddress: text("contract_address"),
  contractWillId: integer("contract_will_id"),
  pdfS3Key: text("pdf_s3_key"),
  metadataHash: text("metadata_hash"),
  status: willStatusEnum("status").notNull().default("draft"),
  deploymentTxHash: text("deployment_tx_hash"),
  isDeployed: boolean("is_deployed").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  finalizedAt: timestamp("finalized_at"),
  triggeredAt: timestamp("triggered_at"),
  executedAt: timestamp("executed_at"),
});

export const willBeneficiaries = pgTable("will_beneficiaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  willId: varchar("will_id")
    .notNull()
    .references(() => wills.id, { onDelete: "cascade" }),
  address: text("address").notNull(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  percent: integer("percent").notNull(),
  tokenAddress: text("token_address"),
  isNftOnly: boolean("is_nft_only").default(false),
  isCharityDao: boolean("is_charity_dao").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const willGuardians = pgTable("will_guardians", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  willId: varchar("will_id")
    .notNull()
    .references(() => wills.id, { onDelete: "cascade" }),
  guardianType: willGuardianTypeEnum("guardian_type").notNull(),
  identifier: text("identifier").notNull(), // Email or wallet address
  walletAddress: text("wallet_address"),
  verified: boolean("verified").default(false),
  verificationToken: text("verification_token"),
  verificationExpiresAt: timestamp("verification_expires_at"),
  verifiedAt: timestamp("verified_at"),
  publicKey: text("public_key"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const willTriggers = pgTable("will_triggers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  willId: varchar("will_id")
    .notNull()
    .references(() => wills.id, { onDelete: "cascade" }),
  triggerType: willTriggerTypeEnum("trigger_type").notNull(),
  checkInIntervalDays: integer("check_in_interval_days"),
  gracePeriodDays: integer("grace_period_days"),
  lastCheckInAt: timestamp("last_check_in_at"),
  nextCheckInDue: timestamp("next_check_in_due"),
  deathOracleAddress: text("death_oracle_address"),
  requiredConfidenceScore: varchar("required_confidence_score", { length: 5 }), // DECIMAL(3,2) as string
  recoveryContractAddress: text("recovery_contract_address"),
  recoveryKeys: text("recovery_keys"), // JSONB stored as text
  threshold: integer("threshold"),
  executorAddress: text("executor_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const willAssetAllowances = pgTable("will_asset_allowances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  willId: varchar("will_id")
    .notNull()
    .references(() => wills.id, { onDelete: "cascade" }),
  tokenAddress: text("token_address").notNull(),
  tokenSymbol: text("token_symbol"),
  tokenName: text("token_name"),
  spenderAddress: text("spender_address").notNull(),
  allowanceAmount: text("allowance_amount"),
  network: varchar("network", { length: 20 }).default("ethereum"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const willWizardState = pgTable("will_wizard_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  willId: varchar("will_id")
    .references(() => wills.id, { onDelete: "cascade" }),
  encryptedState: text("encrypted_state").notNull(),
  currentStep: integer("current_step").default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const willExecutionEvents = pgTable("will_execution_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  willId: varchar("will_id")
    .notNull()
    .references(() => wills.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 30 }).notNull(),
  transactionHash: text("transaction_hash"),
  blockNumber: text("block_number"), // BigInt stored as text
  eventData: text("event_data"), // JSONB stored as text
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWillSchema = createInsertSchema(wills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  finalizedAt: true,
  triggeredAt: true,
  executedAt: true,
});

export const insertWillBeneficiarySchema = createInsertSchema(willBeneficiaries).omit({
  id: true,
  createdAt: true,
});

export const insertWillGuardianSchema = createInsertSchema(willGuardians).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

export const insertWillTriggerSchema = createInsertSchema(willTriggers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWillAssetAllowanceSchema = createInsertSchema(willAssetAllowances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWillWizardStateSchema = createInsertSchema(willWizardState).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWillExecutionEventSchema = createInsertSchema(willExecutionEvents).omit({
  id: true,
  createdAt: true,
});

export type Will = typeof wills.$inferSelect;
export type InsertWill = z.infer<typeof insertWillSchema>;
export type WillBeneficiary = typeof willBeneficiaries.$inferSelect;
export type InsertWillBeneficiary = z.infer<typeof insertWillBeneficiarySchema>;
export type WillGuardian = typeof willGuardians.$inferSelect;
export type InsertWillGuardian = z.infer<typeof insertWillGuardianSchema>;
export type WillTrigger = typeof willTriggers.$inferSelect;
export type InsertWillTrigger = z.infer<typeof insertWillTriggerSchema>;
export type WillAssetAllowance = typeof willAssetAllowances.$inferSelect;

// Hardware device status enum
export const hardwareDeviceStatusEnum = pgEnum("hardware_device_status", [
  "active",
  "offline",
  "suspended",
  "lost",
]);

// Hardware devices table
export const hardwareDevices = pgTable("hardware_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  deviceId: varchar("device_id", { length: 255 }).notNull().unique(),
  deviceName: text("device_name"),
  publicKey: text("public_key").notNull(), // Public key for signature verification (PEM format)
  lastPing: timestamp("last_ping"),
  status: hardwareDeviceStatusEnum("status").notNull().default("active"),
  alertThresholdMinutes: integer("alert_threshold_minutes").default(1440), // 24 hours default
  lastAlertSent: timestamp("last_alert_sent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Hardware ping logs table
export const hardwarePingLogs = pgTable("hardware_ping_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id", { length: 255 })
    .notNull()
    .references(() => hardwareDevices.deviceId, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  signatureValid: boolean("signature_valid").notNull(),
  responseTimeMs: integer("response_time_ms"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// ============ Admin Audit Log Table ============
export const adminAuditLog = pgTable("admin_audit_log", {
  id: integer("id").primaryKey(),
  userId: varchar("user_id")
    .references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  requestData: text("request_data"), // JSONB stored as text
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLog).omit({
  id: true,
  timestamp: true,
});

export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;

export type HardwareDevice = typeof hardwareDevices.$inferSelect;
export type InsertHardwareDevice = typeof hardwareDevices.$inferInsert;
export type HardwarePingLog = typeof hardwarePingLogs.$inferSelect;
export type InsertHardwarePingLog = typeof hardwarePingLogs.$inferInsert;
export type InsertWillAssetAllowance = z.infer<typeof insertWillAssetAllowanceSchema>;
export type WillWizardState = typeof willWizardState.$inferSelect;
export type InsertWillWizardState = z.infer<typeof insertWillWizardStateSchema>;
export type WillExecutionEvent = typeof willExecutionEvents.$inferSelect;
export type InsertWillExecutionEvent = z.infer<typeof insertWillExecutionEventSchema>;

// ============ Optimization History Tables ============
// Track yield optimization recommendations and applications
export const optimizationHistory = pgTable("optimization_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  vaultId: varchar("vault_id")
    .references(() => vaults.id, { onDelete: "set null" }),
  oldAllocation: text("old_allocation").notNull(), // JSONB as text
  newAllocation: text("new_allocation").notNull(), // JSONB as text
  reason: text("reason"),
  estimatedApyGain: varchar("estimated_apy_gain", { length: 10 }), // Numeric as string
  status: varchar("status", { length: 20 }).default("pending"), // pending, applied, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
  appliedAt: timestamp("applied_at"),
});

// ============ Party History Tables ============
// Track all events and changes related to guardians, beneficiaries, and parties
export const partyHistory = pgTable("party_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 50 }).notNull(), // vault_created, guardian_added, recovery_initiated, etc.
  eventData: text("event_data").notNull(), // JSONB as text
  metadata: text("metadata"), // JSONB as text - optional
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// ============ Protocol Cache Tables ============
// Cache DeFi protocol data to reduce API calls
export const protocolCache = pgTable("protocol_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  protocol: varchar("protocol", { length: 50 }).notNull(), // aave, compound, yearn, curve
  dataType: varchar("data_type", { length: 50 }).notNull(), // apy, tvl, health
  asset: varchar("asset", { length: 20 }), // ETH, USDC, etc.
  data: text("data").notNull(), // JSONB as text
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============ Death Certificates Tables ============
// Store death certificate documents with IPFS hashes
export const deathCertificates = pgTable("death_certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ipfsHash: text("ipfs_hash").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"),
  verificationStatus: varchar("verification_status", { length: 20 }).default("pending"), // pending, verified, rejected
});

// ============ System Configuration Tables ============
// Store system-wide configuration settings
export const systemConfig = pgTable("system_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: varchar("updated_by")
    .references(() => users.id, { onDelete: "set null" }),
});

// Insert schemas
export const insertOptimizationHistorySchema = createInsertSchema(optimizationHistory).omit({
  id: true,
  createdAt: true,
  appliedAt: true,
});

export const insertPartyHistorySchema = createInsertSchema(partyHistory).omit({
  id: true,
  timestamp: true,
});

export const insertProtocolCacheSchema = createInsertSchema(protocolCache).omit({
  id: true,
  createdAt: true,
});

export const insertDeathCertificateSchema = createInsertSchema(deathCertificates).omit({
  id: true,
  uploadedAt: true,
  verifiedAt: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  updatedAt: true,
});

// Type exports
export type OptimizationHistory = typeof optimizationHistory.$inferSelect;
export type InsertOptimizationHistory = z.infer<typeof insertOptimizationHistorySchema>;

export type PartyHistory = typeof partyHistory.$inferSelect;
export type InsertPartyHistory = z.infer<typeof insertPartyHistorySchema>;

export type ProtocolCache = typeof protocolCache.$inferSelect;
export type InsertProtocolCache = z.infer<typeof insertProtocolCacheSchema>;

export type DeathCertificate = typeof deathCertificates.$inferSelect;
export type InsertDeathCertificate = z.infer<typeof insertDeathCertificateSchema>;

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;