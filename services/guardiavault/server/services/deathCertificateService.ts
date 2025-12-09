/**
 * Death Certificate Service
 * Handles death certificate ordering and verification
 */

import axios from "axios";
import FormData from "form-data";
import { db } from "../db";
import { eq } from "../utils/drizzle-exports";
import {
  deathCertificateOrders,
  deathVerificationEvents,
} from "../../shared/schema.death-verification";
import { logInfo, logError, logWarn } from "./logger";

// Death Certificate Sources Configuration
const DEATH_CERT_SOURCES = {
  vitalchek: {
    name: "VitalChek",
    api: process.env.VITALCHEK_API_URL || "https://api.vitalchek.com/v1",
    apiKey: process.env.VITALCHEK_API_KEY,
    coverage: "All 50 US states",
    cost: "$25-50 per certificate",
    turnaround: "2-10 business days",
  },
  // State-specific APIs can be added here
  states: {
    california: {
      api: process.env.CA_VITAL_RECORDS_API || "",
      apiKey: process.env.CA_VITAL_RECORDS_KEY,
      realtime: true,
    },
    texas: {
      api: process.env.TX_VITAL_RECORDS_API || "",
      apiKey: process.env.TX_VITAL_RECORDS_KEY,
      realtime: true,
    },
  },
};

export class DeathCertificateService {
  constructor() {
    this.sources = DEATH_CERT_SOURCES;
  }

  /**
   * Request death certificate verification
   */
  async verifyDeathCertificate(
    user: {
      id: string;
      full_name: string;
      date_of_birth?: Date | string | null;
    },
    deathDate: Date | string,
    deathLocation: string
  ): Promise<{
    found: boolean;
    pending?: boolean;
    orderId?: string;
    estimatedDelivery?: Date;
    trackingUrl?: string;
    certificateUrl?: string;
    error?: string;
  }> {
    logInfo("Requesting death certificate verification", {
      userId: user.id,
      deathLocation,
    });

    try {
      // Determine which state/jurisdiction
      const state = this.extractState(deathLocation);

      if (!state) {
        logWarn("Could not extract state from location", { deathLocation });
        return { found: false, error: "Invalid location" };
      }

      // Check if state has direct API access
      const stateAPI = this.getStateAPI(state);

      if (stateAPI && stateAPI.realtime && stateAPI.apiKey) {
        return await this.queryStateAPI(stateAPI, user, deathDate, state);
      } else {
        // Fallback: Order certificate via VitalChek
        return await this.orderCertificate(state, user, deathDate);
      }
    } catch (error: any) {
      logError(error, { userId: user.id, type: "death_cert_verification" });
      return { found: false, error: error.message };
    }
  }

  /**
   * Query state vital records API directly
   */
  private async queryStateAPI(
    stateAPI: any,
    user: any,
    deathDate: Date | string,
    state: string
  ): Promise<any> {
    try {
      const nameParts = (user.full_name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(-1)[0] || "";

      const response = await axios.post(
        `${stateAPI.api}/death-records/search`,
        {
          firstName,
          lastName,
          dateOfBirth: user.date_of_birth,
          dateOfDeath: deathDate,
          requesterType: "authorized_service",
          purpose: "estate_settlement",
        },
        {
          headers: {
            Authorization: `Bearer ${stateAPI.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      if (response.data?.records && response.data.records.length > 0) {
        const record = response.data.records[0];

        // Store certificate data
        const certificateUrl = record.documentUrl
          ? await this.uploadCertificate(record.documentUrl)
          : null;

        return {
          found: true,
          certificateNumber: record.certificateNumber,
          deathDate: record.deathDate,
          deathLocation: record.deathLocation,
          causeOfDeath: record.causeOfDeath, // May be redacted
          certificateUrl,
          source: state,
          confidence: 1.0, // Official record
        };
      }

      return { found: false };
    } catch (error: any) {
      logError(error, { state, type: "state_api_query" });
      return { found: false, error: error.message };
    }
  }

  /**
   * Order physical certificate via VitalChek
   */
  private async orderCertificate(
    state: string,
    user: any,
    deathDate: Date | string
  ): Promise<any> {
    if (!this.sources.vitalchek.apiKey) {
      logWarn("VitalChek API key not configured");
      return { found: false, error: "VitalChek not configured" };
    }

    try {
      const nameParts = (user.full_name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(-1)[0] || "";

      const response = await axios.post(
        `${this.sources.vitalchek.api}/orders`,
        {
          state: state,
          recordType: "death",
          decedent: {
            firstName,
            lastName,
            dateOfBirth: user.date_of_birth,
            dateOfDeath: deathDate,
          },
          copies: 1,
          deliveryMethod: "digital", // If available
          purpose: "estate_settlement",
          requester: {
            relationship: "executor",
            name: process.env.COMPANY_LEGAL_NAME || "GuardiaVault",
            address: process.env.COMPANY_ADDRESS || "",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.sources.vitalchek.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      const orderId = response.data?.orderId;
      const estimatedDelivery = response.data?.estimatedDelivery;

      if (!orderId) {
        return { found: false, error: "Order creation failed" };
      }

      // Store order tracking info
      await db.insert(deathCertificateOrders).values({
        userId: user.id,
        orderId: orderId,
        vendor: "VitalChek",
        state: state,
        status: "pending",
        estimatedDelivery: estimatedDelivery
          ? new Date(estimatedDelivery)
          : null,
      });

      // Set up webhook for delivery notification
      await this.setupOrderWebhook(orderId);

      logInfo("Death certificate order created", {
        userId: user.id,
        orderId,
        state,
      });

      return {
        found: true,
        pending: true,
        orderId: orderId,
        estimatedDelivery: estimatedDelivery
          ? new Date(estimatedDelivery)
          : null,
        trackingUrl: response.data?.trackingUrl || null,
      };
    } catch (error: any) {
      logError(error, { userId: user.id, type: "certificate_order" });
      return { found: false, error: error.message };
    }
  }

  /**
   * Handle certificate delivery via webhook
   */
  async handleCertificateDelivery(
    orderId: string,
    certificateData: any
  ): Promise<void> {
    try {
      // Find associated user
      const order = await db
        .select()
        .from(deathCertificateOrders)
        .where(eq(deathCertificateOrders.orderId, orderId))
        .limit(1);

      if (!order || order.length === 0) {
        logWarn("Certificate order not found", { orderId });
        return;
      }

      const userId = order[0].userId;

      // Upload certificate to secure storage
      const certificateUrl = await this.uploadCertificate(certificateData);

      // Update order status
      await db
        .update(deathCertificateOrders)
        .set({
          status: "completed",
          deliveredAt: new Date(),
          certificateUrl: certificateUrl,
          updatedAt: new Date(),
        })
        .where(eq(deathCertificateOrders.orderId, orderId));

      // Create verification event
      await db.insert(deathVerificationEvents).values({
        userId,
        source: "death_certificate_official" as any,
        confidenceScore: "1.00", // Official document = 100% confidence
        verificationData: {
          orderId,
          vendor: "VitalChek",
          certificateNumber: certificateData.certificateNumber,
        },
        deathCertificateUrl: certificateUrl,
        status: "confirmed" as any,
        requiresReview: false,
        verifiedBy: "VitalChek",
      });

      logInfo("Death certificate delivered and verified", {
        userId,
        orderId,
        certificateUrl,
      });

      // Trigger consensus check
      await this.triggerConsensusCheck(userId);
    } catch (error: any) {
      logError(error, { orderId, type: "certificate_delivery" });
    }
  }

  /**
   * Upload certificate to secure storage (IPFS or cloud storage)
   */
  private async uploadCertificate(certificateData: any): Promise<string> {
    try {
      // If it's already a URL, return it
      if (typeof certificateData === "string" && certificateData.startsWith("http")) {
        return certificateData;
      }

      // Try to upload to IPFS
      try {
        const ipfsUrl = process.env.IPFS_URL || "https://ipfs.infura.io:5001";
        const projectId = process.env.IPFS_PROJECT_ID;
        const projectSecret = process.env.IPFS_PROJECT_SECRET;

        // Dynamic import of ipfs-http-client
        const { create } = await import("ipfs-http-client");

        let ipfsClient;
        if (projectId && projectSecret) {
          const auth =
            "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");
          ipfsClient = create({
            url: ipfsUrl,
            headers: {
              authorization: auth,
            },
          });
        } else {
          ipfsClient = create({ url: ipfsUrl });
        }

        logInfo("Uploading certificate to IPFS");

        // Convert data to buffer if needed
        let fileBuffer: Buffer;
        if (Buffer.isBuffer(certificateData)) {
          fileBuffer = certificateData;
        } else if (typeof certificateData === "string") {
          fileBuffer = Buffer.from(certificateData);
        } else {
          fileBuffer = Buffer.from(JSON.stringify(certificateData));
        }

        const result = await ipfsClient.add(fileBuffer);
        const ipfsHash = result.path;
        const fileUrl = `https://ipfs.io/ipfs/${ipfsHash}`;

        logInfo("Certificate uploaded to IPFS", { ipfsHash, fileUrl });

        return fileUrl;
      } catch (ipfsError: any) {
        logError(ipfsError, { context: "uploadCertificate_ipfs" });

        // Fallback: Store locally or return placeholder
        logInfo("IPFS upload failed, using fallback storage");
        return `certificate://${Date.now()}`;
      }
    } catch (error: any) {
      logError(error, { type: "certificate_upload" });
      throw error;
    }
  }

  /**
   * Extract state from location string
   */
  private extractState(location: string): string | null {
    if (!location) return null;

    // Extract state code (e.g., "CA", "TX")
    const stateRegex = /\b([A-Z]{2})\b/;
    const match = location.match(stateRegex);

    if (match) {
      return match[1];
    }

    // Extract state name (e.g., "California", "Texas")
    const stateNames: Record<string, string> = {
      california: "CA",
      texas: "TX",
      florida: "FL",
      new_york: "NY",
      // Add more as needed
    };

    const locationLower = location.toLowerCase();
    for (const [name, code] of Object.entries(stateNames)) {
      if (locationLower.includes(name)) {
        return code;
      }
    }

    return null;
  }

  /**
   * Get state API configuration
   */
  private getStateAPI(stateCode: string): any {
    const stateKey = stateCode.toLowerCase();
    const states = this.sources.states as any;
    return states[stateKey];
  }

  /**
   * Setup webhook for order updates
   */
  private async setupOrderWebhook(orderId: string): Promise<void> {
    if (!this.sources.vitalchek.apiKey) return;

    try {
      await axios.post(
        `${this.sources.vitalchek.api}/webhooks`,
        {
          orderId: orderId,
          events: ["order.completed", "order.failed"],
          url: `${process.env.APP_URL || "http://localhost:5000"}/webhooks/vitalchek`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.sources.vitalchek.apiKey}`,
          },
        }
      );

      logInfo("Webhook registered for order", { orderId });
    } catch (error: any) {
      logError(error, { orderId, type: "webhook_setup" });
    }
  }

  /**
   * Trigger consensus check when certificate received
   */
  private async triggerConsensusCheck(userId: string): Promise<void> {
    try {
      // Import consensus engine dynamically to avoid circular dependency
      const { deathConsensusEngine } = await import("./deathConsensusEngine");
      await deathConsensusEngine.checkConsensus(userId);
    } catch (error: any) {
      logError(error, {
        context: "DeathCertificateService.triggerConsensusCheck",
        userId,
      });
    }
  }
  
  /**
   * Enhanced API Integration
   * Automatically orders certificate when death is suspected from other sources
   */
  async autoOrderCertificate(
    userId: string,
    user: { full_name: string; date_of_birth?: Date | string | null },
    suspectedDeathDate?: Date,
    suspectedDeathLocation?: string
  ): Promise<{
    ordered: boolean;
    orderId?: string;
    estimatedDelivery?: Date;
  }> {
    logInfo("Auto-ordering death certificate", {
      userId,
      suspectedDeathDate,
      suspectedDeathLocation,
    });
    
    // Determine location from user's last known location or suspected location
    const deathLocation = suspectedDeathLocation || "Unknown";
    const deathDate = suspectedDeathDate || new Date();
    
    const result = await this.verifyDeathCertificate(user, deathDate, deathLocation);
    
    if (result.pending && result.orderId) {
      return {
        ordered: true,
        orderId: result.orderId,
        estimatedDelivery: result.estimatedDelivery,
      };
    }
    
    return {
      ordered: false,
    };
  }
}

// Export singleton instance as both default and named export
const deathCertificateService = new DeathCertificateService();
export default deathCertificateService;
export { deathCertificateService };

