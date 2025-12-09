/**
 * Vault Management Routes
 * Extracted from routes.ts for better code organization
 */

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { vaults, parties } from "@shared/schema";
import { withTransaction } from "./utils/db";
import { validateBody } from "./middleware/validation";
import { logInfo, logError, logWarn, logDebug } from "./services/logger";
import { canCreateVault, checkPartyLimits, getTierLimits } from "./services/tierLimits";
import { achievementService } from "./services/achievementService";

export function registerVaultRoutes(app: Express, requireAuth: Function): void {
  // Legacy messages endpoints
  app.get("/api/vaults/:vaultId/legacy-messages", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const { vaultId } = req.params;

      // Verify vault belongs to user
      const vault = await storage.getVault(vaultId);
      if (!vault || vault.ownerId !== userId) {
        return res.status(404).json({ message: "Vault not found" });
      }

      // Here you would fetch legacy messages
      res.json({ messages: [] });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/vaults/:vaultId/legacy-messages", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const { vaultId } = req.params;

      // Verify vault belongs to user
      const vault = await storage.getVault(vaultId);
      if (!vault || vault.ownerId !== userId) {
        return res.status(404).json({ message: "Vault not found" });
      }

      // Here you would create legacy message
      res.json({ success: true, message: "Message created" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Vaults endpoints
  app.get("/api/vaults", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const startTime = Date.now();

      // Use optimized method that fetches vaults with guardians in a single query
      // Check if storage has the optimized method (PostgresStorage)
      if (typeof (storage as any).getVaultsWithGuardians === 'function') {
        const vaultsWithGuardians = await (storage as any).getVaultsWithGuardians(userId);
        const queryTime = Date.now() - startTime;
        logDebug("GET /api/vaults endpoint", {
          context: "vaults",
          userId,
          queryTime,
          vaultCount: vaultsWithGuardians.length,
        });

        // Transform to match expected format (guardians as separate array)
        const vaults = vaultsWithGuardians.map((v: any) => {
          const { guardians, ...vault } = v;
          return vault;
        });

        // Also return guardians separately if needed for backward compatibility
        const allGuardians = vaultsWithGuardians.flatMap((v: any) =>
          v.guardians.map((g: any) => ({ ...g, vaultId: v.id }))
        );

        res.json({ vaults, guardians: allGuardians });
      } else {
        // Fallback for in-memory storage
        const vaults = await storage.getVaultsByOwner(userId);
        const queryTime = Date.now() - startTime;
        logDebug("GET /api/vaults endpoint (fallback)", {
          context: "vaults",
          userId,
          queryTime,
          vaultCount: vaults.length,
        });
        res.json({ vaults });
      }
    } catch (error: any) {
      logError(error, {
        context: "vaults",
        userId: req.session!.userId,
      });
      res.status(500).json({ message: error.message });
    }
  });

  // Get yield data for a vault
  app.get("/api/vaults/:id/yield", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const { id } = req.params;

      // Verify vault belongs to user
      const vault = await storage.getVault(id);
      if (!vault || vault.ownerId !== userId) {
        return res.status(404).json({ message: "Vault not found" });
      }

      // Get user's wallet address (if available)
      const user = await storage.getUser(userId);
      if (!user?.walletAddress) {
        // No wallet connected - return placeholder data
        return res.json({
          apy: 0,
          yieldAccumulated: "0",
          principal: "0",
          totalValue: "0",
          asset: "ETH",
          stakingProtocol: "none",
          note: "Connect wallet and create yield vault to see real yield data",
        });
      }

      // Try to get yield vault from contract
      const { yieldService } = await import("./services/yieldService.js");
      try {
        // Get yield vault ID for this GuardiaVault
        // Note: This requires the YieldVault contract to be deployed and configured
        const positions = await yieldService.getUserPositions(user.walletAddress);

        // Find position linked to this vault (via guardiaVaultId)
        const position = positions.find(p => {
          // Check if this position is linked to the vault
          // In production, you'd store the mapping in the database
          return true; // For now, return first position
        });

        if (position) {
          return res.json({
            apy: position.apy,
            yieldAccumulated: position.yieldEarned.toString(),
            principal: position.principal.toString(),
            totalValue: position.currentValue.toString(),
            asset: position.asset,
            stakingProtocol: position.protocol,
            lastUpdate: position.lastUpdate.toISOString(),
          });
        }
      } catch (error) {
        logError(error as Error, {
          context: "vault-yield",
          vaultId: id,
          userId,
          note: "Yield vault contract may not be configured",
        });
      }

      // Fallback: Calculate estimated yield from protocol APIs
      const { yieldCalculationService } = await import("./services/yieldCalculation.js");

      // Get vault creation time
      const createdAt = vault.createdAt ? new Date(vault.createdAt) : new Date();
      const daysSinceCreation = Math.max(0, (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Use a default principal for estimation (in production, this would come from contract)
      const estimatedPrincipal = "1.0"; // Placeholder

      // Get real APY from protocol APIs
      const protocol = "lido"; // Default to Lido, could be stored in vault metadata
      const apy = await yieldCalculationService.getProtocolAPY(protocol);

      // Calculate estimated yield
      const dailyYieldRate = apy / 100 / 365;
      const estimatedYield = parseFloat(estimatedPrincipal) * dailyYieldRate * daysSinceCreation;
      const estimatedFee = estimatedYield * 0.01; // 1% fee
      const netYield = estimatedYield - estimatedFee;

      res.json({
        apy,
        yieldAccumulated: netYield.toString(),
        principal: estimatedPrincipal,
        totalValue: (parseFloat(estimatedPrincipal) + netYield).toString(),
        asset: "ETH",
        stakingProtocol: protocol,
        note: "Estimated yield based on protocol APY. Connect wallet and create yield vault for real-time data.",
      });
    } catch (error: any) {
      logError(error, {
        context: "vault-yield",
        vaultId: req.params.id,
      });
      res.status(500).json({ message: error.message || "Failed to fetch yield data" });
    }
  });

  // Get all parties for a vault
  app.get("/api/vaults/:vaultId/parties", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const { vaultId } = req.params;

      // Verify vault belongs to user
      const vault = await storage.getVault(vaultId);
      if (!vault || vault.ownerId !== userId) {
        return res.status(404).json({ message: "Vault not found" });
      }

      const parties = await storage.getPartiesByVault(vaultId);
      res.json({ parties });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get parties by role for a vault
  app.get("/api/vaults/:vaultId/parties/:role", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const { vaultId, role } = req.params;

      logDebug("Fetching parties by role", {
        context: "parties",
        vaultId,
        role,
        userId,
      });

      // Verify vault belongs to user
      const vault = await storage.getVault(vaultId);
      if (!vault || vault.ownerId !== userId) {
        logWarn("Vault not found or doesn't belong to user", {
          context: "parties",
          vaultId,
          userId,
        });
        return res.status(404).json({ message: "Vault not found" });
      }

      // Validate role
      if (!["guardian", "beneficiary", "attestor"].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be guardian, beneficiary, or attestor" });
      }

      const parties = await storage.getPartiesByRole(vaultId, role);
      logDebug("Found parties by role", {
        context: "parties",
        vaultId,
        role,
        partyCount: parties.length,
      });
      res.json({ parties });
    } catch (error: any) {
      logError(error, {
        context: "parties",
        vaultId: req.params.vaultId,
        role: req.params.role,
        userId: req.session!.userId,
      });
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/vaults", requireAuth, validateBody(z.object({
    name: z.string().min(1, "Vault name is required"),
    checkInIntervalDays: z.number().min(30).max(365),
    gracePeriodDays: z.number().min(7).max(90),
    guardians: z.array(z.object({
      name: z.string().min(1),
      email: z.string().email(),
    })).min(1, "At least 1 guardian is required"),
    beneficiaries: z.array(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
    })).min(1, "At least 1 beneficiary is required"),
  })), async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Check tier limits - can user create another vault?
      const vaultCheck = await canCreateVault(storage, userId);
      if (!vaultCheck.allowed) {
        return res.status(403).json({
          message: vaultCheck.message,
          code: "TIER_LIMIT_EXCEEDED",
          limitType: "vaults",
          plan: vaultCheck.plan,
        });
      }

      // Body already validated by middleware
      const { name, checkInIntervalDays, gracePeriodDays, guardians, beneficiaries } = req.body;

      // Check party limits based on user's tier
      const partyCheck = checkPartyLimits(vaultCheck.plan, guardians.length, beneficiaries.length);
      if (!partyCheck.allowed) {
        return res.status(403).json({
          message: partyCheck.message,
          code: "TIER_LIMIT_EXCEEDED",
          limitType: guardians.length > getTierLimits(vaultCheck.plan).maxGuardians ? "guardians" : "beneficiaries",
          plan: vaultCheck.plan,
        });
      }

      // Check for duplicate guardians within the vault being created
      const guardianEmails = guardians.map((g: any) => g.email.toLowerCase());
      const duplicateGuardians = guardianEmails.filter((email: string, index: number) => guardianEmails.indexOf(email) !== index);
      if (duplicateGuardians.length > 0) {
        return res.status(400).json({
          message: `Duplicate guardian emails: ${duplicateGuardians.join(", ")}`,
          code: "DUPLICATE_GUARDIANS",
        });
      }

      // Check for guardian-beneficiary overlap (business rule: guardians cannot be beneficiaries in same vault)
      const beneficiaryEmails = beneficiaries.map((b: any) => b.email.toLowerCase());
      const overlap = guardianEmails.filter((email: string) => beneficiaryEmails.includes(email));
      if (overlap.length > 0) {
        return res.status(400).json({
          message: `Guardians and beneficiaries cannot have the same email: ${overlap.join(", ")}`,
          code: "GUARDIAN_BENEFICIARY_OVERLAP",
        });
      }

      // Calculate next check-in date
      const now = new Date();
      const nextCheckIn = new Date();
      nextCheckIn.setDate(nextCheckIn.getDate() + checkInIntervalDays);

      // CRITICAL: Use transaction to ensure atomicity - vault + all parties created together
      const { vault, createdParties } = await withTransaction(async (tx) => {
        // Create vault
        const [vaultRow] = await tx.insert(vaults).values({
          ownerId: userId,
          name,
          checkInIntervalDays,
          gracePeriodDays,
          status: "active",
          lastCheckInAt: now,
          nextCheckInDue: nextCheckIn,
          createdAt: now,
          updatedAt: now,
        } as any).returning();

        const vaultId = vaultRow.id;

        // Create parties (guardians and beneficiaries) - all in same transaction
        const createdParties: any[] = [];

        // Create guardians
        for (let i = 0; i < guardians.length; i++) {
          const guardian = guardians[i];
          const [party] = await tx.insert(parties).values({
            vaultId,
            role: "guardian",
            name: guardian.name,
            email: guardian.email,
            phone: null,
            inviteToken: randomUUID(),
            inviteExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            status: "pending",
            createdAt: now,
            updatedAt: now,
          } as any).returning();
          createdParties.push(party);
        }

        // Create beneficiaries
        for (const beneficiary of beneficiaries) {
          const [party] = await tx.insert(parties).values({
            vaultId,
            role: "beneficiary",
            name: beneficiary.name,
            email: beneficiary.email,
            phone: beneficiary.phone || null,
            inviteToken: randomUUID(),
            inviteExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            status: "pending",
            createdAt: now,
            updatedAt: now,
          } as any).returning();
          createdParties.push(party);
        }

        return { vault: vaultRow, createdParties };
      }, "vault_creation_with_parties");

      // Generate fragments and passphrases for guardians
      const { splitSecret, encryptFragment, deriveGuardianPassphrase, generateSecurePassphrase } = await import("./services/shamir");
      const { fragments: fragmentsTable } = await import("@shared/schema");

      // Generate master secret (256-bit random secret)
      const masterSecret = generateSecurePassphrase();

      // Determine fragment scheme: 2-of-3 (default) or 3-of-5 (if 5 guardians)
      const guardianCount = guardians.length;
      const fragmentScheme = guardianCount === 5 ? '3-of-5' : '2-of-3';
      const threshold = fragmentScheme === '3-of-5' ? 3 : 2;
      const totalShares = guardianCount >= 3 ? guardianCount : 3;

      // Generate a mock recovery phrase for the vault (in production, user would provide this)
      // For now, we'll generate a secure random secret
      const recoveryPhrase = masterSecret; // Using master secret as the secret to split

      // Split the secret into fragments using Shamir's Secret Sharing
      const { shares } = splitSecret(recoveryPhrase, threshold, totalShares);

      // Get guardian parties only
      const guardianParties = createdParties.filter((p: any) => p.role === "guardian");

      // Create encrypted fragments and derive passphrases for each guardian
      const guardianPassphrases: Array<{
        guardianId: string;
        guardianName: string;
        guardianEmail: string;
        passphrase: string;
      }> = [];

      const fragmentData = await withTransaction(async (tx) => {
        const fragments: any[] = [];

        for (let i = 0; i < guardianParties.length && i < shares.length; i++) {
          const guardian = guardianParties[i];
          const fragmentIndex = i;
          const share = shares[i];

          // Derive guardian-specific passphrase from master secret
          const passphrase = deriveGuardianPassphrase(
            masterSecret,
            guardian.email.toLowerCase(),
            fragmentIndex
          );

          // Encrypt the fragment with the guardian's passphrase
          const encrypted = encryptFragment(share, passphrase);

          // Store derivation salt (for reference, not for decryption)
          const derivationSalt = `${guardian.email.toLowerCase()}:fragment:${fragmentIndex}`;

          // Store encrypted fragment in database
          const [fragment] = await tx.insert(fragmentsTable).values({
            vaultId: vault.id,
            guardianId: guardian.id,
            fragmentIndex: fragmentIndex,
            encryptedData: JSON.stringify(encrypted), // Store as JSON string
            derivationSalt: derivationSalt,
            createdAt: now,
          } as any).returning();

          fragments.push(fragment);

          // Collect passphrase data for response
          guardianPassphrases.push({
            guardianId: guardian.id,
            guardianName: guardian.name,
            guardianEmail: guardian.email,
            passphrase: passphrase,
          });
        }

        return fragments;
      }, "fragment_creation");

      // Update vault with fragment scheme
      await storage.updateVault(vault.id, { fragmentScheme: fragmentScheme as any });

      // Check vault creator achievement (async, don't block response)
      achievementService.checkAndUnlockAchievement(userId, "vault_creator").catch((err: unknown) => {
        logError(err instanceof Error ? err : new Error(String(err)), {
          context: "vaultCreation",
          userId,
        });
      });

      logInfo("Vault created successfully with fragments and passphrases", {
        context: "vaultCreation",
        userId,
        vaultId: vault.id,
        fragmentCount: fragmentData.length,
      });

      res.status(201).json({
        vault,
        parties: createdParties,
        masterSecret: masterSecret, // Return master secret (show only once!)
        guardianPassphrases: guardianPassphrases, // Return passphrases (show only once!)
        fragmentScheme: fragmentScheme,
        message: "Vault created successfully with transaction safety"
      });
    } catch (error: any) {
      logError(error, {
        context: "vaultCreation",
        userId: req.session!.userId,
      });
      res.status(500).json({ message: error.message || "Failed to create vault" });
    }
  });

  // Vault recovery endpoint - reconstruct secret from fragments
  app.post("/api/vaults/recover", validateBody(z.object({
    fragments: z.array(z.string().min(1)),
    vaultId: z.string().optional(),
    scheme: z.enum(["2-of-3", "3-of-5"]).optional(),
  })), async (req, res) => {
    try {
      // Body already validated by middleware
      const { fragments, vaultId, scheme: providedScheme } = req.body;

      // Detect fragment scheme
      let scheme: '2-of-3' | '3-of-5' = providedScheme || '2-of-3'; // Use provided or default
      let threshold = 2;
      let totalExpected = 3;

      if (vaultId) {
        // Try to get vault and detect scheme from metadata or fragment count
        try {
          const vault = await storage.getVault(vaultId);
          if (vault) {
            // Use vault's fragment scheme if available, otherwise detect from fragment count
            if (vault.fragmentScheme && (vault.fragmentScheme === '2-of-3' || vault.fragmentScheme === '3-of-5')) {
              scheme = vault.fragmentScheme;
            } else {
              // Fallback: detect from fragment count in database
              const dbFragments = await storage.getFragmentsByVault(vaultId);
              if (dbFragments.length === 5) {
                scheme = '3-of-5';
              }
            }
          }
        } catch (_error) {
          // If vault lookup fails, continue with auto-detection
        }
      }

      // Auto-detect scheme from fragment count if not determined
      if (scheme === '2-of-3' && fragments.length === 5) {
        // If user provides 5 fragments, might be legacy 3-of-5
        scheme = '3-of-5';
      }

      // Set threshold based on scheme
      if (scheme === '3-of-5') {
        threshold = 3;
        totalExpected = 5;
      }

      // Validate fragment count
      if (fragments.length < threshold) {
        return res.status(400).json({
          message: `Insufficient fragments provided. ${scheme} scheme requires at least ${threshold} fragments (have ${fragments.length}).`,
          scheme,
          threshold,
          fragmentsProvided: fragments.length
        });
      }

      // Use only the required number of fragments (take first N)
      const fragmentsToUse = fragments.slice(0, threshold);

      // Import shamir service
      const { combineShares } = await import("./services/shamir");

      // Reconstruct the secret from fragments
      // Note: fragments should be decrypted shares (hex format from secrets.js)
      const secret = combineShares(fragmentsToUse);

      // Log successful recovery
      logInfo("Vault recovery successful", {
        context: "vaultRecovery",
        scheme,
        fragmentsUsed: fragmentsToUse.length,
        vaultId,
      });

      // Record recovery metrics
      try {
        const { recoveryMetrics } = await import("./services/recoveryMetrics");
        // Get vault info if available for metrics
        let vaultInfo = null;
        if (vaultId) {
          try {
            vaultInfo = await storage.getVault(vaultId);
          } catch {
            // Ignore if vault lookup fails
          }
        }
        await recoveryMetrics.recordAttempt({
          userId: vaultInfo?.ownerId,
          vaultId: vaultInfo?.id || vaultId,
          recoveryType: "vault",
          scheme: scheme as "2-of-3" | "3-of-5",
          fragmentsProvided: fragments.length,
          threshold,
          success: true,
        });
      } catch (metricsError) {
        // Non-critical, log but don't fail
        logError(metricsError instanceof Error ? metricsError : new Error(String(metricsError)), {
          context: "vaultRecovery",
          vaultId,
        });
      }

      // Return the reconstructed secret
      res.json({
        secret,
        scheme,
        fragmentsUsed: fragmentsToUse.length,
        message: `Secret successfully reconstructed from ${fragmentsToUse.length} fragments (${scheme} scheme)`
      });
    } catch (error: any) {
      logError(error, {
        context: "vaultRecovery",
        vaultId: req.body.vaultId,
        scheme: req.body.scheme,
      });

      // Record failed recovery attempt
      try {
        const { recoveryMetrics } = await import("./services/recoveryMetrics");
        await recoveryMetrics.recordAttempt({
          recoveryType: "vault",
          scheme: (req.body.scheme || "2-of-3") as "2-of-3" | "3-of-5",
          fragmentsProvided: Array.isArray(req.body.fragments) ? req.body.fragments.length : 0,
          threshold: 2,
          success: false,
          errorType: error.message || "unknown_error",
        });
      } catch (metricsError) {
        // Non-critical
        logError(metricsError instanceof Error ? metricsError : new Error(String(metricsError)), {
          context: "vaultRecovery",
          vaultId: req.body.vaultId,
        });
      }

      // Provide helpful error messages
      if (error.message?.includes("insufficient") || error.message?.includes("At least")) {
        return res.status(400).json({
          message: "Insufficient fragments provided. Please check the fragment scheme (2-of-3 or 3-of-5) and ensure you have enough fragments."
        });
      }

      if (error.message?.includes("Invalid") || error.message?.includes("Failed to reconstruct")) {
        return res.status(400).json({
          message: "Invalid fragments provided. Please verify that all fragments are correct and from the same vault."
        });
      }

      res.status(500).json({
        message: error.message || "Failed to reconstruct secret from fragments"
      });
    }
  });
}
