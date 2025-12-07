/**
 * Security Fixes Middleware
 * Comprehensive security and edge case handling
 */

import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { logWarn, logError, logInfo } from "../services/logger";

/**
 * Validate minimum guardian count before deletion
 */
export async function validateMinimumGuardians(
  vaultId: string,
  role: "guardian" | "beneficiary",
  isDeletion: boolean = false
): Promise<{ valid: boolean; message?: string }> {
  try {
    if (role === "guardian") {
      const parties = await storage.getPartiesByVault(vaultId);
      const activeGuardians = parties.filter(
        (p) => p.role === "guardian" && p.status === "active"
      );

      // Detect scheme from vault
      const vault = await storage.getVault(vaultId);
      if (!vault) {
        return { valid: false, message: "Vault not found" };
      }

      const scheme = vault.fragmentScheme || "2-of-3";
      const minRequired = scheme === "2-of-3" ? 3 : 5; // 2-of-3 needs 3, 3-of-5 needs 5

      if (isDeletion && activeGuardians.length <= minRequired) {
        return {
          valid: false,
          message: `Cannot remove guardian. ${scheme} scheme requires minimum ${minRequired} active guardians. Currently have ${activeGuardians.length}.`,
        };
      }

      // For additions, check if adding would exceed maximum
      // 2-of-3 can have 3-5, 3-of-5 needs exactly 5
      const maxAllowed = scheme === "2-of-3" ? 5 : 5;
      if (!isDeletion && activeGuardians.length >= maxAllowed) {
        return {
          valid: false,
          message: `Maximum ${maxAllowed} guardians allowed for ${scheme} scheme.`,
        };
      }
    }

    return { valid: true };
  } catch (error: any) {
    logError("Guardian validation error", error);
    return { valid: false, message: "Validation failed" };
  }
}

/**
 * Prevent vault modifications during active recovery
 */
export async function checkVaultLockStatus(
  vaultId: string
): Promise<{ locked: boolean; reason?: string }> {
  try {
    const vault = await storage.getVault(vaultId);
    if (!vault) {
      return { locked: false };
    }

    // Lock if vault is in triggered state (recovery in progress)
    if (vault.status === "triggered") {
      return {
        locked: true,
        reason: "Vault is in triggered state. Modifications disabled during recovery.",
      };
    }

    return { locked: false };
  } catch (error: any) {
    logError("Vault lock check error", error);
    return { locked: false };
  }
}

/**
 * Validate duplicate party prevention
 */
export async function checkDuplicateParty(
  vaultId: string,
  email: string,
  role: "guardian" | "beneficiary" | "attestor"
): Promise<{ isDuplicate: boolean; existingParty?: any }> {
  try {
    const parties = await storage.getPartiesByVault(vaultId);
    const existing = parties.find(
      (p) => p.email.toLowerCase() === email.toLowerCase() && p.role === role
    );

    return {
      isDuplicate: !!existing,
      existingParty: existing || undefined,
    };
  } catch (error: any) {
    logError("Duplicate party check error", error);
    return { isDuplicate: false };
  }
}

/**
 * Middleware: Validate guardian operations
 */
export async function validateGuardianOperation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { vaultId, partyId } = req.params;
    const operation = req.method.toLowerCase();

    if (operation === "delete" || operation === "patch") {
      // Get party to check role
      const party = partyId ? await storage.getParty(partyId) : null;
      if (party && party.role === "guardian") {
        const validation = await validateMinimumGuardians(
          party.vaultId,
          "guardian",
          true
        );
        if (!validation.valid) {
          return res.status(400).json({
            message: validation.message || "Cannot remove guardian",
          });
        }
      }

      // Check vault lock status
      const vaultLock = await checkVaultLockStatus(
        party?.vaultId || vaultId || ""
      );
      if (vaultLock.locked) {
        return res.status(423).json({
          message: vaultLock.reason || "Vault is locked",
          code: "VAULT_LOCKED",
        });
      }
    }

    next();
  } catch (error: any) {
    logError("Guardian operation validation error", error);
    res.status(500).json({ message: "Validation failed" });
  }
}

/**
 * Middleware: Validate party creation (prevent duplicates)
 */
export async function validatePartyCreation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { vaultId } = req.params;
    const { email, role } = req.body;

    if (!email || !role || !vaultId) {
      return next(); // Let route handler validate required fields
    }

    const duplicateCheck = await checkDuplicateParty(
      vaultId,
      email,
      role as "guardian" | "beneficiary" | "attestor"
    );

    if (duplicateCheck.isDuplicate) {
      return res.status(409).json({
        message: `A ${role} with email ${email} already exists for this vault`,
        code: "DUPLICATE_PARTY",
      });
    }

    // Validate guardian count for guardians
    if (role === "guardian") {
      const validation = await validateMinimumGuardians(vaultId, "guardian", false);
      if (!validation.valid) {
        return res.status(400).json({
          message: validation.message || "Cannot add guardian",
        });
      }
    }

    next();
  } catch (error: any) {
    logError("Party creation validation error", error);
    res.status(500).json({ message: "Validation failed" });
  }
}

/**
 * Enhanced error handler with security considerations
 */
export function secureErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Don't leak sensitive information in production
  const isDevelopment = process.env.NODE_ENV === "development";

  // Log error securely
  logError(err, {
    path: req.path,
    method: req.method,
    userId: req.session?.userId,
  });

  // Prevent error messages from leaking SQL structure
  let message = "An error occurred";
  let statusCode = 500;

  if (err.name === "ZodError") {
    statusCode = 400;
    message = "Validation error";
  } else if (err.message?.includes("not found")) {
    statusCode = 404;
    message = "Resource not found";
  } else if (err.message?.includes("unauthorized") || err.message?.includes("Unauthorized")) {
    statusCode = 401;
    message = "Unauthorized";
  } else if (err.message?.includes("forbidden") || err.message?.includes("Forbidden")) {
    statusCode = 403;
    message = "Forbidden";
  } else if (isDevelopment && err.message) {
    message = err.message;
  }

  res.status(statusCode).json({
    message,
    ...(isDevelopment && {
      error: err.message,
      stack: err.stack,
    }),
  });
}

