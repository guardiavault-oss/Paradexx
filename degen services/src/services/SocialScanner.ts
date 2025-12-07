// ============================================================================
// APEX SNIPER - Social Scanner Service
// Monitors social media platforms for meme token mentions and trends
// ============================================================================

import EventEmitter from 'eventemitter3';
import axios from 'axios';
import NodeCache from 'node-cache';
import {
  SocialSignals,
  SocialMention,
  MemeHunterConfig
} from '../types';
import { logger, generateId, checksumAddress, isAddress } from '../utils';

// ============================================================================
// CONSTANTS
// ============================================================================

// Regex patterns for detecting contract addresses
const CONTRACT_PATTERN = /0x[a-fA-F0-9]{40}/g;

// Crypto-related keywords for filtering
const CRYPTO_KEYWORDS = [
  '$', 'CA:', 'contract:', '0x',
  '🚀', '💎', '🌙', '💰', '📈',
  'gem', 'moon', 'pump', 'degen',
  'early', 'presale', 'fair launch', 'stealth',
  'x100', 'x1000', '100x', '1000x',
  'ape', 'buy now', 'dont miss', "don't miss",
  'next pepe', 'next shib', 'memecoin', 'meme coin'
];

// Urgency indicators for scoring
const URGENCY_KEYWORDS = [
  'last chance', "don't miss", 'buy now', 'ape now',
  'launching', 'just launched', 'stealth launch',
  'limited time', 'selling fast', 'flying'
];

// Influencer tier thresholds
const INFLUENCER_TIERS = {
  mega: 1000000,   // 1M+ followers
  macro: 100000,   // 100K-1M
  micro: 10000,    // 10K-100K
  nano: 1000       // 1K-10K
};

// ============================================================================
// EVENTS
// ============================================================================

export interface SocialScannerEvents {
  'mention:detected': (mention: SocialMention) => void;
  'token:trending': (address: string, signals: SocialSignals) => void;
  'influencer:mentioned': (mention: SocialMention, tier: string) => void;
  'spike:detected': (address: string, spikePercent: number) => void;
}

// ============================================================================
// SOCIAL SCANNER SERVICE
// ============================================================================

export class SocialScanner extends EventEmitter<SocialScannerEvents> {
  private isRunning: boolean = false;
  private config: MemeHunterConfig;
  
  // Data stores with TTL
  private mentionCache: NodeCache;      // Stores recent mentions
  private tokenMentions: Map<string, SocialMention[]> = new Map();  // Token -> mentions
  private mentionCounts: Map<string, number[]> = new Map();  // Token -> [count per minute]
  private baselineCache: NodeCache;     // Stores baseline mention rates
  
  // Platform API clients (would be configured with real API keys)
  private twitterBearerToken: string | null = null;
  private redditClientId: string | null = null;
  
  // Polling intervals
  private pollIntervals: NodeJS.Timeout[] = [];

  constructor(memeHunterConfig: MemeHunterConfig) {
    super();
    this.config = memeHunterConfig;
    
    // Initialize caches
    this.mentionCache = new NodeCache({ stdTTL: 3600, checkperiod: 60 }); // 1 hour TTL
    this.baselineCache = new NodeCache({ stdTTL: 86400, checkperiod: 300 }); // 24 hour TTL
    
    // Load API keys from environment
    this.loadApiKeys();
  }

  private loadApiKeys(): void {
    this.twitterBearerToken = process.env.TWITTER_BEARER_TOKEN || null;
    this.redditClientId = process.env.REDDIT_CLIENT_ID || null;
    
    if (!this.twitterBearerToken) {
      logger.warn('[SocialScanner] Twitter API key not configured - using simulated data');
    }
    if (!this.redditClientId) {
      logger.warn('[SocialScanner] Reddit API not configured - using simulated data');
    }
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    logger.info('[SocialScanner] Starting social media monitoring...');
    this.isRunning = true;
    
    // Start platform-specific monitors
    if (this.config.twitterEnabled) {
      this.startTwitterMonitor();
    }
    
    if (this.config.redditEnabled) {
      this.startRedditMonitor();
    }
    
    if (this.config.telegramEnabled) {
      this.startTelegramMonitor();
    }
    
    if (this.config.discordEnabled) {
      this.startDiscordMonitor();
    }
    
    // Start trend analyzer
    this.startTrendAnalyzer();
    
    logger.info('[SocialScanner] Social media monitoring started');
  }

  async stop(): Promise<void> {
    logger.info('[SocialScanner] Stopping social media monitoring...');
    this.isRunning = false;
    
    // Clear all polling intervals
    for (const interval of this.pollIntervals) {
      clearInterval(interval);
    }
    this.pollIntervals = [];
    
    logger.info('[SocialScanner] Social media monitoring stopped');
  }

  // ==========================================================================
  // TWITTER MONITORING
  // ==========================================================================

  private startTwitterMonitor(): void {
    logger.info('[SocialScanner] Starting Twitter monitor');
    
    // Poll Twitter API every 30 seconds (respecting rate limits)
    const interval = setInterval(async () => {
      if (!this.isRunning) return;
      await this.pollTwitter();
    }, 30000);
    
    this.pollIntervals.push(interval);
    
    // Initial poll
    this.pollTwitter();
  }

  private async pollTwitter(): Promise<void> {
    try {
      if (this.twitterBearerToken) {
        await this.searchTwitterReal();
      } else {
        // No Twitter API configured - try alternative methods
        await this.searchTwitterAlternative();
      }
    } catch (error) {
      logger.error('[SocialScanner] Twitter poll error:', error);
    }
  }

  private async searchTwitterReal(): Promise<void> {
    // Build search query for crypto mentions
    const query = 'crypto (CA: OR contract OR 0x) -is:retweet lang:en';
    
    try {
      const response = await axios.get(
        'https://api.twitter.com/2/tweets/search/recent',
        {
          headers: {
            'Authorization': `Bearer ${this.twitterBearerToken}`
          },
          params: {
            query,
            max_results: 100,
            'tweet.fields': 'public_metrics,created_at,author_id',
            'expansions': 'author_id',
            'user.fields': 'public_metrics'
          },
          timeout: 10000
        }
      );

      const tweets = response.data.data || [];
      const users = response.data.includes?.users || [];
      
      // Create user map for quick lookup
      const userMap = new Map(users.map((u: any) => [u.id, u]));
      
      for (const tweet of tweets) {
        const user = userMap.get(tweet.author_id);
        const mention = this.parseTweet(tweet, user);
        if (mention) {
          this.processMention(mention);
        }
      }
    } catch (error) {
      logger.debug('[SocialScanner] Twitter API error, trying alternative methods');
      await this.searchTwitterAlternative();
    }
  }

  /**
   * Alternative Twitter search using nitter instances or RSS feeds
   * This works without official API access
   */
  private async searchTwitterAlternative(): Promise<void> {
    // Try multiple nitter instances for resilience
    const nitterInstances = [
      'https://nitter.net',
      'https://nitter.cz',
      'https://nitter.it'
    ];

    const searchTerms = ['CA:', '0x', 'contract', 'memecoin', 'presale'];
    
    for (const instance of nitterInstances) {
      try {
        for (const term of searchTerms.slice(0, 2)) { // Limit to avoid rate limits
          const response = await axios.get(
            `${instance}/search/rss?f=tweets&q=${encodeURIComponent(term + ' 0x')}`,
            {
              timeout: 10000,
              headers: { 'Accept': 'application/rss+xml' }
            }
          );
          
          // Parse RSS feed for tweets
          const mentions = this.parseNitterRSS(response.data);
          for (const mention of mentions) {
            if (mention) {
              this.processMention(mention);
            }
          }
        }
        
        // If one instance works, break
        break;
      } catch (error) {
        logger.debug(`[SocialScanner] Nitter instance ${instance} failed`);
        continue;
      }
    }
  }

  private parseNitterRSS(rssData: string): SocialMention[] {
    const mentions: SocialMention[] = [];
    
    // Simple XML parsing for RSS items
    const itemMatches = rssData.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    for (const item of itemMatches) {
      const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/);
      const linkMatch = item.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
      const creatorMatch = item.match(/<dc:creator>(.*?)<\/dc:creator>/);
      
      if (titleMatch) {
        const content = titleMatch[1];
        const contracts = content.match(CONTRACT_PATTERN);
        
        if (contracts && contracts.length > 0) {
          const contractAddress = contracts[0];
          if (isAddress(contractAddress)) {
            mentions.push({
              id: `nitter_${generateId()}`,
              platform: 'twitter',
              author: creatorMatch ? creatorMatch[1].replace('@', '') : 'unknown',
              authorFollowers: 0, // Not available from RSS
              content: content.slice(0, 500),
              contractAddress: checksumAddress(contractAddress),
              sentiment: this.analyzeSentiment(content),
              engagement: { likes: 0, shares: 0, comments: 0 },
              timestamp: pubDateMatch ? new Date(pubDateMatch[1]).getTime() : Date.now(),
              url: linkMatch ? linkMatch[1] : undefined
            });
          }
        }
      }
    }
    
    return mentions;
  }

  private parseTweet(tweet: any, user: any): SocialMention | null {
    const contracts = tweet.text.match(CONTRACT_PATTERN);
    if (!contracts || contracts.length === 0) return null;
    
    // Validate contract address
    const contractAddress = contracts[0];
    if (!isAddress(contractAddress)) return null;
    
    const followers = user?.public_metrics?.followers_count || 0;
    
    return {
      id: `twitter_${tweet.id}`,
      platform: 'twitter',
      author: user?.username || 'unknown',
      authorFollowers: followers,
      content: tweet.text,
      contractAddress: checksumAddress(contractAddress),
      sentiment: this.analyzeSentiment(tweet.text),
      engagement: {
        likes: tweet.public_metrics?.like_count || 0,
        shares: tweet.public_metrics?.retweet_count || 0,
        comments: tweet.public_metrics?.reply_count || 0
      },
      timestamp: new Date(tweet.created_at).getTime(),
      url: `https://twitter.com/${user?.username}/status/${tweet.id}`
    };
  }

  // ==========================================================================
  // REDDIT MONITORING
  // ==========================================================================

  private startRedditMonitor(): void {
    logger.info('[SocialScanner] Starting Reddit monitor');
    
    // Poll Reddit every 60 seconds
    const interval = setInterval(async () => {
      if (!this.isRunning) return;
      await this.pollReddit();
    }, 60000);
    
    this.pollIntervals.push(interval);
    
    // Initial poll
    this.pollReddit();
  }

  private async pollReddit(): Promise<void> {
    // Monitor crypto subreddits
    const subreddits = [
      'CryptoMoonShots',
      'SatoshiStreetBets', 
      'memecoin',
      'CryptoCurrency'
    ];
    
    for (const subreddit of subreddits) {
      try {
        const response = await axios.get(
          `https://www.reddit.com/r/${subreddit}/new.json`,
          {
            params: { limit: 25 },
            headers: { 'User-Agent': 'ApexSniper/2.0' },
            timeout: 10000
          }
        );
        
        const posts = response.data?.data?.children || [];
        
        for (const post of posts) {
          const mention = this.parseRedditPost(post.data);
          if (mention) {
            this.processMention(mention);
          }
        }
      } catch (error) {
        logger.debug(`[SocialScanner] Reddit r/${subreddit} poll failed`);
      }
    }
  }

  private parseRedditPost(post: any): SocialMention | null {
    const fullText = `${post.title} ${post.selftext || ''}`;
    const contracts = fullText.match(CONTRACT_PATTERN);
    
    if (!contracts || contracts.length === 0) return null;
    
    const contractAddress = contracts[0];
    if (!isAddress(contractAddress)) return null;
    
    return {
      id: `reddit_${post.id}`,
      platform: 'reddit',
      author: post.author,
      authorFollowers: post.author_premium ? 10000 : 1000, // Rough estimate
      content: fullText.slice(0, 500),
      contractAddress: checksumAddress(contractAddress),
      sentiment: this.analyzeSentiment(fullText),
      engagement: {
        likes: post.ups || 0,
        shares: 0,
        comments: post.num_comments || 0
      },
      timestamp: post.created_utc * 1000,
      url: `https://reddit.com${post.permalink}`
    };
  }

  // ==========================================================================
  // TELEGRAM MONITORING
  // ==========================================================================

  private startTelegramMonitor(): void {
    logger.info('[SocialScanner] Starting Telegram monitor (webhook mode)');
    
    // Telegram monitoring typically uses webhooks or long-polling
    // For now, we'll use a placeholder that can be extended
    
    // In production, you would:
    // 1. Set up Telegram Bot API with webhooks
    // 2. Monitor specific crypto groups/channels
    // 3. Use MTProto client for broader monitoring
    
    const interval = setInterval(async () => {
      if (!this.isRunning) return;
      // Placeholder for Telegram polling
      logger.debug('[SocialScanner] Telegram monitor heartbeat');
    }, 60000);
    
    this.pollIntervals.push(interval);
  }

  // ==========================================================================
  // DISCORD MONITORING
  // ==========================================================================

  private startDiscordMonitor(): void {
    logger.info('[SocialScanner] Starting Discord monitor (webhook mode)');
    
    // Discord monitoring uses webhooks or bot tokens
    // Similar placeholder for extensibility
    
    const interval = setInterval(async () => {
      if (!this.isRunning) return;
      logger.debug('[SocialScanner] Discord monitor heartbeat');
    }, 60000);
    
    this.pollIntervals.push(interval);
  }

  // ==========================================================================
  // MENTION PROCESSING
  // ==========================================================================

  private processMention(mention: SocialMention): void {
    if (!mention.contractAddress) return;
    
    const address = mention.contractAddress.toLowerCase();
    
    // Check if already processed
    const cacheKey = `${mention.platform}_${mention.id}`;
    if (this.mentionCache.has(cacheKey)) return;
    this.mentionCache.set(cacheKey, true);
    
    // Store mention by token
    if (!this.tokenMentions.has(address)) {
      this.tokenMentions.set(address, []);
    }
    const mentions = this.tokenMentions.get(address)!;
    mentions.push(mention);
    
    // Keep only last 1000 mentions per token
    if (mentions.length > 1000) {
      mentions.shift();
    }
    
    // Update mention counts for trend detection
    this.updateMentionCount(address);
    
    // Emit mention detected event
    this.emit('mention:detected', mention);
    
    // Check if from influencer
    const tier = this.getInfluencerTier(mention.authorFollowers);
    if (tier) {
      this.emit('influencer:mentioned', mention, tier);
      logger.info(`[SocialScanner] ${tier} influencer mentioned ${mention.contractAddress}`);
    }
    
    logger.debug(`[SocialScanner] Processed mention for ${mention.contractAddress} from ${mention.platform}`);
  }

  private updateMentionCount(address: string): void {
    const now = Date.now();
    const minuteSlot = Math.floor(now / 60000);
    
    if (!this.mentionCounts.has(address)) {
      this.mentionCounts.set(address, []);
    }
    
    const counts = this.mentionCounts.get(address)!;
    
    // Find or create current minute slot
    const lastSlot = counts.length > 0 ? counts[counts.length - 1] : 0;
    
    if (counts.length === 0 || minuteSlot !== lastSlot) {
      counts.push(1);
    } else {
      counts[counts.length - 1]++;
    }
    
    // Keep only last 60 minutes
    while (counts.length > 60) {
      counts.shift();
    }
  }

  // ==========================================================================
  // TREND ANALYZER
  // ==========================================================================

  private startTrendAnalyzer(): void {
    // Analyze trends every minute
    const interval = setInterval(() => {
      if (!this.isRunning) return;
      this.analyzeTrends();
    }, 60000);
    
    this.pollIntervals.push(interval);
  }

  private analyzeTrends(): void {
    for (const [address, counts] of this.mentionCounts.entries()) {
      if (counts.length < 5) continue; // Need at least 5 minutes of data
      
      // Calculate current vs baseline
      const recent = counts.slice(-5).reduce((a, b) => a + b, 0);
      const baseline = this.getBaseline(address);
      
      if (baseline > 0) {
        const spikePercent = ((recent - baseline) / baseline) * 100;
        
        if (spikePercent > 100) { // 2x increase
          this.emit('spike:detected', address, spikePercent);
          logger.info(`[SocialScanner] Spike detected for ${address}: ${spikePercent.toFixed(0)}%`);
        }
      }
      
      // Update baseline
      this.updateBaseline(address, counts);
    }
  }

  private getBaseline(address: string): number {
    const cached = this.baselineCache.get<number>(`baseline_${address}`);
    return cached || 0;
  }

  private updateBaseline(address: string, counts: number[]): void {
    if (counts.length >= 60) {
      const hourlyAvg = counts.reduce((a, b) => a + b, 0) / counts.length;
      this.baselineCache.set(`baseline_${address}`, hourlyAvg);
    }
  }

  // ==========================================================================
  // SIGNAL GENERATION
  // ==========================================================================

  getSocialSignals(tokenAddress: string): SocialSignals {
    const address = tokenAddress.toLowerCase();
    const mentions = this.tokenMentions.get(address) || [];
    const counts = this.mentionCounts.get(address) || [];
    
    // Calculate time-based metrics
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;
    
    const recentMentions = mentions.filter(m => m.timestamp > oneHourAgo);
    const dailyMentions = mentions.filter(m => m.timestamp > oneDayAgo);
    
    // Calculate engagement metrics
    let totalLikes = 0, totalRetweets = 0, totalReplies = 0;
    let twitterCount = 0, redditCount = 0, telegramCount = 0, discordCount = 0;
    
    for (const mention of mentions) {
      totalLikes += mention.engagement.likes;
      totalRetweets += mention.engagement.shares;
      totalReplies += mention.engagement.comments;
      
      switch (mention.platform) {
        case 'twitter': twitterCount++; break;
        case 'reddit': redditCount++; break;
        case 'telegram': telegramCount++; break;
        case 'discord': discordCount++; break;
      }
    }
    
    // Calculate influencer metrics
    const influencerTiers = { mega: 0, macro: 0, micro: 0, nano: 0 };
    let totalInfluencerFollowers = 0;
    let sentimentSum = 0;
    
    for (const mention of mentions) {
      const tier = this.getInfluencerTier(mention.authorFollowers);
      if (tier) {
        influencerTiers[tier as keyof typeof influencerTiers]++;
        totalInfluencerFollowers += mention.authorFollowers;
      }
      sentimentSum += mention.sentiment;
    }
    
    // Calculate velocity
    const baseline = this.getBaseline(address);
    const recentCount = counts.slice(-5).reduce((a, b) => a + b, 0);
    const velocity = baseline > 0 ? recentCount / (baseline * 5) : recentCount;
    
    // Find first and peak mention times
    const sortedMentions = [...mentions].sort((a, b) => a.timestamp - b.timestamp);
    const firstMention = sortedMentions[0]?.timestamp || 0;
    const peakMention = this.findPeakMentionTime(mentions);
    
    // Count urgency and content indicators
    let urgencyCount = 0;
    let chartMentions = 0;
    let memeMentions = 0;
    let rocketEmojis = 0;
    
    for (const mention of mentions) {
      const lowerContent = mention.content.toLowerCase();
      
      for (const keyword of URGENCY_KEYWORDS) {
        if (lowerContent.includes(keyword)) {
          urgencyCount++;
          break;
        }
      }
      
      if (lowerContent.includes('chart') || lowerContent.includes('dextools') || lowerContent.includes('dexscreener')) {
        chartMentions++;
      }
      
      if (lowerContent.includes('meme') || lowerContent.includes('pepe') || lowerContent.includes('doge')) {
        memeMentions++;
      }
      
      rocketEmojis += (mention.content.match(/🚀/g) || []).length;
    }
    
    return {
      mentionCount: mentions.length,
      mentionBaseline: baseline,
      mentionSpike: baseline > 0 ? ((recentCount - baseline) / baseline) * 100 : 0,
      mentionVelocity: velocity,
      
      likes: totalLikes,
      retweets: totalRetweets,
      replies: totalReplies,
      impressions: totalInfluencerFollowers * 0.1, // Rough estimate
      engagementRate: mentions.length > 0 
        ? (totalLikes + totalRetweets + totalReplies) / mentions.length 
        : 0,
      
      influencerFollowers: totalInfluencerFollowers,
      influencerTiers,
      influencerSentiment: mentions.length > 0 ? sentimentSum / mentions.length : 0,
      
      firstMention,
      hoursSinceFirst: firstMention > 0 ? (now - firstMention) / 3600000 : 0,
      peakMentionTime: peakMention,
      isTrending: recentMentions.length > 10 && velocity > 2,
      
      hasContract: true,
      contractAddress: tokenAddress,
      hasChart: chartMentions > 0,
      hasMemes: memeMentions > 0,
      rocketEmojis,
      sentiment: mentions.length > 0 ? sentimentSum / mentions.length : 0,
      urgencyScore: mentions.length > 0 ? urgencyCount / mentions.length : 0,
      
      twitterMentions: twitterCount,
      redditMentions: redditCount,
      telegramMentions: telegramCount,
      discordMentions: discordCount
    };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private getInfluencerTier(followers: number): string | null {
    if (followers >= INFLUENCER_TIERS.mega) return 'mega';
    if (followers >= INFLUENCER_TIERS.macro) return 'macro';
    if (followers >= INFLUENCER_TIERS.micro) return 'micro';
    if (followers >= INFLUENCER_TIERS.nano) return 'nano';
    return null;
  }

  private findPeakMentionTime(mentions: SocialMention[]): number {
    if (mentions.length === 0) return 0;
    
    // Group by hour and find the peak
    const hourCounts = new Map<number, number>();
    
    for (const mention of mentions) {
      const hour = Math.floor(mention.timestamp / 3600000);
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }
    
    let peakHour = 0;
    let peakCount = 0;
    
    for (const [hour, count] of hourCounts.entries()) {
      if (count > peakCount) {
        peakCount = count;
        peakHour = hour;
      }
    }
    
    return peakHour * 3600000;
  }

  private analyzeSentiment(text: string): number {
    // Simple rule-based sentiment analysis
    // In production, use a proper NLP model (e.g., VADER, BERT)
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    // Positive indicators
    const positive = ['moon', 'gem', 'rocket', '🚀', '💎', '🌙', '💰', '📈', 
                      'bullish', 'pump', 'gains', 'profit', 'love', 'amazing', 
                      'great', 'huge', 'massive', 'insane'];
    
    const negative = ['scam', 'rug', 'honeypot', 'dead', 'dump', 'rekt', 
                      'avoid', 'warning', '⚠️', '🚨', 'fake', 'bad', 'terrible',
                      'beware', 'careful'];
    
    for (const word of positive) {
      if (lowerText.includes(word)) score += 0.1;
    }
    
    for (const word of negative) {
      if (lowerText.includes(word)) score -= 0.2;
    }
    
    return Math.max(-1, Math.min(1, score));
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  getRecentMentions(tokenAddress?: string, limit: number = 50): SocialMention[] {
    if (tokenAddress) {
      const mentions = this.tokenMentions.get(tokenAddress.toLowerCase()) || [];
      return mentions.slice(-limit).reverse();
    }
    
    // Get all recent mentions across all tokens
    const allMentions: SocialMention[] = [];
    for (const mentions of this.tokenMentions.values()) {
      allMentions.push(...mentions);
    }
    
    return allMentions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getTrendingTokens(limit: number = 10): Array<{ address: string; score: number }> {
    const scores: Array<{ address: string; score: number }> = [];
    
    for (const [address, counts] of this.mentionCounts.entries()) {
      const recent = counts.slice(-5).reduce((a, b) => a + b, 0);
      const baseline = this.getBaseline(address);
      const score = baseline > 0 ? recent / baseline : recent;
      
      if (score > 1) { // Only include if above baseline
        scores.push({ address, score });
      }
    }
    
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  getStats(): {
    totalMentions: number;
    tokensTracked: number;
    platformBreakdown: Record<string, number>;
  } {
    let totalMentions = 0;
    const platformBreakdown: Record<string, number> = {
      twitter: 0,
      reddit: 0,
      telegram: 0,
      discord: 0
    };
    
    for (const mentions of this.tokenMentions.values()) {
      totalMentions += mentions.length;
      for (const mention of mentions) {
        platformBreakdown[mention.platform]++;
      }
    }
    
    return {
      totalMentions,
      tokensTracked: this.tokenMentions.size,
      platformBreakdown
    };
  }

  // Manual mention injection for testing/webhooks
  injectMention(mention: SocialMention): void {
    this.processMention(mention);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createSocialScanner(config: MemeHunterConfig): SocialScanner {
  return new SocialScanner(config);
}
