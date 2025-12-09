/**
 * Guardian Portal Routes
 * Routes for email-based guardian access without full account creation
 */

import type { Express, Request, Response } from "express";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { generateInviteToken, verifyInviteToken, generateInviteLink, generateOTP, hashEmail } from "./services/invite-tokens";
import { notificationService } from "./services/notifications";
import { sendEmail } from "./services/email";
import { eq, and } from "./utils/drizzle-exports";
import { db } from "./db";
import { parties, vaults, users, guardianReferralDiscounts } from "@shared/schema";
import { logInfo, logError } from "./services/logger";
import { z } from "zod";
import { getTierLimits } from "./services/tierLimits";
import { withTransaction, type Transaction } from "./utils/db";

const inviteGuardianSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  guardianId: z.string().optional(), // For resending invites to existing guardians
});

const acceptInviteSchema = z.object({
  token: z.string(),
  otp: z.string().optional(), // Optional OTP for acceptance
  acceptTerms: z.boolean().refine(val => val === true, "Must accept terms"),
});

const attestActionSchema = z.object({
  token: z.string(),
  claimId: z.string(),
  decision: z.enum(["approve", "reject"]),
});

export function registerGuardianPortalRoutes(app: Express, requireAuth: any) {
  /**
   * Generate guardian invite links (vault owner only)
   * POST /api/vaults/:vaultId/guardians/invite
   */
  app.post("/api/vaults/:vaultId/guardians/invite", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const vaultId = req.params.vaultId;
      const body = inviteGuardianSchema.parse(req.body);

      // Verify vault ownership
      const vault = await storage.getVault(vaultId);
      if (!vault || vault.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to invite guardians to this vault" });
      }

      // Check existing guardians count (max 5)
      const existingGuardians = await storage.getPartiesByRole(vaultId, "guardian");
      
      // If resending to existing guardian (guardianId provided)
      if (body.guardianId) {
        const existingGuardian = existingGuardians.find(g => g.id === body.guardianId);
        if (!existingGuardian) {
          return res.status(404).json({ message: "Guardian not found" });
        }
        if (existingGuardian.status === "active") {
          return res.status(400).json({ message: "Cannot resend invite to active guardian" });
        }

        // Regenerate invite token for existing guardian
        const finalToken = generateInviteToken({
          vaultId,
          partyId: existingGuardian.id,
          email: existingGuardian.email || body.email,
          role: "guardian",
          type: "guardian_portal",
        });

        // Update party with new token and extend expiry
        await storage.updateParty(existingGuardian.id, {
          inviteToken: finalToken,
          inviteExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });

        // Generate invite link
        const inviteLink = generateInviteLink(finalToken);

        // Get vault owner info for email
        const owner = await storage.getUser(vault.ownerId);

        // Send invitation email
        const emailSubject = `You've been invited as a Guardian for ${vault.name || "a Vault"}`;
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ Guardian Invitation</h1>
    </div>
    <div class="content">
      <p>Hello ${existingGuardian.name},</p>
      <p>You have been invited by <strong>${owner?.email || "a vault owner"}</strong> to serve as a Guardian for their digital inheritance vault: <strong>${vault.name}</strong>.</p>
      <p>As a Guardian, you'll help ensure secure access to the vault in the event the owner becomes unavailable.</p>
      <p><strong>No account required!</strong> You can participate using just your email address. You'll only need a wallet address if recovery is needed.</p>
      <div style="text-align: center;">
        <a href="${inviteLink}" class="button">Accept Invitation</a>
      </div>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        Or copy this link: <br>
        <code style="background: #e9e9e9; padding: 5px; border-radius: 3px; word-break: break-all;">${inviteLink}</code>
      </p>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        This invitation expires in 30 days.
      </p>
    </div>
    <div class="footer">
      <p>This is an automated message from GuardiaVault. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
        `;

        const emailText = `
Guardian Invitation

Hello ${existingGuardian.name},

You have been invited by ${owner?.email || "a vault owner"} to serve as a Guardian for their digital inheritance vault: ${vault.name}.

As a Guardian, you'll help ensure secure access to the vault in the event the owner becomes unavailable.

Accept your invitation here: ${inviteLink}

This invitation expires in 30 days.

This is an automated message from GuardiaVault.
        `.trim();

        try {
          await sendEmail(existingGuardian.email || body.email, emailSubject, emailText);
          logInfo("Guardian invitation resent", { vaultId, email: existingGuardian.email, guardianId: existingGuardian.id });
        } catch (emailError: any) {
          logError("Failed to send guardian invitation email", emailError);
          // Continue even if email fails - user can share link manually
        }

        return res.json({
          success: true,
          party: {
            id: existingGuardian.id,
            email: existingGuardian.email,
            name: existingGuardian.name,
            status: existingGuardian.status,
          },
          link: inviteLink,
        });
      }

      // Check tier-based guardian limits
      const subscription = await storage.getActiveSubscription(userId);
      const plan = subscription?.plan || "Free";
      const limits = getTierLimits(plan);

      if (existingGuardians.length >= limits.maxGuardians) {
        return res.status(403).json({
          message: `Your ${plan} plan allows a maximum of ${limits.maxGuardians} guardians. Upgrade your plan to add more guardians.`,
          code: "TIER_LIMIT_EXCEEDED",
          limitType: "guardians",
          plan,
          currentCount: existingGuardians.length,
          maxAllowed: limits.maxGuardians,
        });
      }

      // Check if email already exists as guardian
      const existingGuardian = existingGuardians.find(g => g.email.toLowerCase() === body.email.toLowerCase());
      if (existingGuardian) {
        return res.status(400).json({ message: "This email is already a guardian for this vault" });
      }

      // Create party with pending status
      const inviteToken = generateInviteToken({
        vaultId,
        partyId: "", // Will be set after party creation
        email: body.email,
        role: "guardian",
        type: "guardian_portal",
      });

      const party = await storage.createParty({
        vaultId,
        role: "guardian",
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        inviteToken,
        inviteExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: "pending",
      });

      // Generate new token with partyId
      const finalToken = generateInviteToken({
        vaultId,
        partyId: party.id,
        email: body.email,
        role: "guardian",
        type: "guardian_portal",
      });

      // Update party with final token
      await storage.updateParty(party.id, {
        inviteToken: finalToken,
      });

      // Generate invite link
      const inviteLink = generateInviteLink(finalToken);

      // Get vault owner info for email
      const owner = await storage.getUser(vault.ownerId);

      // Send invitation email
      const emailSubject = `You've been invited as a Guardian for ${vault.name || "a Vault"}`;
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ Guardian Invitation</h1>
    </div>
    <div class="content">
      <p>Hello ${body.name},</p>
      <p>You have been invited by <strong>${owner?.email || "a vault owner"}</strong> to serve as a Guardian for their digital inheritance vault: <strong>${vault.name}</strong>.</p>
      <p>As a Guardian, you'll help ensure secure access to the vault in the event the owner becomes unavailable.</p>
      <p><strong>No account required!</strong> You can participate using just your email address. You'll only need a wallet address if recovery is needed.</p>
      <div style="text-align: center;">
        <a href="${inviteLink}" class="button">Accept Invitation</a>
      </div>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        Or copy this link: <br>
        <code style="background: #e9e9e9; padding: 5px; border-radius: 3px; word-break: break-all;">${inviteLink}</code>
      </p>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        This invitation expires in 30 days.
      </p>
    </div>
    <div class="footer">
      <p>This is an automated message from GuardiaVault. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
      `;

      const emailText = `
Guardian Invitation

Hello ${body.name},

You have been invited by ${owner?.email || "a vault owner"} to serve as a Guardian for their digital inheritance vault: ${vault.name}.

As a Guardian, you'll help ensure secure access to the vault in the event the owner becomes unavailable.

Accept your invitation here: ${inviteLink}

This invitation expires in 30 days.

This is an automated message from GuardiaVault.
      `.trim();

      try {
        await sendEmail(body.email, emailSubject, emailText);
        logInfo("Guardian invitation sent", { vaultId, email: body.email });
      } catch (emailError: any) {
        logError("Failed to send guardian invitation email", emailError);
        // Continue even if email fails - user can share link manually
      }

      res.json({
        success: true,
        party: {
          id: party.id,
          email: party.email,
          name: party.name,
          status: party.status,
        },
        inviteLink,
      });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      logError("Guardian invite error", error);
      res.status(500).json({ message: error.message || "Failed to invite guardian" });
    }
  });

  /**
   * Generate multiple guardian invites at once
   * POST /api/vaults/:vaultId/guardians/invite-bulk
   */
  app.post("/api/vaults/:vaultId/guardians/invite-bulk", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const vaultId = req.params.vaultId;
      const guardians = z.array(inviteGuardianSchema).parse(req.body.guardians || req.body);

      if (guardians.length === 0 || guardians.length > 3) {
        return res.status(400).json({ message: "Must invite 1-3 guardians at once" });
      }

      // Verify vault ownership
      const vault = await storage.getVault(vaultId);
      if (!vault || vault.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const results = [];

      for (const guardianData of guardians) {
        try {
          // Check existing guardians
          const existingGuardians = await storage.getPartiesByRole(vaultId, "guardian");
          if (existingGuardians.length >= 5) {
            results.push({
              email: guardianData.email,
              success: false,
              error: "Maximum guardians reached",
            });
            continue;
          }

          // CRITICAL: Use transaction to ensure atomicity - create party + update token together
          const { party, finalToken } = await withTransaction(async (tx: Transaction) => {
            // Generate initial token
            const inviteToken = generateInviteToken({
              vaultId,
              partyId: "",
              email: guardianData.email,
              role: "guardian",
              type: "guardian_portal",
            });

            // Create party
            const [partyRow] = await tx.insert(parties).values({
              vaultId,
              role: "guardian",
              name: guardianData.name,
              email: guardianData.email,
              phone: guardianData.phone || null,
              inviteToken,
              inviteExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              status: "pending",
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any).returning();

            // Generate final token with party ID
            const finalToken = generateInviteToken({
              vaultId,
              partyId: partyRow.id,
              email: guardianData.email,
              role: "guardian",
              type: "guardian_portal",
            });

            // Update party with final token - all in same transaction
            await tx.update(parties)
              .set({ inviteToken: finalToken, updatedAt: new Date() } as any)
              .where(eq(parties.id, partyRow.id));

            return { party: partyRow, finalToken };
          }, "guardian_invite_creation");
          const inviteLink = generateInviteLink(finalToken);

      // Create referral discount for this guardian
      let discountCode = "";
      try {
        const { randomBytes } = await import("crypto");
        
        // Generate discount code (12 chars, alphanumeric)
        discountCode = randomBytes(6).toString("hex").toUpperCase().slice(0, 12);
        
        await db.insert(guardianReferralDiscounts).values({
          id: randomUUID(),
          partyId: party.id,
          vaultId: vaultId,
          guardianEmail: guardianData.email.toLowerCase(),
          discountCode,
          discountPercentage: 50, // 50% off
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        });
        
        logInfo("Guardian referral discount created", { partyId: party.id, discountCode });
      } catch (discountError: any) {
        logError("Failed to create referral discount", discountError);
        // Don't fail the invitation if discount creation fails
      }

      // Send email (non-blocking)
      const owner = await storage.getUser(vault.ownerId);
      const emailSubject = `Guardian Invitation: ${vault.name}`;
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .discount-box { background: #e8f5e9; border: 2px solid #4caf50; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
    .discount-code { font-size: 24px; font-weight: bold; color: #2e7d32; margin: 10px 0; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ Guardian Invitation</h1>
    </div>
    <div class="content">
      <p>Hello ${guardianData.name},</p>
      <p>You've been invited as a Guardian for the vault: <strong>${vault.name}</strong>.</p>
      <div class="discount-box">
        <p><strong>Special Offer!</strong></p>
        <p>Get <strong>50% OFF</strong> any premium plan when you sign up later!</p>
        <p>Your discount code:</p>
        <div class="discount-code">${discountCode}</div>
        <p style="font-size: 12px; color: #666;">Valid for 1 year</p>
      </div>
      <div style="text-align: center;">
        <a href="${inviteLink}" class="button">Accept Invitation</a>
      </div>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        This invitation expires in 30 days.
      </p>
    </div>
  </div>
</body>
</html>
      `;
      const emailText = `Hello ${guardianData.name},\n\nYou've been invited as a Guardian. Accept: ${inviteLink}\n\nSpecial: Get 50% OFF premium plans! Use code: ${discountCode}`;

      sendEmail(guardianData.email, emailSubject, emailText).catch((err) => {
        logError(`Failed to send invite to ${guardianData.email}`, err);
      });

          results.push({
            email: guardianData.email,
            success: true,
            inviteLink,
          });

        } catch (error: any) {
          results.push({
            email: guardianData.email,
            success: false,
            error: error.message,
          });
        }
      }

      res.json({ results });

    } catch (error: any) {
      logError("Bulk guardian invite error", error);
      res.status(500).json({ message: error.message || "Failed to invite guardians" });
    }
  });

  /**
   * Get guardian portal info from token
   * GET /api/guardian-portal/info?token=...
   */
  app.get("/api/guardian-portal/info", async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(400).json({ message: "Token required" });
      }

      const payload = verifyInviteToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      // Get party and vault info
      const party = await storage.getParty(payload.partyId);
      if (!party) {
        return res.status(404).json({ message: "Guardian invitation not found" });
      }

      // Verify token matches party
      if (party.inviteToken !== token) {
        return res.status(401).json({ message: "Token mismatch" });
      }

      // Check expiry
      if (party.inviteExpiresAt && new Date(party.inviteExpiresAt) < new Date()) {
        return res.status(401).json({ message: "Invitation expired" });
      }

      const vault = await storage.getVault(payload.vaultId);
      if (!vault) {
        return res.status(404).json({ message: "Vault not found" });
      }

      const owner = await storage.getUser(vault.ownerId);

      // Get pending claims that need attestation
      const claims = await storage.listVaultTriggerClaimsByVault(payload.vaultId);
      const pendingClaims = claims.filter(c => c.status === "pending");

      res.json({
        party: {
          id: party.id,
          name: party.name,
          email: party.email,
          status: party.status,
        },
        vault: {
          id: vault.id,
          name: vault.name,
          status: vault.status,
        },
        owner: {
          email: owner?.email,
        },
        pendingClaims: pendingClaims.length,
        hasPendingActions: pendingClaims.length > 0,
      });

    } catch (error: any) {
      logError("Guardian portal info error", error);
      res.status(500).json({ message: error.message || "Failed to get portal info" });
    }
  });

  /**
   * Accept guardian invitation
   * POST /api/guardian-portal/accept
   */
  app.post("/api/guardian-portal/accept", async (req: Request, res: Response) => {
    try {
      const body = acceptInviteSchema.parse(req.body);
      const payload = verifyInviteToken(body.token);

      if (!payload) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      const party = await storage.getParty(payload.partyId);
      if (!party) {
        return res.status(404).json({ message: "Guardian invitation not found" });
      }

      if (party.inviteToken !== body.token) {
        return res.status(401).json({ message: "Token mismatch" });
      }

      if (party.status === "active") {
        return res.status(400).json({ message: "Invitation already accepted" });
      }

      if (party.status === "declined") {
        return res.status(400).json({ message: "Invitation was declined" });
      }

      // Update party to active
      await storage.updateParty(party.id, {
        status: "active",
        acceptedAt: new Date(),
      });

      logInfo("Guardian accepted invitation", { partyId: party.id, email: party.email });

      res.json({
        success: true,
        message: "Invitation accepted successfully",
        party: {
          id: party.id,
          name: party.name,
          email: party.email,
          status: "active",
        },
      });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      logError("Guardian accept error", error);
      res.status(500).json({ message: error.message || "Failed to accept invitation" });
    }
  });

  /**
   * Decline guardian invitation
   * POST /api/guardian-portal/decline
   */
  app.post("/api/guardian-portal/decline", async (req: Request, res: Response) => {
    try {
      const token = z.string().parse(req.body.token);
      const payload = verifyInviteToken(token);

      if (!payload) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      const party = await storage.getParty(payload.partyId);
      if (!party || party.inviteToken !== token) {
        return res.status(404).json({ message: "Guardian invitation not found" });
      }

      await storage.updateParty(party.id, {
        status: "declined",
      });

      logInfo("Guardian declined invitation", { partyId: party.id, email: party.email });

      res.json({
        success: true,
        message: "Invitation declined",
      });

    } catch (error: any) {
      logError("Guardian decline error", error);
      res.status(500).json({ message: error.message || "Failed to decline invitation" });
    }
  });

  /**
   * Approve or reject a claim attestation
   * POST /api/guardian-portal/attest
   */
  app.post("/api/guardian-portal/attest", async (req: Request, res: Response) => {
    try {
      const body = attestActionSchema.parse(req.body);
      const payload = verifyInviteToken(body.token);

      if (!payload || payload.role !== "guardian") {
        return res.status(401).json({ message: "Invalid token or not a guardian" });
      }

      const party = await storage.getParty(payload.partyId);
      if (!party || party.status !== "active") {
        return res.status(403).json({ message: "Guardian not active" });
      }

      // Get claim
      const claim = await storage.getVaultTriggerClaim(body.claimId);
      if (!claim || claim.vaultId !== payload.vaultId) {
        return res.status(404).json({ message: "Claim not found" });
      }

      // Create or update attestation
      await storage.upsertClaimAttestation({
        claimId: body.claimId,
        partyId: party.id,
        role: "guardian",
        decision: body.decision,
        signature: null, // Could add e-signature here
      });

      logInfo("Guardian attestation recorded", {
        partyId: party.id,
        claimId: body.claimId,
        decision: body.decision,
      });

      res.json({
        success: true,
        message: `Claim ${body.decision}d successfully`,
      });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      logError("Guardian attest error", error);
      res.status(500).json({ message: error.message || "Failed to process attestation" });
    }
  });

  /**
   * Get guardian portal dashboard data
   * GET /api/guardian-portal/dashboard?token=...
   */
  app.get("/api/guardian-portal/dashboard", async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(400).json({ message: "Token required" });
      }

      const payload = verifyInviteToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      const party = await storage.getParty(payload.partyId);
      if (!party || party.inviteToken !== token) {
        return res.status(404).json({ message: "Guardian not found" });
      }

      const vault = await storage.getVault(payload.vaultId);
      if (!vault) {
        return res.status(404).json({ message: "Vault not found" });
      }

      // Get pending claims
      const claims = await storage.listVaultTriggerClaimsByVault(payload.vaultId);
      const pendingClaims = claims.filter(c => c.status === "pending");

      // Get guardian's attestations - optimized to avoid N+1 queries
      const claimIds = pendingClaims.map(c => c.id);
      let attestations: Array<{
        claimId: string;
        status: string;
        myDecision: string;
        createdAt: Date;
      }>;
      
      if (claimIds.length > 0 && typeof (storage as any).getAttestationsByClaims === 'function') {
        // Use optimized batch query
        const attestationsMap = await (storage as any).getAttestationsByClaims(claimIds);
        
        attestations = pendingClaims.map((claim) => {
          const atts = attestationsMap.get(claim.id) || [];
          const myAtt = atts.find((a: any) => a.partyId === party.id);
          return {
            claimId: claim.id,
            status: claim.status,
            myDecision: myAtt?.decision || "pending",
            createdAt: claim.createdAt,
          };
        });
      } else {
        // Fallback: use Promise.all (still better than sequential)
        attestations = await Promise.all(
          pendingClaims.map(async (claim) => {
            const atts = await storage.listClaimAttestations(claim.id);
            const myAtt = atts.find(a => a.partyId === party.id);
            return {
              claimId: claim.id,
              status: claim.status,
              myDecision: myAtt?.decision || "pending",
              createdAt: claim.createdAt,
            };
          })
        );
      }

      res.json({
        party: {
          id: party.id,
          name: party.name,
          email: party.email,
          status: party.status,
        },
        vault: {
          id: vault.id,
          name: vault.name,
          status: vault.status,
        },
        pendingActions: attestations,
        totalPendingClaims: pendingClaims.length,
      });

    } catch (error: any) {
      logError("Guardian dashboard error", error);
      res.status(500).json({ message: error.message || "Failed to get dashboard data" });
    }
  });

  /**
   * Contact vault owner (send message)
   * POST /api/guardian-portal/contact-owner
   */
  app.post("/api/guardian-portal/contact-owner", async (req: Request, res: Response) => {
    try {
      const token = z.string().parse(req.body.token);
      const message = z.string().min(1).max(1000).parse(req.body.message);

      const payload = verifyInviteToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const party = await storage.getParty(payload.partyId);
      if (!party) {
        return res.status(404).json({ message: "Guardian not found" });
      }

      const vault = await storage.getVault(payload.vaultId);
      if (!vault) {
        return res.status(404).json({ message: "Vault not found" });
      }

      const owner = await storage.getUser(vault.ownerId);
      if (!owner) {
        return res.status(404).json({ message: "Owner not found" });
      }

      // Send email to owner
      const emailSubject = `Message from Guardian: ${party.name}`;
      const emailText = `
Message from Guardian ${party.name} (${party.email}) regarding vault "${vault.name}":

${message}

---

You can respond to ${party.email} directly.
      `.trim();

      try {
        await sendEmail(owner.email, emailSubject, emailText);
        logInfo("Guardian contacted owner", { partyId: party.id, ownerId: owner.id });
      } catch (emailError: any) {
        logError("Failed to send contact email", emailError);
        return res.status(500).json({ message: "Failed to send message" });
      }

      res.json({
        success: true,
        message: "Message sent to vault owner",
      });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      logError("Contact owner error", error);
      res.status(500).json({ message: error.message || "Failed to send message" });
    }
  });

  /**
   * Verify and apply guardian referral discount code
   * GET /api/guardian-portal/discount/:code
   */
  app.get("/api/guardian-portal/discount/:code", async (req: Request, res: Response) => {
    try {
      const code = req.params.code.toUpperCase();

      const discount = await db.query.guardianReferralDiscounts.findFirst({
        where: eq(guardianReferralDiscounts.discountCode, code),
      });

      if (!discount) {
        return res.status(404).json({ message: "Discount code not found" });
      }

      if (discount.used) {
        return res.status(400).json({ message: "Discount code already used" });
      }

      if (new Date(discount.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Discount code expired" });
      }

      res.json({
        valid: true,
        discountPercentage: discount.discountPercentage,
        expiresAt: discount.expiresAt,
      });

    } catch (error: any) {
      logError("Discount verification error", error);
      res.status(500).json({ message: error.message || "Failed to verify discount" });
    }
  });

  /**
   * Apply guardian referral discount (mark as used)
   * POST /api/guardian-portal/discount/:code/apply
   */
  app.post("/api/guardian-portal/discount/:code/apply", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const code = req.params.code.toUpperCase();

      const discount = await db.query.guardianReferralDiscounts.findFirst({
        where: eq(guardianReferralDiscounts.discountCode, code),
      });

      if (!discount) {
        return res.status(404).json({ message: "Discount code not found" });
      }

      if (discount.used) {
        return res.status(400).json({ message: "Discount code already used" });
      }

      if (new Date(discount.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Discount code expired" });
      }

      // Mark as used
      await db.update(guardianReferralDiscounts)
        .set({
          used: true,
          usedByUserId: userId,
          usedAt: new Date(),
        })
        .where(eq(guardianReferralDiscounts.id, discount.id));

      logInfo("Guardian referral discount applied", { code, userId });

      res.json({
        success: true,
        discountPercentage: discount.discountPercentage,
        message: "Discount applied successfully",
      });

    } catch (error: any) {
      logError("Discount apply error", error);
      res.status(500).json({ message: error.message || "Failed to apply discount" });
    }
  });
}

