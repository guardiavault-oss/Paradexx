import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Lock,
  Shield,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Zap,
  Activity,
} from "lucide-react";

interface MEVProtectionProps {
  type: "degen" | "regen";
  onClose: () => void;
}

export function MEVProtection({
  type,
  onClose,
}: MEVProtectionProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const isDegen = type === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";

  const stats = [
    { label: "Attacks Blocked", value: "847", icon: Shield },
    { label: "Saved", value: "$2,450", icon: DollarSign },
    { label: "Success Rate", value: "99.7%", icon: TrendingUp },
    { label: "Active Time", value: "89d", icon: Activity },
  ];

  const recentBlocks = [
    {
      type: "frontrun",
      amount: "$125.50",
      token: "ETH/USDC Swap",
      time: "5m ago",
      severity: "high",
    },
    {
      type: "sandwich",
      amount: "$78.20",
      token: "WBTC/ETH Swap",
      time: "12m ago",
      severity: "medium",
    },
    {
      type: "backrun",
      amount: "$34.15",
      token: "AAVE/USDC",
      time: "18m ago",
      severity: "low",
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
                <Lock
                  className="w-6 h-6"
                  style={{ color: accentColor }}
                />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-black uppercase">
                  MEV Protection
                </h1>
                <p className="text-xs md:text-sm text-white/50">
                  Shield against MEV attacks
                </p>
              </div>
            </div>
          </div>

          {/* Toggle Protection */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEnabled(!isEnabled)}
            className="relative inline-flex h-8 w-14 md:h-10 md:w-16 items-center rounded-full transition-colors"
            style={{
              background: isEnabled
                ? accentColor
                : "rgba(255, 255, 255, 0.1)",
            }}
          >
            <motion.span
              className="inline-block h-6 w-6 md:h-8 md:w-8 transform rounded-full bg-white shadow-lg transition-transform"
              animate={{ x: isEnabled ? 28 : 4 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
            />
          </motion.button>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Status Banner */}
        {isEnabled ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border"
            style={{
              background: "rgba(34, 197, 94, 0.1)",
              borderColor: "rgba(34, 197, 94, 0.3)",
            }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-green-400">
                  MEV Protection Active
                </div>
                <p className="text-xs text-white/60">
                  All transactions are being protected from MEV
                  attacks
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              borderColor: "rgba(239, 68, 68, 0.3)",
            }}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-red-400">
                  MEV Protection Disabled
                </div>
                <p className="text-xs text-white/60">
                  Your transactions are vulnerable to MEV
                  attacks
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <stat.icon className="w-5 h-5 text-white/40 mb-2" />
              <div className="text-2xl font-black text-white mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-white/60 uppercase tracking-wide">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* How It Works */}
        <div
          className="p-4 md:p-6 rounded-xl"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3 className="text-base md:text-lg font-black uppercase mb-4">
            How MEV Protection Works
          </h3>
          <div className="space-y-3">
            {[
              {
                title: "Private Transactions",
                desc: "Routes through private mempools to prevent frontrunning",
                icon: Lock,
              },
              {
                title: "Flashbots Integration",
                desc: "Uses Flashbots RPC to protect against sandwich attacks",
                icon: Zap,
              },
              {
                title: "Slippage Protection",
                desc: "Automatic slippage adjustment to prevent value extraction",
                icon: Shield,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/5"
              >
                <item.icon
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  style={{ color: accentColor }}
                />
                <div>
                  <div className="text-sm font-bold text-white mb-1">
                    {item.title}
                  </div>
                  <p className="text-xs text-white/60">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Blocked Attacks */}
        <div>
          <h3 className="text-base font-black uppercase mb-4">
            Recent Blocked Attacks
          </h3>
          <div className="space-y-3">
            {recentBlocks.map((block, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold uppercase"
                        style={{
                          background:
                            block.severity === "high"
                              ? "rgba(239, 68, 68, 0.2)"
                              : block.severity === "medium"
                                ? "rgba(251, 146, 60, 0.2)"
                                : "rgba(251, 191, 36, 0.2)",
                          color:
                            block.severity === "high"
                              ? "#ef4444"
                              : block.severity === "medium"
                                ? "#fb923c"
                                : "#fbbf24",
                        }}
                      >
                        {block.type}
                      </span>
                      <span className="text-sm font-bold text-green-400">
                        {block.amount} saved
                      </span>
                    </div>
                    <p className="text-sm text-white/60 truncate">
                      {block.token}
                    </p>
                  </div>
                  <p className="text-xs text-white/40 flex-shrink-0">
                    {block.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div
          className="p-4 rounded-xl border"
          style={{
            background: "rgba(59, 130, 246, 0.1)",
            borderColor: "rgba(59, 130, 246, 0.3)",
          }}
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-blue-400 mb-1">
                What is MEV?
              </div>
              <p className="text-xs text-white/60">
                MEV (Maximal Extractable Value) is profit
                extracted by reordering, inserting, or censoring
                transactions. Our protection routes your
                transactions through private channels to prevent
                frontrunning, sandwich attacks, and other forms
                of MEV.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}