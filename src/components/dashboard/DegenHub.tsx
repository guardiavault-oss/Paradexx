import {
  Crosshair,
  TrendingUp,
  Flame,
  Target,
  Zap,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";

interface DegenHubProps {
  degenScore: number;
  dailyPnL: number;
}

export default function DegenHub({
  degenScore,
  dailyPnL,
}: DegenHubProps) {
  const primaryColor = "#DC143C";
  const secondaryColor = "#8B0000";

  const stats = [
    { label: "Active snipes", value: "7", color: primaryColor },
    {
      label: "Whale alerts",
      value: "3",
      color: secondaryColor,
    },
    { label: "Hot memes", value: "12", color: "#DC143C" },
    { label: "Limit orders", value: "5", color: "#8B0000" },
  ];

  return (
    <div
      className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border"
      style={{
        background: `linear-gradient(135deg, rgba(220, 20, 60, 0.1), rgba(139, 0, 0, 0.05))`,
        backdropFilter: "blur(20px)",
        borderColor: `rgba(220, 20, 60, 0.3)`,
        boxShadow: `0 0 40px rgba(220, 20, 60, 0.1)`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="rounded-xl sm:rounded-2xl flex items-center justify-center"
            style={{
              width: "40px",
              height: "40px",
              background:
                "linear-gradient(135deg, #ff3366, #ff6b6b)",
              boxShadow: "0 0 20px rgba(255, 51, 102, 0.5)",
            }}
          >
            <Crosshair
              size={20}
              color="#ffffff"
              className="sm:w-7 sm:h-7"
            />
          </div>
          <div>
            <h2 className="text-base sm:text-xl md:text-2xl font-black text-white uppercase leading-tight">
              <span className="hidden sm:inline">Degen </span>
              Command
              <span className="hidden sm:inline"> Center</span>
            </h2>
            <p
              className="text-xs sm:text-sm hidden sm:block"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              High-risk, high-reward trading tools
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
        {/* Degen Score */}
        <div
          className="p-4 sm:p-6 rounded-xl sm:rounded-2xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 51, 102, 0.3)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Flame
              size={16}
              color="#ff3366"
              className="sm:w-5 sm:h-5"
            />
            <span
              className="text-[10px] sm:text-xs uppercase tracking-wider"
              style={{
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              Degen Score
            </span>
          </div>
          <div
            className="text-3xl sm:text-4xl md:text-5xl font-black leading-none"
            style={{
              color: "#ff3366",
            }}
          >
            {degenScore}
            <span
              className="text-base sm:text-xl md:text-2xl"
              style={{ color: "rgba(255, 255, 255, 0.4)" }}
            >
              /1000
            </span>
          </div>
        </div>

        {/* Today's P&L */}
        <div
          className="p-4 sm:p-6 rounded-xl sm:rounded-2xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(0, 255, 136, 0.3)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp
              size={16}
              color="#00ff88"
              className="sm:w-5 sm:h-5"
            />
            <span
              className="text-[10px] sm:text-xs uppercase tracking-wider"
              style={{
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              Today's P&L
            </span>
          </div>
          <div
            className="text-3xl sm:text-4xl md:text-5xl font-black leading-none"
            style={{
              color: dailyPnL >= 0 ? "#00ff88" : "#ff3366",
            }}
          >
            {dailyPnL >= 0 ? "+" : ""}$
            {Math.abs(dailyPnL).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            className="p-3 sm:p-4 rounded-xl text-center"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              border: `1px solid ${stat.color}40`,
            }}
          >
            <div
              className="text-lg sm:text-2xl md:text-3xl font-black mb-1"
              style={{
                color: stat.color,
              }}
            >
              {stat.value}
            </div>
            <div
              className="text-[9px] sm:text-[11px] uppercase tracking-wider"
              style={{
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}