/**
 * Legacy Messages Service
 * Manages video messages and letters for delivery to beneficiaries
 */

import { db } from "../db";
import {
  legacyMessages,
  insertLegacyMessageSchema,
  type InsertLegacyMessage,
} from "@shared/schema";
import { eq, and, desc } from "../utils/drizzle-exports";
import { logInfo, logError } from "./logger";
import { getUploadUrl } from "./s3";
import crypto from "crypto";

export class LegacyMessagesService {
  /**
   * Create a legacy message (video or letter)
   */
  async createMessage(
    message: Omit<InsertLegacyMessage, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      if (!db) {
        logError(new Error("Database not available"), {
          context: "LegacyMessagesService.createMessage",
        });
        throw new Error("Database not available");
      }

      const validated = insertLegacyMessageSchema.parse(message);
      const result = await db
        .insert(legacyMessages)
        .values({
          ...validated,
          updatedAt: new Date(),
        })
        .returning({ id: legacyMessages.id });

      const messageId = result[0]?.id;
      if (!messageId) {
        throw new Error("Failed to create legacy message");
      }

      logInfo("Legacy message created", {
        messageId,
        vaultId: message.vaultId,
        type: message.type,
      });

      return messageId;
    } catch (error: any) {
      logError(error, {
        context: "LegacyMessagesService.createMessage",
        vaultId: message.vaultId,
      });
      throw error;
    }
  }

  /**
   * Get upload URL for video file
   */
  async getVideoUploadUrl(
    vaultId: string,
    fileName: string,
    contentType: string
  ): Promise<{ uploadUrl: string; fileHash: string }> {
    try {
      // Generate a unique file path
      const timestamp = Date.now();
      const randomId = crypto.randomBytes(8).toString("hex");
      const filePath = `legacy-messages/${vaultId}/${timestamp}-${randomId}-${fileName}`;

      // Get presigned upload URL from S3
      const uploadUrl = await getUploadUrl(filePath, contentType);

      // Calculate expected hash (client should provide actual hash after upload)
      const fileHash = crypto
        .createHash("sha256")
        .update(`${filePath}-${timestamp}`)
        .digest("hex");

      return { uploadUrl, fileHash };
    } catch (error: any) {
      logError(error, {
        context: "LegacyMessagesService.getVideoUploadUrl",
        vaultId,
      });
      throw error;
    }
  }

  /**
   * Update message with file URL after upload
   */
  async updateMessageFile(
    messageId: string,
    fileUrl: string,
    fileHash: string
  ): Promise<boolean> {
    try {
      if (!db) {
        return false;
      }

      await db
        .update(legacyMessages)
        .set({
          fileUrl,
          fileHash,
          updatedAt: new Date(),
        })
        .where(eq(legacyMessages.id, messageId));

      logInfo("Legacy message file updated", { messageId, fileUrl });
      return true;
    } catch (error: any) {
      logError(error, {
        context: "LegacyMessagesService.updateMessageFile",
        messageId,
      });
      return false;
    }
  }

  /**
   * Get messages for a vault
   */
  async getVaultMessages(vaultId: string): Promise<
    typeof legacyMessages.$inferSelect[]
  > {
    try {
      if (!db) {
        return [];
      }

      const messages = await db
        .select()
        .from(legacyMessages)
        .where(eq(legacyMessages.vaultId, vaultId))
        .orderBy(desc(legacyMessages.createdAt));

      return messages;
    } catch (error: any) {
      logError(error, {
        context: "LegacyMessagesService.getVaultMessages",
        vaultId,
      });
      return [];
    }
  }

  /**
   * Get messages for a specific beneficiary
   */
  async getBeneficiaryMessages(
    beneficiaryId: string
  ): Promise<typeof legacyMessages.$inferSelect[]> {
    try {
      if (!db) {
        return [];
      }

      const messages = await db
        .select()
        .from(legacyMessages)
        .where(eq(legacyMessages.beneficiaryId, beneficiaryId))
        .orderBy(desc(legacyMessages.createdAt));

      return messages;
    } catch (error: any) {
      logError(error, {
        context: "LegacyMessagesService.getBeneficiaryMessages",
        beneficiaryId,
      });
      return [];
    }
  }

  /**
   * Get messages ready for delivery (when vault is triggered)
   */
  async getReadyMessages(vaultId: string): Promise<
    typeof legacyMessages.$inferSelect[]
  > {
    try {
      if (!db) {
        return [];
      }

      const messages = await db
        .select()
        .from(legacyMessages)
        .where(
          and(
            eq(legacyMessages.vaultId, vaultId),
            eq(legacyMessages.status, "ready")
          )
        )
        .orderBy(desc(legacyMessages.createdAt));

      return messages;
    } catch (error: any) {
      logError(error, {
        context: "LegacyMessagesService.getReadyMessages",
        vaultId,
      });
      return [];
    }
  }

  /**
   * Mark message as delivered
   */
  async markDelivered(messageId: string): Promise<boolean> {
    try {
      if (!db) {
        return false;
      }

      await db
        .update(legacyMessages)
        .set({
          status: "delivered",
          deliveredAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(legacyMessages.id, messageId));

      logInfo("Legacy message marked as delivered", { messageId });
      return true;
    } catch (error: any) {
      logError(error, {
        context: "LegacyMessagesService.markDelivered",
        messageId,
      });
      return false;
    }
  }

  /**
   * Mark messages as ready for delivery when vault triggers
   */
  async markReadyForDelivery(vaultId: string): Promise<number> {
    try {
      if (!db) {
        return 0;
      }

      const result = await db
        .update(legacyMessages)
        .set({
          status: "ready",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(legacyMessages.vaultId, vaultId),
            eq(legacyMessages.status, "draft")
          )
        )
        .returning({ id: legacyMessages.id });

      const count = result.length;
      logInfo("Legacy messages marked ready for delivery", {
        vaultId,
        count,
      });

      return count;
    } catch (error: any) {
      logError(error, {
        context: "LegacyMessagesService.markReadyForDelivery",
        vaultId,
      });
      return 0;
    }
  }

  /**
   * Update message
   */
  async updateMessage(
    messageId: string,
    updates: Partial<
      Pick<
        InsertLegacyMessage,
        "title" | "content" | "status" | "scheduledDeliveryDate"
      >
    >
  ): Promise<boolean> {
    try {
      if (!db) {
        return false;
      }

      await db
        .update(legacyMessages)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(legacyMessages.id, messageId));

      logInfo("Legacy message updated", { messageId });
      return true;
    } catch (error: any) {
      logError(error, {
        context: "LegacyMessagesService.updateMessage",
        messageId,
      });
      return false;
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      if (!db) {
        return false;
      }

      await db
        .delete(legacyMessages)
        .where(eq(legacyMessages.id, messageId));

      logInfo("Legacy message deleted", { messageId });
      return true;
    } catch (error: any) {
      logError(error, {
        context: "LegacyMessagesService.deleteMessage",
        messageId,
      });
      return false;
    }
  }
}

export const legacyMessagesService = new LegacyMessagesService();

