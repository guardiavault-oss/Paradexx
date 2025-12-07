import { useState, useEffect } from "react";
import { Activity, Users, TrendingUp, DollarSign, Server, Shield } from "lucide-react";
import { logError } from "@/utils/logger";

interface SystemHealth {
  database: { status: string; responseTime: number | null };
  protocols: Array<{
    protocol: string;
    status: string;
    apy: number | null;
  }>;
  api: {
    status: string;
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
    };
  };
}

interface PlatformStats {
  users: { total: number; active: number };
  vaults: { total: number; active: number };
  yield: {
    totalDeposits: string;
    totalYield: string;
    avgAPY: string;
  };
  referrals: { total: number; completed: number };
}

export default function AdminDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadAdminData = async () => {
    try {
      const [healthRes, statsRes] = await Promise.all([
        fetch("/api/admin/health", { credentials: "include" }),
        fetch("/api/admin/stats", { credentials: "include" }),
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData.data);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "AdminDashboard_loadData",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatBytes = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
        <div className="text-center text-slate-400">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health */}
      {health && (
        <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">System Health</h3>
              <p className="text-sm text-slate-400">Real-time system status</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Database</span>
              </div>
              <div
                className={`text-lg font-semibold ${
                  health.database.status === "healthy"
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {health.database.status}
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">API</span>
              </div>
              <div className="text-lg font-semibold text-emerald-400">
                {health.api.status}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Uptime: {(health.api.uptime / 3600).toFixed(1)}h
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Memory</span>
              </div>
              <div className="text-lg font-semibold text-white">
                {formatBytes(health.api.memoryUsage.heapUsed)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Total: {formatBytes(health.api.memoryUsage.heapTotal)}
              </div>
            </div>
          </div>

          {/* Protocol Health */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Protocol Status</h4>
            {health.protocols.map((protocol) => (
              <div
                key={protocol.protocol}
                className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50"
              >
                <div>
                  <span className="text-white font-semibold capitalize">
                    {protocol.protocol}
                  </span>
                  {protocol.apy && (
                    <span className="text-sm text-emerald-400 ml-2">
                      {protocol.apy.toFixed(2)}% APY
                    </span>
                  )}
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    protocol.status === "healthy"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : protocol.status === "degraded"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {protocol.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platform Stats */}
      {stats && (
        <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Platform Statistics</h3>
              <p className="text-sm text-slate-400">Overall platform metrics</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Users</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.users.total}</div>
              <div className="text-xs text-slate-500 mt-1">
                {stats.users.active} active
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Vaults</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.vaults.total}</div>
              <div className="text-xs text-slate-500 mt-1">
                {stats.vaults.active} active
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Total Deposits</span>
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {formatCurrency(stats.yield.totalDeposits)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {parseFloat(stats.yield.avgAPY).toFixed(2)}% avg APY
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Total Yield</span>
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {formatCurrency(stats.yield.totalYield)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {stats.referrals.completed} referrals
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

