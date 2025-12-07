import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Flame,
  Rocket,
  Twitter,
  MessageCircle,
  AlertOctagon,
  RefreshCw,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  X,
  Zap,
  Shield,
  Users,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  Globe,
  ArrowLeft,
  ChevronDown,
  Target,
  Activity,
} from "lucide-react";
import BottomNav from "./dashboard/BottomNav";

interface MemeRadarProps {
  onClose?: () => void;
  activeTab?: "home" | "trading" | "activity" | "more";
  onTabChange?: (tab: "home" | "trading" | "activity" | "more") => void;
  type?: "degen" | "regen";
}

interface MemeToken {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  chainId: number;
  viralityScore: number;
  priceAction: {
    currentPrice: string;
    change24h: number;
  };
  socialMentions: {
    twitter: number;
    telegram: number;
    reddit: number;
    discord: number;
  };
  liquidity: {
    totalUsd: number;
    locked: boolean;
    lockDuration: number;
  };
  riskScore: number;
  recommendation: "buy" | "consider" | "wait" | "avoid";
  contractVerified: boolean;
  detectedAt: number;
  holders: {
    total: number;
    whalePercentage: number;
    distribution: string;
  };
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    website?: string;
  };
}

const CHAINS: { id: number; name: string; icon: string }[] = [
  { id: 1, name: "Ethereum", icon: "⟠" },
  { id: 56, name: "BSC", icon: "🔶" },
  { id: 8453, name: "Base", icon: "🔵" },
  { id: 42161, name: "Arbitrum", icon: "🔷" },
  { id: 10, name: "Optimism", icon: "🔴" },
  { id: 137, name: "Polygon", icon: "💜" },
];

const MOCK_TOKENS: MemeToken[] = [
  {
    tokenAddress: "0x1234567890123456789012345678901234567890",
    tokenName: "Moon Doge",
    tokenSymbol: "MDOGE",
    chainId: 1,
    viralityScore: 92,
    priceAction: { currentPrice: "0.00042", change24h: 156.8 },
    socialMentions: { twitter: 45000, telegram: 12000, reddit: 8500, discord: 3200 },
    liquidity: { totalUsd: 850000, locked: true, lockDuration: 365 },
    riskScore: 35,
    recommendation: "buy",
    contractVerified: true,
    detectedAt: Date.now() - 3600000,
    holders: { total: 8500, whalePercentage: 12, distribution: "distributed" },
    socialLinks: { twitter: "https://twitter.com", telegram: "https://t.me" },
  },
  {
    tokenAddress: "0x2345678901234567890123456789012345678901",
    tokenName: "Pepe Rocket",
    tokenSymbol: "PRKT",
    chainId: 8453,
    viralityScore: 87,
    priceAction: { currentPrice: "0.0012", change24h: 89.4 },
    socialMentions: { twitter: 32000, telegram: 9500, reddit: 6200, discord: 2100 },
    liquidity: { totalUsd: 620000, locked: true, lockDuration: 180 },
    riskScore: 42,
    recommendation: "consider",
    contractVerified: true,
    detectedAt: Date.now() - 7200000,
    holders: { total: 6200, whalePercentage: 18, distribution: "distributed" },
  },
  {
    tokenAddress: "0x3456789012345678901234567890123456789012",
    tokenName: "Shiba Moon",
    tokenSymbol: "SHMOON",
    chainId: 56,
    viralityScore: 76,
    priceAction: { currentPrice: "0.000087", change24h: -12.3 },
    socialMentions: { twitter: 18000, telegram: 5200, reddit: 3100, discord: 1200 },
    liquidity: { totalUsd: 320000, locked: false, lockDuration: 0 },
    riskScore: 68,
    recommendation: "wait",
    contractVerified: false,
    detectedAt: Date.now() - 86400000,
    holders: { total: 3400, whalePercentage: 35, distribution: "concentrated" },
  },
];

const getViralityEmojis = (score: number): string => {
  if (score >= 90) return "🔥🔥🔥🚀";
  if (score >= 75) return "🔥🔥🔥";
  if (score >= 50) return "🔥🔥";
  if (score >= 25) return "🔥";
  return "💤";
};

const getRiskColor = (score: number): string => {
  if (score >= 75) return "#DC143C";
  if (score >= 50) return "#FF6B6B";
  if (score >= 25) return "#FFB84D";
  return "#00FF88";
};

const getRiskBgColor = (score: number): string => {
  if (score >= 75) return "rgba(220, 20, 60, 0.2)";
  if (score >= 50) return "rgba(255, 107, 107, 0.2)";
  if (score >= 25) return "rgba(255, 184, 77, 0.2)";
  return "rgba(0, 255, 136, 0.2)";
};

const getRecommendationConfig = (recommendation: MemeToken["recommendation"]) => {
  switch (recommendation) {
    case "buy":
      return { bg: "#00FF88", text: "#000000", icon: Rocket, label: "BUY" };
    case "consider":
      return { bg: "#0080FF", text: "#FFFFFF", icon: TrendingUp, label: "CONSIDER" };
    case "wait":
      return { bg: "#FFB84D", text: "#000000", icon: Clock, label: "WAIT" };
    case "avoid":
    default:
      return { bg: "#DC143C", text: "#FFFFFF", icon: XCircle, label: "AVOID" };
  }
};

const formatNumber = (num: number): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(0);
};

const isNewToken = (detectedAt: number): boolean => {
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return Date.now() - detectedAt < twentyFourHours;
};

export function MemeRadar({ onClose, activeTab, onTabChange, type }: MemeRadarProps) {
  const [tokens, setTokens] = useState<MemeToken[]>(MOCK_TOKENS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedChain, setSelectedChain] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<"virality" | "volume" | "priceChange">("virality");
  const [riskFilter, setRiskFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToken, setSelectedToken] = useState<MemeToken | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 800);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setRefreshing(true);
      setTimeout(() => setRefreshing(false), 1000);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredTokens = useMemo(() => {
    let result = [...tokens];

    if (selectedChain !== "all") {
      result = result.filter((t) => t.chainId === selectedChain);
    }

    if (riskFilter !== "all") {
      result = result.filter((t) => {
        switch (riskFilter) {
          case "low":
            return t.riskScore < 25;
          case "medium":
            return t.riskScore >= 25 && t.riskScore < 50;
          case "high":
            return t.riskScore >= 50;
          default:
            return true;
        }
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.tokenName.toLowerCase().includes(query) || t.tokenSymbol.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "virality":
          return b.viralityScore - a.viralityScore;
        case "volume":
          return b.liquidity.totalUsd - a.liquidity.totalUsd;
        case "priceChange":
          return b.priceAction.change24h - a.priceAction.change24h;
        default:
          return 0;
      }
    });

    return result;
  }, [tokens, selectedChain, riskFilter, searchQuery, sortBy]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Background gradient */}
      <div
        className="fixed inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(220, 20, 60, 0.15) 0%, rgba(0, 0, 0, 0.95) 50%)",
        }}
      />

      {/* Decorative gradients */}
      {/* Removed decorative gradients
      <div
        className="absolute top-20 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none"
        style={{ background: "rgba(220, 20, 60, 0.1)" }}
      />
      <div
        className="absolute bottom-40 left-0 w-48 h-48 rounded-full blur-[100px] pointer-events-none"
        style={{ background: "rgba(139, 0, 0, 0.1)" }}
      />
      */}

      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-50 border-b"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(220, 20, 60, 0.2)",
        }}
      >
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl transition-all hover:bg-white/10"
                style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #DC143C 0%, #8B0000 100%)",
                boxShadow: "0 0 30px rgba(220, 20, 60, 0.5)",
              }}
            >
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase">Meme Radar</h1>
              <p className="text-xs sm:text-sm" style={{ color: "#DC143C" }}>
                Discover Trending Tokens
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 sm:p-3 rounded-xl transition-all ${
                autoRefresh ? "bg-[#00FF88]/20" : "hover:bg-white/10"
              }`}
              style={{ border: `1px solid ${autoRefresh ? "#00FF88" : "rgba(255, 255, 255, 0.1)"}` }}
            >
              <Zap
                className="w-5 h-5"
                style={{ color: autoRefresh ? "#00FF88" : "rgba(255, 255, 255, 0.6)" }}
              />
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 sm:p-3 rounded-xl transition-all hover:bg-white/10"
              style={{ border: "1px solid rgba(220, 20, 60, 0.2)" }}
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                style={{ color: "#DC143C" }}
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 pb-24 overflow-y-auto h-[calc(100vh-80px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: "rgba(255, 255, 255, 0.4)" }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tokens..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-white/40 focus:outline-none transition-all"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  border: "1px solid rgba(220, 20, 60, 0.3)",
                }}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                className="px-4 py-2 rounded-xl text-white focus:outline-none transition-all"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  border: "1px solid rgba(220, 20, 60, 0.3)",
                }}
              >
                <option value="all">All Chains</option>
                {CHAINS.map((chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chain.icon} {chain.name}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 rounded-xl text-white focus:outline-none transition-all"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  border: "1px solid rgba(220, 20, 60, 0.3)",
                }}
              >
                <option value="virality">🔥 Virality</option>
                <option value="volume">📊 Volume</option>
                <option value="priceChange">📈 Price Change</option>
              </select>

              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as any)}
                className="px-4 py-2 rounded-xl text-white focus:outline-none transition-all"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  border: "1px solid rgba(220, 20, 60, 0.3)",
                }}
              >
                <option value="all">All Risk</option>
                <option value="low">🟢 Low Risk</option>
                <option value="medium">🟡 Medium Risk</option>
                <option value="high">🔴 High Risk</option>
              </select>
            </div>

            <div className="flex items-center justify-between px-1">
              <p className="text-white/60 text-sm">
                {filteredTokens.length} trending {filteredTokens.length === 1 ? "token" : "tokens"}
              </p>
              {autoRefresh && (
                <div className="flex items-center gap-2 text-[#00FF88] text-sm">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#00FF88" }}
                  />
                  Auto-updating
                </div>
              )}
            </div>
          </motion.div>

          {/* Tokens Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="h-64 rounded-2xl animate-pulse"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    border: "1px solid rgba(220, 20, 60, 0.2)",
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredTokens.map((token, index) => {
                  const recConfig = getRecommendationConfig(token.recommendation);
                  const RecIcon = recConfig.icon;
                  const isNew = isNewToken(token.detectedAt);
                  const pricePositive = token.priceAction.change24h >= 0;

                  return (
                    <motion.div
                      key={token.tokenAddress}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClick={() => setSelectedToken(token)}
                      className="group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300"
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(220, 20, 60, 0.2)",
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(220, 20, 60, 0.1) 0%, rgba(139, 0, 0, 0.1) 100%)",
                        }}
                      />

                      {isNew && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 z-10"
                        >
                          <motion.span
                            animate={{
                              boxShadow: [
                                "0 0 10px rgba(0, 255, 136, 0.5)",
                                "0 0 20px rgba(0, 255, 136, 0.8)",
                                "0 0 10px rgba(0, 255, 136, 0.5)",
                              ],
                            }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="px-2 py-1 rounded-full flex items-center gap-1 font-black text-xs uppercase"
                            style={{ backgroundColor: "#00FF88", color: "#000000" }}
                          >
                            <Zap className="w-3 h-3" />
                            NEW
                          </motion.span>
                        </motion.div>
                      )}

                      <div className="p-5 relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black"
                              style={{
                                background:
                                  "linear-gradient(135deg, rgba(220, 20, 60, 0.3) 0%, rgba(139, 0, 0, 0.3) 100%)",
                                border: "1px solid rgba(220, 20, 60, 0.3)",
                              }}
                            >
                              {token.tokenSymbol.slice(0, 2)}
                            </div>
                            <div>
                              <h3 className="text-white font-black text-lg">{token.tokenName}</h3>
                              <div className="flex items-center gap-2">
                                <span className="text-white/60 text-sm">${token.tokenSymbol}</span>
                                {CHAINS.find((c) => c.id === token.chainId) && (
                                  <span className="text-xs">
                                    {CHAINS.find((c) => c.id === token.chainId)?.icon}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div
                            className="px-2 py-1 rounded-lg flex items-center gap-1 font-black text-xs uppercase"
                            style={{ backgroundColor: recConfig.bg, color: recConfig.text }}
                          >
                            <RecIcon className="w-3 h-3" />
                            {recConfig.label}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-white/60 text-xs mb-1">Price</p>
                            <p className="text-white font-bold">${token.priceAction.currentPrice}</p>
                            <div
                              className={`flex items-center gap-1 text-sm`}
                              style={{ color: pricePositive ? "#00FF88" : "#DC143C" }}
                            >
                              {pricePositive ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {pricePositive ? "+" : ""}
                              {token.priceAction.change24h.toFixed(1)}%
                            </div>
                          </div>

                          <div>
                            <p className="text-white/60 text-xs mb-1">Virality Score</p>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-black text-lg">
                                {token.viralityScore}
                              </span>
                              <span className="text-sm">{getViralityEmojis(token.viralityScore)}</span>
                            </div>
                          </div>
                        </div>

                        <div
                          className="flex items-center justify-between mb-4 p-3 rounded-xl"
                          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1" style={{ color: "#1DA1F2" }}>
                              <Twitter className="w-4 h-4" />
                              <span className="text-xs">
                                {formatNumber(token.socialMentions.twitter)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1" style={{ color: "#0088CC" }}>
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-xs">
                                {formatNumber(token.socialMentions.telegram)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1" style={{ color: "#FF6B6B" }}>
                              <Globe className="w-4 h-4" />
                              <span className="text-xs">
                                {formatNumber(token.socialMentions.reddit)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {token.liquidity.locked ? (
                              <div
                                className="flex items-center gap-1 text-xs"
                                style={{ color: "#00FF88" }}
                              >
                                <Lock className="w-3 h-3" />
                                <span>Locked {token.liquidity.lockDuration}d</span>
                              </div>
                            ) : (
                              <div
                                className="flex items-center gap-1 text-xs"
                                style={{ color: "#DC143C" }}
                              >
                                <Unlock className="w-3 h-3" />
                                <span>Unlocked</span>
                              </div>
                            )}
                            <span className="text-white/60 text-xs">
                              ${formatNumber(token.liquidity.totalUsd)} Liq
                            </span>
                          </div>

                          <div
                            className="flex items-center gap-1 px-2 py-1 rounded-lg border"
                            style={{
                              backgroundColor: getRiskBgColor(token.riskScore),
                              borderColor: getRiskColor(token.riskScore),
                              color: getRiskColor(token.riskScore),
                            }}
                          >
                            <AlertOctagon className="w-3 h-3" />
                            <span className="text-xs font-bold">Risk: {token.riskScore}</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className="h-1"
                        style={{
                          background: `linear-gradient(90deg, ${getRiskColor(
                            token.riskScore
                          )} 0%, rgba(220, 20, 60, 0.5) 100%)`,
                        }}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Token Details Modal */}
      <AnimatePresence>
        {selectedToken && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
            onClick={() => setSelectedToken(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-2xl border"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.95)",
                backdropFilter: "blur(40px)",
                borderColor: "rgba(220, 20, 60, 0.3)",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black"
                    style={{
                      background: "linear-gradient(135deg, #DC143C 0%, #8B0000 100%)",
                    }}
                  >
                    {selectedToken.tokenSymbol.slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{selectedToken.tokenName}</h2>
                    <p className="text-white/60">${selectedToken.tokenSymbol}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedToken(null)}
                  className="p-2 rounded-xl hover:bg-white/10 transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Full token details would go here */}
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      border: "1px solid rgba(220, 20, 60, 0.2)",
                    }}
                  >
                    <p className="text-white/60 text-xs mb-1">Virality Score</p>
                    <div className="text-3xl font-black text-white">
                      {selectedToken.viralityScore}/100
                    </div>
                    <p className="text-sm mt-1">{getViralityEmojis(selectedToken.viralityScore)}</p>
                  </div>

                  <div
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      border: "1px solid rgba(220, 20, 60, 0.2)",
                    }}
                  >
                    <p className="text-white/60 text-xs mb-1">Risk Score</p>
                    <div
                      className="text-3xl font-black"
                      style={{ color: getRiskColor(selectedToken.riskScore) }}
                    >
                      {selectedToken.riskScore}/100
                    </div>
                  </div>
                </div>

                <div
                  className="p-4 rounded-xl"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    border: "1px solid rgba(220, 20, 60, 0.2)",
                  }}
                >
                  <p className="text-xs text-white/60 text-center">
                    Token Address: {selectedToken.tokenAddress}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
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
    </div>
  );
}