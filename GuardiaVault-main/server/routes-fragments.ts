/**
 * Fragment and Passphrase Management Routes
 * Handles retrieval of guardian passphrases and fragment information
 */

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { eq, and } from "./utils/drizzle-exports";
import { db } from "./db";
import { fragments, parties, vaults, type Fragment } from "@shared/schema";
import { logInfo, logError } from "./services/logger";
import { deriveGuardianPassphrase, generateSecurePassphrase } from "./services/shamir";
import { validateBody } from "./middleware/validation";

// Auth middleware
function requireAuth(req: Request, res: Response, next: () => void) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

/**
 * Register Fragment and Passphrase routes
 */
export function registerFragmentRoutes(app: Express) {
  /**
   * GET /api/vaults/:vaultId/fragments/passphrases
   * Get guardian passphrases for a vault (requires authentication)
   * Returns passphrases only if user owns the vault
   */
  app.get("/api/vaults/:vaultId/fragments/passphrases", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const vaultId = req.params.vaultId;

      // Verify vault ownership
      const vault = await storage.getVault(vaultId);
      if (!vault || vault.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to access this vault" });
      }

      // Get all guardians for this vault
      const guardians = await storage.getPartiesByRole(vaultId, "guardian");

      if (guardians.length === 0) {
        return res.json({
          guardianPassphrases: [],
          masterSecret: null,
          message: "No guardians found for this vault",
        });
      }

      // Get fragments from database
      const dbFragments = await db
        .select()
        .from(fragments)
        .where(eq(fragments.vaultId, vaultId));

      // Get master secret from vault (if stored)
      // In production, this would be stored securely encrypted
      const masterSecret = (vault as any).masterSecret || null;

      // Generate passphrases for each guardian
      // If masterSecret exists, derive from it; otherwise generate new ones
      const guardianPassphrases = guardians.map((guardian, index) => {
        const fragment = dbFragments.find((f: Fragment) => f.guardianId === guardian.id);
        
        // If fragment exists and has a stored passphrase, use it
        // Otherwise, derive or generate one
        let passphrase: string;
        
        if (fragment && (fragment as any).passphrase) {
          passphrase = (fragment as any).passphrase;
        } else if (masterSecret && guardian.email) {
          // Derive from master secret
          passphrase = deriveGuardianPassphrase(masterSecret, guardian.email, index);
        } else {
          // Generate new secure passphrase (for display purposes only)
          // In production, this should be generated during vault creation
          passphrase = generateSecurePassphrase();
        }

        return {
          guardianId: guardian.id,
          guardianName: guardian.name || "Unknown Guardian",
          guardianEmail: guardian.email || "",
          passphrase,
          fragmentId: fragment?.id || null,
          fragmentIndex: index + 1,
        };
      });

      logInfo("Retrieved guardian passphrases", {
        context: "getPassphrases",
        vaultId,
        guardianCount: guardianPassphrases.length,
        userId,
      });

      res.json({
        guardianPassphrases,
        masterSecret: masterSecret ? (vault as any).masterSecret : null,
        vaultName: vault.name || "My Vault",
        fragmentScheme: vault.fragmentScheme || "2-of-3",
        threshold: vault.fragmentScheme === "3-of-5" ? 3 : 2,
        totalFragments: guardians.length,
      });
    } catch (error: any) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "getPassphrases",
        vaultId: req.params.vaultId,
      });
      res.status(500).json({
        message: "Failed to retrieve passphrases",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  /**
   * GET /api/vaults/:vaultId/fragments
   * Get all fragments for a vault (encrypted data only, no passphrases)
   */
  app.get("/api/vaults/:vaultId/fragments", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const vaultId = req.params.vaultId;

      // Verify vault ownership
      const vault = await storage.getVault(vaultId);
      if (!vault || vault.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to access this vault" });
      }

      // Get fragments from database
      const dbFragments = await db
        .select()
        .from(fragments)
        .where(eq(fragments.vaultId, vaultId));

      // Get guardians to match with fragments
      const guardians = await storage.getPartiesByRole(vaultId, "guardian");

      const fragmentData = dbFragments.map((fragment: Fragment) => {
        const guardian = guardians.find((g) => g.id === fragment.guardianId);
        return {
          id: fragment.id,
          guardianId: fragment.guardianId,
          guardianName: guardian?.name || "Unknown",
          guardianEmail: guardian?.email || "",
          fragmentNumber: fragment.fragmentIndex || 0,
          encryptedData: fragment.encryptedData,
          status: guardian?.status === "active" ? "distributed" : "pending",
          createdAt: fragment.createdAt,
        };
      });

      res.json({
        fragments: fragmentData,
        vaultId,
        fragmentScheme: vault.fragmentScheme || "2-of-3",
        threshold: vault.fragmentScheme === "3-of-5" ? 3 : 2,
        totalFragments: guardians.length,
      });
    } catch (error: any) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "getFragments",
        vaultId: req.params.vaultId,
      });
      res.status(500).json({
        message: "Failed to retrieve fragments",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  /**
   * POST /api/vaults/:vaultId/fragments/generate
   * Generate fragments and passphrases for a vault (called during vault creation)
   * This endpoint should be called after guardians are added
   */
  app.post(
    "/api/vaults/:vaultId/fragments/generate",
    requireAuth,
    validateBody(
      z.object({
        masterSecret: z.string().optional(), // Optional: if not provided, will generate one
        seedPhrase: z.string().optional(), // Optional: seed phrase to split
      })
    ),
    async (req: Request, res: Response) => {
      try {
        const userId = req.session?.userId;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const vaultId = req.params.vaultId;
        const { masterSecret, seedPhrase } = req.body;

        // Verify vault ownership
        const vault = await storage.getVault(vaultId);
        if (!vault || vault.ownerId !== userId) {
          return res.status(403).json({ message: "Not authorized to access this vault" });
        }

        // Get guardians
        const guardians = await storage.getPartiesByRole(vaultId, "guardian");

        if (guardians.length < 2) {
          return res.status(400).json({
            message: "At least 2 guardians required to generate fragments",
          });
        }

        // Determine scheme from guardian count
        const scheme = guardians.length === 5 ? "3-of-5" : "2-of-3";
        const threshold = scheme === "3-of-5" ? 3 : 2;

        // Generate or use provided master secret
        const finalMasterSecret = masterSecret || generateSecurePassphrase();

        // If seedPhrase is provided, split it using Shamir
        if (seedPhrase) {
          const { splitSecret } = await import("./services/shamir");
          const { shares } = splitSecret(seedPhrase, threshold, guardians.length);

          // Encrypt each fragment with guardian-specific passphrase
          const { encryptFragment } = await import("./services/shamir");

          for (let i = 0; i < guardians.length; i++) {
            const guardian = guardians[i];
            const passphrase = deriveGuardianPassphrase(
              finalMasterSecret,
              guardian.email || "",
              i
            );

            const encryptedFragment = encryptFragment(shares[i], passphrase);

            // Store fragment in database
            await db.insert(fragments).values({
              vaultId,
              guardianId: guardian.id,
              fragmentIndex: i + 1,
              encryptedData: JSON.stringify(encryptedFragment),
              createdAt: new Date(),
            } as any);
          }
        }

        // Generate passphrases for all guardians
        const guardianPassphrases = guardians.map((guardian, index) => {
          const passphrase = deriveGuardianPassphrase(
            finalMasterSecret,
            guardian.email || "",
            index
          );

          return {
            guardianId: guardian.id,
            guardianName: guardian.name || "Unknown Guardian",
            guardianEmail: guardian.email || "",
            passphrase,
            fragmentIndex: index + 1,
          };
        });

        // Update vault with master secret (encrypted in production)
        await storage.updateVault(vaultId, {
          fragmentScheme: scheme,
          masterSecret: finalMasterSecret, // In production, encrypt this
        } as any);

        logInfo("Generated fragments and passphrases", {
          context: "generateFragments",
          vaultId,
          guardianCount: guardians.length,
          scheme,
          userId,
        });

        res.json({
          success: true,
          guardianPassphrases,
          masterSecret: finalMasterSecret,
          vaultName: vault.name || "My Vault",
          fragmentScheme: scheme,
          threshold,
          totalFragments: guardians.length,
          message: "Fragments and passphrases generated successfully",
        });
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "generateFragments",
          vaultId: req.params.vaultId,
        });
        res.status(500).json({
          message: "Failed to generate fragments",
          error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    }
  );
}

