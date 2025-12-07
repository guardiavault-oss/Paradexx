import { Shield, DollarSign, Users, Lock } from "lucide-react";
import { motion } from "motion/react";

interface RegenHubProps {
  securityScore: number;
  monthlyYield: number;
  averageAPY: number;
}

export default function RegenHub({
  securityScore,
  monthlyYield,
  averageAPY,
}: RegenHubProps) {
  const primaryColor = "#0080FF";
  const secondaryColor = "#000080";

  const stats = [
    {
      label: "MEV Shield",
      value: "Active",
      color: primaryColor,
    },
    {
      label: "DeFi positions",
      value: "4",
      color: secondaryColor,
    },
    { label: "Guardians", value: "2", color: primaryColor },
    {
      label: "Legacy vault",
      value: "1",
      color: secondaryColor,
    },
  ];

  return (
    <div
      className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border"
      style={{
        background: `linear-gradient(135deg, rgba(0, 128, 255, 0.1), rgba(0, 0, 128, 0.05))`,
        backdropFilter: "blur(20px)",
        borderColor: `rgba(0, 128, 255, 0.3)`,
        boxShadow: `0 0 40px rgba(0, 128, 255, 0.1)`,
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
                "linear-gradient(135deg, #00d4ff, #00ff88)",
              boxShadow: "0 0 20px rgba(0, 212, 255, 0.5)",
            }}
          >
            <Shield
              size={20}
              color="#ffffff"
              className="sm:w-7 sm:h-7"
            />
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white uppercase">
              Growth Hub
            </h2>
            <p
              className="text-xs sm:text-sm"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              Secure wealth building
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
        {/* Security Score */}
        <div
          className="p-4 sm:p-6 rounded-xl sm:rounded-2xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(0, 212, 255, 0.3)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield
              size={16}
              color="#00d4ff"
              className="sm:w-5 sm:h-5"
            />
            <span
              className="text-[10px] sm:text-xs uppercase tracking-wider"
              style={{
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              Security Score
            </span>
          </div>
          <div
            className="text-3xl sm:text-4xl md:text-5xl font-black leading-none"
            style={{
              color: "#00d4ff",
            }}
          >
            {securityScore}
            <span
              className="text-base sm:text-xl md:text-2xl"
              style={{ color: "rgba(255, 255, 255, 0.4)" }}
            >
              /100
            </span>
          </div>
        </div>

        {/* Total Yield */}
        <div
          className="p-4 sm:p-6 rounded-xl sm:rounded-2xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(0, 255, 136, 0.3)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign
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
              Total Yield
            </span>
          </div>
          <div
            className="text-2xl sm:text-3xl font-black leading-none"
            style={{
              color: "#00ff88",
            }}
          >
            ${monthlyYield}
            <span
              className="text-sm sm:text-base"
              style={{ color: "rgba(255, 255, 255, 0.4)" }}
            >
              /mo
            </span>
          </div>
        </div>

        {/* Average APY */}
        <div
          className="p-4 sm:p-6 rounded-xl sm:rounded-2xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(0, 212, 255, 0.3)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lock
              size={16}
              color="#00d4ff"
              className="sm:w-5 sm:h-5"
            />
            <span
              className="text-[10px] sm:text-xs uppercase tracking-wider"
              style={{
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              Average APY
            </span>
          </div>
          <div
            className="text-3xl sm:text-4xl md:text-5xl font-black leading-none"
            style={{
              color: "#00d4ff",
            }}
          >
            {averageAPY}
            <span
              className="text-base sm:text-xl md:text-2xl"
              style={{ color: "rgba(255, 255, 255, 0.4)" }}
            >
              %
            </span>
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
              className="text-base sm:text-lg md:text-xl font-black mb-1"
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