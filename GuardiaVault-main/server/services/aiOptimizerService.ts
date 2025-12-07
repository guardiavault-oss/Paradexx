/**
 * AI Optimizer Service
 * OpenAI integration for intelligent yield strategy recommendations
 */

import { logInfo, logError } from "./logger";
import { protocolAPIService } from "./protocolAPIs";
import { enhancedYieldService } from "./enhancedYieldService";

// Lazy import types for OpenAI - using instance type
type OpenAI = InstanceType<typeof import("openai").default>;

interface MarketContext {
  currentAPY: {
    lido: number;
    aaveUSDC: number;
    aaveETH: number;
    compound?: number;
    yearn?: number;
  };
  marketConditions: {
    volatility: "low" | "medium" | "high";
    trend: "bullish" | "bearish" | "neutral";
    riskLevel: "low" | "medium" | "high";
  };
  userProfile: {
    riskTolerance: "conservative" | "moderate" | "aggressive";
    investmentHorizon: "short" | "medium" | "long";
    currentBalance: string;
    goals: string[];
  };
}

interface AIRecommendation {
  recommendedStrategy: {
    protocol: string;
    asset: string;
    percentage: number;
    reasoning: string;
  }[];
  alternativeStrategies: Array<{
    protocol: string;
    asset: string;
    percentage: number;
    reasoning: string;
    risk: string;
  }>;
  marketAnalysis: string;
  riskAssessment: string;
  expectedAPY: number;
  confidence: number; // 0-100
}

export class AIOptimizerService {
  private openai: OpenAI | null = null;
  private openaiInitialized = false;

  /**
   * Lazy initialization of OpenAI client
   * This prevents shim import conflicts by only importing when needed
   */
  private async initializeOpenAI(): Promise<OpenAI | null> {
    if (this.openaiInitialized) {
      return this.openai;
    }

    this.openaiInitialized = true;

    if (!process.env.OPENAI_API_KEY) {
      logInfo("OpenAI API key not configured. AI optimizer will use fallback recommendations.", {});
      return null;
    }

    try {
      // Lazy import: Only import OpenAI shims and client when actually needed
      await import("openai/shims/node");
      const { default: OpenAI } = await import("openai");
      
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      return this.openai;
    } catch (error) {
      logError(error as Error, { context: "initializeOpenAI" });
      return null;
    }
  }

  /**
   * Get AI-powered yield strategy recommendation
   */
  async getAIRecommendation(
    userId: string,
    currentProtocol: string,
    currentAsset: string,
    currentBalance: string,
    userProfile: {
      riskTolerance?: "conservative" | "moderate" | "aggressive";
      investmentHorizon?: "short" | "medium" | "long";
      goals?: string[];
    }
  ): Promise<AIRecommendation> {
    try {
      // Get real-time APY data
      const strategies = await protocolAPIService.getAllStrategiesAPY();
      const currentAPY = strategies.find(
        (s) => s.protocol === currentProtocol && s.asset === currentAsset
      );

      // Build market context
      const marketContext: MarketContext = {
        currentAPY: {
          lido: strategies.find((s) => s.protocol === "lido")?.apy || 5.2,
          aaveUSDC: strategies.find((s) => s.protocol === "aave" && s.asset === "USDC")?.apy || 4.1,
          aaveETH: strategies.find((s) => s.protocol === "aave" && s.asset === "ETH")?.apy || 3.8,
        },
        marketConditions: {
          volatility: "medium", // TODO: Get from market data API
          trend: "neutral",
          riskLevel: "low",
        },
        userProfile: {
          riskTolerance: userProfile.riskTolerance || "moderate",
          investmentHorizon: userProfile.investmentHorizon || "medium",
          currentBalance,
          goals: userProfile.goals || [],
        },
      };

      // If OpenAI is available, use it for intelligent recommendations
      const openai = await this.initializeOpenAI();
      if (openai) {
        return await this.getOpenAIRecommendation(marketContext, currentProtocol, currentAsset);
      }

      // Fallback to rule-based recommendations
      return this.getFallbackRecommendation(marketContext, currentProtocol, currentAsset);
    } catch (error) {
      logError(error as Error, { context: "getAIRecommendation", userId });
      // Always return fallback if AI fails
      return this.getFallbackRecommendation(
        {
          currentAPY: { lido: 5.2, aaveUSDC: 4.1, aaveETH: 3.8 },
          marketConditions: { volatility: "medium", trend: "neutral", riskLevel: "low" },
          userProfile: {
            riskTolerance: "moderate",
            investmentHorizon: "medium",
            currentBalance,
            goals: [],
          },
        },
        currentProtocol,
        currentAsset
      );
    }
  }

  /**
   * Get OpenAI-powered recommendation
   */
  private async getOpenAIRecommendation(
    context: MarketContext,
    currentProtocol: string,
    currentAsset: string
  ): Promise<AIRecommendation> {
    const openai = await this.initializeOpenAI();
    if (!openai) {
      throw new Error("OpenAI not configured");
    }

    const prompt = `You are a DeFi yield optimization expert. Analyze the following market conditions and user profile to recommend the best yield strategy.

Current Market APY:
- Lido Staking (ETH): ${context.currentAPY.lido}% APY
- Aave USDC Lending: ${context.currentAPY.aaveUSDC}% APY
- Aave ETH Lending: ${context.currentAPY.aaveETH}% APY

Market Conditions:
- Volatility: ${context.marketConditions.volatility}
- Trend: ${context.marketConditions.trend}
- Risk Level: ${context.marketConditions.riskLevel}

User Profile:
- Risk Tolerance: ${context.userProfile.riskTolerance}
- Investment Horizon: ${context.userProfile.investmentHorizon}
- Current Balance: $${context.userProfile.currentBalance}
- Goals: ${context.userProfile.goals.join(", ") || "Wealth accumulation"}

Current Strategy: ${currentProtocol} ${currentAsset}

Provide a recommendation with:
1. Recommended portfolio allocation (percentages for each protocol)
2. Reasoning for each allocation
3. Market analysis (1-2 sentences)
4. Risk assessment (1-2 sentences)
5. Expected weighted APY
6. Confidence level (0-100)

Format as JSON:
{
  "recommendedStrategy": [
    {"protocol": "lido", "asset": "ETH", "percentage": 60, "reasoning": "..."},
    {"protocol": "aave", "asset": "USDC", "percentage": 40, "reasoning": "..."}
  ],
  "alternativeStrategies": [...],
  "marketAnalysis": "...",
  "riskAssessment": "...",
  "expectedAPY": 4.8,
  "confidence": 85
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a DeFi yield optimization expert. Provide JSON responses only, no markdown formatting.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("No response from OpenAI");
      }

      const recommendation = JSON.parse(responseText) as AIRecommendation;

      logInfo("AI recommendation generated", {
        confidence: recommendation.confidence,
        expectedAPY: recommendation.expectedAPY,
      });

      return recommendation;
    } catch (error) {
      logError(error as Error, { context: "getOpenAIRecommendation" });
      // Fallback to rule-based
      return this.getFallbackRecommendation(context, currentProtocol, currentAsset);
    }
  }

  /**
   * Fallback rule-based recommendation
   */
  private getFallbackRecommendation(
    context: MarketContext,
    currentProtocol: string,
    currentAsset: string
  ): AIRecommendation {
    // Rule-based logic
    const { riskTolerance, investmentHorizon } = context.userProfile;
    const { lido, aaveUSDC, aaveETH } = context.currentAPY;

    let recommendedStrategy: Array<{
      protocol: string;
      asset: string;
      percentage: number;
      reasoning: string;
    }> = [];

    if (riskTolerance === "conservative") {
      // Conservative: Favor stablecoins
      recommendedStrategy = [
        {
          protocol: "aave",
          asset: "USDC",
          percentage: 70,
          reasoning: "Stablecoin lending provides predictable returns with lower volatility, ideal for conservative investors.",
        },
        {
          protocol: "lido",
          asset: "ETH",
          percentage: 30,
          reasoning: "ETH staking offers higher yield while maintaining reasonable risk for conservative portfolios.",
        },
      ];
    } else if (riskTolerance === "aggressive") {
      // Aggressive: Maximize yield
      recommendedStrategy = [
        {
          protocol: "lido",
          asset: "ETH",
          percentage: 80,
          reasoning: "Lido staking offers the highest APY. Allocate majority for maximum yield generation.",
        },
        {
          protocol: "aave",
          asset: "ETH",
          percentage: 20,
          reasoning: "Additional ETH exposure provides diversification while maintaining high yield.",
        },
      ];
    } else {
      // Moderate: Balanced approach
      recommendedStrategy = [
        {
          protocol: "lido",
          asset: "ETH",
          percentage: 60,
          reasoning: "Balanced allocation to highest yield protocol while maintaining diversification.",
        },
        {
          protocol: "aave",
          asset: "USDC",
          percentage: 40,
          reasoning: "Stablecoin allocation provides stability and predictable returns.",
        },
      ];
    }

    const expectedAPY =
      (recommendedStrategy[0].percentage / 100) *
        (recommendedStrategy[0].protocol === "lido"
          ? lido
          : recommendedStrategy[0].asset === "USDC"
          ? aaveUSDC
          : aaveETH) +
      (recommendedStrategy[1].percentage / 100) *
        (recommendedStrategy[1].protocol === "lido"
          ? lido
          : recommendedStrategy[1].asset === "USDC"
          ? aaveUSDC
          : aaveETH);

    return {
      recommendedStrategy,
      alternativeStrategies: [
        {
          protocol: "aave",
          asset: "USDC",
          percentage: 100,
          reasoning: "All-stablecoin approach for maximum capital preservation.",
          risk: "Very Low",
        },
      ],
      marketAnalysis:
        "Current market conditions favor a balanced approach. ETH staking offers attractive yields while stablecoin lending provides stability.",
      riskAssessment: `Based on your ${riskTolerance} risk tolerance, this allocation balances yield generation with risk management.`,
      expectedAPY,
      confidence: 75, // Lower confidence for rule-based
    };
  }
}

export const aiOptimizerService = new AIOptimizerService();

