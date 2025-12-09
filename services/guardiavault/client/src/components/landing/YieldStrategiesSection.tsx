import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  Check,
  Coins,
} from "lucide-react";
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";


registerPlugin(ScrollTrigger, "ScrollTrigger");

const strategies = [
  {
    name: "Lido Staking",
    apy: 5.2,
    asset: "ETH",
    type: "Liquid Staking",
    tvl: "$32B",
    riskLevel: "Low",
    description: "Earn on your ETH via Ethereum 2.0 staking",
    bestFor: "ETH holders wanting maximum yield",
    features: [
      "Liquid stETH tokens",
      "No lock-up period",
      "Ethereum 2.0 rewards",
    ],
    gradient: "from-blue-500 to-cyan-500",
    icon: Coins,
  },
  {
    name: "Aave USDC",
    apy: 4.1,
    asset: "USDC",
    type: "DeFi Lending",
    tvl: "$8.5B",
    riskLevel: "Low",
    description: "Earn on stablecoins with minimal volatility",
    bestFor: "Stablecoin holders seeking steady returns",
    features: [
      "Overcollateralized lending",
      "Stable asset exposure",
      "High liquidity",
    ],
    gradient: "from-purple-500 to-pink-500",
    icon: Shield,
  },
  {
    name: "Aave ETH",
    apy: 3.8,
    asset: "ETH",
    type: "DeFi Lending",
    tvl: "$2.1B",
    riskLevel: "Low",
    description: "Conservative ETH earning strategy",
    bestFor: "Conservative ETH investors",
    features: [
      "Lower risk than staking",
      "Flexible withdrawal",
      "ETH-backed lending",
    ],
    gradient: "from-emerald-500 to-teal-500",
    icon: TrendingUp,
  },
];

export default function YieldStrategiesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 60,
            scale: 0.9,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            delay: index * 0.15,
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-12 overflow-hidden"
    >

      <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">
                3 Yield Strategies
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Choose Your Perfect Earning Strategy
            </h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              All strategies include free inheritance protection. Pick the one that
              matches your risk tolerance and asset preferences.
            </p>
          </div>

          {/* Strategy Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {strategies.map((strategy, index) => {
              const Icon = strategy.icon;
              return (
                <div
                  key={index}
                  ref={(el) => {
                    if (el) cardsRef.current[index] = el;
                  }}
                  className="group relative"
                >
                  {/* Gradient Border Glow */}
                  <div
                    className={`absolute -inset-[1px] bg-gradient-to-r ${strategy.gradient} rounded-[32px] opacity-10 blur-md group-hover:opacity-20 transition-opacity duration-500`}
                  />

                  {/* Card */}
                  <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-white/10 p-8 h-full flex flex-col">
                    {/* Header */}
                    <div className="mb-6">
                      <div
                        className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${strategy.gradient} mb-4`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl font-bold text-white">
                          {strategy.name}
                        </h3>
                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-lg font-bold text-emerald-400">
                            {strategy.apy}%
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm mb-3">
                        {strategy.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{strategy.type}</span>
                        <span>•</span>
                        <span>{strategy.riskLevel} Risk</span>
                        <span>•</span>
                        <span>{strategy.tvl} TVL</span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex-grow space-y-3 mb-6">
                      {strategy.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Best For */}
                    <div className="pt-6 border-t border-white/10">
                      <div className="text-xs text-slate-400 mb-2">Best For:</div>
                      <div className="text-sm text-slate-300 font-medium">
                        {strategy.bestFor}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparison Table */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-8 mb-12 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white mb-6">
              Strategy Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                      Strategy
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-300">
                      APY
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-300">
                      Asset
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-300">
                      Type
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-300">
                      Risk
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                      Best For
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {strategies.map((strategy, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">
                          {strategy.name}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-lg font-bold text-emerald-400">
                          {strategy.apy}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-slate-300">
                        {strategy.asset}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-300 text-sm">
                        {strategy.type}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                          {strategy.riskLevel}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400 text-sm">
                        {strategy.bestFor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-slate-400 mb-6">
              All strategies include free inheritance protection worth $500
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-8 py-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
              onClick={() => setLocation("/signup")}
            >
              Start Earning Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

