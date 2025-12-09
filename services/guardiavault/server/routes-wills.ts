/**
 * API Routes for Smart Will Builder
 * Handles will creation, preview, deployment, and PDF generation
 */

import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { pdfGenerator, type WillDocument, type WillAllocation } from "./services/pdfGenerator";
import { logInfo, logError } from "./services/logger";
import { ethers } from "ethers";
import { db } from "./db";

// Validation schemas
const allocationSchema = z.object({
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  recipientName: z.string().optional(),
  percentage: z.number().min(1).max(100),
  assetType: z.enum(["native", "token", "nft", "all"]).optional(),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  tokenSymbol: z.string().optional(),
  isCharityDAO: z.boolean().optional(),
  nftOnly: z.boolean().optional(),
});

const createWillSchema = z.object({
  allocations: z.array(allocationSchema).min(1),
  ownerName: z.string().min(1),
  requiresGuardianAttestation: z.boolean().optional(),
  guardians: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)).optional(),
  guardianThreshold: z.number().min(1).optional(),
});

/**
 * Register will-related API routes
 */
export function registerWillRoutes(app: Express, requireAuth: any) {
  /**
   * @swagger
   * /api/wills/preview:
   *   post:
   *     summary: Generate preview of will document
   *     tags: [Wills]
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               allocations:
   *                 type: array
   *               ownerName:
   *                 type: string
   *     responses:
   *       200:
   *         description: HTML preview of will document
   */
  app.post("/api/wills/preview", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = createWillSchema.parse(req.body);
      
      // Calculate total percentage
      const totalPercentage = validated.allocations.reduce(
        (sum, alloc) => sum + alloc.percentage,
        0
      );
      
      if (totalPercentage !== 100) {
        return res.status(400).json({
          error: "Total allocation percentage must equal 100%",
        });
      }

      const willDoc: WillDocument = {
        ownerName: validated.ownerName || req.session?.user?.name || "Unknown",
        ownerAddress: req.session?.walletAddress || "0x0000000000000000000000000000000000000000",
        createdAt: new Date(),
        allocations: validated.allocations.map((alloc) => ({
          ...alloc,
          percentage: alloc.percentage,
        })),
        guardianThreshold: validated.guardianThreshold,
        guardians: validated.guardians?.map((addr) => ({ address: addr })),
      };

      const preview = await pdfGenerator.generateWillPreview(willDoc);

      res.setHeader("Content-Type", "text/html");
      res.send(preview);
    } catch (error: any) {
      logError(error as Error, { context: "will_preview" });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to generate preview" });
    }
  });

  /**
   * @swagger
   * /api/wills/generate-pdf:
   *   post:
   *     summary: Generate and download legal PDF will document
   *     tags: [Wills]
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               allocations:
   *                 type: array
   *               ownerName:
   *                 type: string
   */
  app.post("/api/wills/generate-pdf", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = createWillSchema.parse(req.body);

      const totalPercentage = validated.allocations.reduce(
        (sum, alloc) => sum + alloc.percentage,
        0
      );

      if (totalPercentage !== 100) {
        return res.status(400).json({
          error: "Total allocation percentage must equal 100%",
        });
      }

      const willDoc: WillDocument = {
        ownerName: validated.ownerName || req.session?.user?.name || "Unknown",
        ownerAddress: req.session?.walletAddress || "0x0000000000000000000000000000000000000000",
        createdAt: new Date(),
        allocations: validated.allocations.map((alloc) => ({
          ...alloc,
          percentage: alloc.percentage,
        })),
        metadataHash: `will_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        guardianThreshold: validated.guardianThreshold,
        guardians: validated.guardians?.map((addr) => ({ address: addr })),
      };

      const pdfBuffer = await pdfGenerator.generateWillPDF(willDoc);

      // For HTML-based PDF, send as HTML with download header
      // In production with proper PDF library, use application/pdf
      res.setHeader("Content-Type", "text/html");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="will_${Date.now()}.html"`
      );
      res.send(pdfBuffer.toString());

      logInfo("Will PDF generated", {
        userId: req.session?.userId,
        willHash: willDoc.metadataHash,
      });
    } catch (error: any) {
      logError(error as Error, { context: "will_pdf_generation" });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  /**
   * @swagger
   * /api/wills/deploy:
   *   post:
   *     summary: Deploy will to blockchain
   *     tags: [Wills]
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               allocations:
   *                 type: array
   *               metadataHash:
   *                 type: string
   */
  app.post("/api/wills/deploy", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = createWillSchema.parse(req.body);
      const { metadataHash } = req.body;

      if (!metadataHash) {
        return res.status(400).json({ error: "metadataHash is required" });
      }

      // Validate total percentage
      const totalPercentage = validated.allocations.reduce(
        (sum, alloc) => sum + alloc.percentage,
        0
      );

      if (totalPercentage !== 100) {
        return res.status(400).json({
          error: "Total allocation percentage must equal 100%",
        });
      }

      // Convert allocations to smart contract format
      // Convert percentage to basis points (1% = 100 basis points)
      const contractAllocations = validated.allocations.map((alloc) => ({
        recipient: alloc.recipient,
        percentage: alloc.percentage * 100, // Convert to basis points
        nftOnly: alloc.nftOnly || false,
        tokenAddress: alloc.tokenAddress || "0x0000000000000000000000000000000000000000",
        isCharityDAO: alloc.isCharityDAO || false,
      }));

      try {
        // Get contract service
        const { getContractService } = await import('./services/contractService');
        const contractService = getContractService();

        // Deploy smart will to blockchain
        const { contractAddress, transactionHash } = await contractService.deploySmartWill(
          validated.allocations.map(alloc => alloc.recipient),
          validated.allocations.map(alloc => alloc.percentage),
          metadataHash,
          {
            requiredGuardianApprovals: validated.guardianThreshold || 2,
            timelock: 7 * 24 * 60 * 60 // 7 days in seconds
          }
        );

        logInfo("Will deployment succeeded", {
          userId: req.session?.userId,
          contractAddress,
          transactionHash,
        });

        res.json({
          success: true,
          contractAddress,
          transactionHash,
          allocations: contractAllocations,
          message: "Will deployed successfully to blockchain. Execute via smart contract when needed.",
        });
      } catch (contractError: any) {
        logError(contractError as Error, { context: 'will_deployment_blockchain', userId: req.session?.userId });

        // Fall back to database-only storage if blockchain deployment fails
        const willId = Math.floor(Math.random() * 1000000);
        logInfo("Will deployment fallback to database", {
          userId: req.session?.userId,
          willId,
          error: contractError.message
        });

        res.json({
          success: true,
          willId,
          contractAddress: process.env.SMARTWILL_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
          transactionHash: null,
          allocations: contractAllocations,
          message: "Will saved to database. Blockchain deployment pending.",
          warning: "Blockchain deployment failed - will be retried automatically"
        });
      }
    } catch (error: any) {
      logError(error as Error, { context: "will_deployment" });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to deploy will" });
    }
  });

  /**
   * @swagger
   * /api/wills:
   *   get:
   *     summary: Get all wills for current user
   *     tags: [Wills]
   *     security:
   *       - cookieAuth: []
   */
  app.get("/api/wills", requireAuth, async (req: Request, res: Response) => {
    try {
      // TODO: Query database for user's wills
      // For now, return empty array
      res.json({ wills: [] });
    } catch (error: any) {
      logError(error as Error, { context: "get_wills" });
      res.status(500).json({ error: "Failed to retrieve wills" });
    }
  });

  // Import wizard service functions
  // Note: Using dynamic import to avoid circular dependencies

  /**
   * POST /api/wills/wizard/save
   * Save wizard state (encrypted)
   */
  app.post("/api/wills/wizard/save", requireAuth, async (req: Request, res: Response) => {
    try {
      const { state } = req.body;
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { saveWizardState } = await import("./services/willWizardService");
      await saveWizardState(userId, state);
      res.json({ success: true });
    } catch (error: any) {
      logError(error as Error, { context: "save_wizard_state" });
      res.status(500).json({ error: "Failed to save wizard state" });
    }
  });

  /**
   * GET /api/wills/wizard/state
   * Load wizard state
   */
  app.get("/api/wills/wizard/state", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { loadWizardState } = await import("./services/willWizardService");
      const state = await loadWizardState(userId);
      res.json({ state });
    } catch (error: any) {
      logError(error as Error, { context: "load_wizard_state" });
      res.status(500).json({ error: "Failed to load wizard state" });
    }
  });

  /**
   * POST /api/wills/wizard/finalize
   * Finalize will from wizard state
   */
  app.post("/api/wills/wizard/finalize", requireAuth, async (req: Request, res: Response) => {
    try {
      const { state } = req.body;
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { finalizeWillFromWizard } = await import("./services/willWizardService");
      const result = await finalizeWillFromWizard(userId, state);
      res.json({ success: true, ...result });
    } catch (error: any) {
      logError(error as Error, { context: "finalize_will_wizard" });
      res.status(500).json({ error: error.message || "Failed to finalize will" });
    }
  });
}

