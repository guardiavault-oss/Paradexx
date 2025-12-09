/**
 * Yield Comparison Chart
 * Compares GuardiaVault yield rates vs competitors (Lido, Aave, Yearn, etc.)
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shield, CheckCircle2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface YieldProvider {
  name: string;
  apy: number;
  description: string;
  features: string[];
  hasInheritance?: boolean;
  color: string;
  gradient: string;
}

const providers: YieldProvider[] = [
  {
    name: "Lido",
    apy: 4.2,
    description: "Liquid staking for Ethereum",
    features: ["4-5% APY", "Liquid tokens", "Single protocol"],
    color: "blue",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Aave",
    apy: 3.8,
    description: "Lending protocol for earning interest",
    features: ["3-4% APY", "Variable rates", "Single protocol"],
    color: "purple",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Yearn Finance",
    apy: 5.1,
    description: "Yield aggregator for DeFi",
    features: ["5-6% APY", "Auto-compounding", "Multi-strategy"],
    color: "yellow",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    name: "Compound",
    apy: 3.5,
    description: "Money market protocol",
    features: ["3-4% APY", "Variable rates", "Governance tokens"],
    color: "indigo",
    gradient: "from-indigo-500 to-purple-500",
  },
];

export default function YieldComparisonChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<"apy" | "features">("apy");
  const isMobile = useIsMobile();
  const maxApy = Math.max(...providers.map(p => p.apy));

  return (
    <Card className="glass-card border-emerald-500/20 bg-gradient-to-br from-emerald-950/10 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod("apy")}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                selectedPeriod === "apy"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              APY
            </button>
            <button
              onClick={() => setSelectedPeriod("features")}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                selectedPeriod === "features"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              Features
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {selectedPeriod === "apy" ? (
          <div className="space-y-4">
            {providers.map((provider, index) => {
              const widthPercent = (provider.apy / maxApy) * 100;
              const isGuardiaVault = provider.name === "GuardiaVault";
              
              return (
                <motion.div
                  key={provider.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border ${
                    isGuardiaVault
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${provider.gradient} flex items-center justify-center`}
                      >
                        <span className="text-white font-bold text-lg">
                          {provider.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white">{provider.name}</h4>
                          {isGuardiaVault && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                              Best Value
                            </Badge>
                          )}
                          {provider.hasInheritance && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Inheritance
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{provider.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${isGuardiaVault ? "text-emerald-400" : "text-white"}`}>
                        {provider.apy.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-400">APY</div>
                    </div>
                  </div>
                  
                  {/* APY Bar */}
                  <div className="relative h-2 bg-slate-800/50 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${provider.gradient} ${
                        isGuardiaVault ? "shadow-lg shadow-emerald-500/50" : ""
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercent}%` }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider, index) => {
              const isGuardiaVault = provider.name === "GuardiaVault";
              
              return (
                <motion.div
                  key={provider.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border ${
                    isGuardiaVault
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${provider.gradient} flex items-center justify-center`}
                    >
                      <span className="text-white font-bold">
                        {provider.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{provider.name}</h4>
                      {isGuardiaVault && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs mt-1">
                          Best Value
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <ul className="space-y-2">
                    {provider.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        {isGuardiaVault ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className={isGuardiaVault ? "text-white" : "text-slate-400"}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  {provider.hasInheritance && (
                    <div className="mt-3 pt-3 border-t border-emerald-500/20">
                      <div className="flex items-center gap-2 text-sm text-emerald-400">
                        <Shield className="w-4 h-4" />
                        <span className="font-medium">Free Inheritance Protection Included</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

