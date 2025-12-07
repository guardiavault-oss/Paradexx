import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Users,
  Shield,
  Heart,
  Clock,
  Plus,
  Settings,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface GuardianXInheritanceProps {
  type: "degen" | "regen";
  onClose: () => void;
}

export function GuardianXInheritance({
  type,
  onClose,
}: GuardianXInheritanceProps) {
  const [hasVault, setHasVault] = useState(true);
  const isDegen = type === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";

  const beneficiaries = [
    {
      name: "Sarah Chen",
      relationship: "Spouse",
      allocation: 50,
      address: "0x742d...3f4a",
      verified: true,
    },
    {
      name: "Michael Chen",
      relationship: "Son",
      allocation: 30,
      address: "0x8b2a...9c1e",
      verified: true,
    },
    {
      name: "Emily Chen",
      relationship: "Daughter",
      allocation: 20,
      address: "0x1a3c...5d7f",
      verified: false,
    },
  ];

  const vaultStats = [
    { label: "Protected Assets", value: "$42,750" },
    { label: "Beneficiaries", value: "3" },
    { label: "Guardians", value: "2" },
    { label: "Inactivity", value: "90 days" },
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
                <Heart
                  className="w-6 h-6"
                  style={{ color: accentColor }}
                />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-black uppercase">
                  GuardianX
                </h1>
                <p className="text-xs md:text-sm text-white/50">
                  Digital legacy platform
                </p>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-white/5 border border-white/10"
          >
            <Settings className="w-5 h-5 text-white/70" />
          </motion.button>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Status Banner */}
        {hasVault ? (
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
                  Inheritance Vault Active
                </div>
                <p className="text-xs text-white/60">
                  Your assets are protected and will transfer to
                  beneficiaries
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
              background: "rgba(251, 146, 60, 0.1)",
              borderColor: "rgba(251, 146, 60, 0.3)",
            }}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-bold text-orange-400 mb-2">
                  No Vault Configured
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-lg font-bold text-sm"
                  style={{ background: accentColor }}
                >
                  Create Inheritance Vault
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {vaultStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl bg-white/5 border border-white/10"
            >
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
        <div className="p-4 md:p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-base font-black uppercase mb-4">
            How GuardianX Works
          </h3>
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: "Set Inactivity Period",
                desc: "Choose how long before vault activates (30, 60, 90, or 180 days)",
              },
              {
                step: 2,
                title: "Add Beneficiaries",
                desc: "Specify who receives your assets and their allocation percentages",
              },
              {
                step: 3,
                title: "Appoint Guardians",
                desc: "Trusted contacts who can verify inactivity and trigger distribution",
              },
              {
                step: 4,
                title: "Stay Active",
                desc: "Regular wallet activity resets the inactivity timer automatically",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{
                    background: `${accentColor}30`,
                    color: accentColor,
                    border: `2px solid ${accentColor}`,
                  }}
                >
                  {item.step}
                </div>
                <div className="flex-1">
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

        {/* Beneficiaries List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black uppercase">
              Beneficiaries
            </h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm"
              style={{ background: accentColor }}
            >
              <Plus className="w-4 h-4" />
              Add
            </motion.button>
          </div>

          <div className="space-y-3">
            {beneficiaries.map((beneficiary, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-black text-lg">
                      {beneficiary.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white">
                          {beneficiary.name}
                        </span>
                        {beneficiary.verified && (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      <div className="text-sm text-white/60">
                        {beneficiary.relationship}
                      </div>
                    </div>
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-lg font-bold text-sm"
                    style={{
                      background: `${accentColor}20`,
                      color: accentColor,
                    }}
                  >
                    {beneficiary.allocation}%
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <div className="text-xs text-white/40 mb-1">
                    Wallet Address
                  </div>
                  <div className="text-sm font-mono text-white/80">
                    {beneficiary.address}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Guardians Section */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users
                className="w-5 h-5"
                style={{ color: accentColor }}
              />
              <h3 className="text-base font-black uppercase">
                Guardians
              </h3>
            </div>
            <span className="text-sm text-white/60">
              2 Active
            </span>
          </div>
          <p className="text-xs text-white/60 mb-3">
            Guardians can verify your inactivity and help
            trigger asset distribution. They cannot access or
            control your funds.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2 rounded-lg font-bold text-sm border"
            style={{
              borderColor: "rgba(255, 255, 255, 0.2)",
              color: "rgba(255, 255, 255, 0.8)",
            }}
          >
            Manage Guardians
          </motion.button>
        </div>

        {/* Security Note */}
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
                Secure & Non-Custodial
              </div>
              <p className="text-xs text-white/60">
                GuardianX uses smart contracts to ensure your
                assets automatically transfer to beneficiaries.
                No one can access your funds until the
                inactivity conditions are met. You remain in
                full control.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}