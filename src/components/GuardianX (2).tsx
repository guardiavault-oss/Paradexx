import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import {
  ArrowLeft,
  Shield,
  Users,
  MessageSquare,
  Scroll,
  Activity,
  Plus,
  Heart,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Vault,
  Lock,
  Zap,
  ChevronRight,
  Flame,
  Target,
  Calendar,
  Percent,
  FileText,
  Video,
  Settings,
  Info,
  Sparkles,
  Eye,
} from "lucide-react";
import { SmartWillBuilder } from "./SmartWillBuilder";

interface GuardianXProps {
  type: "degen" | "regen";
  onClose: () => void;
}

interface Beneficiary {
  id: string;
  name: string;
  address: string;
  allocation: number;
  relationship: string;
  status: "active" | "pending";
}

interface LegacyMessage {
  id: string;
  recipient: string;
  type: "text" | "video" | "audio";
  status: "encrypted";
  createdAt: Date;
  preview?: string;
}

export function GuardianX({ type, onClose }: GuardianXProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "beneficiaries" | "messages" | "guardians">(
    "overview"
  );
  const [showAddBeneficiary, setShowAddBeneficiary] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showSmartWillBuilder, setShowSmartWillBuilder] = useState(false);

  const isDegen = type === "degen";

  const colors = {
    primary: isDegen ? "#DC143C" : "#0080FF",
    secondary: isDegen ? "#8B0000" : "#000080",
    gradient: isDegen
      ? "linear-gradient(135deg, rgba(220, 20, 60, 0.2) 0%, rgba(139, 0, 0, 0.1) 100%)"
      : "linear-gradient(135deg, rgba(0, 128, 255, 0.2) 0%, rgba(0, 0, 128, 0.1) 100%)",
    border: isDegen ? "rgba(220, 20, 60, 0.2)" : "rgba(0, 128, 255, 0.2)",
    glow: isDegen
      ? "0 0 20px rgba(220, 20, 60, 0.3)"
      : "0 0 20px rgba(0, 128, 255, 0.3)",
  };

  // Mock data
  const beneficiaries: Beneficiary[] = [
    {
      id: "1",
      name: "Emma Wilson",
      address: "0x3c4d...7e8f",
      allocation: 40,
      relationship: "Daughter",
      status: "active",
    },
    {
      id: "2",
      name: "James Taylor",
      address: "0x8f2a...3c5d",
      allocation: 35,
      relationship: "Son",
      status: "active",
    },
    {
      id: "3",
      name: "Charity Foundation",
      address: "0x1a9b...6f4e",
      allocation: 25,
      relationship: "Organization",
      status: "active",
    },
  ];

  const messages: LegacyMessage[] = [
    {
      id: "1",
      recipient: "Emma Wilson",
      type: "video",
      status: "encrypted",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      preview: "Personal message about family values...",
    },
    {
      id: "2",
      recipient: "James Taylor",
      type: "text",
      status: "encrypted",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      preview: "Guidance for the future...",
    },
    {
      id: "3",
      recipient: "All Beneficiaries",
      type: "text",
      status: "encrypted",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      preview: "Final wishes and instructions...",
    },
  ];

  const vaultStats = {
    timelockDays: 30,
    lastCheckIn: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    checkInStreak: 7,
    vaultBalance: "12.4567",
    vaultHealth: 85,
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleCheckIn = () => {
    setShowCheckInModal(true);
    // Simulate check-in
    setTimeout(() => setShowCheckInModal(false), 2000);
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
                  <h2 className="text-white">GuardianX</h2>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  {isDegen ? "Protect your gains forever" : "Secure your digital legacy"}
                </p>
              </div>
            </div>

            <div
              className="px-3 py-1.5 rounded-full text-xs"
              style={{
                background: `${colors.primary}20`,
                color: colors.primary,
              }}
            >
              PRO
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { id: "overview", label: "Overview", icon: Activity },
              { id: "beneficiaries", label: "Heirs", icon: Users, badge: beneficiaries.length },
              { id: "messages", label: "Messages", icon: MessageSquare, badge: messages.length },
              { id: "guardians", label: "Guardians", icon: Shield },
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
                {tab.badge !== undefined && (
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
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Vault Balance Card */}
              <div
                className="p-6 rounded-xl border relative overflow-hidden"
                style={{
                  background: colors.gradient,
                  borderColor: colors.border,
                  boxShadow: colors.glow,
                }}
              >
                {/* Animated particles */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        y: [0, -100],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 1,
                      }}
                      className="absolute w-1 h-8 rounded-full"
                      style={{
                        background: colors.primary,
                        left: `${20 + i * 30}%`,
                        bottom: 0,
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Vault className="w-5 h-5" style={{ color: colors.primary }} />
                      <span className="text-sm text-white/70">Legacy Vault Balance</span>
                    </div>
                    <div
                      className="px-2 py-1 rounded text-xs"
                      style={{
                        background: "rgba(34, 197, 94, 0.2)",
                        color: "#22c55e",
                      }}
                    >
                      Active
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl text-white">{vaultStats.vaultBalance}</span>
                    <span className="text-xl text-white/50">ETH</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-white/50 mb-1">Beneficiaries</div>
                      <div className="text-lg text-white">{beneficiaries.length}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/50 mb-1">Timelock</div>
                      <div className="text-lg text-white">{vaultStats.timelockDays} days</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Check-in Card */}
              <div
                className="p-6 rounded-xl border"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-xl"
                      style={{ background: `${colors.primary}20` }}
                    >
                      <Heart className="w-6 h-6" style={{ color: colors.primary }} />
                    </div>
                    <div>
                      <div className="text-white mb-1">Life Check-In</div>
                      <div className="text-sm text-white/50">
                        Last: {formatTimeAgo(vaultStats.lastCheckIn)}
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCheckIn}
                    className="px-4 py-2 rounded-xl text-white font-bold"
                    style={{
                      background: colors.gradient,
                      border: `1px solid ${colors.primary}`,
                      boxShadow: colors.glow,
                    }}
                  >
                    Check In
                  </motion.button>
                </div>

                {/* Streak */}
                <div
                  className="p-3 rounded-xl flex items-center justify-between"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-white">Check-in Streak</span>
                  </div>
                  <span className="text-white font-bold">{vaultStats.checkInStreak} days</span>
                </div>
              </div>

              {/* Vault Health */}
              <div
                className="p-6 rounded-xl border"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white">Vault Health Score</div>
                  <div
                    className="text-2xl font-bold"
                    style={{ color: colors.secondary }}
                  >
                    {vaultStats.vaultHealth}%
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${vaultStats.vaultHealth}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                    }}
                  />
                </div>

                {/* Checklist */}
                <div className="space-y-2">
                  {[
                    { label: "Beneficiaries added", done: true },
                    { label: "Messages created", done: true },
                    { label: "Guardians assigned", done: false },
                    { label: "Legal review", done: false },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {item.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-white/30" />
                      )}
                      <span className={item.done ? "text-white" : "text-white/50"}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div
                  className="p-4 rounded-xl text-center"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <Users className="w-6 h-6 mx-auto mb-2" style={{ color: colors.primary }} />
                  <div className="text-2xl text-white mb-1">{beneficiaries.length}</div>
                  <div className="text-xs text-white/50">Heirs</div>
                </div>
                <div
                  className="p-4 rounded-xl text-center"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <MessageSquare className="w-6 h-6 mx-auto mb-2" style={{ color: colors.primary }} />
                  <div className="text-2xl text-white mb-1">{messages.length}</div>
                  <div className="text-xs text-white/50">Messages</div>
                </div>
                <div
                  className="p-4 rounded-xl text-center"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <Clock className="w-6 h-6 mx-auto mb-2" style={{ color: colors.primary }} />
                  <div className="text-2xl text-white mb-1">{vaultStats.timelockDays}</div>
                  <div className="text-xs text-white/50">Days</div>
                </div>
              </div>

              {/* Smart Will Builder CTA */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSmartWillBuilder(true)}
                className="p-6 rounded-xl border cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)",
                  borderColor: "rgba(139, 92, 246, 0.3)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-xl"
                      style={{ background: "rgba(139, 92, 246, 0.2)" }}
                    >
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-white mb-1 font-bold">AI Will Builder</div>
                      <p className="text-sm text-white/60">
                        Create a complete digital will with AI assistance
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400" />
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Beneficiaries Tab */}
          {activeTab === "beneficiaries" && (
            <motion.div
              key="beneficiaries"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Add Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddBeneficiary(true)}
                className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2"
                style={{
                  background: colors.gradient,
                  border: `1px solid ${colors.primary}`,
                  boxShadow: colors.glow,
                }}
              >
                <Plus className="w-5 h-5" />
                Add Beneficiary
              </motion.button>

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
                      Smart Distribution
                    </div>
                    <p className="text-xs text-white/60">
                      Your assets will be distributed to beneficiaries after {vaultStats.timelockDays} days
                      of inactivity
                    </p>
                  </div>
                </div>
              </div>

              {/* Allocation Chart */}
              <div
                className="p-6 rounded-xl border"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderColor: colors.border,
                }}
              >
                <div className="text-white mb-4">Allocation Distribution</div>
                <div className="space-y-3">
                  {beneficiaries.map((ben, index) => (
                    <div key={ben.id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white/70">{ben.name}</span>
                        <span className="text-sm text-white font-bold">{ben.allocation}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${ben.allocation}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Beneficiary List */}
              <div className="space-y-3">
                {beneficiaries.map((ben, index) => (
                  <motion.div
                    key={ben.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl border"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                            color: "white",
                          }}
                        >
                          {ben.allocation}%
                        </div>
                        <div>
                          <div className="text-white">{ben.name}</div>
                          <div className="text-sm text-white/50">{ben.relationship}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/30" />
                    </div>

                    <div
                      className="pt-3 border-t flex items-center justify-between"
                      style={{ borderColor: colors.border }}
                    >
                      <div className="text-xs text-white/50">{ben.address}</div>
                      <div
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          background: "rgba(34, 197, 94, 0.2)",
                          color: "#22c55e",
                        }}
                      >
                        {ben.status}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <motion.div
              key="messages"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Create Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2"
                style={{
                  background: colors.gradient,
                  border: `1px solid ${colors.primary}`,
                  boxShadow: colors.glow,
                }}
              >
                <Plus className="w-5 h-5" />
                Create Legacy Message
              </motion.button>

              {/* Encryption Info */}
              <div
                className="p-4 rounded-xl border"
                style={{
                  background: `${colors.primary}10`,
                  borderColor: `${colors.primary}30`,
                }}
              >
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: colors.primary }} />
                  <div>
                    <div className="text-sm mb-1" style={{ color: colors.primary }}>
                      End-to-End Encrypted
                    </div>
                    <p className="text-xs text-white/60">
                      Messages are encrypted and only revealed to beneficiaries when vault
                      conditions are met
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages List */}
              <div className="space-y-3">
                {messages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl border"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-3 rounded-xl"
                          style={{ background: `${colors.primary}20` }}
                        >
                          {msg.type === "video" ? (
                            <Video className="w-5 h-5" style={{ color: colors.primary }} />
                          ) : (
                            <MessageSquare className="w-5 h-5" style={{ color: colors.primary }} />
                          )}
                        </div>
                        <div>
                          <div className="text-white mb-1">To: {msg.recipient}</div>
                          <div className="text-xs text-white/50">
                            {formatTimeAgo(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div
                        className="px-2 py-1 rounded text-xs flex items-center gap-1"
                        style={{
                          background: `${colors.primary}20`,
                          color: colors.primary,
                        }}
                      >
                        <Lock className="w-3 h-3" />
                        Encrypted
                      </div>
                    </div>

                    {msg.preview && (
                      <div
                        className="p-3 rounded-xl text-sm text-white/70"
                        style={{ background: "rgba(255, 255, 255, 0.05)" }}
                      >
                        {msg.preview}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Guardians Tab */}
          {activeTab === "guardians" && (
            <motion.div
              key="guardians"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Coming Soon */}
              <div
                className="p-12 rounded-xl border text-center"
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  borderColor: colors.border,
                }}
              >
                <Shield className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <div className="text-white mb-2">Social Recovery Guardians</div>
                <p className="text-sm text-white/50 mb-6">
                  Invite trusted contacts to help recover your vault
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 rounded-xl text-white font-bold"
                  style={{
                    background: colors.gradient,
                    border: `1px solid ${colors.primary}`,
                  }}
                >
                  Invite Guardians
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Check-in Success Modal */}
      <AnimatePresence>
        {showCheckInModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckInModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto rounded-2xl border z-50 p-6 text-center"
              style={{
                background: "rgba(0, 0, 0, 0.95)",
                borderColor: colors.border,
                boxShadow: colors.glow,
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                }}
              >
                <Heart className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl text-white mb-2">Check-In Successful!</h3>
              <p className="text-sm text-white/60 mb-4">
                Vault timer reset. Next check-in due in {vaultStats.timelockDays} days.
              </p>
              <div
                className="p-3 rounded-xl"
                style={{
                  background: `${colors.primary}10`,
                  border: `1px solid ${colors.primary}30`,
                }}
              >
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-white">
                    {vaultStats.checkInStreak + 1} day streak!
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Smart Will Builder Modal */}
      <SmartWillBuilder
        isOpen={showSmartWillBuilder}
        onClose={() => setShowSmartWillBuilder(false)}
        onSave={(willData) => {
          console.log("Will saved:", willData);
          setShowSmartWillBuilder(false);
        }}
        type={type}
      />
    </motion.div>
  );
}