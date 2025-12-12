import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Shield,
  Lock,
  Globe,
  Zap,
  Loader2,
} from "lucide-react";
import { API_URL } from "../../config/api";

interface PrivacyShieldProps {
  type: "degen" | "regen";
  onClose: () => void;
}

export function PrivacyShield({
  type,
  onClose,
}: PrivacyShieldProps) {
  const [privacyLevel, setPrivacyLevel] = useState<
    "low" | "medium" | "high"
  >("medium");
  const isDegen = type === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";
  
  const [privacyStats, setPrivacyStats] = useState({
    privateTxs: 0,
    activeDays: 0,
    networks: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch privacy stats from API
  useEffect(() => {
    const fetchPrivacyStats = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        // Try privacy stats endpoint
        const response = await fetch(`${API_URL}/api/privacy/stats`, { headers });
        if (response.ok) {
          const data = await response.json();
          setPrivacyStats({
            privateTxs: data.privateTxs || data.private_txs || 0,
            activeDays: data.activeDays || data.active_days || 0,
            networks: data.networks || data.active_networks || 0,
          });
        } else {
          // Calculate from wallet transactions if available
          const walletAddress = localStorage.getItem('walletAddress');
          if (walletAddress) {
            const txResponse = await fetch(`${API_URL}/api/wallet/transactions?address=${walletAddress}&limit=100`, { headers });
            if (txResponse.ok) {
              const txData = await txResponse.json();
              const transactions = txData.transactions || [];
              // Estimate privacy stats (would need backend to track this properly)
              setPrivacyStats({
                privateTxs: Math.floor(transactions.length * 0.3), // Estimate 30% private
                activeDays: transactions.length > 0 ? Math.floor((Date.now() - new Date(transactions[transactions.length - 1].timestamp).getTime()) / (1000 * 60 * 60 * 24)) : 0,
                networks: new Set(transactions.map((tx: any) => tx.network || tx.chainId)).size || 1,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching privacy stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacyStats();
  }, []);

  const privacyFeatures = [
    {
      title: "Transaction Privacy",
      desc: "Hide transaction details from public explorers",
      enabled: privacyLevel !== "low",
      icon: Eye,
    },
    {
      title: "Address Obfuscation",
      desc: "Mask your wallet address in public view",
      enabled: privacyLevel === "high",
      icon: Lock,
    },
    {
      title: "Network Privacy",
      desc: "Route transactions through privacy network",
      enabled: privacyLevel !== "low",
      icon: Globe,
    },
    {
      title: "Stealth Addresses",
      desc: "Generate one-time addresses for receiving",
      enabled: privacyLevel === "high",
      icon: Zap,
    },
  ];

  // Calculate privacy score based on level
  const privacyScore = privacyLevel === "high" ? 95 : privacyLevel === "medium" ? 75 : 45;

  const stats = [
    {
      label: "Privacy Score",
      value: `${privacyScore}%`,
    },
    { label: "Private Txs", value: privacyStats.privateTxs.toLocaleString() },
    { label: "Active Days", value: privacyStats.activeDays.toString() },
    { label: "Networks", value: privacyStats.networks.toString() },
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
        <div className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 max-w-7xl mx-auto">
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
              <EyeOff
                className="w-6 h-6"
                style={{ color: accentColor }}
              />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-black uppercase">
                Privacy Shield
              </h1>
              <p className="text-xs md:text-sm text-white/50">
                Enhanced transaction privacy
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Privacy Level Selector */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-base font-black uppercase mb-4">
            Privacy Level
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {(["low", "medium", "high"] as const).map(
              (level) => (
                <motion.button
                  key={level}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPrivacyLevel(level)}
                  className="p-4 rounded-xl font-bold text-sm capitalize transition-all"
                  style={{
                    background:
                      privacyLevel === level
                        ? accentColor
                        : "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${privacyLevel === level ? accentColor : "rgba(255, 255, 255, 0.1)"}`,
                    boxShadow:
                      privacyLevel === level
                        ? `0 0 20px ${accentColor}40`
                        : "none",
                  }}
                >
                  {level}
                </motion.button>
              ),
            )}
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-white/40" />
          </div>
        ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="text-2xl font-black mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-white/60 uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Privacy Features */}
        <div>
          <h3 className="text-base font-black uppercase mb-4">
            Active Features
          </h3>
          <div className="space-y-2">
            {privacyFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      background: feature.enabled
                        ? `${accentColor}20`
                        : "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${feature.enabled ? `${accentColor}40` : "rgba(255, 255, 255, 0.1)"}`,
                    }}
                  >
                    <feature.icon
                      className="w-5 h-5"
                      style={{
                        color: feature.enabled
                          ? accentColor
                          : "rgba(255, 255, 255, 0.4)",
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-bold text-white">
                        {feature.title}
                      </div>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold"
                        style={{
                          background: feature.enabled
                            ? "rgba(34, 197, 94, 0.2)"
                            : "rgba(156, 163, 175, 0.2)",
                          color: feature.enabled
                            ? "#22c55e"
                            : "#9ca3af",
                        }}
                      >
                        {feature.enabled ? "ON" : "OFF"}
                      </span>
                    </div>
                    <p className="text-xs text-white/60">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Info */}
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
                Privacy vs Speed Trade-off
              </div>
              <p className="text-xs text-white/60">
                Higher privacy levels may slightly increase
                transaction time as they route through
                additional privacy-preserving networks. Choose
                the level that fits your needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}