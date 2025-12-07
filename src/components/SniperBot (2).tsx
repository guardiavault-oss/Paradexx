import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import {
  ArrowLeft,
  Zap,
  TrendingUp,
  Users,
  Shield,
  Brain,
  Target,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  DollarSign,
  Percent,
  BarChart3,
  Search,
  Copy,
  ExternalLink,
  Settings,
  Play,
  Pause,
  ChevronRight,
  Sparkles,
  Eye,
  Radio,
} from "lucide-react";
import BottomNav from "./dashboard/BottomNav";

interface SniperBotProps {
  onClose: () => void;
  activeTab?: "home" | "trading" | "activity" | "more";
  onTabChange?: (tab: "home" | "trading" | "activity" | "more") => void;
  type?: "degen" | "regen";
}

interface MemeToken {
  address: string;
  name: string;
  symbol: string;
  score: number;
  price: string;
  change24h: number;
  marketCap: string;
  liquidity: string;
  holders: number;
  sentiment: number;
  tier: "INSTANT" | "FAST" | "RESEARCH";
}

interface WhaleData {
  address: string;
  label: string;
  winRate: number;
  totalPnL: number;
  recentTrades: number;
  avgROI: number;
  isTracked: boolean;
  confidence: number;
}

interface Position {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  entryPrice: number;
  currentPrice: number;
  amount: string;
  valueUSD: number;
  pnl: number;
  pnlPercent: number;
  stopLossEnabled: boolean;
  stopLossPrice?: number;
  takeProfitPrice?: number;
}

export function SniperBot({ onClose, activeTab, onTabChange, type }: SniperBotProps) {
  const [localActiveTab, setLocalActiveTab] = useState<"discover" | "whales" | "positions" | "settings">("discover");
  const [autoSnipeEnabled, setAutoSnipeEnabled] = useState(false);
  const [copyTradingEnabled, setCopyTradingEnabled] = useState(false);
  const [stopLossEnabled, setStopLossEnabled] = useState(true);
  const [selectedToken, setSelectedToken] = useState<MemeToken | null>(null);
  const [buyAmount, setBuyAmount] = useState("0.1");

  const colors = {
    primary: "#ff3366",
    secondary: "#ff9500",
    gradient: "linear-gradient(135deg, rgba(255, 51, 102, 0.2) 0%, rgba(255, 149, 0, 0.1) 100%)",
    border: "rgba(255, 51, 102, 0.2)",
    glow: "0 0 20px rgba(255, 51, 102, 0.3), 0 0 40px rgba(255, 149, 0, 0.2)",
  };

  // Mock data - Meme tokens
  const memeTokens: MemeToken[] = [
    {
      address: "0x1234567890abcdef1234567890abcdef12345678",
      name: "Pepe Coin",
      symbol: "PEPE",
      score: 95,
      price: "$0.00000123",
      change24h: 145.6,
      marketCap: "$450M",
      liquidity: "$12M",
      holders: 45000,
      sentiment: 0.85,
      tier: "INSTANT",
    },
    {
      address: "0x2345678901bcdef1234567890abcdef123456789",
      name: "Wojak Finance",
      symbol: "WOJAK",
      score: 88,
      price: "$0.0000567",
      change24h: 78.3,
      marketCap: "$230M",
      liquidity: "$8M",
      holders: 32000,
      sentiment: 0.72,
      tier: "FAST",
    },
    {
      address: "0x3456789012cdef1234567890abcdef1234567890",
      name: "Doge Killer",
      symbol: "DOGEK",
      score: 82,
      price: "$0.000234",
      change24h: 56.7,
      marketCap: "$180M",
      liquidity: "$5M",
      holders: 28000,
      sentiment: 0.68,
      tier: "FAST",
    },
    {
      address: "0x4567890123def1234567890abcdef12345678901",
      name: "Shiba Inu 2.0",
      symbol: "SHIB2",
      score: 75,
      price: "$0.00000890",
      change24h: 34.2,
      marketCap: "$120M",
      liquidity: "$4M",
      holders: 22000,
      sentiment: 0.61,
      tier: "RESEARCH",
    },
  ];

  // Mock data - Whales
  const whales: WhaleData[] = [
    {
      address: "0xwhale1234567890abcdef1234567890abcdef12",
      label: "Smart Money #1",
      winRate: 82.5,
      totalPnL: 450000,
      recentTrades: 45,
      avgROI: 125.3,
      isTracked: true,
      confidence: 0.89,
    },
    {
      address: "0xwhale2345678901bcdef1234567890abcdef123",
      label: "Degen King",
      winRate: 76.8,
      totalPnL: 320000,
      recentTrades: 38,
      avgROI: 98.7,
      isTracked: true,
      confidence: 0.82,
    },
    {
      address: "0xwhale3456789012cdef1234567890abcdef1234",
      label: "Whale Watcher",
      winRate: 71.2,
      totalPnL: 280000,
      recentTrades: 52,
      avgROI: 87.4,
      isTracked: false,
      confidence: 0.76,
    },
  ];

  // Mock data - Positions
  const positions: Position[] = [
    {
      tokenAddress: "0xpos1234567890abcdef1234567890abcdef12345",
      tokenName: "Pepe Coin",
      tokenSymbol: "PEPE",
      entryPrice: 0.00000089,
      currentPrice: 0.00000123,
      amount: "1,000,000,000",
      valueUSD: 1230,
      pnl: 340,
      pnlPercent: 38.2,
      stopLossEnabled: true,
      stopLossPrice: 0.00000067,
      takeProfitPrice: 0.00000178,
    },
    {
      tokenAddress: "0xpos2345678901bcdef1234567890abcdef123456",
      tokenName: "Wojak Finance",
      tokenSymbol: "WOJAK",
      entryPrice: 0.0000412,
      currentPrice: 0.0000567,
      amount: "50,000,000",
      valueUSD: 2835,
      pnl: 775,
      pnlPercent: 37.6,
      stopLossEnabled: true,
      stopLossPrice: 0.0000309,
    },
  ];

  const stats = {
    totalValue: positions.reduce((sum, p) => sum + p.valueUSD, 0),
    totalPnL: positions.reduce((sum, p) => sum + p.pnl, 0),
    totalPnLPercent: 37.9,
    activeTrades: positions.length,
    winRate: 78.5,
    avgROI: 92.3,
  };

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 overflow-y-auto pb-24"
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
                  <h2 className="text-white">Sniper Bot</h2>
                </div>
                <p className="text-xs text-white/50 mt-0.5">AI-Powered Token Discovery</p>
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
              <div className="text-xs text-white/60">Total Value</div>
              <div className="text-white mt-1">${stats.totalValue.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" style={{ color: colors.secondary }} />
                <span className="text-xs" style={{ color: colors.secondary }}>
                  +{stats.totalPnLPercent}%
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
              <div className="text-xs text-white/60">Win Rate</div>
              <div className="text-white mt-1">{stats.winRate}%</div>
              <div className="text-xs text-white/40 mt-1">{stats.activeTrades} active</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="p-3 rounded-xl border backdrop-blur-sm"
              style={{
                background: colors.gradient,
                borderColor: colors.border,
              }}
            >
              <div className="text-xs text-white/60">Avg ROI</div>
              <div className="text-white mt-1">{stats.avgROI}%</div>
              <div className="text-xs text-white/40 mt-1">per trade</div>
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
                  <h3 className="text-white">Top Meme Tokens</h3>
                  <p className="text-xs text-white/50 mt-1">
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
                          <h4 className="text-white">{token.name}</h4>
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
                        <div className="text-xs text-white/50">{token.symbol}</div>
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
                        <div className="text-xs text-white/50">AI Score</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-white/50">Price</div>
                        <div className="text-sm text-white">{token.price}</div>
                      </div>
                      <div>
                        <div className="text-xs text-white/50">24h Change</div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" style={{ color: colors.secondary }} />
                          <span className="text-sm" style={{ color: colors.secondary }}>
                            +{token.change24h}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-white/50">Market Cap</div>
                        <div className="text-sm text-white">{token.marketCap}</div>
                      </div>
                      <div>
                        <div className="text-xs text-white/50">Liquidity</div>
                        <div className="text-sm text-white">{token.liquidity}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: colors.border }}>
                      <div className="flex items-center gap-3 text-xs text-white/50">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {token.holders.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {(token.sentiment * 100).toFixed(0)}% bullish
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30" />
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
                <h3 className="text-white">Smart Money Tracking</h3>
                <p className="text-xs text-white/50 mt-1">
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
                          <h4 className="text-white text-sm">{whale.label}</h4>
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
                        <code className="text-xs text-white/50 font-mono">
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
                        <Copy className="w-4 h-4 text-white/50" />
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-white/50">Win Rate</div>
                        <div className="text-sm" style={{ color: colors.secondary }}>
                          {whale.winRate}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-white/50">Total P&L</div>
                        <div className="text-sm" style={{ color: colors.secondary }}>
                          ${(whale.totalPnL / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-white/50">Avg ROI</div>
                        <div className="text-sm text-white">{whale.avgROI}%</div>
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
                        <span className="text-xs text-white/60">AI Confidence</span>
                        <span className="text-xs" style={{ color: colors.primary }}>
                          {(whale.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
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
                        <ExternalLink className="w-4 h-4 text-white/50" />
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
                <h3 className="text-white">Active Positions</h3>
                <p className="text-xs text-white/50 mt-1">
                  {positions.length} open positions • Total: ${stats.totalValue.toLocaleString()}
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
                        <h4 className="text-white mb-1">{position.tokenName}</h4>
                        <div className="text-xs text-white/50">{position.tokenSymbol}</div>
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
                        <div className="text-xs text-white/50">Entry Price</div>
                        <div className="text-sm text-white">
                          ${position.entryPrice.toFixed(8)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-white/50">Current Price</div>
                        <div className="text-sm text-white">
                          ${position.currentPrice.toFixed(8)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-white/50">Amount</div>
                        <div className="text-sm text-white">{position.amount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-white/50">Value</div>
                        <div className="text-sm text-white">
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
                <h3 className="text-white">Bot Settings</h3>
                <p className="text-xs text-white/50 mt-1">
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
                        <div className="text-white text-sm">Auto Snipe</div>
                        <div className="text-xs text-white/50">
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
                      <div className="text-xs text-white/60 mb-2">Min Score for Auto-Buy</div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue="85"
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-white/50 mt-1">
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
                        <div className="text-white text-sm">Copy Trading</div>
                        <div className="text-xs text-white/50">
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
                        <div className="text-white text-sm">Smart Stop-Loss AI</div>
                        <div className="text-xs text-white/50">ML-powered dump detection</div>
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
                    <div className="text-white text-sm mb-1">Max Position Size</div>
                    <div className="text-xs text-white/50">
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
                  <div className="flex justify-between text-xs text-white/50 mt-2">
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
                    <div className="text-white text-sm mb-1">Default Buy Amount</div>
                    <div className="text-xs text-white/50">ETH amount for quick buys</div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-white outline-none"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: `1px solid ${colors.border}`,
                      }}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-sm">
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
              className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50"
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
                    <h3 className="text-xl text-white mb-1">{selectedToken.name}</h3>
                    <div className="text-sm text-white/50">{selectedToken.symbol}</div>
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
                      <div className="text-xs text-white/60">Price</div>
                      <div className="text-white mt-1">{selectedToken.price}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/60">24h Change</div>
                      <div className="mt-1" style={{ color: colors.secondary }}>
                        +{selectedToken.change24h}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/60">Market Cap</div>
                      <div className="text-white mt-1">{selectedToken.marketCap}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/60">Liquidity</div>
                      <div className="text-white mt-1">{selectedToken.liquidity}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-sm text-white/60 mb-2 block">Buy Amount (ETH)</label>
                  <input
                    type="text"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white outline-none"
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
                  <span className="text-sm text-white/60">Auto Stop-Loss</span>
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
                    className="flex-1 py-3 rounded-xl text-white"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 rounded-xl text-white flex items-center justify-center gap-2"
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