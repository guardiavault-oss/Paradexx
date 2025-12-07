/**
 * Protocol Health Service Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { protocolHealthService } from "../services/protocolHealthService";
import axios from "axios";
import { protocolAPIService } from "../services/protocolAPIs";

// Mock axios for API calls
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
  get: vi.fn(),
}));

// Mock protocolAPIService
vi.mock("../services/protocolAPIs", () => ({
  protocolAPIService: {
    getLidoAPY: vi.fn(),
    getAaveAPY: vi.fn(),
    getAllStrategiesAPY: vi.fn(),
  },
}));

// Mock database
vi.mock("../db", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    })),
  },
}));

describe("Protocol Health Service", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup default successful axios responses
    // Service uses axios.get() directly
    const axios = await import("axios");
    vi.mocked(axios.get).mockResolvedValue({
      data: { 
        data: { 
          apy: 5.2,
          smaApr: 5.2,
          apr: 5.2,
          totalStaked: "1000000000000000000000", // 1000 ETH in wei
          reservesData: [{ totalLiquidity: "1000000000" }]
        } 
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });

    // Mock protocolAPIService
    vi.mocked(protocolAPIService.getLidoAPY).mockResolvedValue({
      protocol: "lido",
      asset: "ETH",
      apy: 5.2,
      timestamp: new Date(),
      source: "api",
    });

    vi.mocked(protocolAPIService.getAaveAPY).mockResolvedValue({
      protocol: "aave",
      asset: "USDC",
      apy: 4.1,
      timestamp: new Date(),
      source: "api",
    });

    vi.mocked(protocolAPIService.getAllStrategiesAPY).mockResolvedValue([
      {
        protocol: "lido",
        asset: "ETH",
        apy: 5.2,
        timestamp: new Date(),
        source: "api",
      },
      {
        protocol: "aave",
        asset: "USDC",
        apy: 4.1,
        timestamp: new Date(),
        source: "api",
      },
    ]);
  });

  it("should check Lido protocol health", async () => {
    const health = await protocolHealthService.checkProtocolHealth("lido");

    expect(health).toBeDefined();
    expect(health.protocol).toBe("lido");
    expect(health.status).toMatch(/healthy|degraded|down/);
  });

  it("should check Aave protocol health", async () => {
    const health = await protocolHealthService.checkProtocolHealth("aave");

    expect(health).toBeDefined();
    expect(health.protocol).toBe("aave");
    expect(health.status).toMatch(/healthy|degraded|down/);
  });

  it("should return health metrics", async () => {
    const health = await protocolHealthService.checkProtocolHealth("lido");

    // ProtocolHealthStatus has apy and tvl directly
    expect(health).toBeDefined();
    expect(health.apy).toBeDefined();
    if (health.apy !== null) {
      expect(health.apy).toBeGreaterThan(0);
    }
    expect(health.tvl).toBeDefined();
    if (health.tvl !== null) {
      expect(health.tvl).toBeGreaterThan(0);
    }
  });

  it("should handle API failures gracefully", async () => {
    // Mock API failure
    const axios = await import("axios");
    vi.mocked(axios.get).mockRejectedValueOnce(new Error("API Error"));
    // Also mock protocolAPIService to fail
    vi.mocked(protocolAPIService.getLidoAPY).mockRejectedValueOnce(new Error("API Error"));

    const health = await protocolHealthService.checkProtocolHealth("lido");

    expect(health.status).toBe("down");
    expect(health.alerts.length).toBeGreaterThan(0);
  });
});

