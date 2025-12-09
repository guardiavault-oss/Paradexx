/**
 * Protocol Health Monitoring Service
 * Real-time monitoring of Lido, Aave, and other protocol health
 */

import axios from "axios";
import { db } from "../db";
import { protocolHealth, type InsertProtocolHealth } from "@shared/schema-extensions";
import { eq, desc } from "../utils/drizzle-exports";
import { logInfo, logError } from "./logger";
import { protocolAPIService } from "./protocolAPIs";

export interface ProtocolHealthStatus {
  protocol: string;
  status: "healthy" | "degraded" | "down";
  apy: number | null;
  tvl: number | null;
  lastChecked: Date;
  alerts: string[];
  healthData: Record<string, any>;
}

export class ProtocolHealthService {
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  /**
   * Check health of all protocols
   */
  async checkAllProtocols(): Promise<ProtocolHealthStatus[]> {
    const protocols = ["lido", "aave"];
    const results: ProtocolHealthStatus[] = [];

    for (const protocol of protocols) {
      try {
        const health = await this.checkProtocolHealth(protocol);
        results.push(health);
        await this.saveProtocolHealth(health);
      } catch (error) {
        logError(error as Error, { context: "checkProtocolHealth", protocol });
        results.push({
          protocol,
          status: "down",
          apy: null,
          tvl: null,
          lastChecked: new Date(),
          alerts: ["Failed to check protocol health"],
          healthData: {},
        });
      }
    }

    return results;
  }

  /**
   * Check health of specific protocol
   */
  async checkProtocolHealth(protocol: string): Promise<ProtocolHealthStatus> {
    const alerts: string[] = [];
    let status: "healthy" | "degraded" | "down" = "healthy";
    let apy: number | null = null;
    let tvl: number | null = null;
    const healthData: Record<string, any> = {};

    try {
      if (protocol === "lido") {
        const result = await this.checkLidoHealth();
        apy = result.apy;
        tvl = result.tvl;
        healthData.lido = result;
        
        if (result.apy < 4.0) {
          alerts.push("Lido APY below normal range");
          status = "degraded";
        }
      } else if (protocol === "aave") {
        const result = await this.checkAaveHealth();
        apy = result.apy;
        tvl = result.tvl;
        healthData.aave = result;
        
        if (result.apy < 3.0) {
          alerts.push("Aave APY below normal range");
          status = "degraded";
        }
      }

      // Get real-time APY
      const apyData = await protocolAPIService.getAllStrategiesAPY();
      const protocolAPY = apyData.find((p) => p.protocol === protocol);
      if (protocolAPY) {
        apy = protocolAPY.apy;
      }

      return {
        protocol,
        status,
        apy,
        tvl,
        lastChecked: new Date(),
        alerts,
        healthData,
      };
    } catch (error) {
      logError(error as Error, { context: "checkProtocolHealth", protocol });
      return {
        protocol,
        status: "down",
        apy: null,
        tvl: null,
        lastChecked: new Date(),
        alerts: ["Protocol health check failed"],
        healthData: {},
      };
    }
  }

  /**
   * Check Lido protocol health
   */
  private async checkLidoHealth(): Promise<{
    apy: number;
    tvl: number | null;
    status: string;
  }> {
    try {
      // Lido stats API
      const response = await axios.get("https://api.lido.fi/v1/steth/stats", {
        timeout: 10000,
      });

      const apyData = await protocolAPIService.getLidoAPY();
      const tvl = response.data?.data?.totalStaked || null;

      return {
        apy: apyData.apy,
        tvl: tvl ? parseFloat(tvl) / 1e18 : null, // Convert from wei
        status: "operational",
      };
    } catch (error) {
      logError(error as Error, { context: "checkLidoHealth" });
      throw error;
    }
  }

  /**
   * Check Aave protocol health
   */
  private async checkAaveHealth(): Promise<{
    apy: number;
    tvl: number | null;
    status: string;
  }> {
    try {
      // Aave API for pool data
      const response = await axios.get(
        "https://aave-api-v3.aave.com/data/pools",
        {
          timeout: 10000,
          params: {
            chainId: process.env.CHAIN_ID || "11155111",
          },
        }
      );

      const apyData = await protocolAPIService.getAaveAPY("USDC");
      // Calculate total TVL from reserves
      const tvl = response.data?.reservesData?.reduce(
        (sum: number, reserve: any) => {
          return sum + parseFloat(reserve.totalLiquidity || "0");
        },
        0
      ) || null;

      return {
        apy: apyData.apy,
        tvl,
        status: "operational",
      };
    } catch (error) {
      logError(error as Error, { context: "checkAaveHealth" });
      throw error;
    }
  }

  /**
   * Save protocol health to database
   */
  private async saveProtocolHealth(health: ProtocolHealthStatus): Promise<void> {
    try {
      const insert: InsertProtocolHealth = {
        protocol: health.protocol,
        status: health.status,
        apy: health.apy ? health.apy.toString() : null,
        tvl: health.tvl ? health.tvl.toString() : null,
        lastChecked: health.lastChecked,
        healthData: health.healthData,
        alerts: health.alerts,
      };

      await db.insert(protocolHealth).values(insert);

      logInfo("Protocol health saved", {
        protocol: health.protocol,
        status: health.status,
      });
    } catch (error) {
      logError(error as Error, { context: "saveProtocolHealth" });
    }
  }

  /**
   * Get latest protocol health
   */
  async getLatestProtocolHealth(
    protocol?: string
  ): Promise<ProtocolHealthStatus[]> {
    try {
      let query = db.select().from(protocolHealth);

      if (protocol) {
        query = query.where(eq(protocolHealth.protocol, protocol)) as any;
      }

      const records = await query.orderBy(desc(protocolHealth.lastChecked)).limit(10);

      return records.map((record) => ({
        protocol: record.protocol,
        status: record.status as "healthy" | "degraded" | "down",
        apy: record.apy ? parseFloat(record.apy) : null,
        tvl: record.tvl ? parseFloat(record.tvl) : null,
        lastChecked: record.lastChecked,
        alerts: (record.alerts as string[]) || [],
        healthData: (record.healthData as Record<string, any>) || {},
      }));
    } catch (error) {
      logError(error as Error, { context: "getLatestProtocolHealth" });
      return [];
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(): void {
    // Initial check
    this.checkAllProtocols();

    // Periodic checks
    setInterval(() => {
      this.checkAllProtocols();
    }, this.CHECK_INTERVAL);
  }
}

export const protocolHealthService = new ProtocolHealthService();

