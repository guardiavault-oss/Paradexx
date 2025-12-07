/**
 * OG Image Generation API
 * Creates shareable images for leaderboard, achievements, etc.
 */

import type { Express, Request, Response } from "express";
import { logInfo, logError } from "./services/logger";
import { ogImageLimiter } from "./middleware/rateLimiter";

// Lazy load canvas to avoid crashes if native module isn't available
let createCanvas: any = null;
let canvasLoadAttempted = false;

async function loadCanvas() {
  if (canvasLoadAttempted) {
    return createCanvas;
  }
  canvasLoadAttempted = true;
  
  try {
    // Dynamic import to avoid top-level require crash
    const canvas = await import("canvas").catch(() => null);
    if (canvas && typeof canvas.createCanvas === "function") {
      createCanvas = canvas.createCanvas;
    } else {
      console.warn("Canvas package not installed. OG image generation will use fallback.");
    }
  } catch (error) {
    console.warn("Canvas package not installed. OG image generation will use fallback.");
    createCanvas = null;
  }
  
  return createCanvas;
}

export function registerOGImageRoutes(app: Express) {
  /**
   * GET /api/og/leaderboard
   * Generate OG image for leaderboard share
   */
  app.get("/api/og/leaderboard", ogImageLimiter, async (req: Request, res: Response) => {
    try {
      const { rank, apy, earnings } = req.query;

      if (!rank || !apy || !earnings) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      // Lazy load canvas
      const canvasFn = await loadCanvas();
      if (!canvasFn) {
        // Return a simple JSON response or redirect to a static image
        return res.status(503).json({
          message: "Image generation not available. Canvas package required.",
          fallbackUrl: `/api/og/leaderboard/fallback?rank=${rank}&apy=${apy}&earnings=${earnings}`,
        });
      }

      // Create canvas
      const width = 1200;
      const height = 630;
      const canvas = canvasFn(width, height);
      const ctx = canvas.getContext("2d");

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0f172a"); // slate-950
      gradient.addColorStop(1, "#1e293b"); // slate-800
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Add grid pattern
      ctx.strokeStyle = "rgba(59, 130, 246, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 64px Arial";
      ctx.textAlign = "center";
      ctx.fillText("GuardiaVault Leaderboard", width / 2, 120);

      // Rank badge
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(width / 2, 250, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`#${rank}`, width / 2, 270);

      // Stats
      ctx.fillStyle = "#10b981"; // emerald-500
      ctx.font = "bold 56px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${apy}% APY`, width / 2, 380);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px Arial";
      ctx.fillText(`$${earnings} Earned`, width / 2, 450);

      // Footer
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "32px Arial";
      ctx.fillText("guardiavault.com", width / 2, 580);

      // Convert to image
      const buffer = canvas.toBuffer("image/png");

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
      res.send(buffer);
    } catch (error: any) {
      logError(error as Error, { context: "generateOGImage" });
      res.status(500).json({
        message: "Failed to generate image",
        error: error.message,
      });
    }
  });

  /**
   * GET /api/og/achievement
   * Generate OG image for achievement share
   */
  app.get("/api/og/achievement", ogImageLimiter, async (req: Request, res: Response) => {
    try {
      const { title, icon, description } = req.query;

      if (!title || !icon) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      // Lazy load canvas
      const canvasFn = await loadCanvas();
      if (!canvasFn) {
        return res.status(503).json({
          message: "Image generation not available. Canvas package required.",
        });
      }

      const width = 1200;
      const height = 630;
      const canvas = canvasFn(width, height);
      const ctx = canvas.getContext("2d");

      // Background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#7c3aed"); // purple-600
      gradient.addColorStop(1, "#3b82f6"); // blue-500
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Achievement icon
      ctx.font = "120px Arial";
      ctx.textAlign = "center";
      ctx.fillText(icon as string, width / 2, 280);

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 64px Arial";
      ctx.fillText(title as string, width / 2, 380);

      // Description
      if (description) {
        ctx.font = "36px Arial";
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillText(description as string, width / 2, 450);
      }

      // Footer
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "32px Arial";
      ctx.fillText("guardiavault.com", width / 2, 580);

      const buffer = canvas.toBuffer("image/png");

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(buffer);
    } catch (error: any) {
      logError(error as Error, { context: "generateAchievementOG" });
      res.status(500).json({
        message: "Failed to generate image",
        error: error.message,
      });
    }
  });
}

