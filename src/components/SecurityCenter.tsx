import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getThemeStyles } from "../design-system";
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Key,
  Fingerprint,
  Cloud,
  Users,
  Clock,
  Wallet,
  Link2,
  FileWarning,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ExternalLink,
  Trash2,
  Lock,
  Globe,
  Info,
  Loader2,
  Radio,
  Eye,
  Settings,
  Zap,
  TrendingUp,
  Award,
  Smartphone,
} from "lucide-react";

interface SecurityCenterProps {
  type: "degen" | "regen";
  onClose: () => void;
}

interface SecurityCheckItem {
  id: string;
  title: string;
  description: string;
  status: "pass" | "warn" | "fail";
  icon: any;
  impact: "critical" | "high" | "medium" | "low";
  actionLabel?: string;
}

interface TokenApproval {
  id: string;
  token: string;
  tokenSymbol: string;
  spender: string;
  spenderName?: string;
  amount: string;
  isUnlimited: boolean;
  approvedAt: string;
  riskLevel: "low" | "medium" | "high";
}

interface ConnectedDapp {
  id: string;
  name: string;
  url: string;
  permissions: string[];
  connectedAt: string;
  lastActive?: string;
}

export function SecurityCenter({ type, onClose }: SecurityCenterProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "approvals" | "dapps" | "settings">("overview");
  const [loading, setLoading] = useState(true);
  const [securityScore, setSecurityScore] = useState(0);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

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

  // Mock security checks
  const securityChecks: SecurityCheckItem[] = [
    {
      id: "backup",
      title: "Recovery Phrase Backed Up",
      description: "Your seed phrase is securely stored",
      status: "pass",
      icon: Key,
      impact: "critical",
    },
    {
      id: "2fa",
      title: "Biometric Authentication",
      description: "Face ID / Touch ID enabled",
      status: "pass",
      icon: Fingerprint,
      impact: "high",
      actionLabel: "Configure",
    },
    {
      id: "cloud_backup",
      title: "Cloud Backup",
      description: "Encrypted backup to iCloud/Google",
      status: "pass",
      icon: Cloud,
      impact: "medium",
    },
    {
      id: "guardians",
      title: "Recovery Guardians",
      description: "No guardians configured yet",
      status: "warn",
      icon: Users,
      impact: "high",
      actionLabel: "Set Up",
    },
    {
      id: "check_in",
      title: "Recent Activity Check-In",
      description: "Last check-in 3 days ago",
      status: "pass",
      icon: Clock,
      impact: "low",
    },
    {
      id: "hardware",
      title: "Hardware Wallet",
      description: "No hardware wallet connected",
      status: "fail",
      icon: Wallet,
      impact: "high",
      actionLabel: "Connect",
    },
    {
      id: "mev",
      title: "MEV Protection",
      description: "All transactions protected",
      status: "pass",
      icon: Shield,
      impact: "high",
    },
    {
      id: "auto_lock",
      title: "Auto-Lock Timer",
      description: "Locks after 5 minutes",
      status: "pass",
      icon: Lock,
      impact: "medium",
    },
  ];

  // Mock token approvals
  const [approvals, setApprovals] = useState<TokenApproval[]>([
    {
      id: "1",
      token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      tokenSymbol: "USDC",
      spender: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      spenderName: "Uniswap V2 Router",
      amount: "Unlimited",
      isUnlimited: true,
      approvedAt: "2024-01-15",
      riskLevel: "medium",
    },
    {
      id: "2",
      token: "0x6B175474E89094C44Da98b954EesdfFeC956aB7",
      tokenSymbol: "DAI",
      spender: "0xDef1C0ded9bec7F1a1670819833240f027b25EfF",
      spenderName: "0x Exchange",
      amount: "1,000 DAI",
      isUnlimited: false,
      approvedAt: "2024-02-20",
      riskLevel: "low",
    },
    {
      id: "3",
      token: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      tokenSymbol: "USDT",
      spender: "0x1234567890abcdef1234567890abcdef12345678",
      spenderName: "Unknown Contract",
      amount: "Unlimited",
      isUnlimited: true,
      approvedAt: "2024-03-10",
      riskLevel: "high",
    },
  ]);

  // Mock connected dApps
  const [connectedDapps, setConnectedDapps] = useState<ConnectedDapp[]>([
    {
      id: "1",
      name: "Uniswap",
      url: "https://app.uniswap.org",
      permissions: ["View wallet address", "Request transactions"],
      connectedAt: "2024-01-10",
      lastActive: "2024-03-15",
    },
    {
      id: "2",
      name: "OpenSea",
      url: "https://opensea.io",
      permissions: ["View wallet address", "View NFTs", "Request transactions"],
      connectedAt: "2024-02-05",
      lastActive: "2024-03-12",
    },
    {
      id: "3",
      name: "Aave",
      url: "https://app.aave.com",
      permissions: ["View wallet address", "Request transactions"],
      connectedAt: "2024-03-01",
      lastActive: "2024-03-14",
    },
  ]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      const passed = securityChecks.filter((c) => c.status === "pass").length;
      const score = Math.round((passed / securityChecks.length) * 100);
      setSecurityScore(score);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Score configuration
  const scoreConfig = useMemo(() => {
    if (securityScore >= 80)
      return { color: colors.secondary, label: "Excellent", icon: ShieldCheck };
    if (securityScore >= 60)
      return { color: "#f59e0b", label: "Good", icon: Shield };
    if (securityScore >= 40)
      return { color: "#f97316", label: "Fair", icon: ShieldAlert };
    return { color: "#ef4444", label: "Needs Attention", icon: ShieldOff };
  }, [securityScore, colors.secondary]);

  const issuesCount = securityChecks.filter((c) => c.status !== "pass").length;
  const criticalIssues = securityChecks.filter((c) => c.status === "fail" && c.impact === "critical").length;
  const unlimitedApprovals = approvals.filter((a) => a.isUnlimited).length;
  const highRiskApprovals = approvals.filter((a) => a.riskLevel === "high").length;

  const handleRevokeApproval = async (approvalId: string) => {
    setRevoking(approvalId);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
    setRevoking(null);
  };

  const handleDisconnectDapp = async (dappId: string) => {
    setDisconnecting(dappId);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setConnectedDapps((prev) => prev.filter((d) => d.id !== dappId));
    setDisconnecting(null);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Shield, badge: issuesCount },
    { id: "approvals", label: "Approvals", icon: FileWarning, badge: unlimitedApprovals },
    { id: "dapps", label: "Connected", icon: Link2, badge: connectedDapps.length },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

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
                  <h2 className="text-[var(--text-primary)]">Security Center</h2>
                </div>
                <p className="text-xs text-[var(--text-primary)]/50 mt-0.5">Protect your assets</p>
              </div>
            </div>

            {/* Security Score Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-3 py-1.5 rounded-xl flex items-center gap-2"
              style={{
                background: `${scoreConfig.color}20`,
                border: `1px solid ${scoreConfig.color}`,
                boxShadow: `0 0 15px ${scoreConfig.color}40`,
              }}
            >
              <scoreConfig.icon className="w-4 h-4" style={{ color: scoreConfig.color }} />
              <span className="text-sm" style={{ color: scoreConfig.color }}>
                {securityScore}
              </span>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className="relative px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all text-sm"
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
                      background: activeTab === tab.id ? colors.primary : "rgba(255, 255, 255, 0.1)",
                      color: activeTab === tab.id ? "white" : "#9ca3af",
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
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Security Score Card */}
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="p-6 rounded-2xl border relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${scoreConfig.color}15 0%, transparent 50%)`,
                  borderColor: `${scoreConfig.color}40`,
                  boxShadow: `0 0 30px ${scoreConfig.color}20`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-xl"
                      style={{ background: `${scoreConfig.color}20` }}
                    >
                      <scoreConfig.icon className="w-6 h-6" style={{ color: scoreConfig.color }} />
                    </div>
                    <div>
                      <div className="text-4xl text-[var(--text-primary)] mb-1">{securityScore}</div>
                      <div className="text-sm" style={{ color: scoreConfig.color }}>
                        {scoreConfig.label}
                      </div>
                    </div>
                  </div>

                  {/* Circular Progress */}
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="6"
                        fill="none"
                      />
                      <motion.circle
                        cx="40"
                        cy="40"
                        r="34"
                        stroke={scoreConfig.color}
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: securityScore / 100 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        strokeDasharray="213.63"
                        style={{ filter: `drop-shadow(0 0 6px ${scoreConfig.color}60)` }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm text-[var(--text-primary)]/50">/100</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white/5 rounded-xl text-center backdrop-blur-sm">
                    <div className="text-lg text-[var(--text-primary)]">{issuesCount}</div>
                    <div className="text-xs text-[var(--text-primary)]/50">Issues</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl text-center backdrop-blur-sm">
                    <div className="text-lg text-orange-400">{unlimitedApprovals}</div>
                    <div className="text-xs text-[var(--text-primary)]/50">Unlimited</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl text-center backdrop-blur-sm">
                    <div className="text-lg" style={{ color: colors.primary }}>
                      {connectedDapps.length}
                    </div>
                    <div className="text-xs text-[var(--text-primary)]/50">dApps</div>
                  </div>
                </div>
              </motion.div>

              {/* Critical Issues Alert */}
              {(criticalIssues > 0 || highRiskApprovals > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-red-500 mb-1">Action Required</div>
                      <p className="text-sm text-red-400/80">
                        {criticalIssues > 0 && `${criticalIssues} critical security issue${criticalIssues > 1 ? "s" : ""} detected. `}
                        {highRiskApprovals > 0 && `${highRiskApprovals} high-risk approval${highRiskApprovals > 1 ? "s" : ""} need review.`}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Security Checklist */}
              <div>
                <h3 className="text-sm text-[var(--text-primary)]/60 mb-3 uppercase tracking-wide">
                  Security Checklist
                </h3>
                <div className="space-y-2">
                  {securityChecks.map((check, index) => (
                    <motion.div
                      key={check.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-xl border backdrop-blur-sm"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        borderColor: check.status === "fail" ? "rgba(239, 68, 68, 0.3)" : colors.border,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Status Icon */}
                        <div
                          className="p-2.5 rounded-xl shrink-0"
                          style={{
                            background:
                              check.status === "pass"
                                ? `${colors.secondary}20`
                                : check.status === "warn"
                                  ? "rgba(249, 115, 22, 0.2)"
                                  : "rgba(239, 68, 68, 0.2)",
                          }}
                        >
                          {check.status === "pass" && (
                            <CheckCircle2 className="w-5 h-5" style={{ color: colors.secondary }} />
                          )}
                          {check.status === "warn" && (
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                          )}
                          {check.status === "fail" && <XCircle className="w-5 h-5 text-red-500" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="text-[var(--text-primary)] text-sm mb-1">{check.title}</div>
                          <div className="text-xs text-[var(--text-primary)]/50 truncate">{check.description}</div>
                        </div>

                        {/* Action Button */}
                        {check.actionLabel && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="px-3 py-1.5 rounded-lg text-xs shrink-0"
                            style={{
                              background: colors.gradient,
                              border: `1px solid ${colors.primary}`,
                              color: colors.primary,
                            }}
                          >
                            {check.actionLabel}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "approvals" && (
            <motion.div
              key="approvals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
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
                      Token Approvals
                    </div>
                    <p className="text-xs text-[var(--text-primary)]/60">
                      These contracts have permission to spend your tokens. Revoke any you don't recognize or no longer use.
                    </p>
                  </div>
                </div>
              </div>

              {/* Approvals List */}
              {approvals.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: colors.secondary }} />
                  <div className="text-[var(--text-primary)] mb-1">No Active Approvals</div>
                  <p className="text-sm text-[var(--text-primary)]/50">Your wallet has no token approvals</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvals.map((approval, index) => (
                    <motion.div
                      key={approval.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-xl border"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        borderColor:
                          approval.riskLevel === "high"
                            ? "rgba(239, 68, 68, 0.3)"
                            : approval.riskLevel === "medium"
                              ? "rgba(249, 115, 22, 0.3)"
                              : colors.border,
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-primary)]"
                            style={{
                              background:
                                approval.riskLevel === "high"
                                  ? "rgba(239, 68, 68, 0.2)"
                                  : approval.riskLevel === "medium"
                                    ? "rgba(249, 115, 22, 0.2)"
                                    : `${colors.secondary}20`,
                            }}
                          >
                            {approval.tokenSymbol.charAt(0)}
                          </div>
                          <div>
                            <div className="text-[var(--text-primary)]">{approval.tokenSymbol}</div>
                            <div className="text-xs text-[var(--text-primary)]/50">
                              {approval.spenderName || `${approval.spender.slice(0, 6)}...${approval.spender.slice(-4)}`}
                            </div>
                          </div>
                        </div>

                        {/* Risk Badge */}
                        <span
                          className="px-2 py-1 rounded-lg text-xs"
                          style={{
                            background:
                              approval.riskLevel === "high"
                                ? "rgba(239, 68, 68, 0.2)"
                                : approval.riskLevel === "medium"
                                  ? "rgba(249, 115, 22, 0.2)"
                                  : "rgba(34, 197, 94, 0.2)",
                            color:
                              approval.riskLevel === "high"
                                ? "#ef4444"
                                : approval.riskLevel === "medium"
                                  ? "#f97316"
                                  : "#22c55e",
                          }}
                        >
                          {approval.riskLevel.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-[var(--text-primary)]/50">Approved Amount</div>
                          <div
                            className={approval.isUnlimited ? "text-orange-400" : "text-[var(--text-primary)]"}
                          >
                            {approval.amount} {approval.isUnlimited && "⚠️"}
                          </div>
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRevokeApproval(approval.id)}
                          disabled={revoking === approval.id}
                          className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                          style={{
                            background: "rgba(239, 68, 68, 0.2)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#ef4444",
                          }}
                        >
                          {revoking === approval.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3" />
                              Revoke
                            </>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "dapps" && (
            <motion.div
              key="dapps"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Connected dApps List */}
              {connectedDapps.length === 0 ? (
                <div className="p-8 text-center">
                  <Link2 className="w-12 h-12 text-[var(--text-primary)]/20 mx-auto mb-3" />
                  <div className="text-[var(--text-primary)] mb-1">No Connected dApps</div>
                  <p className="text-sm text-[var(--text-primary)]/50">Connect to dApps to see them here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {connectedDapps.map((dapp, index) => (
                    <motion.div
                      key={dapp.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-xl border"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        borderColor: colors.border,
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                            }}
                          >
                            <Globe className="w-5 h-5 text-[var(--text-primary)]" />
                          </div>
                          <div>
                            <div className="text-[var(--text-primary)]">{dapp.name}</div>
                            <div className="text-xs text-[var(--text-primary)]/50">{dapp.url}</div>
                          </div>
                        </div>

                        <a
                          href={dapp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-white/5 rounded-lg transition-all"
                        >
                          <ExternalLink className="w-4 h-4 text-[var(--text-primary)]/50" />
                        </a>
                      </div>

                      {/* Permissions */}
                      <div className="mb-3">
                        <div className="text-xs text-[var(--text-primary)]/50 mb-2">Permissions</div>
                        <div className="flex flex-wrap gap-1">
                          {dapp.permissions.map((perm, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-white/5 rounded text-xs text-[var(--text-primary)]/70"
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-[var(--text-primary)]/40">Connected {dapp.connectedAt}</div>

                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDisconnectDapp(dapp.id)}
                          disabled={disconnecting === dapp.id}
                          className="px-3 py-1.5 rounded-lg text-xs"
                          style={{
                            background: "rgba(239, 68, 68, 0.2)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#ef4444",
                          }}
                        >
                          {disconnecting === dapp.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Disconnect"
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {/* Settings Options */}
              {[
                { icon: Fingerprint, title: "Biometric Authentication", desc: "Face ID / Touch ID", value: "Enabled" },
                { icon: Lock, title: "Auto-Lock Timer", desc: "Lock after inactivity", value: "5 min" },
                { icon: Users, title: "Recovery Guardians", desc: "Social recovery setup", value: "Set Up" },
                { icon: Cloud, title: "Cloud Backup", desc: "Encrypted backup", value: "Active" },
                { icon: Smartphone, title: "Security Alerts", desc: "Transaction notifications", value: "On" },
                { icon: Shield, title: "MEV Protection", desc: "Transaction protection", value: "Enabled" },
              ].map((setting, index) => (
                <motion.div
                  key={setting.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 rounded-xl border backdrop-blur-sm cursor-pointer"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-xl shrink-0"
                      style={{ background: `${colors.primary}20` }}
                    >
                      <setting.icon className="w-5 h-5" style={{ color: colors.primary }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[var(--text-primary)] text-sm">{setting.title}</div>
                      <div className="text-xs text-[var(--text-primary)]/50">{setting.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--text-primary)]/50">{setting.value}</span>
                      <ChevronRight className="w-4 h-4 text-[var(--text-primary)]/30" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}