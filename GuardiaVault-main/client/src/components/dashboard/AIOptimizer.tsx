import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, TrendingUp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/utils/logger";

interface AIRecommendation {
  recommendedStrategy: Array<{
    protocol: string;
    asset: string;
    percentage: number;
    reasoning: string;
  }>;
  alternativeStrategies: Array<{
    protocol: string;
    asset: string;
    percentage: number;
    reasoning: string;
    risk: string;
  }>;
  marketAnalysis: string;
  riskAssessment: string;
  expectedAPY: number;
  confidence: number;
}

export default function AIOptimizer() {
  const [currentProtocol, setCurrentProtocol] = useState("lido");
  const [currentAsset, setCurrentAsset] = useState("ETH");
  const [currentBalance, setCurrentBalance] = useState<string>("10000");
  const [riskTolerance, setRiskTolerance] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [investmentHorizon, setInvestmentHorizon] = useState<"short" | "medium" | "long">("medium");
  const [goals, setGoals] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    try {
      const response = await fetch("/api/ai/status", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setAiAvailable(data.data?.available || false);
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "AIOptimizer_checkStatus",
      });
    }
  };

  const handleOptimize = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/ai/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentProtocol,
          currentAsset,
          currentBalance: currentBalance.replace(/,/g, ""),
          riskTolerance,
          investmentHorizon,
          goals,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Optimization failed");
      }

      const data = await response.json();
      setRecommendation(data.data);

      toast({
        title: "AI Recommendation Generated",
        description: `Confidence: ${data.data.confidence}% • Expected APY: ${data.data.expectedAPY.toFixed(2)}%`,
      });
    } catch (error: any) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "AIOptimizer_optimize",
      });
      toast({
        title: "Optimization failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">AI Optimizer</h3>
            <p className="text-sm text-slate-400">
              Intelligent yield strategy recommendations
            </p>
          </div>
        </div>
        {aiAvailable ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">AI Powered</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-medium text-yellow-400">Rule-Based</span>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Current Strategy
          </label>
          <select
            value={`${currentProtocol}-${currentAsset}`}
            onChange={(e) => {
              const [protocol, asset] = e.target.value.split("-");
              setCurrentProtocol(protocol);
              setCurrentAsset(asset);
            }}
            className="w-full bg-slate-900/50 border border-slate-700/50 text-white rounded-xl px-4 py-3 focus:border-blue-500/50 focus:outline-none"
          >
            <option value="lido-ETH">Lido Staking (ETH)</option>
            <option value="aave-USDC">Aave USDC</option>
            <option value="aave-ETH">Aave ETH</option>
          </select>
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
              onChange={(e) => {
                const num = e.target.value.replace(/[^0-9.]/g, "");
                if (num) {
                  setCurrentBalance(parseFloat(num).toLocaleString("en-US"));
                } else {
                  setCurrentBalance("");
                }
              }}
              className="w-full pl-8 bg-slate-900/50 border border-slate-700/50 text-white rounded-xl px-4 py-3 focus:border-blue-500/50 focus:outline-none"
              placeholder="10,000"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Risk Tolerance
            </label>
            <select
              value={riskTolerance}
              onChange={(e) =>
                setRiskTolerance(e.target.value as "conservative" | "moderate" | "aggressive")
              }
              className="w-full bg-slate-900/50 border border-slate-700/50 text-white rounded-xl px-4 py-3 focus:border-blue-500/50 focus:outline-none"
            >
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Investment Horizon
            </label>
            <select
              value={investmentHorizon}
              onChange={(e) =>
                setInvestmentHorizon(e.target.value as "short" | "medium" | "long")
              }
              className="w-full bg-slate-900/50 border border-slate-700/50 text-white rounded-xl px-4 py-3 focus:border-blue-500/50 focus:outline-none"
            >
              <option value="short">Short Term (&lt; 1 year)</option>
              <option value="medium">Medium Term (1-5 years)</option>
              <option value="long">Long Term (&gt; 5 years)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Optimize Button */}
      <Button
        size="lg"
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-6 rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] mb-6"
        onClick={handleOptimize}
        disabled={loading}
      >
        {loading ? (
          <>
            <Brain className="w-5 h-5 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Get AI Recommendation
          </>
        )}
      </Button>

      {/* Recommendation */}
      {recommendation && (
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h4 className="text-lg font-semibold text-white">AI Recommendation</h4>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Confidence</div>
              <div className="text-lg font-bold text-purple-400">
                {recommendation.confidence}%
              </div>
            </div>
          </div>

          {/* Recommended Strategy */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-300 mb-2">
              Recommended Allocation
            </div>
            {recommendation.recommendedStrategy.map((strategy, idx) => (
              <div
                key={idx}
                className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {strategy.protocol === "lido"
                        ? "Lido Staking"
                        : strategy.protocol === "aave"
                        ? `Aave ${strategy.asset}`
                        : `${strategy.protocol} ${strategy.asset}`}
                    </div>
                    <div className="text-xs text-slate-400">{strategy.asset}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-400">
                      {strategy.percentage}%
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatCurrency(
                        (parseFloat(currentBalance.replace(/,/g, "")) *
                          strategy.percentage) /
                          100
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-2 italic">
                  "{strategy.reasoning}"
                </div>
              </div>
            ))}
          </div>

          {/* Market Analysis */}
          <div className="pt-4 border-t border-purple-500/20 space-y-3">
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-1">
                Market Analysis
              </div>
              <p className="text-sm text-slate-400">{recommendation.marketAnalysis}</p>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-1">
                Risk Assessment
              </div>
              <p className="text-sm text-slate-400">{recommendation.riskAssessment}</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
              <span className="text-white font-semibold">Expected APY</span>
              <span className="text-2xl font-bold text-purple-400">
                {recommendation.expectedAPY.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Alternative Strategies */}
          {recommendation.alternativeStrategies.length > 0 && (
            <div className="pt-4 border-t border-purple-500/20">
              <div className="text-sm font-semibold text-slate-300 mb-3">
                Alternative Strategies
              </div>
              <div className="space-y-2">
                {recommendation.alternativeStrategies.map((alt, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/30 rounded-lg p-3 text-xs text-slate-400"
                  >
                    <span className="font-semibold text-white">
                      {alt.protocol} {alt.asset}
                    </span>
                    {" • "}
                    <span>{alt.percentage}%</span>
                    {" • "}
                    <span className="text-slate-500">Risk: {alt.risk}</span>
                    <div className="text-slate-500 mt-1 italic">{alt.reasoning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

