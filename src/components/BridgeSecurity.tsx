import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getThemeStyles } from "../design-system";
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ExternalLink,
  Info,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Zap,
  Activity,
  Eye,
  Lock,
  Unlock,
  Radio,
  Award,
  BarChart3,
  ArrowRight,
  Loader2,
  X,
  Star,
  FileText,
  Download,
} from "lucide-react";
import { useBridgesList, type Bridge, type SecurityAlert } from "../hooks/useBridgesList";

interface BridgeSecurityProps {
  type: "degen" | "regen";
  onClose: () => void;
}

export function BridgeSecurity({ type, onClose }: BridgeSecurityProps) {
  const [activeTab, setActiveTab] = useState<"bridges" | "alerts" | "analytics">("bridges");
  const [selectedBridge, setSelectedBridge] = useState<Bridge | null>(null);
  const [bridging, setBridging] = useState(false);
  const [fromChain, setFromChain] = useState("Ethereum");
  const [toChain, setToChain] = useState("Polygon");

  const isDegen = type === "degen";

  // Real API data from useBridgesList hook
  const { bridges, alerts, loading, refresh } = useBridgesList();

  const colors = {
    primary: isDegen ? "#ff3366" : "#00d4ff",
    secondary: isDegen ? "#ff9500" : "#00ff88",
    gradient: isDegen
      ? "linear-gradient(135deg, rgba(255, 51, 102, 0.2) 0%, rgba(255, 149, 0, 0.1) 100%)"
      : "linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 255, 136, 0.1) 100%)",
    border: isDegen ? "rgba(255, 51, 102, 0.2)" : "rgba(0, 212, 255, 0.2)",
    glow: isDegen
      ? "0 0 20px rgba(255, 51, 102, 0.3), 0 0 40px rgba(255, 149, 0, 0.2)"
      : "0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 255, 136, 0.2)",
  };

  // Filter bridges by route
  const availableBridges = bridges.filter(
    (b) => b.supported.includes(fromChain) && b.supported.includes(toChain)
  );

  // Sort bridges by security score
  const sortedBridges = useMemo(() => {
    return [...availableBridges].sort((a, b) => b.securityScore - a.securityScore);
  }, [availableBridges]);

  // Stats
  const stats = {
    totalBridges: bridges.length,
    safeBridges: bridges.filter((b) => b.riskLevel === "low").length,
    criticalAlerts: alerts.filter((a) => !a.resolved && a.severity === "critical").length,
    avgSecurityScore: (bridges.reduce((sum, b) => sum + b.securityScore, 0) / bridges.length).toFixed(1),
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return colors.secondary;
    if (score >= 6) return "#f59e0b";
    if (score >= 4) return "#f97316";
    return "#ef4444";
  };

  const getRiskBadgeColor = (risk: Bridge["riskLevel"]) => {
    switch (risk) {
      case "low":
        return { bg: `${colors.secondary}20`, color: colors.secondary, text: "LOW RISK" };
      case "medium":
        return { bg: "rgba(249, 115, 22, 0.2)", color: "#f97316", text: "MEDIUM RISK" };
      case "high":
        return { bg: "rgba(239, 68, 68, 0.2)", color: "#ef4444", text: "HIGH RISK" };
      case "critical":
        return { bg: "rgba(239, 68, 68, 0.3)", color: "#ef4444", text: "CRITICAL" };
    }
  };

  const getSeverityColor = (severity: SecurityAlert["severity"]) => {
    switch (severity) {
      case "low":
        return "#22c55e";
      case "medium":
        return "#f59e0b";
      case "high":
        return "#f97316";
      case "critical":
        return "#ef4444";
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleBridge = async (bridge: Bridge) => {
    if (bridge.status === "compromised") return;
    setBridging(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setBridging(false);
    setSelectedBridge(null);
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
                  <Shield className="w-5 h-5" style={{ color: colors.primary }} />
                  <h2 className="text-[var(--text-primary)]">Bridge Security</h2>
                </div>
                <p className="text-xs text-[var(--text-primary)]/50 mt-0.5">Protected cross-chain transfers</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.div
                className="px-3 py-1.5 rounded-lg flex items-center gap-2"
                style={{
                  background: colors.gradient,
                  border: `1px solid ${colors.primary}`,
                }}
              >
                <Radio className="w-4 h-4" style={{ color: colors.primary }} />
                <span className="text-xs" style={{ color: colors.primary }}>
                  MONITORING
                </span>
              </motion.div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <motion.div
              whileHover={{ y: -2 }}
              className="p-3 rounded-xl border backdrop-blur-sm"
              style={{
                background: colors.gradient,
                borderColor: colors.border,
              }}
            >
              <div className="text-xs text-[var(--text-primary)]/60">Bridges</div>
              <div className="text-lg text-[var(--text-primary)]">{stats.totalBridges}</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="p-3 rounded-xl border backdrop-blur-sm"
              style={{
                background: colors.gradient,
                borderColor: colors.border,
              }}
            >
              <div className="text-xs text-[var(--text-primary)]/60">Safe</div>
              <div className="text-lg" style={{ color: colors.secondary }}>
                {stats.safeBridges}
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
              <div className="text-xs text-[var(--text-primary)]/60">Alerts</div>
              <div className="text-lg text-red-500">{stats.criticalAlerts}</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="p-3 rounded-xl border backdrop-blur-sm"
              style={{
                background: colors.gradient,
                borderColor: colors.border,
              }}
            >
              <div className="text-xs text-[var(--text-primary)]/60">Avg Score</div>
              <div className="text-lg text-[var(--text-primary)]">{stats.avgSecurityScore}</div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { id: "bridges", label: "Bridges", icon: Shield },
              { id: "alerts", label: "Alerts", icon: AlertTriangle, badge: stats.criticalAlerts },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all text-sm"
                style={{
                  background: activeTab === tab.id ? colors.gradient : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${activeTab === tab.id ? colors.primary : colors.border}`,
                  color: activeTab === tab.id ? colors.primary : "#9ca3af",
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className="min-w-[18px] h-4 px-1.5 rounded-full text-xs font-bold flex items-center justify-center"
                    style={{
                      background: activeTab === tab.id ? colors.primary : "rgba(239, 68, 68, 0.3)",
                      color: activeTab === tab.id ? "white" : "#ef4444",
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === "bridges" && (
            <motion.div
              key="bridges"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Route Selection */}
              <div>
                <h3 className="text-sm text-[var(--text-primary)]/60 mb-3">Select Route</h3>
                <div className="flex items-center gap-3">
                  <select
                    value={fromChain}
                    onChange={(e) => setFromChain(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl text-[var(--text-primary)] outline-none"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <option value="Ethereum">Ethereum</option>
                    <option value="Polygon">Polygon</option>
                    <option value="Arbitrum">Arbitrum</option>
                    <option value="Optimism">Optimism</option>
                    <option value="Base">Base</option>
                  </select>
                  <ArrowRight className="w-5 h-5 text-[var(--text-primary)]/50" />
                  <select
                    value={toChain}
                    onChange={(e) => setToChain(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl text-[var(--text-primary)] outline-none"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <option value="Ethereum">Ethereum</option>
                    <option value="Polygon">Polygon</option>
                    <option value="Arbitrum">Arbitrum</option>
                    <option value="Optimism">Optimism</option>
                    <option value="Base">Base</option>
                  </select>
                </div>
              </div>

              {/* Info Banner */}
              <div
                className="p-4 rounded-xl border"
                style={{
                  background: `${colors.primary}10`,
                  borderColor: `${colors.primary}30`,
                }}
              >
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: colors.primary }} />
                  <div>
                    <div className="text-sm mb-1" style={{ color: colors.primary }}>
                      Security-First Bridging
                    </div>
                    <p className="text-xs text-[var(--text-primary)]/60">
                      All bridges are ranked by security score. We recommend using bridges with scores above 7.0.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bridge List */}
              <div>
                <h3 className="text-sm text-[var(--text-primary)]/60 mb-3">
                  Available Bridges ({sortedBridges.length})
                </h3>
                <div className="space-y-3">
                  {sortedBridges.map((bridge, index) => {
                    const riskBadge = getRiskBadgeColor(bridge.riskLevel);
                    const isRecommended = bridge.securityScore >= 8.0 && bridge.status === "active";

                    return (
                      <motion.div
                        key={bridge.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedBridge(bridge)}
                        className="p-4 rounded-xl border backdrop-blur-sm cursor-pointer"
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          borderColor: bridge.status === "compromised" ? "rgba(239, 68, 68, 0.3)" : colors.border,
                          opacity: bridge.status === "compromised" ? 0.7 : 1,
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-[var(--text-primary)]">{bridge.name}</h4>
                              {isRecommended && (
                                <span
                                  className="text-xs px-2 py-0.5 rounded flex items-center gap-1"
                                  style={{
                                    background: `${colors.secondary}20`,
                                    color: colors.secondary,
                                  }}
                                >
                                  <Award className="w-3 h-3" />
                                  Recommended
                                </span>
                              )}
                              {bridge.anomalyDetected && (
                                <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-500">
                                  ⚠️ Anomaly
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[var(--text-primary)]/50 mb-2">
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {bridge.fees}% fee
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {bridge.avgTime}
                              </div>
                              <div className="flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                {bridge.totalVolume}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {bridge.isAudited && (
                                <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-[var(--text-primary)]/70 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Audited
                                </span>
                              )}
                              {bridge.status === "active" && (
                                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500">
                                  Active
                                </span>
                              )}
                              {bridge.status === "compromised" && (
                                <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-500">
                                  ⛔ BLOCKED
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Security Score */}
                          <div className="text-right shrink-0 ml-4">
                            <div
                              className="text-2xl mb-1"
                              style={{ color: getScoreColor(bridge.securityScore) }}
                            >
                              {bridge.securityScore}
                            </div>
                            <div className="text-xs text-[var(--text-primary)]/50">Security</div>
                            <span
                              className="text-xs px-2 py-0.5 rounded mt-1 inline-block"
                              style={{
                                background: riskBadge.bg,
                                color: riskBadge.color,
                              }}
                            >
                              {riskBadge.text}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end mt-3">
                          <ChevronRight className="w-4 h-4 text-[var(--text-primary)]/30" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "alerts" && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-[var(--text-primary)] mb-1">Security Alerts</h3>
                <p className="text-xs text-[var(--text-primary)]/50">Real-time security monitoring</p>
              </div>

              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl border"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      borderColor: alert.resolved
                        ? colors.border
                        : `${getSeverityColor(alert.severity)}30`,
                      opacity: alert.resolved ? 0.6 : 1,
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-[var(--text-primary)] text-sm">{alert.bridgeName}</h4>
                          <span
                            className="text-xs px-2 py-0.5 rounded uppercase"
                            style={{
                              background: `${getSeverityColor(alert.severity)}20`,
                              color: getSeverityColor(alert.severity),
                            }}
                          >
                            {alert.severity}
                          </span>
                          {alert.resolved && (
                            <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-[var(--text-primary)]/50">
                              Resolved
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--text-primary)]/60 mb-1">{alert.type}</div>
                        <p className="text-sm text-[var(--text-primary)]/80">{alert.message}</p>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--text-primary)]/40">{formatTimeAgo(alert.timestamp)}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-[var(--text-primary)] mb-1">Security Analytics</h3>
                <p className="text-xs text-[var(--text-primary)]/50">Bridge security trends and metrics</p>
              </div>

              {/* Security Distribution */}
              <div
                className="p-4 rounded-xl border"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderColor: colors.border,
                }}
              >
                <h4 className="text-[var(--text-primary)] text-sm mb-3">Security Score Distribution</h4>
                <div className="space-y-3">
                  {[
                    { label: "Excellent (8.0+)", count: bridges.filter((b) => b.securityScore >= 8).length, color: colors.secondary },
                    { label: "Good (6.0-7.9)", count: bridges.filter((b) => b.securityScore >= 6 && b.securityScore < 8).length, color: "#f59e0b" },
                    { label: "Fair (4.0-5.9)", count: bridges.filter((b) => b.securityScore >= 4 && b.securityScore < 6).length, color: "#f97316" },
                    { label: "Poor (<4.0)", count: bridges.filter((b) => b.securityScore < 4).length, color: "#ef4444" },
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[var(--text-primary)]/70">{item.label}</span>
                        <span className="text-xs text-[var(--text-primary)]">{item.count} bridges</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.count / bridges.length) * 100}%` }}
                          className="h-full rounded-full"
                          style={{ background: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Volume Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-4 rounded-xl border"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4" style={{ color: colors.secondary }} />
                    <div className="text-xs text-[var(--text-primary)]/60">Total Volume</div>
                  </div>
                  <div className="text-xl text-[var(--text-primary)]">$6.8B</div>
                  <div className="text-xs text-[var(--text-primary)]/50 mt-1">All bridges</div>
                </div>

                <div
                  className="p-4 rounded-xl border"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4" style={{ color: colors.primary }} />
                    <div className="text-xs text-[var(--text-primary)]/60">Validators</div>
                  </div>
                  <div className="text-xl text-[var(--text-primary)]">
                    {bridges.reduce((sum, b) => sum + b.validators, 0)}
                  </div>
                  <div className="text-xs text-[var(--text-primary)]/50 mt-1">Total across all</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bridge Detail Modal */}
      <AnimatePresence>
        {selectedBridge && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBridge(null)}
              className="fixed inset-0 bg-[var(--bg-base)]/90 backdrop-blur-xl z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto rounded-2xl border z-50 overflow-hidden max-h-[80vh] overflow-y-auto"
              style={{
                background: "rgba(0, 0, 0, 0.95)",
                borderColor: selectedBridge.status === "compromised" ? "rgba(239, 68, 68, 0.5)" : colors.border,
                boxShadow: selectedBridge.status === "compromised"
                  ? "0 0 30px rgba(239, 68, 68, 0.3)"
                  : colors.glow,
              }}
            >
              <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl text-[var(--text-primary)] mb-1">{selectedBridge.name}</h3>
                      <code className="text-xs text-[var(--text-primary)]/50 font-mono">
                        {selectedBridge.address.slice(0, 10)}...{selectedBridge.address.slice(-8)}
                      </code>
                    </div>
                    <div
                      className="text-3xl"
                      style={{ color: getScoreColor(selectedBridge.securityScore) }}
                    >
                      {selectedBridge.securityScore}
                    </div>
                  </div>

                  {selectedBridge.status === "compromised" && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-red-500 mb-1">⛔ BRIDGE BLOCKED</div>
                        <p className="text-sm text-red-400/80">
                          This bridge has security concerns and is currently blocked. Your funds may be at risk.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: colors.gradient,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-[var(--text-primary)]/60">Fee</div>
                        <div className="text-[var(--text-primary)] mt-1">{selectedBridge.fees}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-primary)]/60">Avg Time</div>
                        <div className="text-[var(--text-primary)] mt-1">{selectedBridge.avgTime}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-primary)]/60">Total Volume</div>
                        <div className="text-[var(--text-primary)] mt-1">{selectedBridge.totalVolume}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-primary)]/60">Validators</div>
                        <div className="text-[var(--text-primary)] mt-1">{selectedBridge.validators}</div>
                      </div>
                    </div>
                  </div>

                  {selectedBridge.recentIssues.length > 0 && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <div className="text-sm text-red-500 mb-2">Recent Issues</div>
                      <ul className="space-y-1">
                        {selectedBridge.recentIssues.map((issue, idx) => (
                          <li key={idx} className="text-xs text-red-400/80 flex items-start gap-2">
                            <span>•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedBridge.lastAudit && (
                    <div>
                      <div className="text-xs text-[var(--text-primary)]/50 mb-1">Last Audit</div>
                      <div className="text-[var(--text-primary)]">{selectedBridge.lastAudit}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-[var(--text-primary)]/50 mb-2">Supported Networks</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedBridge.supported.map((chain) => (
                        <span
                          key={chain}
                          className="px-2 py-1 bg-white/5 rounded text-xs text-[var(--text-primary)]/70"
                        >
                          {chain}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedBridge(null)}
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
                    onClick={() => handleBridge(selectedBridge)}
                    disabled={selectedBridge.status === "compromised" || bridging}
                    className="flex-1 py-3 rounded-xl text-[var(--text-primary)] flex items-center justify-center gap-2"
                    style={{
                      background: selectedBridge.status === "compromised"
                        ? "rgba(100, 100, 100, 0.3)"
                        : colors.gradient,
                      border: `1px solid ${selectedBridge.status === "compromised" ? "#555" : colors.primary}`,
                      boxShadow: selectedBridge.status === "compromised"
                        ? "none"
                        : `0 0 20px ${colors.primary}40`,
                      opacity: selectedBridge.status === "compromised" ? 0.5 : 1,
                      cursor: selectedBridge.status === "compromised" ? "not-allowed" : "pointer",
                    }}
                  >
                    {bridging ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Bridging...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        {selectedBridge.status === "compromised" ? "Blocked" : "Use Bridge"}
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}