import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getThemeStyles } from "../design-system";
import {
  X,
  TrendingUp,
  Shield,
  AlertTriangle,
  Coins,
  ArrowRight,
  Info,
  Loader2,
  Sparkles,
  Lock,
  Zap,
} from "lucide-react";

interface YieldOpportunity {
  id: string;
  protocol: string;
  chain: string;
  asset: string;
  apy: string;
  tvl: string;
  riskLevel: "low" | "medium" | "high";
  strategy: string;
}

interface YieldOpportunitiesProps {
  isOpen: boolean;
  onClose: () => void;
  type: "degen" | "regen";
}

const opportunities: YieldOpportunity[] = [
  {
    id: "1",
    protocol: "Aave V3",
    chain: "Arbitrum",
    asset: "USDC",
    apy: "4.8%",
    tvl: "$450M",
    riskLevel: "low",
    strategy: "Lending",
  },
  {
    id: "2",
    protocol: "Curve",
    chain: "Ethereum",
    asset: "ETH",
    apy: "6.2%",
    tvl: "$1.2B",
    riskLevel: "low",
    strategy: "Liquidity Provision",
  },
  {
    id: "3",
    protocol: "Lido",
    chain: "Ethereum",
    asset: "stETH",
    apy: "3.5%",
    tvl: "$14.2B",
    riskLevel: "low",
    strategy: "ETH Staking",
  },
  {
    id: "4",
    protocol: "GMX",
    chain: "Arbitrum",
    asset: "USDC",
    apy: "14.5%",
    tvl: "$280M",
    riskLevel: "medium",
    strategy: "GLP Staking",
  },
  {
    id: "5",
    protocol: "Yearn Finance",
    chain: "Optimism",
    asset: "USDT",
    apy: "8.9%",
    tvl: "$125M",
    riskLevel: "medium",
    strategy: "Auto-Compounding",
  },
  {
    id: "6",
    protocol: "Beefy",
    chain: "Polygon",
    asset: "USDT-USDC",
    apy: "22.1%",
    tvl: "$45M",
    riskLevel: "high",
    strategy: "LP Farming",
  },
];

export function YieldOpportunities({
  isOpen,
  onClose,
  type,
}: YieldOpportunitiesProps) {
  const theme = getThemeStyles(type);
  const primaryColor = theme.primaryColor;
  const isDegen = type === "degen";

  const [filter, setFilter] = useState<"all" | "low_risk" | "high_yield">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);

  const filteredOpportunities = opportunities.filter((op) => {
    if (filter === "low_risk") return op.riskLevel === "low";
    if (filter === "high_yield") return parseFloat(op.apy) > 10;
    return true;
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-[var(--regen-primary)]";
      case "medium":
        return "text-[var(--degen-primary)]";
      case "high":
        return "text-[var(--text-destructive)]";
      default:
        return "text-[var(--text-muted)]";
    }
  };

  const getRiskBg = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-[var(--regen-primary)]/20";
      case "medium":
        return "bg-[var(--degen-primary)]/20";
      case "high":
        return "bg-[var(--text-destructive)]/20";
      default:
        return "bg-[var(--bg-hover)]";
    }
  };

  const handleDeposit = async (opportunityId: string) => {
    setSelectedOpportunity(opportunityId);
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    // Handle deposit logic
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[var(--bg-overlay)] backdrop-blur-[var(--blur-md)] z-[var(--z-modal-backdrop)]"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl z-50 flex flex-col max-h-[85vh] mx-4"
        style={{
          background: "var(--bg-elevated)",
          border: `1px solid ${primaryColor}40`,
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: `${primaryColor}20` }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${primaryColor}20` }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className="text-[var(--text-lg)] font-[var(--font-weight-bold)] text-[var(--text-primary)]">Yield Opportunities</h2>
              <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">Curated high-quality DeFi strategies</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-lg)] hover:bg-[var(--bg-hover)] transition-all duration-[var(--duration-normal)]"
          >
            <X className="w-5 h-5 text-[var(--text-tertiary)]" />
          </motion.button>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-4 border-b" style={{ borderColor: `${primaryColor}20` }}>
          <div className="flex gap-2">
            {(["all", "low_risk", "high_yield"] as const).map((f) => (
              <motion.button
                key={f}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-[var(--radius-lg)] text-[var(--text-sm)] font-[var(--font-weight-medium)] capitalize transition-all duration-[var(--duration-normal)]`}
                style={{
                  background: filter === f ? primaryColor : "var(--bg-hover)",
                  color: filter === f ? "var(--text-primary)" : "var(--text-tertiary)",
                }}
              >
                {f.replace("_", " ")}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {filteredOpportunities.map((op, index) => (
              <motion.div
                key={op.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 4 }}
                className="p-4 rounded-[var(--radius-xl)] border transition-all duration-[var(--duration-normal)]"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: `${primaryColor}20`,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[var(--bg-hover)] rounded-full flex items-center justify-center">
                      <Coins className="w-6 h-6" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[var(--text-sm)] font-[var(--font-weight-bold)] text-[var(--text-primary)]">{op.protocol}</h3>
                        <span className="text-[var(--text-xs)] px-2 py-0.5 bg-[var(--bg-hover)] rounded text-[var(--text-tertiary)]">
                          {op.chain}
                        </span>
                      </div>
                      <div className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                        {op.strategy} • {op.asset}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border ${getRiskBg(op.riskLevel)}`}
                    style={{ borderColor: `${primaryColor}20` }}
                  >
                    {op.riskLevel === "high" ? (
                      <AlertTriangle className={`w-3 h-3 ${getRiskColor(op.riskLevel)}`} />
                    ) : (
                      <Shield className={`w-3 h-3 ${getRiskColor(op.riskLevel)}`} />
                    )}
                    <span className={`text-xs font-medium uppercase ${getRiskColor(op.riskLevel)}`}>
                      {op.riskLevel} Risk
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-3 border-t" style={{ borderColor: `${primaryColor}20` }}>
                  <div>
                    <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-1">APY</div>
                    <div className="text-[var(--text-lg)] font-[var(--font-weight-bold)] text-[var(--regen-primary)]">{op.apy}</div>
                  </div>
                  <div>
                    <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-1">TVL</div>
                    <div className="text-[var(--text-sm)] font-[var(--font-weight-semibold)] text-[var(--text-primary)]">{op.tvl}</div>
                  </div>
                  <div className="flex items-center justify-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeposit(op.id)}
                      disabled={isLoading && selectedOpportunity === op.id}
                      className="px-4 py-2 rounded-[var(--radius-lg)] text-[var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] transition-all duration-[var(--duration-normal)] flex items-center gap-2"
                      style={{
                        background: primaryColor,
                        opacity: isLoading && selectedOpportunity === op.id ? 0.5 : 1,
                      }}
                    >
                      {isLoading && selectedOpportunity === op.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          Deposit
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 rounded-xl"
            style={{
              background: `${primaryColor}10`,
              border: `1px solid ${primaryColor}30`,
            }}
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
              <div>
                <h4 className="text-[var(--text-sm)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-1">Risk Disclosure</h4>
                <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                  DeFi protocols involve smart contract risk. APY rates are estimates and not guaranteed.
                  Always do your own research before depositing funds.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default YieldOpportunities;
