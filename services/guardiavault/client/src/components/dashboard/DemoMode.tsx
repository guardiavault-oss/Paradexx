import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { TrendingUp, Zap, ArrowRight, PlayCircle } from "lucide-react";

const INITIAL_BALANCE = 1000;
const HOURLY_RATE = 0.14; // $0.14 per hour at 5.2% APY on $1000
const APY = 5.2;

export default function DemoMode() {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalEarned, setTotalEarned] = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Load saved demo state
    const saved = localStorage.getItem("demo_mode_state");
    if (saved) {
      const parsed = JSON.parse(saved);
      setStartTime(parsed.startTime);
      setBalance(parsed.balance);
      setTotalEarned(parsed.totalEarned || 0);
    } else {
      // Start fresh demo
      const now = Date.now();
      setStartTime(now);
      localStorage.setItem(
        "demo_mode_state",
        JSON.stringify({
          startTime: now,
          balance: INITIAL_BALANCE,
          totalEarned: 0,
        })
      );
    }
  }, []);

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const elapsedHours = (Date.now() - startTime) / (1000 * 60 * 60);
      const earned = elapsedHours * HOURLY_RATE;
      const newBalance = INITIAL_BALANCE + earned;

      setBalance(newBalance);
      setTotalEarned(earned);

      // Save state
      localStorage.setItem(
        "demo_mode_state",
        JSON.stringify({
          startTime,
          balance: newBalance,
          totalEarned: earned,
        })
      );
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [startTime]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleActivateReal = () => {
    // Clear demo mode
    localStorage.removeItem("demo_mode_state");
    localStorage.setItem("demo_mode_completed", "true");
    setLocation("/signup");
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
      {/* Demo Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20">
          <PlayCircle className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-yellow-400">Demo Mode</span>
        </div>
        <div className="text-xs text-slate-400">
          Virtual Balance • No Real Funds
        </div>
      </div>

      {/* Balance Display */}
      <div className="text-center mb-8">
        <div className="text-sm text-slate-400 mb-2">Current Balance</div>
        <div className="text-5xl font-bold text-white mb-2">
          {formatCurrency(balance)}
        </div>
        <div className="flex items-center justify-center gap-2 text-emerald-400">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">
            +{formatCurrency(HOURLY_RATE)}/hr at {APY}% APY
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Total Earned</div>
          <div className="text-2xl font-bold text-emerald-400">
            {formatCurrency(totalEarned)}
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">APY</div>
          <div className="text-2xl font-bold text-white">{APY}%</div>
        </div>
      </div>

      {/* Earning Animation */}
      <div className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Earning Rate</span>
          <span className="text-sm font-semibold text-emerald-400">
            Active
          </span>
        </div>
        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse"
            style={{
              width: "100%",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
        </div>
        <div className="text-xs text-slate-500 mt-2 text-center">
          Balance updates every second
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <p className="font-semibold text-white mb-1">Demo Mode Active</p>
            <p>
              You're experiencing GuardiaVault with a virtual $1,000 balance.
              Watch your earnings grow in real-time. Connect your wallet to
              activate real mode.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Button
        size="lg"
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
        onClick={handleActivateReal}
      >
        Activate Real Mode
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  );
}

