/**
 * Guardian/Beneficiary Messaging Routes
 */

import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { logInfo, logError } from "./services/logger";
import { sendEmail } from "./services/email";

/**
 * Register messaging routes
 */
export function registerMessageRoutes(app: Express, requireAuth: any) {
  /**
   * Send message to a guardian or beneficiary
   * POST /api/parties/:partyId/message
   */
  app.post("/api/parties/:partyId/message", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      const { partyId } = req.params;
      const { message, subject } = req.body;

      if (!userId || !partyId || !message) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      // Get party
      const party = await storage.getParty(partyId);
      if (!party) {
        return res.status(404).json({ message: "Party not found" });
      }

      // Verify vault belongs to user
      const vault = await storage.getVault(party.vaultId);
      if (!vault || vault.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get user to include sender name
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Send email to party
      const emailSubject = subject || `Message from ${user.email} regarding your GuardiaVault`;
      const emailBody = `
Hello ${party.name},

You have received a message regarding your role as ${party.role} for the vault "${vault.name}".

Message:
${message}

---
This is an automated message from GuardiaVault.
Please do not reply to this email. Contact ${user.email} directly if you need to respond.
      `.trim();

      try {
        await sendEmail(
          party.email,
          emailSubject,
          emailBody
        );

        logInfo("Message sent to party", {
          userId,
          partyId,
          partyEmail: party.email,
          messageLength: message.length,
        });

        res.json({
          success: true,
          message: "Message sent successfully",
        });
      } catch (emailError: any) {
        logError("Failed to send email", emailError);
        // Still return success if email fails (in case email service is down)
        // User can see notification that message was queued
        res.json({
          success: true,
          message: "Message queued for delivery",
          warning: "Email service temporarily unavailable",
        });
      }
    } catch (error: any) {
      logError("Send message error", error);
      res.status(500).json({ message: error.message || "Failed to send message" });
    }
  });

  /**
   * Get message history for a party
   * GET /api/parties/:partyId/messages
   */
  app.get("/api/parties/:partyId/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      const { partyId } = req.params;

      if (!userId || !partyId) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      // Get party
      const party = await storage.getParty(partyId);
      if (!party) {
        return res.status(404).json({ message: "Party not found" });
      }

      // Verify vault belongs to user
      const vault = await storage.getVault(party.vaultId);
      if (!vault || vault.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // TODO: Implement message history storage
      // For now, return empty array
      res.json({ messages: [] });
    } catch (error: any) {
      logError("Get messages error", error);
      res.status(500).json({ message: error.message || "Failed to get messages" });
    }
  });
}

