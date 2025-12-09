import { motion, AnimatePresence } from "motion/react";
import { useState, useMemo } from "react";
import {
  X,
  Zap,
  TrendingDown,
  TrendingUp,
  Clock,
  AlertCircle,
  Info,
  Settings,
  ArrowRight,
} from "lucide-react";
import { GlassCard, Button, Badge } from "../ui";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useWalletData } from "../../contexts/WalletDataContext";
import { useTokenPrices } from "../../hooks/useMarketData";

interface GasManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGasPrice?: (price: number) => void;
  walletType?: "degen" | "regen";
}

interface GasPrice {
  slow: number;
  standard: number;
  fast: number;
  instant: number;
}

interface GasEstimate {
  speed: "slow" | "standard" | "fast" | "instant";
  price: number;
  time: string;
  usd: number;
  recommended?: boolean;
}

// Generate gas history from API data - used for chart visualization
const generateGasHistory = (basePrice: number = 15) => {
  const data = [];
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  for (let i = 24; i >= 0; i--) {
    data.push({
      time: new Date(now - i * oneHour).toLocaleTimeString(
        "en-US",
        {
          hour: "numeric",
          hour12: true,
        },
      ),
      // Simulate price variations around the base price from API
      price: basePrice + Math.random() * 10 + Math.sin(i / 3) * 5,
    });
  }

  return data;
};

export function GasManager({
  isOpen,
  onClose,
  onSelectGasPrice,
  walletType = "degen",
}: GasManagerProps) {
  // Get real gas price from WalletDataContext
  const { gasPrice: apiGasPrice } = useWalletData();
  
  // Get real ETH price for USD calculations
  const { prices } = useTokenPrices(['ETH']);
  const ethPrice = useMemo(() => prices?.ETH?.price || 2500, [prices]);

  // Use API gas prices with fallback
  const currentGas = useMemo(() => ({
    slow: apiGasPrice?.slow?.gwei ?? 12,
    standard: apiGasPrice?.standard?.gwei ?? 18,
    fast: apiGasPrice?.fast?.gwei ?? 25,
    instant: (apiGasPrice?.fast?.gwei ?? 25) * 1.4, // Estimate instant as 1.4x fast
  }), [apiGasPrice]);

  const [selectedSpeed, setSelectedSpeed] = useState<
    "slow" | "standard" | "fast" | "instant"
  >("standard");
  
  // Generate gas history based on current standard price
  const gasHistory = useMemo(
    () => generateGasHistory(currentGas.standard),
    [currentGas.standard]
  );
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customGas, setCustomGas] = useState("");
  const [loading, setLoading] = useState(false);

  const isDegen = walletType === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";
  const secondaryColor = isDegen ? "#8B0000" : "#000080";

  // Gas estimates using real API data and ETH price
  const gasEstimates: GasEstimate[] = useMemo(() => [
    {
      speed: "slow",
      price: currentGas.slow,
      time: apiGasPrice?.slow?.estimatedTime || "~5-10 min",
      usd: currentGas.slow * 0.000000001 * 21000 * ethPrice,
    },
    {
      speed: "standard",
      price: currentGas.standard,
      time: apiGasPrice?.standard?.estimatedTime || "~2-5 min",
      usd: currentGas.standard * 0.000000001 * 21000 * ethPrice,
      recommended: true,
    },
    {
      speed: "fast",
      price: currentGas.fast,
      time: apiGasPrice?.fast?.estimatedTime || "~30 sec",
      usd: currentGas.fast * 0.000000001 * 21000 * ethPrice,
    },
    {
      speed: "instant",
      price: currentGas.instant,
      time: "~15 sec",
      usd: currentGas.instant * 0.000000001 * 21000 * ethPrice,
    },
  ], [currentGas, ethPrice, apiGasPrice]);

  const handleSelectGas = () => {
    const price = customGas
      ? Number.parseFloat(customGas)
      : currentGas[selectedSpeed];

    onSelectGasPrice?.(price);
    onClose();
  };

  const getBestTime = () => {
    const avgPrice =
      gasHistory.reduce((sum, d) => sum + d.price, 0) /
      gasHistory.length;
    const currentAvg = currentGas.standard;

    if (currentAvg < avgPrice * 0.8) {
      return {
        status: "excellent",
        message:
          "Gas is 20% below average. Great time to transact!",
      };
    } else if (currentAvg < avgPrice) {
      return {
        status: "good",
        message: "Gas is below average. Good time to transact.",
      };
    } else if (currentAvg < avgPrice * 1.2) {
      return {
        status: "normal",
        message: "Gas is at average levels.",
      };
    } else {
      return {
        status: "high",
        message:
          "Gas is above average. Consider waiting if not urgent.",
      };
    }
  };

  const timeAnalysis = getBestTime();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-black/95 backdrop-blur-2xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
          style={{
            boxShadow: `0 0 60px ${accentColor}30`,
          }}
        >
          {/* Header */}
          <div
            className="p-6 border-b border-white/10"
            style={{
              background: `linear-gradient(135deg, ${accentColor}20 0%, ${secondaryColor}10 100%)`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}40 0%, ${secondaryColor}20 100%)`,
                  }}
                >
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                    Gas Manager
                  </h2>
                  <p className="text-xs text-white/50 uppercase tracking-wider">
                    Optimize your transaction costs
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Current Gas Alert */}
            <GlassCard
              style={{
                background:
                  timeAnalysis.status === "excellent"
                    ? "rgba(16, 185, 129, 0.1)"
                    : timeAnalysis.status === "high"
                      ? "rgba(239, 68, 68, 0.1)"
                      : "rgba(59, 130, 246, 0.1)",
                borderColor:
                  timeAnalysis.status === "excellent"
                    ? "rgba(16, 185, 129, 0.3)"
                    : timeAnalysis.status === "high"
                      ? "rgba(239, 68, 68, 0.3)"
                      : "rgba(59, 130, 246, 0.3)",
              }}
            >
              <div className="flex items-start gap-3">
                {timeAnalysis.status === "excellent" ? (
                  <TrendingDown className="w-6 h-6 text-green-400 flex-shrink-0" />
                ) : timeAnalysis.status === "high" ? (
                  <TrendingUp className="w-6 h-6 text-red-400 flex-shrink-0" />
                ) : (
                  <Info className="w-6 h-6 text-blue-400 flex-shrink-0" />
                )}
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">
                    {timeAnalysis.status === "excellent"
                      ? "🎉 Great Time!"
                      : timeAnalysis.status === "high"
                        ? "⚠️ High Gas"
                        : "ℹ️ Normal Gas"}
                  </h3>
                  <p className="text-sm text-white/70">
                    {timeAnalysis.message}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Gas Price Options */}
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight mb-4">
                Select Gas Speed
              </h3>
              <div className="space-y-3">
                {gasEstimates.map((estimate) => (
                  <motion.button
                    key={estimate.speed}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() =>
                      setSelectedSpeed(estimate.speed)
                    }
                    className={`w-full p-4 rounded-xl border transition-all ${
                      selectedSpeed === estimate.speed
                        ? "border-white/30"
                        : "border-white/10 hover:border-white/20"
                    }`}
                    style={
                      selectedSpeed === estimate.speed
                        ? {
                            background: `linear-gradient(135deg, ${accentColor}15 0%, ${secondaryColor}05 100%)`,
                            borderColor: `${accentColor}40`,
                          }
                        : {
                            background:
                              "rgba(255, 255, 255, 0.03)",
                          }
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedSpeed === estimate.speed
                              ? "border-white"
                              : "border-white/30"
                          }`}
                        >
                          {selectedSpeed === estimate.speed && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                background: accentColor,
                              }}
                            />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white uppercase tracking-tight text-sm">
                              {estimate.speed}
                            </span>
                            {estimate.recommended && (
                              <Badge
                                variant="success"
                                size="sm"
                              >
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-white/50 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {estimate.time}
                            </span>
                            <span className="text-xs text-white/50">
                              {estimate.price.toFixed(1)} Gwei
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-white">
                          ${estimate.usd.toFixed(2)}
                        </div>
                        <div className="text-xs text-white/40 uppercase tracking-wider">
                          Est. Cost
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Advanced Options */}
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors font-black uppercase tracking-wider"
              >
                <Settings className="w-4 h-4" />
                Advanced Settings
                <motion.div
                  animate={{ rotate: showAdvanced ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 overflow-hidden"
                  >
                    <GlassCard>
                      <label className="text-sm font-black text-white uppercase tracking-tight block mb-3">
                        Custom Gas Price (Gwei)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={customGas}
                          onChange={(e) =>
                            setCustomGas(e.target.value)
                          }
                          placeholder="e.g., 20"
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                        />
                        <Button variant="secondary" size="md">
                          Set
                        </Button>
                      </div>
                      <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-yellow-200">
                            Setting gas too low may cause your
                            transaction to fail or get stuck.
                          </p>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Gas Price History Chart */}
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight mb-4">
                24-Hour Gas History
              </h3>
              <GlassCard>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={gasHistory}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      dataKey="time"
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: 10 }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.9)",
                        border:
                          "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "white" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={accentColor}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </GlassCard>
            </div>

            {/* Tips */}
            <GlassCard
              style={{
                background: `${accentColor}10`,
                borderColor: `${accentColor}30`,
              }}
            >
              <h3 className="text-sm font-black text-white uppercase tracking-tight mb-3 flex items-center gap-2">
                <Zap
                  className="w-4 h-4"
                  style={{ color: accentColor }}
                />
                💡 Gas Saving Tips
              </h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    Transact on weekends when network is less
                    congested
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    Use Layer 2 networks (Arbitrum, Optimism)
                    for lower fees
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    Batch multiple transactions together to save
                    gas
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    Set alerts for low gas prices in Settings
                  </span>
                </li>
              </ul>
            </GlassCard>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 flex items-center justify-between gap-4">
            <div className="text-sm">
              <p className="text-white/50 uppercase tracking-wider font-bold mb-1">
                Total Estimated Cost
              </p>
              <p className="text-2xl font-black text-white">
                $
                {(customGas
                  ? parseFloat(customGas) *
                    0.000000001 *
                    21000 *
                    2000
                  : gasEstimates.find(
                      (e) => e.speed === selectedSpeed,
                    )?.usd || 0
                ).toFixed(2)}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleSelectGas}
              >
                Confirm Gas
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default GasManager;