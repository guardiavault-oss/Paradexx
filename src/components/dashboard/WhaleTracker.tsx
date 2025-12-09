import { motion } from "motion/react";
import {
  Radar,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
} from "lucide-react";
import { useWhaleData, WhaleAlert } from "../../hooks/useWhaleData";
import { useMemo } from "react";

interface WhaleTrackerProps {
  onClick?: () => void;
}

// Format whale alert for display
function formatAlertForDisplay(alert: WhaleAlert) {
  const wallet = alert.whale?.address 
    ? `${alert.whale.address.slice(0, 6)}...${alert.whale.address.slice(-4)}`
    : alert.whale?.label || 'Unknown';
  
  const action = alert.type.replace(/_/g, ' ');
  const amount = alert.transaction?.valueUsd || '$0';
  const token = alert.transaction?.tokenSymbol || 'ETH';
  const type = alert.signal === 'bullish' ? 'buy' : alert.signal === 'bearish' ? 'sell' : 'neutral';
  
  return { wallet, action, amount, token, type };
}

export default function WhaleTracker({
  onClick,
}: WhaleTrackerProps) {
  const { alerts, stats, loading, refresh } = useWhaleData({
    autoRefresh: true,
    refreshInterval: 30000,
    limit: 10,
  });

  // Transform alerts for display
  const displayAlerts = useMemo(() => {
    if (alerts.length === 0) {
      // Fallback display data when no alerts
      return [
        { wallet: "0x742d...3f4a", action: "large buy", amount: "$450K", token: "ARB", type: "buy" },
        { wallet: "0x8b1c...7e2d", action: "accumulation", amount: "$1.2M", token: "ETH", type: "buy" },
        { wallet: "0x3a9f...1c8b", action: "large sell", amount: "$320K", token: "MATIC", type: "sell" },
      ];
    }
    return alerts.slice(0, 3).map(formatAlertForDisplay);
  }, [alerts]);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border cursor-pointer"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(139, 0, 0, 0.2)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="rounded-lg sm:rounded-xl flex items-center justify-center"
            style={{
              width: "36px",
              height: "36px",
              backgroundColor: "rgba(255, 153, 0, 0.2)",
            }}
          >
            <Radar
              size={18}
              color="#ff9500"
              className="sm:w-6 sm:h-6"
            />
          </div>
          <div>
            <h3 className="text-base sm:text-xl font-black text-white uppercase">
              Whale Tracker
            </h3>
            <p
              className="text-[10px] sm:text-xs"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              Smart money movements
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div
          className="p-3 sm:p-4 rounded-xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            className="text-[10px] sm:text-xs"
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            Tracked Wallets
          </div>
          <div
            className="text-xl sm:text-2xl font-black"
            style={{ color: "#ff9500" }}
          >
            {loading ? '...' : stats.totalTracked || 50}
          </div>
        </div>
        <div
          className="p-3 sm:p-4 rounded-xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            className="text-[10px] sm:text-xs"
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            Alerts Today
          </div>
          <div
            className="text-xl sm:text-2xl font-black"
            style={{ color: "#00ff88" }}
          >
            {loading ? '...' : stats.alertsToday || 0}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-2 sm:space-y-3 mb-4">
        <div
          className="text-[10px] sm:text-xs uppercase tracking-wider"
          style={{
            color: "rgba(255, 255, 255, 0.6)",
            letterSpacing: "0.1em",
            marginBottom: "8px",
          }}
        >
          Recent Alerts
        </div>
        {alerts.map((alert, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-xl flex items-center justify-between"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              border: `1px solid ${alert.type === "buy" ? "#00ff8840" : "#ff336640"}`,
            }}
          >
            <div className="flex items-center gap-3">
              {alert.type === "buy" ? (
                <TrendingUp size={20} color="#00ff88" />
              ) : (
                <TrendingDown size={20} color="#ff3366" />
              )}
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#ffffff",
                  }}
                >
                  <span
                    style={{
                      color:
                        alert.type === "buy"
                          ? "#00ff88"
                          : "#ff3366",
                    }}
                  >
                    {alert.amount}
                  </span>{" "}
                  {alert.token}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  {alert.wallet} {alert.action}
                </div>
              </div>
            </div>
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  alert.type === "buy" ? "#00ff88" : "#ff3366",
                boxShadow: `0 0 10px ${alert.type === "buy" ? "#00ff88" : "#ff3366"}`,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          className="py-3 rounded-xl transition-all"
          style={{
            backgroundColor: "rgba(255, 153, 0, 0.2)",
            border: "1px solid #ff9500",
            color: "#ff9500",
            fontWeight: 700,
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <Activity size={16} />
            Track Wallet
          </div>
        </button>
        <button
          className="py-3 rounded-xl transition-all"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "rgba(255, 255, 255, 0.8)",
            fontWeight: 700,
          }}
        >
          View All
        </button>
      </div>
    </motion.div>
  );
}