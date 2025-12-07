// ============================================================================
// APEX SNIPER - AI Scoring Engine
// ML-based meme token scoring and prediction
// ============================================================================

import EventEmitter from 'eventemitter3';
import NodeCache from 'node-cache';
import {
  MemeScore,
  MemeAlertTier,
  SocialSignals,
  OnChainSignals,
  MemeHunterConfig
} from '../types';
import { logger, generateId } from '../utils';

// ============================================================================
// FEATURE WEIGHTS
// Weights derived from historical analysis of successful meme tokens
// In production, these would be learned through ML training
// ============================================================================

const FEATURE_WEIGHTS = {
  // Social signals (40% total weight)
  social: {
    mentionVelocity: 0.08,      // Rapid mention growth is key
    influencerScore: 0.10,     // Influencer backing matters
    engagementRate: 0.06,      // Quality of engagement
    sentiment: 0.05,           // Overall sentiment
    urgencyScore: 0.03,        // FOMO indicators
    trendingBonus: 0.05,       // Is it trending
    multiPlatform: 0.03        // Cross-platform presence
  },
  
  // On-chain signals (40% total weight)
  onChain: {
    smartMoneyBuys: 0.12,      // Smart money is crucial
    buyPressure: 0.06,         // More buys than sells
    holderGrowth: 0.05,        // Growing holder base
    volumeGrowth: 0.05,        // Increasing volume
    liquidityScore: 0.05,      // Adequate liquidity
    freshWallets: 0.04,        // New wallet entries
    concentration: 0.03        // Not too concentrated
  },
  
  // Safety signals (20% total weight)
  safety: {
    lpLocked: 0.06,            // Liquidity locked
    verified: 0.04,            // Contract verified
    ownerRenounced: 0.03,      // Ownership renounced
    noHoneypot: 0.03,          // Not a honeypot
    lowTax: 0.02,              // Reasonable taxes
    noMint: 0.02               // No mint function
  }
};

// Thresholds for tier classification
const TIER_THRESHOLDS = {
  instant: 95,   // Very high confidence
  fast: 80,      // Strong signals
  research: 60   // Worth watching
};

// ============================================================================
// EVENTS
// ============================================================================

export interface ScoringEngineEvents {
  'score:calculated': (tokenAddress: string, score: MemeScore) => void;
  'tier:upgraded': (tokenAddress: string, oldTier: MemeAlertTier, newTier: MemeAlertTier) => void;
  'prediction:made': (tokenAddress: string, pumpProbability: number) => void;
}

// ============================================================================
// AI SCORING ENGINE
// ============================================================================

export class AIScoringEngine extends EventEmitter<ScoringEngineEvents> {
  private config: MemeHunterConfig;
  private scoreCache: NodeCache;
  private historicalScores: Map<string, MemeScore[]> = new Map();
  
  // Feature normalization parameters (would be learned from data)
  private normalizationParams = {
    mentionVelocity: { min: 0, max: 50 },
    influencerFollowers: { min: 0, max: 10000000 },
    engagementRate: { min: 0, max: 100 },
    volume24h: { min: 0, max: 1000000 },
    holderCount: { min: 0, max: 10000 },
    liquidityUSD: { min: 0, max: 1000000 },
    buyPressure: { min: 0, max: 100 }
  };

  constructor(memeHunterConfig: MemeHunterConfig) {
    super();
    this.config = memeHunterConfig;
    this.scoreCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
  }

  // ==========================================================================
  // MAIN SCORING FUNCTION
  // ==========================================================================

  calculateScore(
    tokenAddress: string,
    socialSignals: SocialSignals,
    onChainSignals: OnChainSignals
  ): MemeScore {
    // Extract and normalize features
    const socialFeatures = this.extractSocialFeatures(socialSignals);
    const onChainFeatures = this.extractOnChainFeatures(onChainSignals);
    const safetyFeatures = this.extractSafetyFeatures(onChainSignals);
    
    // Calculate component scores
    const socialScore = this.calculateComponentScore(socialFeatures, FEATURE_WEIGHTS.social);
    const onChainScore = this.calculateComponentScore(onChainFeatures, FEATURE_WEIGHTS.onChain);
    const safetyScore = this.calculateComponentScore(safetyFeatures, FEATURE_WEIGHTS.safety);
    
    // Calculate composite score
    let compositeScore = (socialScore + onChainScore + safetyScore) * 100;
    
    // Apply multipliers for exceptional signals
    compositeScore = this.applyMultipliers(compositeScore, socialSignals, onChainSignals);
    
    // Clamp to 0-100
    compositeScore = Math.max(0, Math.min(100, compositeScore));
    
    // Calculate confidence and predictions
    const confidence = this.calculateConfidence(socialSignals, onChainSignals);
    const pumpProbability = this.predictPumpProbability(compositeScore, confidence, socialSignals, onChainSignals);
    const rugProbability = this.predictRugProbability(onChainSignals);
    
    // Determine tier
    const tier = this.determineTier(compositeScore, confidence);
    
    // Get top contributing signals
    const topSignals = this.getTopContributingSignals(
      socialFeatures, 
      onChainFeatures, 
      safetyFeatures
    );
    
    const score: MemeScore = {
      score: Math.round(compositeScore),
      confidence,
      tier,
      socialScore: Math.round(socialScore * 100),
      onChainScore: Math.round(onChainScore * 100),
      safetyScore: Math.round(safetyScore * 100),
      topSignals,
      pumpProbability,
      rugProbability,
      timestamp: Date.now()
    };
    
    // Cache and track
    this.cacheScore(tokenAddress, score);
    
    // Emit events
    this.emit('score:calculated', tokenAddress, score);
    this.emit('prediction:made', tokenAddress, pumpProbability);
    
    // Check for tier upgrade
    this.checkTierUpgrade(tokenAddress, score);
    
    return score;
  }

  // ==========================================================================
  // FEATURE EXTRACTION
  // ==========================================================================

  private extractSocialFeatures(signals: SocialSignals): Record<string, number> {
    return {
      mentionVelocity: this.normalize(
        signals.mentionVelocity,
        this.normalizationParams.mentionVelocity
      ),
      influencerScore: this.calculateInfluencerScore(signals),
      engagementRate: this.normalize(
        signals.engagementRate,
        this.normalizationParams.engagementRate
      ),
      sentiment: (signals.sentiment + 1) / 2, // Convert -1 to 1 range to 0 to 1
      urgencyScore: signals.urgencyScore,
      trendingBonus: signals.isTrending ? 1 : 0,
      multiPlatform: this.calculateMultiPlatformScore(signals)
    };
  }

  private extractOnChainFeatures(signals: OnChainSignals): Record<string, number> {
    return {
      smartMoneyBuys: Math.min(1, signals.smartWalletsBuying.length / 5),
      buyPressure: this.normalize(
        signals.buyPressure,
        this.normalizationParams.buyPressure
      ),
      holderGrowth: Math.min(1, signals.holderGrowth24h / 100),
      volumeGrowth: Math.min(1, signals.volumeGrowth / 100),
      liquidityScore: this.calculateLiquidityScore(signals.liquidityUSD),
      freshWallets: Math.min(1, signals.freshWallets / 100),
      concentration: 1 - Math.min(1, signals.top10Concentration / 100)
    };
  }

  private extractSafetyFeatures(signals: OnChainSignals): Record<string, number> {
    return {
      lpLocked: signals.lpLocked ? 1 : 0,
      verified: signals.isVerified ? 1 : 0,
      ownerRenounced: signals.isOwnershipRenounced ? 1 : 0,
      noHoneypot: signals.hasHoneypot ? 0 : 1,
      lowTax: this.calculateTaxScore(signals.buyTax, signals.sellTax),
      noMint: signals.hasMintFunction ? 0 : 1
    };
  }

  // ==========================================================================
  // SCORE CALCULATION
  // ==========================================================================

  private calculateComponentScore(
    features: Record<string, number>,
    weights: Record<string, number>
  ): number {
    let score = 0;
    
    for (const [feature, value] of Object.entries(features)) {
      const weight = weights[feature] || 0;
      score += value * weight;
    }
    
    return score;
  }

  private applyMultipliers(
    score: number,
    social: SocialSignals,
    onChain: OnChainSignals
  ): number {
    let multiplier = 1;
    
    // Boost for exceptional social velocity
    if (social.mentionVelocity > 10) {
      multiplier *= 1.2;
    }
    
    // Boost for multiple smart money buyers
    if (onChain.smartWalletsBuying.length >= 3) {
      multiplier *= 1.15;
    }
    
    // Boost for mega influencer mention
    if (social.influencerTiers.mega > 0) {
      multiplier *= 1.25;
    }
    
    // Penalty for high concentration
    if (onChain.top10Concentration > 80) {
      multiplier *= 0.8;
    }
    
    // Penalty for no LP lock
    if (!onChain.lpLocked && onChain.contractAge < 24) {
      multiplier *= 0.85;
    }
    
    // Penalty for very new contract
    if (onChain.contractAge < 1) {
      multiplier *= 0.9;
    }
    
    return score * multiplier;
  }

  // ==========================================================================
  // PREDICTIONS
  // ==========================================================================

  private calculateConfidence(
    social: SocialSignals,
    onChain: OnChainSignals
  ): number {
    // Confidence based on data completeness and signal strength
    let confidence = 0.5;
    
    // More data = higher confidence
    if (social.mentionCount > 10) confidence += 0.1;
    if (social.mentionCount > 50) confidence += 0.1;
    if (onChain.txCount24h > 10) confidence += 0.1;
    if (onChain.totalHolders > 100) confidence += 0.1;
    
    // Strong signals = higher confidence
    if (social.isTrending) confidence += 0.05;
    if (onChain.smartWalletsBuying.length > 0) confidence += 0.1;
    if (onChain.lpLocked) confidence += 0.05;
    
    // Conflicting signals = lower confidence
    if (social.sentiment > 0.5 && onChain.buyPressure < 30) {
      confidence -= 0.1;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  private predictPumpProbability(
    score: number,
    confidence: number,
    social: SocialSignals,
    onChain: OnChainSignals
  ): number {
    // Base probability from score
    let probability = score / 100;
    
    // Adjust by confidence
    probability *= confidence;
    
    // Historical correlation factors
    // In production, these would come from ML model
    
    // Smart money presence is highly predictive
    if (onChain.smartWalletsBuying.length >= 3) {
      probability = Math.min(0.95, probability * 1.5);
    }
    
    // Strong social with weak on-chain is suspicious
    if (social.mentionVelocity > 10 && onChain.txCount24h < 5) {
      probability *= 0.6;
    }
    
    // Organic growth pattern is positive
    if (onChain.uniqueBuyers24h > onChain.uniqueSellers24h * 2) {
      probability = Math.min(0.95, probability * 1.2);
    }
    
    return Math.max(0, Math.min(0.99, probability));
  }

  private predictRugProbability(onChain: OnChainSignals): number {
    let probability = 0.1; // Base rug probability
    
    // Red flags
    if (!onChain.lpLocked) probability += 0.15;
    if (!onChain.isVerified) probability += 0.1;
    if (!onChain.isOwnershipRenounced) probability += 0.1;
    if (onChain.hasMintFunction) probability += 0.15;
    if (onChain.hasBlacklist) probability += 0.1;
    if (onChain.hasHoneypot) probability = 0.95;
    
    // High concentration is risky
    if (onChain.top10Concentration > 70) probability += 0.15;
    if (onChain.top10Concentration > 90) probability += 0.2;
    
    // Very new and low liquidity
    if (onChain.contractAge < 1 && onChain.liquidityUSD < 5000) {
      probability += 0.15;
    }
    
    // High taxes
    if (onChain.buyTax > 10 || onChain.sellTax > 15) {
      probability += 0.1;
    }
    
    return Math.max(0, Math.min(0.99, probability));
  }

  // ==========================================================================
  // TIER CLASSIFICATION
  // ==========================================================================

  private determineTier(score: number, confidence: number): MemeAlertTier {
    const adjustedScore = score * confidence;
    
    if (adjustedScore >= this.config.instantAlertThreshold || 
        adjustedScore >= TIER_THRESHOLDS.instant) {
      return MemeAlertTier.INSTANT;
    }
    
    if (adjustedScore >= this.config.fastAlertThreshold || 
        adjustedScore >= TIER_THRESHOLDS.fast) {
      return MemeAlertTier.FAST;
    }
    
    if (adjustedScore >= this.config.researchAlertThreshold || 
        adjustedScore >= TIER_THRESHOLDS.research) {
      return MemeAlertTier.RESEARCH;
    }
    
    return MemeAlertTier.RESEARCH;
  }

  // ==========================================================================
  // SIGNAL EXPLANATION
  // ==========================================================================

  private getTopContributingSignals(
    socialFeatures: Record<string, number>,
    onChainFeatures: Record<string, number>,
    safetyFeatures: Record<string, number>
  ): Array<{ name: string; value: number; contribution: number }> {
    const contributions: Array<{ name: string; value: number; contribution: number }> = [];
    
    // Calculate contribution for each feature
    const featureGroups: Array<{
      features: Record<string, number>;
      weights: Record<string, number>;
      prefix: string;
    }> = [
      { features: socialFeatures, weights: FEATURE_WEIGHTS.social, prefix: 'Social' },
      { features: onChainFeatures, weights: FEATURE_WEIGHTS.onChain, prefix: 'OnChain' },
      { features: safetyFeatures, weights: FEATURE_WEIGHTS.safety, prefix: 'Safety' }
    ];
    
    for (const { features, weights, prefix } of featureGroups) {
      for (const [feature, value] of Object.entries(features)) {
        const weight = feature in weights ? weights[feature] : 0;
        const contribution = value * weight * 100;
        
        if (contribution > 0) {
          contributions.push({
            name: this.formatFeatureName(feature, prefix),
            value: Math.round(value * 100),
            contribution: Math.round(contribution * 10) / 10
          });
        }
      }
    }
    
    // Sort by contribution and return top 5
    return contributions
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 5);
  }

  private formatFeatureName(feature: string, prefix: string): string {
    const names: Record<string, string> = {
      mentionVelocity: 'Mention Velocity',
      influencerScore: 'Influencer Activity',
      engagementRate: 'Engagement Rate',
      sentiment: 'Sentiment',
      urgencyScore: 'FOMO/Urgency',
      trendingBonus: 'Trending Status',
      multiPlatform: 'Multi-Platform',
      smartMoneyBuys: 'Smart Money',
      buyPressure: 'Buy Pressure',
      holderGrowth: 'Holder Growth',
      volumeGrowth: 'Volume Growth',
      liquidityScore: 'Liquidity',
      freshWallets: 'Fresh Wallets',
      concentration: 'Distribution',
      lpLocked: 'LP Locked',
      verified: 'Verified',
      ownerRenounced: 'Owner Renounced',
      noHoneypot: 'No Honeypot',
      lowTax: 'Low Tax',
      noMint: 'No Mint'
    };
    
    return names[feature] || feature;
  }

  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================

  private normalize(
    value: number,
    params: { min: number; max: number }
  ): number {
    const normalized = (value - params.min) / (params.max - params.min);
    return Math.max(0, Math.min(1, normalized));
  }

  private calculateInfluencerScore(signals: SocialSignals): number {
    // Weight by tier importance
    const tierWeights = {
      mega: 1.0,
      macro: 0.5,
      micro: 0.2,
      nano: 0.1
    };
    
    let score = 0;
    const tiers = signals.influencerTiers;
    
    score += tiers.mega * tierWeights.mega;
    score += tiers.macro * tierWeights.macro;
    score += tiers.micro * tierWeights.micro;
    score += tiers.nano * tierWeights.nano;
    
    // Normalize to 0-1
    return Math.min(1, score / 5);
  }

  private calculateMultiPlatformScore(signals: SocialSignals): number {
    let platforms = 0;
    if (signals.twitterMentions > 0) platforms++;
    if (signals.redditMentions > 0) platforms++;
    if (signals.telegramMentions > 0) platforms++;
    if (signals.discordMentions > 0) platforms++;
    
    return platforms / 4;
  }

  private calculateLiquidityScore(liquidityUSD: number): number {
    // Score based on liquidity thresholds
    if (liquidityUSD < 5000) return 0.1;
    if (liquidityUSD < 10000) return 0.3;
    if (liquidityUSD < 25000) return 0.5;
    if (liquidityUSD < 50000) return 0.7;
    if (liquidityUSD < 100000) return 0.85;
    return 1;
  }

  private calculateTaxScore(buyTax: number, sellTax: number): number {
    const totalTax = buyTax + sellTax;
    if (totalTax === 0) return 1;
    if (totalTax <= 5) return 0.9;
    if (totalTax <= 10) return 0.7;
    if (totalTax <= 20) return 0.4;
    return 0.1;
  }

  // ==========================================================================
  // CACHING AND TRACKING
  // ==========================================================================

  private cacheScore(tokenAddress: string, score: MemeScore): void {
    const address = tokenAddress.toLowerCase();
    
    // Cache current score
    this.scoreCache.set(`score_${address}`, score);
    
    // Track historical scores
    if (!this.historicalScores.has(address)) {
      this.historicalScores.set(address, []);
    }
    
    const history = this.historicalScores.get(address)!;
    history.push(score);
    
    // Keep only last 100 scores
    if (history.length > 100) {
      history.shift();
    }
  }

  private checkTierUpgrade(tokenAddress: string, newScore: MemeScore): void {
    const address = tokenAddress.toLowerCase();
    const history = this.historicalScores.get(address);
    
    if (history && history.length >= 2) {
      const previousScore = history[history.length - 2];
      
      if (this.tierRank(newScore.tier) > this.tierRank(previousScore.tier)) {
        this.emit('tier:upgraded', tokenAddress, previousScore.tier, newScore.tier);
        logger.info(`[AIScoringEngine] Token ${tokenAddress} upgraded from ${previousScore.tier} to ${newScore.tier}`);
      }
    }
  }

  private tierRank(tier: MemeAlertTier): number {
    switch (tier) {
      case MemeAlertTier.INSTANT: return 3;
      case MemeAlertTier.FAST: return 2;
      case MemeAlertTier.RESEARCH: return 1;
      default: return 0;
    }
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  getCachedScore(tokenAddress: string): MemeScore | undefined {
    return this.scoreCache.get<MemeScore>(`score_${tokenAddress.toLowerCase()}`);
  }

  getScoreHistory(tokenAddress: string): MemeScore[] {
    return this.historicalScores.get(tokenAddress.toLowerCase()) || [];
  }

  getAverageScore(tokenAddress: string): number {
    const history = this.getScoreHistory(tokenAddress);
    if (history.length === 0) return 0;
    
    const sum = history.reduce((acc, s) => acc + s.score, 0);
    return Math.round(sum / history.length);
  }

  getScoreTrend(tokenAddress: string): 'up' | 'down' | 'stable' {
    const history = this.getScoreHistory(tokenAddress);
    if (history.length < 3) return 'stable';
    
    const recent = history.slice(-5);
    const first = recent[0].score;
    const last = recent[recent.length - 1].score;
    
    if (last > first + 5) return 'up';
    if (last < first - 5) return 'down';
    return 'stable';
  }

  // Bulk scoring for efficiency
  async bulkCalculateScores(
    tokens: Array<{
      address: string;
      socialSignals: SocialSignals;
      onChainSignals: OnChainSignals;
    }>
  ): Promise<Map<string, MemeScore>> {
    const results = new Map<string, MemeScore>();
    
    for (const token of tokens) {
      const score = this.calculateScore(
        token.address,
        token.socialSignals,
        token.onChainSignals
      );
      results.set(token.address, score);
    }
    
    return results;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createScoringEngine(config: MemeHunterConfig): AIScoringEngine {
  return new AIScoringEngine(config);
}
