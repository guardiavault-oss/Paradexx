import { motion } from 'motion/react';
import { TrendingUp, Award, Star, Zap, Shield, Activity } from 'lucide-react';

export interface ScoreData {
  total: number;
  level: number;
  nextLevelAt: number;
  breakdown: {
    transactions: number;
    volume: number;
    security: number;
    social: number;
    longevity: number;
  };
  badges: Badge[];
  rank?: string;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: number;
}

interface UserScoreProps {
  score: ScoreData;
  type: 'degen' | 'regen';
  showDetails?: boolean;
}

export function UserScore({ score, type, showDetails = false }: UserScoreProps) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';
  const secondaryColor = isDegen ? '#8B0000' : '#000080';

  const progress = (score.total / score.nextLevelAt) * 100;

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-yellow-400" />
        <span className="font-bold text-white">{score.total.toLocaleString()}</span>
        <span className="text-xs text-white/60">Lvl {score.level}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Level Progress */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
              }}
            >
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm text-white/60">Level {score.level}</div>
              <div className="text-2xl font-black text-white">
                {score.total.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/60">Next Level</div>
            <div className="text-sm font-bold text-white">
              {score.nextLevelAt.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="text-xs text-white/60 mt-1">
          {((score.nextLevelAt - score.total)).toLocaleString()} points to next level
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
        <h4 className="text-sm font-bold text-white">Score Breakdown</h4>
        
        {[
          { key: 'transactions', label: 'Transactions', icon: Activity, color: '#22C55E' },
          { key: 'volume', label: 'Volume', icon: TrendingUp, color: '#3B82F6' },
          { key: 'security', label: 'Security', icon: Shield, color: '#8B5CF6' },
          { key: 'social', label: 'Social', icon: Star, color: '#F59E0B' },
          { key: 'longevity', label: 'Longevity', icon: Zap, color: '#EC4899' },
        ].map(({ key, label, icon: Icon, color }) => {
          const value = score.breakdown[key as keyof typeof score.breakdown];
          const percent = (value / score.total) * 100;

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className="text-sm text-white">{label}</span>
                </div>
                <span className="text-sm font-bold text-white">
                  {value.toLocaleString()}
                </span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Rank */}
      {score.rank && (
        <div className="p-4 rounded-xl border border-white/10" style={{ background: `${accentColor}10` }}>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
              }}
            >
              🏆
            </div>
            <div>
              <div className="text-xs text-white/60">Global Rank</div>
              <div className="text-xl font-black" style={{ color: accentColor }}>
                {score.rank}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badges */}
      {score.badges.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white">Earned Badges</h4>
          <div className="grid grid-cols-2 gap-2">
            {score.badges.slice(0, 6).map((badge) => (
              <BadgeCard key={badge.id} badge={badge} type={type} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Badge Card
function BadgeCard({ badge, type }: { badge: Badge; type: 'degen' | 'regen' }) {
  const rarityColors = {
    common: '#9CA3AF',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="p-3 rounded-xl border transition-all"
      style={{
        background: `${rarityColors[badge.rarity]}10`,
        borderColor: `${rarityColors[badge.rarity]}40`,
      }}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            background: `${rarityColors[badge.rarity]}20`,
          }}
        >
          {badge.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-white truncate">
            {badge.name}
          </div>
          <div className="text-xs text-white/60 line-clamp-2">
            {badge.description}
          </div>
          {badge.earnedAt && (
            <div className="text-[10px] text-white/40 mt-1">
              {new Date(badge.earnedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Score gain animation
export function ScoreGainAnimation({
  amount,
  type,
}: {
  amount: number;
  type: 'degen' | 'regen';
}) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 1 }}
      animate={{ opacity: [0, 1, 1, 0], y: -50, scale: [1, 1.2, 1] }}
      transition={{ duration: 2 }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none"
    >
      <div
        className="px-6 py-3 rounded-xl font-black text-2xl text-white"
        style={{
          background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}80 100%)`,
          boxShadow: `0 0 30px ${accentColor}80`,
        }}
      >
        +{amount} ⭐
      </div>
    </motion.div>
  );
}

// Calculate score from activities
export function calculateScore(activities: {
  transactionCount: number;
  totalVolume: number;
  securityScore: number;
  guardianCount: number;
  accountAge: number; // in days
}): ScoreData {
  const transactionScore = activities.transactionCount * 10;
  const volumeScore = Math.floor(activities.totalVolume / 100) * 5;
  const securityScore = activities.securityScore * 20;
  const socialScore = activities.guardianCount * 50;
  const longevityScore = Math.floor(activities.accountAge / 30) * 100;

  const total = transactionScore + volumeScore + securityScore + socialScore + longevityScore;
  const level = Math.floor(total / 1000) + 1;
  const nextLevelAt = level * 1000;

  return {
    total,
    level,
    nextLevelAt,
    breakdown: {
      transactions: transactionScore,
      volume: volumeScore,
      security: securityScore,
      social: socialScore,
      longevity: longevityScore,
    },
    badges: [],
  };
}

// Example badges
export const EXAMPLE_BADGES: Badge[] = [
  {
    id: 'first-tx',
    name: 'First Steps',
    emoji: '👶',
    description: 'Made your first transaction',
    rarity: 'common',
  },
  {
    id: 'whale',
    name: 'Whale',
    emoji: '🐋',
    description: 'Traded over $100k volume',
    rarity: 'epic',
  },
  {
    id: 'guardian',
    name: 'Protected',
    emoji: '🛡️',
    description: 'Set up wallet guardians',
    rarity: 'rare',
  },
  {
    id: 'diamond',
    name: 'Diamond Hands',
    emoji: '💎',
    description: 'Held for over 1 year',
    rarity: 'legendary',
  },
  {
    id: 'social',
    name: 'Social Butterfly',
    emoji: '🦋',
    description: 'Connected 5+ guardians',
    rarity: 'rare',
  },
  {
    id: 'early',
    name: 'Early Adopter',
    emoji: '🚀',
    description: 'Joined in the first month',
    rarity: 'legendary',
  },
];
