import { motion } from "motion/react";
import {
  Crosshair,
  TrendingUp,
  Clock,
  Zap,
  Settings,
  Plus,
} from "lucide-react";
import { useState } from "react";

interface SniperBotProps {
  onClick?: () => void;
}

export default function SniperBotDashboard({
  onClick,
}: SniperBotProps) {
  const [targets, setTargets] = useState([
    { name: "PEPE", buyAmount: 0.5, status: "Armed" },
    { name: "DOGE", buyAmount: 1.0, status: "Watching" },
    { name: "SHIB", buyAmount: 0.3, status: "Ready" },
  ]);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border cursor-pointer"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(220, 20, 60, 0.2)",
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
              backgroundColor: "rgba(255, 51, 102, 0.2)",
            }}
          >
            <Crosshair
              size={18}
              color="#ff3366"
              className="sm:w-6 sm:h-6"
            />
          </div>
          <div>
            <h3 className="text-base sm:text-xl font-black text-white uppercase">
              Sniper Bot
            </h3>
            <p
              className="text-[10px] sm:text-xs"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              First-block token buys
            </p>
          </div>
        </div>
        <button
          className="p-2 rounded-xl transition-all hover:bg-white/10"
          style={{
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Settings
            size={16}
            color="rgba(255, 255, 255, 0.6)"
            className="sm:w-5 sm:h-5"
          />
        </button>
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
            Active Snipes
          </div>
          <div
            className="text-xl sm:text-2xl font-black"
            style={{ color: "#ff3366" }}
          >
            7
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
            Success Rate
          </div>
          <div
            className="text-xl sm:text-2xl font-black"
            style={{ color: "#00ff88" }}
          >
            78%
          </div>
        </div>
      </div>

      {/* Target List */}
      <div className="space-y-3 mb-4">
        {targets.map((target, index) => (
          <div
            key={index}
            className="p-4 rounded-xl flex items-center justify-between"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    target.status === "Armed"
                      ? "#ff3366"
                      : target.status === "Ready"
                        ? "#00ff88"
                        : "#ffcc00",
                  boxShadow: `0 0 10px ${
                    target.status === "Armed"
                      ? "#ff3366"
                      : target.status === "Ready"
                        ? "#00ff88"
                        : "#ffcc00"
                  }`,
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#ffffff",
                  }}
                >
                  {target.name}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  {target.buyAmount} ETH
                </div>
              </div>
            </div>
            <div
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor:
                  target.status === "Armed"
                    ? "rgba(255, 51, 102, 0.2)"
                    : target.status === "Ready"
                      ? "rgba(0, 255, 136, 0.2)"
                      : "rgba(255, 204, 0, 0.2)",
                fontSize: "11px",
                fontWeight: 700,
                color:
                  target.status === "Armed"
                    ? "#ff3366"
                    : target.status === "Ready"
                      ? "#00ff88"
                      : "#ffcc00",
                textTransform: "uppercase",
              }}
            >
              {target.status}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          className="py-3 rounded-xl transition-all"
          style={{
            backgroundColor: "rgba(255, 51, 102, 0.2)",
            border: "1px solid #ff3366",
            color: "#ff3366",
            fontWeight: 700,
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <Plus size={16} />
            Add Target
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
          Configure
        </button>
      </div>
    </motion.div>
  );
}