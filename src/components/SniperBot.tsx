import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Zap,
  TrendingUp,
  Users,
  Shield,
  Target,
  CheckCircle2,
  Activity,
  BarChart3,
  Search,
  Copy,
  ExternalLink,
  Settings,
  ChevronRight,
  Sparkles,
  Eye,
  Radio,
} from "lucide-react";
import BottomNav from "./dashboard/BottomNav";
import { useSniperBot, type MemeToken, type WhaleData } from "../hooks/useSniperBot";

interface SniperBotProps {
  onClose: () => void;
  activeTab?: "home" | "trading" | "activity" | "more";
  onTabChange?: (tab: "home" | "trading" | "activity" | "more") => void;
  type?: "degen" | "regen";
}

export function SniperBot({ onClose, activeTab, onTabChange, type }: SniperBotProps) {
  const [localActiveTab, setLocalActiveTab] = useState<"discover" | "whales" | "positions" | "settings">("discover");
  const [autoSnipeEnabled, setAutoSnipeEnabled] = useState(false);
  const [copyTradingEnabled, setCopyTradingEnabled] = useState(false);
  const [stopLossEnabled, setStopLossEnabled] = useState(true);
  const [selectedToken, setSelectedToken] = useState<MemeToken | null>(null);
  const [buyAmount, setBuyAmount] = useState("0.1");

  // Use real data hook
  const {
    memeTokens,
    whales,
    positions,
    stats,
    loading,
    refresh,
    trackWhale,
    untrackWhale,
    buyToken,
    sellPosition,
  } = useSniperBot();

  const colors = {
    primary: "#ff3366",
    secondary: "#ff9500",
    gradient: "linear-gradient(135deg, rgba(255, 51, 102, 0.2) 0%, rgba(255, 149, 0, 0.1) 100%)",
    border: "rgba(255, 51, 102, 0.2)",
    glow: "0 0 20px rgba(255, 51, 102, 0.3), 0 0 40px rgba(255, 149, 0, 0.2)",
  };

  // Calculate derived stats
  const totalValue = positions.reduce((sum, p) => sum + p.valueUSD, 0);
  const totalPnLPercent = positions.length > 0 
    ? positions.reduce((sum, p) => sum + p.pnlPercent, 0) / positions.length 
    : 0;
  const activeTrades = positions.length;
  const avgROI = stats.winRate > 0 ? stats.winRate * 1.2 : 0;

  const getTierColor = (tier: MemeToken["tier"]) => {
    switch (tier) {
      case "INSTANT":
        return colors.primary;
      case "FAST":
        return colors.secondary;
      case "RESEARCH":
        return "#a855f7";
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Handle whale tracking toggle
  const handleWhaleTrack = async (whale: WhaleData) => {
    if (whale.isTracked) {
      await untrackWhale(whale.address);
    } else {
      await trackWhale(whale.address);
    }
  };

  // Handle buy token
  const handleBuyToken = async (token: MemeToken) => {
    if (buyAmount && parseFloat(buyAmount) > 0) {
      await buyToken(token.address, buyAmount);
      setSelectedToken(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[var(--bg-base)] z-50 overflow-y-auto pb-24"
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 backdrop-blur-xl border-b"
        style={{
          background: "rgba(0, 0, 0, 0.8)",
          borderColor: colors.border,
        }}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-xl transition-all"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${colors.border}`,
                }}
              >
                <ArrowLeft className="w-5 h-5" style={{ color: colors.primary }} />
              </motion.button>
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" style={{ color: colors.primary }} />
                  <h2 className="text-[var(--text-primary)]">Sniper Bot</h2>
                </div>
                <p className="text-xs text-[var(--text-primary)]/50 mt-0.5">AI-Powered Token Discovery</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.div
                className="px-3 py-1.5 rounded-lg flex items-center gap-2"
                style={{
                  background: autoSnipeEnabled ? colors.gradient : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${autoSnipeEnabled ? colors.primary : colors.border}`,
                }}
              >
                <Radio
                  className="w-4 h-4"
                  style={{ color: autoSnipeEnabled ? colors.primary : "#6b7280" }}
                />
                <span
                  className="text-xs"
                  style={{ color: autoSnipeEnabled ? colors.primary : "#6b7280" }}
                >
                  {autoSnipeEnabled ? "LIVE" : "OFF"}
                </span>
              </motion.div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <motion.div
              whileHover={{ y: -2 }}
              className="p-3 rounded-xl border backdrop-blur-sm"
              style={{
                background: colors.gradient,
                borderColor: colors.border,
              }}
            >
              <div className="text-xs text-[var(--text-primary)]/60">Total Value</div>
              <div className="text-[var(--text-primary)] mt-1">${totalValue.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" style={{ color: colors.secondary }} />
                <span className="text-xs" style={{ color: colors.secondary }}>
                  +{totalPnLPercent.toFixed(1)}%
                </span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="p-3 rounded-xl border backdrop-blur-sm"
              style={{
                background: colors.gradient,
                borderColor: colors.border,
              }}
            >
              <div className="text-xs text-[var(--text-primary)]/60">Win Rate</div>
              <div className="text-[var(--text-primary)] mt-1">{stats.winRate}%</div>
              <div className="text-xs text-[var(--text-primary)]/40 mt-1">{activeTrades} active</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="p-3 rounded-xl border backdrop-blur-sm"
              style={{
                background: colors.gradient,
                borderColor: colors.border,
              }}
            >
              <div className="text-xs text-[var(--text-primary)]/60">Avg ROI</div>
              <div className="text-[var(--text-primary)] mt-1">{avgROI.toFixed(1)}%</div>
              <div className="text-xs text-[var(--text-primary)]/40 mt-1">per trade</div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { id: "discover", label: "Discover", icon: Sparkles },
              { id: "whales", label: "Whales", icon: Users },
              { id: "positions", label: "Positions", icon: BarChart3 },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLocalActiveTab(tab.id as any)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all text-sm"
                style={{
                  background: localActiveTab === tab.id ? colors.gradient : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${localActiveTab === tab.id ? colors.primary : colors.border}`,
                  color: localActiveTab === tab.id ? colors.primary : "#9ca3af",
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        <AnimatePresence mode="wait">
          {localActiveTab === "discover" && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[var(--text-primary)]">Top Meme Tokens</h3>
                  <p className="text-xs text-[var(--text-primary)]/50 mt-1">
                    AI-scored opportunities • Updated real-time
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-xl"
                  style={{
                    background: colors.gradient,
                    border: `1px solid ${colors.primary}`,
                  }}
                >
                  <Search className="w-4 h-4" style={{ color: colors.primary }} />
                </motion.button>
              </div>

              {/* Token List */}
              <div className="space-y-3">
                {memeTokens.map((token, index) => (
                  <motion.div
                    key={token.address}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedToken(token)}
                    className="p-4 rounded-xl border backdrop-blur-sm cursor-pointer"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-[var(--text-primary)]">{token.name}</h4>
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              background: `${getTierColor(token.tier)}20`,
                              color: getTierColor(token.tier),
                            }}
                          >
                            {token.tier}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-primary)]/50">{token.symbol}</div>
                      </div>
                      <div className="text-right">
                        <div
                          className="text-lg mb-1"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          {token.score}
                        </div>
                        <div className="text-xs text-[var(--text-primary)]/50">AI Score</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-[var(--text-primary)]/50">Price</div>
                        <div className="text-sm text-[var(--text-primary)]">{token.price}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-primary)]/50">24h Change</div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" style={{ color: colors.secondary }} />
                          <span className="text-sm" style={{ color: colors.secondary }}>
                            +{token.change24h}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-primary)]/50">Market Cap</div>
                        <div className="text-sm text-[var(--text-primary)]">{token.marketCap}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {(token.sentiment * 100).toFixed(0)}% bullish
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-primary)]/30" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {localActiveTab === "whales" && (
            <motion.div
              key="whales"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-[var(--text-primary)]">Smart Money Tracking</h3>
                <p className="text-xs text-[var(--text-primary)]/50 mt-1">
                  Copy profitable whales automatically
                </p>
              </div>

              <div className="space-y-3">
                {whales.map((whale, index) => (
                  <motion.div
                    key={whale.address}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl border backdrop-blur-sm"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      borderColor: whale.isTracked ? colors.primary : colors.border,
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-[var(--text-primary)] text-sm">{whale.label}</h4>
                          {whale.isTracked && (
                            <span
                              className="text-xs px-2 py-0.5 rounded flex items-center gap-1"
                              style={{
                                background: `${colors.primary}20`,
                                color: colors.primary,
                              }}
                            >
                              <Eye className="w-3 h-3" />
                              Tracking
                            </span>
                          )}
                        </div>
                        <code className="text-xs text-[var(--text-primary)]/50 font-mono">
                          {formatAddress(whale.address)}
                        </code>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="p-2 rounded-lg"
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        <Copy className="w-4 h-4 text-[var(--text-primary)]/50" />
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-[var(--text-primary)]/50">Win Rate</div>
                        <div className="text-sm" style={{ color: colors.secondary }}>
                          {whale.winRate}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-primary)]/50">Total P&L</div>
                        <div className="text-sm" style={{ color: colors.secondary }}>
                          ${(whale.totalPnL / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-primary)]/50">Avg ROI</div>
                        <div className="text-sm text-[var(--text-primary)]">{whale.avgROI}%</div>
                      </div>
                    </div>

                    <div
                      className="p-2 rounded-lg mb-3"
                      style={{
                        background: `${colors.primary}10`,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[var(--text-primary)]/60">AI Confidence</span>
                        <span className="text-xs" style={{ color: colors.primary }}>
                          {(whale.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-[var(--bg-base)]/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${whale.confidence * 100}%` }}
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 py-2 rounded-lg text-sm transition-all"
                        style={{
                          background: whale.isTracked ? "rgba(255, 255, 255, 0.05)" : colors.gradient,
                          border: `1px solid ${whale.isTracked ? colors.border : colors.primary}`,
                          color: whale.isTracked ? "#6b7280" : colors.primary,
                        }}
                      >
                        {whale.isTracked ? "Stop Tracking" : "Track Whale"}
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 rounded-lg text-sm"
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        <ExternalLink className="w-4 h-4 text-[var(--text-primary)]/50" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {localActiveTab === "positions" && (
            <motion.div
              key="positions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-[var(--text-primary)]">Active Positions</h3>
                <p className="text-xs text-[var(--text-primary)]/50 mt-1">
                  {positions.length} open positions • Total: ${totalValue.toLocaleString()}
                </p>
              </div>

              <div className="space-y-3">
                {positions.map((position, index) => (
                  <motion.div
                    key={position.tokenAddress}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl border backdrop-blur-sm"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-[var(--text-primary)] mb-1">{position.tokenName}</h4>
                        <div className="text-xs text-[var(--text-primary)]/50">{position.tokenSymbol}</div>
                      </div>
                      <div className="text-right">
                        <div
                          className="text-lg mb-1"
                          style={{ color: position.pnl >= 0 ? colors.secondary : "#ef4444" }}
                        >
                          {position.pnl >= 0 ? "+" : ""}${position.pnl.toFixed(0)}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: position.pnl >= 0 ? colors.secondary : "#ef4444" }}
                        >
                          {position.pnl >= 0 ? "+" : ""}{position.pnlPercent.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-[var(--text-primary)]/50">Entry Price</div>
                        <div className="text-sm text-[var(--text-primary)]">
                          ${position.entryPrice.toFixed(8)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-primary)]/50">Current Price</div>
                        <div className="text-sm text-[var(--text-primary)]">
                          ${position.currentPrice.toFixed(8)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-primary)]/50">Amount</div>
                        <div className="text-sm text-[var(--text-primary)]">{position.amount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-primary)]/50">Value</div>
                        <div className="text-sm text-[var(--text-primary)]">
                          ${position.valueUSD.toFixed(0)}
                        </div>
                      </div>
                    </div>

                    {position.stopLossEnabled && (
                      <div
                        className="p-2 rounded-lg mb-3 flex items-center gap-2"
                        style={{
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                        }}
                      >
                        <Shield className="w-4 h-4 text-red-500" />
                        <div className="flex-1">
                          <div className="text-xs text-red-500">
                            Stop Loss: ${position.stopLossPrice?.toFixed(8)}
                          </div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-red-500" />
                      </div>
                    )}

                    {position.takeProfitPrice && (
                      <div
                        className="p-2 rounded-lg mb-3 flex items-center gap-2"
                        style={{
                          background: `${colors.secondary}10`,
                          border: `1px solid ${colors.secondary}30`,
                        }}
                      >
                        <Target className="w-4 h-4" style={{ color: colors.secondary }} />
                        <div className="flex-1">
                          <div className="text-xs" style={{ color: colors.secondary }}>
                            Take Profit: ${position.takeProfitPrice.toFixed(8)}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="py-2 rounded-lg text-sm transition-all"
                        style={{
                          background: colors.gradient,
                          border: `1px solid ${colors.primary}`,
                          color: colors.primary,
                        }}
                      >
                        Sell 50%
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="py-2 rounded-lg text-sm"
                        style={{
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          color: "#ef4444",
                        }}
                      >
                        Sell All
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {localActiveTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-[var(--text-primary)]">Bot Settings</h3>
                <p className="text-xs text-[var(--text-primary)]/50 mt-1">
                  Configure auto-trading and safety features
                </p>
              </div>

              <div className="space-y-3">
                {/* Auto Snipe */}
                <motion.div
                  className="p-4 rounded-xl border backdrop-blur-sm"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5" style={{ color: colors.primary }} />
                      <div>
                        <div className="text-[var(--text-primary)] text-sm">Auto Snipe</div>
                        <div className="text-xs text-[var(--text-primary)]/50">
                          Automatically buy high-scoring tokens
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAutoSnipeEnabled(!autoSnipeEnabled)}
                      className="relative w-12 h-6 rounded-full transition-all"
                      style={{
                        background: autoSnipeEnabled ? colors.gradient : "rgba(255, 255, 255, 0.1)",
                        border: `1px solid ${autoSnipeEnabled ? colors.primary : colors.border}`,
                      }}
                    >
                      <motion.div
                        animate={{ x: autoSnipeEnabled ? 24 : 2 }}
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
                      />
                    </motion.button>
                  </div>
                  {autoSnipeEnabled && (
                    <div
                      className="mt-3 p-3 rounded-lg"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <div className="text-xs text-[var(--text-primary)]/60 mb-2">Min Score for Auto-Buy</div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue="85"
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-[var(--text-primary)]/50 mt-1">
                        <span>0</span>
                        <span>100</span>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Copy Trading */}
                <motion.div
                  className="p-4 rounded-xl border backdrop-blur-sm"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" style={{ color: colors.primary }} />
                      <div>
                        <div className="text-[var(--text-primary)] text-sm">Copy Trading</div>
                        <div className="text-xs text-[var(--text-primary)]/50">
                          Auto-copy tracked whales
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCopyTradingEnabled(!copyTradingEnabled)}
                      className="relative w-12 h-6 rounded-full transition-all"
                      style={{
                        background: copyTradingEnabled
                          ? colors.gradient
                          : "rgba(255, 255, 255, 0.1)",
                        border: `1px solid ${copyTradingEnabled ? colors.primary : colors.border}`,
                      }}
                    >
                      <motion.div
                        animate={{ x: copyTradingEnabled ? 24 : 2 }}
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
                      />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Smart Stop-Loss */}
                <motion.div
                  className="p-4 rounded-xl border backdrop-blur-sm"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5" style={{ color: colors.primary }} />
                      <div>
                        <div className="text-[var(--text-primary)] text-sm">Smart Stop-Loss AI</div>
                        <div className="text-xs text-[var(--text-primary)]/50">ML-powered dump detection</div>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStopLossEnabled(!stopLossEnabled)}
                      className="relative w-12 h-6 rounded-full transition-all"
                      style={{
                        background: stopLossEnabled ? colors.gradient : "rgba(255, 255, 255, 0.1)",
                        border: `1px solid ${stopLossEnabled ? colors.primary : colors.border}`,
                      }}
                    >
                      <motion.div
                        animate={{ x: stopLossEnabled ? 24 : 2 }}
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
                      />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Max Position Size */}
                <motion.div
                  className="p-4 rounded-xl border backdrop-blur-sm"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    borderColor: colors.border,
                  }}
                >
                  <div className="mb-3">
                    <div className="text-[var(--text-primary)] text-sm mb-1">Max Position Size</div>
                    <div className="text-xs text-[var(--text-primary)]/50">
                      Maximum % of portfolio per position
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    defaultValue="10"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-[var(--text-primary)]/50 mt-2">
                    <span>1%</span>
                    <span style={{ color: colors.primary }}>10%</span>
                    <span>50%</span>
                  </div>
                </motion.div>

                {/* Default Buy Amount */}
                <motion.div
                  className="p-4 rounded-xl border backdrop-blur-sm"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    borderColor: colors.border,
                  }}
                >
                  <div className="mb-3">
                    <div className="text-[var(--text-primary)] text-sm mb-1">Default Buy Amount</div>
                    <div className="text-xs text-[var(--text-primary)]/50">ETH amount for quick buys</div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-[var(--text-primary)] outline-none"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: `1px solid ${colors.border}`,
                      }}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-primary)]/50 text-sm">
                      ETH
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Buy Modal */}
      <AnimatePresence>
        {selectedToken && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedToken(null)}
              className="fixed inset-0 bg-[var(--bg-base)]/90 backdrop-blur-xl z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto rounded-2xl border z-50 overflow-hidden"
              style={{
                background: "rgba(0, 0, 0, 0.95)",
                borderColor: colors.border,
                boxShadow: colors.glow,
              }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl text-[var(--text-primary)] mb-1">{selectedToken.name}</h3>
                    <div className="text-sm text-[var(--text-primary)]/50">{selectedToken.symbol}</div>
                  </div>
                  <div
                    className="text-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {selectedToken.score}
                  </div>
                </div>

                <div
                  className="p-4 rounded-xl mb-6"
                  style={{
                    background: colors.gradient,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-[var(--text-primary)]/60">Price</div>
                      <div className="text-[var(--text-primary)] mt-1">{selectedToken.price}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-primary)]/60">24h Change</div>
                      <div className="mt-1" style={{ color: colors.secondary }}>
                        +{selectedToken.change24h}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-primary)]/60">Market Cap</div>
                      <div className="text-[var(--text-primary)] mt-1">{selectedToken.marketCap}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-primary)]/60">Liquidity</div>
                      <div className="text-[var(--text-primary)] mt-1">{selectedToken.liquidity}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-sm text-[var(--text-primary)]/60 mb-2 block">Buy Amount (ETH)</label>
                  <input
                    type="text"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-[var(--text-primary)] outline-none"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${colors.border}`,
                    }}
                  />
                </div>

                <div className="flex gap-2 mb-4">
                  {["0.05", "0.1", "0.5", "1.0"].map((amount) => (
                    <motion.button
                      key={amount}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setBuyAmount(amount)}
                      className="flex-1 py-2 rounded-lg text-xs"
                      style={{
                        background: buyAmount === amount ? colors.gradient : "rgba(255, 255, 255, 0.05)",
                        border: `1px solid ${buyAmount === amount ? colors.primary : colors.border}`,
                        color: buyAmount === amount ? colors.primary : "#9ca3af",
                      }}
                    >
                      {amount} ETH
                    </motion.button>
                  ))}
                </div>

                <div className="flex items-center justify-between mb-6 p-3 rounded-lg" style={{ background: "rgba(255, 255, 255, 0.05)" }}>
                  <span className="text-sm text-[var(--text-primary)]/60">Auto Stop-Loss</span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="relative w-12 h-6 rounded-full transition-all"
                    style={{
                      background: stopLossEnabled ? colors.gradient : "rgba(255, 255, 255, 0.1)",
                      border: `1px solid ${stopLossEnabled ? colors.primary : colors.border}`,
                    }}
                  >
                    <motion.div
                      animate={{ x: stopLossEnabled ? 24 : 2 }}
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
                    />
                  </motion.button>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedToken(null)}
                    className="flex-1 py-3 rounded-xl text-[var(--text-primary)]"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 rounded-xl text-[var(--text-primary)] flex items-center justify-center gap-2"
                    style={{
                      background: colors.gradient,
                      border: `1px solid ${colors.primary}`,
                      boxShadow: `0 0 20px ${colors.primary}40`,
                    }}
                  >
                    <Zap className="w-5 h-5" />
                    Quick Buy
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      {activeTab && onTabChange && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={onTabChange}
          tribe={type || "degen"}
        />
      )}
    </motion.div>
  );
}