import {
  AlertTriangle,
  Snowflake,
  XCircle,
  AlertCircle,
  MapPin,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";

interface EmergencyProtectionProps {
  type: "degen" | "regen";
}

export default function EmergencyProtection({
  type,
}: EmergencyProtectionProps) {
  const [isPanicMode, setIsPanicMode] = useState(false);
  const isDegen = type === "degen";
  const primaryColor = isDegen ? "#DC143C" : "#0080FF";
  const secondaryColor = isDegen ? "#8B0000" : "#000080";

  const quickActions = [
    {
      icon: Snowflake,
      label: "Freeze",
      desc: "Lock wallet instantly",
    },
    {
      icon: XCircle,
      label: "Revoke",
      desc: "Revoke all approvals",
    },
    {
      icon: AlertCircle,
      label: "Alert",
      desc: "Notify guardians",
    },
    {
      icon: MapPin,
      label: "Geo-fence",
      desc: "Location security",
    },
    {
      icon: RotateCcw,
      label: "Auto-recovery",
      desc: "Auto triggers",
    },
  ];

  return (
    <div
      className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(20px)",
        borderColor: isPanicMode
          ? "#ff3366"
          : "rgba(255, 255, 255, 0.1)",
        boxShadow: isPanicMode
          ? "0 0 40px rgba(255, 51, 102, 0.3)"
          : "none",
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <h3 className="text-base sm:text-xl font-black text-white uppercase">
          Emergency Protection
        </h3>
        {isPanicMode && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="px-3 py-1 rounded-full"
            style={{
              backgroundColor: "rgba(255, 51, 102, 0.2)",
              border: "1px solid #ff3366",
            }}
          >
            <span
              className="text-[10px] sm:text-xs font-bold"
              style={{ color: "#ff3366" }}
            >
              PANIC MODE ACTIVE
            </span>
          </motion.div>
        )}
      </div>

      {/* Panic Mode Button */}
      <button
        onClick={() => setIsPanicMode(!isPanicMode)}
        className="w-full p-4 sm:p-6 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 transition-all"
        style={{
          background: isPanicMode
            ? "linear-gradient(135deg, #ff3366, #ff6b6b)"
            : `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
          border: `2px solid ${isPanicMode ? "#ff3366" : primaryColor}`,
          boxShadow: isPanicMode
            ? "0 0 30px rgba(255, 51, 102, 0.4)"
            : "none",
        }}
      >
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <AlertTriangle
            size={20}
            color={isPanicMode ? "#ffffff" : primaryColor}
            className="sm:w-7 sm:h-7"
          />
          <span
            className="text-sm sm:text-xl font-black uppercase"
            style={{
              color: isPanicMode ? "#ffffff" : primaryColor,
            }}
          >
            {isPanicMode
              ? "Deactivate Panic"
              : "Activate Panic"}
            <span className="hidden sm:inline"> Mode</span>
          </span>
        </div>
      </button>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className="p-3 sm:p-4 rounded-xl border transition-all hover:border-opacity-100"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              borderColor: "rgba(255, 255, 255, 0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = primaryColor;
              e.currentTarget.style.boxShadow = `0 0 20px ${primaryColor}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor =
                "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div className="flex flex-col items-center text-center">
              <action.icon
                size={20}
                color={primaryColor}
                className="mb-2 sm:w-6 sm:h-6"
              />
              <div className="text-xs sm:text-sm font-bold text-white">
                {action.label}
              </div>
              <div
                className="text-[10px] sm:text-xs"
                style={{ color: "rgba(255, 255, 255, 0.6)" }}
              >
                {action.desc}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}