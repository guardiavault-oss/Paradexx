import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Flame,
  TrendingUp,
  TrendingDown,
  Eye,
  MessageCircle,
  Twitter,
  DollarSign,
  Users,
  Zap,
  Loader2,
} from "lucide-react";
import { useMemeRadar } from "../../hooks/useMemeRadar";

interface MemeRadarProps {
  type: "degen" | "regen";
  onClose: () => void;
}

export function MemeRadar({ type, onClose }: MemeRadarProps) {
  const isDegen = type === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";

  // Use real API data from hook
  const { tokens, loading, stats, refresh } = useMemeRadar({
    chainId: 'all',
    riskFilter: 'all',
    sortBy: 'virality',
    autoRefresh: true,
    refreshInterval: 30000,
  });

  // Transform tokens to trending format
  const trending = tokens.slice(0, 10).map((token, index) => ({
    name: token.tokenName || 'Unknown',
    ticker: token.tokenSymbol || 'TOKEN',
    price: token.priceAction?.currentPrice ? `$${parseFloat(token.priceAction.currentPrice).toFixed(8)}` : '$0.00',
    change24h: token.priceAction?.change24h || 0,
    volume: token.liquidity?.totalUsd ? `$${(token.liquidity.totalUsd / 1e6).toFixed(1)}M` : '$0',
    holders: token.holders?.total ? `${(token.holders.total / 1000).toFixed(0)}K` : '0',
    tweets: `${token.socialMentions?.twitter || 0}/h`,
    sentiment: token.viralityScore > 70 ? 'bullish' : token.viralityScore < 30 ? 'bearish' : 'neutral',
    rank: index + 1,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black text-white pb-24 md:pb-20"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 flex-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 border border-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl"
                style={{
                  background: `${accentColor}20`,
                  border: `1px solid ${accentColor}40`,
                }}
              >
                <Flame
                  className="w-6 h-6"
                  style={{ color: accentColor }}
                />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-black uppercase">
                  Meme Radar
                </h1>
                <p className="text-xs md:text-sm text-white/50">
                  Trending meme coins
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-white/40" />
          </div>
        ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Trending", value: stats.totalTokens.toString(), icon: Flame },
            {
              label: "Avg Gain",
              value: tokens.length > 0 ? `+${Math.round(tokens.reduce((sum, t) => sum + (t.priceAction?.change24h || 0), 0) / tokens.length)}%` : '+0%',
              icon: TrendingUp,
            },
            {
              label: "Total Vol",
              value: tokens.length > 0 ? `$${((tokens.reduce((sum, t) => sum + (t.liquidity?.totalUsd || 0), 0)) / 1e6).toFixed(1)}M` : '$0',
              icon: DollarSign,
            },
            {
              label: "Hot Tweets",
              value: tokens.length > 0 ? `${(tokens.reduce((sum, t) => sum + (t.socialMentions?.twitter || 0), 0) / tokens.length / 1000).toFixed(1)}K` : '0',
              icon: Twitter,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <stat.icon className="w-5 h-5 text-white/40 mb-2" />
              <div className="text-2xl font-black mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-white/60">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Trending List */}
        <div>
          <h3 className="text-base font-black uppercase mb-4">
            🔥 Trending Now
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-white/40" />
            </div>
          ) : trending.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <p>No trending tokens found</p>
              <p className="text-sm mt-2">Check back later for new meme coins</p>
            </div>
          ) : (
          <div className="space-y-3">
            {trending.map((coin, i) => (
              <motion.div
                key={coin.ticker}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                      style={{
                        background: `${accentColor}30`,
                        color: accentColor,
                      }}
                    >
                      #{coin.rank}
                    </div>
                    <div>
                      <div className="text-base font-bold">
                        {coin.name}
                      </div>
                      <div className="text-sm text-white/60">
                        ${coin.ticker}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      coin.change24h > 0
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {coin.change24h > 0 ? "+" : ""}
                    {coin.change24h}%
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-white/40 mb-1">
                      Price
                    </div>
                    <div className="font-bold">
                      {coin.price}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/40 mb-1">
                      Volume
                    </div>
                    <div className="font-bold">
                      {coin.volume}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/40 mb-1">
                      Holders
                    </div>
                    <div className="font-bold">
                      {coin.holders}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Twitter className="w-4 h-4 text-blue-400" />
                    <span>{coin.tweets}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="capitalize">
                      {coin.sentiment}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}