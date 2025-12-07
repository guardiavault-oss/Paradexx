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
} from "lucide-react";

interface MemeRadarProps {
  type: "degen" | "regen";
  onClose: () => void;
}

export function MemeRadar({ type, onClose }: MemeRadarProps) {
  const isDegen = type === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";

  const trending = [
    {
      name: "PEPE",
      ticker: "PEPE",
      price: "$0.0000012",
      change24h: 156.7,
      volume: "$42M",
      holders: "125K",
      tweets: "2.4K/h",
      sentiment: "bullish",
      rank: 1,
    },
    {
      name: "WOJAK",
      ticker: "WOJAK",
      price: "$0.000056",
      change24h: 89.3,
      volume: "$18M",
      holders: "68K",
      tweets: "1.8K/h",
      sentiment: "bullish",
      rank: 2,
    },
    {
      name: "FLOKI 2.0",
      ticker: "FLOKI2",
      price: "$0.00023",
      change24h: -12.5,
      volume: "$8.5M",
      holders: "42K",
      tweets: "890/h",
      sentiment: "bearish",
      rank: 3,
    },
  ];

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Trending", value: "47", icon: Flame },
            {
              label: "Avg Gain",
              value: "+156%",
              icon: TrendingUp,
            },
            {
              label: "Total Vol",
              value: "$125M",
              icon: DollarSign,
            },
            {
              label: "Hot Tweets",
              value: "12.4K",
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

        {/* Trending List */}
        <div>
          <h3 className="text-base font-black uppercase mb-4">
            🔥 Trending Now
          </h3>
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
        </div>
      </div>
    </motion.div>
  );
}