import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  DollarSign,
  Percent,
  Clock,
  Loader2,
} from "lucide-react";
import { API_URL } from "../../config/api";
import { useDashboard } from "../../hooks/useDashboard";

interface DeFiDashboardProps {
  type: "degen" | "regen";
  onClose: () => void;
}

interface DeFiPosition {
  protocol: string;
  type: string;
  asset: string;
  amount: number;
  apy: number;
  earned?: number;
  logo?: string;
}

export function DeFiDashboard({
  type,
  onClose,
}: DeFiDashboardProps) {
  const isDegen = type === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";
  
  const walletAddress = localStorage.getItem('walletAddress') || undefined;
  const { positions: activePositions, loading } = useDashboard(walletAddress);
  
  const [stats, setStats] = useState({
    totalDeployed: 0,
    totalEarned: 0,
    avgAPY: 0,
    activeDays: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch DeFi stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      if (!walletAddress) {
        setLoadingStats(false);
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/api/defi/stats?address=${walletAddress}`, { headers });
        
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalDeployed: data.totalDeployed || data.total_deployed || 0,
            totalEarned: data.totalEarned || data.total_earned || 0,
            avgAPY: data.avgAPY || data.avg_apy || 0,
            activeDays: data.activeDays || data.active_days || 0,
          });
        } else {
          // Calculate from positions if stats endpoint not available
          if (activePositions.length > 0) {
            const totalDeployed = activePositions.reduce((sum, p) => sum + (p.amount || 0), 0);
            const totalEarned = activePositions.reduce((sum, p) => sum + ((p.earned || 0) || (p.amount * (p.apy || 0) / 100 / 365 * 30)), 0);
            const avgAPY = activePositions.reduce((sum, p) => sum + (p.apy || 0), 0) / activePositions.length;
            
            setStats({
              totalDeployed,
              totalEarned,
              avgAPY: avgAPY || 0,
              activeDays: 0, // Would need to track this separately
            });
          }
        }
      } catch (error) {
        console.error('Error fetching DeFi stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [walletAddress, activePositions]);

  // Transform positions to match component format
  const positions: DeFiPosition[] = activePositions.map((pos) => ({
    protocol: pos.protocol || 'Unknown',
    type: pos.type || 'lending',
    asset: pos.asset || 'Unknown',
    amount: pos.amount || 0,
    apy: pos.apy || 0,
    earned: pos.earned || (pos.amount * (pos.apy || 0) / 100 / 365 * 30), // Estimate monthly
    logo: getProtocolLogo(pos.protocol || ''),
  }));

  const statsDisplay = [
    {
      label: "Total Deployed",
      value: `$${stats.totalDeployed.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
    },
    {
      label: "Total Earned",
      value: `$${stats.totalEarned.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
    },
    { 
      label: "Avg APY", 
      value: `${stats.avgAPY.toFixed(1)}%`, 
      icon: Percent 
    },
    { 
      label: "Active Days", 
      value: stats.activeDays.toString(), 
      icon: Clock 
    },
  ];

  function getProtocolLogo(protocol: string): string {
    const logos: Record<string, string> = {
      'aave': '🏦',
      'compound': '🏛️',
      'uniswap': '🦄',
      'curve': '📈',
      'yearn': '💰',
      'lido': '🌊',
    };
    return logos[protocol.toLowerCase()] || '💎';
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black text-white pb-24 md:pb-20"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 max-w-7xl mx-auto">
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
              <BarChart3
                className="w-6 h-6"
                style={{ color: accentColor }}
              />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-black uppercase">
                DeFi Dashboard
              </h1>
              <p className="text-xs md:text-sm text-white/50">
                Monitor your positions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <stat.icon className="w-5 h-5 text-white/40 mb-2" />
              <div className="text-2xl font-black text-white mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-white/60 uppercase tracking-wide">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Portfolio Breakdown */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-base font-black uppercase mb-4">
            Portfolio Breakdown
          </h3>
          <div className="space-y-3">
            {[
              { label: "Lending", value: 50, amount: "$8,200" },
              {
                label: "Liquidity Pools",
                value: 35,
                amount: "$5,845",
              },
              { label: "Staking", value: 15, amount: "$2,655" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-white/80">
                    {item.label}
                  </span>
                  <span className="font-bold text-white">
                    {item.amount}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{
                      delay: i * 0.1,
                      duration: 0.8,
                    }}
                    className="h-full rounded-full"
                    style={{ background: accentColor }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Positions */}
        <div>
          <h3 className="text-base font-black uppercase mb-4">
            Active Positions
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-white/40" />
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              <p>No active DeFi positions found</p>
              <p className="text-sm mt-2">Start earning yield by depositing into DeFi protocols</p>
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((pos, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{pos.logo}</div>
                      <div>
                        <div className="text-base font-bold text-white">
                          {pos.protocol}
                        </div>
                        <div className="text-sm text-white/60">
                          {pos.type} • {pos.token}
                        </div>
                      </div>
                    </div>
                    <div
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{
                        background: "rgba(34, 197, 94, 0.2)",
                        color: "#22c55e",
                      }}
                    >
                      {pos.apy}% APY
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                    <div>
                      <div className="text-xs text-white/40 mb-1">
                        Deposited
                      </div>
                      <div className="text-base font-bold text-white">
                        ${pos.amount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40 mb-1">
                        Earned
                      </div>
                      <div className="text-base font-bold text-green-400">
                        +${pos.earned.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Best Opportunities */}
        <div
          className="p-4 rounded-xl"
          style={{
            background: `${accentColor}10`,
            border: `1px solid ${accentColor}30`,
          }}
        >
          <div className="flex items-start gap-3">
            <TrendingUp
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: accentColor }}
            />
            <div>
              <div
                className="text-sm font-bold mb-1"
                style={{ color: accentColor }}
              >
                Best Yield Opportunity
              </div>
              <p className="text-xs text-white/60 mb-2">
                Curve Finance offering 18.5% APY on stETH/ETH
                pool
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: accentColor }}
              >
                View Details
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}