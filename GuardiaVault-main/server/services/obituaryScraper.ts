/**
 * Obituary Scraper Service
 * Searches obituaries across multiple sources for death verification
 */

import axios from "axios";
// cheerio is a CommonJS module, must use namespace import
import * as cheerio from "cheerio";
// natural is a CommonJS module, must use default import
import natural from "natural";
import { db } from "../db";

const { LevenshteinDistance } = natural;
import { deathVerificationEvents } from "../../shared/schema.death-verification";
import { logInfo, logError, logWarn } from "./logger";

// Obituary Sources Configuration
const OBITUARY_SOURCES = [
  {
    name: "Legacy.com",
    url: "https://www.legacy.com",
    api: process.env.LEGACY_API_URL || "https://api.legacy.com/v1/obituaries",
    apiKey: process.env.LEGACY_API_KEY,
    coverage: "US, Canada (70% of obituaries)",
    reliability: 0.9,
    useAPI: true,
  },
  {
    name: "Tributes.com",
    url: "https://www.tributes.com",
    scrapeUrl: "https://www.tributes.com/search",
    coverage: "US nationwide",
    reliability: 0.7,
    useAPI: false,
  },
  {
    name: "FindAGrave",
    url: "https://www.findagrave.com",
    api: process.env.FINDAGRAVE_API_URL || "https://www.findagrave.com/api",
    apiKey: process.env.FINDAGRAVE_API_KEY,
    coverage: "Global",
    reliability: 0.8,
    useAPI: true,
  },
];

export class ObituaryScraperService {
  private sources = OBITUARY_SOURCES;

  constructor() {
    // Sources initialized above
  }

  /**
   * Search for user's obituary across all sources
   */
  async searchObituary(user: {
    id: string;
    full_name: string;
    date_of_birth?: Date | string | null;
    last_known_location?: string | null;
  }): Promise<any[]> {
    logInfo("Searching obituaries", { userId: user.id, name: user.full_name });

    const results: any[] = [];

    for (const source of this.sources) {
      try {
        let obituaries: any[];

        if (source.useAPI && source.api && source.apiKey) {
          obituaries = await this.searchViaAPI(source, user);
        } else {
          obituaries = await this.searchViaScraping(source, user);
        }

        // Score and rank results
        const scored = obituaries.map((obit) => ({
          ...obit,
          matchScore: this.calculateMatchScore(user, obit),
        }));

        // Filter high-confidence matches
        const matches = scored.filter((o) => o.matchScore > 0.5);
        results.push(...matches);
      } catch (error: any) {
        logError(error, {
          userId: user.id,
          source: source.name,
          type: "obituary_search",
        });
      }
    }

    // Sort by match score (highest first)
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Search via API (Legacy.com, FindAGrave)
   */
  private async searchViaAPI(source: any, user: any): Promise<any[]> {
    if (!source.api || !source.apiKey) {
      logWarn(`API not configured for ${source.name}`);
      return [];
    }

    try {
      const nameParts = (user.full_name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(-1)[0] || "";

      const response = await axios.get(`${source.api}/search`, {
        params: {
          firstName,
          lastName,
          location: user.last_known_location || "",
          dateRange: "30days", // Last 30 days
        },
        headers: {
          Authorization: `Bearer ${source.apiKey}`,
        },
        timeout: 10000,
      });

      const obituaries = response.data?.obituaries || [];

      return obituaries.map((obit: any) => ({
        source: source.name,
        name: obit.name,
        deathDate: obit.deathDate,
        birthDate: obit.birthDate,
        location: obit.location,
        text: obit.obituaryText,
        url: obit.url,
        imageUrl: obit.photoUrl,
        funeralHome: obit.funeralHome,
      }));
    } catch (error: any) {
      logError(error, { source: source.name, type: "obituary_api" });
      return [];
    }
  }

  /**
   * Search via web scraping (fallback)
   */
  private async searchViaScraping(source: any, user: any): Promise<any[]> {
    if (!source.scrapeUrl) {
      return [];
    }

    try {
      const nameParts = (user.full_name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(-1)[0] || "";

      const searchUrl = `${source.scrapeUrl}?name=${encodeURIComponent(
        user.full_name
      )}`;

      const response = await axios.get(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const obituaries: any[] = [];

      // Extract obituary results (selector varies by site)
      $(".obituary-result, .result-item, .obit-item").each((_, elem) => {
        const $elem = $(elem);
        const obit = {
          source: source.name,
          name: $elem.find(".name, h2, h3").first().text().trim(),
          deathDate: $elem.find(".death-date, .date").first().text().trim(),
          location: $elem.find(".location, .place").first().text().trim(),
          url:
            $elem.find("a").first().attr("href") ||
            $elem.attr("href") ||
            null,
          snippet: $elem.find(".snippet, .excerpt").first().text().trim(),
          fullText: "", // Will be fetched separately
        };

        if (obit.name && obit.deathDate) {
          obituaries.push(obit);
        }
      });

      // Fetch full obituary text for each result
      for (const obit of obituaries) {
        if (obit.url) {
          try {
            obit.fullText = await this.fetchFullObituary(obit.url);
          } catch (error) {
            // Continue even if full text fetch fails
          }
        }
      }

      return obituaries;
    } catch (error: any) {
      logError(error, { source: source.name, type: "obituary_scraping" });
      return [];
    }
  }

  /**
   * Fetch full obituary text
   */
  private async fetchFullObituary(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);

      // Extract main obituary text (selectors vary by site)
      const text =
        $(
          ".obituary-content, .obit-text, article, .content, .main-content"
        ).text() || "";

      return text.trim();
    } catch (error: any) {
      logError(error, { url, type: "fetch_obituary" });
      return "";
    }
  }

  /**
   * Calculate match score using NLP and fuzzy matching
   */
  private calculateMatchScore(user: any, obituary: any): number {
    let score = 0;

    // Name matching (0.4 weight)
    const nameScore = this.compareNames(user.full_name, obituary.name);
    score += nameScore * 0.4;

    // DOB matching (0.3 weight)
    if (obituary.birthDate && user.date_of_birth) {
      const dobScore = this.compareDates(user.date_of_birth, obituary.birthDate);
      score += dobScore * 0.3;
    }

    // Location matching (0.2 weight)
    if (obituary.location && user.last_known_location) {
      const locationScore = this.compareLocations(
        user.last_known_location,
        obituary.location
      );
      score += locationScore * 0.2;
    }

    // Context matching from text (0.1 weight)
    if (obituary.fullText || obituary.text) {
      const contextScore = this.analyzeContext(
        user,
        obituary.fullText || obituary.text
      );
      score += contextScore * 0.1;
    }

    return Math.min(1.0, score); // Cap at 1.0
  }

  /**
   * Compare names using Levenshtein distance
   */
  private compareNames(name1: string, name2: string): number {
    if (!name1 || !name2) return 0;

    const normalize = (s: string) =>
      s.toLowerCase().trim().replace(/[^a-z\s]/g, "");
    const n1 = normalize(name1);
    const n2 = normalize(name2);

    if (n1 === n2) return 1.0;

    const distance = LevenshteinDistance(n1, n2);
    const maxLength = Math.max(n1.length, n2.length);

    if (maxLength === 0) return 0;

    return 1 - distance / maxLength;
  }

  /**
   * Compare dates (allow for data entry errors)
   */
  private compareDates(date1: Date | string, date2: Date | string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;

    if (d1.getTime() === d2.getTime()) return 1.0;

    // Allow 1 day difference (data entry errors)
    const diff = Math.abs(d1.getTime() - d2.getTime());
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (diff <= oneDayMs) return 0.9;
    if (diff <= 7 * oneDayMs) return 0.7;
    if (diff <= 30 * oneDayMs) return 0.5;

    return 0;
  }

  /**
   * Compare locations
   */
  private compareLocations(loc1: string, loc2: string): number {
    if (!loc1 || !loc2) return 0;

    const extractState = (loc: string) => {
      const parts = loc.split(",");
      return parts[parts.length - 1]?.trim().toUpperCase() || "";
    };

    const state1 = extractState(loc1);
    const state2 = extractState(loc2);

    if (state1 === state2 && state1 !== "") return 1.0;

    // Check if city matches
    const city1 = loc1.split(",")[0]?.trim().toLowerCase() || "";
    const city2 = loc2.split(",")[0]?.trim().toLowerCase() || "";

    if (city1 === city2 && city1 !== "") return 0.8;

    return 0;
  }

  /**
   * Analyze obituary context for additional confirmation
   */
  private analyzeContext(user: any, obituaryText: string): number {
    if (!obituaryText) return 0;

    const text = obituaryText.toLowerCase();
    let matches = 0;
    let total = 0;

    // Check for occupation (if we have this data)
    if (user.occupation) {
      total++;
      if (text.includes(user.occupation.toLowerCase())) {
        matches++;
      }
    }

    // Check for education (if we have this data)
    if (user.education) {
      total++;
      if (text.includes(user.education.toLowerCase())) {
        matches++;
      }
    }

    // Check for family members (if we have this data)
    if (user.familyMembers && Array.isArray(user.familyMembers)) {
      total++;
      const familyMentioned = user.familyMembers.some((name: string) =>
        text.includes(name.toLowerCase())
      );
      if (familyMentioned) {
        matches++;
      }
    }

    return total > 0 ? matches / total : 0;
  }

  /**
   * Store obituary match as verification event
   */
  async storeVerificationEvent(
    userId: string,
    obituary: any,
    sourceName: string
  ): Promise<void> {
    try {
      await db.insert(deathVerificationEvents).values({
        userId,
        source: `obituary_${sourceName.toLowerCase()}` as any,
        confidenceScore: obituary.matchScore.toFixed(2),
        verificationData: obituary,
        reportedDeathDate: obituary.deathDate
          ? new Date(obituary.deathDate)
          : null,
        reportedLocation: obituary.location || null,
        status:
          obituary.matchScore > 0.8 ? ("confirmed" as any) : ("pending" as any),
        requiresReview: obituary.matchScore < 0.8,
        verifiedBy: sourceName,
      });

      logInfo("Obituary verification event created", {
        userId,
        source: sourceName,
        confidence: obituary.matchScore,
      });
    } catch (error: any) {
      logError(error, { userId, source: sourceName, type: "store_event" });
    }
  }
}

export default new ObituaryScraperService();

