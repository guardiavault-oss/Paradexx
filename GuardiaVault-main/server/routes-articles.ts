/**
 * Articles API Routes
 * Handles education hub articles
 */

import type { Express, Request, Response } from "express";

const MOCK_ARTICLES = [
  {
    id: "1",
    title: "Understanding Yield Farming",
    emoji: "🌾",
    readTime: 5,
    content:
      "Yield farming is the process of earning rewards by staking or lending crypto assets. Unlike traditional savings accounts that offer 0.5% APY, DeFi protocols can offer 4-5% APY or more. GuardiaVault makes yield farming simple and secure by automating the process and providing inheritance protection.",
    category: "DeFi Basics",
  },
  {
    id: "2",
    title: "Lido Staking Explained",
    emoji: "🪙",
    readTime: 7,
    content:
      "Lido is a liquid staking protocol that allows you to stake ETH while maintaining liquidity. When you stake ETH through Lido, you receive stETH tokens that represent your staked position. These tokens earn rewards and can be used in other DeFi protocols. GuardiaVault integrates with Lido to offer 5.2% APY on ETH deposits.",
    category: "Strategies",
  },
  {
    id: "3",
    title: "Inheritance Protection Guide",
    emoji: "🛡️",
    readTime: 10,
    content:
      "GuardiaVault protects your crypto assets for your family's future through a multi-layered approach: 1) Guardian-based recovery using 2-of-3 or 3-of-5 schemes, 2) Biometric proof-of-life check-ins, 3) Death certificate verification, and 4) Time-locked recovery process. All included free with every yield strategy.",
    category: "Security",
  },
  {
    id: "4",
    title: "APY vs APR Explained",
    emoji: "📊",
    readTime: 6,
    content:
      "APY (Annual Percentage Yield) includes compound interest, while APR (Annual Percentage Rate) does not. APY is always higher than APR for the same rate because it accounts for earnings on your earnings. GuardiaVault displays APY to show your true earning potential with compound interest.",
    category: "Education",
  },
  {
    id: "5",
    title: "Risk Management in DeFi",
    emoji: "⚖️",
    readTime: 8,
    content:
      "DeFi comes with risks: smart contract bugs, protocol failures, and market volatility. GuardiaVault mitigates these risks by only using audited protocols (Lido, Aave), maintaining low risk levels, and providing insurance coverage. Diversify across multiple strategies to reduce risk further.",
    category: "Security",
  },
  {
    id: "6",
    title: "Compound Interest Magic",
    emoji: "✨",
    readTime: 5,
    content:
      "Compound interest is earning interest on your interest. At 5% APY, $10,000 becomes $10,500 in year 1, $11,025 in year 2, and $16,289 in 10 years. The longer you hold, the more powerful compound interest becomes. GuardiaVault automatically compounds your earnings.",
    category: "Education",
  },
];

import { db } from "./db";
import { educationArticles, type InsertEducationArticle } from "@shared/schema-extensions";
import { eq, desc } from "./utils/drizzle-exports";

export function registerArticlesRoutes(app: Express) {
  /**
   * GET /api/articles
   * Get all published education articles
   */
  app.get("/api/articles", async (_req: Request, res: Response) => {
    try {
      // If db is not available, return mock data
      if (!db) {
        return res.json(MOCK_ARTICLES);
      }

      const articles = await db
        .select()
        .from(educationArticles)
        .where(eq(educationArticles.published, true))
        .orderBy(desc(educationArticles.publishedAt));

      // If no articles in database, return mock data (for initial setup)
      if (articles.length === 0) {
        try {
          // Insert mock articles into database
          const mockInserts: InsertEducationArticle[] = MOCK_ARTICLES.map((article) => ({
            title: article.title,
            slug: article.title.toLowerCase().replace(/\s+/g, "-"),
            emoji: article.emoji,
            content: article.content,
            category: article.category,
            readTime: article.readTime,
            published: true,
            publishedAt: new Date(),
          }));

          await db.insert(educationArticles).values(mockInserts);

          // Return the inserted articles
          const inserted = await db
            .select()
            .from(educationArticles)
            .where(eq(educationArticles.published, true))
            .orderBy(desc(educationArticles.publishedAt));

          return res.json(inserted);
        } catch (insertError) {
          // If insert fails, just return mock data
          console.warn("Failed to insert mock articles, returning mock data:", insertError);
          return res.json(MOCK_ARTICLES);
        }
      }

      res.json(articles);
    } catch (error: any) {
      console.error("Get articles error:", error);
      res.status(500).json({
        message: "Failed to fetch articles",
        error: error.message,
      });
    }
  });

  /**
   * GET /api/articles/:id
   * Get single article by ID
   */
  app.get("/api/articles/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const article = MOCK_ARTICLES.find((a) => a.id === id);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json(article);
    } catch (error: any) {
      console.error("Get article error:", error);
      res.status(500).json({
        message: "Failed to fetch article",
        error: error.message,
      });
    }
  });
}

