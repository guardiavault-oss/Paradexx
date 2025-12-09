/**
 * Evidence Upload API Routes
 * Handles file uploads for recovery cases and will attestations
 */

import type { Express, Request, Response } from "express";
import multer from "multer";
import crypto from "crypto";
import { z } from "zod";
import { logInfo, logError } from "./services/logger";
import { getUploadUrl } from "./services/s3";
import { db } from "./db";
import { claimFiles } from "@shared/schema";
import { eq } from "./utils/drizzle-exports";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

const uploadSchema = z.object({
  caseId: z.string().uuid().optional(),
  willId: z.string().uuid().optional(),
  claimId: z.string().uuid().optional(),
});

/**
 * Compute SHA-256 hash of file buffer
 */
function computeSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Register evidence upload routes
 */
export function registerEvidenceRoutes(app: Express, requireAuth: any) {
  /**
   * POST /api/evidence/upload
   * Upload evidence file for recovery case or will attestation
   */
  app.post(
    "/api/evidence/upload",
    requireAuth,
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const validated = uploadSchema.parse(req.body);
        const userId = req.session?.userId;
        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const file = req.file;
        const hash = computeSha256(file.buffer);
        
        // Determine upload path based on context
        let s3Key: string;
        if (validated.claimId) {
          s3Key = `evidence/claims/${validated.claimId}/${Date.now()}_${file.originalname}`;
        } else if (validated.willId) {
          s3Key = `evidence/wills/${validated.willId}/${Date.now()}_${file.originalname}`;
        } else if (validated.caseId) {
          s3Key = `evidence/cases/${validated.caseId}/${Date.now()}_${file.originalname}`;
        } else {
          s3Key = `evidence/general/${userId}/${Date.now()}_${file.originalname}`;
        }

        // Upload to S3 (or simulated)
        const uploadResult = await getUploadUrl({
          bucket: process.env.AWS_S3_BUCKET || "guardiavault-evidence",
          key: s3Key,
          contentType: file.mimetype,
          expiresSec: 3600, // 1 hour
        });

        // TODO: Actually upload file to S3 using signed URL
        // For now, store metadata in database
        let fileRecordId: string | null = null;
        
        if (validated.claimId) {
          const [fileRecord] = await db
            .insert(claimFiles)
            .values({
              claimId: validated.claimId,
              fileName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              sha256: hash,
            })
            .returning();
          fileRecordId = fileRecord.id;
        }

        logInfo("Evidence file uploaded", {
          userId,
          fileHash: hash,
          s3Key,
          claimId: validated.claimId,
          willId: validated.willId,
        });

        res.json({
          success: true,
          fileId: fileRecordId,
          fileHash: hash,
          s3Key,
          uploadUrl: uploadResult.url,
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        });
      } catch (error: any) {
        logError(error as Error, { context: "evidence_upload" });
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: "Validation error", details: error.errors });
        }
        res.status(500).json({ error: error.message || "Failed to upload evidence" });
      }
    }
  );

  /**
   * GET /api/evidence/:fileId
   * Get evidence file metadata
   */
  app.get("/api/evidence/:fileId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { fileId } = req.params;
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Query file record
      const fileRecord = await db
        .select()
        .from(claimFiles)
        .where(eq(claimFiles.id, fileId))
        .limit(1);

      if (fileRecord.length === 0) {
        return res.status(404).json({ error: "File not found" });
      }

      res.json({ file: fileRecord[0] });
    } catch (error: any) {
      logError(error as Error, { context: "get_evidence_file" });
      res.status(500).json({ error: "Failed to retrieve file" });
    }
  });
}

