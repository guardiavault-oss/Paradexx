import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  Info,
  Fuel,
  Zap,
  Shield,
  Check,
} from "lucide-react";
import { Badge } from "../ui";

// Fee constants per monetization model
export const FEE_RATES = {
  SWAP: 0.5, // 0.5% on in-app swaps (free tier) | 0% for Premium Pass
  BRIDGE: 0.1, // 0.1% on cross-chain bridges
  WRAP: 0, // ETH ↔ WETH wrapping is free
  FIAT_ONRAMP: 0, // No user-facing fee on fiat on-ramps
  SNIPER_FILL: 1.0, // 1% of trade value on sniper bot fills
};

interface FeeItem {
  label: string;
  amount: string;
  amountUSD: string;
  type: "gas" | "protocol" | "service" | "network";
  tooltip?: string;
}

interface FeeBreakdownProps {
  type: "swap" | "bridge" | "wrap" | "send";
  inputAmount: string;
  inputToken: string;
  inputTokenUSD: number;
  outputAmount: string;
  outputToken: string;
  outputTokenUSD: number;
  networkFee: string;
  networkFeeUSD: string;
  protocolFee?: string;
  protocolFeeUSD?: string;
  protocolName?: string;
  gasSpeed?: "slow" | "normal" | "fast";
  estimatedTime?: string;
  className?: string;
  defaultExpanded?: boolean;
  walletType?: "degen" | "regen";
}

export function FeeBreakdown({
  type,
  inputAmount,
  inputToken,
  inputTokenUSD,
  outputAmount,
  outputToken,
  outputTokenUSD,
  networkFee,
  networkFeeUSD,
  protocolFee = "0",
  protocolFeeUSD = "0.00",
  protocolName = "DEX",
  gasSpeed = "normal",
  estimatedTime = "~2 min",
  className = "",
  defaultExpanded = false,
  walletType = "degen",
}: FeeBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const isDegen = walletType === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";
  const secondaryColor = isDegen ? "#8B0000" : "#000080";

  // Calculate service fee based on type
  const serviceFeePercent =
    type === "bridge"
      ? FEE_RATES.BRIDGE
      : type === "swap"
        ? FEE_RATES.SWAP
        : 0;

  const inputAmountNum = parseFloat(inputAmount) || 0;
  const serviceFeeAmount =
    inputAmountNum * (serviceFeePercent / 100);
  const serviceFeeUSD = (
    serviceFeeAmount * inputTokenUSD
  ).toFixed(2);

  // Calculate total fees in USD
  const totalFeesUSD = (
    parseFloat(networkFeeUSD) +
    parseFloat(protocolFeeUSD) +
    parseFloat(serviceFeeUSD)
  ).toFixed(2);

  // Build fee items for breakdown
  const feeItems: FeeItem[] = [
    {
      label: "Network Gas",
      amount: `${networkFee} ETH`,
      amountUSD: networkFeeUSD,
      type: "gas",
      tooltip:
        "Paid to network validators to process your transaction",
    },
  ];

  if (parseFloat(protocolFee) > 0) {
    feeItems.push({
      label: `${protocolName} Fee`,
      amount: protocolFee,
      amountUSD: protocolFeeUSD,
      type: "protocol",
      tooltip: `Fee charged by ${protocolName} for routing your ${type}`,
    });
  }

  if (serviceFeePercent > 0) {
    feeItems.push({
      label: "Service Fee",
      amount: `${serviceFeeAmount.toFixed(6)} ${inputToken}`,
      amountUSD: serviceFeeUSD,
      type: "service",
      tooltip: `Paradex ${serviceFeePercent}% fee for secure ${type} execution`,
    });
  }

  // Output value in USD
  const outputValueUSD = (
    parseFloat(outputAmount) * outputTokenUSD
  ).toFixed(2);

  return (
    <div
      className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden ${className}`}
    >
      {/* Primary Display - "You Receive" */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/50 uppercase tracking-wider font-bold">
            You receive
          </span>
          {type !== "wrap" && (
            <Badge variant="success" size="sm" dot>
              Best rate
            </Badge>
          )}
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-black text-white">
            {outputAmount}
          </span>
          <span className="text-xl text-white/50 uppercase tracking-tight">
            {outputToken}
          </span>
        </div>
        <span className="text-sm text-white/40 mt-1 block">
          ≈ ${outputValueUSD}
        </span>
      </div>

      {/* Collapsible Fee Breakdown */}
      <motion.button
        whileHover={{
          backgroundColor: "rgba(255,255,255,0.05)",
        }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between transition-all"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${accentColor}20 0%, ${secondaryColor}10 100%)`,
            }}
          >
            <Fuel
              className="w-5 h-5"
              style={{ color: accentColor }}
            />
          </div>
          <div className="text-left">
            <span className="text-sm text-white/50 uppercase tracking-wider font-bold block">
              Total fees
            </span>
            <span className="text-lg font-black text-white">
              ${totalFeesUSD}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 uppercase tracking-wider font-bold">
            {estimatedTime}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-white/40" />
          </motion.div>
        </div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-4">
              {/* Fee Items */}
              {feeItems.map((item, index) => (
                <FeeRow
                  key={index}
                  item={item}
                  accentColor={accentColor}
                />
              ))}

              {/* Divider */}
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-white uppercase tracking-wider">
                    Total Fees
                  </span>
                  <span className="text-lg font-black text-white">
                    ${totalFeesUSD}
                  </span>
                </div>
              </div>

              {/* Gas Speed Indicator */}
              <GasSpeedIndicator
                speed={gasSpeed}
                time={estimatedTime}
                accentColor={accentColor}
              />

              {/* Free wrapping notice */}
              {type === "wrap" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
                >
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-400 font-bold">
                    ETH ↔ WETH wrapping is free (only network
                    gas)
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeeRow({
  item,
  accentColor,
}: {
  item: FeeItem;
  accentColor: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getIcon = () => {
    switch (item.type) {
      case "gas":
        return <Fuel className="w-5 h-5 text-orange-400" />;
      case "protocol":
        return <Zap className="w-5 h-5 text-purple-400" />;
      case "service":
        return (
          <Shield
            className="w-5 h-5"
            style={{ color: accentColor }}
          />
        );
      default:
        return <Info className="w-5 h-5 text-white/50" />;
    }
  };

  return (
    <div className="flex items-center justify-between relative group">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.05)",
          }}
        >
          {getIcon()}
        </div>
        <div>
          <span className="text-sm text-white font-bold block">
            {item.label}
          </span>
          <span className="text-xs text-white/40 uppercase tracking-wider">
            {item.amount}
          </span>
        </div>
        {item.tooltip && (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="p-1"
            >
              <Info className="w-4 h-4 text-white/30" />
            </motion.button>

            {/* Tooltip */}
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute left-0 top-8 z-10 p-3 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl text-xs text-white/80 max-w-[250px] shadow-2xl"
                >
                  {item.tooltip}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      <div className="text-right">
        <span className="text-sm font-black text-white block">
          ${item.amountUSD}
        </span>
      </div>
    </div>
  );
}

function GasSpeedIndicator({
  speed,
  time,
  accentColor,
}: {
  speed: string;
  time: string;
  accentColor: string;
}) {
  const speeds = [
    { id: "slow", label: "Slow", active: speed === "slow" },
    {
      id: "normal",
      label: "Normal",
      active: speed === "normal",
    },
    { id: "fast", label: "Fast", active: speed === "fast" },
  ];

  return (
    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
      <span className="text-xs text-white/50 uppercase tracking-wider font-bold">
        Speed:
      </span>
      <div className="flex gap-2">
        {speeds.map((s) => (
          <span
            key={s.id}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              s.active
                ? "text-white"
                : "bg-white/5 text-white/40"
            }`}
            style={
              s.active
                ? {
                    background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}80 100%)`,
                    boxShadow: `0 0 20px ${accentColor}40`,
                  }
                : {}
            }
          >
            {s.label}
          </span>
        ))}
      </div>
      <span className="text-xs text-white/50 ml-auto uppercase tracking-wider font-bold">
        {time}
      </span>
    </div>
  );
}

// Compact inline version for use in forms
export function InlineFeeDisplay({
  type,
  amount,
  tokenPrice,
}: {
  type: "swap" | "bridge";
  amount: string;
  tokenPrice: number;
}) {
  const feePercent =
    type === "bridge" ? FEE_RATES.BRIDGE : FEE_RATES.SWAP;
  const amountNum = parseFloat(amount) || 0;
  const feeUSD = (
    amountNum *
    tokenPrice *
    (feePercent / 100)
  ).toFixed(2);

  return (
    <div className="flex items-center gap-2 text-xs text-white/50">
      <Shield className="w-3 h-3" />
      <span className="uppercase tracking-wider font-bold">
        {feePercent}% fee
      </span>
      <span className="text-white/40">(~${feeUSD})</span>
    </div>
  );
}

export default FeeBreakdown;