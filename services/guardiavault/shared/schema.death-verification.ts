/**
 * Death Verification Schema Extensions
 * Additional tables for SSDI, obituary, and death certificate verification
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  pgEnum,
  decimal,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Death verification status enum
export const deathVerificationStatusEnum = pgEnum("death_verification_status", [
  "pending",
  "confirmed",
  "rejected",
  "disputed",
  "needs_confirmation",
] as const);

// Death verification source enum
export const deathVerificationSourceEnum = pgEnum("death_verification_source", [
  "ssdi",
  "obituary",
  "death_certificate",
  "death_certificate_official",
  "insurance_claim",
  "hospital_ehr",
  "funeral_home",
] as const);

// Users table extensions (death monitoring fields)
// These would be added via migration:
// ALTER TABLE users ADD COLUMN ssn_hash VARCHAR(64);
// ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
// ALTER TABLE users ADD COLUMN date_of_birth DATE;
// ALTER TABLE users ADD COLUMN last_known_location VARCHAR(255);
// ALTER TABLE users ADD COLUMN death_monitoring_enabled BOOLEAN DEFAULT false;
// ALTER TABLE users ADD COLUMN verification_tier INTEGER DEFAULT 1;
// ALTER TABLE users ADD COLUMN last_ssdi_check TIMESTAMP;
// ALTER TABLE users ADD COLUMN ssdi_consent_given BOOLEAN DEFAULT false;
// ALTER TABLE users ADD COLUMN ssdi_consent_date TIMESTAMP;
// ALTER TABLE users ADD COLUMN ssdi_consent_ip_address INET;
// ALTER TABLE users ADD COLUMN death_verified_at TIMESTAMP;
// ALTER TABLE users ADD COLUMN death_confidence_score DECIMAL(3,2);
// ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'; -- 'active' | 'deceased' | 'verification_pending'

// Death verification events table
export const deathVerificationEvents = pgTable("death_verification_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  source: deathVerificationSourceEnum("source").notNull(),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }), // 0.00 to 1.00
  verificationData: jsonb("verification_data"), // Flexible storage for source-specific data
  verifiedAt: timestamp("verified_at").notNull().defaultNow(),
  verifiedBy: varchar("verified_by", { length: 100 }), // API, human, oracle, etc.

  // Death Details
  reportedDeathDate: timestamp("reported_death_date"),
  reportedLocation: varchar("reported_location", { length: 255 }),
  deathCertificateUrl: text("death_certificate_url"),

  // Verification Status
  status: deathVerificationStatusEnum("status").notNull().default("pending"),
  requiresReview: boolean("requires_review").default(false),
});

// SSDI check history table
export const ssdiCheckLog = pgTable("ssdi_check_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  checkDate: timestamp("check_date").notNull().defaultNow(),
  ssdiProvider: varchar("ssdi_provider", { length: 50 }),
  matchFound: boolean("match_found"),
  matchData: jsonb("match_data"),
  apiResponseTimeMs: integer("api_response_time_ms"),
});

// Death certificate orders table
export const deathCertificateOrders = pgTable("death_certificate_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  orderId: varchar("order_id", { length: 100 }).notNull().unique(),
  vendor: varchar("vendor", { length: 50 }), // 'VitalChek', 'StateAPI', etc.
  state: varchar("state", { length: 2 }), // US state code
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'processing', 'completed', 'failed'
  estimatedDelivery: timestamp("estimated_delivery"),
  deliveredAt: timestamp("delivered_at"),
  certificateUrl: text("certificate_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Consent log table (audit trail)
export const consentLog = pgTable("consent_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  consentType: varchar("consent_type", { length: 50 }).notNull(), // 'death_monitoring'
  granted: boolean("granted").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Proof of life challenges table
export const proofOfLifeChallenges = pgTable("proof_of_life_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  challengeCode: varchar("challenge_code", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  completedAt: timestamp("completed_at"),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertDeathVerificationEventSchema = createInsertSchema(deathVerificationEvents).omit({
  id: true,
  verifiedAt: true,
});

export const insertSsdiCheckLogSchema = createInsertSchema(ssdiCheckLog).omit({
  id: true,
  checkDate: true,
});

export const insertDeathCertificateOrderSchema = createInsertSchema(deathCertificateOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConsentLogSchema = createInsertSchema(consentLog).omit({
  id: true,
  createdAt: true,
});

export const insertProofOfLifeChallengeSchema = createInsertSchema(proofOfLifeChallenges).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type DeathVerificationEvent = typeof deathVerificationEvents.$inferSelect;
export type InsertDeathVerificationEvent = z.infer<typeof insertDeathVerificationEventSchema>;

export type SsdiCheckLog = typeof ssdiCheckLog.$inferSelect;
export type InsertSsdiCheckLog = z.infer<typeof insertSsdiCheckLogSchema>;

export type DeathCertificateOrder = typeof deathCertificateOrders.$inferSelect;
export type InsertDeathCertificateOrder = z.infer<typeof insertDeathCertificateOrderSchema>;

export type ConsentLog = typeof consentLog.$inferSelect;
export type InsertConsentLog = z.infer<typeof insertConsentLogSchema>;

export type ProofOfLifeChallenge = typeof proofOfLifeChallenges.$inferSelect;
export type InsertProofOfLifeChallenge = z.infer<typeof insertProofOfLifeChallengeSchema>;

