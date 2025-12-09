import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, ArrowRight, Calculator } from "lucide-react";
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";


registerPlugin(ScrollTrigger, "ScrollTrigger");

const strategies = [
  {
    name: "Lido Staking",
    apy: 5.2,
    asset: "ETH",
    type: "Liquid Staking",
    tvl: "$32B",
    description: "Earn on your ETH via Ethereum 2.0 staking",
  },
  {
    name: "Aave USDC",
    apy: 4.1,
    asset: "USDC",
    type: "DeFi Lending",
    tvl: "$8.5B",
    description: "Earn on stablecoins with minimal volatility",
  },
  {
    name: "Aave ETH",
    apy: 3.8,
    asset: "ETH",
    type: "DeFi Lending",
    tvl: "$2.1B",
    description: "Conservative ETH earning strategy",
  },
];

export default function YieldCalculator() {
  const [amount, setAmount] = useState<string>("10000");
  const [selectedStrategy, setSelectedStrategy] = useState(0);
  const [result, setResult] = useState<{
    yearly: number;
    monthly: number;
    daily: number;
    vsSavings: number;
  } | null>(null);
  const [, setLocation] = useLocation();
  const sectionRef = useRef<HTMLElement>(null);
  const calculatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        calculatorRef.current,
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const numAmount = parseFloat(amount.replace(/,/g, "")) || 0;
    if (numAmount <= 0) {
      setResult(null);
      return;
    }

    const strategy = strategies[selectedStrategy];
    const yearly = (numAmount * strategy.apy) / 100;
    const monthly = yearly / 12;
    const daily = yearly / 365;
    const savingsAPY = 0.5; // Traditional bank savings
    const vsSavings = yearly - (numAmount * savingsAPY) / 100;

    setResult({ yearly, monthly, daily, vsSavings });
  }, [amount, selectedStrategy]);

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
    const formatted = parseFloat(num).toLocaleString("en-US");
    return formatted;
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-12 overflow-hidden"
    >

      <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">
                Yield Calculator
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              See How Much You Can Earn
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Compare your potential earnings vs traditional savings accounts
            </p>
          </div>

          {/* Calculator */}
          <div ref={calculatorRef} className="grid md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Enter Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    $
                  </span>
                  <Input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(formatNumber(e.target.value))}
                    className="pl-8 bg-slate-900/50 border-slate-700/50 text-white text-2xl font-semibold h-16 rounded-xl focus:border-blue-500/50"
                    placeholder="10,000"
                  />
                </div>
              </div>

              {/* Strategy Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Choose Strategy
                </label>
                <div className="space-y-3">
                  {strategies.map((strategy, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedStrategy(index)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedStrategy === index
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-slate-700/50 bg-slate-900/50 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              selectedStrategy === index
                                ? "bg-blue-500 ring-4 ring-blue-500/20"
                                : "bg-slate-600"
                            }`}
                          />
                          <div>
                            <div className="font-semibold text-white">
                              {strategy.name}
                            </div>
                            <div className="text-xs text-slate-400">
                              {strategy.type}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-emerald-400">
                            {strategy.apy}% APY
                          </div>
                          <div className="text-xs text-slate-400">
                            {strategy.tvl} TVL
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {strategy.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {result ? (
                <>
                  {/* Main Result Card */}
                  <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-8 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                      <h3 className="text-xl font-semibold text-white">
                        Your Potential Earnings
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                        <div>
                          <div className="text-sm text-slate-400">Per Year</div>
                          <div className="text-3xl font-bold text-emerald-400">
                            {formatCurrency(result.yearly)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-400">Per Month</div>
                          <div className="text-2xl font-bold text-white">
                            {formatCurrency(result.monthly)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-900/50 rounded-xl">
                          <div className="text-xs text-slate-400 mb-1">
                            Per Day
                          </div>
                          <div className="text-xl font-semibold text-white">
                            {formatCurrency(result.daily)}
                          </div>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-xl">
                          <div className="text-xs text-slate-400 mb-1">
                            vs Savings
                          </div>
                          <div className="text-xl font-semibold text-emerald-400">
                            +{formatCurrency(result.vsSavings)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Card */}
                  <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
                    <div className="text-sm text-slate-400 mb-4">
                      Comparison to Traditional Savings (0.5% APY)
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">GuardiaVault</span>
                        <span className="text-emerald-400 font-semibold">
                          {formatCurrency(result.yearly)}/year
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Bank Savings</span>
                        <span className="text-slate-500">
                          {formatCurrency(
                            (parseFloat(amount.replace(/,/g, "")) * 0.5) / 100
                          )}
                          /year
                        </span>
                      </div>
                      <div className="pt-3 border-t border-slate-700/50">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300 font-medium">
                            Extra Earnings
                          </span>
                          <span className="text-emerald-400 font-bold text-lg">
                            {formatCurrency(result.vsSavings)}/year
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold py-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                    onClick={() => setLocation("/signup")}
                  >
                    Start Earning Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </>
              ) : (
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-12 text-center">
                  <div className="text-slate-400 mb-4">
                    Enter an amount to see your potential earnings
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

