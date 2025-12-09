import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getThemeStyles } from "../../design-system";
import {
  PieChart as PieChartIcon,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Download,
  Calendar,
  DollarSign,
  BarChart3,
  Target,
  Shield,
  AlertTriangle,
  FileText,
  Wallet,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StaggeredList, CardReveal, FadeScale } from "../ui";
import { FullscreenLoading } from "../ui/LoadingStates";
import { Button, Badge, GlassCard } from "../ui";

interface PortfolioAnalyticsProps {
  onBack?: () => void;
  onClose?: () => void;
  type?: "degen" | "regen";
}

interface TokenHolding {
  symbol: string;
  name: string;
  balance: string;
  value: number;
  price: number;
  change24h: number;
  allocation: number;
  pnl?: number;
  pnlPercent?: number;
}

interface PerformanceMetrics {
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  dayChange: number;
  dayChangePercent: number;
  weekChange: number;
  weekChangePercent: number;
  monthChange: number;
  monthChangePercent: number;
}

interface RiskMetrics {
  diversificationScore: number;
  concentrationRisk: string;
  largestPosition: { symbol: string; percentage: number };
  stablecoinRatio: number;
  riskLevel: string;
  suggestions: string[];
}

export function PortfolioAnalytics({
  onBack,
  onClose,
  type = "degen",
}: PortfolioAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "allocation" | "risk" | "tax"
  >("overview");
  const [timeframe, setTimeframe] = useState<
    "24h" | "7d" | "30d" | "90d" | "1y"
  >("30d");
  const [chartType, setChartType] = useState<"line" | "area">(
    "area",
  );
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<TokenHolding[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics>({
    totalValue: 0,
    totalPnl: 0,
    totalPnlPercent: 0,
    dayChange: 0,
    dayChangePercent: 0,
    weekChange: 0,
    weekChangePercent: 0,
    monthChange: 0,
    monthChangePercent: 0,
  });
  const [risk, setRisk] = useState<RiskMetrics>({
    diversificationScore: 0,
    concentrationRisk: "low",
    largestPosition: { symbol: "", percentage: 0 },
    stablecoinRatio: 0,
    riskLevel: "conservative",
    suggestions: [],
  });
  const [historicalData, setHistoricalData] = useState<{ date: string; value: number; timestamp: number }[]>([]);

  const isDegen = type === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";
  const secondaryColor = isDegen ? "#8B0000" : "#000080";

  // Fetch portfolio data from backend API
  useEffect(() => {
    const fetchPortfolioData = async () => {
      setLoading(true);
      try {
        const { API_URL } = await import('../../config/api');
        // Get wallet address from localStorage
        const storedWallet = localStorage.getItem('paradex_wallet');
        const walletData = storedWallet ? JSON.parse(storedWallet) : null;
        const walletAddress = walletData?.address || '0x0000000000000000000000000000000000000000';

        // Fetch portfolio data
        const [portfolioRes, performanceRes, riskRes, historyRes] = await Promise.all([
          fetch(`${API_URL}/api/portfolio/${walletAddress}`).catch(() => null),
          fetch(`${API_URL}/api/portfolio/${walletAddress}/performance?timeframe=${timeframe}`).catch(() => null),
          fetch(`${API_URL}/api/portfolio/${walletAddress}/risk`).catch(() => null),
          fetch(`${API_URL}/api/portfolio/${walletAddress}/history?timeframe=${timeframe}`).catch(() => null),
        ]);

        // Process portfolio tokens
        if (portfolioRes?.ok) {
          const portfolioData = await portfolioRes.json();
          if (portfolioData.tokens) {
            setTokens(portfolioData.tokens.map((t: any) => ({
              symbol: t.symbol,
              name: t.name || t.symbol,
              balance: t.balance,
              value: t.value || 0,
              price: t.price || 0,
              change24h: t.change24h || 0,
              allocation: t.allocation || 0,
              pnl: t.pnl || 0,
              pnlPercent: t.pnlPercent || 0,
            })));
          }
        }

        // Process performance metrics
        if (performanceRes?.ok) {
          const perfData = await performanceRes.json();
          setPerformance({
            totalValue: perfData.totalValue || 0,
            totalPnl: perfData.totalPnl || 0,
            totalPnlPercent: perfData.totalPnlPercent || 0,
            dayChange: perfData.dayChange || 0,
            dayChangePercent: perfData.dayChangePercent || 0,
            weekChange: perfData.weekChange || 0,
            weekChangePercent: perfData.weekChangePercent || 0,
            monthChange: perfData.monthChange || 0,
            monthChangePercent: perfData.monthChangePercent || 0,
          });
        }

        // Process risk metrics
        if (riskRes?.ok) {
          const riskData = await riskRes.json();
          setRisk({
            diversificationScore: riskData.diversificationScore || 0,
            concentrationRisk: riskData.concentrationRisk || "low",
            largestPosition: riskData.largestPosition || { symbol: "", percentage: 0 },
            stablecoinRatio: riskData.stablecoinRatio || 0,
            riskLevel: riskData.riskLevel || "conservative",
            suggestions: riskData.suggestions || [],
          });
        }

        // Process historical data
        if (historyRes?.ok) {
          const histData = await historyRes.json();
          if (Array.isArray(histData)) {
            setHistoricalData(histData.map((d: any) => ({
              date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              value: d.value,
              timestamp: new Date(d.date).getTime(),
            })));
          }
        }
      } catch (error) {
        console.error('Failed to fetch portfolio data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, [timeframe]);

  const allocationData = tokens.map((token) => ({
    name: token.symbol,
    value: token.value,
    percentage: token.allocation,
  }));

  const profitLossData = tokens
    .filter((t) => t.pnl && t.pnl !== 0)
    .map((token) => ({
      token: token.symbol,
      profitLoss: token.pnl || 0,
    }))
    .sort((a, b) => b.profitLoss - a.profitLoss);

  const COLORS = [
    accentColor,
    secondaryColor,
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "conservative":
        return "text-green-400";
      case "moderate":
        return "text-yellow-400";
      case "aggressive":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const exportData = () => {
    const csv = [
      [
        "Symbol",
        "Balance",
        "Value",
        "Price",
        "24h Change",
        "Allocation",
        "P&L",
        "P&L %",
      ].join(","),
      ...tokens.map((t) =>
        [
          t.symbol,
          t.balance,
          t.value,
          t.price,
          t.change24h,
          t.allocation,
          t.pnl || 0,
          t.pnlPercent || 0,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio_analytics_${Date.now()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <FullscreenLoading
        text="Loading Analytics..."
        progress={75}
        type={type}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] p-4 md:p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <FadeScale>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose || onBack}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>

              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}40 0%, ${secondaryColor}20 100%)`,
                    border: `1px solid ${accentColor}40`,
                  }}
                >
                  <PieChartIcon
                    className="w-6 h-6"
                    style={{ color: accentColor }}
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">
                    Portfolio Analytics
                  </h1>
                  <p className="text-xs text-[var(--text-primary)]/50 uppercase tracking-wider">
                    Track performance & insights
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={exportData}
              >
                Export
              </Button>
              <motion.button
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLoading(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </FadeScale>

        {/* Total Value Card */}
        <CardReveal direction="up">
          <GlassCard
            className="mb-6"
            glow
            style={{
              background: `linear-gradient(135deg, ${accentColor}15 0%, ${secondaryColor}05 100%)`,
              borderColor: `${accentColor}40`,
            }}
          >
            <div className="text-xs text-[var(--text-primary)]/50 mb-2 uppercase tracking-wider font-bold">
              Total Portfolio Value
            </div>
            <div className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-3">
              {formatCurrency(performance.totalValue)}
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                {performance.dayChangePercent >= 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-green-400" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-red-400" />
                )}
                <span
                  className={`text-sm font-black uppercase tracking-wider ${performance.dayChangePercent >= 0
                      ? "text-green-400"
                      : "text-red-400"
                    }`}
                >
                  {formatPercent(performance.dayChangePercent)}{" "}
                  (24h)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    performance.totalPnlPercent >= 0
                      ? "success"
                      : "error"
                  }
                  size="md"
                  dot
                >
                  All-time:{" "}
                  {formatPercent(performance.totalPnlPercent)}
                </Badge>
              </div>
            </div>
          </GlassCard>
        </CardReveal>

        {/* Timeframe Selector */}
        <CardReveal direction="up" delay={0.1}>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {(["24h", "7d", "30d", "90d", "1y"] as const).map(
              (tf) => (
                <motion.button
                  key={tf}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTimeframe(tf)}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider border-[var(--border-neutral)] whitespace-nowrap transition-all ${timeframe === tf
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-primary)]/40 hover:text-[var(--text-primary)]/60"
                    }`}
                  style={
                    timeframe === tf
                      ? {
                        background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
                        boxShadow: `0 0 20px ${accentColor}40`,
                      }
                      : { background: "rgba(255,255,255,0.05)" }
                  }
                >
                  {tf}
                </motion.button>
              ),
            )}
          </div>
        </CardReveal>

        {/* Stats Grid */}
        <CardReveal direction="up" delay={0.2}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              {
                icon: TrendingUp,
                label: "Day Change",
                value: formatCurrency(performance.dayChange),
                change: performance.dayChangePercent,
                color:
                  performance.dayChange >= 0
                    ? "text-green-400"
                    : "text-red-400",
              },
              {
                icon: Calendar,
                label: "Week Change",
                value: formatCurrency(performance.weekChange),
                change: performance.weekChangePercent,
                color:
                  performance.weekChange >= 0
                    ? "text-green-400"
                    : "text-red-400",
              },
              {
                icon: BarChart3,
                label: "Month Change",
                value: formatCurrency(performance.monthChange),
                change: performance.monthChangePercent,
                color:
                  performance.monthChange >= 0
                    ? "text-green-400"
                    : "text-red-400",
              },
              {
                icon: DollarSign,
                label: "Realized P&L",
                value: formatCurrency(performance.totalPnl),
                change: performance.totalPnlPercent,
                color:
                  performance.totalPnl >= 0
                    ? "text-green-400"
                    : "text-red-400",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <GlassCard hover={false}>
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-4 h-4 text-[var(--text-primary)]/50" />
                    <span className="text-xs text-[var(--text-primary)]/50 uppercase tracking-wider font-bold">
                      {stat.label}
                    </span>
                  </div>
                  <div
                    className={`text-xl font-black ${stat.color}`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs text-[var(--text-primary)]/50 mt-1">
                    {stat.change >= 0 ? "+" : ""}
                    {stat.change.toFixed(2)}%
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </CardReveal>

        {/* Tabs */}
        <CardReveal direction="up" delay={0.4}>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              {
                id: "overview",
                label: "Holdings",
                icon: Wallet,
              },
              {
                id: "allocation",
                label: "Allocation",
                icon: PieChartIcon,
              },
              {
                id: "risk",
                label: "Risk Analysis",
                icon: Shield,
              },
              {
                id: "tax",
                label: "Tax Report",
                icon: FileText,
              },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-black uppercase tracking-wider text-xs whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === tab.id
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-primary)]/40 hover:text-[var(--text-primary)]/60"
                  }`}
                style={
                  activeTab === tab.id
                    ? {
                      background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
                      boxShadow: `0 0 20px ${accentColor}40`,
                    }
                    : { background: "rgba(255,255,255,0.05)" }
                }
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </CardReveal>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Chart */}
              <GlassCard>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">
                    Portfolio Value Over Time
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setChartType("area")}
                      className={`p-2 rounded-lg transition-all ${chartType === "area"
                          ? `bg-[${accentColor}]/20`
                          : "bg-white/5"
                        }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setChartType("line")}
                      className={`p-2 rounded-lg transition-all ${chartType === "line"
                          ? `bg-[${accentColor}]/20`
                          : "bg-white/5"
                        }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  {chartType === "area" ? (
                    <AreaChart data={historicalData}>
                      <defs>
                        <linearGradient
                          id="colorValue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={accentColor}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={accentColor}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.1)"
                      />
                      <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: 12 }}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0,0,0,0.9)",
                          border:
                            "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={accentColor}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  ) : (
                    <LineChart data={historicalData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.1)"
                      />
                      <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: 12 }}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0,0,0,0.9)",
                          border:
                            "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={accentColor}
                        strokeWidth={2}
                        dot={{ fill: accentColor, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </GlassCard>

              {/* Token Holdings */}
              <StaggeredList
                type="slide"
                direction="up"
                staggerDelay={0.05}
              >
                {tokens.map((token) => (
                  <GlassCard key={token.symbol} hover>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-[var(--text-primary)]"
                          style={{
                            background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
                          }}
                        >
                          {token.symbol[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-black text-[var(--text-primary)] uppercase">
                              {token.symbol}
                            </span>
                            <span className="text-xs text-[var(--text-primary)]/50">
                              {token.name}
                            </span>
                          </div>
                          <div className="text-xs text-[var(--text-primary)]/50">
                            {token.balance} • $
                            {token.price.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-[var(--text-primary)] mb-1">
                          {formatCurrency(token.value)}
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <Badge
                            variant={
                              token.change24h >= 0
                                ? "success"
                                : "error"
                            }
                            size="sm"
                          >
                            {formatPercent(token.change24h)}
                          </Badge>
                          {token.pnlPercent && (
                            <Badge
                              variant={
                                token.pnlPercent >= 0
                                  ? "success"
                                  : "error"
                              }
                              size="sm"
                            >
                              P&L:{" "}
                              {formatPercent(token.pnlPercent)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Allocation Bar */}
                    <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${token.allocation}%`,
                        }}
                        transition={{
                          duration: 1,
                          ease: "easeOut",
                        }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-[var(--text-primary)]/50 mt-1">
                      {token.allocation.toFixed(1)}% of
                      portfolio
                    </div>
                  </GlassCard>
                ))}
              </StaggeredList>
            </motion.div>
          )}

          {activeTab === "allocation" && (
            <motion.div
              key="allocation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {/* Pie Chart */}
              <GlassCard>
                <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight mb-6">
                  Token Allocation
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.9)",
                        border:
                          "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="mt-6 space-y-2">
                  {allocationData.map((token, index) => (
                    <div
                      key={token.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="text-sm text-[var(--text-primary)] font-bold">
                          {token.name}
                        </span>
                      </div>
                      <span className="text-sm text-[var(--text-primary)]/50 font-bold">
                        {token.percentage.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* P&L by Token */}
              <GlassCard>
                <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight mb-6">
                  Profit & Loss by Token
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={profitLossData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      dataKey="token"
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.9)",
                        border:
                          "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="profitLoss"
                      fill={accentColor}
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === "risk" && (
            <motion.div
              key="risk"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Risk Score */}
              <GlassCard>
                <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight mb-6">
                  Risk Assessment
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div
                      className="text-4xl font-black mb-2"
                      style={{ color: accentColor }}
                    >
                      {risk.diversificationScore}
                    </div>
                    <div className="text-xs text-[var(--text-primary)]/50 uppercase tracking-wider font-bold">
                      Diversification
                    </div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-2xl font-black capitalize mb-2 ${getRiskColor(risk.riskLevel)}`}
                    >
                      {risk.riskLevel}
                    </div>
                    <div className="text-xs text-[var(--text-primary)]/50 uppercase tracking-wider font-bold">
                      Risk Level
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black mb-2 text-[var(--text-primary)]">
                      {(risk.stablecoinRatio * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-[var(--text-primary)]/50 uppercase tracking-wider font-bold">
                      Stablecoin Ratio
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black mb-2 text-[var(--text-primary)]">
                      {risk.largestPosition.symbol}
                    </div>
                    <div className="text-xs text-[var(--text-primary)]/50 uppercase tracking-wider font-bold">
                      {risk.largestPosition.percentage.toFixed(
                        0,
                      )}
                      % max
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Suggestions */}
              <GlassCard
                style={{
                  background: "rgba(251, 146, 60, 0.1)",
                  borderColor: "rgba(251, 146, 60, 0.3)",
                }}
              >
                <h3 className="text-sm font-black text-orange-400 uppercase tracking-tight mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Recommendations
                </h3>
                <StaggeredList type="fade" staggerDelay={0.1}>
                  {risk.suggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 mb-3"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background: "rgba(251, 146, 60, 0.2)",
                          border:
                            "1px solid rgba(251, 146, 60, 0.3)",
                        }}
                      >
                        <Info className="w-4 h-4 text-orange-400" />
                      </div>
                      <p className="text-sm text-[var(--text-primary)]/80">
                        {suggestion}
                      </p>
                    </div>
                  ))}
                </StaggeredList>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === "tax" && (
            <motion.div
              key="tax"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GlassCard className="text-center py-12">
                <div
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}20 0%, ${secondaryColor}10 100%)`,
                  }}
                >
                  <FileText
                    className="w-10 h-10"
                    style={{ color: accentColor }}
                  />
                </div>
                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-2">
                  Tax Report
                </h3>
                <p className="text-sm text-[var(--text-primary)]/50 mb-8 max-w-md mx-auto">
                  Generate a comprehensive tax report for your
                  crypto transactions
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button
                    variant="primary"
                    size="lg"
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    2024 Report
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    leftIcon={<Calendar className="w-4 h-4" />}
                  >
                    2023 Report
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default PortfolioAnalytics;
