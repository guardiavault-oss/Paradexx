import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Activity,
  Globe,
  Lock,
  Unlock,
  Settings,
  Eye,
  EyeOff,
  Flame,
  DollarSign,
  Percent,
  Radio,
  Bell,
  ChevronRight,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react";
import BottomNav from "./dashboard/BottomNav";

interface MEVProtectionProps {
  type: "degen" | "regen";
  onClose: () => void;
  userAddress?: string;
  activeTab?: "home" | "trading" | "activity" | "more";
  onTabChange?: (tab: "home" | "trading" | "activity" | "more") => void;
}

interface ThreatAlert {
  id: string;
  type: "sandwich" | "frontrun" | "backrun" | "flashloan" | "liquidation";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: number;
  blocked: boolean;
  estimatedLoss: number;
  network: string;
  confidence: number;
  transactionHash?: string;
}

interface ProtectionStat {
  label: string;
  value: string;
  change?: number;
  icon: any;
}

interface NetworkStatus {
  name: string;
  chainId: number;
  active: boolean;
  latency: number;
  txCount: number;
  threatsDetected: number;
}

export function MEVProtection({ 
  type, 
  onClose, 
  userAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f3f4a",
  activeTab: navActiveTab,
  onTabChange: navOnTabChange
}: MEVProtectionProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "threats" | "networks" | "settings">("overview");
  const [protectionEnabled, setProtectionEnabled] = useState(true);
  const [protectionLevel, setProtectionLevel] = useState<"basic" | "standard" | "high" | "maximum">("high");
  const [autoProtect, setAutoProtect] = useState(true);
  const [privateMempool, setPrivateMempool] = useState(true);

  const isDegen = type === "degen";

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

  // Mock stats
  const stats = {
    threatsBlocked: 127,
    valueProtected: 45680,
    mevSaved: 12.5,
    successRate: 97.5,
    avgResponseTime: 78,
    activeProtections: 1,
  };

  // Mock threats
  const threats: ThreatAlert[] = [
    {
      id: "1",
      type: "sandwich",
      severity: "critical",
      timestamp: Date.now() - 1000 * 60 * 15,
      blocked: true,
      estimatedLoss: 850,
      network: "Ethereum",
      confidence: 0.95,
      transactionHash: "0x1234...5678",
    },
    {
      id: "2",
      type: "frontrun",
      severity: "high",
      timestamp: Date.now() - 1000 * 60 * 45,
      blocked: true,
      estimatedLoss: 420,
      network: "Arbitrum",
      confidence: 0.88,
      transactionHash: "0x2345...6789",
    },
    {
      id: "3",
      type: "backrun",
      severity: "medium",
      timestamp: Date.now() - 1000 * 60 * 120,
      blocked: true,
      estimatedLoss: 125,
      network: "Polygon",
      confidence: 0.76,
      transactionHash: "0x3456...7890",
    },
    {
      id: "4",
      type: "flashloan",
      severity: "critical",
      timestamp: Date.now() - 1000 * 60 * 180,
      blocked: true,
      estimatedLoss: 2450,
      network: "Ethereum",
      confidence: 0.92,
      transactionHash: "0x4567...8901",
    },
  ];

  // Mock network status
  const networks: NetworkStatus[] = [
    { name: "Ethereum", chainId: 1, active: true, latency: 78, txCount: 1245, threatsDetected: 42 },
    { name: "Polygon", chainId: 137, active: true, latency: 45, txCount: 3421, threatsDetected: 18 },
    { name: "Arbitrum", chainId: 42161, active: true, latency: 52, txCount: 892, threatsDetected: 12 },
    { name: "Optimism", chainId: 10, active: true, latency: 61, txCount: 654, threatsDetected: 8 },
    { name: "Base", chainId: 8453, active: true, latency: 38, txCount: 1876, threatsDetected: 15 },
    { name: "Avalanche", chainId: 43114, active: false, latency: 0, txCount: 0, threatsDetected: 0 },
  ];

  const getThreatIcon = (threatType: ThreatAlert["type"]) => {
    switch (threatType) {
      case "sandwich":
        return Flame;
      case "frontrun":
        return Zap;
      case "backrun":
        return Activity;
      case "flashloan":
        return AlertTriangle;
      case "liquidation":
        return TrendingUp;
    }
  };

  const getThreatColor = (severity: ThreatAlert["severity"]) => {
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

  const getThreatLabel = (threatType: ThreatAlert["type"]) => {
    switch (threatType) {
      case "sandwich":
        return "Sandwich Attack";
      case "frontrun":
        return "Frontrunning";
      case "backrun":
        return "Backrunning";
      case "flashloan":
        return "Flash Loan Attack";
      case "liquidation":
        return "Liquidation Attack";
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
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
                  <Shield className="w-5 h-5" style={{ color: colors.primary }} />
                  <h2 className="text-white">MEV Protection</h2>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  {protectionEnabled ? "Active protection" : "Protection disabled"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.div
                className="px-3 py-1.5 rounded-lg flex items-center gap-2"
                style={{
                  background: protectionEnabled ? colors.gradient : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${protectionEnabled ? colors.primary : colors.border}`,
                }}
              >
                <Radio
                  className="w-4 h-4"
                  style={{ color: protectionEnabled ? colors.primary : "#6b7280" }}
                />
                <span
                  className="text-xs"
                  style={{ color: protectionEnabled ? colors.primary : "#6b7280" }}
                >
                  {protectionEnabled ? "ACTIVE" : "INACTIVE"}
                </span>
              </motion.div>
            </div>
          </div>

          {/* Protection Status Card */}
          <motion.div
            className="p-4 rounded-xl border mb-4"
            style={{
              background: colors.gradient,
              borderColor: colors.border,
              boxShadow: protectionEnabled ? colors.glow : "none",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-white/60 mb-1">Protection Status</div>
                <div className="flex items-center gap-2">
                  {protectionEnabled ? (
                    <>
                      <Lock className="w-4 h-4" style={{ color: colors.secondary }} />
                      <span className="text-sm text-white">Fully Protected</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-white">Unprotected</span>
                    </>
                  )}
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setProtectionEnabled(!protectionEnabled)}
                className="px-4 py-2 rounded-xl text-sm transition-all"
                style={{
                  background: protectionEnabled ? "rgba(239, 68, 68, 0.2)" : colors.gradient,
                  border: `1px solid ${protectionEnabled ? "#ef4444" : colors.primary}`,
                  color: protectionEnabled ? "#ef4444" : colors.primary,
                }}
              >
                {protectionEnabled ? "Disable" : "Enable"}
              </motion.button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-white/50">Level</div>
                <div className="text-sm text-white capitalize mt-1">{protectionLevel}</div>
              </div>
              <div>
                <div className="text-xs text-white/50">Networks</div>
                <div className="text-sm text-white mt-1">
                  {networks.filter((n) => n.active).length}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/50">Response Time</div>
                <div className="text-sm text-white mt-1">{stats.avgResponseTime}ms</div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <motion.div
              whileHover={{ y: -2 }}
              className="p-3 rounded-xl border backdrop-blur-sm"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-3 h-3" style={{ color: colors.primary }} />
                <div className="text-xs text-white/60">Blocked</div>
              </div>
              <div className="text-lg text-white">{stats.threatsBlocked}</div>
              <div className="text-xs" style={{ color: colors.secondary }}>
                threats
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="p-3 rounded-xl border backdrop-blur-sm"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-3 h-3" style={{ color: colors.primary }} />
                <div className="text-xs text-white/60">Protected</div>
              </div>
              <div className="text-lg text-white">${(stats.valueProtected / 1000).toFixed(1)}K</div>
              <div className="text-xs" style={{ color: colors.secondary }}>
                saved
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="p-3 rounded-xl border backdrop-blur-sm"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3 h-3" style={{ color: colors.primary }} />
                <div className="text-xs text-white/60">MEV Saved</div>
              </div>
              <div className="text-lg text-white">{stats.mevSaved} ETH</div>
              <div className="text-xs" style={{ color: colors.secondary }}>
                recovered
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { id: "overview", label: "Overview", icon: Activity },
              { id: "threats", label: "Threats", icon: AlertTriangle },
              { id: "networks", label: "Networks", icon: Globe },
              { id: "settings", label: "Settings", icon: Settings },
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
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Protected Address */}
              <div>
                <h3 className="text-sm text-white/60 mb-3">Protected Address</h3>
                <motion.div
                  className="p-4 rounded-xl border"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/50 mb-1">Wallet Address</div>
                      <code className="text-sm text-white font-mono">
                        {formatAddress(userAddress)}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="p-2 rounded-lg"
                        style={{ background: "rgba(255, 255, 255, 0.05)" }}
                      >
                        <Copy className="w-4 h-4 text-white/50" />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="p-2 rounded-lg"
                        style={{ background: "rgba(255, 255, 255, 0.05)" }}
                      >
                        <ExternalLink className="w-4 h-4 text-white/50" />
                      </motion.button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t" style={{ borderColor: colors.border }}>
                    <div>
                      <div className="text-xs text-white/50">Auto-Protect</div>
                      <div className="flex items-center gap-2 mt-1">
                        {autoProtect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" style={{ color: colors.secondary }} />
                            <span className="text-sm text-white">Enabled</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-white">Disabled</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/50">Private Mempool</div>
                      <div className="flex items-center gap-2 mt-1">
                        {privateMempool ? (
                          <>
                            <Lock className="w-4 h-4" style={{ color: colors.secondary }} />
                            <span className="text-sm text-white">Active</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-white">Inactive</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Recent Threats */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm text-white/60">Recent Threats Blocked</h3>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab("threats")}
                    className="text-xs flex items-center gap-1"
                    style={{ color: colors.primary }}
                  >
                    View All
                    <ChevronRight className="w-3 h-3" />
                  </motion.button>
                </div>
                <div className="space-y-2">
                  {threats.slice(0, 3).map((threat, index) => {
                    const ThreatIcon = getThreatIcon(threat.type);
                    return (
                      <motion.div
                        key={threat.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 rounded-xl border"
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          borderColor: colors.border,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: `${getThreatColor(threat.severity)}20`,
                              color: getThreatColor(threat.severity),
                            }}
                          >
                            <ThreatIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-white">{getThreatLabel(threat.type)}</span>
                              <span
                                className="text-xs px-2 py-0.5 rounded capitalize"
                                style={{
                                  background: `${getThreatColor(threat.severity)}20`,
                                  color: getThreatColor(threat.severity),
                                }}
                              >
                                {threat.severity}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/50">
                              <span>{threat.network}</span>
                              <span>•</span>
                              <span>{formatTimeAgo(threat.timestamp)}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm" style={{ color: colors.secondary }}>
                              ${threat.estimatedLoss}
                            </div>
                            <div className="text-xs text-white/50">saved</div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h3 className="text-sm text-white/60 mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="p-4 rounded-xl border"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4" style={{ color: colors.secondary }} />
                      <div className="text-xs text-white/60">Success Rate</div>
                    </div>
                    <div className="text-2xl text-white mb-1">{stats.successRate}%</div>
                    <div className="text-xs text-white/50">All transactions</div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    className="p-4 rounded-xl border"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4" style={{ color: colors.secondary }} />
                      <div className="text-xs text-white/60">Avg Response</div>
                    </div>
                    <div className="text-2xl text-white mb-1">{stats.avgResponseTime}ms</div>
                    <div className="text-xs text-white/50">Detection time</div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "threats" && (
            <motion.div
              key="threats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-white mb-1">Threat Detection Log</h3>
                <p className="text-xs text-white/50">All detected and blocked threats</p>
              </div>

              <div className="space-y-3">
                {threats.map((threat, index) => {
                  const ThreatIcon = getThreatIcon(threat.type);
                  return (
                    <motion.div
                      key={threat.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-xl border"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        borderColor: colors.border,
                      }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: `${getThreatColor(threat.severity)}20`,
                            color: getThreatColor(threat.severity),
                          }}
                        >
                          <ThreatIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-white">{getThreatLabel(threat.type)}</h4>
                            <span
                              className="text-xs px-2 py-0.5 rounded capitalize"
                              style={{
                                background: `${getThreatColor(threat.severity)}20`,
                                color: getThreatColor(threat.severity),
                              }}
                            >
                              {threat.severity}
                            </span>
                            {threat.blocked && (
                              <span
                                className="text-xs px-2 py-0.5 rounded flex items-center gap-1"
                                style={{
                                  background: `${colors.secondary}20`,
                                  color: colors.secondary,
                                }}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Blocked
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <div className="text-xs text-white/50">Network</div>
                              <div className="text-sm text-white">{threat.network}</div>
                            </div>
                            <div>
                              <div className="text-xs text-white/50">Confidence</div>
                              <div className="text-sm text-white">
                                {(threat.confidence * 100).toFixed(0)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-white/50">Estimated Loss</div>
                              <div className="text-sm" style={{ color: colors.secondary }}>
                                ${threat.estimatedLoss}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-white/50">Time</div>
                              <div className="text-sm text-white">
                                {formatTimeAgo(threat.timestamp)}
                              </div>
                            </div>
                          </div>
                          {threat.transactionHash && (
                            <div className="flex items-center gap-2">
                              <code className="text-xs text-white/50 font-mono">
                                {formatAddress(threat.transactionHash)}
                              </code>
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="p-1 rounded"
                                style={{ background: "rgba(255, 255, 255, 0.05)" }}
                              >
                                <ExternalLink className="w-3 h-3 text-white/50" />
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === "networks" && (
            <motion.div
              key="networks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-white mb-1">Network Monitoring</h3>
                <p className="text-xs text-white/50">
                  {networks.filter((n) => n.active).length} networks actively monitored
                </p>
              </div>

              <div className="space-y-3">
                {networks.map((network, index) => (
                  <motion.div
                    key={network.chainId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl border"
                    style={{
                      background: network.active
                        ? "rgba(255, 255, 255, 0.03)"
                        : "rgba(255, 255, 255, 0.01)",
                      borderColor: network.active ? colors.border : "rgba(255, 255, 255, 0.05)",
                      opacity: network.active ? 1 : 0.5,
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white">{network.name}</h4>
                          {network.active ? (
                            <span
                              className="text-xs px-2 py-0.5 rounded flex items-center gap-1"
                              style={{
                                background: `${colors.secondary}20`,
                                color: colors.secondary,
                              }}
                            >
                              <Radio className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/40">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-white/50">Chain ID: {network.chainId}</div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1.5 rounded-lg text-xs"
                        style={{
                          background: network.active
                            ? "rgba(239, 68, 68, 0.2)"
                            : colors.gradient,
                          border: `1px solid ${network.active ? "#ef4444" : colors.primary}`,
                          color: network.active ? "#ef4444" : colors.primary,
                        }}
                      >
                        {network.active ? "Disable" : "Enable"}
                      </motion.button>
                    </div>

                    {network.active && (
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <div className="text-xs text-white/50">Latency</div>
                          <div className="text-sm text-white">{network.latency}ms</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/50">Transactions</div>
                          <div className="text-sm text-white">
                            {network.txCount.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-white/50">Threats</div>
                          <div className="text-sm" style={{ color: colors.secondary }}>
                            {network.threatsDetected}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-white mb-1">Protection Settings</h3>
                <p className="text-xs text-white/50">Configure MEV protection parameters</p>
              </div>

              {/* Protection Level */}
              <div
                className="p-4 rounded-xl border"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderColor: colors.border,
                }}
              >
                <div className="mb-4">
                  <div className="text-white text-sm mb-1">Protection Level</div>
                  <div className="text-xs text-white/50">
                    Higher levels provide better protection with longer processing times
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { id: "basic", label: "Basic", desc: "2% slippage, public mempool" },
                    { id: "standard", label: "Standard", desc: "1% slippage, basic protection" },
                    { id: "high", label: "High", desc: "0.5% slippage, private mempool", recommended: true },
                    { id: "maximum", label: "Maximum", desc: "0.1% slippage, full protection" },
                  ].map((level) => (
                    <motion.button
                      key={level.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setProtectionLevel(level.id as any)}
                      className="w-full p-3 rounded-xl text-left transition-all"
                      style={{
                        background:
                          protectionLevel === level.id ? colors.gradient : "rgba(255, 255, 255, 0.05)",
                        border: `1px solid ${protectionLevel === level.id ? colors.primary : colors.border}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm"
                              style={{
                                color: protectionLevel === level.id ? colors.primary : "white",
                              }}
                            >
                              {level.label}
                            </span>
                            {level.recommended && (
                              <span
                                className="text-xs px-2 py-0.5 rounded"
                                style={{
                                  background: `${colors.secondary}20`,
                                  color: colors.secondary,
                                }}
                              >
                                Recommended
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-white/50 mt-1">{level.desc}</div>
                        </div>
                        {protectionLevel === level.id && (
                          <CheckCircle2 className="w-5 h-5" style={{ color: colors.primary }} />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Auto-Protect Toggle */}
              <div
                className="p-4 rounded-xl border"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white text-sm mb-1">Auto-Protect</div>
                    <div className="text-xs text-white/50">
                      Automatically protect all transactions
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setAutoProtect(!autoProtect)}
                    className="relative w-12 h-6 rounded-full transition-all"
                    style={{
                      background: autoProtect ? colors.gradient : "rgba(255, 255, 255, 0.1)",
                      border: `1px solid ${autoProtect ? colors.primary : colors.border}`,
                    }}
                  >
                    <motion.div
                      animate={{ x: autoProtect ? 24 : 2 }}
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
                    />
                  </motion.button>
                </div>
              </div>

              {/* Private Mempool Toggle */}
              <div
                className="p-4 rounded-xl border"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white text-sm mb-1">Private Mempool</div>
                    <div className="text-xs text-white/50">
                      Route through Flashbots/MEV-Share
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPrivateMempool(!privateMempool)}
                    className="relative w-12 h-6 rounded-full transition-all"
                    style={{
                      background: privateMempool ? colors.gradient : "rgba(255, 255, 255, 0.1)",
                      border: `1px solid ${privateMempool ? colors.primary : colors.border}`,
                    }}
                  >
                    <motion.div
                      animate={{ x: privateMempool ? 24 : 2 }}
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
                    />
                  </motion.button>
                </div>
              </div>

              {/* Notifications */}
              <div
                className="p-4 rounded-xl border"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderColor: colors.border,
                }}
              >
                <div className="mb-3">
                  <div className="text-white text-sm mb-1">Threat Notifications</div>
                  <div className="text-xs text-white/50">Get alerts for detected threats</div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-2 rounded-lg text-sm"
                    style={{
                      background: colors.gradient,
                      border: `1px solid ${colors.primary}`,
                      color: colors.primary,
                    }}
                  >
                    <Bell className="w-4 h-4 inline mr-2" />
                    High & Critical Only
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-2 rounded-lg text-sm text-white/60"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    All Threats
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      {navActiveTab && navOnTabChange && (
        <BottomNav
          activeTab={navActiveTab}
          onTabChange={navOnTabChange}
          tribe={type}
        />
      )}
    </motion.div>
  );
}