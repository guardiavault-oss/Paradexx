/**
 * AI Optimizer Service Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { aiOptimizerService } from "../services/aiOptimizerService";

// Mock OpenAI
vi.mock("openai");

describe("AI Optimizer Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use fallback when OpenAI not configured", async () => {
    // Mock no OpenAI key
    process.env.OPENAI_API_KEY = undefined;

    const recommendation = await aiOptimizerService.getAIRecommendation(
      "user-123",
      "lido",
      "ETH",
      "10000",
      {
        riskTolerance: "moderate",
        investmentHorizon: "medium",
      }
    );

    expect(recommendation).toBeDefined();
    expect(recommendation.recommendedStrategy.length).toBeGreaterThan(0);
    expect(recommendation.confidence).toBeLessThan(100); // Lower confidence for fallback
  });

  it("should provide conservative recommendations", async () => {
    const recommendation = await aiOptimizerService.getAIRecommendation(
      "user-123",
      "lido",
      "ETH",
      "10000",
      {
        riskTolerance: "conservative",
        investmentHorizon: "long",
      }
    );

    expect(recommendation).toBeDefined();
    // Conservative should favor stablecoins
    const stablecoinAllocation = recommendation.recommendedStrategy.find(
      (s) => s.asset === "USDC"
    );
    expect(stablecoinAllocation?.percentage).toBeGreaterThan(50);
  });

  it("should provide aggressive recommendations", async () => {
    const recommendation = await aiOptimizerService.getAIRecommendation(
      "user-123",
      "aave",
      "USDC",
      "10000",
      {
        riskTolerance: "aggressive",
        investmentHorizon: "short",
      }
    );

    expect(recommendation).toBeDefined();
    // Aggressive should favor higher yield
    const highYieldAllocation = recommendation.recommendedStrategy.find(
      (s) => s.protocol === "lido"
    );
    expect(highYieldAllocation?.percentage).toBeGreaterThan(50);
  });

  it("should calculate expected APY", async () => {
    const recommendation = await aiOptimizerService.getAIRecommendation(
      "user-123",
      "lido",
      "ETH",
      "10000",
      {
        riskTolerance: "moderate",
      }
    );

    expect(recommendation.expectedAPY).toBeGreaterThan(0);
    expect(recommendation.expectedAPY).toBeLessThan(10); // Sanity check
  });

  it("should include market analysis", async () => {
    const recommendation = await aiOptimizerService.getAIRecommendation(
      "user-123",
      "lido",
      "ETH",
      "10000",
      {}
    );

    expect(recommendation.marketAnalysis).toBeDefined();
    expect(recommendation.marketAnalysis.length).toBeGreaterThan(0);
  });

  it("should include risk assessment", async () => {
    const recommendation = await aiOptimizerService.getAIRecommendation(
      "user-123",
      "lido",
      "ETH",
      "10000",
      {}
    );

    expect(recommendation.riskAssessment).toBeDefined();
    expect(recommendation.riskAssessment.length).toBeGreaterThan(0);
  });
});

