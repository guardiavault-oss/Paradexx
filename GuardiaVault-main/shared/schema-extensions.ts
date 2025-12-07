/**
 * Extended Schema for Production Features
 * Referrals, Analytics, Achievements, Protocol Health
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  numeric,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, vaults, yieldVaults } from "./schema";

// Referral Program
export const referralCodes = pgTable("referral_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 20 }).notNull().unique(),
  stripeCouponId: varchar("stripe_coupon_id"), // Stripe coupon for referral rewards
  totalReferrals: integer("total_referrals").default(0),
  totalEarnings: numeric("total_earnings", { precision: 20, scale: 8 }).default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  referredId: varchar("referred_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  referralCodeId: varchar("referral_code_id")
    .notNull()
    .references(() => referralCodes.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).default("pending"), // pending, completed, rewarded
  signupAt: timestamp("signup_at").notNull().defaultNow(),
  firstDepositAt: timestamp("first_deposit_at"),
  rewardAmount: numeric("reward_amount", { precision: 20, scale: 8 }),
  stripePayoutId: varchar("stripe_payout_id"), // Stripe payout transaction ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Yield Analytics & Historical Tracking
export const yieldAnalytics = pgTable("yield_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  yieldVaultId: varchar("yield_vault_id")
    .references(() => yieldVaults.id, { onDelete: "cascade" }),
  protocol: varchar("protocol", { length: 20 }).notNull(),
  asset: varchar("asset", { length: 10 }).notNull(),
  principal: numeric("principal", { precision: 20, scale: 8 }).notNull(),
  currentValue: numeric("current_value", { precision: 20, scale: 8 }).notNull(),
  yieldEarned: numeric("yield_earned", { precision: 20, scale: 8 }).notNull(),
  apy: numeric("apy", { precision: 10, scale: 4 }).notNull(), // Real APY at time of snapshot
  apySource: varchar("apy_source", { length: 20 }).default("api"), // api, contract, fallback
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Protocol Health Monitoring
export const protocolHealth = pgTable("protocol_health", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  protocol: varchar("protocol", { length: 20 }).notNull(), // lido, aave, compound, etc.
  status: varchar("status", { length: 20 }).notNull().default("healthy"), // healthy, degraded, down
  apy: numeric("apy", { precision: 10, scale: 4 }),
  tvl: numeric("tvl", { precision: 30, scale: 2 }), // Total Value Locked
  lastChecked: timestamp("last_checked").notNull().defaultNow(),
  healthData: jsonb("health_data"), // Additional protocol-specific data
  alerts: jsonb("alerts"), // Array of alert messages
});

// User Achievements
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  achievementType: varchar("achievement_type", { length: 50 }).notNull(), // first_deposit, yield_milestone, referral_goal, etc.
  achievementData: jsonb("achievement_data"), // Achievement-specific metadata
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
  rewardAmount: numeric("reward_amount", { precision: 20, scale: 8 }),
});

// Yield Challenges
export const yieldChallenges = pgTable("yield_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  apyBonus: numeric("apy_bonus", { precision: 10, scale: 4 }), // Additional APY percentage
  rewardPool: numeric("reward_pool", { precision: 20, scale: 8 }), // Total reward pool
  status: varchar("status", { length: 20 }).default("upcoming"), // upcoming, active, completed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userChallengeParticipation = pgTable("user_challenge_participation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  challengeId: varchar("challenge_id")
    .notNull()
    .references(() => yieldChallenges.id, { onDelete: "cascade" }),
  currentEarnings: numeric("current_earnings", { precision: 20, scale: 8 }).default("0"),
  rank: integer("rank"),
  rewardEarned: numeric("reward_earned", { precision: 20, scale: 8 }),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

// DCA (Dollar Cost Averaging) Schedules
export const dcaSchedules = pgTable("dca_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  vaultId: varchar("vault_id")
    .notNull()
    .references(() => vaults.id, { onDelete: "cascade" }),
  stripeSubscriptionId: varchar("stripe_subscription_id"), // Stripe subscription for recurring payments
  amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
  frequency: varchar("frequency", { length: 20 }).notNull(), // daily, weekly, monthly
  asset: varchar("asset", { length: 10 }).notNull(),
  protocol: varchar("protocol", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("active"), // active, paused, cancelled
  nextExecutionAt: timestamp("next_execution_at"),
  totalExecutions: integer("total_executions").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Education Articles (CMS)
export const educationArticles = pgTable("education_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  emoji: varchar("emoji", { length: 10 }),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  category: varchar("category", { length: 50 }),
  readTime: integer("read_time"), // minutes
  published: boolean("published").default(false),
  publishedAt: timestamp("published_at"),
  authorId: varchar("author_id")
    .references(() => users.id, { onDelete: "set null" }),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// User Article Progress
export const userArticleProgress = pgTable("user_article_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  articleId: varchar("article_id")
    .notNull()
    .references(() => educationArticles.id, { onDelete: "cascade" }),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  readProgress: integer("read_progress").default(0), // 0-100
  lastReadAt: timestamp("last_read_at"),
});

// Zod Schemas
export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({
  id: true,
  createdAt: true,
  totalReferrals: true,
  totalEarnings: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});

export const insertYieldAnalyticsSchema = createInsertSchema(yieldAnalytics).omit({
  id: true,
  timestamp: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertDCAScheduleSchema = createInsertSchema(dcaSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalExecutions: true,
});

export const insertEducationArticleSchema = createInsertSchema(educationArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
});

// Types
export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type YieldAnalytic = typeof yieldAnalytics.$inferSelect;
export type InsertYieldAnalytic = z.infer<typeof insertYieldAnalyticsSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type DCASchedule = typeof dcaSchedules.$inferSelect;
export type InsertDCASchedule = z.infer<typeof insertDCAScheduleSchema>;
export type EducationArticle = typeof educationArticles.$inferSelect;
export type InsertEducationArticle = z.infer<typeof insertEducationArticleSchema>;

