/**
 * Create Demo Account Script
 * 
 * Creates a demo account with:
 * - Email: demo@guardiavault.com
 * - Password: Demo123!@#
 * - Active subscription (if database available)
 * - Sample vault (optional)
 * 
 * Usage: npx tsx server/scripts/create-demo-account.ts
 */

import bcrypt from "bcrypt";
import { db, waitForDatabase } from "../db";
import { users, subscriptions, vaults } from "@shared/schema";
import { eq } from "../utils/drizzle-exports";
import { randomUUID } from "crypto";
import { storage } from "../storage";
import { insertVaultSchema } from "@shared/schema";

const DEMO_EMAIL = "demo@guardiavault.com";
const DEMO_PASSWORD = "Demo123!@#";

async function createDemoAccount() {
  console.log("🚀 Starting demo account creation...");
  
  // Wait for database connection
  const dbReady = await waitForDatabase(10000);
  const useDatabase = !!db && dbReady;

  try {
    // Check if demo user already exists
    const existingUser = await storage.getUserByEmail(DEMO_EMAIL);
    
    if (existingUser) {
      console.log("✅ Demo account already exists:", DEMO_EMAIL);
      
      // Check for subscription (database only)
      if (useDatabase) {
        const existingSubscriptions = await db!
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, existingUser.id));
        
        if (existingSubscriptions.length === 0) {
          console.log("📦 Creating subscription...");
          await createSubscription(existingUser.id);
        } else {
          console.log("✅ Subscription already exists");
        }
      } else {
        console.log("⚠️  Database not available - subscription will not be created");
        console.log("   (User can still log in and use the app with in-memory storage)");
      }
      
      console.log("\n📋 Demo Account Credentials:");
      console.log("   Email:", DEMO_EMAIL);
      console.log("   Password:", DEMO_PASSWORD);
      console.log("\n✅ Demo account is ready!");
      return;
    }

    // Hash password
    console.log("🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

    // Create user using storage abstraction
    console.log("👤 Creating user...");
    const newUser = await storage.createUser({
      email: DEMO_EMAIL,
      password: hashedPassword,
    });

    console.log("✅ User created:", newUser.id);

    // Create subscription (database only)
    if (useDatabase) {
      console.log("📦 Creating subscription...");
      await createSubscription(newUser.id);
    } else {
      console.log("⚠️  Database not available - skipping subscription creation");
    }

    // Create a sample vault
    console.log("🏦 Creating sample vault...");
    const nextCheckIn = new Date();
    nextCheckIn.setDate(nextCheckIn.getDate() + 90); // 90 days from now

    const vaultData = {
      ownerId: newUser.id,
      name: "Demo Vault",
      checkInIntervalDays: 90,
      gracePeriodDays: 14,
    };

    const vault = await storage.createVault(vaultData);

    if (vault) {
      console.log("✅ Sample vault created:", vault.id);
    }

    console.log("\n📋 Demo Account Credentials:");
    console.log("   Email:", DEMO_EMAIL);
    console.log("   Password:", DEMO_PASSWORD);
    console.log("\n✅ Demo account created successfully!");
    
  } catch (error: any) {
    console.error("❌ Error creating demo account:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });
    process.exit(1);
  }
}

async function createSubscription(userId: string) {
  if (!db) {
    console.warn("⚠️  Database not available - cannot create subscription");
    return;
  }

  const now = new Date();
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  await db.insert(subscriptions).values({
    id: randomUUID(),
    userId,
    plan: "Pro/Investor Plan",
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: oneYearLater,
    cancelAtPeriodEnd: false,
    stripeSubscriptionId: `demo_sub_${randomUUID()}`,
    stripeCustomerId: `demo_cust_${randomUUID()}`,
    createdAt: now,
    updatedAt: now,
  });
}

// Run the script
createDemoAccount()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

