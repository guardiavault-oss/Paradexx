import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight, Zap, PieChart, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/utils/logger";

interface ProtocolAPY {
  protocol: string;
  asset: string;
  apy: number;
  apr?: number;
  timestamp: string;
  source: "api" | "contract" | "fallback";
}

interface OptimizerResult {
  currentStrategy: {
    protocol: string;
    asset: string;
    apy: number;
    balance: string;
  };
  recommendedSplit: {
    protocol1: { protocol: string; asset: string; percentage: number; apy: number };
    protocol2: { protocol: string; asset: string; percentage: number; apy: number };
  };
  newWeightedAPY: number;
  deltaAPY: number;
  deltaYearly: string;
  estimatedGasCost: string;
  transactionData?: {
    to: string;
    data: string;
    value?: string;
  };
}

export default function StrategyOptimizer() {
  const [strategies, setStrategies] = useState<ProtocolAPY[]>([]);
  const [currentProtocol, setCurrentProtocol] = useState("lido");
  const [currentAsset, setCurrentAsset] = useState("ETH");
  const [currentBalance, setCurrentBalance] = useState<string>("10000");
  const [optimizationResult, setOptimizationResult] = useState<OptimizerResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [loadingStrategies, setLoadingStrategies] = useState(true);
  const { toast } = useToast();

  // Load real-time APY data
  useEffect(() => {
    loadRealtimeAPY();
    // Refresh every 5 minutes
    const interval = setInterval(loadRealtimeAPY, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadRealtimeAPY = async () => {
    try {
      setLoadingStrategies(true);
      const response = await fetch("/api/yield/strategies/realtime");
      if (!response.ok) throw new Error("Failed to fetch APY data");
      const data = await response.json();
      setStrategies(data.data || []);
      
      // Set default if available
      if (data.data && data.data.length > 0 && !currentProtocol) {
        const first = data.data[0];
        setCurrentProtocol(first.protocol);
        setCurrentAsset(first.asset);
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "StrategyOptimizer_loadStrategies",
      });
      toast({
        title: "Failed to load APY data",
        description: "Using cached values. Please refresh.",
        variant: "destructive",
      });
    } finally {
      setLoadingStrategies(false);
    }
  };

  const currentStrategyData = strategies.find(
    (s) => s.protocol === currentProtocol && s.asset === currentAsset
  );

  const handleOptimize = async () => {
    if (!currentStrategyData) {
      toast({
        title: "No strategy selected",
        description: "Please select a current strategy",
        variant: "destructive",
      });
      return;
    }

    setIsOptimizing(true);

    try {
      const response = await fetch("/api/yield/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentProtocol,
          currentAsset,
          currentBalance: currentBalance.replace(/,/g, ""),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Optimization failed");
      }

      const data = await response.json();
      setOptimizationResult(data.data);

      toast({
        title: "Optimization complete",
        description: `You could earn ${data.data.deltaYearly} more per year`,
      });
    } catch (error: any) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "StrategyOptimizer_optimize",
      });
      toast({
        title: "Optimization failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: string) => {
    const num = value.replace(/[^0-9.]/g, "");
    if (!num) return "";
    return parseFloat(num).toLocaleString("en-US");
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
          <PieChart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Strategy Optimizer</h3>
          <p className="text-sm text-slate-400">
            Maximize your yield with portfolio diversification
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Current Protocol
          </label>
          {loadingStrategies ? (
            <div className="flex items-center gap-2 text-slate-400 py-3">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading real-time APY...
            </div>
          ) : (
            <select
              value={`${currentProtocol}-${currentAsset}`}
              onChange={(e) => {
                const [protocol, asset] = e.target.value.split("-");
                setCurrentProtocol(protocol);
                setCurrentAsset(asset);
              }}
              className="w-full bg-slate-900/50 border border-slate-700/50 text-white rounded-xl px-4 py-3 focus:border-blue-500/50 focus:outline-none"
            >
              {strategies.map((strategy) => (
                <option
                  key={`${strategy.protocol}-${strategy.asset}`}
                  value={`${strategy.protocol}-${strategy.asset}`}
                >
                  {strategy.protocol === "lido"
                    ? "Lido Staking"
                    : strategy.protocol === "aave"
                    ? `Aave ${strategy.asset}`
                    : `${strategy.protocol} ${strategy.asset}`}{" "}
                  ({strategy.apy.toFixed(2)}% APY){" "}
                  {strategy.source === "api" && "✓ Live"}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Current Balance
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              $
            </span>
            <input
              type="text"
              value={currentBalance}
              onChange={(e) => setCurrentBalance(formatNumber(e.target.value))}
              className="w-full pl-8 bg-slate-900/50 border border-slate-700/50 text-white rounded-xl px-4 py-3 focus:border-blue-500/50 focus:outline-none"
              placeholder="10,000"
            />
          </div>
        </div>
      </div>

      {/* Current Stats */}
      {currentStrategyData && (
        <div className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-400">Current Strategy</div>
            {currentStrategyData.source === "api" && (
              <div className="text-xs text-emerald-400 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Data
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-white">
                {currentStrategyData.protocol === "lido"
                  ? "Lido Staking"
                  : currentStrategyData.protocol === "aave"
                  ? `Aave ${currentStrategyData.asset}`
                  : `${currentStrategyData.protocol} ${currentStrategyData.asset}`}
              </div>
              <div className="text-sm text-slate-400">
                {formatCurrency(
                  (parseFloat(currentBalance.replace(/,/g, "")) *
                    currentStrategyData.apy) /
                    100
                )}{" "}
                /year
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-400">
                {currentStrategyData.apy.toFixed(2)}%
              </div>
              <div className="text-xs text-slate-400">APY</div>
            </div>
          </div>
        </div>
      )}

      {/* Optimize Button */}
      <Button
        size="lg"
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] mb-6"
        onClick={handleOptimize}
        disabled={isOptimizing}
      >
        {isOptimizing ? (
          <>
            <Zap className="w-5 h-5 mr-2 animate-spin" />
            Optimizing...
          </>
        ) : (
          <>
            Auto-Optimize My Portfolio
            <ArrowRight className="ml-2 w-5 h-5" />
          </>
        )}
      </Button>

      {/* Results */}
      {optimizationResult && (
        <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h4 className="text-lg font-semibold text-white">
              Recommended Portfolio Split
            </h4>
          </div>

          <div className="space-y-3">
            {[
              optimizationResult.recommendedSplit.protocol1,
              optimizationResult.recommendedSplit.protocol2,
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
              >
                <div>
                  <div className="text-sm font-semibold text-white">
                    {item.protocol === "lido"
                      ? "Lido Staking"
                      : item.protocol === "aave"
                      ? `Aave ${item.asset}`
                      : `${item.protocol} ${item.asset}`}
                  </div>
                  <div className="text-xs text-slate-400">
                    {item.asset} • {item.apy.toFixed(2)}% APY
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-400">
                    {item.percentage}%
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatCurrency(
                      (parseFloat(currentBalance.replace(/,/g, "")) *
                        item.percentage) /
                        100
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">New Weighted APY</span>
              <span className="text-xl font-bold text-emerald-400">
                {optimizationResult.newWeightedAPY.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">APY Increase</span>
              <span className="text-lg font-semibold text-emerald-400">
                +{optimizationResult.deltaAPY.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
              <span className="text-white font-semibold">Extra Earnings/Year</span>
              <span className="text-2xl font-bold text-emerald-400">
                +${optimizationResult.deltaYearly}
              </span>
            </div>
            {optimizationResult.transactionData && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="text-xs text-slate-400 mb-2">
                  Transaction ready for signing
                </div>
                <div className="text-xs text-slate-500">
                  Gas estimate: ~{optimizationResult.estimatedGasCost} ETH
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

