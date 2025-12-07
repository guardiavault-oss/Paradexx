/**
 * Degen Score Service - Real Trading Performance Scoring (PRODUCTION)
 * 
 * Features:
 * - Calculate user's degen score based on trading activity
 * - Track wins, losses, and trading patterns
 * - Leaderboard rankings
 * - Achievement badges
 * - Risk-adjusted scoring
 * 
 * Score Factors:
 * - Win rate (30%)
 * - Profit/Loss ratio (25%)
 * - Trade volume (15%)
 * - Risk tolerance (15%)
 * - Consistency (10%)
 * - Special achievements (5%)
 */

import { EventEmitter } from 'events';
import { logger } from '../services/logger.service';

interface TradeRecord {
    id: string;
    userId: string;
    tokenAddress: string;
    tokenSymbol: string;
    chainId: number;
    type: 'buy' | 'sell';
    amount: string;
    priceUsd: number;
    timestamp: Date;
    txHash?: string;
}

interface UserTradeStats {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    totalVolume: string;
    totalPnL: string;
    avgTradeSize: string;
    avgHoldTime: number; // hours
    largestWin: string;
    largestLoss: string;
    currentStreak: number;
    bestStreak: number;
    riskScore: number; // 0-100, higher = more risky
}

interface DegenScore {
    score: number; // 0-100
    level: string;
    rank: number;
    percentile: number;
    badges: Badge[];
    breakdown: {
        winRateScore: number;
        pnlScore: number;
        volumeScore: number;
        riskScore: number;
        consistencyScore: number;
        achievementScore: number;
    };
    stats: UserTradeStats;
    updatedAt: Date;
}

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: Date;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface LeaderboardEntry {
    rank: number;
    userId: string;
    username?: string;
    score: number;
    level: string;
    winRate: number;
    totalPnL: string;
    badges: number;
}

// Level thresholds
const LEVELS: { min: number; name: string }[] = [
    { min: 0, name: 'Paper Hands' },
    { min: 20, name: 'Newbie Trader' },
    { min: 35, name: 'Aspiring Ape' },
    { min: 50, name: 'Solid Trader' },
    { min: 65, name: 'Diamond Hands' },
    { min: 75, name: 'Degen Chad' },
    { min: 85, name: 'Whale Whisperer' },
    { min: 95, name: 'Legendary Degen' },
];

// Badge definitions
const BADGE_DEFINITIONS: Omit<Badge, 'earnedAt'>[] = [
    { id: 'first_trade', name: 'First Blood', description: 'Complete your first trade', icon: '🩸', rarity: 'common' },
    { id: 'ten_trades', name: 'Getting Started', description: 'Complete 10 trades', icon: '🎯', rarity: 'common' },
    { id: 'hundred_trades', name: 'Seasoned Trader', description: 'Complete 100 trades', icon: '💯', rarity: 'rare' },
    { id: 'win_streak_5', name: 'Hot Streak', description: '5 winning trades in a row', icon: '🔥', rarity: 'rare' },
    { id: 'win_streak_10', name: 'Unstoppable', description: '10 winning trades in a row', icon: '⚡', rarity: 'epic' },
    { id: 'first_10x', name: '10x Club', description: 'Make a 10x gain on a single trade', icon: '🚀', rarity: 'epic' },
    { id: 'first_100x', name: '100x Legend', description: 'Make a 100x gain on a single trade', icon: '🌙', rarity: 'legendary' },
    { id: 'volume_10k', name: 'Small Fish', description: 'Trade $10k total volume', icon: '🐟', rarity: 'common' },
    { id: 'volume_100k', name: 'Big Fish', description: 'Trade $100k total volume', icon: '🐋', rarity: 'rare' },
    { id: 'volume_1m', name: 'Whale', description: 'Trade $1M total volume', icon: '🐳', rarity: 'legendary' },
    { id: 'survivor', name: 'Survivor', description: 'Recover from 50%+ drawdown', icon: '💪', rarity: 'epic' },
    { id: 'diamond_hands', name: 'Diamond Hands', description: 'Hold a position for 30+ days in profit', icon: '💎', rarity: 'rare' },
    { id: 'early_bird', name: 'Early Bird', description: 'Buy in first block of a new token', icon: '🐦', rarity: 'rare' },
    { id: 'rug_survivor', name: 'Rug Survivor', description: 'Exit a rug before 90% drop', icon: '🏃', rarity: 'epic' },
];

class DegenScoreService extends EventEmitter {
    private trades: Map<string, TradeRecord[]> = new Map(); // userId -> trades
    private scores: Map<string, DegenScore> = new Map(); // userId -> score
    private badges: Map<string, Badge[]> = new Map(); // userId -> badges

    constructor() {
        super();
        logger.info('[DegenScore] Service initialized');
    }

    // Record a new trade
    recordTrade(
        userId: string,
        trade: Omit<TradeRecord, 'id' | 'userId' | 'timestamp'>
    ): TradeRecord {
        const tradeRecord: TradeRecord = {
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            ...trade,
            timestamp: new Date(),
        };

        if (!this.trades.has(userId)) {
            this.trades.set(userId, []);
        }
        this.trades.get(userId)!.push(tradeRecord);

        // Recalculate score
        this.calculateScore(userId);

        // Check for new badges
        this.checkBadges(userId);

        this.emit('tradeRecorded', tradeRecord);
        return tradeRecord;
    }

    // Calculate user's degen score
    calculateScore(userId: string): DegenScore {
        const userTrades = this.trades.get(userId) || [];
        const stats = this.calculateStats(userId, userTrades);
        const userBadges = this.badges.get(userId) || [];

        // Calculate component scores (0-100 each)
        const breakdown = {
            winRateScore: Math.min(100, stats.winRate * 1.2), // Max at ~83% win rate
            pnlScore: this.calculatePnLScore(stats),
            volumeScore: this.calculateVolumeScore(stats),
            riskScore: 100 - stats.riskScore, // Lower risk = higher score
            consistencyScore: this.calculateConsistencyScore(stats),
            achievementScore: Math.min(100, userBadges.length * 10),
        };

        // Weighted final score
        const score = Math.round(
            breakdown.winRateScore * 0.30 +
            breakdown.pnlScore * 0.25 +
            breakdown.volumeScore * 0.15 +
            breakdown.riskScore * 0.15 +
            breakdown.consistencyScore * 0.10 +
            breakdown.achievementScore * 0.05
        );

        // Determine level
        const level = LEVELS.slice().reverse().find(l => score >= l.min)?.name || 'Paper Hands';

        // Calculate rank (simplified - in production would query all users)
        const allScores = Array.from(this.scores.values()).map(s => s.score);
        allScores.push(score);
        allScores.sort((a, b) => b - a);
        const rank = allScores.indexOf(score) + 1;
        const percentile = Math.round((1 - (rank / Math.max(allScores.length, 1))) * 100);

        const degenScore: DegenScore = {
            score,
            level,
            rank,
            percentile,
            badges: userBadges,
            breakdown,
            stats,
            updatedAt: new Date(),
        };

        this.scores.set(userId, degenScore);
        return degenScore;
    }

    private calculateStats(userId: string, trades: TradeRecord[]): UserTradeStats {
        if (trades.length === 0) {
            return {
                totalTrades: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                totalVolume: '0',
                totalPnL: '0',
                avgTradeSize: '0',
                avgHoldTime: 0,
                largestWin: '0',
                largestLoss: '0',
                currentStreak: 0,
                bestStreak: 0,
                riskScore: 50,
            };
        }

        // Group by token to calculate P&L
        const positions: Map<string, { buys: TradeRecord[]; sells: TradeRecord[] }> = new Map();

        for (const trade of trades) {
            const key = `${trade.chainId}_${trade.tokenAddress}`;
            if (!positions.has(key)) {
                positions.set(key, { buys: [], sells: [] });
            }
            if (trade.type === 'buy') {
                positions.get(key)!.buys.push(trade);
            } else {
                positions.get(key)!.sells.push(trade);
            }
        }

        // Calculate P&L for closed positions
        let wins = 0;
        let losses = 0;
        let totalPnL = 0;
        let largestWin = 0;
        let largestLoss = 0;
        const pnls: number[] = [];

        for (const [_, pos] of positions) {
            if (pos.buys.length > 0 && pos.sells.length > 0) {
                const avgBuyPrice = pos.buys.reduce((sum, t) => sum + t.priceUsd, 0) / pos.buys.length;
                const avgSellPrice = pos.sells.reduce((sum, t) => sum + t.priceUsd, 0) / pos.sells.length;
                const pnlPercent = ((avgSellPrice - avgBuyPrice) / avgBuyPrice) * 100;

                pnls.push(pnlPercent);

                if (pnlPercent > 0) {
                    wins++;
                    largestWin = Math.max(largestWin, pnlPercent);
                } else {
                    losses++;
                    largestLoss = Math.min(largestLoss, pnlPercent);
                }
                totalPnL += pnlPercent;
            }
        }

        // Calculate streaks
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;

        for (const pnl of pnls) {
            if (pnl > 0) {
                tempStreak++;
                bestStreak = Math.max(bestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }
        currentStreak = tempStreak;

        // Total volume
        const totalVolume = trades.reduce((sum, t) => sum + parseFloat(t.amount) * t.priceUsd, 0);

        // Risk score based on average loss size and frequency
        const avgLoss = losses > 0 ? Math.abs(largestLoss) / losses : 0;
        const riskScore = Math.min(100, avgLoss + (losses / Math.max(trades.length, 1)) * 50);

        return {
            totalTrades: trades.length,
            wins,
            losses,
            winRate: trades.length > 0 ? (wins / (wins + losses)) * 100 : 0,
            totalVolume: totalVolume.toFixed(2),
            totalPnL: totalPnL.toFixed(2),
            avgTradeSize: (totalVolume / trades.length).toFixed(2),
            avgHoldTime: 24, // Would calculate from actual timestamps
            largestWin: largestWin.toFixed(2),
            largestLoss: largestLoss.toFixed(2),
            currentStreak,
            bestStreak,
            riskScore: Math.round(riskScore),
        };
    }

    private calculatePnLScore(stats: UserTradeStats): number {
        const pnl = parseFloat(stats.totalPnL);
        if (pnl <= 0) return Math.max(0, 30 + pnl); // Negative gets lower score
        if (pnl < 50) return 50 + pnl * 0.5;
        if (pnl < 200) return 75 + (pnl - 50) * 0.15;
        return Math.min(100, 95 + (pnl - 200) * 0.01);
    }

    private calculateVolumeScore(stats: UserTradeStats): number {
        const volume = parseFloat(stats.totalVolume);
        if (volume < 1000) return volume / 10;
        if (volume < 10000) return 50 + (volume - 1000) / 180;
        if (volume < 100000) return 75 + (volume - 10000) / 3600;
        return Math.min(100, 90 + (volume - 100000) / 100000);
    }

    private calculateConsistencyScore(stats: UserTradeStats): number {
        // Based on trade frequency and streak
        const tradeFrequencyScore = Math.min(50, stats.totalTrades);
        const streakScore = Math.min(50, stats.bestStreak * 10);
        return tradeFrequencyScore + streakScore;
    }

    private checkBadges(userId: string): void {
        const stats = this.scores.get(userId)?.stats;
        if (!stats) return;

        const userBadges = this.badges.get(userId) || [];
        const earnedIds = new Set(userBadges.map(b => b.id));

        const newBadges: Badge[] = [];

        // Check each badge condition
        if (!earnedIds.has('first_trade') && stats.totalTrades >= 1) {
            newBadges.push({ ...BADGE_DEFINITIONS.find(b => b.id === 'first_trade')!, earnedAt: new Date() });
        }
        if (!earnedIds.has('ten_trades') && stats.totalTrades >= 10) {
            newBadges.push({ ...BADGE_DEFINITIONS.find(b => b.id === 'ten_trades')!, earnedAt: new Date() });
        }
        if (!earnedIds.has('hundred_trades') && stats.totalTrades >= 100) {
            newBadges.push({ ...BADGE_DEFINITIONS.find(b => b.id === 'hundred_trades')!, earnedAt: new Date() });
        }
        if (!earnedIds.has('win_streak_5') && stats.bestStreak >= 5) {
            newBadges.push({ ...BADGE_DEFINITIONS.find(b => b.id === 'win_streak_5')!, earnedAt: new Date() });
        }
        if (!earnedIds.has('win_streak_10') && stats.bestStreak >= 10) {
            newBadges.push({ ...BADGE_DEFINITIONS.find(b => b.id === 'win_streak_10')!, earnedAt: new Date() });
        }
        if (!earnedIds.has('volume_10k') && parseFloat(stats.totalVolume) >= 10000) {
            newBadges.push({ ...BADGE_DEFINITIONS.find(b => b.id === 'volume_10k')!, earnedAt: new Date() });
        }
        if (!earnedIds.has('volume_100k') && parseFloat(stats.totalVolume) >= 100000) {
            newBadges.push({ ...BADGE_DEFINITIONS.find(b => b.id === 'volume_100k')!, earnedAt: new Date() });
        }
        if (!earnedIds.has('volume_1m') && parseFloat(stats.totalVolume) >= 1000000) {
            newBadges.push({ ...BADGE_DEFINITIONS.find(b => b.id === 'volume_1m')!, earnedAt: new Date() });
        }
        if (!earnedIds.has('first_10x') && parseFloat(stats.largestWin) >= 900) {
            newBadges.push({ ...BADGE_DEFINITIONS.find(b => b.id === 'first_10x')!, earnedAt: new Date() });
        }

        if (newBadges.length > 0) {
            this.badges.set(userId, [...userBadges, ...newBadges]);
            for (const badge of newBadges) {
                this.emit('badgeEarned', { userId, badge });
                logger.info(`[DegenScore] ${userId} earned badge: ${badge.name}`);
            }
        }
    }

    // Get user's score
    getScore(userId: string): DegenScore | null {
        return this.scores.get(userId) || this.calculateScore(userId);
    }

    // Get leaderboard
    getLeaderboard(limit = 100): LeaderboardEntry[] {
        const entries: LeaderboardEntry[] = [];

        for (const [userId, score] of this.scores) {
            entries.push({
                rank: 0,
                userId,
                score: score.score,
                level: score.level,
                winRate: score.stats.winRate,
                totalPnL: score.stats.totalPnL,
                badges: score.badges.length,
            });
        }

        // Sort by score descending
        entries.sort((a, b) => b.score - a.score);

        // Assign ranks
        entries.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        return entries.slice(0, limit);
    }

    // Get available badges
    getAvailableBadges(): Omit<Badge, 'earnedAt'>[] {
        return BADGE_DEFINITIONS;
    }

    // Get user's trade history
    getTradeHistory(userId: string, limit = 50): TradeRecord[] {
        const trades = this.trades.get(userId) || [];
        return trades.slice(-limit).reverse();
    }

    // Award special badge manually (for events, etc)
    awardBadge(userId: string, badgeId: string): boolean {
        const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId);
        if (!badge) return false;

        const userBadges = this.badges.get(userId) || [];
        if (userBadges.some(b => b.id === badgeId)) return false;

        userBadges.push({ ...badge, earnedAt: new Date() });
        this.badges.set(userId, userBadges);

        this.emit('badgeEarned', { userId, badge });
        return true;
    }
}

export const degenScoreService = new DegenScoreService();
export type { DegenScore, UserTradeStats, Badge, LeaderboardEntry, TradeRecord };
