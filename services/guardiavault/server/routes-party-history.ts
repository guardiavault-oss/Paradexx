/**
 * Party Change History Routes
 * Tracks all changes to guardians and beneficiaries
 */

import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { partyHistory } from "../shared/schema";
import { eq, desc } from "./utils/drizzle-exports";
import { logInfo, logError } from "./services/logger";

/**
 * Track party event in history
 */
async function trackPartyEvent(
  userId: string,
  eventType: string,
  eventData: any,
  req: Request
): Promise<void> {
  await db.insert(partyHistory).values({
    userId,
    eventType,
    eventData: JSON.stringify(eventData),
    metadata: JSON.stringify({
      userAgent: req.get("user-agent"),
      referer: req.get("referer"),
    }),
    ipAddress: req.ip,
    timestamp: new Date(),
  });

  logInfo("Party event tracked", { userId, eventType });
}

/**
 * Register party history routes
 */
export function registerPartyHistoryRoutes(app: Express, requireAuth: any) {
  /**
   * Get change history for a party (guardian or beneficiary)
   * GET /api/parties/:partyId/history
   */
  app.get("/api/parties/:partyId/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      const { partyId } = req.params;

      if (!userId || !partyId) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      // Get party to verify it belongs to user's vault
      const party = await storage.getParty(partyId);
      if (!party) {
        return res.status(404).json({ message: "Party not found" });
      }

      // Verify vault belongs to user
      const vault = await storage.getVault(party.vaultId);
      if (!vault || vault.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Fetch history from database
      const historyRecords = await db
        .select()
        .from(partyHistory)
        .where(eq(partyHistory.userId, userId))
        .orderBy(desc(partyHistory.timestamp))
        .limit(100);

      // Parse JSON data
      const parsedHistory = historyRecords
        .filter((h) => {
          const data = JSON.parse(h.eventData);
          return data.partyId === partyId || data.party?.id === partyId;
        })
        .map((h) => ({
          id: h.id,
          date: h.timestamp,
          eventType: h.eventType,
          eventData: JSON.parse(h.eventData),
          metadata: h.metadata ? JSON.parse(h.metadata) : null,
          ipAddress: h.ipAddress,
        }));

      logInfo("Party history retrieved", { userId, partyId, historyCount: parsedHistory.length });

      res.json({ history: parsedHistory });
    } catch (error: any) {
      logError(error, { context: "party-history-get" });
      res.status(500).json({ message: error.message || "Failed to get history" });
    }
  });

  /**
   * Record a change to a party
   * POST /api/parties/:partyId/history
   */
  app.post("/api/parties/:partyId/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      const { partyId } = req.params;
      const { action, details } = req.body;

      if (!userId || !partyId || !action) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      // Get party to verify it belongs to user's vault
      const party = await storage.getParty(partyId);
      if (!party) {
        return res.status(404).json({ message: "Party not found" });
      }

      // Verify vault belongs to user
      const vault = await storage.getVault(party.vaultId);
      if (!vault || vault.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Store in database
      await trackPartyEvent(
        userId,
        action,
        {
          partyId,
          party: {
            id: party.id,
            name: party.name,
            role: party.role,
          },
          details,
        },
        req
      );

      res.json({ success: true, message: "Change recorded" });
    } catch (error: any) {
      logError(error, { context: "party-history-post" });
      res.status(500).json({ message: error.message || "Failed to record change" });
    }
  });

  /**
   * Get all party history events for user
   * GET /api/party-history
   */
  app.get("/api/party-history", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;

      const historyRecords = await db
        .select()
        .from(partyHistory)
        .where(eq(partyHistory.userId, userId))
        .orderBy(desc(partyHistory.timestamp))
        .limit(100);

      // Parse JSON data
      const parsedHistory = historyRecords.map((h) => ({
        id: h.id,
        date: h.timestamp,
        eventType: h.eventType,
        eventData: JSON.parse(h.eventData),
        metadata: h.metadata ? JSON.parse(h.metadata) : null,
        ipAddress: h.ipAddress,
      }));

      res.json({ success: true, history: parsedHistory });
    } catch (error: any) {
      logError(error, { context: "party-history-all" });
      res.status(500).json({ message: error.message || "Failed to get history" });
    }
  });

  /**
   * Track vault event
   * POST /api/party-history/track
   */
  app.post("/api/party-history/track", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      const { eventType, eventData } = req.body;

      if (!eventType || !eventData) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      await trackPartyEvent(userId, eventType, eventData, req);

      res.json({ success: true, message: "Event tracked" });
    } catch (error: any) {
      logError(error, { context: "party-history-track" });
      res.status(500).json({ message: error.message || "Failed to track event" });
    }
  });
}

// Export tracking function for use in other modules
export { trackPartyEvent };

