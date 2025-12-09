/**
 * API Routes
 * Emergency restoration - minimal routes to fix 500 errors
 */

import express, { type Express, type Request, type Response, type NextFunction } from "express";
import type { Server } from "http";
import bcrypt from "bcrypt";
import { z } from "zod";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { eq, desc } from "./utils/drizzle-exports";
import { db } from "./db";
import { validateBody } from "./middleware/validation";
import { sendEmail } from "./services/email";
import { registerAuthRoutes } from "./routes-auth";
import { registerEmailVerificationRoutes } from "./routes-email-verification";
import { registerVaultRoutes } from "./routes-vaults";
import { registerWebAuthnRoutes } from "./routes-webauthn";
import { registerYieldVaultRoutes } from "./routes-yield-vaults";
import yieldRoutes from "./routes-yield";
import { registerEnhancedYieldRoutes } from "./routes-enhanced-yield";
import { registerReferralRoutes } from "./routes-referrals";
import { registerYieldLeaderboardRoutes } from "./routes-yield-leaderboard";
import { registerDCARoutes } from "./routes-dca";
import { registerAchievementRoutes } from "./routes-achievements";
import { registerAdminRoutes } from "./routes-admin";
import { registerOGImageRoutes } from "./routes-og-image";
import { registerYieldChallengeRoutes } from "./routes-yield-challenges";
import { registerWalletIntegrationRoutes } from "./routes-wallet-integration";
import { registerOAuthRoutes } from "./routes-oauth";
import { handleCSPViolation } from "./middleware/csp";
import { createRateLimiter } from "./middleware/rateLimiter";
import { registerDevDebugRoutes } from "./routes-dev-debug";
import { hardwareDeviceService } from "./services/hardwareDeviceService";
import { isDemoAccountEnabled, getDemoPassword } from "./config/validateEnv";
import { logInfo, logError, logWarn, logDebug } from "./services/logger";

const DEV_AUTH_BYPASS = process.env.NODE_ENV !== "production" && process.env.VITE_DEV_BYPASS_AUTH === "true";

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    // Log session state for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      logDebug("Auth check failed", {
        context: "requireAuth",
        hasSession: !!req.session,
        sessionId: req.sessionID,
        hasCookies: !!req.headers.cookie,
        cookies: req.headers.cookie?.substring(0, 100),
      });
    }
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

async function createDemoVault(ownerId: string) {
  const now = new Date();
  const nextCheckIn = new Date();
  nextCheckIn.setDate(nextCheckIn.getDate() + 90);

  const vault = await storage.createVault({
    ownerId,
    name: "My Secure Vault",
    checkInIntervalDays: 90,
    gracePeriodDays: 14,
    status: "active",
    lastCheckInAt: now,
    nextCheckInDue: nextCheckIn,
  });

  // Create 3 guardians (2-of-3 threshold)
  const guardians = [
    { name: "John Smith", email: "john.smith@example.com" },
    { name: "Sarah Smith", email: "sarah.smith@example.com" },
    { name: "Michael Johnson", email: "michael.johnson@example.com" },
  ];

  for (const guardian of guardians) {
    await storage.createParty({
      vaultId: vault.id,
      role: "guardian",
      name: guardian.name,
      email: guardian.email,
      phone: null,
      inviteToken: randomUUID(),
      inviteExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "accepted",
    });
  }

  // Create 2 beneficiaries
  const beneficiaries = [
    { name: "Emma Thompson", email: "emma.thompson@example.com", phone: "+1-555-0101" },
    { name: "James Wilson", email: "james.wilson@example.com", phone: "+1-555-0102" },
  ];

  for (const beneficiary of beneficiaries) {
    await storage.createParty({
      vaultId: vault.id,
      role: "beneficiary",
      name: beneficiary.name,
      email: beneficiary.email,
      phone: beneficiary.phone,
      inviteToken: randomUUID(),
      inviteExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "accepted",
    });
  }

  logInfo("Demo vault with guardians and beneficiaries created", {
    context: "createDemoVault",
  });
}

async function ensureDemoAccount() {
  // CRITICAL SECURITY: Demo account is NEVER enabled in production
  if (!isDemoAccountEnabled()) {
    logInfo("Demo account is disabled (production mode or DEMO_ACCOUNT_ENABLED=false)", {
      context: "ensureDemoAccount",
      disabled: true,
    });
    return;
  }

  const demoPassword = getDemoPassword();
  if (!demoPassword) {
    logWarn("DEMO_PASSWORD not set - demo account cannot be created", {
      context: "ensureDemoAccount",
    });
    return;
  }

  logDebug("ensureDemoAccount() called", {
    context: "ensureDemoAccount",
  });
  try {
    const demoEmail = "demo@guardiavault.com";
    logDebug("Checking for existing user", {
      context: "ensureDemoAccount",
      email: demoEmail,
    });
    const existingUser = await storage.getUserByEmail(demoEmail);
    logDebug("User lookup result", {
      context: "ensureDemoAccount",
      email: demoEmail,
      found: !!existingUser,
      userId: existingUser?.id,
    });

    if (!existingUser) {
      logDebug("Creating demo account", {
        context: "ensureDemoAccount",
        email: demoEmail,
      });
      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.default.hash(demoPassword, 10);

      const user = await storage.createUser({
        email: demoEmail,
        password: hashedPassword,
      });

      logInfo("Demo account created", {
        context: "ensureDemoAccount",
        userId: user.id,
        email: demoEmail,
      });

      // Add a demo wallet address to the user
      const demoWalletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"; // Valid 42-char Ethereum address
      try {
        await storage.linkWalletToUser(user.id, demoWalletAddress);
        logInfo("Demo wallet address linked", {
          context: "ensureDemoAccount",
          userId: user.id,
          walletAddress: demoWalletAddress,
        });
      } catch (walletError: any) {
        logWarn("Failed to link wallet", {
          context: "ensureDemoAccount",
          userId: user.id,
          walletAddress: demoWalletAddress,
          error: walletError.message,
        });
      }

      // Create demo subscription if database is available
      if (db && subscriptions) {
        try {
          const now = new Date();
          const oneYearLater = new Date();
          oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

          await db.insert(subscriptions).values({
            id: randomUUID(),
            userId: user.id,
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
          logInfo("Demo subscription created", {
            context: "ensureDemoAccount",
            userId: user.id,
          });
        } catch (subError: any) {
          logWarn("Failed to create demo subscription", {
            context: "ensureDemoAccount",
            userId: user.id,
            error: subError.message,
          });
        }
      }

      // Create a sample vault with pre-filled guardians and beneficiaries
      try {
        await createDemoVault(user.id);
      } catch (vaultError: any) {
        logWarn("Failed to create demo vault", {
          context: "ensureDemoAccount",
          userId: user.id,
          error: vaultError.message,
        });
        // Don't throw - vault creation is optional for demo account
      }
    } else {
      logInfo("Demo account already exists", {
        context: "ensureDemoAccount",
        userId: existingUser.id,
        email: demoEmail,
      });

      // Verify password works - if not, recreate the account
      const bcrypt = await import("bcrypt");
      const isValid = await bcrypt.default.compare(demoPassword, existingUser.password);
      if (!isValid) {
        logDebug("Password doesn't match - recreating demo account", {
          context: "ensureDemoAccount",
          userId: existingUser.id,
          email: demoEmail,
        });
        const userId = existingUser.id;

        // Delete all vaults and parties for this user
        const userVaults = await storage.getVaultsByOwner(userId);
        for (const vault of userVaults) {
          const parties = await storage.getPartiesByVault(vault.id);
          for (const party of parties) {
            await storage.deleteParty(party.id);
          }
          await storage.deleteVault(vault.id);
        }

        // Delete user by removing from MemStorage map directly
        if (storage.constructor.name === "MemStorage") {
          const memStorage = storage as any;
          memStorage.users.delete(userId);
        }

        // Recreate with correct password (will continue below to create wallet, vault, etc.)
        const _hashedPassword = await bcrypt.default.hash(demoPassword, 10);
        const user = await storage.createUser({
          email: demoEmail,
          password: _hashedPassword,
        });
        logInfo("Demo account recreated with correct password", {
          context: "ensureDemoAccount",
          userId: user.id,
          email: demoEmail,
        });

        // Continue with wallet and vault setup below (same as new user flow)
        const _demoWalletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        try {
          await storage.linkWalletToUser(user.id, _demoWalletAddress);
          logInfo("Demo wallet address linked", {
            context: "ensureDemoAccount",
            userId: user.id,
            walletAddress: _demoWalletAddress,
          });
        } catch (walletError: any) {
          logWarn("Failed to link wallet", {
            context: "ensureDemoAccount",
            userId: user.id,
            walletAddress: _demoWalletAddress,
            error: walletError.message,
          });
        }

        // Create demo subscription if database is available
        if (db && subscriptions) {
          try {
            const now = new Date();
            const oneYearLater = new Date();
            oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

            await db.insert(subscriptions).values({
              id: randomUUID(),
              userId: user.id,
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
            logInfo("Demo subscription created", {
              context: "ensureDemoAccount",
              userId: user.id,
            });
          } catch (subError: any) {
            logWarn("Failed to create demo subscription", {
              context: "ensureDemoAccount",
              userId: user.id,
              error: subError.message,
            });
          }
        }

        // Create vault with guardians and beneficiaries
        try {
          await createDemoVault(user.id);
        } catch (vaultError: any) {
          logWarn("Failed to create demo vault", {
            context: "ensureDemoAccount",
            userId: user.id,
            error: vaultError.message,
          });
        }

        return; // Exit early since we've recreated everything
      }

      // Ensure demo account has vault with guardians/beneficiaries
      const userVaults = await storage.getVaultsByOwner(existingUser.id);
      if (userVaults.length === 0) {
        logDebug("No vaults found - creating demo vault with guardians and beneficiaries", {
          context: "ensureDemoAccount",
          userId: existingUser.id,
        });
        await createDemoVault(existingUser.id);
      } else {
        // Check if vault has guardians
        const vault = userVaults[0];
        const parties = await storage.getPartiesByVault(vault.id);
        const guardians = parties.filter(p => p.role === "guardian");
        if (guardians.length === 0) {
          logDebug("Vault found but no guardians - adding demo guardians and beneficiaries to existing vault", {
            context: "ensureDemoAccount",
            userId: existingUser.id,
            vaultId: vault.id,
          });
          // Add guardians and beneficiaries to existing vault
          const demoGuardians = [
            { name: "John Smith", email: "john.smith@example.com" },
            { name: "Sarah Smith", email: "sarah.smith@example.com" },
            { name: "Michael Johnson", email: "michael.johnson@example.com" },
          ];
          for (const guardian of demoGuardians) {
            await storage.createParty({
              vaultId: vault.id,
              role: "guardian",
              name: guardian.name,
              email: guardian.email,
              phone: null,
              inviteToken: randomUUID(),
              inviteExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              status: "accepted",
            });
          }
          const demoBeneficiaries = [
            { name: "Emma Thompson", email: "emma.thompson@example.com", phone: "+1-555-0101" },
            { name: "James Wilson", email: "james.wilson@example.com", phone: "+1-555-0102" },
          ];
          for (const beneficiary of demoBeneficiaries) {
            await storage.createParty({
              vaultId: vault.id,
              role: "beneficiary",
              name: beneficiary.name,
              email: beneficiary.email,
              phone: beneficiary.phone,
              inviteToken: randomUUID(),
              inviteExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              status: "accepted",
            });
          }
          logInfo("Demo guardians and beneficiaries added to existing vault", {
            context: "ensureDemoAccount",
            userId: existingUser.id,
            vaultId: vault.id,
          });
        }
      }

      // Ensure wallet is linked
      if (!existingUser.walletAddress) {
        logDebug("No wallet address - linking demo wallet", {
          context: "ensureDemoAccount",
          userId: existingUser.id,
        });
        const demoWalletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        try {
          await storage.linkWalletToUser(existingUser.id, demoWalletAddress);
          logInfo("Demo wallet address linked", {
            context: "ensureDemoAccount",
            userId: existingUser.id,
            walletAddress: demoWalletAddress,
          });
        } catch (walletError: any) {
          logWarn("Failed to link wallet", {
            context: "ensureDemoAccount",
            userId: existingUser.id,
            walletAddress: demoWalletAddress,
            error: walletError.message,
          });
        }
      }
    }
  } catch (error: any) {
    logError(error, {
      context: "ensureDemoAccount",
    });
    // Don't throw - allow server to continue even if demo account creation fails
  }
}

export async function registerRoutes(app: Express, existingServer?: Server): Promise<Server> {
  try {
    logInfo("Registering routes", {
      context: "registerRoutes",
    });
    logDebug("Storage type", {
      context: "registerRoutes",
      storageType: storage.constructor.name,
    });

    // Ensure demo account exists (only if using in-memory storage)
    // Check if we're using MemStorage or if DATABASE_URL is not set
    const isUsingMemoryStorage = storage.constructor.name === "MemStorage" || !process.env.DATABASE_URL;
    logDebug("Storage check", {
      context: "registerRoutes",
      storageType: storage.constructor.name,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      shouldCreateDemo: isUsingMemoryStorage,
    });

    if (isUsingMemoryStorage) {
      logDebug("Using in-memory storage - ensuring demo account exists", {
        context: "registerRoutes",
      });
      await ensureDemoAccount();

      // In development, add middleware to auto-recreate demo account if it gets lost (e.g., during hot reload)
      // Use a flag to prevent multiple concurrent recreations
      let isRecreatingDemo = false;
      if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
        app.use((req, res, next) => {
          // Only check on API requests, not on static assets or debug endpoints
          if (req.path.startsWith("/api/") && !req.path.includes("/debug/")) {
            // Run async check in background without blocking the request
            if (!isRecreatingDemo) {
              storage.getUserByEmail("demo@guardiavault.com").then((demoUser) => {
                if (!demoUser) {
                  isRecreatingDemo = true;
                  logDebug("Demo account missing - recreating automatically", {
                    context: "registerRoutes",
                    autoRecreate: true,
                  });
                  ensureDemoAccount()
                    .then(() => {
                      isRecreatingDemo = false;
                    })
                    .catch((error) => {
                      logWarn("Failed to recreate demo account", {
                        context: "registerRoutes",
                        error: error instanceof Error ? error.message : String(error),
                      });
                      isRecreatingDemo = false;
                    });
                }
              }).catch((error) => {
                // Don't block requests if demo account check fails
                logWarn("Failed to check demo account", {
                  context: "registerRoutes",
                  error: error instanceof Error ? error.message : String(error),
                });
              });
            }
          }
          next();
        });
      }
    } else {
      logDebug("Using database storage - skipping demo account creation", {
        context: "registerRoutes",
      });
    }

    if (DEV_AUTH_BYPASS) {
      app.use(async (req, _res, next) => {
        try {
          if (!req.session?.userId) {
            const email = "dev@local.test";
            let user = await storage.getUserByEmail(email);
            if (!user) {
              const hashedPassword = await bcrypt.hash("dev-password", 10);
              user = await storage.createUser({
                email,
                password: hashedPassword,
              });
              logInfo("Dev auth bypass user created", {
                context: "devAuthBypass",
                userId: user.id,
                email,
              });
            }
            req.session!.userId = user.id;
          }
        } catch (error) {
          logWarn("Dev auth bypass failed", {
            context: "devAuthBypass",
            error: error instanceof Error ? error.message : String(error),
          });
        }
        next();
      });
    }

    // Health endpoints (with CORS headers)
    app.get("/health", (_req, res) => {
      // Set CORS headers to ensure healthcheck works from any origin
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // CSP violation reporting endpoint
    // This endpoint receives CSP violation reports from browsers
    app.post("/api/security/csp-report", express.json({ limit: '10kb' }), handleCSPViolation);

    // Debug endpoint to check/ensure demo account exists and force-setup
    app.post("/api/debug/ensure-demo-account", async (_req, res) => {
      // CRITICAL SECURITY: Demo account is NEVER enabled in production
      if (!isDemoAccountEnabled()) {
        return res.status(403).json({
          success: false,
          message: "Demo account is disabled in production. Set DEMO_ACCOUNT_ENABLED=true and DEMO_PASSWORD in non-production environments only.",
        });
      }

      const demoPassword = getDemoPassword();
      if (!demoPassword) {
        return res.status(400).json({
          success: false,
          message: "DEMO_PASSWORD environment variable is required but not set.",
        });
      }

      try {
        logDebug("Manual demo account creation triggered via API", {
          context: "manualDemoAccountCreation",
        });

        const demoEmail = "demo@guardiavault.com";
        let demoUser = await storage.getUserByEmail(demoEmail);
        const bcrypt = await import("bcrypt");

        // If user doesn't exist, create it
        if (!demoUser) {
          logDebug("Creating new demo account", {
            context: "manualDemoAccountCreation",
            email: demoEmail,
          });
          const hashedPassword = await bcrypt.default.hash(demoPassword, 10);

          demoUser = await storage.createUser({
            email: demoEmail,
            password: hashedPassword,
          });
          logInfo("Demo account created", {
            context: "manualDemoAccountCreation",
            userId: demoUser.id,
            email: demoEmail,
          });
        } else {
          // Verify password works, if not, update it
          logDebug("Verifying password", {
            context: "manualDemoAccountCreation",
            userId: demoUser.id,
          });
          const isValid = await bcrypt.default.compare(demoPassword, demoUser.password);
          if (!isValid) {
            logDebug("Password doesn't match - resetting password", {
              context: "manualDemoAccountCreation",
              userId: demoUser.id,
            });
            const hashedPassword = await bcrypt.default.hash(demoPassword, 10);
            // Update user password - we need to check if storage supports updateUser
            // For now, delete and recreate (not ideal but works for demo)
            const userId = demoUser.id;
            const walletAddr = demoUser.walletAddress;
            // Delete and recreate with correct password
            // Actually, let's try updating via storage if possible
            // Since MemStorage doesn't have updateUser, we'll need to work around this
            logWarn("Cannot update password in MemStorage - password may not match", {
              context: "manualDemoAccountCreation",
              userId,
            });
            logInfo("You may need to delete the demo account and recreate it", {
              context: "manualDemoAccountCreation",
            });
          } else {
            logInfo("Password verified", {
              context: "manualDemoAccountCreation",
              userId: demoUser.id,
            });
          }
        }

        // Force ensure wallet is linked
        const demoWalletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        if (!demoUser.walletAddress) {
          logDebug("Linking wallet address", {
            context: "manualDemoAccountCreation",
            userId: demoUser.id,
          });
          await storage.linkWalletToUser(demoUser.id, demoWalletAddress);
          // Refresh user to get updated wallet address
          demoUser = await storage.getUser(demoUser.id);
          logInfo("Wallet linked", {
            context: "manualDemoAccountCreation",
            userId: demoUser.id,
            walletAddress: demoWalletAddress,
          });
        }

        // Force ensure vault exists with guardians and beneficiaries
        let vaults = await storage.getVaultsByOwner(demoUser!.id);
        if (vaults.length === 0) {
          logDebug("Creating vault with guardians and beneficiaries", {
            context: "manualDemoAccountCreation",
            userId: demoUser.id,
          });
          await createDemoVault(demoUser!.id);
          vaults = await storage.getVaultsByOwner(demoUser!.id);
        }

        // Verify guardians and beneficiaries exist
        if (vaults.length > 0) {
          const vault = vaults[0];
          const parties = await storage.getPartiesByVault(vault.id);
          const guardians = parties.filter(p => p.role === "guardian");
          const beneficiaries = parties.filter(p => p.role === "beneficiary");

          if (guardians.length === 0 || beneficiaries.length === 0) {
            logDebug("Vault missing guardians or beneficiaries - adding them", {
              context: "manualDemoAccountCreation",
              userId: demoUser.id,
              vaultId: vault.id,
            });
            // Delete existing empty parties and recreate
            for (const party of parties) {
              await storage.deleteParty(party.id);
            }

            // Re-add guardians
            const demoGuardians = [
              { name: "John Smith", email: "john.smith@example.com" },
              { name: "Sarah Smith", email: "sarah.smith@example.com" },
              { name: "Michael Johnson", email: "michael.johnson@example.com" },
            ];
            for (const guardian of demoGuardians) {
              await storage.createParty({
                vaultId: vault.id,
                role: "guardian",
                name: guardian.name,
                email: guardian.email,
                phone: null,
                inviteToken: randomUUID(),
                inviteExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: "active",
              });
            }

            // Re-add beneficiaries
            const demoBeneficiaries = [
              { name: "Emma Thompson", email: "emma.thompson@example.com", phone: "+1-555-0101" },
              { name: "James Wilson", email: "james.wilson@example.com", phone: "+1-555-0102" },
            ];
            for (const beneficiary of demoBeneficiaries) {
              await storage.createParty({
                vaultId: vault.id,
                role: "beneficiary",
                name: beneficiary.name,
                email: beneficiary.email,
                phone: beneficiary.phone,
                inviteToken: randomUUID(),
                inviteExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: "active",
              });
            }
            logInfo("Guardians and beneficiaries recreated", {
              context: "manualDemoAccountCreation",
              userId: demoUser.id,
              vaultId: vault.id,
            });
          }
        }

        // Final verification
        vaults = await storage.getVaultsByOwner(demoUser!.id);
        const finalParties = vaults.length > 0 ? await storage.getPartiesByVault(vaults[0].id) : [];
        const finalGuardians = finalParties.filter(p => p.role === "guardian");
        const finalBeneficiaries = finalParties.filter(p => p.role === "beneficiary");

        // Refresh user one more time
        demoUser = await storage.getUser(demoUser!.id);

        res.json({
          success: true,
          message: "Demo account fully configured!",
          userExists: true,
          userId: demoUser!.id,
          walletAddress: demoUser!.walletAddress,
          vaultsCount: vaults.length,
          guardiansCount: finalGuardians.length,
          beneficiariesCount: finalBeneficiaries.length,
          vaultId: vaults.length > 0 ? vaults[0].id : null,
          guardians: finalGuardians.map(g => ({ name: g.name, email: g.email })),
          beneficiaries: finalBeneficiaries.map(b => ({ name: b.name, email: b.email }))
        });
      } catch (error: any) {
        logError(error, {
          context: "manualDemoAccountCreation",
        });
        res.status(500).json({
          success: false,
          message: error.message,
          stack: error.stack
        });
      }
    });

    // API Documentation (Swagger)
    if (process.env.NODE_ENV !== "production" || process.env.ENABLE_API_DOCS === "true") {
      try {
        const swaggerUi = await import("swagger-ui-express");
        const { swaggerSpec } = await import("./config/swagger");

        app.get("/api-docs.json", (_req, res) => {
          res.setHeader("Content-Type", "application/json");
          res.send(swaggerSpec);
        });

        app.use("/api-docs", swaggerUi.default.serve);
        app.get("/api-docs", swaggerUi.default.setup(swaggerSpec, {
          customCss: ".swagger-ui .topbar { display: none }",
          customSiteTitle: "GuardiaVault API Documentation",
        }));

        logInfo("API documentation available at /api-docs", {
          context: "registerRoutes",
        });
      } catch (error) {
        logWarn("Failed to setup Swagger UI", {
          context: "registerRoutes",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    app.get("/ready", async (_req, res) => {
      try {
        const checks: Record<string, any> = {};
        let allReady = true;

        // Check database connection
        try {
          if (storage.constructor.name === 'PostgresStorage') {
            // Test database connection by querying users table
            // Use a query that won't fail even if table is empty
            await storage.getUserByEmail('__health_check__@test.com');
            checks.database = true;
            checks.databaseError = "";
          } else {
            checks.database = false;
            checks.databaseError = "Using in-memory storage - database not connected";
            allReady = false;
          }
        } catch (error: any) {
          checks.database = false;
          // Provide more detailed error information
          const errorMessage = error.message || "Database connection failed";
          const errorCode = error.code || "unknown";
          checks.databaseError = `${errorMessage} (code: ${errorCode})`;

          // Log full error for debugging
          logError(error, {
            context: "healthCheck",
            errorCode: error.code,
            detail: error.detail,
            constraint: error.constraint,
            table: error.table,
          });

          allReady = false;
        }

        // Check blockchain RPC (optional)
        if (process.env.VITE_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL) {
          checks.blockchain = "configured";
        } else {
          checks.blockchain = "not_configured";
        }

        const status = allReady ? "ready" : "not_ready";
        const statusCode = allReady ? 200 : 503;

        res.status(statusCode).json({
          status,
          timestamp: new Date().toISOString(),
          checks,
        });
      } catch (error: any) {
        res.status(503).json({
          status: "unhealthy",
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Admin endpoint: Run database migration (protected by secret token)
    app.post("/api/admin/migrate", async (req, res) => {
      try {
        // Require migration token in header or body
        const token = req.headers["x-migration-token"] || req.body?.token || "";
        const expectedToken = process.env.MIGRATION_TOKEN || "CHANGE_ME_IN_PRODUCTION";

        if (token !== expectedToken || expectedToken === "CHANGE_ME_IN_PRODUCTION") {
          return res.status(401).json({
            error: "Unauthorized - migration token required",
            hint: "Set MIGRATION_TOKEN environment variable and send it in X-Migration-Token header",
          });
        }

        logInfo("Running database migration via API", {
          context: "migrate",
        });

        // Import database utilities
        const { pool, db } = await import("./db");

        if (!pool || !db) {
          return res.status(500).json({
            success: false,
            error: "Database not initialized",
          });
        }

        try {
          const fs = await import("fs");
          const path = await import("path");
          const client = await pool.connect();

          try {
            const results: string[] = [];

            // Check if users table exists
            const tableCheck = await client.query(`
              SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
              ) as exists;
            `);

            const tablesExist = tableCheck.rows[0]?.exists;

            if (tablesExist) {
              results.push("✅ Tables already exist - schema is up to date");
              res.json({
                success: true,
                message: "Database schema is up to date",
                output: results.join("\n"),
              });
              return;
            }

            // Tables don't exist - execute base schema SQL
            results.push("📋 Creating database tables from schema...");

            // Read and execute base schema migration
            const baseSchemaPath = path.join(process.cwd(), "migrations", "000_base_schema.sql");

            if (!fs.existsSync(baseSchemaPath)) {
              throw new Error(`Base schema file not found: ${baseSchemaPath}`);
            }

            const baseSchemaSQL = fs.readFileSync(baseSchemaPath, "utf-8");

            // Execute the SQL
            await client.query(baseSchemaSQL);

            results.push("✅ Base schema created successfully");

            // Check if other migration files exist and execute them in order
            const migrationsDir = path.join(process.cwd(), "migrations");
            if (fs.existsSync(migrationsDir)) {
              const migrationFiles = fs.readdirSync(migrationsDir)
                .filter((file: string) => file.endsWith(".sql") && file !== "000_base_schema.sql")
                .sort();

              for (const file of migrationFiles) {
                const migrationPath = path.join(migrationsDir, file);
                const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
                await client.query(migrationSQL);
                results.push(`✅ Applied migration: ${file}`);
              }
            }

            res.json({
              success: true,
              message: "Database migration completed successfully",
              output: results.join("\n"),
            });
          } finally {
            client.release();
          }
        } catch (error: any) {
          logError(error, {
            context: "migrate",
          });
          res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
          });
        }
      } catch (error: any) {
        logError(error, {
          context: "migrate",
        });
        res.status(500).json({
          error: error.message,
        });
      }
    });

    // Debug endpoint
    // Debug endpoints - only available in development
    if (process.env.NODE_ENV !== "production") {
      app.get("/api/debug/storage", async (_req, res) => {
        try {
          res.json({
            status: "ok",
            storageType: storage.constructor.name,
            message: "Storage is accessible",
          });
        } catch (error: any) {
          res.status(500).json({
            status: "error",
            error: error.message,
          });
        }
      });

      // Test database write endpoint
      app.post("/api/debug/test-create-user", async (_req, res) => {
        try {
          const testEmail = `test_${Date.now()}@example.com`;
          const testPassword = "testpass123";

          logDebug("Testing user creation", {
            context: "testCreateUser",
            email: testEmail,
          });

          // Hash password
          const _hashedPassword = await bcrypt.hash(testPassword, 10);

          // Try to create user
          const user = await storage.createUser({
            email: testEmail,
            password: _hashedPassword,
          });

          res.json({
            success: true,
            message: "User created successfully",
            userId: user.id,
            email: user.email,
          });
        } catch (error: any) {
          logError(error, {
            context: "testCreateUser",
          });
          res.status(500).json({
            success: false,
            error: {
              message: error.message || "Unknown error",
              code: error.code,
              detail: error.detail,
              constraint: error.constraint,
              table: error.table,
              storageType: storage.constructor.name,
            },
          });
        }
      });
    }

    // Rate limiter for Web3 signature verification (5 attempts per IP per minute)
    const web3SignatureLimiter = createRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      max: 5,
      message: "Too many signature verification attempts. Please try again later.",
      keyGenerator: (req: Request) => {
        // Use IP address for rate limiting
        return req.ip || "unknown";
      },
    });

    // Web3 Signature Verification with proper signature verification
    app.post(
      "/api/web3/signature/verify",
      requireAuth,
      web3SignatureLimiter,
      validateBody(
        z.object({
          address: z.string().refine((val) => /^0x[a-fA-F0-9]{40}$/.test(val), {
            message: "Invalid Ethereum address format",
          }),
          message: z.string().min(1, "Message cannot be empty"),
          signature: z.string().refine((val) => /^0x[a-fA-F0-9]{130}$/.test(val), {
            message: "Invalid signature format",
          }),
        })
      ),
      async (req, res) => {
        const startTime = Date.now();
        const { address, message, signature } = req.body;
        const clientIp = req.ip || "unknown";
        const userId = req.session?.userId || "unknown";

        try {
          const isStaging = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'staging';
          const useMock = !process.env.WEB3_INTEGRATION_ENABLED || isStaging;

          if (useMock) {
            // Mock response for development/staging
            logInfo("Web3 signature verification (mock mode)", {
              userId,
              address,
              ip: clientIp,
              mock: true,
            });
            return res.json({
              success: true,
              message: "Web3 signature verification (mock mode - staging/development)",
              mock: true,
            });
          }

          // Validate address format
          if (!ethers.isAddress(address)) {
            logError(new Error("Invalid Ethereum address format"), {
              context: "web3_signature_verify",
              userId,
              address,
              ip: clientIp,
            });
            return res.status(400).json({
              success: false,
              message: "Invalid Ethereum address format",
              code: "INVALID_ADDRESS",
            });
          }

          // Extract and validate timestamp from message
          // Expected format: "GuardiaVault Signature\nTimestamp: <timestamp>\n<additional message>"
          const timestampMatch = message.match(/Timestamp:\s*(\d+)/i);
          if (!timestampMatch) {
            logError(new Error("Message missing timestamp"), {
              context: "web3_signature_verify",
              userId,
              address,
              ip: clientIp,
            });
            return res.status(400).json({
              success: false,
              message: "Message must include a timestamp to prevent replay attacks",
              code: "MISSING_TIMESTAMP",
            });
          }

          const messageTimestamp = parseInt(timestampMatch[1], 10);
          const currentTime = Date.now();
          const timestampAge = currentTime - messageTimestamp;
          const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

          // Verify timestamp is within 5 minutes
          if (timestampAge < 0) {
            logError(new Error("Timestamp is in the future"), {
              context: "web3_signature_verify",
              userId,
              address,
              ip: clientIp,
              timestamp: messageTimestamp,
              currentTime,
            });
            return res.status(400).json({
              success: false,
              message: "Message timestamp is in the future",
              code: "INVALID_TIMESTAMP",
            });
          }

          if (timestampAge > fiveMinutes) {
            logError(new Error("Timestamp expired"), {
              context: "web3_signature_verify",
              userId,
              address,
              ip: clientIp,
              timestamp: messageTimestamp,
              timestampAge,
              maxAge: fiveMinutes,
            });
            return res.status(400).json({
              success: false,
              message: "Message timestamp expired. Please sign a new message.",
              code: "TIMESTAMP_EXPIRED",
            });
          }

          // Verify signature using ethers.js
          let recoveredAddress: string;
          try {
            recoveredAddress = ethers.verifyMessage(message, signature);
          } catch (sigError: any) {
            logError(new Error("Signature verification failed"), {
              context: "web3_signature_verify",
              userId,
              address,
              ip: clientIp,
              error: sigError.message,
            });
            return res.status(400).json({
              success: false,
              message: "Invalid signature format or corrupted signature",
              code: "INVALID_SIGNATURE",
            });
          }

          // Validate that recovered address matches claimed address
          if (!recoveredAddress || recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            logError(new Error("Address mismatch"), {
              context: "web3_signature_verify",
              userId,
              claimedAddress: address,
              recoveredAddress,
              ip: clientIp,
            });
            return res.status(403).json({
              success: false,
              message: "Signature verification failed: address mismatch",
              code: "ADDRESS_MISMATCH",
            });
          }

          // Success - log and return
          const duration = Date.now() - startTime;
          logInfo("Web3 signature verification successful", {
            context: "web3_signature_verify",
            userId,
            address: recoveredAddress,
            ip: clientIp,
            duration,
            timestampAge,
          });

          res.json({
            success: true,
            verified: true,
            address: recoveredAddress,
            message: "Web3 signature verified successfully",
            timestamp: new Date().toISOString(),
          });
        } catch (error: any) {
          const duration = Date.now() - startTime;
          logError(error, {
            context: "web3_signature_verify",
            userId,
            address,
            ip: clientIp,
            duration,
          });
          res.status(500).json({
            success: false,
            message: error.message || "Failed to verify Web3 signature",
            code: "VERIFICATION_ERROR",
          });
        }
      }
    );

    // Hardware Device Management Endpoints

    // Register a new hardware device
    app.post("/api/hardware/register", requireAuth, async (req, res) => {
      try {
        const userId = req.session!.userId || "";
        const { deviceId, deviceName, publicKey, signature } = req.body;

        if (!deviceId || !publicKey || !signature) {
          return res.status(400).json({
            success: false,
            message: "Missing required fields: deviceId, publicKey, signature",
          });
        }

        const result = await hardwareDeviceService.registerDevice(userId, {
          deviceId,
          deviceName,
          publicKey,
          signature,
        });

        // Ensure message field exists for consistency
        if (!result.success && result.error && !result.message) {
          result.message = result.error;
        }

        if (!result.success) {
          return res.status(400).json(result);
        }

        res.json(result);
      } catch (error: any) {
        logError(error as Error, { context: "hardware_device_registration" });
        res.status(500).json({
          success: false,
          message: error.message || "Failed to register hardware device",
        });
      }
    });

    // Hardware Ping Endpoint (public - no auth required for hardware devices)
    app.post("/api/hardware/ping", async (req, res) => {
      try {
        const { deviceId, timestamp, signature } = req.body;

        if (!deviceId || !timestamp || !signature) {
          return res.status(400).json({
            success: false,
            message: "Missing required fields: deviceId, timestamp, signature",
          });
        }

        const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        const result = await hardwareDeviceService.processPing(
          { deviceId, timestamp, signature },
          ipAddress,
          userAgent
        );

        if (!result.success) {
          return res.status(401).json(result);
        }

        res.json(result);
      } catch (error: any) {
        logError(error as Error, { context: "hardware_ping" });
        res.status(500).json({
          success: false,
          message: error.message || "Failed to process hardware ping",
        });
      }
    });

    // Get user's hardware devices
    app.get("/api/hardware/devices", requireAuth, async (req, res) => {
      try {
        const userId = req.session!.userId || "";
        const devices = await hardwareDeviceService.getUserDevices(userId);

        res.json({
          success: true,
          devices: devices.map(device => ({
            id: device.id,
            deviceId: device.deviceId,
            deviceName: device.deviceName,
            status: device.status,
            lastPing: device.lastPing,
            alertThresholdMinutes: device.alertThresholdMinutes,
            createdAt: device.createdAt,
          })),
        });
      } catch (error: any) {
        logError(error as Error, { context: "get_hardware_devices" });
        res.status(500).json({
          success: false,
          message: error.message || "Failed to get hardware devices",
        });
      }
    });

    // Delete a hardware device
    app.delete("/api/hardware/devices/:deviceId", requireAuth, async (req, res) => {
      try {
        const userId = req.session!.userId || "";
        const { deviceId } = req.params;

        const deleted = await hardwareDeviceService.deleteDevice(userId, deviceId);

        if (!deleted) {
          return res.status(404).json({
            success: false,
            message: "Device not found or you don't have permission to delete it",
          });
        }

        res.json({
          success: true,
          message: "Device deleted successfully",
        });
      } catch (error: any) {
        logError(error as Error, { context: "delete_hardware_device" });
        res.status(500).json({
          success: false,
          message: error.message || "Failed to delete hardware device",
        });
      }
    });

    // AI Sentinel Status (placeholder with mock/fallback)
    app.get("/api/ai-sentinel/status", requireAuth, async (req, res) => {
      try {
        const _userId = req.session!.userId;
        const isStaging = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'staging';
        const useMock = !process.env.AI_SENTINEL_ENABLED || isStaging;

        if (useMock) {
          // Mock response for development/staging
          return res.json({
            enabled: false,
            status: "mock",
            message: "AI Sentinel status (mock mode - staging/development)",
            features: {
              livenessDetection: false,
              deepfakeDetection: false,
            },
          });
        }

        // TODO: Implement actual AI Sentinel status check
        res.json({
          enabled: false,
          status: "not_implemented",
          message: "AI Sentinel not yet implemented",
        });
      } catch (error: any) {
        logError(error, {
          context: "aiSentinelStatus",
          userId: req.session?.userId,
        });
        res.status(500).json({ message: error.message || "Failed to get AI Sentinel status" });
      }
    });

    // Recovery metrics endpoint
    app.get("/api/recovery/metrics", requireAuth, async (req, res) => {
      try {
        const { recoveryMetrics } = await import("./services/recoveryMetrics");
        const metrics = await recoveryMetrics.getMetrics();
        const needsPercentage = await recoveryMetrics.getRecoveryNeedsPercentage();

        res.json({
          metrics,
          recoveryNeeds: needsPercentage,
        });
      } catch (error: any) {
        logError(error, {
          context: "recoveryMetrics",
          userId: req.session?.userId,
        });
        res.status(500).json({ message: error.message || "Failed to get recovery metrics" });
      }
    });

    // Subscription status endpoint
    app.get("/api/subscriptions/status", requireAuth, async (req, res) => {
      try {
        const userId = req.session!.userId;
        if (!userId) {
          return res.status(401).json({ message: "Not authenticated" });
        }

        // Get subscription from database
        if (db && subscriptions) {
          const userSubscriptions = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId))
            .orderBy(desc(subscriptions.createdAt))
            .limit(1);

          if (userSubscriptions.length > 0) {
            const sub = userSubscriptions[0];
            // Check if subscription is still active (not expired)
            const now = new Date();
            const isActive =
              sub.status === "active" &&
              new Date(sub.currentPeriodEnd) > now;

            // Check for critical expiry scenarios
            if (!isActive) {
              try {
                const { subscriptionExpiryHandler } = await import("./services/subscriptionExpiryHandler");
                // Get user's vault if exists
                const userVaults = await storage.getVaultsByOwner(userId);
                if (userVaults.length > 0) {
                  const expiryCheck = await subscriptionExpiryHandler.checkAndHandleExpiry(
                    userId,
                    userVaults[0].id,
                    new Date(sub.currentPeriodEnd)
                  );
                  if (expiryCheck.requiresAttention) {
                    // Include warning in response
                    return res.json({
                      status: "expired",
                      plan: sub.plan,
                      currentPeriodStart: sub.currentPeriodStart,
                      currentPeriodEnd: sub.currentPeriodEnd,
                      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
                      warning: expiryCheck.actionTaken,
                      scenario: expiryCheck.scenario,
                    });
                  }
                }
              } catch (expiryError) {
                // Non-critical, continue with normal response
                logError(expiryError instanceof Error ? expiryError : new Error(String(expiryError)), {
                  context: "subscriptionStatus",
                  userId,
                });
              }
            }

            return res.json({
              status: isActive ? "active" : "expired",
              plan: sub.plan,
              currentPeriodStart: sub.currentPeriodStart,
              currentPeriodEnd: sub.currentPeriodEnd,
              cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            });
          }
        }

        // No subscription found
        return res.status(404).json({ message: "No subscription found" });
      } catch (error: any) {
        logError(error, {
          context: "subscriptionStatus",
          userId: req.session?.userId,
        });
        res.status(500).json({ message: error.message || "Failed to fetch subscription" });
      }
    });

    // Mock wallet balance endpoint for demo accounts
    app.get("/api/wallet/balance", requireAuth, async (req, res) => {
      try {
        const userId = req.session!.userId;
        if (!userId) {
          return res.status(401).json({ message: "Not authenticated" });
        }

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Check if this is a demo account
        const isDemoAccount = user.email === "demo@guardiavault.com";

        if (isDemoAccount && user.walletAddress) {
          // Return realistic mock balance for demo account
          // Average crypto holder has ~2-5 ETH
          const mockEthBalance = "3.2457"; // ~$8,000 at current prices
          const mockTokenBalances = {
            usdc: "1250.50", // $1,250 USDC
            wbtc: "0.0325", // ~$2,000 in BTC
          };

          return res.json({
            eth: mockEthBalance,
            tokens: mockTokenBalances,
            totalValueUsd: "11250.50", // Approximate total value
          });
        }

        // For non-demo accounts, return empty (frontend will fetch real balance)
        res.json({ eth: "0", tokens: {}, totalValueUsd: "0" });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    // Security endpoints
    app.get("/api/security/risk-events", requireAuth, async (req, res) => {
      try {
        const _userId = req.session!.userId;
        // Return empty events array for now - can be implemented later
        res.json({ events: [] });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    app.post("/api/security/biometrics", requireAuth, async (req, res) => {
      try {
        const _userId = req.session!.userId;
        const { _dataType, _signature } = req.body;

        // Here you would save biometric data
        // For now, just return success
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    // Register authentication routes (login, logout, 2FA, etc.)
    registerAuthRoutes(app);

    // Register email verification routes (registration with email verification)
    registerEmailVerificationRoutes(app);

    // Register vault management routes (create, list, yield, parties, recovery)
    registerVaultRoutes(app, requireAuth);

    // Register check-in routes (includes biometric verification)
    registerCheckInRoutes(app, requireAuth);

    // Register WebAuthn and TOTP routes (authenticated endpoints)
    registerWebAuthnRoutes(app, requireAuth);

    // Register public WebAuthn authentication routes (for login)
    registerWebAuthnAuthRoutes(app);

    // Register OAuth routes (Google and GitHub)
    registerOAuthRoutes(app);

    // Register party history and messaging routes
    registerPartyHistoryRoutes(app, requireAuth);
    registerMessageRoutes(app, requireAuth);

    // Register yield vault routes
    registerYieldVaultRoutes(app, requireAuth);
    registerFragmentRoutes(app);

    // Yield API routes (strategies, positions, APY)
    app.use("/api/yield", yieldRoutes);

    // Register DAO verification routes
    registerDAORoutes(app, requireAuth);

    // Smart Will Builder routes

    // Register OAuth routes (Google and GitHub)
    registerOAuthRoutes(app);

    // Register party history and messaging routes
    registerPartyHistoryRoutes(app, requireAuth);
    registerMessageRoutes(app, requireAuth);

    // Auth routes
    registerAuthRoutes(app);
    registerEmailVerificationRoutes(app);

    // Register yield vault routes
    registerOnboardingRoutes(app);

    // Optimization routes
    registerOptimizeRoutes(app);

    // Articles routes
    registerArticlesRoutes(app);

    // Enhanced Yield routes (real-time APY, optimization)
    registerEnhancedYieldRoutes(app, requireAuth);

    // Referral routes
    registerReferralRoutes(app, requireAuth);

    // Yield Leaderboard routes
    registerYieldLeaderboardRoutes(app, requireAuth);

    // DCA routes
    registerDCARoutes(app, requireAuth);

    // Achievement routes
    registerAchievementRoutes(app, requireAuth);

    // Admin routes
    registerAdminRoutes(app, requireAuth);

    // OG Image routes (public, but rate limited)
    registerOGImageRoutes(app);

    // Yield Challenge routes
    registerYieldChallengeRoutes(app, requireAuth);

    // AI Optimizer routes
    registerAIOptimizerRoutes(app, requireAuth);

    // Enhanced Wallet Integration routes
    registerWalletIntegrationRoutes(app, requireAuth);

    // Development debug routes (dev only)
    logInfo("Registering dev debug routes", {
      context: "registerRoutes",
    });
    registerDevDebugRoutes(app);
    logInfo("Dev debug routes registered successfully", {
      context: "registerRoutes",
    });

    // Notification endpoints
    const { notificationService } = await import("./services/notifications");
    const { auditLog } = await import("./services/logger");

    // Test send notification
    app.post(
      "/api/notifications/test-send",
      requireAuth,
      validateBody(
        z.object({
          channel: z.enum(["email", "sms", "telegram"]),
          recipient: z.string(),
        })
      ),
      async (req, res) => {
        try {
          const userId = req.session!.userId;
          const { channel, recipient } = req.body;

          let result: { success: boolean; error?: string; messageId?: string | number };

          if (channel === "email") {
            result = await notificationService.sendEmail(
              recipient,
              "GuardiaVault Test Notification",
              "<h1>Test Email</h1><p>This is a test email from GuardiaVault.</p>",
              "Test Email\n\nThis is a test email from GuardiaVault."
            );
          } else if (channel === "sms") {
            result = await notificationService.sendSMS(
              recipient,
              "GuardiaVault Test: This is a test SMS notification."
            );
          } else if (channel === "telegram") {
            result = await notificationService.sendTelegram(
              recipient,
              "GuardiaVault Test: This is a test Telegram notification."
            );
          } else {
            return res.status(400).json({ message: "Invalid channel" });
          }

          // Audit log
          auditLog("notification_test_sent", userId, {
            channel,
            recipient,
            success: result.success,
            messageId: result.messageId,
          });

          if (result.success) {
            res.json({
              success: true,
              message: `${channel} test notification sent successfully`,
              messageId: result.messageId,
            });
          } else {
            res.status(500).json({
              success: false,
              message: `Failed to send ${channel} notification`,
              error: result.error,
            });
          }
        } catch (error: any) {
          logError(error, {
            context: "testNotification",
            userId: req.session?.userId,
            channel: req.body?.channel,
          });
          res.status(500).json({ message: error.message || "Failed to send test notification" });
        }
      }
    );

    // Web3 signature mock endpoint
    app.post(
      "/api/web3/signature/verify",
      requireAuth,
      validateBody(
        z.object({
          address: z.string(),
          message: z.string(),
          signature: z.string(),
        })
      ),
      async (req, res) => {
        try {
          // Mock verification - in production, verify using ethers.js
          await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay

          res.json({
            success: true,
            verified: true,
            message: "Web3 signature verified (simulated)",
            timestamp: new Date().toISOString(),
          });
        } catch (error: any) {
          res.status(500).json({ message: error.message || "Failed to verify signature" });
        }
      }
    );

    // Hardware ping mock endpoint
    app.post(
      "/api/hardware/ping",
      requireAuth,
      validateBody(
        z.object({
          deviceId: z.string(),
        })
      ),
      async (req, res) => {
        try {
          const userId = req.session!.userId;
          const { deviceId } = req.body;

          // Mock hardware ping - in production, verify with actual hardware
          await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate delay

          // Audit log
          auditLog("hardware_ping_sent", userId, {
            deviceId,
          });

          res.json({
            success: true,
            message: "Hardware ping successful (simulated)",
            deviceId,
            timestamp: new Date().toISOString(),
            status: "active",
          });
        } catch (error: any) {
          res.status(500).json({ message: error.message || "Failed to ping hardware" });
        }
      }
    );

    // Stripe payment endpoints
    app.post("/api/payments/create-checkout-session", async (req, res) => {
      try {
        const { plan, months, duration, amount } = req.body;

        if (!plan || !amount) {
          return res.status(400).json({ message: "Plan and amount are required" });
        }

        // Check if Stripe is configured
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
          return res.status(500).json({ message: "Stripe is not configured" });
        }

        const stripe = await import("stripe");
        const stripeClient = new stripe.default(stripeSecretKey);

        // Plan pricing mapping (updated to new monthly pricing tiers)
        const planPricing: Record<string, { annualPrice: number; monthlyPrice: number }> = {
          "Starter": { monthlyPrice: 49.99, annualPrice: 599.88 }, // $49.99/month * 12
          "Vault Pro": { monthlyPrice: 99.99, annualPrice: 1199.88 }, // $99.99/month * 12
          "Guardian+": { monthlyPrice: 249.99, annualPrice: 2999.88 }, // $249.99/month * 12
          // Legacy plans (for backward compatibility)
          "Solo Plan": { monthlyPrice: 49.99, annualPrice: 599.88 },
          "Family Plan": { monthlyPrice: 99.99, annualPrice: 1199.88 },
          "Pro/Investor Plan": { monthlyPrice: 249.99, annualPrice: 2999.88 },
        };

        const planData = planPricing[plan] || planPricing["Guardian+"];

        // Calculate final amount based on duration and plan type
        let finalAmount = amount;
        if (duration === "10year") {
          // 10-year pricing with 15% discount is already calculated on frontend
          finalAmount = amount;
        } else {
          // All plans are monthly - use annual equivalent (monthly * 12)
          finalAmount = planData.annualPrice || (planData.monthlyPrice * 12);
        }

        // Create checkout session
        const session = await stripeClient.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `${plan} - ${duration === "10year" ? "10 Years" : "1 Year"}`,
                  description: `Prepaid subscription for ${plan}. Payment protected by escrow contract.`,
                },
                unit_amount: Math.round(finalAmount * 100), // Convert to cents
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${process.env.APP_URL || "http://localhost:5000"}/signup?session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(plan)}&months=${months || (duration === "10year" ? 120 : 12)}`,
          cancel_url: `${process.env.APP_URL || "http://localhost:5000"}/checkout?plan=${encodeURIComponent(plan)}`,
          metadata: {
            plan,
            months: months || (duration === "10year" ? 120 : 12),
            duration: duration || "1year",
            amount: finalAmount.toString(),
          },
        });

        res.json({ url: session.url, id: session.id });
      } catch (error: any) {
        logError(error, {
          context: "stripeCheckout",
          plan: req.body?.plan,
        });
        res.status(500).json({ message: error.message || "Failed to create checkout session" });
      }
    });

    // ============ Recovery API Endpoints ============

    // Create recovery setup
    app.post("/api/recovery/create", requireAuth, validateBody(z.object({
      walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
      recoveryKeys: z.array(z.object({
        email: z.string().email(),
        name: z.string().min(2),
      })).length(3, "Exactly 3 recovery keys required"),
      encryptedData: z.string().min(1),
    })), async (req, res) => {
      try {
        const userId = req.session!.userId;
        const { walletAddress, recoveryKeys, encryptedData } = req.body;

        // Generate recovery key addresses (temporary addresses for MVP)
        // In production, you might want to use email signatures or generate deterministic addresses
        const { ethers } = await import("ethers");
        const recoveryKeyAddresses: string[] = [];

        for (const key of recoveryKeys) {
          // Generate deterministic address from email (for MVP)
          // In production, consider using email signatures or separate wallet generation
          const hash = ethers.solidityPackedKeccak256(["string"], [key.email]);
          const address = ethers.getAddress(`0x${hash.slice(-40)}`);
          recoveryKeyAddresses.push(address);
        }

        // Create recovery in database
        const recovery = await storage.createRecovery({
          userId,
          walletAddress,
          encryptedData,
        });

        // Create recovery keys and send invitations
        const inviteTokens: string[] = [];
        for (let i = 0; i < recoveryKeys.length; i++) {
          const key = recoveryKeys[i];
          const token = randomUUID();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

          await storage.createRecoveryKey({
            recoveryId: recovery.id,
            email: key.email,
            name: key.name,
            walletAddress: recoveryKeyAddresses[i],
            inviteToken: token,
            inviteExpiresAt: expiresAt,
          });

          inviteTokens.push(token);

          // Send invitation email
          const inviteUrl = `${process.env.APP_URL || "http://localhost:5000"}/recovery-portal/${token}`;
          await sendEmail(
            key.email,
            "You've been chosen as a Recovery Key",
            `Hello ${key.name},\n\nYou have been selected as a recovery key for a wallet recovery setup.\n\n` +
            `If the wallet owner loses access, 2 of 3 recovery keys can help recover it.\n\n` +
            `Access your recovery portal: ${inviteUrl}\n\n` +
            `This link expires in 30 days.\n\n` +
            `This is a serious responsibility. Only use it if you're certain the wallet owner needs help.`
          );
        }

        res.status(201).json({
          recovery: {
            id: recovery.id,
            userId: recovery.userId,
            walletAddress: recovery.walletAddress,
            status: recovery.status,
            createdAt: recovery.createdAt,
          },
          recoveryKeys: recoveryKeys.map((key: { email: string; name: string }, i: number) => ({
            email: key.email,
            name: key.name,
            address: recoveryKeyAddresses[i],
          })),
          inviteTokens,
        });
      } catch (error: any) {
        logError(error, {
          context: "recoveryCreation",
          userId: req.session?.userId,
        });
        res.status(500).json({ message: error.message || "Failed to create recovery" });
      }
    });

    // Verify recovery token and get recovery info
    app.get("/api/recovery/verify-token/:token", async (req, res) => {
      try {
        const { token } = req.params;
        const recoveryKey = await storage.getRecoveryKeyByToken(token);

        if (!recoveryKey) {
          return res.status(404).json({ message: "Invalid or expired token" });
        }

        // Check if token is expired
        if (new Date() > new Date(recoveryKey.inviteExpiresAt)) {
          return res.status(410).json({ message: "Token has expired" });
        }

        const recovery = await storage.getRecovery(recoveryKey.recoveryId);
        if (!recovery) {
          return res.status(404).json({ message: "Recovery not found" });
        }

        res.json({
          recoveryId: recovery.contractRecoveryId || recovery.id,
          walletAddress: recovery.walletAddress,
          recoveryKeyInfo: {
            name: recoveryKey.name,
            email: recoveryKey.email,
          },
        });
      } catch (error: any) {
        logError(error, {
          context: "recoveryTokenVerification",
          token: req.params.token,
        });
        res.status(500).json({ message: error.message || "Failed to verify token" });
      }
    });

    // Check if recovery key has attested
    app.get("/api/recovery/has-attested/:recoveryId", async (req, res) => {
      try {
        const { recoveryId } = req.params;
        const walletAddress = req.query.walletAddress as string;

        if (!walletAddress) {
          return res.status(400).json({ message: "walletAddress query parameter required" });
        }

        // Find recovery - first try by ID, then by contractRecoveryId
        let recovery = await storage.getRecovery(recoveryId);

        // If not found, try searching by contract recovery ID (this is a simple implementation)
        // In production, you might want to add a method to search by contractRecoveryId
        if (!recovery && !isNaN(Number(recoveryId))) {
          // Try to find by contract recovery ID - for MVP, we'll search all recoveries
          // In production, add a database index and query method
          const userId = req.session?.userId;
          if (userId) {
            const userRecoveries = await storage.getRecoveriesByUser(userId);
            recovery = userRecoveries.find(r => r.contractRecoveryId?.toString() === recoveryId);
          }
        }

        if (!recovery) {
          return res.status(404).json({ message: "Recovery not found" });
        }

        const recoveryKeys = await storage.getRecoveryKeysByRecovery(recovery.id);
        const key = recoveryKeys.find((k) => k.walletAddress?.toLowerCase() === walletAddress.toLowerCase());

        res.json({ hasAttested: key?.hasAttested || false });
      } catch (error: any) {
        logError(error, {
          context: "recoveryAttestationCheck",
          recoveryId: req.params.recoveryId,
        });
        res.status(500).json({ message: error.message || "Failed to check attestation" });
      }
    });

    // Update recovery with contract recovery ID
    app.post("/api/recovery/update-contract-id/:recoveryId", requireAuth, async (req, res) => {
      try {
        const { recoveryId } = req.params;
        const { contractRecoveryId } = req.body;

        const recovery = await storage.getRecovery(recoveryId);
        if (!recovery) {
          return res.status(404).json({ message: "Recovery not found" });
        }

        // Verify ownership
        if (recovery.userId !== req.session!.userId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        await storage.updateRecovery(recoveryId, {
          contractRecoveryId: contractRecoveryId ? Number(contractRecoveryId) : undefined,
        });

        res.json({ success: true });
      } catch (error: any) {
        logError(error, {
          context: "recoveryUpdateContractId",
          recoveryId: req.params.recoveryId,
          userId: req.session?.userId,
        });
        res.status(500).json({ message: error.message || "Failed to update contract ID" });
      }
    });

    // Update recovery key attestation status (called after contract attestation)
    app.post("/api/recovery/mark-attested/:recoveryId", async (req, res) => {
      try {
        const { recoveryId } = req.params;
        const { walletAddress } = req.body;

        if (!walletAddress) {
          return res.status(400).json({ message: "walletAddress required" });
        }

        // Find recovery
        const recovery = await storage.getRecovery(recoveryId);
        if (!recovery) {
          return res.status(404).json({ message: "Recovery not found" });
        }

        // Find and update recovery key
        const recoveryKeys = await storage.getRecoveryKeysByRecovery(recovery.id);
        const key = recoveryKeys.find((k) => k.walletAddress?.toLowerCase() === walletAddress.toLowerCase());

        if (!key) {
          return res.status(404).json({ message: "Recovery key not found" });
        }

        await storage.updateRecoveryKey(key.id, {
          hasAttested: true,
          attestedAt: new Date(),
        });

        // Check if recovery should be marked as triggered (2 of 3 attested)
        const updatedKeys = await storage.getRecoveryKeysByRecovery(recovery.id);
        const attestedCount = updatedKeys.filter((k) => k.hasAttested).length;

        if (attestedCount >= 2 && recovery.status === "active") {
          await storage.updateRecovery(recovery.id, {
            status: "triggered",
            triggeredAt: new Date(),
          });
        }

        res.json({ success: true, attestedCount });
      } catch (error: any) {
        logError(error, {
          context: "recoveryMarkAttested",
          recoveryId: req.params.recoveryId,
        });
        res.status(500).json({ message: error.message || "Failed to mark as attested" });
      }
    });

    // Use existing server if provided, otherwise create new one
    let server: Server;
    if (existingServer) {
      server = existingServer;
      logInfo("Using existing HTTP server", {
        context: "registerRoutes",
      });
    } else {
      const http = await import("http");
      server = http.createServer(app);
      logInfo("HTTP server created", {
        context: "registerRoutes",
      });
    }

    // CRITICAL: SPA fallback must be LAST, after all API routes and static middleware
    // This ensures /assets/* requests are served by static middleware first
    // Only serve index.html for non-API, non-asset routes
    if (process.env.NODE_ENV === "production") {
      const path = await import("path");
      const fs = await import("fs");
      const root = process.cwd();
      const distDir = path.join(root, "dist", "public");

      // Check if dist directory exists
      if (fs.existsSync(distDir)) {
        const indexPath = path.join(distDir, "index.html");
        if (fs.existsSync(indexPath)) {
          // Use app.use instead of app.get to ensure it runs as middleware
          // This ensures it only catches requests that weren't handled by static middleware
          app.use((req: Request, res: Response, next: NextFunction) => {
            // Only handle GET/HEAD requests for SPA routing
            if (!["GET", "HEAD"].includes(req.method)) {
              return next();
            }

            // Skip API routes and health endpoints
            const urlPath = req.originalUrl?.split("?")[0].split("#")[0] || req.path || "";
            if (urlPath.startsWith("/api/") || urlPath.startsWith("/health") || urlPath.startsWith("/ready")) {
              return next();
            }

            // CRITICAL: Exclude asset paths from SPA fallback
            // Check both /assets/ prefix and file extensions to prevent index.html from being returned
            if (urlPath.startsWith("/assets/") || urlPath.startsWith("/static/")) {
              // Asset should have been served by static middleware - return 404 JSON (not HTML)
              res.setHeader("Content-Type", "application/json");
              return res.status(404).json({ message: "Asset not found" });
            }

            // Check if it's an asset request by file extension (safety check)
            // Exclude serviceWorker.js from SPA fallback - it should be served by static middleware
            if (urlPath === "/serviceWorker.js" || urlPath === "/manifest.json") {
              return next(); // Let static middleware handle it
            }
            const assetExtensions = ['.css', '.js', '.mjs', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.wasm', '.webp', '.mp4', '.map'];
            const isAsset = assetExtensions.some(ext => urlPath.toLowerCase().endsWith(ext));

            if (isAsset) {
              // Asset should have been served by static middleware - return 404 JSON (not HTML)
              // Set proper Content-Type to prevent MIME type errors
              res.setHeader("Content-Type", "application/json");
              return res.status(404).json({ message: "Asset not found" });
            }

            // Only serve index.html for non-asset, non-API routes (SPA client-side routing)
            // CRITICAL: Prevent HTML caching to ensure fresh asset references
            // This is especially important after OAuth redirects and deployments
            res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.sendFile(indexPath);
          });
          logInfo("SPA fallback route registered (excludes /assets/* and asset extensions)", {
            context: "registerRoutes",
          });
        }
      }
    }

    return server;
  } catch (error: any) {
    logError(error, {
      context: "registerRoutes",
    });
    throw error;
  }
}
